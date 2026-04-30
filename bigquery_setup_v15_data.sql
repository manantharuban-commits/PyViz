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
  (email_id, report_name, recipient_email, subject, html_template)
VALUES

-- ── monthly_sales_report — dispatch 1: current year (2026) ───────────
('MSR-2026',
 'monthly_sales_report',
 'sales-team@company.com',
 'Monthly Sales Performance — {this_month}',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Sales Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'Your monthly performance summary for {this_month} is enclosed.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Trend vs Target</div>',
   '{{R001_LINE_REVENUE}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue by Region</div>',
   '{{R001_ARC_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Top Regions Ranked</div>',
   '{{R001_BAR_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Deal Size vs Revenue</div>',
   '{{R001_SCATTER_DEALS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue vs Target — Area</div>',
   '{{R001_AREA_TREND}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 )
),

-- ── monthly_sales_report — dispatch 2: prior year archive (2025) ──────
('MSR-2025',
 'monthly_sales_report',
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
   '{{R001_ARC_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Top Regions Ranked (2025)</div>',
   '{{R001_BAR_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Deal Size vs Revenue (2025)</div>',
   '{{R001_SCATTER_DEALS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue vs Target — Area (2025)</div>',
   '{{R001_AREA_TREND}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 )
),

-- ── product_analytics_report — dispatch 1 ────────────────────────────
('PAR-2026',
 'product_analytics_report',
 'product-team@company.com',
 'Product & Category Analytics — {this_quarter_year}',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Product Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'The quarterly product breakdown for {this_quarter_year} is ready.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Heatmap</div>',
   '{{R002_HEATMAP_REGION}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Market Share by Segment</div>',
   '{{R002_ARC_MARKET}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Distribution</div>',
   '{{R002_STRIP_DIST}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Cumulative Growth</div>',
   '{{R002_AREA_GROWTH}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 )
),

-- ── executive_pnl_report — dispatch 1: Q1-2026 ───────────────────────
('EPR-Q1-2026',
 'executive_pnl_report',
 'leadership@company.com',
 'Executive P&L Summary — Q1-2026',
 CONCAT(
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">',
   'Dear Leadership Team,</p>',
   '<p style="font-family:Arial;font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px;">',
   'The executive P&amp;L for Q1-2026 is enclosed.</p>',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">P&amp;L Bridge</div>',
   '{{R003_BAR_PNL}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue vs Costs — Monthly</div>',
   '{{R003_LINE_REVCOS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Distribution by Quarter</div>',
   '{{R003_BOX_DIST}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Expense Breakdown</div>',
   '{{R003_ARC_EXPENSE}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 )
),

-- ── executive_pnl_report — dispatch 2: Q4-2025 (board@) ──────────────
('EPR-Q4-2025',
 'executive_pnl_report',
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
   '{{R003_BAR_PNL}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue vs Costs (Full Year 2025)</div>',
   '{{R003_LINE_REVCOS}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Revenue Distribution by Quarter</div>',
   '{{R003_BOX_DIST}}',
   '<div style="font-size:10px;font-weight:700;color:#9AA3B8;letter-spacing:.10em;',
   'text-transform:uppercase;padding-bottom:8px;margin-bottom:12px;',
   'border-bottom:1px solid #EEF1F6;font-family:Arial;">Expense Breakdown — Q4-2025</div>',
   '{{R003_ARC_EXPENSE}}',
   '<p style="font-family:Arial;font-size:13px;color:#6B7280;margin:28px 0 0;line-height:1.7;">',
   'Best regards,<br/><strong style="color:#111827;">Analytics Team</strong></p>'
 )
);

-- ── seaborn_analytics_report ─────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
  (email_id, report_name, recipient_email, subject, html_template)
VALUES
('SNS-2026',
 'seaborn_analytics_report',
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
 )
);

