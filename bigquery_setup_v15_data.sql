-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║   BigQuery Chart Engine  v15  —  Seed Data (INSERTs only)           ║
-- ║                                                                      ║
-- ║  PREREQUISITE: run bigquery_setup_v15_schema.sql first              ║
-- ║                                                                      ║
-- ║  SEED DATA — 3 reports × 5 recipient dispatches:                    ║
-- ║    monthly_sales_report     — 2 dispatches (2026 + 2025 archive)    ║
-- ║    product_analytics_report — 1 dispatch                             ║
-- ║    executive_pnl_report     — 2 dispatches (Q1-2026 + Q4-2025)     ║
-- ║    seaborn_analytics_report — 1 dispatch (showcase)                 ║
-- ║    altair_analytics_report  — 1 dispatch (showcase)                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════════════
-- 0.  REPLACE BEFORE RUNNING
-- ══════════════════════════════════════════════════════════════════════
--   YOUR_PROJECT_ID  →  e.g.  my-analytics-project
--   YOUR_DATASET     →  e.g.  chart_engine
-- ══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════
-- 1.  email_list  —  recipient dispatch rows
-- ══════════════════════════════════════════════════════════════════════

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


-- ══════════════════════════════════════════════════════════════════════
-- 2.  SOURCE DATA TABLES  (prod_reports dataset — INSERTs)
-- ══════════════════════════════════════════════════════════════════════

-- ── 3a. monthly_sales ─────────────────────────────────────────────────
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


-- ── 3k. region_revenue_seg  (bar_seaborn CI demo) ────────────────────
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

-- ── 3n. monthly_revenue_2yr  (line_altair — two-year long-form) ──────
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


-- ══════════════════════════════════════════════════════════════════════
-- 3.  VERIFICATION QUERIES
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
--   email_list            7   (2×monthly_sales + 1×product + 2×executive_pnl + 1×seaborn + 1×altair)
--   chart_config_view    29   (5 + 4 + 4 + 8 + 8 SELECT rows in the view)
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
-- 4.  JOIN SANITY CHECK
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
--  seaborn_analytics_report    | analytics-team@…      | {"report_year":"2026"}            |  8
--  altair_analytics_report     | altair-team@…         | {"report_year":"2026"}            |  8


-- ══════════════════════════════════════════════════════════════════════
-- 5.  FILTER RESOLUTION PREVIEW
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
