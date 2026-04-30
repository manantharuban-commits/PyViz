-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║   BigQuery Chart Engine  v15  —  Database Setup & Seed Data         ║
-- ║                                                                      ║
-- ║  CONTROL OBJECTS (YOUR_DATASET):                                     ║
-- ║    email_list        TABLE  — one row per (report × recipient)       ║
-- ║    chart_config_view VIEW   — UNION ALL SELECT; no table, no INSERT  ║
-- ║    email_output      TABLE  — written by engine after rendering      ║
-- ║                                                                      ║
-- ║  chart_config_view is a BigQuery VIEW.                               ║
-- ║    Each chart is a SELECT row joined by UNION ALL.                   ║
-- ║    Add / remove charts by editing the UNION ALL blocks.              ║
-- ║    Use chart_config_ui.html to generate the SQL rows.                ║
-- ║                                                                      ║
-- ║  email_list.filter_params (JSON):                                    ║
-- ║    Per-recipient variable overrides.                                 ║
-- ║    chart_config_view.filters uses {token} placeholders:              ║
-- ║      filters = "report_year={report_year}"                           ║
-- ║    Resolved at runtime: filter_params > TABLE_VARS > built-ins.      ║
-- ║                                                                      ║
-- ║  GROUP KEY: (report_name, recipient_email)                           ║
-- ║    One rendered HTML per unique combination.                         ║
-- ║    ALL charts for that report are injected in a single pass.         ║
-- ║                                                                      ║
-- ║  SEED DATA — 3 reports × 5 recipient dispatches:                     ║
-- ║    monthly_sales_report     — 2 dispatches (2026 + 2025 archive)    ║
-- ║    product_analytics_report — 1 dispatch                             ║
-- ║    executive_pnl_report     — 2 dispatches (Q1-2026 + Q4-2025)      ║
-- ║                                                                      ║
-- ║  SOURCE TABLES (prod_reports dataset — 10 tables):                   ║
-- ║    monthly_sales · monthly_pnl · region_revenue                      ║
-- ║    category_quarterly · market_share · market_sunburst               ║
-- ║    deal_performance · pnl_bridge · cost_sunburst · expense_breakdown  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════════════
-- 0.  REPLACE BEFORE RUNNING
-- ══════════════════════════════════════════════════════════════════════
--   YOUR_PROJECT_ID  →  e.g.  my-analytics-project
--   YOUR_DATASET     →  e.g.  chart_engine
--
-- Run in BigQuery Console (paste entire file) or via bq CLI:
--   bq query --use_legacy_sql=false < bigquery_setup_v13.sql
--
-- Datasets to create first if they don't exist:
--   bq mk --dataset YOUR_PROJECT_ID:YOUR_DATASET
--   bq mk --dataset YOUR_PROJECT_ID:prod_reports
-- ══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- 1.  CONTROL TABLES
-- ══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1a.  email_list  (v13)
--
--      GROUP KEY: (report_name, recipient_email)
--      One HTML is produced per unique combination.
--      ALL chart {{PLACEHOLDER}} tokens for that report are rendered
--      and injected into the single html_template.
--
--      REMOVED:  email_id     — grouping is now (report_name, recipient_email)
--      REMOVED:  sender_email — only the recipient is tracked
--
--      filter_params (JSON):
--        Per-recipient variable overrides.
--        {"report_year":"2026","region":"North"}
--        Resolved into chart_config_view.filters at runtime.
--        Priority: filter_params > TABLE_VARS > built-in tokens.
--        NULL = use default runtime tokens.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
(
  report_name      STRING  NOT NULL,   -- FK → chart_config_view.report_name
  recipient_email  STRING  NOT NULL,   -- the only address field
  subject          STRING  NOT NULL,   -- supports {this_month} etc.
  html_template    STRING  NOT NULL,   -- body HTML with {{VAR}} placeholders
  filter_params    STRING             -- JSON: {"report_year":"2026"}
                                       -- NULL = use default runtime tokens
)
OPTIONS (
  description = 'v13: one row per (report_name, recipient_email). '
                'No email_id, no sender_email. '
                'filter_params provides per-recipient variable overrides.'
);

