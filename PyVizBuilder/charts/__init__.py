from typing import Optional

import pandas as pd

from .altair_renderers import (
    _line_altair,
    _bar_altair,
    _scatter_altair,
    _heatmap_altair,
    _area_altair,
    _strip_altair,
    _boxplot_altair,
    _arc_altair,
)

_RENDERERS = {
    "line_altair":    _line_altair,
    "bar_altair":     _bar_altair,
    "scatter_altair": _scatter_altair,
    "heatmap_altair": _heatmap_altair,
    "area_altair":    _area_altair,
    "strip_altair":   _strip_altair,
    "boxplot_altair": _boxplot_altair,
    "arc_altair":     _arc_altair,
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
