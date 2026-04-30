"""
╔══════════════════════════════════════════════════════════════════════╗
║      BigQuery Chart Engine  —  v15  (Vega-Altair renderers)         ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  GROUP KEY:  (report_name, email_id)                                 ║
║    One HTML file per unique combination.                             ║
║    ALL chart {{PLACEHOLDER}} tokens are rendered and replaced        ║
║    in the single html_template per (report × email_id) pair.         ║
║                                                                      ║
║  HTML OWNERSHIP:                                                     ║
║    The engine does NOT generate or wrap any HTML.                    ║
║    email_list.html_template is the complete document —               ║
║    DOCTYPE, head, styles, body, header, footer all live there.       ║
║    The engine only replaces {{PLACEHOLDER}} tokens with              ║
║    <img> tags containing base64-encoded chart PNGs.                  ║
║                                                                      ║
║  SCHEMA:                                                             ║
║    email_list   — one row per dispatch                               ║
║      email_id · report_name · recipient_email · subject              ║
║      html_template  (full HTML document with {{PLACEHOLDERS}})       ║
║                                                                      ║
║    chart_config_view — one row per chart (scoped by report_name)     ║
║      report_name · sort_position · variable_name · chart_type        ║
║      bq_table · filters · x_column · y_columns                      ║
║      title · subtitle · color_theme · show_values · sort_order       ║
║      width_px · height_px · ref_line_value · x_label · y_label       ║
║      dark_mode · hue_column                                          ║
║      (bq_table always contains full project.dataset.table path)      ║
║                                                                      ║
║  ENGINE JOIN:                                                        ║
║    SELECT el.*, cc.*                                                 ║
║    FROM   email_list el                                              ║
║    JOIN   chart_config_view cc  USING (report_name)                  ║
║    ORDER  BY el.report_name, el.email_id, cc.sort_position           ║
║                                                                      ║
║  VARIABLE RESOLUTION ORDER (lowest → highest priority):              ║
║    1. Built-in tokens:                                               ║
║       Day  : {today} {yesterday} {tomorrow}                          ║
║              {this_day} {this_weekday} {this_weekday_short}          ║
║       Week : {this_week} {last_week}                                 ║
║       Month: {this_month} {this_month_num} {this_month_name}         ║
║              {this_month_short} {last_month} {last_month_num}        ║
║              {last_month_name} {last_month_short} {next_month}       ║
║       Qtr  : {this_quarter} {last_quarter} {next_quarter}            ║
║              {this_quarter_year} {last_quarter_year}                 ║
║              {next_quarter_year}                                     ║
║       Half : {this_half} {last_half}                                 ║
║              {this_half_year} {last_half_year}                       ║
║       Year : {this_year} {this_year_short} {last_year}               ║
║              {last_year_short} {next_year}                           ║
║       Misc : {env}                                                   ║
║    2. TABLE_VARS        (set in the CONFIG block below)              ║
║    3. email_id          (from email_list — per-dispatch identifier)  ║
║                                                                      ║
║  CHART TYPES (8 Vega-Altair):                                        ║
║    line_altair · bar_altair · scatter_altair · heatmap_altair        ║
║    area_altair · strip_altair · boxplot_altair · arc_altair          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import io, os, re, json, base64, warnings
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from typing import Optional

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image
import altair as alt
import vl_convert as vlc


# ══════════════════════════════════════════════════════════════════════
# ▶  CONFIG
# ══════════════════════════════════════════════════════════════════════

SERVICE_ACCOUNT_KEY_FILE = "service_account_key.json"
PROJECT_ID               = "your-gcp-project-id"

EMAIL_LIST_TABLE         = "your_project.your_dataset.email_list"
CHART_CONFIG_VIEW     = "your_project.your_dataset.chart_config_view"
EMAIL_OUTPUT_TABLE       = "your_project.your_dataset.email_output"

WRITE_MODE               = "APPEND"      # APPEND | TRUNCATE
OUTPUT_DIR               = "output_emails"
MAX_WORKERS              = 4             # parallel chart rendering threads

# ── Data source flag ──────────────────────────────────────────────────
# True  → use built-in synthetic mock data  (no BQ credentials needed)
# False → query live BigQuery tables
USE_MOCK                 = True

# ══════════════════════════════════════════════════════════════════════
# ▶  GLOBAL TABLE VARIABLE SUBSTITUTION
#    These are merged into every email's variable context.
#    email_id from email_list is merged on top per dispatch.
# ══════════════════════════════════════════════════════════════════════

TABLE_VARS: dict = {
    # "env":     "prod",
    # "region":  "APAC",
}


# ══════════════════════════════════════════════════════════════════════
# 0.  TABLE VARIABLE RESOLVER
# ══════════════════════════════════════════════════════════════════════

def _quarter(month: int) -> str:
    return f"Q{(month - 1) // 3 + 1}"

def _prev_quarter(year: int, month: int) -> tuple:
    q = (month - 1) // 3 + 1
    if q == 1:
        return year - 1, "Q4"
    return year, f"Q{q - 1}"

def _build_runtime_vars() -> dict:
    """
    Build the base variable context shared by all emails in a run.
    Layering order (lowest → highest priority):
      built-in date/env tokens  →  TABLE_VARS
    Per-email email_id is merged on top of this in process_emails().
    """
    now        = datetime.now(timezone.utc)
    y, m       = now.year, now.month
    today_str  = now.strftime("%Y-%m-%d")

    yesterday  = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    tomorrow   = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    lm_year, lm_month = (y - 1, 12) if m == 1 else (y, m - 1)
    nm_year, nm_month = (y + 1,  1) if m == 12 else (y, m + 1)

    tq          = _quarter(m)
    lq_year, lq = _prev_quarter(y, m)
    # next quarter
    nq_m        = {1:4, 2:4, 3:4, 4:7, 5:7, 6:7, 7:10, 8:10, 9:10, 10:1, 11:1, 12:1}[m]
    nq_year     = y + 1 if m >= 10 else y
    nq          = _quarter(nq_m)

    # half-year
    this_half   = "H1" if m <= 6 else "H2"
    last_half   = "H2" if m <= 6 else "H1"
    last_half_year = (y - 1) if m <= 6 else y

    # ISO week
    iso_week    = now.isocalendar()[1]
    last_week_dt = now - timedelta(weeks=1)
    last_iso_week = last_week_dt.isocalendar()[1]

    auto: dict = {
        # ── day ────────────────────────────────────────────────────────
        "today":              today_str,
        "yesterday":          yesterday,
        "tomorrow":           tomorrow,
        "this_day":           now.strftime("%d"),
        "this_weekday":       now.strftime("%A"),
        "this_weekday_short": now.strftime("%a"),
        # ── week ───────────────────────────────────────────────────────
        "this_week":          f"W{iso_week:02d}",
        "last_week":          f"W{last_iso_week:02d}",
        # ── month ──────────────────────────────────────────────────────
        "this_month":         now.strftime("%Y-%m"),
        "this_month_num":     now.strftime("%m"),
        "this_month_name":    now.strftime("%B"),
        "this_month_short":   now.strftime("%b"),
        "last_month":         f"{lm_year}-{lm_month:02d}",
        "last_month_num":     f"{lm_month:02d}",
        "last_month_name":    datetime(lm_year, lm_month, 1).strftime("%B"),
        "last_month_short":   datetime(lm_year, lm_month, 1).strftime("%b"),
        "next_month":         f"{nm_year}-{nm_month:02d}",
        # ── quarter ────────────────────────────────────────────────────
        "this_quarter":       tq,
        "last_quarter":       lq,
        "next_quarter":       nq,
        "this_quarter_year":  f"{tq}-{y}",
        "last_quarter_year":  f"{lq}-{lq_year}",
        "next_quarter_year":  f"{nq}-{nq_year}",
        # ── half-year ──────────────────────────────────────────────────
        "this_half":          this_half,
        "last_half":          last_half,
        "this_half_year":     f"{this_half}-{y}",
        "last_half_year":     f"{last_half}-{last_half_year}",
        # ── year ───────────────────────────────────────────────────────
        "this_year":          str(y),
        "this_year_short":    now.strftime("%y"),
        "last_year":          str(y - 1),
        "last_year_short":    str(y - 1)[-2:],
        "next_year":          str(y + 1),
        # ── misc ───────────────────────────────────────────────────────
        "env":                "prod",
    }
    # TABLE_VARS override auto
    return {**auto, **TABLE_VARS}


def resolve(text: str, runtime_vars: dict | None = None) -> str:
    """
    Replace every {key} token in text with the matching variable value.

    • Unknown keys are left unchanged.
    • One level of nested resolution supported.
    • Case-insensitive key lookup.
    """
    if not text or "{" not in text:
        return text

    if runtime_vars is None:
        runtime_vars = _build_runtime_vars()

    _lower_map: dict | None = None  # built lazily on first case-insensitive miss

    def _replacer(match: re.Match) -> str:
        nonlocal _lower_map
        key = match.group(1).strip()
        val = runtime_vars.get(key)
        if val is None:
            if _lower_map is None:
                _lower_map = {k.lower(): v for k, v in runtime_vars.items()}
            val = _lower_map.get(key.lower())
        if val is None:
            return match.group(0)
        return resolve(str(val), runtime_vars)

    return re.sub(r"\{([^}]+)\}", _replacer, text)


def resolve_cfg(cfg: dict, runtime_vars: dict | None = None) -> dict:
    """
    Apply variable substitution to all string fields of a config dict.

    Pass the per-email variable context (runtime_vars + email_id)
    as runtime_vars so that filters are resolved per-dispatch.
    Returns a new dict — original is not mutated.
    """
    if runtime_vars is None:
        runtime_vars = _build_runtime_vars()

    STRING_FIELDS = (
        "report_name", "bq_table", "filters", "x_column", "title", "subtitle",
        "ref_line_value", "ref_line_label", "x_label", "y_label",
    )
    out = dict(cfg)
    for field in STRING_FIELDS:
        if field in out and isinstance(out[field], str):
            out[field] = resolve(out[field], runtime_vars)
    out["y_columns"] = [resolve(c, runtime_vars) for c in cfg.get("y_columns", [])]
    return out


# ══════════════════════════════════════════════════════════════════════
# 1.  BIGQUERY CLIENT  (live only — no mock)
# ══════════════════════════════════════════════════════════════════════

class BigQueryClient:
    """
    Service Account auth. Handles READ (query) and WRITE (insert).

    IAM roles needed:
      - roles/bigquery.dataViewer
      - roles/bigquery.dataEditor   (for email_output writes)
      - roles/bigquery.jobUser

    Set SERVICE_ACCOUNT_KEY_FILE to your downloaded JSON key path.
    GCP Console → IAM & Admin → Service Accounts → Keys → Add Key → JSON.
    """

    def __init__(self):
        key_path = SERVICE_ACCOUNT_KEY_FILE
        if not os.path.isfile(key_path):
            raise FileNotFoundError(
                f"Service account key not found: '{key_path}'\n"
                "GCP Console → IAM & Admin → Service Accounts → Keys → Add Key → JSON.\n"
                f"Save the downloaded JSON as '{key_path}' next to this script."
            )
        from google.oauth2 import service_account
        from google.cloud import bigquery
        creds = service_account.Credentials.from_service_account_file(
            key_path, scopes=["https://www.googleapis.com/auth/bigquery"]
        )
        self.client = bigquery.Client(project=PROJECT_ID, credentials=creds)
        with open(key_path) as f:
            m = json.load(f)
        print(f"  [AUTH] {m.get('client_email', '?')}  /  {m.get('project_id', '?')}")

    def query(self, sql: str) -> pd.DataFrame:
        return self.client.query(sql).to_dataframe()

    def insert_rows(self, table_id: str, rows: list, write_mode: str = "APPEND"):
        from google.cloud import bigquery
        _FIELD = bigquery.SchemaField
        schema = [
            _FIELD("email_id",         "STRING"),
            _FIELD("report_name",      "STRING"),
            _FIELD("recipient_email",  "STRING"),
            _FIELD("subject",          "STRING"),
            _FIELD("final_html",       "STRING"),
            _FIELD("charts_injected",  "INTEGER"),
            _FIELD("total_charts",     "INTEGER"),
            _FIELD("status",           "STRING"),
            _FIELD("error_message",    "STRING"),
            _FIELD("processed_at",     "TIMESTAMP"),
        ]
        disp = {
            "APPEND":   bigquery.WriteDisposition.WRITE_APPEND,
            "TRUNCATE": bigquery.WriteDisposition.WRITE_TRUNCATE,
        }.get(write_mode.upper(), bigquery.WriteDisposition.WRITE_APPEND)
        cfg = bigquery.LoadJobConfig(schema=schema, write_disposition=disp)
        job = self.client.load_table_from_dataframe(
            pd.DataFrame(rows), table_id, job_config=cfg
        )
        job.result()
        print(f"  [BQ WRITE] {len(rows)} row(s) → {table_id}  ({write_mode})")


# ══════════════════════════════════════════════════════════════════════
# 2.  SQL BUILDER
# ══════════════════════════════════════════════════════════════════════

def build_select(cfg: dict) -> str:
    """
    Build the SELECT … FROM … WHERE … query for a single chart.
    cfg.filters has already been resolved against the per-email
    variable context by the time this is called.
    """
    y_cols   = cfg["y_columns"][:]
    all_cols = [cfg["x_column"]] + y_cols
    uniq = list(dict.fromkeys(all_cols))  # deduplicate preserving order
    sql = f"SELECT {', '.join(uniq)}\nFROM   `{cfg['bq_table']}`"
    f   = cfg.get("filters", "").strip()
    if f:
        sql += f"\nWHERE  {f}"
    return sql


# ══════════════════════════════════════════════════════════════════════
# 3.  CONFIG PARSER
# ══════════════════════════════════════════════════════════════════════

def parse_config(row: dict) -> dict:
    y = [c.strip() for c in str(row.get("y_columns", "")).split(",") if c.strip()]
    return {
        "report_name":    str(row.get("report_name", "")).strip(),
        "variable_name":  str(row.get("variable_name", "")).strip(),
        "sort_position":  int(row.get("sort_position", 0)),
        "chart_type":     str(row.get("chart_type", "bar")).lower().strip(),
        "bq_table":       str(row.get("bq_table", "")).strip(),
        "filters":        str(row.get("filters", "")).strip(),
        "x_column":       str(row.get("x_column", "")).strip(),
        "y_columns":      y,
        "legend":         str(row.get("legend", "yes")).lower() == "yes",
        "title":          str(row.get("title", "")).strip(),
        "subtitle":       str(row.get("subtitle", "")).strip(),
        "color_theme":    str(row.get("color_theme", "default")).lower().strip(),
        "show_values":    str(row.get("show_values", "no")).lower() == "yes",
        "sort_order":     str(row.get("sort_order", "none")).lower().strip(),
        "width_px":       int(row.get("width_px", 600)),
        "height_px":      int(row.get("height_px", 320)),
        "ref_line_value": str(row.get("ref_line_value", "")).strip(),
        "ref_line_label": str(row.get("ref_line_label", "")).strip(),
        "x_label":        str(row.get("x_label", "")).strip(),
        "y_label":        str(row.get("y_label", "")).strip(),
        "dark_mode":      str(row.get("dark_mode", "no")).lower() == "yes",
        # ── Seaborn-specific columns (used by all chart renderers) ────────
        "hue_column":     str(row.get("hue_column", "")).strip(),
        "seaborn_style":  str(row.get("seaborn_style", "whitegrid")).strip(),
    }


# ══════════════════════════════════════════════════════════════════════
# 4.  DESIGN SYSTEM  —  Qlik Sense / Power BI Hybrid
#
#  Principles (from Qlik Sense style guide):
#    • Flat UI — no gradients, no shadows, no 3-D effects
#    • Tickless axes — grid lines guide the eye; tick marks are noise
#    • Thin hairline grid — GridAlpha ≈ 0.25, 0.4 px weight
#    • Segoe UI Semilight weight feel via DejaVu Sans at reduced sizes
#    • Top-heavy header: bold TITLE, breadcrumb subtitle, horizontal
#      legend — all aligned to the top of the figure
#    • "Qlik 5% margin" — content never touches the frame edge
#    • Direct labelling when ≤ 8 data points (no legend needed)
#    • Palette: Qlik Slate + Breeze + High-Viz mapped to our themes
# ══════════════════════════════════════════════════════════════════════

# ── Typography ─────────────────────────────────────────────────
# Explicit fallback chain — matplotlib walks until it finds one.
# User machines (Outlook clients, browsers) will have Arial/Segoe UI;
# Linux build servers fall back to DejaVu Sans. Both look clean.
import logging
logging.getLogger("matplotlib.font_manager").setLevel(logging.ERROR)

_FONT_STACK = [
    "Inter", "Segoe UI", "Helvetica Neue",
    "Arial", "DejaVu Sans", "sans-serif",
]
plt.rcParams["font.family"]      = _FONT_STACK
plt.rcParams["font.sans-serif"]  = _FONT_STACK
plt.rcParams["axes.unicode_minus"] = False




# ══════════════════════════════════════════════════════════════════════
# 7c.  VEGA-ALTAIR RENDERERS  (8 chart types)
#
#  All renderers export via vl_convert.vegalite_to_png → base64 PNG,
#  matching the same _to_b64 str format as Seaborn renderers so they
#  slot into the same {{PLACEHOLDER}} injection pipeline unchanged.
#
#  Chart type keys (chart_config_view.chart_type):
#    line_altair     — multi-series line with confidence band
#    bar_altair      — horizontal sorted bar, color-encoded
#    scatter_altair  — bubble scatter with size + color channels
#    heatmap_altair  — rect heatmap with sequential color scale
#    area_altair     — stacked area chart
#    strip_altair    — strip / jitter plot per category
#    boxplot_altair  — box-and-whisker with outlier marks
#    arc_altair      — pie / donut arc chart with text labels
#
#  cfg columns used:
#    x_column, y_columns, hue_column, color_theme, dark_mode,
#    title, subtitle, show_values, sort_order, width_px, height_px
#    (seaborn_style ignored — Altair uses its own theme)
# ══════════════════════════════════════════════════════════════════════

# ── Shared Altair helpers ─────────────────────────────────────────────

# ── Vega colour table (exact hex values Vega uses for each scheme) ────
# Required so we can draw matching matplotlib legend pills.
_VEGA_PALETTES = {
    "tableau10":   ["#4c78a8","#f58518","#e45756","#72b7b2",
                    "#54a24b","#eeca3b","#b279a2","#ff9da6","#9d755d","#bab0ac"],
    "set1":        ["#e41a1c","#377eb8","#4daf4a","#984ea3",
                    "#ff7f00","#ffff33","#a65628","#f781bf","#999999"],
    "set2":        ["#66c2a5","#fc8d62","#8da0cb","#e78ac3",
                    "#a6d854","#ffd92f","#e5c494","#b3b3b3"],
    "dark2":       ["#1b9e77","#d95f02","#7570b3","#e7298a",
                    "#66a61e","#e6ab02","#a6761d","#666666"],
    "category20b": ["#393b79","#5254a3","#6b6ecf","#9c9ede",
                    "#637939","#8ca252","#b5cf6b","#cedb9c",
                    "#8c6d31","#bd9e39","#e7ba52","#e7cb94",
                    "#843c39","#ad494a","#d6616b","#e7969c",
                    "#7b4173","#a55194","#ce6dbd","#de9ed6"],
    "tableau20":   ["#4c78a8","#9ecae9","#f58518","#ffbf79",
                    "#54a24b","#88d27a","#b79a20","#f2cf5b",
                    "#439894","#83bcb6","#e45756","#ff9d98",
                    "#79706e","#bab0ac","#d67195","#fcbfd2",
                    "#b279a2","#d6a5c9","#9e765f","#d8b5a5"],
}

# Map engine colour themes → Vega nominal scheme name + hex palette
_ALT_THEME_MAP = {
    "blue":    "tableau10",  "cool":    "set1",
    "warm":    "set2",       "vibrant": "tableau10",
    "teal":    "dark2",      "green":   "set1",
    "purple":  "category20b","slate":   "tableau10",
    "default": "tableau10",  "rainbow": "tableau20",
}
# Sequential schemes for heatmap quantitative colour axis only
_ALT_SCHEMES_SEQ = {
    "blue":"blues","cool":"blueorange","warm":"orangered",
    "vibrant":"tableau10","teal":"tealblues","green":"greens",
    "purple":"purples","slate":"grays","default":"blues","rainbow":"rainbow",
}

def _alt_scheme(theme: str, quantitative: bool = False) -> str:
    if quantitative:
        return _ALT_SCHEMES_SEQ.get(theme, "blues")
    return _ALT_THEME_MAP.get(theme, "tableau10")

def _alt_colours(theme: str, n: int) -> list:
    """Return first n hex colours matching what Vega renders for this theme."""
    palette = _VEGA_PALETTES.get(_ALT_THEME_MAP.get(theme, "tableau10"),
                                  _VEGA_PALETTES["tableau10"])
    return [palette[i % len(palette)] for i in range(n)]

def _alt_bg(dark: bool) -> str:
    return "#111827" if dark else "#FAFBFC"

def _alt_text(dark: bool) -> str:
    return "#F3F6FB" if dark else "#253047"

def _alt_grid(dark: bool) -> str:
    return "#263244" if dark else "#E7EBF0"

def _alt_sub(dark: bool) -> str:
    """Subtitle text color — muted but clearly readable."""
    return "#A7B4C8" if dark else "#667085"

def _alt_rule(dark: bool) -> str:
    return "#354154" if dark else "#D9DEE7"

def _alt_common(chart: alt.Chart, dark: bool) -> alt.Chart:
    """Apply shared chart polish to all Altair outputs."""
    return (
        chart
        .configure_view(strokeWidth=0, fill=_alt_bg(dark))
        .configure_axis(
            gridColor=_alt_grid(dark), gridOpacity=0.8, gridWidth=0.35,
            domainWidth=0, tickWidth=0, labelPadding=8, titlePadding=10,
            labelColor=_alt_text(dark), labelFontSize=11,
            titleColor=_alt_sub(dark), titleFontSize=11,
            labelFont="Arial", titleFont="Arial",
        )
        .configure_title(
            color=_alt_text(dark), fontSize=15, fontWeight="bold",
            font="Arial", anchor="start", offset=12,
            subtitleColor=_alt_sub(dark), subtitleFontSize=11,
            subtitlePadding=4,
        )
        .configure_legend(
            labelColor=_alt_text(dark), titleColor=_alt_sub(dark),
            labelFont="Arial", titleFont="Arial", labelFontSize=10,
            titleFontSize=10, symbolStrokeWidth=0,
        )
    )

def _alt_to_b64(spec_json: str, scale: float = 3.0) -> str:
    """Render a Vega-Lite spec to base64 PNG (no legend — use _alt_compose)."""
    png = vlc.vegalite_to_png(spec_json, scale=scale)
    return "data:image/png;base64," + base64.b64encode(png).decode()

def _alt_title(cfg: dict) -> alt.TitleParams:
    subtitle = cfg.get("subtitle", "")
    return alt.TitleParams(
        text=cfg["title"],
        subtitle=subtitle if subtitle else alt.Undefined,
    )

_ALT_LEG_DPI = 165   # matches export scale=3 (≈165 effective DPI)

def _alt_compose(chart_png_bytes: bytes, labels: list,
                 colours: list, dark: bool) -> str:
    """
    Compose an Altair chart PNG with a pixel-perfect matplotlib legend strip.

    Vega-Lite's configure_legend places text and symbols at wrong Y positions
    when rendered headlessly via vl_convert (confirmed by pixel scan).  The fix:
    suppress legend=None in every Vega encoding, then draw the legend here as a
    matplotlib strip composited below the chart image.

    labels  — ordered list of category names (same sort order as Vega renders)
    colours — matching hex strings from _alt_colours()
    """
    from matplotlib.patches import FancyBboxPatch as _FBP

    T_bg  = _alt_bg(dark)
    T_txt = _alt_sub(dark)
    T_rule = _alt_rule(dark)

    chart_img = Image.open(io.BytesIO(chart_png_bytes)).convert("RGBA")
    cw, ch    = chart_img.size

    n     = len(labels)
    ncols = min(5, n)
    nrows = -(-n // ncols)

    row_h_px = 34
    pad_top  = 14
    pad_bot  = 10
    lh_px    = nrows * row_h_px + pad_top + pad_bot
    w_in     = cw / _ALT_LEG_DPI
    h_in     = lh_px / _ALT_LEG_DPI

    fig, ax = plt.subplots(figsize=(w_in, h_in), dpi=_ALT_LEG_DPI,
                           facecolor=T_bg)
    ax.set_facecolor(T_bg)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis("off")

    col_w    = 1.0 / ncols
    swatch_w = 0.055 * col_w
    swatch_h = 0.38
    pad_l    = 0.014           # left margin within each column
    text_gap = 0.010           # gap between swatch and text

    ax.axhline(0.98, xmin=0.014, xmax=0.986, color=T_rule,
               linewidth=0.6, alpha=0.9)

    # usable height fraction (excluding top/bottom pad)
    usable_frac = (nrows * row_h_px) / lh_px
    top_offset  = (pad_top / lh_px) / usable_frac if usable_frac > 0 else 0

    for idx, (lbl, clr) in enumerate(zip(labels, colours)):
        col   = idx % ncols
        row   = idx // ncols
        # y_ctr in [0,1] axes space, with top padding accounted for
        y_raw = 1.0 - (row + 0.5) / nrows
        y_ctr = y_raw * usable_frac + (1.0 - usable_frac) * (1.0 - pad_top / lh_px)
        x0    = col * col_w + pad_l

        ax.add_patch(_FBP(
            (x0, y_ctr - swatch_h / 2), swatch_w, swatch_h,
            boxstyle="round,pad=0,rounding_size=0.012",
            facecolor=clr, edgecolor="none",
            transform=ax.transAxes, zorder=3, clip_on=False))
        ax.text(x0 + swatch_w + text_gap, y_ctr, str(lbl),
                va="center", ha="left", fontsize=10,
                color=T_txt, fontfamily="sans-serif", fontweight="normal",
                transform=ax.transAxes, clip_on=False)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=_ALT_LEG_DPI,
                bbox_inches=None, pad_inches=0, facecolor=T_bg)
    plt.close(fig)
    buf.seek(0)
    leg_img = Image.open(buf).convert("RGBA")
    lw, lhh = leg_img.size
    buf.close()

    # Match chart width exactly — pad right if legend narrower
    if lw != cw:
        bg_col = (17, 24, 39, 255) if dark else (250, 251, 252, 255)
        canvas = Image.new("RGBA", (cw, lhh), bg_col)
        canvas.paste(leg_img, (0, 0))
        leg_img = canvas
        lhh = leg_img.size[1]

    combined = Image.new("RGBA", (cw, ch + lhh),
                          (17, 24, 39, 255) if dark else (250, 251, 252, 255))
    combined.paste(chart_img, (0, 0))
    combined.paste(leg_img,   (0, ch))

    buf2 = io.BytesIO()
    combined.convert("RGB").save(buf2, format="PNG")
    b64 = base64.b64encode(buf2.getvalue()).decode()
    buf2.close()
    return f"data:image/png;base64,{b64}"


# ── line_altair # ── line_altair ───────────────────────────────────────────────────────
def _line_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Multi-series line chart with optional confidence band.
    x_column  = ordinal/temporal x  |  y_columns = one or more series
    hue_column = if set, df is long-form with a single y_columns[0]
                 and hue_column provides the series grouping.
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_cols  = cfg["y_columns"]
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

    # Point overlay: always visible, sized clearly, stroke for separation
    _pt = alt.OverlayMarkDef(filled=True, size=58,
                              stroke=_alt_bg(dark), strokeWidth=1.8)

    if hue_col and hue_col in df.columns:
        y_col = y_cols[0] if y_cols and y_cols[0] in df.columns else df.columns[-1]
        x_ax  = alt.X(f"{x_col}:N", sort=None, axis=alt.Axis(
                    labelAngle=-30, title=cfg.get("x_label",""),
                    labelColor=_alt_text(dark), titleColor=_alt_text(dark)))
        y_ax  = alt.Y(f"{y_col}:Q", axis=alt.Axis(
                    format=",.0f", title=cfg.get("y_label",""),
                    labelColor=_alt_text(dark), titleColor=_alt_text(dark)))
        base  = (alt.Chart(df)
                 .encode(x=x_ax, y=y_ax,
                         color=alt.Color(f"{hue_col}:N",
                                         scale=alt.Scale(scheme=scheme),
                                         legend=None)))
        layers = [base.mark_line(point=_pt, interpolate="monotone",
                                 strokeWidth=2.8)]
        if cfg["show_values"] and len(df) <= 50:
            layers.append(
                base.mark_text(dy=-14, fontSize=11, font="Arial",
                               fontWeight="bold")
                    .encode(text=alt.Text(f"{y_col}:Q", format=",.0f"),
                            color=alt.value(_alt_text(dark)))
            )
        chart = (alt.layer(*layers)
                 .properties(title=_alt_title(cfg), width=w, height=h,
                              background=_alt_bg(dark)))
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        valid = [c for c in y_cols if c in df.columns]
        df_m  = df[[x_col] + valid].melt(
            id_vars=x_col, var_name="_series", value_name="_value")
        x_ax  = alt.X(f"{x_col}:N", sort=None, axis=alt.Axis(
                    labelAngle=-30, title=cfg.get("x_label",""),
                    labelColor=_alt_text(dark), titleColor=_alt_text(dark)))
        y_ax  = alt.Y("_value:Q", axis=alt.Axis(
                    format=",.0f", title=cfg.get("y_label",""),
                    labelColor=_alt_text(dark), titleColor=_alt_text(dark)))
        base  = (alt.Chart(df_m)
                 .encode(x=x_ax, y=y_ax,
                         color=alt.Color("_series:N",
                                         scale=alt.Scale(scheme=scheme),
                                         legend=None)))
        layers = [base.mark_line(point=_pt, interpolate="monotone",
                                 strokeWidth=2.8)]
        if cfg["show_values"] and len(df_m) <= 50:
            layers.append(
                base.mark_text(dy=-14, fontSize=11, font="Arial",
                               fontWeight="bold")
                    .encode(text=alt.Text("_value:Q", format=",.0f"),
                            color=alt.value(_alt_text(dark)))
            )
        chart = (alt.layer(*layers)
                 .properties(title=_alt_title(cfg), width=w, height=h,
                              background=_alt_bg(dark)))
        leg_labels = valid

    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    final = _alt_common(chart, dark)
    png = vlc.vegalite_to_png(final.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


# ── bar_altair ────────────────────────────────────────────────────────
def _bar_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Sorted horizontal bar chart, color-encoded by value or hue_column.
    x_column  = label  |  y_columns[0] = value  |  hue_column = group
    sort_order = desc (default) | asc | none
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_col   = cfg["y_columns"][0] if cfg["y_columns"] else None
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)
    if y_col is None or y_col not in df.columns: return None

    sort_enc = "-x" if cfg["sort_order"] == "desc" else (
               "x"  if cfg["sort_order"] == "asc"  else None)

    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
    )

    base = (
        alt.Chart(df)
        .mark_bar(cornerRadiusTopRight=5, cornerRadiusBottomRight=5,
                  opacity=0.92)
        .encode(
            y=alt.Y(f"{x_col}:N", sort=sort_enc,
                    axis=alt.Axis(title=cfg.get("y_label",""), labelLimit=140,
                                  labelColor=_alt_text(dark), titleColor=_alt_text(dark))),
            x=alt.X(f"{y_col}:Q",
                    axis=alt.Axis(format=",.0f", title=cfg.get("x_label",""),
                                  labelColor=_alt_text(dark), titleColor=_alt_text(dark))),
            color=color_enc,
            tooltip=[
                alt.Tooltip(f"{x_col}:N", title=x_col),
                alt.Tooltip(f"{y_col}:Q", title=y_col, format=","),
            ],
        )
    )
    layers = [base]
    if cfg["show_values"]:
        layers.append(
            base.mark_text(align="left", dx=5, fontSize=11,
                           font="Arial", fontWeight="bold", color=_alt_text(dark))
            .encode(text=alt.Text(f"{y_col}:Q", format=",.0f"),
                    color=alt.value(_alt_text(dark)))
        )
    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    if hue_col and hue_col in df.columns:
        leg_labels  = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels  = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


# ── scatter_altair ────────────────────────────────────────────────────
def _scatter_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Bubble scatter chart.
    x_column   = x numeric col
    y_columns  = [y_col, size_col (optional)]
    hue_column = color grouping
    """
    dark     = cfg.get("dark_mode", False)
    x_col    = cfg["x_column"]
    y_col    = cfg["y_columns"][0] if cfg["y_columns"] else None
    size_col = cfg["y_columns"][1] if len(cfg["y_columns"]) > 1 else None
    hue_col  = cfg.get("hue_column", "")
    scheme   = _alt_scheme(cfg["color_theme"])
    w        = max(cfg["width_px"] - 60, 200)
    h        = max(cfg["height_px"] - 60, 120)
    if y_col is None or y_col not in df.columns: return None

    encodings = dict(
        x=alt.X(f"{x_col}:Q", axis=alt.Axis(format=",.0f",
                    title=cfg.get("x_label", x_col),
                    labelColor=_alt_text(dark), titleColor=_alt_text(dark))),
        y=alt.Y(f"{y_col}:Q", axis=alt.Axis(format=",.0f",
                    title=cfg.get("y_label", y_col),
                    labelColor=_alt_text(dark), titleColor=_alt_text(dark))),
        opacity=alt.value(0.72),
        strokeWidth=alt.value(1.0),
        stroke=alt.value(_alt_bg(dark)),
    )
    if hue_col and hue_col in df.columns:
        encodings["color"] = alt.Color(f"{hue_col}:N",
                                       scale=alt.Scale(scheme=scheme), legend=None)
    else:
        # Color each point by its x_col dimension for visual distinction
        encodings["color"] = alt.Color(f"{x_col}:N",
                                       scale=alt.Scale(scheme=scheme), legend=None)
    encodings["opacity"] = alt.value(0.72)
    if size_col and size_col in df.columns:
        encodings["size"] = alt.Size(f"{size_col}:Q",
                                     scale=alt.Scale(range=[45, 520]),
                                     legend=None)

    base  = alt.Chart(df).mark_circle(size=90).encode(**encodings)
    layers = [base]
    if cfg["show_values"] and x_col in df.columns and y_col in df.columns:
        txt_enc = {k: v for k, v in encodings.items()
                   if k not in ("opacity","strokeWidth","stroke","size")}
        layers.append(
            alt.Chart(df).mark_text(dy=-11, fontSize=11, font="Arial",
                                    color=_alt_text(dark))
            .encode(**txt_enc,
                    text=alt.Text(f"{y_col}:Q", format=",.0f"))
        )
    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    png = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if hue_col and hue_col in df.columns:
        leg_labels  = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels  = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