-- ── altair_analytics_report ──────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.YOUR_DATASET.email_list`
  (email_id, report_name, recipient_email, subject, html_template)
VALUES
('ALT-2026',
 'altair_analytics_report',
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
 )
);


-- ══════════════════════════════════════════════════════════════════════
-- 2.  SOURCE DATA TABLES  (prod_reports dataset — INSERTs)
-- ══════════════════════════════════════════════════════════════════════

-- ── 3a. monthly_sales ─────────────────────────────────────────────────
-- MSR-2026: current year · MSR-2025: archive · ALT-2026: altair showcase
INSERT INTO `YOUR_PROJECT_ID.prod_reports.monthly_sales`
  (email_id, Month, Revenue, Target, Units)
VALUES
  ('MSR-2026','Jan',42000,45000,210),('MSR-2026','Feb',47500,48000,238),
  ('MSR-2026','Mar',53200,52000,266),('MSR-2026','Apr',49800,55000,249),
  ('MSR-2026','May',61000,60000,305),('MSR-2026','Jun',67300,65000,337),
  ('MSR-2026','Jul',72100,70000,361),('MSR-2026','Aug',68900,72000,345),
  ('MSR-2026','Sep',74500,75000,373),('MSR-2026','Oct',81200,80000,406),
  ('MSR-2026','Nov',78600,82000,393),('MSR-2026','Dec',91000,88000,455),
  ('MSR-2025','Jan',36000,38000,182),('MSR-2025','Feb',40200,41000,201),
  ('MSR-2025','Mar',44800,44000,224),('MSR-2025','Apr',41500,46000,208),
  ('MSR-2025','May',52000,52000,260),('MSR-2025','Jun',58100,56000,291),
  ('MSR-2025','Jul',61400,60000,307),('MSR-2025','Aug',59200,63000,296),
  ('MSR-2025','Sep',64800,66000,324),('MSR-2025','Oct',70300,70000,352),
  ('MSR-2025','Nov',67900,72000,340),('MSR-2025','Dec',80100,78000,401),
  ('ALT-2026','Jan',42000,45000,210),('ALT-2026','Feb',47500,48000,238),
  ('ALT-2026','Mar',53200,52000,266),('ALT-2026','Apr',49800,55000,249),
  ('ALT-2026','May',61000,60000,305),('ALT-2026','Jun',67300,65000,337),
  ('ALT-2026','Jul',72100,70000,361),('ALT-2026','Aug',68900,72000,345),
  ('ALT-2026','Sep',74500,75000,373),('ALT-2026','Oct',81200,80000,406),
  ('ALT-2026','Nov',78600,82000,393),('ALT-2026','Dec',91000,88000,455);


-- ── 3b. monthly_pnl ───────────────────────────────────────────────────
-- EPR-Q1-2026: 2026 data · EPR-Q4-2025: 2025 data
INSERT INTO `YOUR_PROJECT_ID.prod_reports.monthly_pnl`
  (email_id, Month, Revenue, Costs, GrossProfit)
VALUES
  ('EPR-Q1-2026','Jan',42000,31000,11000),('EPR-Q1-2026','Feb',47500,34000,13500),
  ('EPR-Q1-2026','Mar',53200,38000,15200),('EPR-Q1-2026','Apr',49800,37000,12800),
  ('EPR-Q1-2026','May',61000,43000,18000),('EPR-Q1-2026','Jun',67300,48000,19300),
  ('EPR-Q1-2026','Jul',72100,51000,21100),('EPR-Q1-2026','Aug',68900,49000,19900),
  ('EPR-Q1-2026','Sep',74500,53000,21500),('EPR-Q1-2026','Oct',81200,57000,24200),
  ('EPR-Q1-2026','Nov',78600,55000,23600),('EPR-Q1-2026','Dec',91000,63000,28000),
  ('EPR-Q4-2025','Jan',36000,27000, 9000),('EPR-Q4-2025','Feb',40200,30000,10200),
  ('EPR-Q4-2025','Mar',44800,33000,11800),('EPR-Q4-2025','Apr',41500,31000,10500),
  ('EPR-Q4-2025','May',52000,38000,14000),('EPR-Q4-2025','Jun',58100,42000,16100),
  ('EPR-Q4-2025','Jul',61400,44000,17400),('EPR-Q4-2025','Aug',59200,43000,16200),
  ('EPR-Q4-2025','Sep',64800,46000,18800),('EPR-Q4-2025','Oct',70300,50000,20300),
  ('EPR-Q4-2025','Nov',67900,48000,19900),('EPR-Q4-2025','Dec',80100,57000,23100);


-- ── 3c. region_revenue ────────────────────────────────────────────────
-- MSR-2026, MSR-2025, PAR-2026, ALT-2026
INSERT INTO `YOUR_PROJECT_ID.prod_reports.region_revenue`
  (email_id, Region, Revenue)
VALUES
  ('MSR-2026','North',31200),('MSR-2026','South',24500),('MSR-2026','East',18900),
  ('MSR-2026','West',27800), ('MSR-2026','Central',15600),
  ('MSR-2025','North',27000),('MSR-2025','South',21200),('MSR-2025','East',16400),
  ('MSR-2025','West',24100), ('MSR-2025','Central',13500),
  ('PAR-2026','North',31200),('PAR-2026','South',24500),('PAR-2026','East',18900),
  ('PAR-2026','West',27800), ('PAR-2026','Central',15600),
  ('ALT-2026','North',31200),('ALT-2026','South',24500),('ALT-2026','East',18900),
  ('ALT-2026','West',27800), ('ALT-2026','Central',15600);


-- ── 3d. category_quarterly ────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.category_quarterly`
  (email_id, Category, Q1, Q2, Q3, Q4)
