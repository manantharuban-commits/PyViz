-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║   BigQuery Chart Engine  v15  —  Schema (DDL Only)                  ║
-- ║                                                                      ║
-- ║  CONTROL OBJECTS (YOUR_DATASET):                                     ║
-- ║    email_list        TABLE  — one row per dispatch (email_id)        ║
-- ║    chart_config_view VIEW   — UNION ALL SELECT; no INSERT needed     ║
-- ║    email_output      TABLE  — written by engine after rendering      ║
-- ║                                                                      ║
-- ║  GROUP KEY: (report_name, email_id)                                  ║
-- ║    One rendered HTML per unique combination.                         ║
-- ║    ALL charts for that report are injected in a single pass.         ║
-- ║                                                                      ║
-- ║  chart_config_view is a BigQuery VIEW.                               ║
-- ║    Each chart is a SELECT row joined by UNION ALL.                   ║
-- ║    Add / remove charts by editing the UNION ALL blocks.              ║
-- ║    bq_table must always be the full project.dataset.table path       ║
-- ║    (no {project} token — path is literal in the view).               ║
-- ║                                                                      ║
-- ║  VARIABLE RESOLUTION (lowest → highest priority):                    ║
-- ║    built-in tokens  →  TABLE_VARS  →  email_id                      ║
-- ║    Built-ins: {today} {yesterday} {this_month} {last_month}          ║
-- ║               {this_year} {last_year} {this_quarter} {last_quarter}  ║
-- ║               {this_quarter_year} {last_quarter_year} {env}          ║
-- ║    {email_id} resolves to the current dispatch's email_id value.     ║
-- ║                                                                      ║
-- ║  CHART TYPES (8 Vega-Altair only):                                   ║
-- ║    line_altair  bar_altair  scatter_altair  heatmap_altair            ║
-- ║    area_altair  strip_altair  boxplot_altair  arc_altair              ║
-- ║                                                                      ║
-- ║  SOURCE TABLES (prod_reports dataset — 14 tables):                   ║
-- ║    monthly_sales · monthly_pnl · region_revenue · region_monthly     ║
-- ║    category_quarterly · market_share · deal_performance              ║
-- ║    pnl_bridge · expense_breakdown · sales_distribution               ║
-- ║    region_revenue_seg · cost_sunburst · market_sunburst              ║
-- ║    monthly_revenue_2yr                                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════════════
-- 0.  REPLACE BEFORE RUNNING
-- ══════════════════════════════════════════════════════════════════════
--   YOUR_PROJECT_ID  →  e.g.  my-analytics-project
--   YOUR_DATASET     →  e.g.  chart_engine
--
-- Run in BigQuery Console or via bq CLI:
--   bq query --use_legacy_sql=false < bigquery_setup_v15_schema.sql
--
-- Datasets to create first if they don't exist:
--   bq mk --dataset YOUR_PROJECT_ID:YOUR_DATASET
--   bq mk --dataset YOUR_PROJECT_ID:prod_reports
--
-- Run this file first, then bigquery_setup_v15_data.sql
-- ══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- 1.  CONTROL TABLES
-- ══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1a.  email_list  (v15)
--
--      GROUP KEY: (report_name, email_id)
--      One HTML is produced per unique combination.
--      ALL chart {{PLACEHOLDER}} tokens for that report are rendered
--      and injected into the single html_template.
--
--      email_id:
--        Unique identifier for this dispatch.
--        Available as {email_id} token in filters, title, subtitle.
--        Engine groups by (report_name, email_id).
--
--      recipient_email:
--        Stored for reference / downstream email sending.
--        Not used for grouping or filtering by the engine.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
(
  email_id         STRING  NOT NULL,   -- unique dispatch key; used as {email_id} token
  report_name      STRING  NOT NULL,   -- FK → chart_config_view.report_name
  recipient_email  STRING  NOT NULL,   -- stored for reference / sending
  subject          STRING  NOT NULL,   -- supports {this_month} {email_id} etc.
  html_template    STRING  NOT NULL    -- full HTML body with {{VAR}} placeholders
)
OPTIONS (
  description = 'v15: one row per dispatch. Group key (report_name, email_id). '
                'email_id is available as {email_id} token in chart filters.'
);