# ── heatmap_altair ────────────────────────────────────────────────────
def _heatmap_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Rect heatmap with a sequential colour scale.
    x_column   = column for x-axis categories
    y_columns  = [value_col]
    hue_column = column for y-axis categories (row labels)
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_col   = cfg["y_columns"][0] if cfg["y_columns"] else None
    row_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"], quantitative=True)
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)
    if y_col is None or y_col not in df.columns: return None

    y_enc = (
        alt.Y(f"{row_col}:N", axis=alt.Axis(title="", labelLimit=120,
                                            labelColor=_alt_text(dark)))
        if row_col and row_col in df.columns
        else alt.Y(f"{x_col}:N", axis=alt.Axis(title="", labelLimit=120,
                                               labelColor=_alt_text(dark)))
    )

    text_layer = (
        alt.Chart(df)
        .mark_text(fontSize=11, font="Arial")
        .encode(
            x=alt.X(f"{x_col}:N", sort=None),
            y=y_enc,
            text=alt.Text(f"{y_col}:Q", format=",.0f"),
            color=alt.condition(
                alt.datum[y_col] > float(df[y_col].quantile(0.6)),
                alt.value("#FFFFFF"),
                alt.value(_alt_text(dark)),
            ),
        )
    ) if cfg["show_values"] else None

    rect = (
        alt.Chart(df)
        .mark_rect(cornerRadius=3)
        .encode(
            x=alt.X(f"{x_col}:N", sort=None,
                    axis=alt.Axis(labelAngle=-30,
                                  title=cfg.get("x_label",""),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            y=y_enc,
            color=alt.Color(f"{y_col}:Q",
                            scale=alt.Scale(scheme=scheme),
                            legend=alt.Legend(title=y_col, format=",.0f")),
            tooltip=[
                alt.Tooltip(f"{x_col}:N"),
                *(([alt.Tooltip(f"{row_col}:N")] if row_col and row_col in df.columns else [])),
                alt.Tooltip(f"{y_col}:Q", format=","),
            ],
        )
    )

    base = alt.layer(rect, text_layer) if text_layer else rect
    chart = (
        base
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    return _alt_to_b64(chart.to_json())


# ── area_altair ───────────────────────────────────────────────────────
def _area_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Stacked area chart.
    x_column  = ordinal x  |  y_columns = series (melted to long-form)
    hue_column = if set, df already long-form with single y_columns[0]
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_cols  = cfg["y_columns"]
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

    if hue_col and hue_col in df.columns:
        y_col  = y_cols[0] if y_cols and y_cols[0] in df.columns else df.columns[-1]
        df_plt = df
        series = hue_col
    else:
        valid  = [c for c in y_cols if c in df.columns]
        df_plt = df[[x_col] + valid].melt(
            id_vars=x_col, var_name="_series", value_name="_value")
        y_col  = "_value"; series = "_series"

    base = (
        alt.Chart(df_plt)
        .mark_area(opacity=0.68, interpolate="monotone", line=True)
        .encode(
            x=alt.X(f"{x_col}:N", sort=None,
                    axis=alt.Axis(labelAngle=-30,
                                  title=cfg.get("x_label",""),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            y=alt.Y(f"{y_col}:Q", stack="zero",
                    axis=alt.Axis(format=",.0f", title=cfg.get("y_label",""),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            color=alt.Color(f"{series}:N",
                            scale=alt.Scale(scheme=scheme), legend=None),
            tooltip=[
                alt.Tooltip(f"{x_col}:N"),
                alt.Tooltip(f"{y_col}:Q", format=","),
                alt.Tooltip(f"{series}:N"),
            ],
        )
    )
    layers = [base]
    if cfg["show_values"]:
        layers.append(
            alt.Chart(df_plt)
            .mark_text(dy=-11, fontSize=11, font="Arial",
                       fontWeight="bold", color=_alt_text(dark))
            .encode(x=alt.X(f"{x_col}:N", sort=None),
                    y=alt.Y(f"{y_col}:Q", stack="zero"),
                    color=alt.Color(f"{series}:N",
                                    scale=alt.Scale(scheme=scheme), legend=None),
                    text=alt.Text(f"{y_col}:Q", format=",.0f"))
        )
    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    if hue_col and hue_col in df.columns:
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        valid = [c for c in y_cols if c in df.columns]
        leg_labels = valid
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


# ── strip_altair ──────────────────────────────────────────────────────
def _strip_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Strip / jitter plot — individual data points per category.
    x_column   = category  |  y_columns[0] = numeric value
    hue_column = optional colour grouping
    Useful for showing raw distribution alongside medians.
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_col   = cfg["y_columns"][0] if cfg["y_columns"] else None
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)
    if y_col is None or y_col not in df.columns: return None

    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
    )

    strip = (
        alt.Chart(df)
        .mark_circle(size=42, opacity=0.64, stroke=_alt_bg(dark),
                     strokeWidth=0.6)
        .encode(
            x=alt.X(f"{x_col}:N",
                    axis=alt.Axis(title="", labelAngle=-20,
                                  labelColor=_alt_text(dark))),
            y=alt.Y(f"{y_col}:Q",
                    axis=alt.Axis(format=",.0f", title=cfg.get("y_label", y_col),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            color=color_enc,
            xOffset=alt.XOffset(f"{hue_col}:N") if hue_col and hue_col in df.columns
                    else alt.Undefined,
            tooltip=[
                alt.Tooltip(f"{x_col}:N"),
                alt.Tooltip(f"{y_col}:Q", format=","),
                *(([alt.Tooltip(f"{hue_col}:N")] if hue_col and hue_col in df.columns else [])),
            ],
        )
    )

    # Median tick overlay
    median_line = (
        alt.Chart(df)
        .mark_tick(thickness=2.5, width=22, color=_alt_rule(dark), opacity=0.95)
        .encode(
            x=alt.X(f"{x_col}:N"),
            y=alt.Y(f"{y_col}:Q", aggregate="median"),
        )
    )

    chart = (
        alt.layer(strip, median_line)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    if hue_col and hue_col in df.columns:
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


# ── boxplot_altair ────────────────────────────────────────────────────
def _boxplot_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Box-and-whisker plot with outlier marks via Altair's boxplot mark.
    x_column   = category  |  y_columns[0] = numeric value
    hue_column = optional colour/offset grouping
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_col   = cfg["y_columns"][0] if cfg["y_columns"] else None
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)
    if y_col is None or y_col not in df.columns: return None

    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme),
                       legend=None)
    )

    chart = (
        alt.Chart(df)
        .mark_boxplot(
            extent="min-max",
            box=alt.MarkConfig(strokeWidth=1.5),
            median=alt.MarkConfig(strokeWidth=2.0),
            outliers=alt.MarkConfig(size=24, opacity=0.58),
        )
        .encode(
            x=alt.X(f"{x_col}:N",
                    axis=alt.Axis(title="", labelAngle=-20,
                                  labelColor=_alt_text(dark))),
            y=alt.Y(f"{y_col}:Q",
                    axis=alt.Axis(format=",.0f", title=cfg.get("y_label", y_col),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            color=color_enc,
            **({"xOffset": alt.XOffset(f"{hue_col}:N")}
               if hue_col and hue_col in df.columns else {}),
        )
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    if hue_col and hue_col in df.columns:
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


# ── arc_altair ────────────────────────────────────────────────────────
def _arc_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Pie / donut arc chart using Altair's arc mark with text labels.
    x_column   = label  |  y_columns[0] = value
    sort_order = desc sorts slices largest-first
    show_values = yes adds percentage text inside slices
    y_columns[1] optional: if 'donut' string, renders as donut
    """
    dark    = cfg.get("dark_mode", False)
    lbl_col = cfg["x_column"]
    val_col = cfg["y_columns"][0] if cfg["y_columns"] else None
    is_donut = len(cfg["y_columns"]) > 1 and str(cfg["y_columns"][1]).lower() == "donut"
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = min(cfg["width_px"] - 20, 460)
    h       = min(cfg["height_px"] - 20, 380)
    if val_col is None or val_col not in df.columns: return None

    if cfg["sort_order"] == "desc":
        df = df.sort_values(val_col, ascending=False).reset_index(drop=True)
    elif cfg["sort_order"] == "asc":
        df = df.sort_values(val_col, ascending=True).reset_index(drop=True)

    # Add percentage column for labels
    total     = df[val_col].sum()
    df        = df.copy()
    df["_pct"]       = (df[val_col] / total * 100).round(1)
    df["_pct_label"] = df["_pct"].round(0).astype(int).astype(str) + "%"

    base = alt.Chart(df).encode(
        theta=alt.Theta(f"{val_col}:Q", stack=True),
        color=alt.Color(f"{lbl_col}:N",
                        scale=alt.Scale(scheme=scheme),
                        legend=None),
        tooltip=[
            alt.Tooltip(f"{lbl_col}:N", title="Segment"),
            alt.Tooltip(f"{val_col}:Q", title="Value", format=","),
            alt.Tooltip("_pct:Q", title="%", format=".1f"),
        ],
    )

    outer_r = min(w, h) // 2 - 10
    arc_kwargs = dict(outerRadius=outer_r, stroke=_alt_bg(dark), strokeWidth=2)
    if is_donut:
        arc_kwargs["innerRadius"] = min(w, h) // 4

    pie = base.mark_arc(**arc_kwargs)

    text_r = outer_r * (0.65 if is_donut else 0.72)
    label_layers = [pie]
    if cfg.get("show_values", True):
        label_layers.append(
            base.mark_text(radius=text_r)
            .encode(text=alt.Text("_pct_label:N"))
        )

    chart = (
        alt.layer(*label_layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    leg_labels  = df[lbl_col].tolist()
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png = vlc.vegalite_to_png(chart.to_json(), scale=3)
    # Always compose with legend for arc charts
    if leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


_RENDERERS = {
    # ── Vega-Altair (8 chart types) ──────────────────────────
    "line_altair":      _line_altair,
    "bar_altair":       _bar_altair,
    "scatter_altair":   _scatter_altair,
    "heatmap_altair":   _heatmap_altair,
    "area_altair":      _area_altair,
    "strip_altair":     _strip_altair,
    "boxplot_altair":   _boxplot_altair,
    "arc_altair":       _arc_altair,
}

def render_chart(df: pd.DataFrame, cfg: dict) -> Optional[str]:
    fn = _RENDERERS.get(cfg["chart_type"])
    if fn is None:
        print(f"    [WARN] Unknown chart_type='{cfg['chart_type']}'.")
        return None
    if df.empty:
        print(f"    [WARN] Empty data for '{cfg['variable_name']}'.")
        return None
    return fn(df, cfg)


# ══════════════════════════════════════════════════════════════════════
# 8.  PLACEHOLDER SCANNER
# ══════════════════════════════════════════════════════════════════════

_RE = re.compile(r"\{\{([A-Z0-9_]+)\}\}")

def find_placeholders(html: str) -> list:
    # dict.fromkeys preserves insertion order and deduplicates in one pass
    return list(dict.fromkeys(m.group(1) for m in _RE.finditer(html)))


# ══════════════════════════════════════════════════════════════════════
# 9.  CHART IMAGE WRAPPER
#     _img_block wraps the rendered base64 PNG in a minimal,
#     Outlook-safe <img> tag.  The surrounding HTML (DOCTYPE, head,
#     body, header, footer, styles) comes entirely from the BigQuery
#     email_list.html_template column — the engine never adds its own
#     envelope HTML.
# ══════════════════════════════════════════════════════════════════════

def _img_block(b64: str, cfg: dict) -> str:
    """
    Return a minimal Outlook-safe <img> block for one chart.
    This is the only HTML the engine injects — everything else
    (wrapper, header, footer, styles) is in the BigQuery html_template.
    """
    return (
        f'<div style="margin:0 0 24px 0;">'
        '<!--[if mso]><table><tr><td><![endif]-->'
        f'<img src="{b64}" alt="{cfg["title"]}" width="{cfg["width_px"]}"'
        ' style="display:block;max-width:100%;height:auto;" />'
        '<!--[if mso]></td></tr></table><![endif]-->'
        '</div>'
    )


# ══════════════════════════════════════════════════════════════════════
# 10. OUTPUT ROW BUILDER
# ══════════════════════════════════════════════════════════════════════

def build_output_row(email_row: dict, report_name: str, final_html: str,
                     charts_injected: int, total_placeholders: int,
                     error_message: str = "") -> dict:
    """
    One output row per (report_name, email_id) combination.
    All charts for that combination are in a single final_html.
    """
    if error_message:
        status = "FAILED"
    elif charts_injected == 0:
        status = "FAILED"; error_message = "No charts injected."
    elif charts_injected < total_placeholders:
        status = "WARN"
        error_message = (f"{charts_injected}/{total_placeholders} injected. "
                         "Some placeholders had no config or returned empty data.")
    else:
        status = "SUCCESS"
    return {
        "email_id":        str(email_row.get("email_id", "")),
        "report_name":     str(report_name),
        "recipient_email": str(email_row.get("recipient_email", "")),
        "subject":         str(email_row.get("subject", "")),
        "final_html":      final_html,
        "charts_injected": int(charts_injected),
        "total_charts":    int(total_placeholders),
        "status":          status,
        "error_message":   error_message,
        "processed_at":    datetime.now(timezone.utc).isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════
# 11. CHART RENDER WORKER
# ══════════════════════════════════════════════════════════════════════

def _render_one(var: str, config_map: dict, bq: BigQueryClient,
                email_vars: dict | None = None) -> tuple:
    """
    Resolve variables (using per-email context) → fetch from BQ → render.

    email_vars  — per-dispatch variable context (runtime_vars + email_id).
                  Passed here so every chart in a dispatch gets the same
                  variable context.

    Returns (var, b64_or_None, cfg, error_str).
    """
    if var not in config_map:
        return (var, None, None, f"'{var}' not in chart_config_view")

    raw_cfg = config_map[var]
    try:
        # Resolve bq_table, filters, title, subtitle etc. with per-email vars
        cfg = resolve_cfg(raw_cfg, email_vars)
    except Exception as exc:
        return (var, None, raw_cfg, f"Variable resolution failed: {exc}")

    try:
        if USE_MOCK:
            df = _get_mock_df(cfg["chart_type"])
        else:
            sql = build_select(cfg)
            df  = bq.query(sql)  # set breakpoint here or print(sql) for query debugging
        if df.empty:
            return (var, None, cfg, "0 rows returned")
        b64 = render_chart(df, cfg)
        return (var, b64, cfg, "")
    except Exception as exc:
        return (var, None, cfg, str(exc))


# ══════════════════════════════════════════════════════════════════════
# 12. MAIN PIPELINE
# ══════════════════════════════════════════════════════════════════════

def process_emails(bq: BigQueryClient) -> list:
    """
    v15 pipeline — groups by (report_name, email_id).

    KEY RULE:
      One HTML file is produced per unique (report_name, email_id)
      combination.  ALL chart {{PLACEHOLDER}} tokens that belong to that
      report are rendered and injected into the single html_template in
      sort_position order.

    Flow:
      1. Build base runtime vars (date tokens + TABLE_VARS).
      2. JOIN email_list ⋈ chart_config_view on report_name.
      3. Group joined rows by (report_name, email_id).
      4. Per group:
           a. Build per-email variable context: runtime_vars + {email_id}.
           b. Resolve html_template + subject with per-email vars.
           c. Build config_map {variable_name: cfg} from ALL chart rows.
           d. Find every {{PLACEHOLDER}} in the template.
           e. Render all charts in parallel using per-email vars.
           f. Inject ALL rendered images into the single template.
           g. Save HTML file named by report_name + email_id.
      5. Write results to email_output.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ── 1. Base runtime vars ──────────────────────────────────────────
    runtime_vars = _build_runtime_vars()
    print("► Runtime variable context:")
    for k in ["env", "today", "this_month", "this_year",
               "this_quarter_year", "last_quarter_year"]:
        print(f"    {{{k}}} → {runtime_vars.get(k, '')}")
    if TABLE_VARS:
        print("  Custom TABLE_VARS:")
        for k, v in TABLE_VARS.items():
            print(f"    {{{k}}} → {v}")
    print()

    # ── 2. JOIN query: email_list ⋈ chart_config_view ─────────────────────
    el_tbl  = resolve(EMAIL_LIST_TABLE,   runtime_vars)
    cfg_tbl = resolve(CHART_CONFIG_VIEW, runtime_vars)

    join_sql = f"""
        SELECT
            el.email_id,
            el.report_name,
            el.recipient_email,
            el.subject,
            el.html_template,
            cc.sort_position,
            cc.variable_name,
            cc.chart_type,
            cc.bq_table,
            cc.filters,
            cc.x_column,
            cc.y_columns,
            cc.legend,
            cc.title,
            cc.subtitle,
            cc.color_theme,
            cc.show_values,
            cc.sort_order,
            cc.width_px,
            cc.height_px,
            cc.ref_line_value,
            cc.ref_line_label,
            cc.x_label,
            cc.y_label,
            cc.dark_mode,
            cc.hue_column
        FROM   `{el_tbl}`  el
        JOIN   `{cfg_tbl}` cc  USING (report_name)
        ORDER  BY el.report_name, el.email_id, cc.sort_position
    """
    if USE_MOCK:
        print("► [MOCK] Building synthetic email_list ⋈ chart_config_view …")
        joined_df = _build_mock_joined_df()
    else:
        print("► Running email_list ⋈ chart_config_view JOIN …")
        joined_df = bq.query(join_sql)
    n_combos  = joined_df.groupby(
        ["report_name", "email_id"]).ngroups if not joined_df.empty else 0
    print(f"  {len(joined_df)} row(s)  →  "
          f"{n_combos} (report × email_id) combination(s).\n")

    if joined_df.empty:
        print("  [WARN] JOIN returned 0 rows — nothing to process.")
        return []

    output_rows = []

    # ── 3. Group by (report_name, email_id) ──────────────────────────
    for (report_name, email_id), group in joined_df.groupby(
            ["report_name", "email_id"], sort=False):

        first = group.iloc[0]

        # ── 4a. Per-email variable context ────────────────────────────
        email_vars = {**runtime_vars, "email_id": str(email_id)}

        print(f"{'─'*62}")
        print(f"  report_name   : {report_name}")
        print(f"  email_id      : {email_id}")
        print(f"  recipient     : {first.get('recipient_email', '')}")
        print(f"  charts in grp : {len(group)}")

        # ── 4b. Resolve template + subject ───────────────────────────
        html_template = resolve(str(first["html_template"]), email_vars)
        subject       = resolve(str(first.get("subject", "")), email_vars)
        print(f"  subject       : {subject}")

        email_meta = {
            "email_id":        email_id,
            "report_name":     report_name,
            "recipient_email": str(first.get("recipient_email", "")),
            "subject":         subject,
        }

        # ── 4c. Build config_map from ALL chart rows in this group ────
        #  Sort by sort_position so config_map preserves render order
        config_map: dict = {}
        for _, row in group.sort_values("sort_position").iterrows():
            cfg = parse_config(row.to_dict())
            config_map[cfg["variable_name"]] = cfg

        # ── 4d. Find ALL {{PLACEHOLDER}} tokens in the template ───────
        placeholders = find_placeholders(html_template)
        total        = len(placeholders)
        print(f"  placeholders  : {placeholders}")

        missing = [p for p in placeholders if p not in config_map]
        if missing:
            print(f"  [WARN] No chart_config_view row for: {missing}")

        # Log resolved filters so operator can verify substitution
        for var in placeholders:
            if var in config_map:
                raw_f = config_map[var].get("filters", "")
                res_f = resolve(raw_f, email_vars)
                if raw_f != res_f:
                    print(f"    ↳ {var}  filter: {raw_f!r}  →  {res_f!r}")

        # ── 4e. Render ALL charts in parallel ─────────────────────────
        results: dict = {}
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            futures = {
                pool.submit(_render_one, var, config_map, bq, email_vars): var
                for var in placeholders
                if var in config_map
            }
            for future in as_completed(futures):
                var, b64, cfg, err = future.result()
                results[var] = (b64, cfg, err)

        # ── 4f. Inject ALL images into the SINGLE html_template ───────
        #  Process in sort_position order so charts appear in the
        #  correct sequence regardless of thread completion order.
        injected  = 0
        error_msg = ""
        for var in placeholders:
            b64, cfg, err = results.get(var, (None, None, "no config"))
            token = f"{{{{{var}}}}}"

            if err:
                print(f"  [SKIP] '{var}' — {err}")
                continue
            if b64 is None:
                print(f"  [SKIP] '{var}' — render returned None")
                continue

            # Replace this variable's {{TOKEN}} with the chart image
            html_template = html_template.replace(token, _img_block(b64, cfg))
            injected += 1
            print(f"  ✓ '{var}'  [{cfg['chart_type']}]"
                  f"  pos={cfg.get('sort_position','-')}"
                  f"  ({len(b64):,} chars)")

        # ── 4g. Save — html_template IS the final HTML ───────────────
        #  The template from BigQuery already contains the full document
        #  (DOCTYPE, head, styles, body, header, footer).
        #  The engine only injected chart images into {{PLACEHOLDER}}
        #  tokens — it does not add any wrapper HTML of its own.
        final_html = html_template

        # File name: report_name + email_id
        safe_id   = re.sub(r"[^a-zA-Z0-9._-]", "_", str(email_id))
        out_path  = os.path.join(OUTPUT_DIR, f"{report_name}__{safe_id}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(final_html)
        print(f"\n  ✓ Saved  → {out_path}")

        row = build_output_row(email_meta, report_name, final_html,
                               injected, total, error_msg)
        output_rows.append(row)
        print(f"  ✓ Status : {row['status']}"
              f"  charts={row['charts_injected']}/{row['total_charts']}")

    # ── 5. Write to BigQuery (skipped in mock mode) ───────────────────
    if output_rows and not USE_MOCK:
        out_tbl = resolve(EMAIL_OUTPUT_TABLE, runtime_vars)
        print(f"\n{'─'*62}")
        print(f"► Writing {len(output_rows)} row(s) → {out_tbl}  ({WRITE_MODE})")
        bq.insert_rows(out_tbl, output_rows, write_mode=WRITE_MODE)
    elif output_rows and USE_MOCK:
        print(f"\n  [MOCK] Skipping BigQuery write ({len(output_rows)} row(s)).")

    return output_rows


# ══════════════════════════════════════════════════════════════════════
# 13.  MOCK-DATA VISUAL TEST
#
#  Run:  python chart_email_engine_v14.py --test [--dark] [--out PATH]
#
#  Renders all 8 Altair chart types with realistic synthetic data and writes
#  a single self-contained HTML gallery you can open in any browser.
#  No BigQuery credentials required.
#
#  Optional flags:
#    --dark          render all charts in dark mode
#    --out FILE      output path  (default: chart_test_gallery.html)
# ══════════════════════════════════════════════════════════════════════

_MOCK_DF_REGISTRY: dict | None = None


def _get_mock_df(chart_type: str) -> pd.DataFrame:
    """Return synthetic DataFrame for the given chart_type."""
    global _MOCK_DF_REGISTRY
    if _MOCK_DF_REGISTRY is None:
        _MOCK_DF_REGISTRY = {label: df for label, df, _ in _build_mock_cases(dark=False)}
    df = _MOCK_DF_REGISTRY.get(chart_type)
    if df is None:
        raise ValueError(f"No mock data registered for chart_type={chart_type!r}")
    return df.copy()


def _build_mock_joined_df() -> pd.DataFrame:
    """
    Synthetic email_list ⋈ chart_config_view JOIN covering all 8 Altair chart types.
    Returned DataFrame has the same column set as the live BQ JOIN query so
    the rest of process_emails can consume it unchanged.
    """
    cases = _build_mock_cases(dark=False)
    all_vars = "  ".join(f"{{{{{label.upper()}}}}}" for label, _, _ in cases)
    html_tmpl = f"<html><body>{all_vars}</body></html>"

    def _yn(v) -> str:
        return "yes" if v else "no"

    rows = []
    for pos, (label, _, cfg) in enumerate(cases, 1):
        rows.append({
            "email_id":        "mock_001",
            "report_name":     "mock_report",
            "recipient_email": "mock@example.com",
            "subject":         "Mock Report — All Chart Types",
            "html_template":   html_tmpl,
            "sort_position":   pos,
            "variable_name":   label.upper(),
            "chart_type":      cfg["chart_type"],
            "bq_table":        "mock",
            "filters":         "",
            "x_column":        cfg["x_column"],
            "y_columns":       ",".join(cfg["y_columns"]),
            "legend":          _yn(cfg.get("legend", True)),
            "title":           cfg["title"],
            "subtitle":        cfg["subtitle"],
            "color_theme":     cfg["color_theme"],
            "show_values":     _yn(cfg.get("show_values", False)),
            "sort_order":      cfg["sort_order"],
            "width_px":        cfg["width_px"],
            "height_px":       cfg["height_px"],
            "ref_line_value":  cfg.get("ref_line_value", ""),
            "ref_line_label":  cfg.get("ref_line_label", ""),
            "x_label":         cfg.get("x_label", ""),
            "y_label":         cfg.get("y_label", ""),
            "dark_mode":       _yn(cfg.get("dark_mode", False)),
            "hue_column":      cfg.get("hue_column", ""),
            "seaborn_style":   cfg.get("seaborn_style", "whitegrid"),
        })
    return pd.DataFrame(rows)


def _mock_cfg(chart_type: str, title: str, subtitle: str,
              x_col: str, y_cols: list,
              color_theme: str = "blue",
              show_values: bool = True,
              legend: bool = True,
              sort_order: str = "none",
              width_px: int = 620, height_px: int = 320,
              ref_line_value: str = "",
              hue_column: str = "",
              seaborn_style: str = "whitegrid",
              dark_mode: bool = False,
              x_label: str = "",
              y_label: str = "") -> dict:
    """Build a minimal cfg dict that matches parse_config output."""
    return {
        "report_name":    "mock_test",
        "variable_name":  chart_type.upper(),
        "sort_position":  0,
        "chart_type":     chart_type,
        "bq_table":       "mock",
        "filters":        "",
        "x_column":       x_col,
        "y_columns":      y_cols,
        "legend":         legend,
        "title":          title,
        "subtitle":       subtitle,
        "color_theme":    color_theme,
        "show_values":    show_values,
        "sort_order":     sort_order,
        "width_px":       width_px,
        "height_px":      height_px,
        "ref_line_value": ref_line_value,
        "ref_line_label": "Target" if ref_line_value else "",
        "x_label":        x_label,
        "y_label":        y_label,
        "dark_mode":      dark_mode,
        "hue_column":     hue_column,
        "seaborn_style":  seaborn_style,
    }


def _build_mock_cases(dark: bool) -> list:
    """
    Returns list of (label, df, cfg) tuples — one per chart type.
    Data mirrors what the SQL seed tables would return.
    """
    months = ["Jan","Feb","Mar","Apr","May","Jun",
              "Jul","Aug","Sep","Oct","Nov","Dec"]
    quarters = ["Q1","Q2","Q3","Q4"]
    regions  = ["North","South","East","West","Central"]

    cases = []

    # ── Vega-Altair chart types (1-8) ──────────────────────────

    # ── 1. line_altair ──────────────────────────────────────
    df = pd.DataFrame({
        "Month":   months + months,
        "Revenue": [42000,47500,53200,49800,61000,67300,
                    72100,68900,74500,81200,78600,91000,
                    36000,40200,44800,41500,52000,58100,
                    61400,59200,64800,70300,67900,80100],
        "Year":    ["2026"]*12 + ["2025"]*12,
    })
    cases.append(("line_altair", df, _mock_cfg(
        "line_altair", "Revenue Trend by Year (Altair)", "2025 vs 2026",
        "Month", ["Revenue"],
        color_theme="blue", hue_column="Year", legend=True,
        show_values=True, sort_order="none",
        ref_line_value="70000", width_px=620, height_px=320, dark_mode=dark,
        x_label="Month", y_label="Revenue ($)")))

    # ── 2. bar_altair ────────────────────────────────────────
    df = pd.DataFrame({
        "Region":  regions,
        "Revenue": [31200,24500,18900,27800,15600],
    })
    cases.append(("bar_altair", df, _mock_cfg(
        "bar_altair", "Revenue by Region (Altair)", "Sorted high to low · 2026",
        "Region", ["Revenue"],
        color_theme="teal", show_values=True, legend=True,
        sort_order="desc", ref_line_value="25000",
        width_px=560, height_px=300, dark_mode=dark,
        x_label="Region", y_label="Revenue ($)")))

    # ── 3. scatter_altair ────────────────────────────────────
    rng_a = np.random.default_rng(42)
    segs_a = ["Enterprise","Mid-Market","SMB"]
    n_a    = 45
    df = pd.DataFrame({
        "DealSize": rng_a.integers(10000, 500000, n_a),
        "Revenue":  rng_a.integers(5000,  300000, n_a),
        "Count":    rng_a.integers(1, 50, n_a),
        "Segment":  rng_a.choice(segs_a, n_a),
    })
    cases.append(("scatter_altair", df, _mock_cfg(
        "scatter_altair", "Deal Size vs Revenue (Altair)", "Bubble = deal count",
        "DealSize", ["Revenue","Count"],
        color_theme="purple", hue_column="Segment", legend=True,
        show_values=True, sort_order="none",
        width_px=580, height_px=340, dark_mode=dark,
        x_label="Deal Size ($)", y_label="Revenue ($)")))

    # ── 4. heatmap_altair ────────────────────────────────────
    df_rows = []
    base_rev = {"North":31000,"South":24000,"East":19000,"West":28000,"Central":16000}
    for region in regions:
        for month in months:
            noise = np.random.default_rng(hash(region+month) % 999).integers(-3000,5000)
            df_rows.append({"Region": region, "Month": month,
                             "Revenue": base_rev[region] + noise})
    df = pd.DataFrame(df_rows)
    cases.append(("heatmap_altair", df, _mock_cfg(
        "heatmap_altair", "Revenue Heatmap — Region x Month (Altair)",
        "Darker = higher revenue · 2026",
        "Month", ["Revenue"],
        color_theme="blue", hue_column="Region", legend=True,
        show_values=True, sort_order="none",
        width_px=640, height_px=320, dark_mode=dark,
        x_label="Month", y_label="Region")))

    # ── 5. area_altair ───────────────────────────────────────
    df = pd.DataFrame({
        "Month":   months,
        "Revenue": [42000,47500,53200,49800,61000,67300,
                    72100,68900,74500,81200,78600,91000],
        "Target":  [45000,48000,52000,55000,60000,65000,
                    70000,72000,75000,80000,82000,88000],
    })
    cases.append(("area_altair", df, _mock_cfg(
        "area_altair", "Revenue vs Target — Stacked Area (Altair)", "YTD 2026",
        "Month", ["Revenue","Target"],
        color_theme="cool", show_values=True, legend=True,
        sort_order="none", ref_line_value="70000",
        width_px=620, height_px=320, dark_mode=dark,
        x_label="Month", y_label="Revenue ($)")))

    # ── 6. strip_altair ──────────────────────────────────────
    rng_b = np.random.default_rng(13)
    df_rows = []
    for region in regions:
        base = {"North":55000,"South":45000,"East":38000,"West":52000,"Central":31000}[region]
        for seg in ["Enterprise","SMB"]:
            for _ in range(12):
                df_rows.append({"Region": region, "Segment": seg,
                                 "Revenue": int(rng_b.normal(base, base*0.22))})
    df = pd.DataFrame(df_rows)
    cases.append(("strip_altair", df, _mock_cfg(
        "strip_altair", "Revenue Distribution — Strip Plot (Altair)",
        "Each dot = one observation · median tick shown",
        "Region", ["Revenue"],
        color_theme="vibrant", hue_column="Segment", legend=True,
        show_values=True, sort_order="none",
        width_px=620, height_px=360, dark_mode=dark,
        x_label="Region", y_label="Revenue ($)")))

    # ── 7. boxplot_altair ────────────────────────────────────
    rng_c = np.random.default_rng(21)
    df_rows = []
    for q in quarters:
        base = {"Q1":42000,"Q2":55000,"Q3":68000,"Q4":80000}[q]
        for seg in ["Enterprise","SMB"]:
            for _ in range(18):
                df_rows.append({"Quarter": q, "Segment": seg,
                                 "Revenue": int(rng_c.normal(base, base*0.20))})
    df = pd.DataFrame(df_rows)
    cases.append(("boxplot_altair", df, _mock_cfg(
        "boxplot_altair", "Revenue by Quarter — Box Plot (Altair)",
        "Split by Segment · 2026",
        "Quarter", ["Revenue"],
        color_theme="warm", hue_column="Segment", legend=True,
        show_values=True, sort_order="none",
        width_px=620, height_px=380, dark_mode=dark,
        x_label="Quarter", y_label="Revenue ($)")))

    # ── 8. arc_altair ────────────────────────────────────────
    df = pd.DataFrame({
        "Segment": ["Enterprise","Mid-Market","SMB","Consumer","Partner"],
        "Share":   [38, 24, 19, 12, 7],
    })
    cases.append(("arc_altair", df, _mock_cfg(
        "arc_altair", "Market Share — Arc / Donut (Altair)", "FY 2026",
        "Segment", ["Share", "donut"],
        color_theme="vibrant", show_values=True, legend=True,
        sort_order="desc", width_px=520, height_px=380, dark_mode=dark,
        x_label="Segment", y_label="Share (%)")))

    return cases


def run_visual_test(dark: bool = False, out_path: str = "chart_test_gallery.html") -> None:
    """
    Render all 8 Altair chart types with mock data and write a self-contained
    HTML gallery.  No BigQuery connection required.
    """
    cases    = _build_mock_cases(dark)
    bg_color = "#1A1F2B" if dark else "#F4F6FA"
    card_bg  = "#222838" if dark else "#FFFFFF"
    txt_col  = "#E8ECF4" if dark else "#1F2937"
    tag_bg   = "#2A3145" if dark else "#EEF2FF"
    tag_col  = "#A4D0F2" if dark else "#4338CA"
    border   = "#2E3650" if dark else "#E5E7EB"

    chart_cards = []
    ok = err = 0

    for i, (label, df, cfg) in enumerate(cases, 1):
        print(f"  [{i:2d}/8]  {label:<22s}", end=" ", flush=True)
        try:
            b64 = render_chart(df, cfg)
            if b64:
                card = f"""
        <div style="background:{card_bg};border-radius:12px;padding:20px 24px 16px;
                    border:1px solid {border};break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="background:{tag_bg};color:{tag_col};font-family:monospace;
                         font-size:11px;font-weight:700;padding:3px 10px;
                         border-radius:20px;">{label}</span>
            <span style="font-size:13px;color:{txt_col};font-weight:600;
                         font-family:Arial,sans-serif;">{cfg['title']}</span>
          </div>
          <img src="{b64}" alt="{label}"
               style="display:block;max-width:100%;height:auto;border-radius:6px;" />
        </div>"""
                chart_cards.append(card)
                print("OK")
                ok += 1
            else:
                print("WARN — render returned None")
                err += 1
        except Exception as exc:
            print(f"ERROR — {exc}")
            err += 1

    mode_badge = ("dark" if dark else "light")
    mode_color = ("#4A9EFF" if dark else "#4338CA")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BigQuery Chart Engine v15 — Visual Test Gallery</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: {bg_color};
      font-family: Arial, "Helvetica Neue", sans-serif;
      padding: 32px 24px 48px;
      min-height: 100vh;
    }}
    .header {{
      max-width: 1200px; margin: 0 auto 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid {border};
    }}
    .header h1 {{
      font-size: 22px; font-weight: 700; color: {txt_col};
      margin-bottom: 6px;
    }}
    .header p {{
      font-size: 13px; color: {'#8FA4C8' if dark else '#6B7280'};
      line-height: 1.6;
    }}
    .badge {{
      display: inline-block;
      background: {mode_color};
      color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 10px; border-radius: 20px;
      margin-left: 8px; vertical-align: middle;
      text-transform: uppercase; letter-spacing: .05em;
    }}
    .stats {{
      display: flex; gap: 20px; margin-top: 12px;
    }}
    .stat {{
      font-size: 12px;
      color: {'#8FA4C8' if dark else '#6B7280'};
    }}
    .stat strong {{ color: {txt_col}; }}
    .grid {{
      max-width: 1300px; margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(640px, 1fr));
      gap: 20px;
    }}
  </style>
</head>
<body>
  <div class="header">
    <h1>BigQuery Chart Engine v15
      <span class="badge">{mode_badge} mode</span>
    </h1>
    <p>Visual test gallery — all 8 Altair chart types rendered with synthetic mock data.
       No BigQuery connection required.</p>
    <div class="stats">
      <div class="stat">Rendered: <strong>{ok}</strong></div>
      <div class="stat">Failed: <strong>{err}</strong></div>
      <div class="stat">Total: <strong>{ok + err}</strong></div>
    </div>
  </div>
  <div class="grid">
{''.join(chart_cards)}
  </div>
</body>
</html>"""

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\n  Gallery written -> {os.path.abspath(out_path)}")
    print(f"  Rendered {ok}/{ok+err} charts successfully.")


# ══════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys

    if "--test" in sys.argv:
        dark     = "--dark" in sys.argv
        out_idx  = sys.argv.index("--out") if "--out" in sys.argv else -1
        out_path = sys.argv[out_idx + 1] if out_idx != -1 else "chart_test_gallery.html"
        print("=" * 62)
        print("  BigQuery Chart Engine v15  —  Visual Test Mode")
        print(f"  Rendering all 8 Altair chart types ({'dark' if dark else 'light'} mode)")
        print("=" * 62)
        run_visual_test(dark=dark, out_path=out_path)
        print("=" * 62)
    else:
        print("=" * 62)
        print("  BigQuery Chart Engine  v15")
        print("  One HTML per (report_name × email_id) combination")
        print("=" * 62)
        print(f"  Key file     : {SERVICE_ACCOUNT_KEY_FILE}")
        print(f"  Project      : {PROJECT_ID}")
        print(f"  Write mode   : {WRITE_MODE}")
        print(f"  email_list   : {EMAIL_LIST_TABLE}")
        print(f"  chart_config_view : {CHART_CONFIG_VIEW}")
        print(f"  email_output : {EMAIL_OUTPUT_TABLE}")
        print(f"  Chart types  : line_altair, bar_altair, scatter_altair,")
        print(f"                 heatmap_altair, area_altair, strip_altair,")
        print(f"                 boxplot_altair, arc_altair")
        print(f"  Workers      : {MAX_WORKERS}")
        print(f"  Group key    : (report_name, email_id)")
        print(f"  Var resolve  : email_id > TABLE_VARS > built-in tokens")
        if TABLE_VARS:
            print(f"  Custom vars  : {list(TABLE_VARS.keys())}")
        print(f"  Data source  : {'MOCK (synthetic data)' if USE_MOCK else 'BigQuery (live)'}")
        print()

        bq   = None if USE_MOCK else BigQueryClient()
        rows = process_emails(bq)

        print(f"\n{'='*62}")
        print(f"  Done — {len(rows)} HTML(s) generated.")
        for r in rows:
            icon = {"SUCCESS": "✓", "WARN": "⚠", "FAILED": "✗"}.get(r["status"], "?")
            print(f"  {icon}  [{r['report_name']}]  email_id={r['email_id']}"
                  f"  →  {r['recipient_email']}"
                  f"  status={r['status']}"
                  f"  charts={r['charts_injected']}/{r['total_charts']}")
            if r["error_message"]:
                print(f"      {r['error_message']}")
        print(f"  Files → {os.path.abspath(OUTPUT_DIR)}/")
        print("=" * 62)