VALUES
  ('PAR-2026','Electronics',12000,14500,13200,18900),
  ('PAR-2026','Clothing',    8500, 9200,11000,14500),
  ('PAR-2026','Food',        6200, 7800, 8100, 9300),
  ('PAR-2026','Books',       3400, 4100, 3800, 4600),
  ('PAR-2026','Sports',      5100, 6300, 7200, 8800);


-- ── 3e. market_share ──────────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.market_share`
  (email_id, Segment, Share)
VALUES
  ('MSR-2026','Enterprise',38.5),('MSR-2026','SMB',24.2),('MSR-2026','Startup',15.8),
  ('MSR-2026','Consumer',12.1), ('MSR-2026','Government',9.4),
  ('MSR-2025','Enterprise',36.0),('MSR-2025','SMB',25.5),('MSR-2025','Startup',14.2),
  ('MSR-2025','Consumer',13.8), ('MSR-2025','Government',10.5),
  ('PAR-2026','Enterprise',38.5),('PAR-2026','SMB',24.2),('PAR-2026','Startup',15.8),
  ('PAR-2026','Consumer',12.1), ('PAR-2026','Government',9.4),
  ('ALT-2026','Enterprise',38.5),('ALT-2026','SMB',24.2),('ALT-2026','Startup',15.8),
  ('ALT-2026','Consumer',12.1), ('ALT-2026','Government',9.4);


-- ── 3f. market_sunburst ───────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.market_sunburst`
  (email_id, Segment, SubSegment, Revenue)
VALUES
  ('PAR-2026','Enterprise','Large Corp',18000),('PAR-2026','Enterprise','Mid Corp',9500),
  ('PAR-2026','Enterprise','Public Co',6200), ('PAR-2026','SMB','Retail SMB',14000),
  ('PAR-2026','SMB','B2B SMB',9800),          ('PAR-2026','Startup','SaaS',8200),
  ('PAR-2026','Startup','Fintech',7100),       ('PAR-2026','Consumer','Direct',6500),
  ('PAR-2026','Consumer','Reseller',4100),     ('PAR-2026','Consumer','Online',2800),
  ('PAR-2026','Government','Federal',5200),    ('PAR-2026','Government','State',3800);


-- ── 3g. deal_performance ──────────────────────────────────────────────
-- MSR-2026 and ALT-2026 both use this table
INSERT INTO `YOUR_PROJECT_ID.prod_reports.deal_performance`
  (email_id, DealSize, Revenue, Count, Segment)