INSERT INTO `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
  (report_name, recipient_email, subject, html_template, filter_params)
VALUES

-- ── monthly_sales_report — dispatch 1: current year (2026) ───────────
('monthly_sales_report',
 'sales-team@company.com',
 'Monthly Sales Performance — {this_month}',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Sales Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'Your monthly performance summary for {this_month} ({report_year}) is enclosed.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Trend vs Target</div>',
   '{{R001_LINE_REVENUE}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue by Region</div>',
   '{{R001_PIE_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Top Regions Ranked</div>',
   '{{R001_HBAR_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Deal Size vs Revenue</div>',
   '{{R001_SCATTER_DEALS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue &amp; Units Combo</div>',
   '{{R001_COMBO_UNITS}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 ),
 '{"report_year":"2026"}'
),

-- ── monthly_sales_report — dispatch 2: prior year archive (2025) ──────
--    Same report_name, different recipient_email → separate HTML output.
--    filter_params overrides report_year to 2025 for all charts.
('monthly_sales_report',
 'sales-archive@company.com',
 'Monthly Sales Performance — 2025 (Archive)',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Sales Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'This is the archived 2025 full-year performance report for comparison.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Trend vs Target (2025)</div>',
   '{{R001_LINE_REVENUE}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue by Region (2025)</div>',
   '{{R001_PIE_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Top Regions Ranked (2025)</div>',
   '{{R001_HBAR_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Deal Size vs Revenue (2025)</div>',
   '{{R001_SCATTER_DEALS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue &amp; Units Combo (2025)</div>',
   '{{R001_COMBO_UNITS}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 ),
 '{"report_year":"2025"}'
),

-- ── product_analytics_report — dispatch 1 (NULL filter_params) ────────
('product_analytics_report',
 'product-team@company.com',
 'Product & Category Analytics — {this_quarter_year}',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Product Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'The quarterly product breakdown for {this_quarter_year} is ready.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Quarterly Sales by Category</div>',
   '{{R002_BAR_CATEGORY}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Market Share — Sunburst</div>',
   '{{R002_SUNBURST_MARKET}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Market Share by Segment</div>',
   '{{R002_DONUT_MARKET}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Category Growth Area</div>',
   '{{R002_AREA_GROWTH}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 ),
 NULL
),

-- ── executive_pnl_report — dispatch 1: Q1-2026 ───────────────────────
('executive_pnl_report',
 'leadership@company.com',
 'Executive P&L Summary — Q1-2026',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Leadership Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'The executive P&amp;L for {quarter_label} is enclosed.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">P&amp;L Bridge</div>',
   '{{R003_WATERFALL_PNL}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Cost Structure Sunburst</div>',
   '{{R003_SUNBURST_COST}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue vs Costs — Monthly</div>',
   '{{R003_LINE_REVCOS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Expense Breakdown</div>',
   '{{R003_PIE_EXPENSE}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 ),
 '{"last_quarter_year":"Q1-2026","quarter_label":"Q1-2026","report_year":"2026"}'
),

-- ── executive_pnl_report — dispatch 2: Q4-2025 (board@) ──────────────
--    Same report_name + different recipient → separate HTML.
('executive_pnl_report',
 'board@company.com',
 'Executive P&L Summary — Q4-2025 (Board Pack)',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Board Members,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'The Q4-2025 P&amp;L pack is enclosed for board review.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">P&amp;L Bridge — Q4-2025</div>',
   '{{R003_WATERFALL_PNL}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Cost Structure Sunburst — Q4-2025</div>',
   '{{R003_SUNBURST_COST}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue vs Costs (Full Year 2025)</div>',
   '{{R003_LINE_REVCOS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Expense Breakdown — Q4-2025</div>',
   '{{R003_PIE_EXPENSE}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 ),
 '{"last_quarter_year":"Q4-2025","quarter_label":"Q4-2025","report_year":"2025"}'
);

-- ─────────────────────────────────────────────────────────────────────
-- 1b.  chart_config_view
--
--      This is a VIEW, not a table.
--      Each chart is a single SELECT row; new charts are added as
--      additional UNION ALL SELECT blocks — no INSERT statements needed.
--
--      COLUMNS (v14 — all renderers Seaborn-powered):
--        hue_column    — grouping column for colour split / hue
--                        e.g. 'Region', 'Segment', 'Category'
--                        Works for all chart types.
--        seaborn_style — Seaborn theme: whitegrid|darkgrid|ticks|white
--                        Default: whitegrid
--
--      Core chart types (all Seaborn-powered in v14):
--        line  bar  pie  donut  area  hbar  scatter  combo  waterfall  sunburst
--
--      Vega-Altair chart types (v14+):
--        line_altair  bar_altair  scatter_altair  heatmap_altair
--        area_altair  strip_altair  boxplot_altair  arc_altair
--
--      Seaborn-specific chart types (additional statistical charts):
--        line_seaborn  bar_seaborn  pie_seaborn  box_seaborn
--        violin_seaborn  heatmap_seaborn  hist_seaborn  kde_seaborn
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
--          '<hue_column>', '<seaborn_style>'
--
--      Use the Chart Config UI (chart_config_ui.html) to generate rows.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` AS

-- ════════════════════════════════════════════════════════════════════
-- monthly_sales_report  (5 charts — all Seaborn-powered)
-- {report_year} resolved per-recipient from email_list.filter_params
-- ════════════════════════════════════════════════════════════════════
SELECT
  'monthly_sales_report'                       AS report_name,
  1                                            AS sort_position,
  'R001_LINE_REVENUE'                          AS variable_name,
  'line'                                       AS chart_type,
  '{project}.prod_reports.monthly_sales'      AS bq_table,
  'report_year={report_year}'                 AS filters,
  'Month'                                     AS x_column,
  'Revenue,Target'                            AS y_columns,
  'yes'                                       AS legend,
  'Monthly Revenue vs Target'                 AS title,
  'Jan–Dec {report_year}'                     AS subtitle,
  'blue'                                      AS color_theme,
  'no'                                        AS show_values,
  'none'                                      AS sort_order,
  620                                          AS width_px,
  310                                          AS height_px,
  '70000'                                     AS ref_line_value,
  'Monthly Target'                            AS ref_line_label,
  ''                                          AS x_label,
  'Revenue (USD)'                             AS y_label,
  'no'                                        AS dark_mode,
  ''                                          AS hue_column,
  'whitegrid'                                 AS seaborn_style

UNION ALL SELECT
  'monthly_sales_report', 2, 'R001_PIE_REGION', 'pie',
  '{project}.prod_reports.region_revenue', 'report_year={report_year}',
  'Region', 'Revenue', 'yes',
  'Revenue by Region', 'FY {report_year}',
  'vibrant', 'yes', 'desc',
  520, 360,
  '', '',
  '', '', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'monthly_sales_report', 3, 'R001_HBAR_REGION', 'hbar',
  '{project}.prod_reports.region_revenue', 'report_year={report_year}',
  'Region', 'Revenue', 'no',
  'Revenue Ranking by Region', 'Sorted high to low — {report_year}',
  'teal', 'yes', 'desc',
  560, 290,
  '', '',
  'Revenue (USD)', '', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'monthly_sales_report', 4, 'R001_SCATTER_DEALS', 'scatter',
  '{project}.prod_reports.deal_performance', 'report_year={report_year}',
  'DealSize', 'Revenue,Count,Segment', 'yes',
  'Deal Size vs Revenue', 'Bubble = deal count · {this_quarter_year}',
  'purple', 'no', 'none',
  560, 310,
  '', '',
  'Deal Size (USD)', 'Revenue (USD)', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'monthly_sales_report', 5, 'R001_COMBO_UNITS', 'combo',
  '{project}.prod_reports.monthly_sales', 'report_year={report_year}',
  'Month', 'Revenue,Units', 'yes',
  'Revenue vs Units Sold', 'Bars = Revenue  /  Line = Units · {report_year}',
  'blue', 'no', 'none',
  620, 320,
  '', '',
  '', 'Revenue (USD)', 'no',
  '', 'whitegrid'