-- ─────────────────────────────────────────────────────────────────────
-- 1b.  chart_config_view
--
--      This is a VIEW, not a table.
--      Each chart is a single SELECT row; new charts are added as
--      additional UNION ALL SELECT blocks — no INSERT statements needed.
--
--      COLUMNS (v15 — Vega-Altair renderers only):
--        bq_table      — full project.dataset.table path (no {project} token)
--        filters       — SQL WHERE clause body; supports built-in tokens
--                        e.g. "report_year = {this_year}"
--                             "email_id = '{email_id}'"
--        hue_column    — grouping column for colour split / series
--                        e.g. 'Region', 'Segment', 'Year'
--
--      Chart types (Vega-Altair only):
--        line_altair    bar_altair    scatter_altair  heatmap_altair
--        area_altair    strip_altair  boxplot_altair  arc_altair
--
--      To add a chart, append:
--        UNION ALL SELECT
--          '<report_name>', <sort_pos>, '<variable_name>', '<chart_type>',
--          '<bq_table>',    '<filters>',
--          '<x_column>',   '<y_columns>',   '<legend>',
--          '<title>',       '<subtitle>',
--          '<color_theme>', '<show_values>', '<sort_order>',
--           <width_px>,      <height_px>,
--          '<ref_line_value>', '<ref_line_label>',
--          '<x_label>',    '<y_label>',     '<dark_mode>',
--          '<hue_column>'
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` AS

-- ════════════════════════════════════════════════════════════════════
-- monthly_sales_report  (5 charts — Vega-Altair)
-- Filters use {this_year} built-in token
-- ════════════════════════════════════════════════════════════════════
SELECT
  'monthly_sales_report'                                    AS report_name,
  1                                                         AS sort_position,
  'R001_LINE_REVENUE'                                       AS variable_name,
  'line_altair'                                             AS chart_type,
  'YOUR_PROJECT_ID.prod_reports.monthly_sales'              AS bq_table,
  'report_year = {this_year}'                               AS filters,
  'Month'                                                   AS x_column,
  'Revenue,Target'                                          AS y_columns,
  'yes'                                                     AS legend,
  'Monthly Revenue vs Target'                               AS title,
  'Jan–Dec {this_year}'                                     AS subtitle,
  'blue'                                                    AS color_theme,
  'yes'                                                     AS show_values,
  'none'                                                    AS sort_order,
  620                                                       AS width_px,
  320                                                       AS height_px,
  ''                                                        AS ref_line_value,
  ''                                                        AS ref_line_label,
  ''                                                        AS x_label,
  'Revenue (USD)'                                           AS y_label,
  'no'                                                      AS dark_mode,
  ''                                                        AS hue_column

UNION ALL SELECT
  'monthly_sales_report', 2, 'R001_ARC_REGION', 'arc_altair',
  'YOUR_PROJECT_ID.prod_reports.region_revenue',
  'report_year = {this_year}',
  'Region', 'Revenue,donut', 'yes',
  'Revenue by Region', 'FY {this_year}',
  'vibrant', 'yes', 'desc',
  520, 380,
  '', '',
  '', '', 'no',
  ''

UNION ALL SELECT
  'monthly_sales_report', 3, 'R001_BAR_REGION', 'bar_altair',
  'YOUR_PROJECT_ID.prod_reports.region_revenue',
  'report_year = {this_year}',
  'Region', 'Revenue', 'no',
  'Revenue Ranking by Region', 'Sorted high to low — {this_year}',
  'teal', 'yes', 'desc',
  560, 300,
  '', '',
  'Revenue (USD)', '', 'no',
  ''

UNION ALL SELECT
  'monthly_sales_report', 4, 'R001_SCATTER_DEALS', 'scatter_altair',
  'YOUR_PROJECT_ID.prod_reports.deal_performance',
  'report_year = {this_year}',
  'DealSize', 'Revenue,Count', 'yes',
  'Deal Size vs Revenue', 'Bubble = deal count — {this_year}',
  'purple', 'no', 'none',
  580, 340,
  '', '',
  'Deal Size (USD)', 'Revenue (USD)', 'no',
  'Segment'

UNION ALL SELECT
  'monthly_sales_report', 5, 'R001_AREA_TREND', 'area_altair',
  'YOUR_PROJECT_ID.prod_reports.monthly_sales',
  'report_year = {this_year}',
  'Month', 'Revenue,Target', 'yes',
  'Revenue vs Target — Stacked Area', 'YTD {this_year}',
  'cool', 'no', 'none',
  620, 320,
  '', '',
  '', 'Revenue (USD)', 'no',
  ''

-- ════════════════════════════════════════════════════════════════════
-- product_analytics_report  (4 charts — Vega-Altair)
-- Uses built-in tokens — no per-dispatch overrides needed
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'product_analytics_report', 1, 'R002_HEATMAP_REGION', 'heatmap_altair',
  'YOUR_PROJECT_ID.prod_reports.region_monthly',
  'report_year = {this_year}',
  'Month', 'Revenue', 'no',
  'Revenue Heatmap — Region × Month', 'Darker = higher revenue · {this_year}',
  'blue', 'yes', 'none',
  640, 340,
  '', '',
  '', '', 'no',
  'Region'

UNION ALL SELECT
  'product_analytics_report', 2, 'R002_ARC_MARKET', 'arc_altair',
  'YOUR_PROJECT_ID.prod_reports.market_share',
  'report_year = {this_year}',
  'Segment', 'Share,donut', 'yes',
  'Market Share by Segment', 'As of {this_month}',
  'warm', 'yes', 'desc',
  500, 380,
  '', '',
  '', '', 'no',
  ''

UNION ALL SELECT
  'product_analytics_report', 3, 'R002_STRIP_DIST', 'strip_altair',
  'YOUR_PROJECT_ID.prod_reports.sales_distribution',
  'report_year = {this_year}',
  'Region', 'Revenue', 'yes',
  'Revenue Distribution by Region', 'Each dot = one record · median tick · {this_year}',
  'vibrant', 'no', 'none',
  620, 380,
  '', '',
  '', 'Revenue (USD)', 'no',
  'Segment'

UNION ALL SELECT
  'product_analytics_report', 4, 'R002_AREA_GROWTH', 'area_altair',
  'YOUR_PROJECT_ID.prod_reports.monthly_sales',
  'report_year = {this_year}',
  'Month', 'Revenue,Target', 'yes',
  'Cumulative Growth — Revenue vs Target', 'YTD · {this_month}',
  'blue', 'no', 'none',
  620, 320,
  '', '',
  '', 'USD', 'no',
  ''

-- ════════════════════════════════════════════════════════════════════
-- executive_pnl_report  (4 charts — Vega-Altair)
-- {last_quarter_year} is a built-in token
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'executive_pnl_report', 1, 'R003_BAR_PNL', 'bar_altair',
  'YOUR_PROJECT_ID.prod_reports.pnl_bridge',
  'period = ''{last_quarter_year}''',
  'Item', 'Delta', 'no',
  'P&L Bridge — {last_quarter_year}', 'Positive = gain · Negative = loss',
  'default', 'yes', 'none',
  620, 340,
  '', '',
  'USD', '', 'no',
  ''

UNION ALL SELECT
  'executive_pnl_report', 2, 'R003_LINE_REVCOS', 'line_altair',
  'YOUR_PROJECT_ID.prod_reports.monthly_pnl',
  'report_year = {this_year}',
  'Month', 'Revenue,Costs,GrossProfit', 'yes',
  'Revenue vs Costs — Monthly', 'Gross profit = Revenue − Costs · {this_year}',
  'green', 'yes', 'none',
  620, 320,
  '', '',
  '', 'USD', 'no',
  ''

UNION ALL SELECT
  'executive_pnl_report', 3, 'R003_BOX_DIST', 'boxplot_altair',
  'YOUR_PROJECT_ID.prod_reports.sales_distribution',
  'report_year = {this_year}',
  'Quarter', 'Revenue', 'yes',
  'Revenue Distribution by Quarter', 'Split by Segment · {this_year}',
  'warm', 'no', 'none',
  620, 400,
  '', '',
  '', 'Revenue (USD)', 'no',
  'Segment'

UNION ALL SELECT
  'executive_pnl_report', 4, 'R003_ARC_EXPENSE', 'arc_altair',
  'YOUR_PROJECT_ID.prod_reports.expense_breakdown',
  'period = ''{last_quarter_year}''',
  'ExpenseType', 'Amount', 'yes',
  'Expense Breakdown', '{last_quarter_year}',
  'slate', 'yes', 'desc',
  520, 380,
  '', '',
  '', '', 'no',
  ''

-- ════════════════════════════════════════════════════════════════════
-- altair_analytics_report  (8 charts — one of each Vega-Altair type)
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'altair_analytics_report', 1, 'ALT_LINE', 'line_altair',
  'YOUR_PROJECT_ID.prod_reports.monthly_revenue_2yr',
  'report_year = {this_year}',
  'Month', 'Revenue', 'yes',
  'Revenue Trend by Year (Altair Line)', '2025 vs {this_year} overlay',
  'blue', 'yes', 'none', 620, 320, '', '',
  '', 'Revenue (USD)', 'no',
  'Year'

UNION ALL SELECT
  'altair_analytics_report', 2, 'ALT_BAR', 'bar_altair',
  'YOUR_PROJECT_ID.prod_reports.region_revenue',
  'report_year = {this_year}',
  'Region', 'Revenue', 'no',
  'Revenue by Region (Altair Bar)', 'Sorted high to low · {this_year}',
  'teal', 'yes', 'desc', 560, 300, '', '',
  'Revenue (USD)', '', 'no',
  ''

UNION ALL SELECT
  'altair_analytics_report', 3, 'ALT_SCATTER', 'scatter_altair',
  'YOUR_PROJECT_ID.prod_reports.deal_performance',
  'report_year = {this_year}',
  'DealSize', 'Revenue,Count', 'yes',
  'Deal Size vs Revenue (Altair Scatter)', 'Bubble = deal count · {this_year}',
  'purple', 'no', 'none', 580, 340, '', '',
  'Deal Size (USD)', 'Revenue (USD)', 'no',
  'Segment'

UNION ALL SELECT
  'altair_analytics_report', 4, 'ALT_HEATMAP', 'heatmap_altair',
  'YOUR_PROJECT_ID.prod_reports.region_monthly',
  'report_year = {this_year}',
  'Month', 'Revenue', 'yes',
  'Revenue Heatmap — Region × Month (Altair)', 'Darker = higher · {this_year}',
  'blue', 'yes', 'none', 640, 340, '', '',
  '', '', 'no',
  'Region'

UNION ALL SELECT
  'altair_analytics_report', 5, 'ALT_AREA', 'area_altair',
  'YOUR_PROJECT_ID.prod_reports.monthly_sales',
  'report_year = {this_year}',
  'Month', 'Revenue,Target', 'yes',
  'Revenue vs Target — Stacked Area (Altair)', 'YTD · {this_year}',
  'cool', 'no', 'none', 620, 320, '', '',
  '', 'Revenue (USD)', 'no',
  ''

UNION ALL SELECT
  'altair_analytics_report', 6, 'ALT_STRIP', 'strip_altair',
  'YOUR_PROJECT_ID.prod_reports.sales_distribution',
  'report_year = {this_year}',
  'Region', 'Revenue', 'yes',
  'Revenue Distribution — Strip Plot (Altair)', 'Each dot = one record · median tick · {this_year}',
  'vibrant', 'no', 'none', 620, 380, '', '',
  '', 'Revenue (USD)', 'no',
  'Segment'

UNION ALL SELECT
  'altair_analytics_report', 7, 'ALT_BOX', 'boxplot_altair',
  'YOUR_PROJECT_ID.prod_reports.sales_distribution',
  'report_year = {this_year}',
  'Quarter', 'Revenue', 'yes',
  'Revenue by Quarter — Box Plot (Altair)', 'Split by Segment · {this_year}',
  'warm', 'no', 'none', 620, 400, '', '',
  '', 'Revenue (USD)', 'no',
  'Segment'

UNION ALL SELECT
  'altair_analytics_report', 8, 'ALT_ARC', 'arc_altair',
  'YOUR_PROJECT_ID.prod_reports.market_share',
  'report_year = {this_year}',
  'Segment', 'Share,donut', 'yes',
  'Market Share — Donut Arc (Altair)', 'As of {this_month}',
  'vibrant', 'yes', 'desc', 520, 380, '', '',
  '', '', 'no',
  ''
;


-- ─────────────────────────────────────────────────────────────────────
-- 1c.  email_output  (written by the engine after rendering)
--      GROUP KEY: (report_name, email_id)
--      One row written per unique (report_name, email_id) combination.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.YOUR_DATASET.email_output`
(
  email_id         STRING,
  report_name      STRING,
  recipient_email  STRING,
  subject          STRING,
  final_html       STRING,
  charts_injected  INT64,
  total_charts     INT64,
  status           STRING,     -- SUCCESS | WARN | FAILED
  error_message    STRING,
  processed_at     TIMESTAMP
)
OPTIONS (description = 'v15: one row per (report_name, email_id). Written by chart engine.');