VALUES
  ('MSR-2026', 8200, 6100,3,'SMB'),   ('MSR-2026',95400,88200,1,'Enterprise'),
  ('MSR-2026',15600,12400,5,'SMB'),   ('MSR-2026',72300,68100,2,'Enterprise'),
  ('MSR-2026',34500,29800,4,'Startup'),('MSR-2026',11200,9600,7,'Consumer'),
  ('MSR-2026',58700,54200,2,'Enterprise'),('MSR-2026',22100,18900,6,'SMB'),
  ('MSR-2026',47800,43500,3,'Startup'),('MSR-2026', 6500,4800,9,'Consumer'),
  ('MSR-2026',83100,79400,1,'Enterprise'),('MSR-2026',19400,16200,5,'SMB'),
  ('MSR-2026',38900,34100,4,'Startup'),('MSR-2026',12700,10300,8,'Consumer'),
  ('MSR-2026',67200,62800,2,'Enterprise'),('MSR-2026',28600,24400,5,'SMB'),
  ('MSR-2026',52400,48700,3,'Startup'),('MSR-2026', 9800,7900,11,'Consumer'),
  ('MSR-2026',91500,87300,1,'Enterprise'),('MSR-2026',25300,21600,6,'SMB'),
  ('ALT-2026', 8200, 6100,3,'SMB'),   ('ALT-2026',95400,88200,1,'Enterprise'),
  ('ALT-2026',15600,12400,5,'SMB'),   ('ALT-2026',72300,68100,2,'Enterprise'),
  ('ALT-2026',34500,29800,4,'Startup'),('ALT-2026',11200,9600,7,'Consumer'),
  ('ALT-2026',58700,54200,2,'Enterprise'),('ALT-2026',22100,18900,6,'SMB'),
  ('ALT-2026',47800,43500,3,'Startup'),('ALT-2026', 6500,4800,9,'Consumer'),
  ('ALT-2026',83100,79400,1,'Enterprise'),('ALT-2026',19400,16200,5,'SMB'),
  ('ALT-2026',38900,34100,4,'Startup'),('ALT-2026',12700,10300,8,'Consumer'),
  ('ALT-2026',67200,62800,2,'Enterprise'),('ALT-2026',28600,24400,5,'SMB'),
  ('ALT-2026',52400,48700,3,'Startup'),('ALT-2026', 9800,7900,11,'Consumer'),
  ('ALT-2026',91500,87300,1,'Enterprise'),('ALT-2026',25300,21600,6,'SMB');


-- ── 3h. pnl_bridge ────────────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.pnl_bridge`
  (email_id, Item, Delta)
VALUES
  ('EPR-Q1-2026','Opening',  120000),('EPR-Q1-2026','New Sales', 52000),
  ('EPR-Q1-2026','Upsell',    21000),('EPR-Q1-2026','Churn',    -18500),
  ('EPR-Q1-2026','Refunds',   -7200),('EPR-Q1-2026','OpEx',     -38000),
  ('EPR-Q1-2026','Closing',       0),
  ('EPR-Q4-2025','Opening',  105000),('EPR-Q4-2025','New Sales', 44000),
  ('EPR-Q4-2025','Upsell',    17500),('EPR-Q4-2025','Churn',    -15200),
  ('EPR-Q4-2025','Refunds',   -6100),('EPR-Q4-2025','OpEx',     -34000),
  ('EPR-Q4-2025','Closing',       0);


-- ── 3i. cost_sunburst ─────────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.cost_sunburst`
  (email_id, CostCategory, CostItem, Amount)
VALUES
  ('EPR-Q1-2026','Personnel',     'Salaries',   28000),
  ('EPR-Q1-2026','Personnel',     'Benefits',    6500),
  ('EPR-Q1-2026','Personnel',     'Contractors', 4200),
  ('EPR-Q1-2026','Infrastructure','Cloud',       8800),
  ('EPR-Q1-2026','Infrastructure','Office',      3200),
  ('EPR-Q1-2026','Sales & Mktg', 'Advertising', 7400),
  ('EPR-Q1-2026','Sales & Mktg', 'Events',      3100),
  ('EPR-Q1-2026','Sales & Mktg', 'Commissions', 5600),
  ('EPR-Q1-2026','R&D',          'Engineering', 9200),
  ('EPR-Q1-2026','R&D',          'Research',    4100),
  ('EPR-Q1-2026','G&A',          'Legal',       2800),
  ('EPR-Q1-2026','G&A',          'Finance',     1900),
  ('EPR-Q4-2025','Personnel',     'Salaries',   25500),
  ('EPR-Q4-2025','Personnel',     'Benefits',    5900),
  ('EPR-Q4-2025','Personnel',     'Contractors', 3800),
  ('EPR-Q4-2025','Infrastructure','Cloud',       7900),
  ('EPR-Q4-2025','Infrastructure','Office',      3200),
  ('EPR-Q4-2025','Sales & Mktg', 'Advertising', 6800),
  ('EPR-Q4-2025','Sales & Mktg', 'Events',      2600),
  ('EPR-Q4-2025','Sales & Mktg', 'Commissions', 5100),
  ('EPR-Q4-2025','R&D',          'Engineering', 8500),
  ('EPR-Q4-2025','R&D',          'Research',    3700),
  ('EPR-Q4-2025','G&A',          'Legal',       2500),
  ('EPR-Q4-2025','G&A',          'Finance',     1700);


