import io
import base64
import math

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import altair as alt
import vl_convert as vlc

from .altair_helpers import (
    _alt_scheme, _alt_colours, _alt_bg, _alt_text, _alt_grid,
    _alt_sub, _alt_rule, _alt_common, _alt_to_b64, _alt_title,
    _alt_compose, _smart_fmt,
)


def _line_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Multi-series line chart with optional confidence band.
    x_column  = ordinal/temporal x  |  y_columns = one or more series
    hue_column = long-form grouping column (single y_columns[0] as value)
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_cols  = cfg["y_columns"]
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

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
        layers = [base.mark_line(point=_pt, interpolate="monotone", strokeWidth=2.8)]
        if cfg["show_values"] and len(df) <= 50:
            layers.append(
                base.mark_text(dy=-14, fontSize=11, font="Arial", fontWeight="bold")
                    .encode(text=alt.Text(f"{y_col}:Q", format=",.0f"),
                            color=alt.value(_alt_text(dark)))
            )
        chart      = (alt.layer(*layers)
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
        layers = [base.mark_line(point=_pt, interpolate="monotone", strokeWidth=2.8)]
        if cfg["show_values"] and len(df_m) <= 50:
            layers.append(
                base.mark_text(dy=-14, fontSize=11, font="Arial", fontWeight="bold")
                    .encode(text=alt.Text("_value:Q", format=",.0f"),
                            color=alt.value(_alt_text(dark)))
            )
        chart      = (alt.layer(*layers)
                      .properties(title=_alt_title(cfg), width=w, height=h,
                                  background=_alt_bg(dark)))
        leg_labels = valid

    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    final       = _alt_common(chart, dark)
    png         = vlc.vegalite_to_png(final.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


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
    if y_col is None or y_col not in df.columns:
        return None

    sort_enc  = "-x" if cfg["sort_order"] == "desc" else (
                "x"  if cfg["sort_order"] == "asc"  else None)
    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
    )

    base = (
        alt.Chart(df)
        .mark_bar(cornerRadiusTopRight=5, cornerRadiusBottomRight=5, opacity=0.92)
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
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png         = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


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
    if y_col is None or y_col not in df.columns:
        return None

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
        encodings["color"] = alt.Color(f"{x_col}:N",
                                       scale=alt.Scale(scheme=scheme), legend=None)
    encodings["opacity"] = alt.value(0.72)
    if size_col and size_col in df.columns:
        encodings["size"] = alt.Size(f"{size_col}:Q",
                                     scale=alt.Scale(range=[45, 520]), legend=None)

    base   = alt.Chart(df).mark_circle(size=90).encode(**encodings)
    layers = [base]
    if cfg["show_values"] and x_col in df.columns and y_col in df.columns:
        txt_enc = {k: v for k, v in encodings.items()
                   if k not in ("opacity","strokeWidth","stroke","size")}
        layers.append(
            alt.Chart(df).mark_text(dy=-11, fontSize=11, font="Arial",
                                    color=_alt_text(dark))
            .encode(**txt_enc, text=alt.Text(f"{y_col}:Q", format=",.0f"))
        )
    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    png   = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if hue_col and hue_col in df.columns:
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _heatmap_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Rect heatmap with sequential colour scale.
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
    if y_col is None or y_col not in df.columns:
        return None

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

    base  = alt.layer(rect, text_layer) if text_layer else rect
    chart = (base
             .properties(title=_alt_title(cfg), width=w, height=h,
                         background=_alt_bg(dark)))
    chart = _alt_common(chart, dark)
    return _alt_to_b64(chart.to_json())


def _area_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Stacked area chart.
    x_column  = ordinal x  |  y_columns = series (melted to long-form)
    hue_column = long-form grouping (single y_columns[0] as value)
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
        valid      = [c for c in y_cols if c in df.columns]
        leg_labels = valid
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png         = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _strip_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Strip / jitter plot — individual data points per category.
    x_column   = category  |  y_columns[0] = numeric value
    hue_column = optional colour grouping
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_col   = cfg["y_columns"][0] if cfg["y_columns"] else None
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)
    if y_col is None or y_col not in df.columns:
        return None

    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
    )

    strip = (
        alt.Chart(df)
        .mark_circle(size=42, opacity=0.64, stroke=_alt_bg(dark), strokeWidth=0.6)
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
    png         = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _boxplot_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Box-and-whisker plot with outlier marks.
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
    if y_col is None or y_col not in df.columns:
        return None

    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
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
    png         = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _arc_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Pie / donut — matplotlib with leader-line labels per slice.

    Every slice gets an arrow from the slice edge to a stacked label
    showing  value  (pct%).  Labels on each side are Y-stacked so they
    never overlap regardless of slice size.
    Legend shows category names only (no values).

    x_column   = label col  |  y_columns[0] = value col
    y_columns[1] = 'donut'  → donut style
    sort_order = desc | asc | none
    """
    def _stack_y(items: list, min_sep: float) -> list:
        """
        items  — list of (natural_y, payload) sorted top→bottom.
        Returns list of (adjusted_y, payload) with min_sep guaranteed,
        spreading downward from the topmost natural position.
        """
        if not items:
            return []
        items = sorted(items, key=lambda x: -x[0])   # top first
        out   = [(items[0][0], items[0][1])]
        for nat_y, payload in items[1:]:
            prev  = out[-1][0]
            adj_y = min(nat_y, prev - min_sep)
            out.append((adj_y, payload))
        return out

    dark     = cfg.get("dark_mode", False)
    lbl_col  = cfg["x_column"]
    val_col  = cfg["y_columns"][0] if cfg["y_columns"] else None
    is_donut = len(cfg["y_columns"]) > 1 and str(cfg["y_columns"][1]).lower() == "donut"

    if val_col is None or val_col not in df.columns:
        return None

    if cfg["sort_order"] == "desc":
        df = df.sort_values(val_col, ascending=False).reset_index(drop=True)
    elif cfg["sort_order"] == "asc":
        df = df.sort_values(val_col, ascending=True).reset_index(drop=True)

    labels  = df[lbl_col].tolist()
    values  = [float(v) for v in df[val_col]]
    total   = sum(values)
    pcts    = [v / total * 100 for v in values]
    colours = _alt_colours(cfg["color_theme"], len(labels))

    bg  = _alt_bg(dark)
    fg  = _alt_text(dark)
    sub = _alt_sub(dark)

    dpi        = 150
    render_dpi = 300
    w_in = cfg["width_px"]  / dpi
    h_in = cfg["height_px"] / dpi

    fig, ax = plt.subplots(figsize=(w_in, h_in), dpi=render_dpi, facecolor=bg)
    ax.set_facecolor(bg)
    ax.set_aspect("equal")

    # ── Draw pie ──────────────────────────────────────────────────────
    wedges, _ = ax.pie(
        values,
        colors=colours,
        startangle=90,
        counterclock=False,
        wedgeprops=dict(linewidth=1.5, edgecolor=bg, antialiased=True),
        labels=None,
    )
    if is_donut:
        ax.add_patch(plt.Circle((0, 0), 0.46, fc=bg, zorder=10))

    # ── Collect slice midpoint data ───────────────────────────────────
    R_EDGE  = 1.06   # leader line starts just outside slice
    R_KINK  = 1.22   # radial segment end / horizontal segment start
    X_LABEL = 1.55   # x position of label text anchor

    right_items, left_items = [], []
    for wedge, val, pct, lbl, clr in zip(wedges, values, pcts, labels, colours):
        mid_deg = (wedge.theta1 + wedge.theta2) / 2
        rad     = math.radians(mid_deg)
        cx, cy  = math.cos(rad), math.sin(rad)
        val_str = f"{int(val):,}" if val >= 1000 else str(int(val))
        txt     = f"{val_str}  ({pct:.1f}%)"
        kink_y  = R_KINK * cy
        payload = (cx, cy, txt, clr)
        if cx >= 0:
            right_items.append((kink_y, payload))
        else:
            left_items.append((kink_y, payload))

    # 11pt @ 150 DPI ≈ 23px; axes y range ≈ 3.0 units over ~300px → 1 unit≈100px
    # min_sep = 0.28 ensures 11pt labels never touch after stacking
    stacked_right = _stack_y(right_items, min_sep=0.28)
    stacked_left  = _stack_y(left_items,  min_sep=0.28)

    # ── Draw leader lines + labels ────────────────────────────────────
    for adj_y, (cx, cy, txt, clr) in stacked_right + stacked_left:
        kink_x = R_KINK * cx
        kink_y = R_KINK * cy
        edge_x = R_EDGE * cx
        edge_y = R_EDGE * cy
        x_anc  = X_LABEL if cx >= 0 else -X_LABEL
        ha     = "left"  if cx >= 0 else "right"

        ax.plot([edge_x, kink_x], [edge_y, kink_y],
                color=sub, lw=0.85, zorder=5, solid_capstyle="round")
        ax.plot([kink_x, x_anc], [kink_y, adj_y],
                color=sub, lw=0.85, zorder=5, solid_capstyle="round")
        ax.text(x_anc + (0.05 if cx >= 0 else -0.05), adj_y,
                txt, ha=ha, va="center",
                fontsize=5.5, fontweight="bold",
                color=fg, fontfamily="Arial", zorder=6)

    # ── Title / subtitle ─────────────────────────────────────────────
    title    = cfg.get("title", "")
    subtitle = cfg.get("subtitle", "")
    if title:
        ax.text(0, 1.08, title,
                ha="left", va="bottom",
                fontsize=7, fontweight="bold",
                color=fg, fontfamily="Arial", zorder=7,
                transform=ax.transAxes)
    if subtitle:
        ax.text(0, 1.02, subtitle,
                ha="left", va="bottom",
                fontsize=5.5, color=sub,
                fontfamily="Arial", zorder=7,
                transform=ax.transAxes)

    # ── Legend — names only ───────────────────────────────────────────
    handles = [mpatches.Patch(facecolor=c, edgecolor="none", label=lbl)
               for c, lbl in zip(colours, labels)]
    ncols = min(4, len(handles))
    leg = ax.legend(
        handles=handles,
        loc="lower center",
        bbox_to_anchor=(0.5, -0.14),
        ncol=ncols,
        frameon=False,
        fontsize=6,
        handlelength=0.85,
        handleheight=0.65,
        handletextpad=0.45,
        columnspacing=1.1,
        borderpad=0,
    )
    for txt in leg.get_texts():
        txt.set_color(sub)

    ax.set_xlim(-2.1, 2.1)
    ax.set_ylim(-1.35, 1.35)
    ax.axis("off")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=render_dpi,
                bbox_inches="tight", facecolor=bg, pad_inches=0.12)
    plt.close(fig)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


# ─────────────────────────────────────────────────────────────────────────────
# Phase-2 chart types
# ─────────────────────────────────────────────────────────────────────────────

def _metric_card(df: pd.DataFrame, cfg: dict) -> str:
    """
    Grid of KPI cards (up to 4 per row), each spanning its cell at full width.
    Layout per card: label (top centre) | big value (centre) | delta % (below)
    Optional progress bar at card bottom when ref_line_value is set.

    x_column     = label col
    y_columns[0] = current value
    y_columns[1] = prior period value (optional — drives % delta)
    ref_line_value = target (progress bar)
    """
    dark     = cfg.get("dark_mode", False)
    lbl_col  = cfg["x_column"]
    y_cols   = cfg["y_columns"]
    val_col  = y_cols[0] if y_cols and y_cols[0] in df.columns else None
    prev_col = (y_cols[1] if len(y_cols) > 1 and y_cols[1] in df.columns
                else None)
    if val_col is None:
        return None

    bg     = _alt_bg(dark)
    fg     = _alt_text(dark)
    sub    = _alt_sub(dark)
    rule   = _alt_rule(dark)
    accent = _alt_colours(cfg["color_theme"], 1)[0]

    n     = len(df)
    ncols = min(n, 4)
    nrows = math.ceil(n / ncols)

    ref_str = cfg.get("ref_line_value", "")
    try:
        global_target = float(ref_str)
    except (ValueError, TypeError):
        global_target = None
    has_bar = global_target is not None

    title    = cfg.get("title", "")
    subtitle = cfg.get("subtitle", "")

    # Render at 3× logical pixels for crisp output
    dpi        = 200
    title_h_px = 80 if title else 0
    card_h_px  = max(cfg["height_px"], 240)
    total_h_px = card_h_px * nrows + title_h_px
    w_in       = cfg["width_px"] / dpi
    h_in       = total_h_px / dpi

    fig, axes = plt.subplots(
        nrows, ncols,
        figsize=(w_in, h_in),
        dpi=dpi * 3,
        facecolor=bg,
    )
    # Normalise to flat list
    if n == 1:
        axes_flat = [axes]
    elif nrows == 1:
        axes_flat = list(axes)
    else:
        axes_flat = [ax for row in axes for ax in row]

    for i, (_, row) in enumerate(df.iterrows()):
        ax = axes_flat[i]
        ax.set_facecolor(bg)
        ax.axis("off")

        val   = float(row[val_col])
        label = str(row[lbl_col]) if lbl_col in df.columns else ""

        # Rounded card border
        border = plt.Rectangle(
            (0.04, 0.04), 0.92, 0.92,
            fill=False, edgecolor=rule, linewidth=1.0,
            transform=ax.transAxes, clip_on=False,
        )
        ax.add_patch(border)

        # Label — top centre
        ax.text(0.50, 0.82, label,
                ha="center", va="center", transform=ax.transAxes,
                fontsize=10, color=sub, fontfamily="Arial")

        # Big value — centre
        ax.text(0.50, 0.56, _smart_fmt(val),
                ha="center", va="center", transform=ax.transAxes,
                fontsize=26, fontweight="bold", color=accent,
                fontfamily="Arial")

        # Delta — below value
        if prev_col:
            prev = float(row[prev_col])
            if prev != 0:
                delta_pct = (val - prev) / abs(prev) * 100
                arrow     = "▲" if delta_pct >= 0 else "▼"
                d_color   = "#22C55E" if delta_pct >= 0 else "#EF4444"
                ax.text(0.50, 0.32,
                        f"{arrow} {abs(delta_pct):.1f}% vs prior",
                        ha="center", va="center", transform=ax.transAxes,
                        fontsize=9.5, color=d_color, fontfamily="Arial")

        # Progress bar toward target — bottom of card
        if has_bar:
            pct = min(val / global_target, 1.0)
            ax.add_patch(plt.Rectangle(
                (0.08, 0.12), 0.84, 0.07,
                facecolor=rule, edgecolor="none",
                transform=ax.transAxes, clip_on=False))
            ax.add_patch(plt.Rectangle(
                (0.08, 0.12), 0.84 * pct, 0.07,
                facecolor=accent, edgecolor="none",
                transform=ax.transAxes, clip_on=False))

    # Hide surplus cells
    for j in range(n, len(axes_flat)):
        axes_flat[j].set_visible(False)

    # Title above grid — positions computed from title band fraction
    # so title and subtitle never overlap regardless of figure height.
    tf = title_h_px / total_h_px  # fraction of figure occupied by title band
    if title:
        fig.text(0.02, 1.0 - tf * 0.22, title,
                 ha="left", va="center",
                 fontsize=12, fontweight="bold", color=fg, fontfamily="Arial")
    if subtitle:
        fig.text(0.02, 1.0 - tf * 0.70, subtitle,
                 ha="left", va="center",
                 fontsize=9.5, color=sub, fontfamily="Arial")

    cards_top = 1.0 - tf
    plt.tight_layout(
        rect=[0, 0, 1, cards_top],
        pad=0.6, h_pad=0.8, w_pad=0.8,
    )

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi * 3,
                bbox_inches="tight", facecolor=bg, pad_inches=0.08)
    plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _table_chart(df: pd.DataFrame, cfg: dict) -> str:
    """
    Styled PNG table with heat-mapped numeric columns.
    x_column  = label col (left-aligned)
    y_columns = data cols to display
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_cols  = [c for c in cfg["y_columns"] if c in df.columns]

    bg     = _alt_bg(dark)
    fg     = _alt_text(dark)
    rule   = _alt_rule(dark)
    accent = _alt_colours(cfg["color_theme"], 1)[0]

    all_cols = ([x_col] + y_cols) if x_col in df.columns else y_cols
    df_show  = df[all_cols].head(20)
    n_rows, n_cols = len(df_show), len(all_cols)
    if n_rows == 0 or n_cols == 0:
        return None

    dpi  = 150
    w_in = cfg["width_px"] / dpi
    h_in = max(cfg["height_px"] / dpi, (n_rows + 1) * 0.34 + 0.9)

    fig, ax = plt.subplots(figsize=(w_in, h_in), dpi=dpi * 2, facecolor=bg)
    ax.set_facecolor(bg)
    ax.axis("off")

    heat: dict = {}
    for col in y_cols:
        try:
            vals = pd.to_numeric(df_show[col], errors="coerce").dropna()
            if len(vals) > 1:
                heat[col] = (float(vals.min()), float(vals.max()))
        except Exception:
            pass

    def _heat(col: str, v: float) -> str:
        if col not in heat:
            return bg
        lo, hi = heat[col]
        t = (v - lo) / (hi - lo) if hi != lo else 0.5
        if dark:
            return f"#{int(0x15+t*0x28):02x}{int(0x1e+t*0x40):02x}{int(0x30+t*0x60):02x}"
        return f"#{int(0xFF-t*0x35):02x}{int(0xFF-t*0x20):02x}{int(0xF0-t*0x10):02x}"

    cell_text, cell_color = [], []
    for _, row in df_show.iterrows():
        rtxt, rcol = [], []
        for col in all_cols:
            v = row[col]
            try:
                fv = float(v)
                rtxt.append(f"{fv:,.1f}" if fv != int(fv) else f"{int(fv):,}")
                rcol.append(_heat(col, fv))
            except (ValueError, TypeError):
                rtxt.append(str(v))
                rcol.append(bg)
        cell_text.append(rtxt)
        cell_color.append(rcol)

    tbl = ax.table(
        cellText=cell_text,
        colLabels=all_cols,
        cellColours=cell_color,
        colColours=[accent] * n_cols,
        loc="center",
        cellLoc="center",
    )
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(9)
    tbl.scale(1, 1.5)

    for (ri, ci), cell in tbl.get_celld().items():
        cell.set_edgecolor(rule)
        cell.set_linewidth(0.4)
        if ri == 0:
            cell.set_text_props(color="white", fontweight="bold")
            cell.set_facecolor(accent)
        else:
            cell.set_text_props(color=fg)
        if ci == 0:
            cell.get_text().set_ha("left")

    title    = cfg.get("title", "")
    subtitle = cfg.get("subtitle", "")
    if title:
        ax.set_title(
            f"{title}\n{subtitle}" if subtitle else title,
            loc="left", fontsize=12, fontweight="bold",
            color=fg, pad=10, fontfamily="Arial",
        )

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi * 2,
                bbox_inches="tight", facecolor=bg, pad_inches=0.1)
    plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _funnel_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Centred horizontal funnel (bars symmetric around 0).
    x_column    = stage label col
    y_columns[0] = value col
    sort_order  = none (default — preserve stage order) | desc | asc
    """
    dark    = cfg.get("dark_mode", False)
    lbl_col = cfg["x_column"]
    val_col = cfg["y_columns"][0] if cfg["y_columns"] else None
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

    if val_col is None or val_col not in df.columns:
        return None

    if cfg["sort_order"] == "desc":
        df = df.sort_values(val_col, ascending=False).reset_index(drop=True)
    elif cfg["sort_order"] == "asc":
        df = df.sort_values(val_col, ascending=True).reset_index(drop=True)

    df = df.copy()
    df["_x1"] = -df[val_col] / 2.0
    df["_x2"]  =  df[val_col] / 2.0
    df["_zero"] = 0.0
    max_half = float(df[val_col].max()) / 2.0 * 1.1

    x_scale = alt.Scale(domain=[-max_half, max_half])

    bar = (
        alt.Chart(df)
        .mark_bar(opacity=0.88, cornerRadius=3)
        .encode(
            y=alt.Y(f"{lbl_col}:N", sort=None,
                    axis=alt.Axis(title="", labelLimit=160,
                                  labelColor=_alt_text(dark))),
            x=alt.X("_x1:Q", scale=x_scale,
                    axis=alt.Axis(labels=False, grid=False, ticks=False,
                                  domain=False, title="")),
            x2=alt.X2("_x2:Q"),
            color=alt.Color(f"{lbl_col}:N",
                            scale=alt.Scale(scheme=scheme), legend=None),
            tooltip=[alt.Tooltip(f"{lbl_col}:N"),
                     alt.Tooltip(f"{val_col}:Q", format=",")],
        )
    )
    layers = [bar]

    if cfg["show_values"]:
        layers.append(
            alt.Chart(df)
            .mark_text(fontSize=11, font="Arial", fontWeight="bold")
            .encode(
                y=alt.Y(f"{lbl_col}:N", sort=None),
                x=alt.X("_zero:Q", scale=x_scale),
                text=alt.Text(f"{val_col}:Q", format=",.0f"),
                color=alt.value(_alt_text(dark)),
            )
        )

    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    png   = vlc.vegalite_to_png(chart.to_json(), scale=3)

    leg_labels  = df[lbl_col].tolist()
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _bullet_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Horizontal bar chart with a target rule line.
    x_column     = label col
    y_columns[0] = actual value
    ref_line_value = target
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    val_col = cfg["y_columns"][0] if cfg["y_columns"] else None
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

    if val_col is None or val_col not in df.columns:
        return None

    ref_str = cfg.get("ref_line_value", "")
    try:
        target = float(ref_str)
    except (ValueError, TypeError):
        target = None

    x_max = float(df[val_col].max())
    x_max = max(x_max, target) * 1.15 if target else x_max * 1.15

    x_scale   = alt.Scale(domain=[0, x_max])
    color_enc = alt.Color(f"{x_col}:N",
                          scale=alt.Scale(scheme=scheme), legend=None)

    bar = (
        alt.Chart(df)
        .mark_bar(cornerRadiusEnd=5, opacity=0.88)
        .encode(
            y=alt.Y(f"{x_col}:N", sort=None,
                    axis=alt.Axis(title="", labelLimit=140,
                                  labelColor=_alt_text(dark))),
            x=alt.X(f"{val_col}:Q", scale=x_scale,
                    axis=alt.Axis(format=",.0f", title=cfg.get("x_label", ""),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            color=color_enc,
            tooltip=[alt.Tooltip(f"{x_col}:N"),
                     alt.Tooltip(f"{val_col}:Q", format=",")],
        )
    )
    layers = [bar]

    if target is not None:
        ref_lbl = cfg.get("ref_line_label", "") or "Target"
        tdf = pd.DataFrame({"_t": [target], "_l": [ref_lbl]})
        layers.append(
            alt.Chart(tdf)
            .mark_rule(strokeWidth=2.5, strokeDash=[5, 3],
                       color=_alt_text(dark))
            .encode(x=alt.X("_t:Q", scale=x_scale))
        )
        layers.append(
            alt.Chart(tdf)
            .mark_text(dy=-9, fontSize=10, font="Arial",
                       align="center", color=_alt_sub(dark))
            .encode(x=alt.X("_t:Q", scale=x_scale),
                    text=alt.Text("_l:N"))
        )

    if cfg["show_values"]:
        layers.append(
            bar.mark_text(align="left", dx=5, fontSize=11,
                          font="Arial", fontWeight="bold")
            .encode(text=alt.Text(f"{val_col}:Q", format=",.0f"),
                    color=alt.value(_alt_text(dark)))
        )

    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    png   = vlc.vegalite_to_png(chart.to_json(), scale=3)

    leg_labels  = df[x_col].tolist()
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _grouped_bar_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Grouped vertical bar chart.
    x_column    = category
    y_columns[0] = value  |  hue_column = group
    OR y_columns = multiple series (auto-melted, no hue_column needed)
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_cols  = cfg["y_columns"]
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

    y_col = y_cols[0] if y_cols and y_cols[0] in df.columns else None
    if y_col is None:
        return None

    if not (hue_col and hue_col in df.columns) and len(y_cols) > 1:
        valid   = [c for c in y_cols if c in df.columns]
        df      = df[[x_col] + valid].melt(
            id_vars=x_col, var_name="_series", value_name="_value")
        y_col   = "_value"
        hue_col = "_series"

    color_enc = (
        alt.Color(f"{hue_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
        if hue_col and hue_col in df.columns
        else alt.Color(f"{x_col}:N", scale=alt.Scale(scheme=scheme), legend=None)
    )
    enc = dict(
        x=alt.X(f"{x_col}:N", sort=None,
                axis=alt.Axis(labelAngle=-30, title=cfg.get("x_label", ""),
                              labelColor=_alt_text(dark),
                              titleColor=_alt_text(dark))),
        y=alt.Y(f"{y_col}:Q",
                axis=alt.Axis(format=",.0f", title=cfg.get("y_label", ""),
                              labelColor=_alt_text(dark),
                              titleColor=_alt_text(dark))),
        color=color_enc,
        tooltip=[alt.Tooltip(f"{x_col}:N"),
                 alt.Tooltip(f"{y_col}:Q", format=",")],
    )
    if hue_col and hue_col in df.columns:
        enc["xOffset"] = alt.XOffset(f"{hue_col}:N")

    base = (
        alt.Chart(df)
        .mark_bar(cornerRadiusTopLeft=3, cornerRadiusTopRight=3, opacity=0.9)
        .encode(**enc)
    )
    layers = [base]
    if cfg["show_values"] and len(df) <= 60:
        layers.append(
            base.mark_text(dy=-8, fontSize=10, font="Arial", fontWeight="bold")
            .encode(text=alt.Text(f"{y_col}:Q", format=",.0f"),
                    color=alt.value(_alt_text(dark)))
        )

    chart = (
        alt.layer(*layers)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)
    png   = vlc.vegalite_to_png(chart.to_json(), scale=3)

    if hue_col and hue_col in df.columns:
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels = sorted(df[x_col].astype(str).unique().tolist())
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def _stacked_bar_altair(df: pd.DataFrame, cfg: dict) -> str:
    """
    Stacked vertical bar chart.
    x_column   = category
    y_columns  = series to stack  |  hue_column = group (long-form)
    OR y_columns = multiple series (auto-melted)
    """
    dark    = cfg.get("dark_mode", False)
    x_col   = cfg["x_column"]
    y_cols  = cfg["y_columns"]
    hue_col = cfg.get("hue_column", "")
    scheme  = _alt_scheme(cfg["color_theme"])
    w       = max(cfg["width_px"] - 60, 200)
    h       = max(cfg["height_px"] - 60, 120)

    if hue_col and hue_col in df.columns:
        y_col   = y_cols[0] if y_cols and y_cols[0] in df.columns else None
        df_plot = df
        series  = hue_col
    else:
        valid = [c for c in y_cols if c in df.columns]
        if not valid:
            return None
        df_plot = df[[x_col] + valid].melt(
            id_vars=x_col, var_name="_series", value_name="_value")
        y_col  = "_value"
        series = "_series"

    if y_col is None:
        return None

    base = (
        alt.Chart(df_plot)
        .mark_bar(cornerRadiusTopLeft=2, cornerRadiusTopRight=2, opacity=0.9)
        .encode(
            x=alt.X(f"{x_col}:N", sort=None,
                    axis=alt.Axis(labelAngle=-30, title=cfg.get("x_label", ""),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            y=alt.Y(f"{y_col}:Q", stack="zero",
                    axis=alt.Axis(format=",.0f", title=cfg.get("y_label", ""),
                                  labelColor=_alt_text(dark),
                                  titleColor=_alt_text(dark))),
            color=alt.Color(f"{series}:N",
                            scale=alt.Scale(scheme=scheme), legend=None),
            tooltip=[alt.Tooltip(f"{x_col}:N"),
                     alt.Tooltip(f"{series}:N"),
                     alt.Tooltip(f"{y_col}:Q", format=",")],
        )
    )

    chart = (
        alt.layer(base)
        .properties(title=_alt_title(cfg), width=w, height=h,
                    background=_alt_bg(dark))
    )
    chart = _alt_common(chart, dark)

    if hue_col and hue_col in df.columns:
        leg_labels = sorted(df[hue_col].unique().tolist(), key=str)
    else:
        leg_labels = [c for c in y_cols if c in df.columns]
    leg_colours = _alt_colours(cfg["color_theme"], len(leg_labels))
    png         = vlc.vegalite_to_png(chart.to_json(), scale=3)
    if cfg["legend"] and leg_labels:
        return _alt_compose(png, leg_labels, leg_colours, dark)
    return "data:image/png;base64," + base64.b64encode(png).decode()