-- ══════════════════════════════════════════════════════════════════════
-- 2.  ENGINE JOIN QUERY  (reference — engine runs this at runtime)
-- ══════════════════════════════════════════════════════════════════════
--
--  Groups by (report_name, email_id).
--  One HTML per unique combination.
--  ALL chart_config_view rows for that report are included.
--
--  SELECT
--    el.email_id,
--    el.report_name,
--    el.recipient_email,
--    el.subject,
--    el.html_template,
--    cc.sort_position,
--    cc.variable_name,
--    cc.chart_type,
--    cc.bq_table,
--    cc.filters,
--    cc.x_column,
--    cc.y_columns,
--    cc.legend,
--    cc.title,
--    cc.subtitle,
--    cc.color_theme,
--    cc.show_values,
--    cc.sort_order,
--    cc.width_px,
--    cc.height_px,
--    cc.ref_line_value,
--    cc.ref_line_label,
--    cc.x_label,
--    cc.y_label,
--    cc.dark_mode,
--    cc.hue_column
--  FROM   `YOUR_PROJECT_ID.YOUR_DATASET.email_list`        el
--  JOIN   `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` cc
--         USING (report_name)
--  ORDER  BY el.report_name, el.email_id, cc.sort_position;
--


-- ══════════════════════════════════════════════════════════════════════
-- 3.  SOURCE DATA TABLES  (prod_reports dataset — CREATE only)
-- ══════════════════════════════════════════════════════════════════════

