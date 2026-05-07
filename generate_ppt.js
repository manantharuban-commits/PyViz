"use strict";
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title  = "PyViz – Why Charts Beat HTML Email Tables";
pres.author = "PyViz Team";

// ── Design tokens ─────────────────────────────────────────────────────
const C = {
  navy:  "0F2D54", blue:  "1565C0", cyan:  "0891B2",
  teal:  "0D9488", slate: "475569", light: "F1F5F9",
  white: "FFFFFF", gray:  "94A3B8", green: "16A34A",
  amber: "D97706", red:   "DC2626", text:  "1E293B",
  muted: "64748B", warn:  "9A3412", code:  "1E3A5F",
  soft:  "EFF6FF",
};
const FONT  = "Calibri";
const CODEF = "Courier New";

// ── Reusable helpers ──────────────────────────────────────────────────
const mkShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

function hdr(s, title, sub) {
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:10,h:0.55, fill:{color:C.navy}, line:{color:C.navy} });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:0.2, h:0.55, fill:{color:C.cyan}, line:{color:C.cyan} });
  s.addText(title, { x:0.35,y:0,w:9.3,h:0.55, fontFace:FONT, fontSize:17, bold:true, color:C.white, valign:"middle", margin:0 });
  if (sub) s.addText(sub, { x:0.35,y:0.55,w:9.3,h:0.3, fontFace:FONT, fontSize:10, color:C.muted, valign:"middle", margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:5.35,w:10,h:0.28, fill:{color:C.light}, line:{color:C.light} });
  s.addText("PyViz · Chart Email Engine · Confidential", { x:0,y:5.35,w:10,h:0.28, fontFace:FONT, fontSize:8, color:C.gray, align:"center", valign:"middle", margin:0 });
}

function card(s, x, y, w, h, opts={}) {
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:opts.bg||C.white}, line:{color:opts.border||"E2E8F0",width:0.75}, shadow:mkShadow() });
}

function accentCard(s, x, y, w, h, clr, opts={}) {
  card(s, x, y, w, h, opts);
  s.addShape(pres.shapes.RECTANGLE, { x,y,w:0.07,h, fill:{color:clr}, line:{color:clr} });
}

function bullets(s, items, x, y, w, h, opts={}) {
  s.addText(
    items.map((t,i) => ({ text:t, options:{ bullet:true, breakLine:i<items.length-1, fontSize:opts.sz||11, color:opts.clr||C.text, bold:opts.bold||false }})),
    { x,y,w,h, fontFace:FONT, valign:"top" }
  );
}