-- ════════════════════════════════════════════════════════════════════
-- product_analytics_report  (4 charts — all Seaborn-powered)
-- Uses {this_year} built-in token — no filter_params needed
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'product_analytics_report', 1, 'R002_BAR_CATEGORY', 'bar',
  '{project}.prod_reports.category_quarterly', 'fiscal_year={this_year}',
  'Category', 'Q1,Q2,Q3,Q4', 'yes',
  'Quarterly Sales by Category', 'FY {this_year} breakdown',
  'cool', 'yes', 'none',
  620, 330,
  '', '',
  '', 'Sales (USD)', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'product_analytics_report', 2, 'R002_SUNBURST_MARKET', 'sunburst',
  '{project}.prod_reports.market_sunburst', 'report_year={this_year}',
  'Segment', 'Revenue,SubSegment', 'yes',
  'Revenue by Segment & Sub-Segment', 'Two-level breakdown · FY {this_year}',
  'vibrant', 'yes', 'desc',
  560, 400,
  '', '',
  '', '', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'product_analytics_report', 3, 'R002_DONUT_MARKET', 'donut',
  '{project}.prod_reports.market_share', 'report_year={this_year}',
  'Segment', 'Share', 'yes',
  'Market Share by Segment', 'As of {this_month}',
  'warm', 'yes', 'desc',
  500, 360,
  '', '',
  '', '', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'product_analytics_report', 4, 'R002_AREA_GROWTH', 'area',
  '{project}.prod_reports.monthly_sales', 'report_year={this_year}',
  'Month', 'Revenue,Target', 'yes',
  'Cumulative Growth — Revenue vs Target', 'YTD · {this_month}',
  'blue', 'no', 'none',
  620, 310,
  '', '',
  '', 'USD', 'no',
  '', 'whitegrid'

-- ════════════════════════════════════════════════════════════════════
-- executive_pnl_report  (4 charts — all Seaborn-powered)
-- {last_quarter_year} overridden per-recipient via filter_params
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'executive_pnl_report', 1, 'R003_WATERFALL_PNL', 'waterfall',
  '{project}.prod_reports.pnl_bridge', 'period=\'{last_quarter_year}\'',
  'Item', 'Delta', 'no',
  'P&L Bridge — {last_quarter_year}', 'Starting from Opening Balance',
  'default', 'yes', 'none',
  620, 330,
  '', '',
  '', 'USD', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'executive_pnl_report', 2, 'R003_SUNBURST_COST', 'sunburst',
  '{project}.prod_reports.cost_sunburst', 'period=\'{last_quarter_year}\'',
  'CostCategory', 'Amount,CostItem', 'yes',
  'Cost Structure — {last_quarter_year}', 'Inner = Category  ·  Outer = Line Item',
  'warm', 'yes', 'desc',
  560, 400,
  '', '',
  '', '', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'executive_pnl_report', 3, 'R003_LINE_REVCOS', 'line',
  '{project}.prod_reports.monthly_pnl', 'report_year={report_year}',
  'Month', 'Revenue,Costs,GrossProfit', 'yes',
  'Revenue vs Costs — Monthly', 'Gross profit = Revenue − Costs · {report_year}',
  'green', 'no', 'none',
  620, 310,
  '', '',
  '', 'USD', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'executive_pnl_report', 4, 'R003_PIE_EXPENSE', 'pie',
  '{project}.prod_reports.expense_breakdown', 'period=\'{last_quarter_year}\'',
  'ExpenseType', 'Amount', 'yes',
  'Expense Breakdown', '{last_quarter_year}',
  'slate', 'yes', 'desc',
  520, 360,
  '', '',
  '', '', 'no',
  '', 'whitegrid'
-- ════════════════════════════════════════════════════════════════════
-- seaborn_analytics_report  (8 Seaborn-specific chart types)
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'seaborn_analytics_report', 1, 'SNS_LINE', 'line_seaborn',
  '{project}.prod_reports.monthly_sales', 'report_year={report_year}',
  'Month', 'Revenue,Target', 'yes',
  'Revenue Trend (Seaborn Line)', 'Confidence bands · {report_year}',
  'blue', 'no', 'none', 620, 320, '', '',
  '', 'Revenue (USD)', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'seaborn_analytics_report', 2, 'SNS_BAR', 'bar_seaborn',
  '{project}.prod_reports.region_revenue_seg', 'report_year={report_year}',
  'Region', 'Revenue', 'yes',
  'Revenue by Region (Seaborn Bar)', 'Error bars = 95% CI · {report_year}',
  'cool', 'yes', 'none', 580, 340, '', '',
  '', 'Revenue (USD)', 'no',
  'Segment', 'whitegrid'

UNION ALL SELECT
  'seaborn_analytics_report', 3, 'SNS_PIE', 'pie_seaborn',
  '{project}.prod_reports.market_share', 'report_year={report_year}',
  'Segment', 'Share', 'yes',
  'Market Share (Seaborn Pie)', 'Exploded largest slice · {report_year}',
  'vibrant', 'yes', 'desc', 540, 380, '', '',
  '', '', 'no',
  '', 'white'

UNION ALL SELECT
  'seaborn_analytics_report', 4, 'SNS_BOX', 'box_seaborn',
  '{project}.prod_reports.sales_distribution', 'report_year={report_year}',
  'Region', 'Revenue', 'yes',
  'Revenue Distribution (Seaborn Box)', 'Median · IQR · whiskers · outliers',
  'teal', 'no', 'none', 620, 380, '', '',
  'Region', 'Revenue (USD)', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'seaborn_analytics_report', 5, 'SNS_VIOLIN', 'violin_seaborn',
  '{project}.prod_reports.sales_distribution', 'report_year={report_year}',
  'Quarter', 'Revenue', 'yes',
  'Revenue Shape by Quarter (Violin)', 'Split by segment · {report_year}',
  'warm', 'no', 'none', 620, 400, '', '',
  'Quarter', 'Revenue (USD)', 'no',
  'Segment', 'whitegrid'

UNION ALL SELECT
  'seaborn_analytics_report', 6, 'SNS_HEATMAP', 'heatmap_seaborn',
  '{project}.prod_reports.region_monthly', 'report_year={report_year}',
  'Month', 'Revenue', 'yes',
  'Revenue Heatmap (Region x Month)', 'Darker = higher revenue · {report_year}',
  'vibrant', 'yes', 'none', 640, 380, '', '',
  'Month', 'Revenue (USD)', 'no',
  'Region', 'white'

UNION ALL SELECT
  'seaborn_analytics_report', 7, 'SNS_HIST', 'hist_seaborn',
  '{project}.prod_reports.sales_distribution', 'report_year={report_year}',
  'Revenue', 'Revenue', 'yes',
  'Revenue Distribution (Histogram + KDE)', 'Grouped by region · {report_year}',
  'purple', 'yes', 'none', 600, 360, '', '',
  'Revenue (USD)', 'Count', 'no',
  'Region', 'whitegrid'

