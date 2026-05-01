def build_select(cfg: dict) -> str:
    """
    Build SELECT … FROM … WHERE … for a single chart.
    cfg.filters must already be resolved against per-email variable context.
    """
    y_cols   = cfg["y_columns"][:]
    all_cols = [cfg["x_column"]] + y_cols
    uniq     = list(dict.fromkeys(all_cols))
    sql      = f"SELECT {', '.join(uniq)}\nFROM   `{cfg['bq_table']}`"
    f        = cfg.get("filters", "").strip()
    if f:
        sql += f"\nWHERE  {f}"
    return sql


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
        "hue_column":     str(row.get("hue_column", "")).strip(),
        "seaborn_style":  str(row.get("seaborn_style", "whitegrid")).strip(),
    }
