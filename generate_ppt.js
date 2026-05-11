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
  muted: "64748B", warn:  "9A3412", code:  "0F2340",
  soft:  "EFF6FF",
};
const FONT  = "Calibri";
const CODEF = "Courier New";

const mkShadow = () => ({ type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.11 });

function hdr(s, title, sub) {
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:10,h:0.55, fill:{color:C.navy}, line:{color:C.navy} });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:0.2,h:0.55, fill:{color:C.cyan}, line:{color:C.cyan} });
  s.addText(title, { x:0.35,y:0,w:9.3,h:0.55, fontFace:FONT, fontSize:17, bold:true, color:C.white, valign:"middle", margin:0 });
  if (sub) s.addText(sub, { x:0.35,y:0.55,w:9.3,h:0.3, fontFace:FONT, fontSize:10, color:C.muted, valign:"middle", margin:0 });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:5.35,w:10,h:0.28, fill:{color:C.light}, line:{color:C.light} });
  s.addText("PyViz  ·  Chart Email Engine  ·  Confidential", { x:0,y:5.35,w:10,h:0.28, fontFace:FONT, fontSize:8, color:C.gray, align:"center", valign:"middle", margin:0 });
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

// Compact dark code block — label + monospace text
function codeBlock(s, label, lines, x, y, w, h) {
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h, fill:{color:C.code}, line:{color:"0A1A2E"}, shadow:mkShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x,y,w,h:0.24, fill:{color:"0A1A2E"}, line:{color:"0A1A2E"} });
  s.addText(label, { x:x+0.1,y,w:w-0.2,h:0.24, fontFace:FONT, fontSize:8, bold:true, color:"64B5F6", valign:"middle", margin:0 });
  s.addText(lines, { x:x+0.12,y:y+0.27,w:w-0.22,h:h-0.32, fontFace:CODEF, fontSize:8.5, color:"7DD3FC", valign:"top", margin:0 });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:10,h:5.625, fill:{color:C.navy}, line:{color:C.navy} });
  s.addShape(pres.shapes.RECTANGLE, { x:0,y:0,w:0.2,h:5.625, fill:{color:C.cyan}, line:{color:C.cyan} });
  s.addShape(pres.shapes.RECTANGLE, { x:6.8,y:0,w:3.2,h:5.625, fill:{color:"0D1F3C"}, line:{color:"0D1F3C"} });
  for (let r=0;r<4;r++) for(let c=0;c<3;c++) {
    s.addShape(pres.shapes.OVAL, { x:7.2+c*0.55,y:0.8+r*0.55,w:0.09,h:0.09, fill:{color:C.cyan,transparency:55}, line:{color:C.cyan,transparency:55} });
  }
  s.addText("PyViz", { x:0.5,y:0.75,w:7,h:0.9, fontFace:FONT, fontSize:56, bold:true, color:C.cyan, margin:0 });
  s.addText("Why Outlook HTML Reports Need This", { x:0.5,y:1.6,w:7.5,h:0.55, fontFace:FONT, fontSize:22, color:C.white, margin:0 });
  s.addShape(pres.shapes.LINE, { x:0.5,y:2.22,w:5.8,h:0, line:{color:C.cyan,width:1.8} });
  s.addText([
    { text:"Pie charts. Line charts. Heatmaps. Funnels.", options:{bold:true, color:C.cyan, breakLine:true}},
    { text:"None of them work in Outlook HTML email — until now.", options:{color:C.white}},
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

  s.addText("What Outlook Strips or Ignores", { x:0.3,y:0.92,w:4.6,h:0.35, fontFace:FONT, fontSize:12, bold:true, color:C.warn, margin:0 });
  const blocked = [
    { tech:"<canvas> tag",          reason:"Outlook renders in Word engine — no canvas support" },
    { tech:"SVG inline",            reason:"Most Outlook versions strip <svg> completely" },
    { tech:"JavaScript",            reason:"All JS blocked — Chart.js, D3.js, Highcharts all dead" },
    { tech:"CSS animations",        reason:"Stripped — no animated charts or transitions" },
    { tech:"@font-face / web fonts",reason:"Substituted — chart text looks broken" },
    { tech:"Flexbox / Grid CSS",    reason:"Ignored — layouts collapse or misalign" },
  ];
  blocked.forEach((b,i) => {
    const y = 1.35+i*0.62;
    s.addShape(pres.shapes.RECTANGLE, { x:0.3,y,w:4.55,h:0.55, fill:{color:C.white}, line:{color:"FCA5A5",width:0.75}, shadow:mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x:0.3,y,w:0.07,h:0.55, fill:{color:C.red}, line:{color:C.red} });
    s.addText("✗  "+b.tech, { x:0.5,y:y+0.04,w:4.2,h:0.24, fontFace:CODEF, fontSize:10, bold:true, color:C.red, margin:0 });
    s.addText(b.reason, { x:0.5,y:y+0.28,w:4.2,h:0.22, fontFace:FONT, fontSize:9, color:C.muted, margin:0 });
  });

  s.addText("Your Current HTML Email = Tables Only", { x:5.1,y:0.92,w:4.6,h:0.35, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  card(s, 5.05,1.35,4.65,3.75, { bg:"FFF7ED", border:"FCD34D" });
  s.addText("Without PyViz, your HTML email reports are limited to:", { x:5.2,y:1.45,w:4.35,h:0.3, fontFace:FONT, fontSize:10, bold:true, color:C.warn, margin:0 });
  bullets(s, [
    "HTML tables with raw numbers",
    "Bold / colour-coded cells at best",
    "Static text summaries",
    "Manually pasted screenshot images (stale)",
    "No trendlines, no proportions, no distributions",
    "Reader must interpret numbers — no visual story",
    "Zero personalisation per recipient",
  ], 5.2,1.82,4.4,3.1, { sz:10.5, clr:C.text });
  s.addText("Result: Reports are data dumps, not insights.", { x:5.1,y:4.95,w:4.65,h:0.28, fontFace:FONT, fontSize:10, bold:true, color:C.red, align:"center", margin:0 });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 3 — How PyViz Solves It (SIMPLIFIED — no schema detail)
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "How PyViz Solves It", "PyViz renders charts server-side and replaces a template variable with a plain image tag");

  // ── 3-step flow boxes ──────────────────────────────────────────────
  const flow = [
    { icon:"📊", title:"Your Data",    body:"Any BigQuery table or view.\nNo changes needed.", color:C.navy },
    { icon:"⚙️", title:"PyViz Engine", body:"Python reads data.\nRenders chart as PNG.", color:C.teal },
    { icon:"📧", title:"HTML Email",   body:"Chart appears as image.\nWorks in every email client.", color:C.green },
  ];

  const FBX = 0.5, FBW = 2.7, FBY = 0.88, FBH = 1.55;
  flow.forEach((f,i) => {
    const x = FBX + i*(FBW+0.45);
    card(s, x, FBY, FBW, FBH);
    s.addShape(pres.shapes.RECTANGLE, { x,y:FBY,w:FBW,h:0.45, fill:{color:f.color}, line:{color:f.color} });
    s.addText(f.title, { x:x+0.1,y:FBY,w:FBW-0.2,h:0.45, fontFace:FONT, fontSize:12, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });
    s.addText(f.body,  { x:x+0.12,y:FBY+0.52,w:FBW-0.24,h:0.96, fontFace:FONT, fontSize:12, color:C.text, valign:"middle", align:"center", margin:0 });
    if (i < 2) {
      s.addText("→", { x:x+FBW+0.05,y:FBY+0.55,w:0.4,h:0.45, fontFace:FONT, fontSize:22, bold:true, color:C.cyan, align:"center", valign:"middle", margin:0 });
    }
  });

  // ── Key mechanism visual ───────────────────────────────────────────
  s.addText("The Mechanism", { x:0.5,y:2.62,w:9,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });

  // Step A — html_template has a variable
  card(s, 0.5, 3.0, 4.1, 1.78, { bg:C.soft, border:"93C5FD" });
  s.addShape(pres.shapes.RECTANGLE, { x:0.5,y:3.0,w:4.1,h:0.3, fill:{color:C.blue}, line:{color:C.blue} });
  s.addText("html_template in email_list", { x:0.6,y:3.0,w:3.9,h:0.3, fontFace:FONT, fontSize:9, bold:true, color:C.white, valign:"middle", margin:0 });
  s.addText(
    "<h2>Monthly Sales Report</h2>\n<p>Summary text here...</p>\n\n{{SALES_CHART}}\n\n<p>More content...</p>",
    { x:0.62,y:3.34,w:3.85,h:1.38, fontFace:CODEF, fontSize:9.5, color:C.navy, valign:"top", margin:0 }
  );
  s.addShape(pres.shapes.RECTANGLE, { x:0.62,y:3.72,w:1.58,h:0.22, fill:{color:C.amber,transparency:20}, line:{color:C.amber} });
  s.addText("{{SALES_CHART}}", { x:0.63,y:3.72,w:1.56,h:0.22, fontFace:CODEF, fontSize:9, bold:true, color:C.amber, valign:"middle", margin:0 });

  // Arrow between boxes
  s.addText("→", { x:4.7,y:3.7,w:0.6,h:0.4, fontFace:FONT, fontSize:26, bold:true, color:C.teal, align:"center", valign:"middle", margin:0 });
  s.addText("Engine\nruns", { x:4.65,y:4.1,w:0.7,h:0.45, fontFace:FONT, fontSize:8, color:C.muted, align:"center", margin:0 });

  // Step B — variable replaced with img tag
  card(s, 5.4, 3.0, 4.3, 1.78, { bg:"F0FDF4", border:"86EFAC" });
  s.addShape(pres.shapes.RECTANGLE, { x:5.4,y:3.0,w:4.3,h:0.3, fill:{color:C.green}, line:{color:C.green} });
  s.addText("Final HTML sent to recipient", { x:5.5,y:3.0,w:4.1,h:0.3, fontFace:FONT, fontSize:9, bold:true, color:C.white, valign:"middle", margin:0 });
  s.addText(
    "<h2>Monthly Sales Report</h2>\n<p>Summary text here...</p>\n\n<img src=\"data:image/png;base64,\n  iVBORw0KGgoAAAANSUhEU...\"\n  width=\"600\" />\n\n<p>More content...</p>",
    { x:5.52,y:3.34,w:4.05,h:1.38, fontFace:CODEF, fontSize:8.5, color:"166534", valign:"top", margin:0 }
  );
  s.addShape(pres.shapes.RECTANGLE, { x:5.52,y:3.72,w:3.62,h:0.5, fill:{color:C.green,transparency:88}, line:{color:C.green} });
  s.addText("<img src=\"data:image/png;base64,...\">", { x:5.55,y:3.74,w:3.58,h:0.22, fontFace:CODEF, fontSize:8.5, bold:true, color:C.green, valign:"middle", margin:0 });
  s.addText("← chart rendered as inline image", { x:5.55,y:3.95,w:3.58,h:0.22, fontFace:FONT, fontSize:8, color:"166534", valign:"middle", margin:0 });

  // Footer callout
  s.addShape(pres.shapes.RECTANGLE, { x:0.5,y:4.88,w:9.2,h:0.35, fill:{color:C.navy}, line:{color:C.navy} });
  s.addText("Outlook cannot render canvas, SVG, or JavaScript — but it has always rendered <img> tags. PyViz exploits this.", {
    x:0.6,y:4.88,w:9.0,h:0.35, fontFace:FONT, fontSize:10.5, color:C.white, valign:"middle", margin:0
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 4 — Complete Workflow: email_list → email_output
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Complete Workflow — email_list to email_output", "Every step is driven by configuration — no code changes per report");

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

  steps.forEach((st,i) => {
    const y = 0.9+i*0.76;
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y,w:0.45,h:0.65, fill:{color:st.color}, line:{color:st.color} });
    s.addText(st.n, { x:0.25,y,w:0.45,h:0.65, fontFace:FONT, fontSize:10, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    if (i<steps.length-1) s.addShape(pres.shapes.LINE, { x:0.47,y:y+0.65,w:0,h:0.11, line:{color:st.color,width:1.5} });
    const bgColor = i===0?"EFF6FF": i===5?"ECFDF5": C.white;
    s.addShape(pres.shapes.RECTANGLE, { x:0.78,y,w:9.0,h:0.65, fill:{color:bgColor}, line:{color:"E2E8F0",width:0.5} });
    s.addShape(pres.shapes.RECTANGLE, { x:0.78,y,w:0.06,h:0.65, fill:{color:st.color}, line:{color:st.color} });
    s.addText(st.title, { x:0.96,y:y+0.04,w:3.0,h:0.28, fontFace:FONT, fontSize:10, bold:true, color:st.color, margin:0 });
    s.addText(st.detail, { x:0.96,y:y+0.3,w:8.7,h:0.32, fontFace:FONT, fontSize:9, color:C.muted, margin:0 });
  });

  s.addText("BigQuery is the only system touched — no files to manage, no manual steps.", {
    x:0.25,y:5.15,w:9.5,h:0.22, fontFace:FONT, fontSize:9, italic:true, color:C.muted, align:"center", margin:0
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 5 — Adding ONE Chart (CLEAR ALIGNMENT, NO OVERLAP)
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  hdr(s, "Adding One New Chart — 15 Minutes, SQL Only, Zero Python", "Analyst adds a chart by writing one SQL block and inserting one template variable");

  const steps = [
    {
      n:"1", color:C.blue, time:"5 min",
      title:"Append one UNION ALL block to chart_config_view",
      note:"Only SQL needed — in BigQuery console. No Python file to touch.",
      code:
`SELECT
  'Monthly_Sales_Report'  AS report_name,
  'REGION_PIE'            AS variable_name,   -- this becomes {{REGION_PIE}} in template
  'arc_altair'            AS chart_type,       -- pie / donut
  'your_dataset.sales'    AS bq_table,
  'month = {this_month}'  AS filters,          -- token auto-resolved per run
  'region'                AS x_column,
  'revenue'               AS y_columns,
  'Revenue by Region'     AS title,
  'vibrant'               AS color_theme`
    },
    {
      n:"2", color:C.teal, time:"2 min",
      title:"Add {{REGION_PIE}} placeholder into html_template",
      note:"One UPDATE in email_list. Engine detects token automatically.",
      code:
`UPDATE email_list
SET html_template = html_template
  || '<h3>Revenue Mix This Month</h3>
      {{REGION_PIE}}'
WHERE report_name = 'Monthly_Sales_Report';`
    },
    {
      n:"3", color:C.green, time:"30 sec",
      title:"Run the engine — chart appears in every recipient's email",
      note:"No Python edits. No deployments. Chart renders for all recipients.",
      code:
`python chart_email_engine_v15.py

  ✓  REGION_PIE  [arc_altair]  pos=3  (42,811 chars)
  ✓  Saved → output_emails/Monthly_Sales_Report__EMP001.html
  ✓  Status: SUCCESS  charts=3/3`
    },
  ];

  // Layout: each step = full-width card, stacked vertically
  const stepHeights = [1.58, 1.2, 1.2];
  const GAP = 0.06;
  let curY = 0.88;

  steps.forEach((st,i) => {
    const h    = stepHeights[i];
    const CARD_X = 0.25, CARD_W = 9.5;

    // Card background
    card(s, CARD_X, curY, CARD_W, h);
    // Left colour accent
    s.addShape(pres.shapes.RECTANGLE, { x:CARD_X,y:curY,w:0.07,h, fill:{color:st.color}, line:{color:st.color} });

    // Header row inside card
    const HDR_Y = curY + 0.1;
    // Step circle
    s.addShape(pres.shapes.OVAL, { x:0.42,y:HDR_Y,w:0.38,h:0.38, fill:{color:st.color}, line:{color:st.color} });
    s.addText(st.n, { x:0.42,y:HDR_Y,w:0.38,h:0.38, fontFace:FONT, fontSize:14, bold:true, color:C.white, align:"center", valign:"middle", margin:0 });
    // Time pill
    s.addShape(pres.shapes.RECTANGLE, { x:0.88,y:HDR_Y+0.06,w:0.72,h:0.24, fill:{color:st.color,transparency:82}, line:{color:st.color} });
    s.addText(st.time, { x:0.88,y:HDR_Y+0.06,w:0.72,h:0.24, fontFace:FONT, fontSize:8, bold:true, color:st.color, align:"center", valign:"middle", margin:0 });
    // Step title
    s.addText(st.title, { x:1.68,y:HDR_Y+0.04,w:7.96,h:0.32, fontFace:FONT, fontSize:11, bold:true, color:C.text, valign:"middle", margin:0 });

    // Code block — starts after header, full width minus margins
    const CODE_Y = curY + 0.55;
    const CODE_H = h - 0.62;
    const CODE_W = 6.9;
    codeBlock(s, "SQL / Command", st.code, 0.42, CODE_Y, CODE_W, CODE_H);

    // Note — right side, aligned to code block top
    s.addShape(pres.shapes.RECTANGLE, { x:7.4,y:CODE_Y,w:2.2,h:CODE_H, fill:{color:st.color,transparency:92}, line:{color:st.color,transparency:50} });
    s.addText("💡", { x:7.48,y:CODE_Y+0.08,w:0.3,h:0.3, fontFace:FONT, fontSize:13, valign:"middle", margin:0 });
    s.addText(st.note, { x:7.52,y:CODE_Y+0.1,w:2.0,h:CODE_H-0.15, fontFace:FONT, fontSize:9, color:C.muted, valign:"top", margin:0 });

    curY += h + GAP;
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 6 — Variable / Token System
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Dynamic Variables — One Chart Config, N Personalised Views", "Tokens in filters/titles auto-resolve per recipient — no duplicate config rows needed");

  s.addText("How Tokens Are Resolved", { x:0.3,y:0.9,w:4.5,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  const levels = [
    { rank:"Highest", label:"filter_params JSON", sub:"Per-recipient override in email_list.\nE.g. {\"email_id\":\"EMP-042\",\"region\":\"South\"}", color:C.blue },
    { rank:"Middle",  label:"TABLE_VARS (config.py)", sub:"Global constants — e.g. env=prod.\nApply to every email in this run.", color:C.teal },
    { rank:"Lowest",  label:"Built-in Runtime Tokens", sub:"{today}  {this_month}  {this_quarter_year}\n{last_quarter_year}  {this_year}", color:C.navy },
  ];
  levels.forEach((lv,i) => {
    const y=1.3+i*1.22, w=4.2-i*0.5, x=0.3+i*0.25;
    s.addShape(pres.shapes.RECTANGLE, { x,y,w,h:1.05, fill:{color:lv.color}, line:{color:lv.color}, shadow:mkShadow() });
    s.addText(lv.rank.toUpperCase(), { x:x+0.1,y:y+0.04,w:w-0.2,h:0.2, fontFace:FONT, fontSize:7.5, bold:true, color:"BAE6FD", margin:0 });
    s.addText(lv.label, { x:x+0.1,y:y+0.22,w:w-0.2,h:0.3, fontFace:FONT, fontSize:11, bold:true, color:C.white, margin:0 });
    s.addText(lv.sub, { x:x+0.1,y:y+0.5,w:w-0.2,h:0.5, fontFace:FONT, fontSize:9, color:"BAE6FD", margin:0 });
  });

  s.addText("Token Reference", { x:4.9,y:0.9,w:4.8,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  const tokens = [
    ["{today}",             "2026-05-07",   "SQL WHERE / titles"],
    ["{this_month}",        "2026-05",      "SQL filters, chart subtitle"],
    ["{this_year}",         "2026",         "SQL filters, titles"],
    ["{this_quarter_year}", "Q2-2026",      "Quarter reports"],
    ["{last_quarter_year}", "Q1-2026",      "QoQ comparison charts"],
    ["{email_id}",          "EMP-042",      "Per-recipient row filter"],
    ["Custom token",        "Any string",   "Via filter_params JSON"],
    ["{{CHART_VAR}}",       "→ <img> tag",  "html_template placeholder"],
  ];
  card(s,4.85,1.3,4.85,3.45,{bg:C.light});
  ["Token","Resolves to","Used in"].forEach((h,i)=>{
    const xo=[4.85,6.55,7.95],wo=[1.65,1.35,1.72];
    s.addShape(pres.shapes.RECTANGLE,{x:xo[i],y:1.3,w:wo[i],h:0.32,fill:{color:C.navy},line:{color:C.navy}});
    s.addText(h,{x:xo[i],y:1.3,w:wo[i],h:0.32,fontFace:FONT,fontSize:9,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  });
  tokens.forEach((row,i)=>{
    const y=1.65+i*0.38;
    s.addShape(pres.shapes.RECTANGLE,{x:4.85,y,w:4.85,h:0.37,fill:{color:i%2===0?C.white:C.light},line:{color:"E2E8F0",width:0.5}});
    s.addText(row[0],{x:4.9,y,w:1.58,h:0.37,fontFace:CODEF,fontSize:8.5,color:C.blue,valign:"middle",margin:0});
    s.addText(row[1],{x:6.55,y,w:1.32,h:0.37,fontFace:FONT,fontSize:9,color:C.green,bold:true,valign:"middle",align:"center",margin:0});
    s.addText(row[2],{x:7.9,y,w:1.75,h:0.37,fontFace:FONT,fontSize:8.5,color:C.muted,valign:"middle",margin:0});
  });
  s.addText("Example: filters = \"employee_id = '{email_id}' AND month = '{this_month}'\"  →  different SQL per recipient, same config row.", {
    x:0.3,y:5.1,w:9.4,h:0.25,fontFace:FONT,fontSize:9,italic:true,color:C.muted,align:"center",margin:0
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 7 — 14 Chart Types (BULLET LIST with usage scenarios)
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "14 Chart Types — All Config-Driven, Available Today", "Set chart_type in chart_config_view — no Python changes needed");

  const groups = [
    {
      cat:"TREND", color:C.blue,
      items:[
        { label:"Line Chart",  type:"line_altair",  use:"Revenue / volume over time. Shows direction, inflection points, seasonality." },
        { label:"Area Chart",  type:"area_altair",  use:"Running totals or cumulative metrics. Fill under the line adds visual weight." },
      ]
    },
    {
      cat:"COMPARE", color:C.navy,
      items:[
        { label:"Horizontal Bar", type:"bar_altair",          use:"Ranked comparison — top products, regions, agents sorted by value." },
        { label:"Grouped Bar",    type:"grouped_bar_altair",  use:"Side-by-side groups — this month vs last month by category." },
        { label:"Stacked Bar",    type:"stacked_bar_altair",  use:"Part-to-whole across periods — revenue split by product line." },
      ]
    },
    {
      cat:"PART-TO-WHOLE", color:C.cyan,
      items:[
        { label:"Arc / Pie / Donut", type:"arc_altair",    use:"Market share, revenue mix by region — proportion at a glance." },
        { label:"Funnel",            type:"funnel_altair", use:"Conversion pipeline — Lead → Opportunity → Closed. Drop-off visible instantly." },
      ]
    },
    {
      cat:"RELATION & DISTRIBUTION", color:C.teal,
      items:[
        { label:"Bubble Scatter", type:"scatter_altair", use:"Correlation with size encoding — cost vs revenue, sized by volume." },
        { label:"Heatmap",        type:"heatmap_altair", use:"2-D intensity grid — day × hour activity, product × month performance." },
        { label:"Strip Plot",     type:"strip_altair",   use:"Individual data points per group — spot outliers, see spread." },
        { label:"Box Plot",       type:"boxplot_altair", use:"Statistical spread — median, quartiles, outliers for NPS or SLA data." },
      ]
    },
    {
      cat:"KPI", color:C.amber,
      items:[
        { label:"Metric Card",  type:"metric_card",   use:"Single headline KPI — Total ARR, MoM % change, with trend indicator." },
        { label:"Bullet Chart", type:"bullet_altair", use:"Actual vs target vs tolerance band — sales attainment at a glance." },
      ]
    },
    {
      cat:"DETAIL", color:C.slate,
      items:[
        { label:"Data Table", type:"table_chart", use:"Formatted grid — Top 10 accounts, drill-down breakdowns, ranked lists." },
      ]
    },
  ];

  // Two columns
  const COL = [{ x:0.28, w:4.7 }, { x:5.12, w:4.7 }];
  const groupsLeft  = groups.slice(0,3);
  const groupsRight = groups.slice(3);

  function renderGroups(groupList, col) {
    let y = 0.88;
    groupList.forEach(g => {
      // Category pill header
      s.addShape(pres.shapes.RECTANGLE, { x:col.x, y, w:col.w, h:0.28, fill:{color:g.color}, line:{color:g.color} });
      s.addText(g.cat, { x:col.x+0.12,y,w:col.w-0.2,h:0.28, fontFace:FONT, fontSize:9, bold:true, color:C.white, valign:"middle", margin:0 });
      y += 0.3;

      g.items.forEach(item => {
        // Bullet row background (alternating)
        s.addShape(pres.shapes.RECTANGLE, { x:col.x,y,w:col.w,h:0.56, fill:{color:C.light}, line:{color:"E2E8F0",width:0.5} });
        s.addShape(pres.shapes.RECTANGLE, { x:col.x,y,w:0.05,h:0.56, fill:{color:g.color,transparency:30}, line:{color:g.color,transparency:30} });
        // Chart label + type badge
        s.addText(item.label, { x:col.x+0.14,y:y+0.04,w:2.0,h:0.24, fontFace:FONT, fontSize:10, bold:true, color:C.text, margin:0 });
        s.addShape(pres.shapes.RECTANGLE, { x:col.x+2.2,y:y+0.06,w:2.35,h:0.18, fill:{color:g.color,transparency:88}, line:{color:g.color,transparency:60} });
        s.addText(item.type, { x:col.x+2.22,y:y+0.06,w:2.33,h:0.18, fontFace:CODEF, fontSize:7.5, color:g.color, valign:"middle", margin:0 });
        // Use case
        s.addText(item.use, { x:col.x+0.14,y:y+0.28,w:col.w-0.2,h:0.24, fontFace:FONT, fontSize:9, color:C.muted, margin:0 });
        y += 0.58;
      });

      y += 0.08; // gap between groups
    });
  }

  renderGroups(groupsLeft,  COL[0]);
  renderGroups(groupsRight, COL[1]);

  // Divider
  s.addShape(pres.shapes.LINE, { x:5.05,y:0.88,w:0,h:4.4, line:{color:"E2E8F0",width:1} });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 8 — Storytelling: Before vs After (IMPROVED READABILITY)
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Improving Report Storytelling — Before vs After PyViz", "Same data source, completely different insight — charts answer questions tables cannot");

  // Column headers
  const HDR_Y = 0.88;
  s.addShape(pres.shapes.RECTANGLE, { x:0.25,y:HDR_Y,w:3.1,h:0.34, fill:{color:C.navy}, line:{color:C.navy} });
  s.addShape(pres.shapes.RECTANGLE, { x:3.42,y:HDR_Y,w:3.0,h:0.34, fill:{color:C.red},  line:{color:C.red} });
  s.addShape(pres.shapes.RECTANGLE, { x:6.5,y:HDR_Y,w:3.25,h:0.34, fill:{color:C.green}, line:{color:C.green} });
  s.addText("Question from Management",     { x:0.3,y:HDR_Y,w:3.0,h:0.34,  fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", margin:0 });
  s.addText("Before — HTML Table Only",     { x:3.47,y:HDR_Y,w:2.9,h:0.34, fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });
  s.addText("After — With PyViz Chart",     { x:6.55,y:HDR_Y,w:3.15,h:0.34,fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });

  const scenarios = [
    { color:C.blue,  q:"Is revenue growing or declining?",   before:"12 monthly numbers in a column. Reader must spot the trend manually.", after:"line_altair — trend line shows direction, inflection points and seasonality instantly." },
    { color:C.cyan,  q:"Which region contributes most?",     before:"% column with 8 rows. Reader must mentally compare proportions.", after:"arc_altair (donut) — each segment is sized by share. Winner is obvious." },
    { color:C.teal,  q:"Where does our pipeline drop off?",  before:"Four separate count cells. Drop-off is a calculation, not visible.", after:"funnel_altair — each stage narrows visually. Problem stage is unmissable." },
    { color:C.amber, q:"Are we hitting the sales target?",   before:"Two numbers side by side: actual and target. Delta is manual.", after:"bullet_altair — actual vs target vs tolerance band. Red/green at a glance." },
    { color:C.navy,  q:"Which product × month is weakest?",  before:"Pivot table — reader must scan every cell across the full grid.", after:"heatmap_altair — colour intensity highlights weak cells immediately." },
    { color:"6D28D9",q:"How does this month compare to last?",before:"Side-by-side numbers. Requires arithmetic to understand the delta.", after:"grouped_bar_altair — columns sit next to each other. Delta is visual." },
  ];

  const ROW_H = 0.67, ROW_GAP = 0.04, START_Y = 1.27;
  scenarios.forEach((sc,i) => {
    const y = START_Y + i*(ROW_H+ROW_GAP);
    const bg = i%2===0 ? C.white : C.light;

    // Row background
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y,w:9.5,h:ROW_H, fill:{color:bg}, line:{color:"E2E8F0",width:0.5} });

    // Left colour accent strip
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y,w:0.06,h:ROW_H, fill:{color:sc.color}, line:{color:sc.color} });

    // Question cell
    s.addText(sc.q, { x:0.38,y:y+0.05,w:2.97,h:ROW_H-0.1, fontFace:FONT, fontSize:10, bold:true, color:sc.color, valign:"middle", margin:0 });

    // Divider lines
    s.addShape(pres.shapes.LINE, { x:3.38,y,w:0,h:ROW_H, line:{color:"E2E8F0",width:0.75} });
    s.addShape(pres.shapes.LINE, { x:6.47,y,w:0,h:ROW_H, line:{color:"E2E8F0",width:0.75} });

    // Before cell
    s.addText("✗  "+sc.before, { x:3.45,y:y+0.06,w:2.92,h:ROW_H-0.1, fontFace:FONT, fontSize:9.5, color:C.red, valign:"middle", margin:0 });

    // After cell
    s.addText("✓  "+sc.after, { x:6.55,y:y+0.06,w:3.12,h:ROW_H-0.1, fontFace:FONT, fontSize:9.5, color:C.green, valign:"middle", margin:0 });
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 9 — Comparison: 4 rows with full detail
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "HTML + SQL Email vs PyViz — Key Differences", "Both use the same BigQuery data — PyViz adds what Outlook HTML simply cannot do");

  // Column headers
  const HDR_Y = 0.9;
  s.addShape(pres.shapes.RECTANGLE, { x:0.25,y:HDR_Y,w:2.5,h:0.38, fill:{color:C.navy}, line:{color:C.navy} });
  s.addShape(pres.shapes.RECTANGLE, { x:2.82,y:HDR_Y,w:3.4,h:0.38, fill:{color:C.red}, line:{color:C.red} });
  s.addShape(pres.shapes.RECTANGLE, { x:6.28,y:HDR_Y,w:3.47,h:0.38, fill:{color:C.green}, line:{color:C.green} });
  s.addText("Capability",                { x:0.3,y:HDR_Y,w:2.4,h:0.38,  fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });
  s.addText("Current HTML + SQL Email",  { x:2.87,y:HDR_Y,w:3.3,h:0.38, fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });
  s.addText("With PyViz",               { x:6.33,y:HDR_Y,w:3.37,h:0.38, fontFace:FONT, fontSize:10, bold:true, color:C.white, valign:"middle", align:"center", margin:0 });

  const rows = [
    {
      cap:"Data Source",
      capSub:"Where the numbers come from",
      capColor:C.blue,
      htmlLines:[
        "Analyst writes SQL queries manually per report.",
        "Each query hard-coded to a specific table.",
        "Changes to source table require updating HTML code.",
        "No shared config — each report is standalone.",
      ],
      pyvizLines:[
        "Same BigQuery tables — zero migration or changes needed.",
        "bq_table field in chart_config_view points to any table.",
        "Source table change = update one config field only.",
        "All reports share a single, unified config layer.",
      ],
      h:1.08
    },
    {
      cap:"Chart Rendering",
      capSub:"How visuals reach the reader",
      capColor:C.red,
      htmlLines:[
        "Canvas, SVG, and JavaScript — all stripped by Outlook.",
        "Chart.js, D3.js, Highcharts: silently fail in email.",
        "Only workaround: manually paste static screenshots.",
        "Screenshots go stale — data is frozen at paste time.",
      ],
      pyvizLines:[
        "Python renders chart server-side using Vega-Altair.",
        "Output is a PNG encoded as base64 inside an <img> tag.",
        "<img> tags are supported by every email client — always.",
        "Charts are freshly generated on every engine run.",
      ],
      h:1.08
    },
    {
      cap:"Dark Mode",
      capSub:"Visual theme per chart",
      capColor:C.slate,
      htmlLines:[
        "Not feasible — HTML email has no reliable dark-mode trigger.",
        "CSS media queries for dark mode ignored by Outlook.",
        "Would require maintaining two separate HTML templates.",
      ],
      pyvizLines:[
        "dark_mode flag per chart row in chart_config_view.",
        "One config field flips background, text, grid colours.",
        "Each chart in the same email can have its own theme.",
      ],
      h:0.96
    },
    {
      cap:"Audit & Error Tracking",
      capSub:"What happens when something fails",
      capColor:C.amber,
      htmlLines:[
        "No built-in error logging — failures are silent.",
        "Wrong chart goes unnoticed until reader complains.",
        "No record of which emails were sent or succeeded.",
        "Debugging requires manually re-running and inspecting.",
      ],
      pyvizLines:[
        "email_output BQ table written after every run.",
        "Fields: status (SUCCESS / WARN / FAILED), error_message.",
        "charts_injected vs total_charts ratio — partial failures visible.",
        "processed_at timestamp — full audit trail per recipient.",
      ],
      h:1.08
    },
  ];

  const ROW_GAP = 0.06;
  let curY = 1.35;

  rows.forEach((row,ri) => {
    const RH = row.h;
    const bg = ri%2===0 ? C.white : C.light;

    // Row background
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y:curY,w:9.5,h:RH, fill:{color:bg}, line:{color:"E2E8F0",width:0.5} });

    // Capability cell (left)
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y:curY,w:2.5,h:RH, fill:{color:row.capColor,transparency:90}, line:{color:row.capColor,transparency:60} });
    s.addShape(pres.shapes.RECTANGLE, { x:0.25,y:curY,w:0.07,h:RH, fill:{color:row.capColor}, line:{color:row.capColor} });
    s.addText(row.cap, { x:0.42,y:curY+0.08,w:2.22,h:0.32, fontFace:FONT, fontSize:11, bold:true, color:row.capColor, margin:0 });
    s.addText(row.capSub, { x:0.42,y:curY+0.38,w:2.22,h:RH-0.44, fontFace:FONT, fontSize:8.5, color:C.muted, valign:"top", margin:0 });

    // Dividers
    s.addShape(pres.shapes.LINE, { x:2.78,y:curY,w:0,h:RH, line:{color:"E2E8F0",width:0.75} });
    s.addShape(pres.shapes.LINE, { x:6.25,y:curY,w:0,h:RH, line:{color:"E2E8F0",width:0.75} });

    // Before bullets
    s.addText(
      row.htmlLines.map((t,i)=>({ text:"✗  "+t, options:{ bullet:false, breakLine:i<row.htmlLines.length-1, fontSize:9, color:C.red }})),
      { x:2.88,y:curY+0.1,w:3.28,h:RH-0.15, fontFace:FONT, valign:"top" }
    );

    // After bullets
    s.addText(
      row.pyvizLines.map((t,i)=>({ text:"✓  "+t, options:{ bullet:false, breakLine:i<row.pyvizLines.length-1, fontSize:9, color:C.green }})),
      { x:6.34,y:curY+0.1,w:3.35,h:RH-0.15, fontFace:FONT, valign:"top" }
    );

    curY += RH + ROW_GAP;
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 10 — Effort Summary
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  hdr(s, "Effort Summary — Setup Once, Extend Forever Without Python", "One-time investment unlocks permanent self-serve chart capability for analysts");

  s.addText("One-Time Setup (~4 days total)", { x:0.3,y:0.9,w:4.55,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  const setup = [
    ["Deploy engine + BQ schema",    "1 day",   "Python Dev + DBA"],
    ["HTML email template",          "0.5 day", "Analyst"],
    ["Initial chart_config_view",    "0.5 day", "Analyst"],
    ["GCP service account + IAM",    "0.5 day", "GCP Admin"],
    ["Scheduling (Cloud Scheduler)", "0.5 day", "DevOps"],
    ["First live report validation", "1 day",   "Analyst + Dev"],
  ];
  const xo=[0.3,2.78,3.75], wo=[2.42,0.9,1.12];
  ["Task","Effort","Owner"].forEach((h,i)=>{
    s.addShape(pres.shapes.RECTANGLE,{x:xo[i],y:1.28,w:wo[i],h:0.3,fill:{color:C.navy},line:{color:C.navy}});
    s.addText(h,{x:xo[i],y:1.28,w:wo[i],h:0.3,fontFace:FONT,fontSize:9,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  });
  setup.forEach((r,i)=>{
    const y=1.6+i*0.37;
    s.addShape(pres.shapes.RECTANGLE,{x:0.3,y,w:4.62,h:0.36,fill:{color:i%2===0?C.white:C.light},line:{color:"E2E8F0",width:0.5}});
    s.addText(r[0],{x:0.35,y,w:2.36,h:0.36,fontFace:FONT,fontSize:9,color:C.text,valign:"middle",margin:0});
    s.addText(r[1],{x:2.78,y,w:0.86,h:0.36,fontFace:FONT,fontSize:9,color:C.blue,bold:true,align:"center",valign:"middle",margin:0});
    s.addText(r[2],{x:3.72,y,w:1.15,h:0.36,fontFace:FONT,fontSize:8.5,color:C.muted,valign:"middle",margin:0});
  });
  const totY=1.6+setup.length*0.37;
  s.addShape(pres.shapes.RECTANGLE,{x:0.3,y:totY,w:4.62,h:0.36,fill:{color:C.teal,transparency:82},line:{color:C.teal}});
  s.addText("Total",{x:0.35,y:totY,w:2.36,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.teal,valign:"middle",margin:0});
  s.addText("~4 days",{x:2.78,y:totY,w:0.86,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.teal,align:"center",valign:"middle",margin:0});

  s.addText("Ongoing — Analyst Self-Serve (No Dev Needed)", { x:5.1,y:0.9,w:4.6,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  const ongoing = [
    { task:"Add chart to existing report", effort:"~15 min", who:"Analyst (SQL only)", color:C.green },
    { task:"Add new report recipient",     effort:"~2 min",  who:"Analyst (INSERT row)", color:C.green },
    { task:"Change title / colour theme",  effort:"~2 min",  who:"Analyst (UPDATE row)", color:C.green },
    { task:"New report from scratch",      effort:"2–3 hrs", who:"Analyst + Dev", color:C.teal },
    { task:"Add entirely new chart type",  effort:"~0.5 day",who:"Python Dev (one-off)", color:C.amber },
    { task:"Scheduled automated run",      effort:"0 min",   who:"Fully automated", color:C.blue },
  ];
  ongoing.forEach((item,i)=>{
    const y=1.28+i*0.68;
    accentCard(s,5.05,y,4.65,0.6,item.color);
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
  s.addText("Impact at a Glance",{x:0.35,y:0,w:9.3,h:0.65,fontFace:FONT,fontSize:20,bold:true,color:C.white,valign:"middle",margin:0});
  const stats=[
    {v:"0",       u:"Code changes",      s:"to add a new chart",            color:C.cyan},
    {v:"~15 min", u:"Analyst effort",    s:"per new chart (SQL only)",      color:C.teal},
    {v:"14",      u:"Chart types",       s:"all available today",           color:"38BDF8"},
    {v:"~4 days", u:"Total setup",       s:"production ready end-to-end",   color:C.green},
    {v:"1 run",   u:"Generates N emails",s:"personalised per recipient",    color:C.amber},
    {v:"∞",       u:"Outlook compatible",s:"base64 PNG — every email client",color:"A78BFA"},
  ];
  stats.forEach((st,i)=>{
    const col=i%3, row=Math.floor(i/3);
    const x=0.4+col*3.2, y=0.82+row*2.35;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:2.9,h:2.1,fill:{color:"ffffff",transparency:92},line:{color:st.color,width:1.5},shadow:mkShadow()});
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:2.9,h:0.14,fill:{color:st.color},line:{color:st.color}});
    s.addText(st.v,{x:x+0.1,y:y+0.2,w:2.7,h:0.88,fontFace:FONT,fontSize:36,bold:true,color:st.color,align:"center",valign:"middle",margin:0});
    s.addText(st.u,{x:x+0.1,y:y+1.1,w:2.7,h:0.42,fontFace:FONT,fontSize:11,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(st.s,{x:x+0.1,y:y+1.55,w:2.7,h:0.4,fontFace:FONT,fontSize:9,color:C.gray,align:"center",valign:"middle",margin:0});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:5.35,w:10,h:0.28,fill:{color:"0D1F3C"},line:{color:"0D1F3C"}});
  s.addText("PyViz  ·  Automated Chart Email Engine  ·  Confidential",{x:0,y:5.35,w:10,h:0.28,fontFace:FONT,fontSize:8,color:C.gray,align:"center",valign:"middle",margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 12 — Summary & Next Steps
// ══════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  hdr(s, "Summary & Recommended Next Steps", "");

  s.addText("What PyViz Gives You Over HTML + SQL Email", { x:0.3,y:0.92,w:5.8,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  const takes = [
    "Outlook strips canvas, SVG and JS — pie charts, line charts, heatmaps are impossible in native HTML email.",
    "PyViz renders charts server-side and injects base64 PNG <img> tags — the one format Outlook always supports.",
    "Adding a chart takes 15 minutes of SQL — one UNION ALL block plus one {{TOKEN}} in the HTML template.",
    "Tokens like {this_month} and {email_id} mean one config row serves every recipient with personalised data.",
    "Every run is fully audited: charts_injected, status, and error messages written to email_output table.",
    "All 14 chart types are live today — trend, comparison, part-to-whole, distribution, KPI, and detail.",
  ];
  takes.forEach((t,i)=>{
    const y=1.32+i*0.62;
    s.addShape(pres.shapes.OVAL,{x:0.3,y:y+0.12,w:0.27,h:0.27,fill:{color:C.cyan},line:{color:C.cyan}});
    s.addText("✓",{x:0.3,y:y+0.12,w:0.27,h:0.27,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(t,{x:0.68,y,w:5.28,h:0.58,fontFace:FONT,fontSize:10,color:C.text,valign:"middle",margin:0});
  });

  s.addText("Recommended Next Steps", { x:6.25,y:0.92,w:3.55,h:0.32, fontFace:FONT, fontSize:12, bold:true, color:C.navy, margin:0 });
  const nexts=[
    {n:1,color:C.blue,  text:"Approve GCP service account + BigQuery dataset access"},
    {n:2,color:C.teal,  text:"Run BQ schema SQL → create email_list, chart_config_view, email_output"},
    {n:3,color:C.green, text:"Onboard one existing HTML report — replace one table with a line chart"},
    {n:4,color:C.amber, text:"Validate output — review generated HTML for all recipients"},
    {n:5,color:C.navy,  text:"Schedule via Cloud Scheduler — fully automated from here"},
  ];
  nexts.forEach((item,i)=>{
    const y=1.32+i*0.8;
    card(s,6.2,y,3.55,0.7);
    s.addShape(pres.shapes.OVAL,{x:6.3,y:y+0.14,w:0.38,h:0.38,fill:{color:item.color},line:{color:item.color}});
    s.addText(String(item.n),{x:6.3,y:y+0.14,w:0.38,h:0.38,fontFace:FONT,fontSize:13,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(item.text,{x:6.78,y:y+0.08,w:2.85,h:0.56,fontFace:FONT,fontSize:9.5,color:C.text,valign:"middle",margin:0});
  });
}

// ── Write ──────────────────────────────────────────────────────────────
pres.writeFile({ fileName:"PyViz_Management_Presentation.pptx" })
  .then(()=> console.log("✓ Saved: PyViz_Management_Presentation.pptx"))
  .catch(err=>{ console.error("ERROR:", err); process.exit(1); });