-- ── 3a. monthly_sales ─────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.monthly_sales`
(
  report_year  INT64   NOT NULL,
  Month        STRING  NOT NULL,
  Revenue      INT64   NOT NULL,
  Target       INT64   NOT NULL,
  Units        INT64   NOT NULL
);

-- ── 3b. monthly_pnl ───────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.monthly_pnl`
(
  report_year  INT64   NOT NULL,
  Month        STRING  NOT NULL,
  Revenue      INT64   NOT NULL,
  Costs        INT64   NOT NULL,
  GrossProfit  INT64   NOT NULL
);

-- ── 3c. region_revenue ────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.region_revenue`
(
  report_year  INT64   NOT NULL,
  Region       STRING  NOT NULL,
  Revenue      INT64   NOT NULL
);

-- ── 3d. category_quarterly ────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.category_quarterly`
(
  fiscal_year  INT64   NOT NULL,
  Category     STRING  NOT NULL,
  Q1           INT64   NOT NULL,
  Q2           INT64   NOT NULL,
  Q3           INT64   NOT NULL,
  Q4           INT64   NOT NULL
);

-- ── 3e. market_share ──────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.market_share`
(
  report_year  INT64    NOT NULL,
  Segment      STRING   NOT NULL,
  Share        FLOAT64  NOT NULL
);

-- ── 3f. market_sunburst ───────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.market_sunburst`
(
  report_year  INT64   NOT NULL,
  Segment      STRING  NOT NULL,   -- inner ring (parent)
  SubSegment   STRING  NOT NULL,   -- outer ring (child)
  Revenue      INT64   NOT NULL
);