UNION ALL SELECT
  'seaborn_analytics_report', 8, 'SNS_KDE', 'kde_seaborn',
  '{project}.prod_reports.sales_distribution', 'report_year={report_year}',
  'Revenue', 'Revenue', 'yes',
  'Revenue Density Curves (KDE)', 'Smooth density by quarter · {report_year}',
  'teal', 'no', 'none', 600, 360, '', '',
  'Revenue (USD)', 'Density', 'no',
  'Quarter', 'whitegrid'

-- ════════════════════════════════════════════════════════════════════
-- altair_analytics_report  (8 Vega-Altair chart types)
-- ════════════════════════════════════════════════════════════════════
UNION ALL SELECT
  'altair_analytics_report', 1, 'ALT_LINE', 'line_altair',
  '{project}.prod_reports.monthly_revenue_2yr', 'report_year={report_year}',
  'Month', 'Revenue', 'yes',
  'Revenue Trend by Year (Altair Line)', '2025 vs 2026 overlay',
  'blue', 'no', 'none', 620, 320, '', '',
  '', 'Revenue (USD)', 'no',
  'Year', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 2, 'ALT_BAR', 'bar_altair',
  '{project}.prod_reports.region_revenue', 'report_year={report_year}',
  'Region', 'Revenue', 'no',
  'Revenue by Region (Altair Bar)', 'Sorted high to low · {report_year}',
  'teal', 'yes', 'desc', 560, 300, '', '',
  'Revenue (USD)', '', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 3, 'ALT_SCATTER', 'scatter_altair',
  '{project}.prod_reports.deal_performance', 'report_year={report_year}',
  'DealSize', 'Revenue,Count', 'yes',
  'Deal Size vs Revenue (Altair Scatter)', 'Bubble = deal count · {report_year}',
  'purple', 'no', 'none', 580, 340, '', '',
  'Deal Size (USD)', 'Revenue (USD)', 'no',
  'Segment', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 4, 'ALT_HEATMAP', 'heatmap_altair',
  '{project}.prod_reports.region_monthly', 'report_year={report_year}',
  'Month', 'Revenue', 'yes',
  'Revenue Heatmap — Region x Month (Altair)', 'Darker = higher · {report_year}',
  'blue', 'yes', 'none', 640, 320, '', '',
  '', '', 'no',
  'Region', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 5, 'ALT_AREA', 'area_altair',
  '{project}.prod_reports.monthly_sales', 'report_year={report_year}',
  'Month', 'Revenue,Target', 'yes',
  'Revenue vs Target — Stacked Area (Altair)', 'YTD · {report_year}',
  'cool', 'no', 'none', 620, 320, '', '',
  '', 'Revenue (USD)', 'no',
  '', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 6, 'ALT_STRIP', 'strip_altair',
  '{project}.prod_reports.sales_distribution', 'report_year={report_year}',
  'Region', 'Revenue', 'yes',
  'Revenue Distribution — Strip Plot (Altair)', 'Each dot = one record · median tick · {report_year}',
  'vibrant', 'no', 'none', 620, 360, '', '',
  '', 'Revenue (USD)', 'no',
  'Segment', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 7, 'ALT_BOX', 'boxplot_altair',
  '{project}.prod_reports.sales_distribution', 'report_year={report_year}',
  'Quarter', 'Revenue', 'yes',
  'Revenue by Quarter — Box Plot (Altair)', 'Split by Segment · {report_year}',
  'warm', 'no', 'none', 620, 380, '', '',
  '', 'Revenue (USD)', 'no',
  'Segment', 'whitegrid'

UNION ALL SELECT
  'altair_analytics_report', 8, 'ALT_ARC', 'arc_altair',
  '{project}.prod_reports.market_share', 'report_year={report_year}',
  'Segment', 'Share,donut', 'yes',
  'Market Share — Donut Arc (Altair)', 'As of {this_month}',
  'vibrant', 'yes', 'desc', 520, 380, '', '',
  '', '', 'no',
  '', 'whitegrid'
;


