import re
from datetime import datetime, timezone, timedelta

from .config import TABLE_VARS


def _quarter(month: int) -> str:
    return f"Q{(month - 1) // 3 + 1}"


def _prev_quarter(year: int, month: int) -> tuple:
    q = (month - 1) // 3 + 1
    if q == 1:
        return year - 1, "Q4"
    return year, f"Q{q - 1}"


def _build_runtime_vars() -> dict:
    """
    Build base variable context shared by all emails in a run.
    Layering: built-in date/env tokens → TABLE_VARS.
    Per-email email_id is merged on top in process_emails().
    """
    now       = datetime.now(timezone.utc)
    y, m      = now.year, now.month
    today_str = now.strftime("%Y-%m-%d")

    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    tomorrow  = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    lm_year, lm_month = (y - 1, 12) if m == 1 else (y, m - 1)
    nm_year, nm_month = (y + 1,  1) if m == 12 else (y, m + 1)

    tq          = _quarter(m)
    lq_year, lq = _prev_quarter(y, m)
    nq_m        = {1:4, 2:4, 3:4, 4:7, 5:7, 6:7, 7:10, 8:10, 9:10, 10:1, 11:1, 12:1}[m]
    nq_year     = y + 1 if m >= 10 else y
    nq          = _quarter(nq_m)

    this_half      = "H1" if m <= 6 else "H2"
    last_half      = "H2" if m <= 6 else "H1"
    last_half_year = (y - 1) if m <= 6 else y

    iso_week      = now.isocalendar()[1]
    last_iso_week = (now - timedelta(weeks=1)).isocalendar()[1]

    auto: dict = {
        "today":              today_str,
        "yesterday":          yesterday,
        "tomorrow":           tomorrow,
        "this_day":           now.strftime("%d"),
        "this_weekday":       now.strftime("%A"),
        "this_weekday_short": now.strftime("%a"),
        "this_week":          f"W{iso_week:02d}",
        "last_week":          f"W{last_iso_week:02d}",
        "this_month":         now.strftime("%Y-%m"),
        "this_month_num":     now.strftime("%m"),
        "this_month_name":    now.strftime("%B"),
        "this_month_short":   now.strftime("%b"),
        "last_month":         f"{lm_year}-{lm_month:02d}",
        "last_month_num":     f"{lm_month:02d}",
        "last_month_name":    datetime(lm_year, lm_month, 1).strftime("%B"),
        "last_month_short":   datetime(lm_year, lm_month, 1).strftime("%b"),
        "next_month":         f"{nm_year}-{nm_month:02d}",
        "this_quarter":       tq,
        "last_quarter":       lq,
        "next_quarter":       nq,
        "this_quarter_year":  f"{tq}-{y}",
        "last_quarter_year":  f"{lq}-{lq_year}",
        "next_quarter_year":  f"{nq}-{nq_year}",
        "this_half":          this_half,
        "last_half":          last_half,
        "this_half_year":     f"{this_half}-{y}",
        "last_half_year":     f"{last_half}-{last_half_year}",
        "this_year":          str(y),
        "this_year_short":    now.strftime("%y"),
        "last_year":          str(y - 1),
        "last_year_short":    str(y - 1)[-2:],
        "next_year":          str(y + 1),
        "env":                "prod",
    }
    return {**auto, **TABLE_VARS}


def resolve(text: str, runtime_vars: dict | None = None) -> str:
    """
    Replace {key} tokens in text with matching variable values.
    Unknown keys left unchanged. One level of nested resolution.
    Case-insensitive key lookup.
    """
    if not text or "{" not in text:
        return text

    if runtime_vars is None:
        runtime_vars = _build_runtime_vars()

    _lower_map: dict | None = None

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
    Returns new dict — original not mutated.
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