function codeBlock(s, lines, x, y, w, h) {
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.code}, line:{color:"0D2847"}, shadow:mkShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h:0.22, fill:{color:"0D2847"}, line:{color:"0D2847"} });
  s.addText("SQL", { x:x+0.08,y,w:0.5,h:0.22, fontFace:FONT, fontSize:8, bold:true, color:C.gray, valign:"middle", margin:0 });
  s.addText(lines, { x:x+0.12, y:y+0.25, w:w-0.2, h:h-0.32, fontFace:CODEF, fontSize:9, color:"7DD3FC", valign:"top", margin:0 });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:10,h:5.625, fill:{color:C.navy}, line:{color:C.navy} });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:0.2,h:5.625, fill:{color:C.cyan}, line:{color:C.cyan} });
  s.addShape(pres.shapes.RECTANGLE, { x:6.8,y:0,w:3.2,h:5.625, fill:{color:"0D1F3C"}, line:{color:"0D1F3C"} });

  // Dot grid decoration
  for (let r=0;r<4;r++) for(let c=0;c<3;c++) {
    s.addShape(pres.shapes.OVAL, { x:7.2+c*0.55, y:0.8+r*0.55, w:0.09, h:0.09, fill:{color:C.cyan,transparency:55}, line:{color:C.cyan,transparency:55} });
  }

  s.addText("PyViz", { x:0.5,y:0.75,w:7,h:0.9, fontFace:FONT, fontSize:56, bold:true, color:C.cyan, margin:0 });
  s.addText("Why Outlook HTML Reports Need This", { x:0.5,y:1.6,w:7.5,h:0.55, fontFace:FONT, fontSize:22, color:C.white, margin:0 });
  s.addShape(pres.shapes.LINE, { x:0.5,y:2.22,w:5.8,h:0, line:{color:C.cyan,width:1.8} });
  s.addText([
    { text: "Pie charts. Line charts. Heatmaps. Funnels.", options:{ bold:true, color:C.cyan, breakLine:true }},
    { text: "None of them work in Outlook HTML email — until now.", options:{ color:C.white }},
  ], { x:0.5,y:2.32,w:7.5,h:0.7, fontFace:FONT, fontSize:13, margin:0 });

  s.addText("For Senior Management  ·  May 2026", { x:0.5,y:5.1,w:5,h:0.28, fontFace:FONT, fontSize:10, color:C.gray, margin:0 });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Real Problem: Outlook Strips Charts
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  hdr(s, "The Problem — Outlook Blocks Every Chart Library", "Your current HTML+SQL email cannot render visual charts — here is why");

  // Left: what outlook blocks
  s.addText("What Outlook Strips or Ignores", { x:0.3,y:0.92,w:4.6,h:0.35, fontFace:FONT, fontSize:12, bold:true, color:C.warn, margin:0 });

  const blocked = [
    { tech:"<canvas> tag",         reason:"Outlook renders in Word engine — no canvas support" },
    { tech:"SVG inline",           reason:"Most Outlook versions strip <svg> completely" },
    { tech:"JavaScript",           reason:"All JS blocked — chart.js, D3.js, Highcharts all dead" },
    { tech:"CSS animations",       reason:"Stripped — no animated charts or transitions" },
    { tech:"@font-face / web fonts",reason:"Substituted — chart text looks broken" },
    { tech:"Flexbox / Grid CSS",   reason:"Ignored — layouts collapse or misalign" },
  ];

  blocked.forEach((b,i) => {
    const y = 1.35 + i*0.62;
    s.addShape(pres.shapes.RECTANGLE, { x:0.3,y,w:4.55,h:0.55, fill:{color:C.white}, line:{color:"FCA5A5",width:0.75}, shadow:mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x:0.3,y,w:0.07,h:0.55, fill:{color:C.red}, line:{color:C.red} });
    s.addText("✗ "+b.tech, { x:0.5,y:y+0.04,w:4.2,h:0.24, fontFace:CODEF, fontSize:10, bold:true, color:C.red, margin:0 });
    s.addText(b.reason, { x:0.5,y:y+0.28,w:4.2,h:0.22, fontFace:FONT, fontSize:9, color:C.muted, margin:0 });
  });

  // Right: what you're limited to without PyViz
  s.addText("Your Current HTML Email = Tables Only", { x:5.1,y:0.92,w:4.6,h:0.35, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });

  card(s, 5.05, 1.35, 4.65, 3.75, { bg:"FFF7ED", border:"FCD34D" });
  s.addText([
    { text:"Without PyViz, your HTML email reports are limited to:\n", options:{bold:true, breakLine:false}},
  ], { x:5.2,y:1.45,w:4.35,h:0.3, fontFace:FONT, fontSize:10, color:C.warn, margin:0 });

  const limits = [
    "HTML tables with raw numbers",
    "Bold / colour-coded cells at best",
    "Static text summaries",
    "Manually pasted screenshot images (stale)",
    "No trendlines, no proportions, no distributions",
    "Reader must interpret numbers — no visual story",
    "Zero personalisation per recipient",
  ];
  bullets(s, limits, 5.2, 1.82, 4.4, 3.1, { sz:10.5, clr:C.text });

  s.addText("Result: Reports are data dumps, not insights.", {
    x:5.1,y:4.95,w:4.65,h:0.28, fontFace:FONT, fontSize:10, bold:true, color:C.red, align:"center", margin:0
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 3 — How PyViz Solves It
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "How PyViz Solves It — Server-Side Rendering to Base64 PNG", "Charts render in Python, injected as <img> tags — works in every email client");

  // Flow diagram: 3 boxes + arrows
  const boxes = [
    { title:"Your Existing\nBigQuery Data", sub:"No schema changes.\nUse prod_reports as-is.", color:C.navy, x:0.3 },
    { title:"PyViz Engine\nRenders Charts", sub:"Python + Vega-Altair\nServer-side PNG export.", color:C.teal, x:3.55 },
    { title:"Outlook-Safe\nHTML Email", sub:"Pure <img> base64 tags.\nNo JS. No SVG. Just pixels.", color:C.green, x:6.8 },
  ];

  boxes.forEach((b,i) => {
    card(s, b.x, 0.95, 3.0, 2.2);
    s.addShape(pres.shapes.RECTANGLE, { x:b.x,y:0.95,w:3.0,h:0.55, fill:{color:b.color}, line:{color:b.color} });
    s.addText(b.title, { x:b.x+0.1,y:0.95,w:2.8,h:0.55, fontFace:FONT, fontSize:11, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });
    s.addText(b.sub, { x:b.x+0.15,y:1.56,w:2.7,h:1.52, fontFace:FONT, fontSize:11, color:C.text, valign:"top", align:"center", margin:0 });
    if (i<2) {
      s.addShape(pres.shapes.LINE, { x:b.x+3.0,y:2.05,w:0.55,h:0, line:{color:C.teal,width:2} });
      s.addText("→", { x:b.x+3.0,y:1.9,w:0.55,h:0.3, fontFace:FONT, fontSize:16, bold:true, color:C.teal, align:"center", margin:0 });
    }
  });

  // The key insight box
  s.addShape(pres.shapes.RECTANGLE, { x:0.3,y:3.25,w:9.4,h:0.62, fill:{color:C.navy}, line:{color:C.navy} });
  s.addText([
    { text:"The trick: ", options:{bold:false}},
    { text:'<img src="data:image/png;base64, ... ">', options:{fontFace:CODEF, bold:true}},
    { text:" — a plain image tag. Outlook renders images. Always has.", options:{bold:false}},
  ], { x:0.4,y:3.25,w:9.2,h:0.62, fontFace:FONT, fontSize:12, color:C.white, valign:"middle", margin:0 });

  // Bottom 3 outcomes
  const outcomes = [
    { label:"Pie Charts",    body:"Proportions & share — impossible in HTML tables, trivial in PyViz", color:C.blue },
    { label:"Line / Area",   body:"Trends over time — a number series can't show direction or inflection points", color:C.teal },
    { label:"Heatmap / Funnel", body:"Patterns & drop-offs — multi-dimensional insight no HTML table can convey", color:C.cyan },
  ];

  outcomes.forEach((o,i) => {
    const x = 0.3 + i*3.22;
    card(s, x, 3.98, 3.0, 1.2);
    s.addShape(pres.shapes.RECTANGLE, { x,y:3.98,w:3.0,h:0.3, fill:{color:o.color}, line:{color:o.color} });
    s.addText(o.label, { x:x+0.1,y:3.98,w:2.8,h:0.3, fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });
    s.addText(o.body, { x:x+0.12,y:4.32,w:2.76,h:0.8, fontFace:FONT, fontSize:10, color:C.text, valign:"middle", align:"center", margin:0 });
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 4 — Complete Workflow: email_list → email_output
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Complete Workflow — email_list to email_output", "Every step is driven by configuration — no code changes per report");

  // Vertical step flow
  const steps = [
    { n:"01", color:C.navy,  title:"email_list  (BigQuery table)",
      detail:"One row per (report_name × email_id). Holds: recipient_email, subject, html_template with {{CHART}} placeholders, filter_params JSON (per-recipient variable overrides)." },
    { n:"02", color:C.blue,  title:"JOIN  email_list ⋈ chart_config_view",
      detail:"Engine joins on report_name. Result: one row per (recipient × chart). Supplies chart_type, bq_table, filters, x_column, y_columns, title, color_theme, sort_position, width_px, height_px." },
    { n:"03", color:C.cyan,  title:"Token Resolution  (per recipient group)",
      detail:"{today}, {this_month}, {this_quarter_year} auto-computed. filter_params JSON merged on top — e.g. employee_id='EMP-042' applied in WHERE clause. Subject line and title strings also resolved." },
    { n:"04", color:C.teal,  title:"Parallel Chart Render  (4 threads)",
      detail:"Each {{PLACEHOLDER}} in html_template triggers: resolve filters → SELECT x,y FROM bq_table WHERE filters → fetch data → Altair render → vl-convert → base64 PNG string." },
    { n:"05", color:C.green, title:"Inject + Save HTML File",
      detail:"Every {{PLACEHOLDER}} replaced with Outlook-safe <img src='data:image/png;base64,...'>. One .html file written per (report_name × email_id) to output_emails/." },
    { n:"06", color:C.amber, title:"email_output  (BigQuery audit table)",
      detail:"Row written: report_name, recipient_email, status (SUCCESS/WARN/FAILED), charts_injected / total_charts, error_message, processed_at timestamp." },
  ];

  const colW = [0.45, 8.8];
  steps.forEach((st,i) => {
    const y = 0.9 + i*0.76;
    // Step badge
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y,w:0.45,h:0.65, fill:{color:st.color}, line:{color:st.color} });
    s.addText(st.n, { x:0.25,y,w:0.45,h:0.65, fontFace:FONT, fontSize:10, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    // Connector
    if (i<steps.length-1) s.addShape(pres.shapes.LINE, { x:0.47,y:y+0.65,w:0,h:0.11, line:{color:st.color,width:1.5} });
    // Content
    const isFirst = i===0, isLast = i===5;
    const bgColor = isFirst?"EFF6FF": isLast?"ECFDF5": C.white;
    s.addShape(pres.shapes.RECTANGLE, { x:0.78,y:y,w:9.0,h:0.65, fill:{color:bgColor}, line:{color:"E2E8F0",width:0.5} });
    s.addShape(pres.shapes.RECTANGLE, { x:0.78,y:y,w:0.06,h:0.65, fill:{color:st.color}, line:{color:st.color} });
    s.addText(st.title, { x:0.96,y:y+0.04,w:3.0,h:0.28, fontFace:FONT, fontSize:10, bold:true, color:st.color, margin:0 });
    s.addText(st.detail, { x:0.96,y:y+0.3,w:8.7,h:0.32, fontFace:FONT, fontSize:9, color:C.muted, margin:0 });
  });

  s.addText("BigQuery is the only system touched — no files to manage, no manual steps.", {
    x:0.25,y:5.15,w:9.5,h:0.22, fontFace:FONT, fontSize:9, italic:true, color:C.muted, align:"center", margin:0
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 5 — Adding ONE Chart: Effort Detail
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Adding One New Chart — 15 Minutes, SQL Only, Zero Python", "An analyst adds a chart by writing one SQL block and one token — nothing else");

  // Step badges with wide content
  const steps = [
    {
      n:"1", color:C.blue, time:"5 min",
      title:"Append ONE UNION ALL block to chart_config_view",
      note:"This is the only 'code' needed — plain SQL in BigQuery console.",
      code:`-- Add this to chart_config_view DDL:
SELECT
  'Monthly_Sales_Report'  AS report_name,
  'REGION_PIE'            AS variable_name,   -- matches {{REGION_PIE}} in template
  3                       AS sort_position,
  'arc_altair'            AS chart_type,       -- pie / donut
  'prod_reports.sales'    AS bq_table,
  'month = {this_month}'  AS filters,          -- token auto-resolved at run time
  'region'                AS x_column,
  'revenue'               AS y_columns,
  'Revenue by Region'     AS title,
  '{this_month} Sales Mix' AS subtitle,
  'vibrant'               AS color_theme,
  600                     AS width_px,
  340                     AS height_px`
    },
    {
      n:"2", color:C.teal, time:"2 min",
      title:"Insert {{REGION_PIE}} placeholder into html_template (email_list)",
      note:"Just UPDATE one column in email_list. The engine detects the token automatically.",
      code:`-- In email_list table — add placeholder in html_template:
UPDATE email_list
SET html_template = html_template || '
  <h3>Revenue Mix This Month</h3>
  {{REGION_PIE}}
'
WHERE report_name = 'Monthly_Sales_Report';`
    },
    {
      n:"3", color:C.green, time:"30 sec",
      title:"Run the engine — chart appears in every recipient's email",
      note:"No Python edits. No deployments. Engine picks up new row automatically.",
      code:`python chart_email_engine_v15.py

  ✓ 'REGION_PIE'  [arc_altair]  pos=3  (42,811 chars)
  ✓ Saved → output_emails/Monthly_Sales_Report__EMP001.html
  ✓ Status: SUCCESS  charts=3/3`
    },
  ];

  steps.forEach((st,i) => {
    const y = 0.9 + i*1.5;
    // Badge
    s.addShape(pres.shapes.OVAL, { x:0.25,y:y+0.05,w:0.48,h:0.48, fill:{color:st.color}, line:{color:st.color} });
    s.addText(st.n, { x:0.25,y:y+0.05,w:0.48,h:0.48, fontFace:FONT, fontSize:16, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    // Time pill
    s.addShape(pres.shapes.RECTANGLE, { x:0.82,y:y+0.08,w:0.7,h:0.26, fill:{color:st.color,transparency:82}, line:{color:st.color} });
    s.addText(st.time, { x:0.82,y:y+0.08,w:0.7,h:0.26, fontFace:FONT, fontSize:8, bold:true, color:st.color, align:"center", valign:"middle", margin:0 });
    // Title
    s.addText(st.title, { x:1.6,y:y+0.05,w:8.1,h:0.3, fontFace:FONT, fontSize:11, bold:true, color:C.text, margin:0 });
    // Code block
    codeBlock(s, st.code, 0.82, y+0.42, 7.0, 0.94);
    // Note
    s.addText("💡 "+st.note, { x:7.94,y:y+0.42,w:1.82,h:0.94, fontFace:FONT, fontSize:8.5, color:C.muted, valign:"middle", margin:0 });
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 6 — Variable / Token System
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Dynamic Variables — One Chart Config, N Personalised Views", "Tokens in filters/titles auto-resolve per recipient — no duplicate config rows needed");

  // Priority stack (left)
  s.addText("How Tokens Are Resolved", { x:0.3,y:0.9,w:4.5,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });

  const levels = [
    { rank:"Highest", label:"filter_params JSON", sub:"Per-recipient override in email_list.\nE.g. {\"email_id\":\"EMP-042\",\"region\":\"South\"}", color:C.blue },
    { rank:"Middle",  label:"TABLE_VARS (config.py)", sub:"Global constants — e.g. env=prod.\nApply to every email in this run.", color:C.teal },
    { rank:"Lowest",  label:"Built-in Runtime Tokens", sub:"{today} {this_month} {this_quarter_year}\n{last_quarter_year} {this_year}", color:C.navy },
  ];

  levels.forEach((lv,i) => {
    const y = 1.3 + i*1.22;
    const w = 4.2 - i*0.5;
    const x = 0.3 + i*0.25;
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h:1.05, fill:{color:lv.color}, line:{color:lv.color}, shadow:mkShadow() });
    s.addText(lv.rank.toUpperCase(), { x:x+0.1,y:y+0.04,w:w-0.2,h:0.2, fontFace:FONT, fontSize:7.5, bold:true, color:"BAE6FD", margin:0 });
    s.addText(lv.label, { x:x+0.1,y:y+0.22,w:w-0.2,h:0.3, fontFace:FONT, fontSize:11, bold:true, color:C.white, margin:0 });
    s.addText(lv.sub, { x:x+0.1,y:y+0.5,w:w-0.2,h:0.5, fontFace:FONT, fontSize:9, color:"BAE6FD", margin:0 });
  });

  // Right: token reference table
  s.addText("Token Reference", { x:4.9,y:0.9,w:4.8,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });

  const tokens = [
    ["{today}",             "2026-05-07",      "SQL WHERE / titles"],
    ["{this_month}",        "2026-05",         "SQL filters, chart subtitle"],
    ["{this_year}",         "2026",            "SQL filters, titles"],
    ["{this_quarter_year}", "Q2-2026",         "Quarter reports"],
    ["{last_quarter_year}", "Q1-2026",         "QoQ comparison charts"],
    ["{email_id}",          "EMP-042",         "Per-recipient row filter"],
    ["Custom token",        "Any string",      "Via filter_params JSON"],
    ["{{CHART_VAR}}",       "→ <img> tag",     "html_template placeholder"],
  ];

  card(s, 4.85, 1.3, 4.85, 3.45, {bg:C.light});
  ["Token","Resolves to","Used in"].forEach((h,i) => {
    const xo=[4.85,6.55,7.95], wo=[1.65,1.35,1.72];
    s.addShape(pres.shapes.RECTANGLE, { x:xo[i],y:1.3,w:wo[i],h:0.32, fill:{color:C.navy}, line:{color:C.navy} });
    s.addText(h, { x:xo[i],y:1.3,w:wo[i],h:0.32, fontFace:FONT, fontSize:9, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
  });

  tokens.forEach((row,i) => {
    const y = 1.65+i*0.38;
    const bg = i%2===0 ? C.white : C.light;
    s.addShape(pres.shapes.RECTANGLE, { x:4.85,y,w:4.85,h:0.37, fill:{color:bg}, line:{color:"E2E8F0",width:0.5} });
    s.addText(row[0], { x:4.9,y,w:1.58,h:0.37, fontFace:CODEF, fontSize:8.5, color:C.blue, valign:"middle", margin:0 });
    s.addText(row[1], { x:6.55,y,w:1.32,h:0.37, fontFace:FONT, fontSize:9, color:C.green, bold:true, valign:"middle", align:"center", margin:0 });
    s.addText(row[2], { x:7.9,y,w:1.75,h:0.37, fontFace:FONT, fontSize:8.5, color:C.muted, valign:"middle", margin:0 });
  });

  s.addText("Example: filters = \"employee_id = '{email_id}' AND month = '{this_month}'\"  →  different SQL per recipient, same config row.", {
    x:0.3,y:5.1,w:9.4,h:0.25, fontFace:FONT, fontSize:9, italic:true, color:C.muted, align:"center", margin:0
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 7 — All 14 Chart Types
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "14 Chart Types Available Today — All Config-Driven", "Set chart_type in chart_config_view — no Python changes needed for any of these");

  const charts = [
    // Trend
    { name:"line_altair",         label:"Line Chart",      use:"Trend over time",            color:C.blue, cat:"TREND",    ex:"Monthly revenue, ticket volume" },
    { name:"area_altair",         label:"Area Chart",      use:"Cumulative trend + fill",     color:C.blue, cat:"TREND",    ex:"Running total, usage over months" },
    // Compare
    { name:"bar_altair",          label:"Horizontal Bar",  use:"Ranked comparison",           color:C.navy, cat:"COMPARE",  ex:"Top products, region ranking" },
    { name:"grouped_bar_altair",  label:"Grouped Bar",     use:"Side-by-side comparison",     color:C.navy, cat:"COMPARE",  ex:"This vs last quarter by category" },
    { name:"stacked_bar_altair",  label:"Stacked Bar",     use:"Part-to-whole over groups",   color:C.navy, cat:"COMPARE",  ex:"Revenue by product line by month" },
    // Part-to-Whole
    { name:"arc_altair",          label:"Arc / Pie / Donut",use:"Share & proportion",         color:C.cyan, cat:"PART",     ex:"Revenue mix by region" },
    { name:"funnel_altair",       label:"Funnel",          use:"Conversion drop-off",         color:C.cyan, cat:"PART",     ex:"Lead → Opportunity → Closed Won" },
    // Relation
    { name:"scatter_altair",      label:"Bubble Scatter",  use:"Correlation + size",          color:C.teal, cat:"RELATION", ex:"Cost vs revenue, sized by volume" },
    { name:"heatmap_altair",      label:"Heatmap",         use:"2-D pattern intensity",       color:C.teal, cat:"RELATION", ex:"Day × hour activity matrix" },
    { name:"strip_altair",        label:"Strip Plot",      use:"Distribution across groups",  color:C.teal, cat:"DIST.",    ex:"Order values by category" },
    { name:"boxplot_altair",      label:"Box Plot",        use:"Statistical spread & outliers",color:C.teal, cat:"DIST.",   ex:"NPS score distribution by region" },
    // KPI
    { name:"metric_card",         label:"Metric Card",     use:"Single KPI headline",         color:C.amber, cat:"KPI",    ex:"Total ARR, MoM % change" },
    { name:"bullet_altair",       label:"Bullet Chart",    use:"Actual vs target vs band",    color:C.amber, cat:"KPI",    ex:"Sales target attainment" },
    // Detail
    { name:"table_chart",         label:"Data Table",      use:"Formatted detail grid",       color:C.slate, cat:"DETAIL",  ex:"Top 10 accounts, raw breakdown" },
  ];

  const cols=4, cellW=2.35, cellH=1.18, sx=0.2, sy=0.92, gx=0.06, gy=0.08;
  charts.forEach((ch,i) => {
    const col=i%cols, row=Math.floor(i/cols);
    const x=sx+col*(cellW+gx), y=sy+row*(cellH+gy);
    card(s, x, y, cellW, cellH);
    s.addShape(pres.shapes.RECTANGLE, { x,y,w:cellW,h:0.25, fill:{color:ch.color}, line:{color:ch.color} });
    s.addText(ch.cat, { x,y,w:cellW,h:0.25, fontFace:FONT, fontSize:7.5, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    s.addText(ch.label, { x:x+0.1,y:y+0.27,w:cellW-0.2,h:0.3, fontFace:FONT, fontSize:10.5, bold:true, color:C.text, margin:0 });
    s.addText(ch.use, { x:x+0.1,y:y+0.55,w:cellW-0.2,h:0.24, fontFace:FONT, fontSize:9, color:ch.color, italic:true, margin:0 });
    s.addText("e.g. "+ch.ex, { x:x+0.1,y:y+0.77,w:cellW-0.2,h:0.35, fontFace:FONT, fontSize:8.5, color:C.muted, margin:0 });
    s.addText(ch.name, { x:x+0.1,y:y+1.02,w:cellW-0.2,h:0.13, fontFace:CODEF, fontSize:7, color:C.gray, margin:0 });
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 8 — Storytelling: Before vs After (specific report scenarios)
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Improving Report Storytelling — Before vs After PyViz Charts", "Same data, radically different insight — charts answer questions tables can't");

  const scenarios = [
    {
      q: "Is revenue growing or declining?",
      before:"A column of 12 monthly numbers in a table",
      after:"line_altair — trend line instantly shows direction, inflection points, seasonality",
      chart:"line_altair", color:C.blue,
    },
    {
      q: "Which region contributes most?",
      before:"% column in a table — reader must compare 8 rows mentally",
      after:"arc_altair (pie/donut) — proportion is visual and instant",
      chart:"arc_altair", color:C.cyan,
    },
    {
      q: "Where does our pipeline drop off?",
      before:"Four separate count cells in a table",
      after:"funnel_altair — each stage drop-off is visible, call-to-action obvious",
      chart:"funnel_altair", color:C.teal,
    },
    {
      q: "Are we hitting sales target?",
      before:"Two numbers: actual and target",
      after:"bullet_altair — shows actual vs target vs tolerance band at a glance",
      chart:"bullet_altair", color:C.amber,
    },
    {
      q: "Which product × month is weakest?",
      before:"A pivot table — reader must scan entire grid",
      after:"heatmap_altair — colour intensity shows problem cells instantly",
      chart:"heatmap_altair", color:C.navy,
    },
    {
      q: "How does this month compare to last?",
      before:"Side-by-side numbers — requires arithmetic to see delta",
      after:"grouped_bar_altair — comparison is visual, delta is obvious",
      chart:"grouped_bar_altair", color:"6D28D9",
    },
  ];

  const cols=2, cw=4.7, ch=1.12, sx=0.25, sy=0.9, gx=0.1, gy=0.05;
  scenarios.forEach((sc,i) => {
    const col=i%cols, row=Math.floor(i/cols);
    const x=sx+col*(cw+gx), y=sy+row*(ch+gy);
    card(s, x, y, cw, ch);
    // Question header
    s.addShape(pres.shapes.RECTANGLE, { x,y,w:cw,h:0.28, fill:{color:sc.color,transparency:10}, line:{color:sc.color,transparency:10} });
    s.addText("❓ "+sc.q, { x:x+0.1,y,w:cw-0.2,h:0.28, fontFace:FONT, fontSize:9.5, bold:true, color:C.white, valign:"middle", margin:0 });
    // Before
    s.addShape(pres.shapes.RECTANGLE, { x:x+0.1,y:y+0.32,w:0.46,h:0.2, fill:{color:C.red,transparency:10}, line:{color:C.red,transparency:10} });
    s.addText("Before", { x:x+0.1,y:y+0.32,w:0.46,h:0.2, fontFace:FONT, fontSize:7, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    s.addText(sc.before, { x:x+0.62,y:y+0.3,w:cw-0.72,h:0.25, fontFace:FONT, fontSize:9, color:C.red, valign:"middle", margin:0 });
    // After
    s.addShape(pres.shapes.RECTANGLE, { x:x+0.1,y:y+0.62,w:0.46,h:0.2, fill:{color:C.green,transparency:10}, line:{color:C.green,transparency:10} });
    s.addText("After", { x:x+0.1,y:y+0.62,w:0.46,h:0.2, fontFace:FONT, fontSize:7, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    s.addText("→ "+sc.after, { x:x+0.62,y:y+0.6,w:cw-0.72,h:0.45, fontFace:FONT, fontSize:9, color:C.green, valign:"top", margin:0 });
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 9 — Comparison Table: HTML SQL Email vs PyViz
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "HTML + SQL Email Today vs PyViz — Side by Side", "Both use BigQuery and HTML — PyViz adds the visual layer your current stack cannot");

  const rows = [
    { cap:"Data source",            html:"BigQuery SQL — same as today", pyviz:"Same BigQuery tables — no migration" },
    { cap:"Chart rendering",        html:"Not possible in Outlook HTML", pyviz:"Server-side PNG — works in all clients" },
    { cap:"Pie / Donut charts",     html:"Blocked (SVG/JS stripped)",    pyviz:"arc_altair — config only" },
    { cap:"Line / Area trends",     html:"Blocked (canvas / JS)",        pyviz:"line_altair / area_altair" },
    { cap:"Heatmaps",               html:"Impossible — 2D needs canvas", pyviz:"heatmap_altair — intensity colours" },
    { cap:"Funnel / conversion",    html:"Four cells in a table",        pyviz:"funnel_altair — visual drop-off" },
    { cap:"Per-recipient filter",   html:"Separate SQL query per person",pyviz:"{email_id} token in shared config" },
    { cap:"Adding a new metric",    html:"Edit HTML + test across clients",pyviz:"Add UNION ALL row in BQ view — 15 min" },
    { cap:"Personalised subject",   html:"Manual per recipient",          pyviz:"Resolved from filter_params JSON" },
    { cap:"Dark mode",              html:"Not feasible",                  pyviz:"dark_mode flag per chart" },
    { cap:"Audit / error tracking", html:"No built-in mechanism",        pyviz:"email_output table — status + errors" },
  ];

  const hdrY = 0.9;
  const cols = [{label:"Capability",x:0.25,w:2.5},{label:"Current HTML + SQL Email",x:2.8,w:3.35},{label:"With PyViz",x:6.2,w:3.5}];
  const hdColors = [C.navy, C.red, C.green];
  cols.forEach((c,i)=>{
    s.addShape(pres.shapes.RECTANGLE,{x:c.x,y:hdrY,w:c.w,h:0.35,fill:{color:hdColors[i]},line:{color:hdColors[i]}});
    s.addText(c.label,{x:c.x,y:hdrY,w:c.w,h:0.35,fontFace:FONT,fontSize:9.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  });

  rows.forEach((row,i)=>{
    const y=1.28+i*0.37;
    const bg=i%2===0?C.white:C.light;
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y,w:9.45,h:0.36,fill:{color:bg},line:{color:"E2E8F0",width:0.5}});
    s.addText(row.cap,{x:0.3,y,w:2.42,h:0.36,fontFace:FONT,fontSize:9,bold:true,color:C.text,valign:"middle",margin:0});
    s.addText("✗  "+row.html,{x:2.85,y,w:3.25,h:0.36,fontFace:FONT,fontSize:9,color:C.red,valign:"middle",margin:0});
    s.addText("✓  "+row.pyviz,{x:6.25,y,w:3.4,h:0.36,fontFace:FONT,fontSize:9,color:C.green,valign:"middle",margin:0});
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 10 — Effort Summary
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Effort Summary — Setup Once, Extend Forever Without Python", "One-time investment unlocks permanent self-serve chart capability for analysts");

  // One-time setup
  s.addText("One-Time Setup (~4 days total)", {
    x:0.3,y:0.9,w:4.55,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0
  });

  const setup = [
    ["Deploy engine + BQ schema",    "1 day",   "Python Dev + DBA"],
    ["HTML email template",          "0.5 day", "Analyst"],
    ["Initial chart_config_view",    "0.5 day", "Analyst"],
    ["GCP service account + IAM",    "0.5 day", "GCP Admin"],
    ["Scheduling (Cloud Scheduler)", "0.5 day", "DevOps"],
    ["First live report validation", "1 day",   "Analyst + Dev"],
  ];

  const hdrs2 = ["Task","Effort","Owner"];
  const xo=[0.3,2.78,3.75], wo=[2.42,0.9,1.12];
  hdrs2.forEach((h,i)=>{
    s.addShape(pres.shapes.RECTANGLE,{x:xo[i],y:1.28,w:wo[i],h:0.3,fill:{color:C.navy},line:{color:C.navy}});
    s.addText(h,{x:xo[i],y:1.28,w:wo[i],h:0.3,fontFace:FONT,fontSize:9,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  });
  setup.forEach((r,i)=>{
    const y=1.6+i*0.37;
    const bg=i%2===0?C.white:C.light;
    s.addShape(pres.shapes.RECTANGLE,{x:0.3,y,w:4.62,h:0.36,fill:{color:bg},line:{color:"E2E8F0",width:0.5}});
    s.addText(r[0],{x:0.35,y,w:2.36,h:0.36,fontFace:FONT,fontSize:9,color:C.text,valign:"middle",margin:0});
    s.addText(r[1],{x:2.78,y,w:0.86,h:0.36,fontFace:FONT,fontSize:9,color:C.blue,bold:true,align:"center",valign:"middle",margin:0});
    s.addText(r[2],{x:3.72,y,w:1.15,h:0.36,fontFace:FONT,fontSize:8.5,color:C.muted,valign:"middle",margin:0});
  });
  const totY=1.6+setup.length*0.37;
  s.addShape(pres.shapes.RECTANGLE,{x:0.3,y:totY,w:4.62,h:0.36,fill:{color:C.teal,transparency:82},line:{color:C.teal}});
  s.addText("Total",{x:0.35,y:totY,w:2.36,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.teal,valign:"middle",margin:0});
  s.addText("~4 days",{x:2.78,y:totY,w:0.86,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.teal,align:"center",valign:"middle",margin:0});

  // Ongoing effort
  s.addText("Ongoing — Analyst Self-Serve (No Dev Needed)", {
    x:5.1,y:0.9,w:4.6,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0
  });

  const ongoing = [
    { task:"Add chart to existing report", effort:"~15 min", who:"Analyst (SQL)", color:C.green },
    { task:"Add new report recipient",     effort:"~2 min",  who:"Analyst (INSERT)", color:C.green },
    { task:"Change title / colour theme",  effort:"~2 min",  who:"Analyst (UPDATE)", color:C.green },
    { task:"New report from scratch",      effort:"2–3 hrs", who:"Analyst + Dev", color:C.teal },
    { task:"Add entirely new chart type",  effort:"~0.5 day",who:"Python Dev (once)", color:C.amber },
    { task:"Scheduled automated run",      effort:"0 min",   who:"Fully automated", color:C.blue },
  ];

  ongoing.forEach((item,i)=>{
    const y=1.28+i*0.68;
    accentCard(s, 5.05, y, 4.65, 0.6, item.color);
    s.addText(item.task,{x:5.28,y:y+0.06,w:4.25,h:0.28,fontFace:FONT,fontSize:10.5,bold:true,color:C.text,margin:0});
    s.addText(`${item.effort}  ·  ${item.who}`,{x:5.28,y:y+0.33,w:4.25,h:0.22,fontFace:FONT,fontSize:9,color:C.muted,margin:0});
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 11 — Impact at a Glance (dark)
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:5.625,fill:{color:C.navy},line:{color:C.navy}});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:0.2,h:5.625,fill:{color:C.cyan},line:{color:C.cyan}});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.65,fill:{color:"0D1F3C"},line:{color:"0D1F3C"}});
  s.addText("Impact at a Glance", {x:0.35,y:0,w:9.3,h:0.65,fontFace:FONT,fontSize:20,bold:true,color:C.white,valign:"middle",margin:0});

  const stats = [
    { v:"0",       u:"Code changes",      s:"to add a new chart", color:C.cyan },
    { v:"~15 min", u:"Analyst effort",    s:"per new chart (SQL only)", color:C.teal },
    { v:"14",      u:"Chart types",       s:"all available today", color:"38BDF8" },
    { v:"~4 days", u:"Total setup",       s:"production ready end-to-end", color:C.green },
    { v:"1 run",   u:"Generates N emails",s:"personalised per recipient", color:C.amber },
    { v:"∞",       u:"Outlook compatible",s:"base64 PNG — every email client", color:"A78BFA" },
  ];

  const cols=3;
  stats.forEach((st,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const x=0.4+col*3.2, y=0.82+row*2.35;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:2.9,h:2.1,fill:{color:"ffffff",transparency:92},line:{color:st.color,width:1.5},shadow:mkShadow()});
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:2.9,h:0.14,fill:{color:st.color},line:{color:st.color}});
    s.addText(st.v,{x:x+0.1,y:y+0.2,w:2.7,h:0.88,fontFace:FONT,fontSize:36,bold:true,color:st.color,align:"center",valign:"middle",margin:0});
    s.addText(st.u,{x:x+0.1,y:y+1.1,w:2.7,h:0.42,fontFace:FONT,fontSize:11,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(st.s,{x:x+0.1,y:y+1.55,w:2.7,h:0.4,fontFace:FONT,fontSize:9,color:C.gray,align:"center",valign:"middle",margin:0});
  });

  s.addShape(pres.shapes.RECTANGLE,{x:0,y:5.35,w:10,h:0.28,fill:{color:"0D1F3C"},line:{color:"0D1F3C"}});
  s.addText("PyViz · Automated Chart Email Engine · Confidential",{x:0,y:5.35,w:10,h:0.28,fontFace:FONT,fontSize:8,color:C.gray,align:"center",valign:"middle",margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 12 — Summary & Next Steps
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  hdr(s, "Summary & Recommended Next Steps", "");

  s.addText("What PyViz Gives You Over HTML + SQL Email", {
    x:0.3,y:0.92,w:5.8,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0
  });

  const takes = [
    "Your existing HTML reports cannot render pie charts, line charts, heatmaps, or funnels in Outlook — Outlook strips every chart technology (canvas, SVG, JS).",
    "PyViz renders charts server-side in Python and injects base64 PNG <img> tags — the one format Outlook has always supported.",
    "Adding a chart takes 15 minutes of SQL — one UNION ALL block in chart_config_view plus one {{TOKEN}} in the HTML template.",
    "Tokens like {this_month}, {email_id}, {region} mean one config row serves every recipient with personalised data — no duplicate rows.",
    "Every run is fully audited: charts_injected, status, and error messages written to email_output BigQuery table.",
    "All 14 chart types (trend, comparison, part-to-whole, distribution, KPI, detail) are live and available to any report today.",
  ];

  takes.forEach((t,i)=>{
    const y=1.32+i*0.62;
    s.addShape(pres.shapes.OVAL,{x:0.3,y:y+0.12,w:0.27,h:0.27,fill:{color:C.cyan},line:{color:C.cyan}});
    s.addText("✓",{x:0.3,y:y+0.12,w:0.27,h:0.27,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(t,{x:0.68,y,w:5.28,h:0.58,fontFace:FONT,fontSize:10,color:C.text,valign:"middle",margin:0});
  });

  s.addText("Recommended Next Steps", {
    x:6.25,y:0.92,w:3.55,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0
  });

  const nexts = [
    { n:1, color:C.blue,  text:"Approve GCP service account + BigQuery dataset access" },
    { n:2, color:C.teal,  text:"Run BQ schema SQL → create email_list, chart_config_view, email_output" },
    { n:3, color:C.green, text:"Onboard one existing HTML report — replace one table with a line chart" },
    { n:4, color:C.amber, text:"Validate output — review generated HTML for all recipients" },
    { n:5, color:C.navy,  text:"Schedule via Cloud Scheduler — fully automated from here" },
  ];

  nexts.forEach((item,i)=>{
    const y=1.32+i*0.8;
    card(s, 6.2, y, 3.55, 0.7);
    s.addShape(pres.shapes.OVAL,{x:6.3,y:y+0.14,w:0.38,h:0.38,fill:{color:item.color},line:{color:item.color}});
    s.addText(String(item.n),{x:6.3,y:y+0.14,w:0.38,h:0.38,fontFace:FONT,fontSize:13,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(item.text,{x:6.78,y:y+0.08,w:2.85,h:0.56,fontFace:FONT,fontSize:9.5,color:C.text,valign:"middle",margin:0});
  });
}

// ── Write ──────────────────────────────────────────────────────────────
const out = "PyViz_Management_Presentation.pptx";
pres.writeFile({ fileName: out })
  .then(() => console.log("✓ Saved: " + out))
  .catch(err => { console.error("ERROR:", err); process.exit(1); });