-- ─────────────────────────────────────────────────────────────────────
-- 1c.  email_output  (written by the engine after rendering)
--      GROUP KEY matches email_list: (report_name, recipient_email)
--      One row written per unique (report_name, recipient_email) combo.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.YOUR_DATASET.email_output`
(
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
OPTIONS (description = 'v15: one row per (report_name, recipient_email). Written by chart engine.');


-- ══════════════════════════════════════════════════════════════════════
-- 2.  ENGINE JOIN QUERY  (reference — engine runs this at runtime)
-- ══════════════════════════════════════════════════════════════════════
--
--  Groups by (report_name, recipient_email).
--  One HTML per unique combination.
--  ALL chart_config_view rows for that report are included — every
--  {{PLACEHOLDER}} in the template is replaced in a single pass.
--
--  SELECT
--    el.report_name,
--    el.recipient_email,
--    el.subject,
--    el.html_template,
--    el.filter_params,
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
--    cc.hue_column,
--    cc.seaborn_style
--  FROM   `YOUR_PROJECT_ID.YOUR_DATASET.email_list`   el
--  JOIN   `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` cc
--         USING (report_name)
--  ORDER  BY el.report_name, el.recipient_email, cc.sort_position;
--


-- ══════════════════════════════════════════════════════════════════════
-- 3.  SOURCE DATA TABLES  (prod_reports dataset)
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

INSERT INTO `YOUR_PROJECT_ID.prod_reports.monthly_sales`
  (report_year, Month, Revenue, Target, Units)
VALUES
  (2026, 'Jan', 42000, 45000, 210),
  (2026, 'Feb', 47500, 48000, 238),
  (2026, 'Mar', 53200, 52000, 266),
  (2026, 'Apr', 49800, 55000, 249),
  (2026, 'May', 61000, 60000, 305),
  (2026, 'Jun', 67300, 65000, 337),
  (2026, 'Jul', 72100, 70000, 361),
  (2026, 'Aug', 68900, 72000, 345),
  (2026, 'Sep', 74500, 75000, 373),
  (2026, 'Oct', 81200, 80000, 406),
  (2026, 'Nov', 78600, 82000, 393),
  (2026, 'Dec', 91000, 88000, 455),
  (2025, 'Jan', 36000, 38000, 182),
  (2025, 'Feb', 40200, 41000, 201),
  (2025, 'Mar', 44800, 44000, 224),
  (2025, 'Apr', 41500, 46000, 208),
  (2025, 'May', 52000, 52000, 260),
  (2025, 'Jun', 58100, 56000, 291),
  (2025, 'Jul', 61400, 60000, 307),
  (2025, 'Aug', 59200, 63000, 296),
  (2025, 'Sep', 64800, 66000, 324),
  (2025, 'Oct', 70300, 70000, 352),
  (2025, 'Nov', 67900, 72000, 340),
  (2025, 'Dec', 80100, 78000, 401);


-- ── 3b. monthly_pnl ───────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.monthly_pnl`
(
  report_year  INT64   NOT NULL,
  Month        STRING  NOT NULL,
  Revenue      INT64   NOT NULL,
  Costs        INT64   NOT NULL,
  GrossProfit  INT64   NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.monthly_pnl`
  (report_year, Month, Revenue, Costs, GrossProfit)
VALUES
  (2026, 'Jan', 42000, 31000, 11000),
  (2026, 'Feb', 47500, 34000, 13500),
  (2026, 'Mar', 53200, 38000, 15200),
  (2026, 'Apr', 49800, 37000, 12800),
  (2026, 'May', 61000, 43000, 18000),
  (2026, 'Jun', 67300, 48000, 19300),
  (2026, 'Jul', 72100, 51000, 21100),
  (2026, 'Aug', 68900, 49000, 19900),
  (2026, 'Sep', 74500, 53000, 21500),
  (2026, 'Oct', 81200, 57000, 24200),
  (2026, 'Nov', 78600, 55000, 23600),
  (2026, 'Dec', 91000, 63000, 28000);


-- ── 3c. region_revenue ────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.region_revenue`
(
  report_year  INT64   NOT NULL,
  Region       STRING  NOT NULL,
  Revenue      INT64   NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.region_revenue`
  (report_year, Region, Revenue)
VALUES
  (2026, 'North',   31200),
  (2026, 'South',   24500),
  (2026, 'East',    18900),
  (2026, 'West',    27800),
  (2026, 'Central', 15600),
  (2025, 'North',   27000),
  (2025, 'South',   21200),
  (2025, 'East',    16400),
  (2025, 'West',    24100),
  (2025, 'Central', 13500);


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

INSERT INTO `YOUR_PROJECT_ID.prod_reports.category_quarterly`
  (fiscal_year, Category, Q1, Q2, Q3, Q4)
VALUES
  (2026, 'Electronics', 12000, 14500, 13200, 18900),
  (2026, 'Clothing',     8500,  9200, 11000, 14500),
  (2026, 'Food',         6200,  7800,  8100,  9300),
  (2026, 'Books',        3400,  4100,  3800,  4600),
  (2026, 'Sports',       5100,  6300,  7200,  8800),
  (2025, 'Electronics', 10200, 12100, 11500, 16300),
  (2025, 'Clothing',     7200,  7800,  9400, 12800),
  (2025, 'Food',         5400,  6600,  7100,  8100),
  (2025, 'Books',        2900,  3500,  3200,  4000),
  (2025, 'Sports',       4300,  5500,  6400,  7700);


-- ── 3e. market_share ──────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.market_share`
(
  report_year  INT64    NOT NULL,
  Segment      STRING   NOT NULL,
  Share        FLOAT64  NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.market_share`
  (report_year, Segment, Share)
VALUES
  (2026, 'Enterprise',  38.5),
  (2026, 'SMB',         24.2),
  (2026, 'Startup',     15.8),
  (2026, 'Consumer',    12.1),
  (2026, 'Government',   9.4),
  (2025, 'Enterprise',  36.0),
  (2025, 'SMB',         25.5),
  (2025, 'Startup',     14.2),
  (2025, 'Consumer',    13.8),
  (2025, 'Government',  10.5);


-- ── 3f. market_sunburst ───────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.market_sunburst`
(
  report_year  INT64   NOT NULL,
  Segment      STRING  NOT NULL,   -- inner ring (parent)
  SubSegment   STRING  NOT NULL,   -- outer ring (child)
  Revenue      INT64   NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.market_sunburst`
  (report_year, Segment, SubSegment, Revenue)
VALUES
  (2026, 'Enterprise', 'Large Corp',  18000),
  (2026, 'Enterprise', 'Mid Corp',     9500),
  (2026, 'Enterprise', 'Public Co',    6200),
  (2026, 'SMB',        'Retail SMB',  14000),
  (2026, 'SMB',        'B2B SMB',      9800),
  (2026, 'Startup',    'SaaS',         8200),
  (2026, 'Startup',    'Fintech',      7100),
  (2026, 'Consumer',   'Direct',       6500),
  (2026, 'Consumer',   'Reseller',     4100),
  (2026, 'Consumer',   'Online',       2800),
  (2026, 'Government', 'Federal',      5200),
  (2026, 'Government', 'State',        3800);


-- ── 3g. deal_performance ──────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.deal_performance`
(
  report_year  INT64   NOT NULL,
  DealSize     INT64   NOT NULL,
  Revenue      INT64   NOT NULL,
  Count        INT64   NOT NULL,
  Segment      STRING  NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.deal_performance`
  (report_year, DealSize, Revenue, Count, Segment)
VALUES
  (2026,  8200,  6100,  3, 'SMB'),
  (2026, 95400, 88200,  1, 'Enterprise'),
  (2026, 15600, 12400,  5, 'SMB'),
  (2026, 72300, 68100,  2, 'Enterprise'),
  (2026, 34500, 29800,  4, 'Startup'),
  (2026, 11200,  9600,  7, 'Consumer'),
  (2026, 58700, 54200,  2, 'Enterprise'),
  (2026, 22100, 18900,  6, 'SMB'),
  (2026, 47800, 43500,  3, 'Startup'),
  (2026,  6500,  4800,  9, 'Consumer'),
  (2026, 83100, 79400,  1, 'Enterprise'),
  (2026, 19400, 16200,  5, 'SMB'),
  (2026, 38900, 34100,  4, 'Startup'),
  (2026, 12700, 10300,  8, 'Consumer'),
  (2026, 67200, 62800,  2, 'Enterprise'),
  (2026, 28600, 24400,  5, 'SMB'),
  (2026, 52400, 48700,  3, 'Startup'),
  (2026,  9800,  7900, 11, 'Consumer'),
  (2026, 91500, 87300,  1, 'Enterprise'),
  (2026, 25300, 21600,  6, 'SMB'),
  (2026, 43700, 39800,  3, 'Startup'),
  (2026, 16800, 14100,  7, 'Consumer'),
  (2026, 76400, 71900,  2, 'Enterprise'),
  (2026, 31200, 27100,  5, 'SMB'),
  (2026, 55900, 51200,  3, 'Startup'),
  (2026, 13400, 11200,  8, 'Consumer'),
  (2026, 88700, 84500,  1, 'Enterprise'),
  (2026, 18900, 15800,  6, 'SMB'),
  (2026, 41300, 37600,  4, 'Startup'),
  (2026,  7600,  5700, 12, 'Consumer'),
  (2026, 63800, 59700,  2, 'Enterprise'),
  (2026, 26700, 22900,  5, 'SMB'),
  (2026, 48200, 44600,  3, 'Startup'),
  (2026, 14100, 11900,  9, 'Consumer'),
  (2026, 79800, 75400,  2, 'Enterprise'),
  (2026, 33600, 29300,  4, 'SMB'),
  (2026, 57100, 53400,  3, 'Startup'),
  (2026, 10600,  8800, 10, 'Consumer'),
  (2026, 85200, 81100,  1, 'Enterprise'),
  (2026, 20800, 17700,  6, 'SMB');


-- ── 3h. pnl_bridge ────────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.pnl_bridge`
(
  period  STRING  NOT NULL,   -- e.g. 'Q1-2026'
  Item    STRING  NOT NULL,
  Delta   INT64   NOT NULL    -- 0 on Closing row → engine computes running total
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.pnl_bridge`
  (period, Item, Delta)
VALUES
  ('Q1-2026', 'Opening',    120000),
  ('Q1-2026', 'New Sales',   52000),
  ('Q1-2026', 'Upsell',      21000),
  ('Q1-2026', 'Churn',      -18500),
  ('Q1-2026', 'Refunds',     -7200),
  ('Q1-2026', 'OpEx',       -38000),
  ('Q1-2026', 'Closing',         0),
  ('Q4-2025', 'Opening',    105000),
  ('Q4-2025', 'New Sales',   44000),
  ('Q4-2025', 'Upsell',      17500),
  ('Q4-2025', 'Churn',      -15200),
  ('Q4-2025', 'Refunds',     -6100),
  ('Q4-2025', 'OpEx',       -34000),
  ('Q4-2025', 'Closing',         0);


-- ── 3i. cost_sunburst ─────────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.cost_sunburst`
(
  period        STRING  NOT NULL,
  CostCategory  STRING  NOT NULL,   -- inner ring (parent)
  CostItem      STRING  NOT NULL,   -- outer ring (child)
  Amount        INT64   NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.cost_sunburst`
  (period, CostCategory, CostItem, Amount)
VALUES
  ('Q1-2026', 'Personnel',     'Salaries',      28000),
  ('Q1-2026', 'Personnel',     'Benefits',       6500),
  ('Q1-2026', 'Personnel',     'Contractors',    4200),
  ('Q1-2026', 'Infrastructure','Cloud',          8800),
  ('Q1-2026', 'Infrastructure','Office',         3200),
  ('Q1-2026', 'Sales & Mktg', 'Advertising',    7400),
  ('Q1-2026', 'Sales & Mktg', 'Events',         3100),
  ('Q1-2026', 'Sales & Mktg', 'Commissions',    5600),
  ('Q1-2026', 'R&D',          'Engineering',    9200),
  ('Q1-2026', 'R&D',          'Research',       4100),
  ('Q1-2026', 'G&A',          'Legal',          2800),
  ('Q1-2026', 'G&A',          'Finance',        1900),
  ('Q4-2025', 'Personnel',     'Salaries',      25500),
  ('Q4-2025', 'Personnel',     'Benefits',       5900),
  ('Q4-2025', 'Personnel',     'Contractors',    3800),
  ('Q4-2025', 'Infrastructure','Cloud',          7900),
  ('Q4-2025', 'Infrastructure','Office',         3200),
  ('Q4-2025', 'Sales & Mktg', 'Advertising',    6800),
  ('Q4-2025', 'Sales & Mktg', 'Events',         2600),
  ('Q4-2025', 'Sales & Mktg', 'Commissions',    5100),
  ('Q4-2025', 'R&D',          'Engineering',    8500),
  ('Q4-2025', 'R&D',          'Research',       3700),
  ('Q4-2025', 'G&A',          'Legal',          2500),
  ('Q4-2025', 'G&A',          'Finance',        1700);


-- ── 3j. expense_breakdown ─────────────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.expense_breakdown`
(
  period       STRING  NOT NULL,
  ExpenseType  STRING  NOT NULL,
  Amount       INT64   NOT NULL
);

INSERT INTO `YOUR_PROJECT_ID.prod_reports.expense_breakdown`
  (period, ExpenseType, Amount)
VALUES
  ('Q1-2026', 'Personnel',       38700),
  ('Q1-2026', 'Infrastructure',  12000),
  ('Q1-2026', 'Sales & Mktg',    16100),
  ('Q1-2026', 'R&D',             13300),
  ('Q1-2026', 'G&A',              4700),
  ('Q4-2025', 'Personnel',       35200),
  ('Q4-2025', 'Infrastructure',  11100),
  ('Q4-2025', 'Sales & Mktg',    14500),
  ('Q4-2025', 'R&D',             12200),
  ('Q4-2025', 'G&A',              4200);


-- ══════════════════════════════════════════════════════════════════════

-- ── 3k. region_revenue_seg  (bar_seaborn CI demo) ────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.region_revenue_seg`
(report_year INT64, Region STRING, Segment STRING, Revenue INT64);
INSERT INTO `YOUR_PROJECT_ID.prod_reports.region_revenue_seg` VALUES
  (2026,'North','Enterprise',18200),(2026,'North','SMB',9400),(2026,'North','Startup',3600),
  (2026,'South','Enterprise',14100),(2026,'South','SMB',7200),(2026,'South','Startup',3200),
  (2026,'East','Enterprise',10500),(2026,'East','SMB',5900),(2026,'East','Startup',2500),
  (2026,'West','Enterprise',15800),(2026,'West','SMB',8400),(2026,'West','Startup',3600),
  (2025,'North','Enterprise',15800),(2025,'North','SMB',8200),(2025,'North','Startup',3000),
  (2025,'South','Enterprise',12200),(2025,'South','SMB',6400),(2025,'South','Startup',2600),
  (2025,'East','Enterprise',9100),(2025,'East','SMB',5100),(2025,'East','Startup',2200),
  (2025,'West','Enterprise',13700),(2025,'West','SMB',7400),(2025,'West','Startup',3000);

-- ── 3l. sales_distribution  (box / violin / hist / kde) ──────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.sales_distribution`
(report_year INT64, Region STRING, Quarter STRING, Segment STRING, Revenue INT64);
INSERT INTO `YOUR_PROJECT_ID.prod_reports.sales_distribution` VALUES
  (2026,'North','Q1','Enterprise',92000),(2026,'North','Q1','SMB',34000),
  (2026,'North','Q2','Enterprise',105000),(2026,'North','Q2','SMB',41000),
  (2026,'North','Q3','Enterprise',98000),(2026,'North','Q3','SMB',38000),
  (2026,'North','Q4','Enterprise',118000),(2026,'North','Q4','SMB',45000),
  (2026,'South','Q1','Enterprise',78000),(2026,'South','Q1','SMB',29000),
  (2026,'South','Q2','Enterprise',85000),(2026,'South','Q2','SMB',32000),
  (2026,'South','Q3','Enterprise',91000),(2026,'South','Q3','SMB',35000),
  (2026,'South','Q4','Enterprise',99000),(2026,'South','Q4','SMB',38000),
  (2026,'East','Q1','Enterprise',65000),(2026,'East','Q1','SMB',24000),
  (2026,'East','Q2','Enterprise',71000),(2026,'East','Q2','SMB',27000),
  (2026,'East','Q3','Enterprise',68000),(2026,'East','Q3','SMB',25000),
  (2026,'East','Q4','Enterprise',76000),(2026,'East','Q4','SMB',29000),
  (2026,'West','Q1','Enterprise',84000),(2026,'West','Q1','SMB',31000),
  (2026,'West','Q2','Enterprise',96000),(2026,'West','Q2','SMB',37000),
  (2026,'West','Q3','Enterprise',102000),(2026,'West','Q3','SMB',39000),
  (2026,'West','Q4','Enterprise',111000),(2026,'West','Q4','SMB',43000),
  (2026,'North','Q1','Startup',18000),(2026,'South','Q2','Startup',19000),
  (2026,'East','Q3','Startup',14000),(2026,'West','Q4','Startup',21000);

-- ── 3m. region_monthly  (heatmap) ────────────────────────────────────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.region_monthly`
(report_year INT64, Region STRING, Month STRING, Revenue INT64);
INSERT INTO `YOUR_PROJECT_ID.prod_reports.region_monthly` VALUES
  (2026,'North','Jan',18200),(2026,'North','Feb',19400),(2026,'North','Mar',22100),
  (2026,'North','Apr',20800),(2026,'North','May',24600),(2026,'North','Jun',27300),
  (2026,'North','Jul',29100),(2026,'North','Aug',27800),(2026,'North','Sep',31200),
  (2026,'North','Oct',34100),(2026,'North','Nov',32400),(2026,'North','Dec',38900),
  (2026,'South','Jan',14100),(2026,'South','Feb',15200),(2026,'South','Mar',17400),
  (2026,'South','Apr',16100),(2026,'South','May',19200),(2026,'South','Jun',21500),
  (2026,'South','Jul',22800),(2026,'South','Aug',21100),(2026,'South','Sep',24500),
  (2026,'South','Oct',26800),(2026,'South','Nov',25100),(2026,'South','Dec',30200),
  (2026,'East','Jan',10500),(2026,'East','Feb',11200),(2026,'East','Mar',12800),
  (2026,'East','Apr',11900),(2026,'East','May',14100),(2026,'East','Jun',15800),
  (2026,'East','Jul',16900),(2026,'East','Aug',15600),(2026,'East','Sep',18200),
  (2026,'East','Oct',19800),(2026,'East','Nov',18500),(2026,'East','Dec',22400),
  (2026,'West','Jan',15800),(2026,'West','Feb',16900),(2026,'West','Mar',19200),
  (2026,'West','Apr',17800),(2026,'West','May',21100),(2026,'West','Jun',23600),
  (2026,'West','Jul',25200),(2026,'West','Aug',23400),(2026,'West','Sep',27200),
  (2026,'West','Oct',29700),(2026,'West','Nov',27800),(2026,'West','Dec',33500);



-- ── 3n. pipeline_funnel  (funnel / conversion data) ──────────────────
--    Used by: altair_analytics_report ALT_LINE, ALT_BAR etc.
--    (reuses existing tables — altair_analytics_report queries them)

-- ── 3n. monthly_revenue_2yr  (line_altair — two-year long-form) ──────
CREATE OR REPLACE TABLE `YOUR_PROJECT_ID.prod_reports.monthly_revenue_2yr`
(
  report_year  INT64   NOT NULL,
  Month        STRING  NOT NULL,
  Revenue      INT64   NOT NULL,
  Year         STRING  NOT NULL   -- '2025' or '2026'
);
INSERT INTO `YOUR_PROJECT_ID.prod_reports.monthly_revenue_2yr`
  (report_year, Month, Revenue, Year)
VALUES
  (2026,'Jan',42000,'2026'),(2026,'Feb',47500,'2026'),(2026,'Mar',53200,'2026'),
  (2026,'Apr',49800,'2026'),(2026,'May',61000,'2026'),(2026,'Jun',67300,'2026'),
  (2026,'Jul',72100,'2026'),(2026,'Aug',68900,'2026'),(2026,'Sep',74500,'2026'),
  (2026,'Oct',81200,'2026'),(2026,'Nov',78600,'2026'),(2026,'Dec',91000,'2026'),
  (2026,'Jan',36000,'2025'),(2026,'Feb',40200,'2025'),(2026,'Mar',44800,'2025'),
  (2026,'Apr',41500,'2025'),(2026,'May',52000,'2025'),(2026,'Jun',58100,'2025'),
  (2026,'Jul',61400,'2025'),(2026,'Aug',59200,'2025'),(2026,'Sep',64800,'2025'),
  (2026,'Oct',70300,'2025'),(2026,'Nov',67900,'2025'),(2026,'Dec',80100,'2025');


-- ── 3o. deal_scatter  (scatter_altair — deal size bubble data) ────────
--    (reuses prod_reports.deal_performance — no new table needed)


-- ── 3p. sales_strip  (strip_altair / boxplot_altair) ─────────────────
--    (reuses prod_reports.sales_distribution — no new table needed)


-- ── 3q. region_monthly_altair  (heatmap_altair) ───────────────────────
--    (reuses prod_reports.region_monthly — no new table needed)


-- ── 3r. market_share_arc  (arc_altair — donut) ────────────────────────
--    (reuses prod_reports.market_share — no new table needed)

-- ── seaborn_analytics_report ─────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
  (report_name, recipient_email, subject, html_template, filter_params)
VALUES
('seaborn_analytics_report',
 'analytics-team@company.com',
 'Seaborn Analytics Showcase — {this_quarter_year}',
 CONCAT(
   '<h2 style="font-family:Arial;color:#1a2b4a;margin:0 0 8px;">Seaborn Charts</h2>',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:0 0 24px;">{this_quarter_year} showcase</p>',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">LINE SEABORN</b><br/>','{{SNS_LINE}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">BAR SEABORN</b><br/>','{{SNS_BAR}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">PIE SEABORN</b><br/>','{{SNS_PIE}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">BOX SEABORN</b><br/>','{{SNS_BOX}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">VIOLIN SEABORN</b><br/>','{{SNS_VIOLIN}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">HEATMAP SEABORN</b><br/>','{{SNS_HEATMAP}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">HISTOGRAM SEABORN</b><br/>','{{SNS_HIST}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">KDE SEABORN</b><br/>','{{SNS_KDE}}'
 ),
 '{"report_year":"2026"}'
);

-- ── altair_analytics_report ──────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
  (report_name, recipient_email, subject, html_template, filter_params)
VALUES
('altair_analytics_report',
 'altair-team@company.com',
 'Altair Analytics Showcase — {this_quarter_year}',
 CONCAT(
   '<h2 style="font-family:Arial;color:#1a2b4a;margin:0 0 8px;">Vega-Altair Charts</h2>',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:0 0 24px;">{this_quarter_year} showcase</p>',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">LINE ALTAIR</b><br/>','{{ALT_LINE}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">BAR ALTAIR</b><br/>','{{ALT_BAR}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">SCATTER ALTAIR</b><br/>','{{ALT_SCATTER}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">HEATMAP ALTAIR</b><br/>','{{ALT_HEATMAP}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">AREA ALTAIR</b><br/>','{{ALT_AREA}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">STRIP ALTAIR</b><br/>','{{ALT_STRIP}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">BOXPLOT ALTAIR</b><br/>','{{ALT_BOX}}',
   '<b style="font-family:Arial;font-size:10px;color:#9AA3B8;">ARC ALTAIR</b><br/>','{{ALT_ARC}}'
 ),
 '{"report_year":"2026"}'
);


-- 4.  VERIFICATION QUERIES
--     Run after all INSERTs to confirm expected row counts.
-- ══════════════════════════════════════════════════════════════════════

SELECT 'email_list'            AS tbl, COUNT(*) AS rows FROM `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
UNION ALL
SELECT 'chart_config_view',                 COUNT(*)          FROM `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view`
UNION ALL
SELECT 'monthly_sales',                COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.monthly_sales`
UNION ALL
SELECT 'monthly_pnl',                  COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.monthly_pnl`
UNION ALL
SELECT 'region_revenue',               COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.region_revenue`
UNION ALL
SELECT 'category_quarterly',           COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.category_quarterly`
UNION ALL
SELECT 'market_share',                 COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.market_share`
UNION ALL
SELECT 'market_sunburst',              COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.market_sunburst`
UNION ALL
SELECT 'deal_performance',             COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.deal_performance`
UNION ALL
SELECT 'pnl_bridge',                   COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.pnl_bridge`
UNION ALL
SELECT 'cost_sunburst',                COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.cost_sunburst`
UNION ALL
SELECT 'expense_breakdown',            COUNT(*)          FROM `YOUR_PROJECT_ID.prod_reports.expense_breakdown`
ORDER BY tbl;

-- Expected:
--   email_list            5   (2×monthly_sales + 1×product + 2×executive_pnl)
--   chart_config_view     13   (5 + 4 + 4 SELECT rows in the view)
--   monthly_sales        24   (12 months × 2 years)
--   monthly_pnl          12
--   region_revenue       10   (5 regions × 2 years)
--   category_quarterly   10
--   market_share         10
--   market_sunburst      12
--   deal_performance     40
--   pnl_bridge           14   (7 items × 2 quarters)
--   cost_sunburst        24   (12 items × 2 quarters)
--   expense_breakdown    10


-- ══════════════════════════════════════════════════════════════════════
-- 5.  JOIN SANITY CHECK
--     Confirm each (report_name, recipient_email) gets the right charts.
-- ══════════════════════════════════════════════════════════════════════

SELECT
  el.report_name,
  el.recipient_email,
  el.filter_params,
  COUNT(cc.variable_name)                                AS chart_count,
  STRING_AGG(cc.variable_name ORDER BY cc.sort_position) AS variables
FROM `YOUR_PROJECT_ID.YOUR_DATASET.email_list`   el
JOIN `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` cc
     USING (report_name)
GROUP BY 1, 2, 3
ORDER BY 1, 2;

-- Expected:
--  report_name                 | recipient_email       | filter_params                     | chart_count
--  executive_pnl_report        | board@company.com     | {"last_quarter_year":"Q4-2025"…}  |  4
--  executive_pnl_report        | leadership@company.com| {"last_quarter_year":"Q1-2026"…}  |  4
--  monthly_sales_report        | sales-archive@…       | {"report_year":"2025"}            |  5
--  monthly_sales_report        | sales-team@…          | {"report_year":"2026"}            |  5
--  product_analytics_report    | product-team@…        | NULL                              |  4


-- ══════════════════════════════════════════════════════════════════════
-- 6.  FILTER RESOLUTION PREVIEW
--     Simulate per-recipient filter resolution before running the engine.
-- ══════════════════════════════════════════════════════════════════════

SELECT
  el.report_name,
  el.recipient_email,
  cc.variable_name,
  cc.filters                                                AS raw_filter,
  REPLACE(
    REPLACE(
      cc.filters,
      '{report_year}',
      COALESCE(JSON_VALUE(el.filter_params, '$.report_year'), '(runtime)')
    ),
    '{last_quarter_year}',
    COALESCE(JSON_VALUE(el.filter_params, '$.last_quarter_year'), '(runtime)')
  )                                                         AS resolved_filter
FROM `YOUR_PROJECT_ID.YOUR_DATASET.email_list`   el
JOIN `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` cc
     USING (report_name)
ORDER BY el.report_name, el.recipient_email, cc.sort_position;
