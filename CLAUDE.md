# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Visual test — renders all 18 chart types to a standalone HTML gallery (no BigQuery needed)
python chart_email_engine_v15.py --test
python chart_email_engine_v15.py --test --dark
python chart_email_engine_v15.py --test --out preview.html

# Production run — queries BigQuery and writes to output_emails/
python chart_email_engine_v15.py

# BigQuery setup (run in order)
bq query --use_legacy_sql=false < bigquery_setup_v15_schema.sql
bq query --use_legacy_sql=false < bigquery_setup_v15_data.sql
```

## Configuration (chart_email_engine_v15.py lines 72–101)

```python
SERVICE_ACCOUNT_KEY_FILE = "service_account_key.json"   # GCP service account JSON
PROJECT_ID      = "your-gcp-project-id"
EMAIL_LIST_TABLE  = "your_project.your_dataset.email_list"
CHART_CONFIG_VIEW = "your_project.your_dataset.chart_config_view"
EMAIL_OUTPUT_TABLE = "your_project.your_dataset.email_output"
USE_MOCK   = True          # True = no BQ needed; False = live queries
MAX_WORKERS = 4            # parallel chart render threads per email
TABLE_VARS  = {}           # global token overrides (lowest priority after filter_params)
```

## Architecture

### Pipeline (process_emails)
```
_build_runtime_vars()          → base tokens: {today}, {this_month}, {this_year},
                                   {this_quarter_year}, {last_quarter_year}, etc.
JOIN email_list ⋈ chart_config_view ON report_name
GROUP BY (report_name, recipient_email)
  Per group:
    _build_email_vars(runtime, filter_params)    → merge per-email JSON overrides
    resolve(html_template, email_vars)           → resolve {tokens} in subject + template
    ThreadPoolExecutor(MAX_WORKERS):
      _render_one(var, config_map, bq, email_vars)
        → resolve_cfg(cfg, email_vars)           → apply tokens to all config strings
        → build_select(cfg)                      → SQL: SELECT x,y FROM bq_table WHERE filters
        → fetch data (BQ or mock)
        → render chart → base64 PNG
    inject {{PLACEHOLDER}} → <img src="data:image/png;base64,...">
    write output_emails/{report_name}_{recipient_email}.html
    write row to email_output table
```

### Variable Resolution (lowest → highest priority)
1. Built-in tokens (`_build_runtime_vars`)
2. `TABLE_VARS` (global config dict)
3. `filter_params` JSON from `email_list` row (per-recipient overrides)

Tokens use single braces `{token}` in SQL filters, subjects, titles, subtitles.  
Template injection uses double braces `{{VARIABLE_NAME}}`.

### BigQuery Schema

**`email_list`** — one row per (report_name × recipient_email). The `html_template` field is the complete HTML body with `{{CHART_VAR}}` placeholders. `filter_params` is a JSON string or NULL.

**`chart_config_view`** — a VIEW, not a table. Each chart is a `SELECT` row joined by `UNION ALL`. Never insert into it; add charts by appending UNION ALL blocks. The `chart_config_ui.html` tool generates these rows.

**`email_output`** — written by the engine after rendering. One row per (report_name, recipient_email). Fields: `final_html`, `charts_injected`, `total_charts`, `status` (SUCCESS|WARN|FAILED), `error_message`, `processed_at`.

Source data lives in the `prod_reports` dataset (separate from the control dataset).

### Chart Types

**Core (Seaborn-backed):** `line`, `bar`, `pie`, `donut`, `area`, `hbar`, `scatter`, `combo`, `waterfall`, `sunburst`

**Seaborn-specific:** `line_seaborn`, `bar_seaborn`, `pie_seaborn`, `box_seaborn`, `violin_seaborn`, `heatmap_seaborn`, `hist_seaborn`, `kde_seaborn`

**Vega-Altair:** `line_altair`, `bar_altair`, `scatter_altair`, `heatmap_altair`, `area_altair`, `strip_altair`, `boxplot_altair`, `arc_altair`

Altair charts are converted to PNG via `vl_convert.vegalite_to_png()`.

### Rendering Infrastructure (shared across all chart types)
- `_tokens(dark)` — color palette and style constants
- `_palette(theme, n, dark)` — N-color list for named themes (blue, teal, vibrant, warm, cool, purple, slate, green, default)
- `_make_fig(w_px, h_px, dark)` — sized figure with consistent styling
- `_to_b64(fig)` — matplotlib fig → base64 PNG string
- `_smart_fmt(v)` — number formatting with K/M/B suffixes

### Key Design Constraints
- Engine only injects images; it never generates HTML structure. The `html_template` in `email_list` owns the entire layout.
- The engine does **not** send email — it outputs HTML files and writes to `email_output`.
- `combo` chart: first y_column = bars (left axis), second = line (right axis).
- `scatter` with 3 y_columns: `x, y, size_column[, hue_column]`.
- `waterfall` Delta=0 on the closing row signals the engine to compute the running total.
- `sunburst` with 2 y_columns: `value_column, child_label_column` (two-ring hierarchy).

### SQL Files
- `bigquery_setup_v15_schema.sql` — DDL only (CREATE TABLE/VIEW). Run first.
- `bigquery_setup_v15_data.sql` — INSERTs + verification queries. Run second.
- `bigquery_setup_v15.sql` — combined legacy file (schema + data together).
