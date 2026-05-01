import io
import base64
import logging

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image
import altair as alt
import vl_convert as vlc


# ── Font setup ────────────────────────────────────────────────────────
logging.getLogger("matplotlib.font_manager").setLevel(logging.ERROR)

_FONT_STACK = [
    "Inter", "Segoe UI", "Helvetica Neue",
    "Arial", "DejaVu Sans", "sans-serif",
]
plt.rcParams["font.family"]        = _FONT_STACK
plt.rcParams["font.sans-serif"]    = _FONT_STACK
plt.rcParams["axes.unicode_minus"] = False


# ── Vega colour table ─────────────────────────────────────────────────
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

_ALT_THEME_MAP = {
    "blue":    "tableau10",  "cool":    "set1",
    "warm":    "set2",       "vibrant": "tableau10",
    "teal":    "dark2",      "green":   "set1",
    "purple":  "category20b","slate":   "tableau10",
    "default": "tableau10",  "rainbow": "tableau20",
}

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
    """First n hex colours matching what Vega renders for this theme."""
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
    return "#A7B4C8" if dark else "#667085"


def _alt_rule(dark: bool) -> str:
    return "#354154" if dark else "#D9DEE7"


def _alt_common(chart: alt.Chart, dark: bool) -> alt.Chart:
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
    """Render Vega-Lite spec to base64 PNG."""
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
    Compose Altair chart PNG with a pixel-perfect matplotlib legend strip.

    Vega-Lite's configure_legend places text/symbols at wrong Y positions
    when rendered headlessly via vl_convert. Fix: suppress legend in every
    Vega encoding, draw legend here as matplotlib strip composited below.
    """
    from matplotlib.patches import FancyBboxPatch as _FBP

    T_bg   = _alt_bg(dark)
    T_txt  = _alt_sub(dark)
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
    pad_l    = 0.014
    text_gap = 0.010

    ax.axhline(0.98, xmin=0.014, xmax=0.986, color=T_rule,
               linewidth=0.6, alpha=0.9)

    usable_frac = (nrows * row_h_px) / lh_px
    top_offset  = (pad_top / lh_px) / usable_frac if usable_frac > 0 else 0

    for idx, (lbl, clr) in enumerate(zip(labels, colours)):
        col   = idx % ncols
        row   = idx // ncols
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

    if lw != cw:
        bg_col = (17, 24, 39, 255) if dark else (250, 251, 252, 255)
        canvas = Image.new("RGBA", (cw, lhh), bg_col)
        canvas.paste(leg_img, (0, 0))
        leg_img = canvas
        lhh     = leg_img.size[1]

    combined = Image.new("RGBA", (cw, ch + lhh),
                          (17, 24, 39, 255) if dark else (250, 251, 252, 255))
    combined.paste(chart_img, (0, 0))
    combined.paste(leg_img,   (0, ch))

    buf2 = io.BytesIO()
    combined.convert("RGB").save(buf2, format="PNG")
    b64 = base64.b64encode(buf2.getvalue()).decode()
    buf2.close()
    return f"data:image/png;base64,{b64}"
