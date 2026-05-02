# PyViz Chart Email Engine — Next Level Development Plan

## Current State Assessment

| Area | Status | Gap |
|------|--------|-----|
| Chart types | 8 Altair types | No KPI card, table, funnel, gauge |
| Output | HTML files only | Engine never sends email |
| Logging | All `print()` | No structured logs, no monitoring |
| Config | Hardcoded `config.py` | No env var / secrets support |
| Caching | None | Re-renders every run, even unchanged |
| Testing | Visual gallery only | No unit/integration tests |
| CLI | `--test/--dark/--out` only | No `--report`, `--dry-run`, `--email` |
| Parallelism | Per-chart within email | No parallelism across emails |

---

## Phase 1 — Production Hardening (High impact, low risk)

### 1.1 Structured Logging
Replace all `print()` in `engine.py`, `test_gallery.py`, `chart_email_engine_v15.py` with Python `logging`. Add `--log-level` CLI arg. JSON log format option for prod monitoring.

### 1.2 Env Var Config
`config.py` reads from `PYVIZ_*` env vars with fallback to defaults. Supports `.env` file via `python-dotenv`. Remove hardcoded `"your-gcp-project-id"` string from tracked file.

### 1.3 CLI Targeting Flags
```
--report REPORT_NAME   # run only matching report_name rows
--email EMAIL_ID       # run only specific email_id
--dry-run              # resolve vars + print SQL, skip BQ + render
--out-dir PATH         # override OUTPUT_DIR at runtime
```
Currently no way to test one report without running everything.

### 1.4 Retry on Render Failure
`_render_one()` has no retry. Add `max_retries=2` with exponential backoff for BQ timeouts and `vl_convert` transient failures.

---

## Phase 2 — New Chart Types

### 2.1 KPI Metric Card (`metric_card`)
Big number + optional sparkline + delta vs prior period. Most-requested type in email dashboards. Config: `y_columns[0]` = value, `y_columns[1]` (optional) = sparkline series, `ref_line_value` = target.

### 2.2 Styled Table (`table_chart`)
Top-N data table rendered as PNG. Color-coded rows by value. Replaces common use-case of pasting raw data into templates.

### 2.3 Funnel Chart (`funnel_altair`)
Stage-by-stage conversion. Altair-based. `x_column` = stage label, `y_columns[0]` = count.

### 2.4 Bullet / Progress Bar (`bullet_altair`)
Single-measure progress toward target. Common for KPI emails. `y_columns[0]` = actual, `ref_line_value` = target.

### 2.5 Grouped / Stacked Bar (`grouped_bar_altair`, `stacked_bar_altair`)
Currently `bar_altair` only does horizontal single-series. Grouped and stacked variants for multi-category comparisons.

---

## Phase 3 — Pipeline Capabilities

### 3.1 Email Delivery Integration
Add optional `PyVizBuilder/mailer.py` with pluggable backends:
- SMTP (built-in `smtplib`)
- SendGrid (`sendgrid` SDK)
- AWS SES (`boto3`)

Config:
```python
MAIL_BACKEND = "smtp"   # smtp | sendgrid | ses | none
MAIL_FROM    = "reports@company.com"
SMTP_HOST    = "smtp.office365.com"
```
`process_emails()` returns output rows — mailer reads them and sends. Sending is optional, off by default (`none`). This is the biggest functional gap.

### 3.2 Chart Render Cache
Cache key = `sha256(chart_type + resolved_bq_table + resolved_filters + x_column + y_columns + color_theme + dark_mode)`.
Cache store = `output_emails/.cache/{hash}.png`. Skip `vl_convert` and BQ if cache hit. TTL configurable (default 24h). Biggest perf win for daily re-runs.

### 3.3 Cross-Email Parallelism
Currently `ThreadPoolExecutor` is per-email for charts. Add outer parallelism: process N emails concurrently. Config: `EMAIL_WORKERS = 2` (separate from `MAX_WORKERS`).

### 3.4 Interactive HTML Mode
`--interactive` flag: embed Vega-Lite JSON inline instead of PNG. Produces clickable/zoomable charts for web dashboard view (not email). Toggle per report via `interactive` config field.

---

## Phase 4 — Testing & Reliability

### 4.1 Unit Test Suite
`tests/` directory with pytest:
- `test_vars.py` — `_build_runtime_vars()`, `resolve()`, `resolve_cfg()` token substitution
- `test_sql_builder.py` — `build_select()`, `parse_config()` edge cases (empty filters, multi y_columns)
- `test_engine.py` — `build_output_row()` status logic, `find_placeholders()`
- `test_renderers.py` — each Altair renderer with mock df → assert returns valid base64 string

### 4.2 Template Validator
Pre-flight check: scan `html_template` for `{{PLACEHOLDER}}` tokens with no matching `chart_config_view` row. Warn (not fail) on mismatch. Currently discovered late in pipeline after BQ query.

### 4.3 Data Schema Validation
After BQ query, validate df has required columns before passing to renderer. Currently `KeyError` deep in Altair code is the first indication of a schema mismatch.

---

## Priority Matrix

| Item | Impact | Effort | Ship Order |
|------|--------|--------|-----------|
| Env var config (1.2) | High | Low | 1 |
| CLI flags (1.3) | High | Low | 2 |
| Structured logging (1.1) | Medium | Low | 3 |
| KPI metric card (2.1) | High | Medium | 4 |
| Styled table (2.2) | High | Medium | 5 |
| Chart cache (3.2) | High | Medium | 6 |
| Email delivery (3.1) | High | High | 7 |
| Unit tests (4.1) | High | Medium | 8 |
| Template validator (4.2) | Medium | Low | 9 |
| Grouped/stacked bar (2.5) | Medium | Medium | 10 |
| Funnel chart (2.3) | Low | Medium | 11 |
| Bullet chart (2.4) | Low | Low | 12 |
| Cross-email parallelism (3.3) | Medium | Medium | 13 |
| Data schema validation (4.3) | Medium | Low | 14 |
| Interactive HTML (3.4) | Low | High | 15 |

---

## Suggested v16 Scope (items 1–6 + unit tests)

- Env vars + `.env` support
- `--report`, `--dry-run` CLI flags
- Structured logging
- KPI metric card + styled table chart types
- 24h render cache
- `tests/` with coverage on vars, sql_builder, engine logic

Everything else lands in v17+.
