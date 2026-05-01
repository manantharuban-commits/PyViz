import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Optional

from .config import (
    OUTPUT_DIR, USE_MOCK, MAX_WORKERS,
    EMAIL_LIST_TABLE, CHART_CONFIG_VIEW, EMAIL_OUTPUT_TABLE, WRITE_MODE,
    TABLE_VARS,
)
from .vars import _build_runtime_vars, resolve, resolve_cfg
from .sql_builder import build_select, parse_config
from .charts import render_chart
from .mock_data import _get_mock_df, _build_mock_joined_df

# bq_client imported lazily — only when USE_MOCK is False


# ── Placeholder scanner ───────────────────────────────────────────────
_RE = re.compile(r"\{\{([A-Z0-9_]+)\}\}")


def find_placeholders(html: str) -> list:
    return list(dict.fromkeys(m.group(1) for m in _RE.finditer(html)))


# ── Chart image wrapper ───────────────────────────────────────────────

def _img_block(b64: str, cfg: dict) -> str:
    """
    Minimal Outlook-safe <img> block for one chart.
    Only HTML the engine injects — everything else is in html_template.
    """
    return (
        f'<div style="margin:0 0 24px 0;">'
        '<!--[if mso]><table><tr><td><![endif]-->'
        f'<img src="{b64}" alt="{cfg["title"]}" width="{cfg["width_px"]}"'
        ' style="display:block;max-width:100%;height:auto;" />'
        '<!--[if mso]></td></tr></table><![endif]-->'
        '</div>'
    )


# ── Output row builder ────────────────────────────────────────────────

def build_output_row(email_row: dict, report_name: str, final_html: str,
                     charts_injected: int, total_placeholders: int,
                     error_message: str = "") -> dict:
    """One output row per (report_name, email_id) combination."""
    if error_message:
        status = "FAILED"
    elif charts_injected == 0:
        status        = "FAILED"
        error_message = "No charts injected."
    elif charts_injected < total_placeholders:
        status        = "WARN"
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


# ── Chart render worker ───────────────────────────────────────────────

def _render_one(var: str, config_map: dict, bq,
                email_vars: dict | None = None) -> tuple:
    """
    Resolve variables → fetch from BQ → render.
    Returns (var, b64_or_None, cfg, error_str).
    """
    if var not in config_map:
        return (var, None, None, f"'{var}' not in chart_config_view")

    raw_cfg = config_map[var]
    try:
        cfg = resolve_cfg(raw_cfg, email_vars)
    except Exception as exc:
        return (var, None, raw_cfg, f"Variable resolution failed: {exc}")

    try:
        if USE_MOCK:
            df = _get_mock_df(cfg["chart_type"])
        else:
            sql = build_select(cfg)
            df  = bq.query(sql)
        if df.empty:
            return (var, None, cfg, "0 rows returned")
        b64 = render_chart(df, cfg)
        return (var, b64, cfg, "")
    except Exception as exc:
        return (var, None, cfg, str(exc))


# ── Main pipeline ─────────────────────────────────────────────────────

def process_emails(bq) -> list:
    """
    v15 pipeline — groups by (report_name, email_id).

    One HTML file per unique (report_name, email_id) combination.
    All chart {{PLACEHOLDER}} tokens rendered and injected into the
    single html_template in sort_position order.

    Flow:
      1. Build base runtime vars.
      2. JOIN email_list ⋈ chart_config_view on report_name.
      3. Group joined rows by (report_name, email_id).
      4. Per group:
           a. Build per-email variable context.
           b. Resolve html_template + subject.
           c. Build config_map from ALL chart rows.
           d. Find every {{PLACEHOLDER}} in template.
           e. Render all charts in parallel.
           f. Inject all images into single template.
           g. Save HTML file.
      5. Write results to email_output.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Base runtime vars
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

    # 2. JOIN query
    el_tbl  = resolve(EMAIL_LIST_TABLE,  runtime_vars)
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

    n_combos = joined_df.groupby(
        ["report_name", "email_id"]).ngroups if not joined_df.empty else 0
    print(f"  {len(joined_df)} row(s)  →  "
          f"{n_combos} (report × email_id) combination(s).\n")

    if joined_df.empty:
        print("  [WARN] JOIN returned 0 rows — nothing to process.")
        return []

    output_rows = []

    # 3. Group by (report_name, email_id)
    for (report_name, email_id), group in joined_df.groupby(
            ["report_name", "email_id"], sort=False):

        first = group.iloc[0]

        # 4a. Per-email variable context
        email_vars = {**runtime_vars, "email_id": str(email_id)}

        print(f"{'─'*62}")
        print(f"  report_name   : {report_name}")
        print(f"  email_id      : {email_id}")
        print(f"  recipient     : {first.get('recipient_email', '')}")
        print(f"  charts in grp : {len(group)}")

        # 4b. Resolve template + subject
        html_template = resolve(str(first["html_template"]), email_vars)
        subject       = resolve(str(first.get("subject", "")), email_vars)
        print(f"  subject       : {subject}")

        email_meta = {
            "email_id":        email_id,
            "report_name":     report_name,
            "recipient_email": str(first.get("recipient_email", "")),
            "subject":         subject,
        }

        # 4c. Build config_map from ALL chart rows in this group
        config_map: dict = {}
        for _, row in group.sort_values("sort_position").iterrows():
            cfg = parse_config(row.to_dict())
            config_map[cfg["variable_name"]] = cfg

        # 4d. Find ALL {{PLACEHOLDER}} tokens in template
        placeholders = find_placeholders(html_template)
        total        = len(placeholders)
        print(f"  placeholders  : {placeholders}")

        missing = [p for p in placeholders if p not in config_map]
        if missing:
            print(f"  [WARN] No chart_config_view row for: {missing}")

        for var in placeholders:
            if var in config_map:
                raw_f = config_map[var].get("filters", "")
                res_f = resolve(raw_f, email_vars)
                if raw_f != res_f:
                    print(f"    ↳ {var}  filter: {raw_f!r}  →  {res_f!r}")

        # 4e. Render ALL charts in parallel
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

        # 4f. Inject ALL images into single html_template
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

            html_template = html_template.replace(token, _img_block(b64, cfg))
            injected += 1
            print(f"  ✓ '{var}'  [{cfg['chart_type']}]"
                  f"  pos={cfg.get('sort_position','-')}"
                  f"  ({len(b64):,} chars)")

        # 4g. Save
        final_html = html_template
        safe_id    = re.sub(r"[^a-zA-Z0-9._-]", "_", str(email_id))
        out_path   = os.path.join(OUTPUT_DIR, f"{report_name}__{safe_id}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(final_html)
        print(f"\n  ✓ Saved  → {out_path}")

        row = build_output_row(email_meta, report_name, final_html,
                               injected, total, error_msg)
        output_rows.append(row)
        print(f"  ✓ Status : {row['status']}"
              f"  charts={row['charts_injected']}/{row['total_charts']}")

    # 5. Write to BigQuery (skipped in mock mode)
    if output_rows and not USE_MOCK:
        out_tbl = resolve(EMAIL_OUTPUT_TABLE, runtime_vars)
        print(f"\n{'─'*62}")
        print(f"► Writing {len(output_rows)} row(s) → {out_tbl}  ({WRITE_MODE})")
        bq.insert_rows(out_tbl, output_rows, write_mode=WRITE_MODE)
    elif output_rows and USE_MOCK:
        print(f"\n  [MOCK] Skipping BigQuery write ({len(output_rows)} row(s)).")

    return output_rows
