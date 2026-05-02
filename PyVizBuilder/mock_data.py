import numpy as np
import pandas as pd

_MOCK_DF_REGISTRY: dict | None = None


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
    """Build minimal cfg dict matching parse_config output."""
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
    months   = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"]
    quarters = ["Q1","Q2","Q3","Q4"]
    regions  = ["North","South","East","West","Central"]

    cases = []

    # ── 1. line_altair ──────────────────────────────────────────────
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

    # ── 2. bar_altair ───────────────────────────────────────────────
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

    # ── 3. scatter_altair ───────────────────────────────────────────
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

    # ── 4. heatmap_altair ───────────────────────────────────────────
    df_rows  = []
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

    # ── 5. area_altair ──────────────────────────────────────────────
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

    # ── 6. strip_altair ─────────────────────────────────────────────
    rng_b   = np.random.default_rng(13)
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

    # ── 7. boxplot_altair ───────────────────────────────────────────
    rng_c   = np.random.default_rng(21)
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

    # ── 8. arc_altair ───────────────────────────────────────────────
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

    # ── 9. metric_card ──────────────────────────────────────────────
    df = pd.DataFrame({
        "KPI":     ["Revenue", "Leads", "Deals Won", "Avg Deal"],
        "Current": [91000, 342, 47, 19361],
        "Prior":   [80100, 298, 41, 19537],
    })
    cases.append(("metric_card", df, _mock_cfg(
        "metric_card", "Q2 2026 KPIs", "vs Q1 2026",
        "KPI", ["Current", "Prior"],
        color_theme="blue", show_values=False, legend=False,
        ref_line_value="95000",
        width_px=900, height_px=280, dark_mode=dark)))

    # ── 10. table_chart ─────────────────────────────────────────────
    df = pd.DataFrame({
        "Region":    regions,
        "Revenue":   [91000, 72300, 58900, 83400, 49700],
        "Leads":     [342, 278, 195, 312, 168],
        "Conv %":    [13.7, 11.2, 8.9, 14.1, 7.3],
    })
    cases.append(("table_chart", df, _mock_cfg(
        "table_chart", "Regional Performance — Top 5", "YTD 2026",
        "Region", ["Revenue", "Leads", "Conv %"],
        color_theme="blue", show_values=False, legend=False,
        width_px=620, height_px=280, dark_mode=dark)))

    # ── 11. funnel_altair ───────────────────────────────────────────
    df = pd.DataFrame({
        "Stage": ["Awareness","Interest","Consideration","Intent","Conversion"],
        "Count": [12000, 7800, 4200, 1850, 620],
    })
    cases.append(("funnel_altair", df, _mock_cfg(
        "funnel_altair", "Sales Funnel — 2026", "Leads to close",
        "Stage", ["Count"],
        color_theme="vibrant", show_values=True, legend=True,
        sort_order="none", width_px=580, height_px=320, dark_mode=dark,
        x_label="Count")))

    # ── 12. bullet_altair ───────────────────────────────────────────
    df = pd.DataFrame({
        "Region":  regions,
        "Revenue": [91000, 72300, 58900, 83400, 49700],
    })
    cases.append(("bullet_altair", df, _mock_cfg(
        "bullet_altair", "Revenue vs Target by Region", "Target: $85,000",
        "Region", ["Revenue"],
        color_theme="teal", show_values=True, legend=True,
        ref_line_value="85000",
        width_px=580, height_px=300, dark_mode=dark,
        x_label="Revenue ($)")))

    # ── 13. grouped_bar_altair ──────────────────────────────────────
    df = pd.DataFrame({
        "Quarter": ["Q1","Q1","Q2","Q2","Q3","Q3","Q4","Q4"],
        "Segment": ["Enterprise","SMB"] * 4,
        "Revenue": [42000,18000, 55000,22000, 68000,28000, 80000,35000],
    })
    cases.append(("grouped_bar_altair", df, _mock_cfg(
        "grouped_bar_altair", "Revenue by Quarter & Segment", "Enterprise vs SMB · 2026",
        "Quarter", ["Revenue"],
        color_theme="blue", hue_column="Segment",
        show_values=True, legend=True, sort_order="none",
        width_px=620, height_px=340, dark_mode=dark,
        x_label="Quarter", y_label="Revenue ($)")))

    # ── 14. stacked_bar_altair ──────────────────────────────────────
    df_rows = []
    for q in quarters:
        for seg, base_k in [("Enterprise",{"Q1":42,"Q2":55,"Q3":68,"Q4":80}),
                             ("Mid-Market",{"Q1":28,"Q2":35,"Q3":41,"Q4":52}),
                             ("SMB",       {"Q1":18,"Q2":22,"Q3":28,"Q4":35})]:
            df_rows.append({"Quarter": q, "Segment": seg,
                             "Revenue": base_k[q] * 1000})
    df = pd.DataFrame(df_rows)
    cases.append(("stacked_bar_altair", df, _mock_cfg(
        "stacked_bar_altair", "Revenue by Quarter — Stacked", "By Segment · 2026",
        "Quarter", ["Revenue"],
        color_theme="vibrant", hue_column="Segment",
        show_values=False, legend=True, sort_order="none",
        width_px=620, height_px=340, dark_mode=dark,
        x_label="Quarter", y_label="Revenue ($)")))

    return cases


def _get_mock_df(chart_type: str) -> pd.DataFrame:
    """Return synthetic DataFrame for given chart_type."""
    global _MOCK_DF_REGISTRY
    if _MOCK_DF_REGISTRY is None:
        _MOCK_DF_REGISTRY = {label: df for label, df, _ in _build_mock_cases(dark=False)}
    df = _MOCK_DF_REGISTRY.get(chart_type)
    if df is None:
        raise ValueError(f"No mock data registered for chart_type={chart_type!r}")
    return df.copy()


def _build_mock_joined_df() -> pd.DataFrame:
    """
    Synthetic email_list ⋈ chart_config_view JOIN for all 8 Altair chart types.
    Same column set as live BQ JOIN — process_emails consumes it unchanged.
    """
    cases    = _build_mock_cases(dark=False)
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
            "group_email":     "N",
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