-- ── 3g. deal_performance ──────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.deal_performance`
(
  report_year  INT64   NOT NULL,
  DealSize     INT64   NOT NULL,
  Revenue      INT64   NOT NULL,
  Count        INT64   NOT NULL,
  Segment      STRING  NOT NULL
);

-- ── 3h. pnl_bridge ────────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.pnl_bridge`
(
  period  STRING  NOT NULL,   -- e.g. 'Q1-2026'
  Item    STRING  NOT NULL,
  Delta   INT64   NOT NULL
);

-- ── 3i. cost_sunburst ─────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.cost_sunburst`
(
  period        STRING  NOT NULL,
  CostCategory  STRING  NOT NULL,
  CostItem      STRING  NOT NULL,
  Amount        INT64   NOT NULL
);

-- ── 3j. expense_breakdown ─────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.expense_breakdown`
(
  period       STRING  NOT NULL,
  ExpenseType  STRING  NOT NULL,
  Amount       INT64   NOT NULL
);

-- ── 3k. region_revenue_seg ────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.region_revenue_seg`
(
  report_year  INT64   NOT NULL,
  Region       STRING  NOT NULL,
  Segment      STRING  NOT NULL,
  Revenue      INT64   NOT NULL
);

-- ── 3l. sales_distribution  (strip / boxplot) ─────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.sales_distribution`
(
  report_year  INT64   NOT NULL,
  Region       STRING  NOT NULL,
  Quarter      STRING  NOT NULL,
  Segment      STRING  NOT NULL,
  Revenue      INT64   NOT NULL
);

-- ── 3m. region_monthly  (heatmap) ────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.region_monthly`
(
  report_year  INT64   NOT NULL,
  Region       STRING  NOT NULL,
  Month        STRING  NOT NULL,
  Revenue      INT64   NOT NULL
);

-- ── 3n. monthly_revenue_2yr  (line_altair two-year overlay) ──────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.monthly_revenue_2yr`
(
  report_year  INT64   NOT NULL,
  Month        STRING  NOT NULL,
  Revenue      INT64   NOT NULL,
  Year         STRING  NOT NULL   -- '2025' or '2026'
);