-- ── 3j. expense_breakdown ─────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.expense_breakdown`
  (email_id, ExpenseType, Amount)
VALUES
  ('EPR-Q1-2026','Personnel',      38700),('EPR-Q1-2026','Infrastructure',12000),
  ('EPR-Q1-2026','Sales & Mktg',   16100),('EPR-Q1-2026','R&D',          13300),
  ('EPR-Q1-2026','G&A',             4700),
  ('EPR-Q4-2025','Personnel',      35200),('EPR-Q4-2025','Infrastructure',11100),
  ('EPR-Q4-2025','Sales & Mktg',   14500),('EPR-Q4-2025','R&D',          12200),
  ('EPR-Q4-2025','G&A',             4200);


-- ── 3k. region_revenue_seg ────────────────────────────────────────────
INSERT INTO `YOUR_PROJECT_ID.prod_reports.region_revenue_seg` VALUES
  ('PAR-2026','North','Enterprise',18200),('PAR-2026','North','SMB',9400),('PAR-2026','North','Startup',3600),
  ('PAR-2026','South','Enterprise',14100),('PAR-2026','South','SMB',7200),('PAR-2026','South','Startup',3200),
  ('PAR-2026','East','Enterprise',10500), ('PAR-2026','East','SMB',5900), ('PAR-2026','East','Startup',2500),
  ('PAR-2026','West','Enterprise',15800), ('PAR-2026','West','SMB',8400), ('PAR-2026','West','Startup',3600);

-- ── 3l. sales_distribution  (strip / boxplot) ────────────────────────
-- PAR-2026 and ALT-2026 and EPR both use this table
INSERT INTO `YOUR_PROJECT_ID.prod_reports.sales_distribution` VALUES
  ('EPR-Q1-2026','North','Q1','Enterprise',92000),('EPR-Q1-2026','North','Q1','SMB',34000),
  ('EPR-Q1-2026','North','Q2','Enterprise',105000),('EPR-Q1-2026','North','Q2','SMB',41000),
  ('EPR-Q1-2026','North','Q3','Enterprise',98000),('EPR-Q1-2026','North','Q3','SMB',38000),
  ('EPR-Q1-2026','North','Q4','Enterprise',118000),('EPR-Q1-2026','North','Q4','SMB',45000),
  ('EPR-Q1-2026','South','Q1','Enterprise',78000),('EPR-Q1-2026','South','Q2','Enterprise',85000),
  ('EPR-Q1-2026','East','Q1','Enterprise',65000), ('EPR-Q1-2026','East','Q2','Enterprise',71000),
  ('EPR-Q1-2026','West','Q1','Enterprise',84000), ('EPR-Q1-2026','West','Q2','Enterprise',96000),
  ('EPR-Q4-2025','North','Q1','Enterprise',80000),('EPR-Q4-2025','North','Q2','Enterprise',88000),
  ('EPR-Q4-2025','North','Q3','Enterprise',85000),('EPR-Q4-2025','North','Q4','Enterprise',100000),
  ('EPR-Q4-2025','South','Q1','Enterprise',68000),('EPR-Q4-2025','South','Q2','Enterprise',74000),
  ('PAR-2026','North','Q1','Enterprise',92000),('PAR-2026','North','Q1','SMB',34000),
  ('PAR-2026','North','Q2','Enterprise',105000),('PAR-2026','North','Q2','SMB',41000),
  ('PAR-2026','South','Q1','Enterprise',78000),('PAR-2026','South','Q1','SMB',29000),
  ('PAR-2026','East','Q1','Enterprise',65000), ('PAR-2026','East','Q1','SMB',24000),
  ('PAR-2026','West','Q1','Enterprise',84000), ('PAR-2026','West','Q1','SMB',31000),
  ('PAR-2026','North','Q1','Startup',18000),('PAR-2026','South','Q2','Startup',19000),
  ('ALT-2026','North','Q1','Enterprise',92000),('ALT-2026','North','Q1','SMB',34000),
  ('ALT-2026','North','Q2','Enterprise',105000),('ALT-2026','North','Q2','SMB',41000),
  ('ALT-2026','North','Q3','Enterprise',98000),('ALT-2026','North','Q3','SMB',38000),
  ('ALT-2026','North','Q4','Enterprise',118000),('ALT-2026','North','Q4','SMB',45000),
  ('ALT-2026','South','Q1','Enterprise',78000),('ALT-2026','South','Q1','SMB',29000),
  ('ALT-2026','East','Q1','Enterprise',65000), ('ALT-2026','East','Q1','SMB',24000),
  ('ALT-2026','West','Q1','Enterprise',84000), ('ALT-2026','West','Q1','SMB',31000),
  ('ALT-2026','North','Q1','Startup',18000),('ALT-2026','South','Q2','Startup',19000);

-- ── 3m. region_monthly  (heatmap) ────────────────────────────────────
-- PAR-2026 and ALT-2026
INSERT INTO `YOUR_PROJECT_ID.prod_reports.region_monthly` VALUES
  ('PAR-2026','North','Jan',18200),('PAR-2026','North','Feb',19400),('PAR-2026','North','Mar',22100),
  ('PAR-2026','North','Apr',20800),('PAR-2026','North','May',24600),('PAR-2026','North','Jun',27300),
  ('PAR-2026','North','Jul',29100),('PAR-2026','North','Aug',27800),('PAR-2026','North','Sep',31200),
  ('PAR-2026','North','Oct',34100),('PAR-2026','North','Nov',32400),('PAR-2026','North','Dec',38900),
  ('PAR-2026','South','Jan',14100),('PAR-2026','South','Feb',15200),('PAR-2026','South','Mar',17400),
  ('PAR-2026','South','Apr',16100),('PAR-2026','South','May',19200),('PAR-2026','South','Jun',21500),
  ('PAR-2026','South','Jul',22800),('PAR-2026','South','Aug',21100),('PAR-2026','South','Sep',24500),
  ('PAR-2026','South','Oct',26800),('PAR-2026','South','Nov',25100),('PAR-2026','South','Dec',30200),
  ('PAR-2026','East','Jan',10500),('PAR-2026','East','Feb',11200),('PAR-2026','East','Mar',12800),
  ('PAR-2026','East','Apr',11900),('PAR-2026','East','May',14100),('PAR-2026','East','Jun',15800),
  ('PAR-2026','East','Jul',16900),('PAR-2026','East','Aug',15600),('PAR-2026','East','Sep',18200),
  ('PAR-2026','East','Oct',19800),('PAR-2026','East','Nov',18500),('PAR-2026','East','Dec',22400),
  ('PAR-2026','West','Jan',15800),('PAR-2026','West','Feb',16900),('PAR-2026','West','Mar',19200),
  ('PAR-2026','West','Apr',17800),('PAR-2026','West','May',21100),('PAR-2026','West','Jun',23600),
  ('PAR-2026','West','Jul',25200),('PAR-2026','West','Aug',23400),('PAR-2026','West','Sep',27200),
  ('PAR-2026','West','Oct',29700),('PAR-2026','West','Nov',27800),('PAR-2026','West','Dec',33500),
  ('ALT-2026','North','Jan',18200),('ALT-2026','North','Feb',19400),('ALT-2026','North','Mar',22100),
  ('ALT-2026','North','Apr',20800),('ALT-2026','North','May',24600),('ALT-2026','North','Jun',27300),
  ('ALT-2026','North','Jul',29100),('ALT-2026','North','Aug',27800),('ALT-2026','North','Sep',31200),
  ('ALT-2026','North','Oct',34100),('ALT-2026','North','Nov',32400),('ALT-2026','North','Dec',38900),
  ('ALT-2026','South','Jan',14100),('ALT-2026','South','Feb',15200),('ALT-2026','South','Mar',17400),
  ('ALT-2026','East','Jan',10500), ('ALT-2026','East','Feb',11200), ('ALT-2026','East','Mar',12800),
  ('ALT-2026','West','Jan',15800), ('ALT-2026','West','Feb',16900), ('ALT-2026','West','Mar',19200);

-- ── 3n. monthly_revenue_2yr  (line_altair — two-year long-form) ──────
-- ALT-2026 contains both year series for the overlay chart
INSERT INTO `YOUR_PROJECT_ID.prod_reports.monthly_revenue_2yr`
  (email_id, Month, Revenue, Year)
VALUES
  ('ALT-2026','Jan',42000,'2026'),('ALT-2026','Feb',47500,'2026'),('ALT-2026','Mar',53200,'2026'),
  ('ALT-2026','Apr',49800,'2026'),('ALT-2026','May',61000,'2026'),('ALT-2026','Jun',67300,'2026'),
  ('ALT-2026','Jul',72100,'2026'),('ALT-2026','Aug',68900,'2026'),('ALT-2026','Sep',74500,'2026'),
  ('ALT-2026','Oct',81200,'2026'),('ALT-2026','Nov',78600,'2026'),('ALT-2026','Dec',91000,'2026'),
  ('ALT-2026','Jan',36000,'2025'),('ALT-2026','Feb',40200,'2025'),('ALT-2026','Mar',44800,'2025'),
  ('ALT-2026','Apr',41500,'2025'),('ALT-2026','May',52000,'2025'),('ALT-2026','Jun',58100,'2025'),
  ('ALT-2026','Jul',61400,'2025'),('ALT-2026','Aug',59200,'2025'),('ALT-2026','Sep',64800,'2025'),
  ('ALT-2026','Oct',70300,'2025'),('ALT-2026','Nov',67900,'2025'),('ALT-2026','Dec',80100,'2025');


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
--   email_list            7   (MSR-2026, MSR-2025, PAR-2026, EPR-Q1-2026, EPR-Q4-2025, SNS-2026, ALT-2026)
--   chart_config_view    17   (5×monthly_sales + 4×product + 4×executive_pnl + 4×altair SELECT rows)
--   monthly_sales        36   (12 months × 3 email_ids: MSR-2026, MSR-2025, ALT-2026)
--   monthly_pnl          24   (12 months × 2 email_ids: EPR-Q1-2026, EPR-Q4-2025)
--   region_revenue       20   (5 regions × 4 email_ids: MSR-2026, MSR-2025, PAR-2026, ALT-2026)
--   category_quarterly    5   (PAR-2026 only)
--   market_share         20   (5 segments × 4 email_ids: MSR-2026, MSR-2025, PAR-2026, ALT-2026)
--   market_sunburst      12   (PAR-2026 only)
--   deal_performance     40   (20 rows × 2 email_ids: MSR-2026, ALT-2026)
--   pnl_bridge           14   (7 items × 2 email_ids: EPR-Q1-2026, EPR-Q4-2025)
--   cost_sunburst        24   (12 items × 2 email_ids: EPR-Q1-2026, EPR-Q4-2025)
--   expense_breakdown    10   (5 types × 2 email_ids: EPR-Q1-2026, EPR-Q4-2025)


-- ══════════════════════════════════════════════════════════════════════
-- 4.  JOIN SANITY CHECK
--     Confirm each (email_id, report_name) gets the right charts.
-- ══════════════════════════════════════════════════════════════════════

SELECT
  el.email_id,
  el.report_name,
  el.recipient_email,
  COUNT(cc.variable_name)                                AS chart_count,
  STRING_AGG(cc.variable_name ORDER BY cc.sort_position) AS variables
FROM `YOUR_PROJECT_ID.YOUR_DATASET.email_list`   el
JOIN `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` cc
     USING (report_name)
GROUP BY 1, 2, 3
ORDER BY 1, 2;

-- Expected:
--  email_id       | report_name                 | recipient_email          | chart_count
--  ALT-2026       | altair_analytics_report     | altair-team@company.com  |  8
--  EPR-Q1-2026    | executive_pnl_report        | leadership@company.com   |  4
--  EPR-Q4-2025    | executive_pnl_report        | board@company.com        |  4
--  MSR-2025       | monthly_sales_report        | sales-archive@company.com|  5
--  MSR-2026       | monthly_sales_report        | sales-team@company.com   |  5
--  PAR-2026       | product_analytics_report    | product-team@company.com |  4
--  SNS-2026       | seaborn_analytics_report    | analytics-team@company.com| 8


-- ══════════════════════════════════════════════════════════════════════
-- 5.  FILTER RESOLUTION PREVIEW
--     Show resolved filter per chart — {email_id} replaced with actual value.
-- ══════════════════════════════════════════════════════════════════════

SELECT
  el.email_id,
  el.report_name,
  el.recipient_email,
  cc.variable_name,
  cc.filters                                                      AS raw_filter,
  REPLACE(cc.filters, '{email_id}', el.email_id)                 AS resolved_filter
FROM `YOUR_PROJECT_ID.YOUR_DATASET.email_list`   el
JOIN `YOUR_PROJECT_ID.YOUR_DATASET.chart_config_view` cc
     USING (report_name)
ORDER BY el.email_id, el.report_name, cc.sort_position;
