"use strict";
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title  = "PyViz — Intelligent Chart-Driven Reporting";
pres.author = "PyViz Team";

const C = {
  navy:"0F2D54", blue:"1565C0", cyan:"0891B2", teal:"0D9488",
  slate:"475569", light:"F1F5F9", white:"FFFFFF", gray:"94A3B8",
  green:"16A34A", amber:"D97706", red:"DC2626", text:"1E293B",
  muted:"64748B", code:"0B1F3A", purple:"6D28D9",
};
const FONT="Calibri", MONO="Courier New";
const mkSh = ()=>({ type:"outer",blur:7,offset:2,angle:135,color:"000000",opacity:0.10 });

// ── Helpers ──────────────────────────────────────────────────────────
function pageHdr(s, title, sub) {
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.52,fill:{color:C.navy},line:{color:C.navy}});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:0.18,h:0.52,fill:{color:C.cyan},line:{color:C.cyan}});
  s.addText(title,{x:0.3,y:0,w:9.4,h:0.52,fontFace:FONT,fontSize:16,bold:true,color:C.white,valign:"middle",margin:0});
  if(sub) s.addText(sub,{x:0.3,y:0.52,w:9.4,h:0.28,fontFace:FONT,fontSize:9.5,color:C.muted,valign:"middle",margin:0});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:5.35,w:10,h:0.28,fill:{color:C.light},line:{color:C.light}});
  s.addText("PyViz  ·  Intelligent Chart-Driven Reporting  ·  Confidential",{x:0,y:5.35,w:10,h:0.28,fontFace:FONT,fontSize:8,color:C.gray,align:"center",valign:"middle",margin:0});
}

function box(s,x,y,w,h,opts={}){
  s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,
    fill:{color:opts.bg||C.white},
    line:{color:opts.border||"E2E8F0",width:opts.lw||0.75},
    shadow:opts.shadow?mkSh():undefined});
}

function accentL(s,x,y,w,h,clr){
  box(s,x,y,w,h,{shadow:true});
  s.addShape(pres.shapes.RECTANGLE,{x,y,w:0.06,h,fill:{color:clr},line:{color:clr}});
}

function pill(s,label,x,y,w,h,bg,fg){
  s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:bg,transparency:80},line:{color:bg}});
  s.addText(label,{x,y,w,h,fontFace:FONT,fontSize:7.5,bold:true,color:bg,align:"center",valign:"middle",margin:0});
}

function cblock(s,lang,code,x,y,w,h){
  s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:C.code},line:{color:"08192E"},shadow:mkSh()});
  s.addShape(pres.shapes.RECTANGLE,{x,y,w,h:0.22,fill:{color:"08192E"},line:{color:"08192E"}});
  s.addText(lang,{x:x+0.1,y,w:1,h:0.22,fontFace:FONT,fontSize:7.5,bold:true,color:"64B5F6",valign:"middle",margin:0});
  s.addText(code,{x:x+0.1,y:y+0.25,w:w-0.18,h:h-0.3,fontFace:MONO,fontSize:8.5,color:"7DD3FC",valign:"top",margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:5.625,fill:{color:C.navy},line:{color:C.navy}});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:0.2,h:5.625,fill:{color:C.cyan},line:{color:C.cyan}});
  s.addShape(pres.shapes.RECTANGLE,{x:6.6,y:0,w:3.4,h:5.625,fill:{color:"0C1E3A"},line:{color:"0C1E3A"}});
  for(let r=0;r<5;r++) for(let c=0;c<3;c++)
    s.addShape(pres.shapes.OVAL,{x:7.0+c*0.6,y:0.6+r*0.9,w:0.1,h:0.1,fill:{color:C.cyan,transparency:60},line:{color:C.cyan,transparency:60}});
  s.addText("PyViz",{x:0.5,y:0.7,w:6.5,h:1.0,fontFace:FONT,fontSize:58,bold:true,color:C.cyan,margin:0});
  s.addText("Intelligent Chart-Driven Reporting",{x:0.5,y:1.65,w:7,h:0.55,fontFace:FONT,fontSize:21,color:C.white,margin:0});
  s.addShape(pres.shapes.LINE,{x:0.5,y:2.28,w:5.8,h:0,line:{color:C.cyan,width:1.8}});
  s.addText("Transforming Risk, Compliance and Data Governance\nReporting for Senior Management",{x:0.5,y:2.38,w:7,h:0.7,fontFace:FONT,fontSize:13,color:C.gray,margin:0});
  s.addShape(pres.shapes.LINE,{x:0.5,y:3.22,w:2.5,h:0,line:{color:C.teal,width:1}});
  s.addText("May 2026  ·  Internal — Confidential",{x:0.5,y:3.32,w:5,h:0.3,fontFace:FONT,fontSize:10,color:C.gray,margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Challenge
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.light};
  pageHdr(s,"The Reporting Challenge","Banking teams produce data-rich reports — but the format limits their impact");

  // Left: Pain points
  s.addText("What Teams Produce Today",{x:0.3,y:0.88,w:4.6,h:0.32,fontFace:FONT,fontSize:12,bold:true,color:C.navy,margin:0});
  const pains=[
    {icon:"📋",title:"Raw Number Tables",body:"Daily risk, P&L and compliance reports delivered as HTML tables. Readers must interpret rows of figures with no visual context."},
    {icon:"📸",title:"Stale Screenshots",body:"Charts are manually captured from Excel or BI tools and pasted as images. By the time the email arrives, data is already outdated."},
    {icon:"⏱",title:"High Manual Effort",body:"Analysts spend hours each cycle formatting reports, copying data, and maintaining separate HTML templates per recipient."},
    {icon:"🔒",title:"No Personalisation",body:"Every recipient receives identical data. There is no mechanism to filter charts or metrics by entity, region or portfolio."},
  ];
  pains.forEach((p,i)=>{
    const y=1.26+i*0.98;
    accentL(s,0.3,y,4.55,0.88,C.navy);
    s.addText(p.icon+" "+p.title,{x:0.48,y:y+0.06,w:4.2,h:0.3,fontFace:FONT,fontSize:10.5,bold:true,color:C.navy,margin:0});
    s.addText(p.body,{x:0.48,y:y+0.36,w:4.2,h:0.46,fontFace:FONT,fontSize:9.5,color:C.muted,margin:0});
  });

  // Right: Business need
  s.addText("What Management Needs",{x:5.15,y:0.88,w:4.55,h:0.32,fontFace:FONT,fontSize:12,bold:true,color:C.navy,margin:0});
  const needs=[
    {q:"Is our credit exposure within limits?",     color:C.red},
    {q:"Is capital adequacy trending upward?",       color:C.amber},
    {q:"Where is data quality failing this week?",  color:C.teal},
    {q:"How does this month compare to budget?",    color:C.blue},
    {q:"Which AML cases are breaching review SLA?", color:C.purple},
    {q:"Are settlement failures increasing?",        color:C.navy},
  ];
  needs.forEach((n,i)=>{
    const y=1.26+i*0.64;
    s.addShape(pres.shapes.RECTANGLE,{x:5.1,y,w:4.6,h:0.56,fill:{color:C.white},line:{color:"E2E8F0",width:0.6},shadow:mkSh()});
    s.addShape(pres.shapes.RECTANGLE,{x:5.1,y,w:0.06,h:0.56,fill:{color:n.color},line:{color:n.color}});
    s.addText(n.q,{x:5.26,y:y+0.05,w:4.3,h:0.46,fontFace:FONT,fontSize:10,color:C.text,valign:"middle",margin:0});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:5.1,y:5.12,w:4.6,h:0.18,fill:{color:C.navy},line:{color:C.navy}});
  s.addText("These questions demand charts. HTML tables cannot answer them visually.",{x:5.1,y:5.12,w:4.6,h:0.18,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 3 — Why Outlook Blocks Charts
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"Why Your HTML Email Cannot Display Charts","Outlook renders using its Word engine — not a browser. Most web technologies are stripped.");

  // Central explanation
  s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:0.88,w:9.5,h:0.38,fill:{color:C.navy},line:{color:C.navy}});
  s.addText("Technologies blocked by Outlook → Your charts never reach the reader",{x:0.35,y:0.88,w:9.3,h:0.38,fontFace:FONT,fontSize:10.5,bold:true,color:C.white,valign:"middle",margin:0});

  const blocks=[
    {tech:"<canvas>",      why:"Outlook's Word rendering engine has no canvas implementation.",          impact:"Chart.js, D3.js, ECharts — all silent failures"},
    {tech:"Inline SVG",    why:"Most Outlook versions strip <svg> tags before rendering.",               impact:"All vector graphics invisible to recipient"},
    {tech:"JavaScript",    why:"All script execution blocked. No exceptions.",                           impact:"Highcharts, Plotly, any JS chart library dead"},
    {tech:"CSS Animations",why:"Keyframes and transitions removed during email processing.",             impact:"No animated or interactive visual elements"},
    {tech:"Web Fonts",     why:"@font-face declarations ignored. Falls back to system font.",            impact:"Chart labels and legends rendered incorrectly"},
    {tech:"CSS Grid/Flex", why:"Advanced layout CSS ignored. Tables only.",                             impact:"Multi-column chart layouts collapse"},
  ];

  blocks.forEach((b,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=0.25+col*4.85, y=1.33+row*1.28;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:4.65,h:1.18,fill:{color:C.white},line:{color:"FCA5A5",width:0.6},shadow:mkSh()});
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:4.65,h:0.3,fill:{color:C.red,transparency:8},line:{color:C.red,transparency:8}});
    s.addText("✗  "+b.tech,{x:x+0.12,y,w:4.4,h:0.3,fontFace:MONO,fontSize:10.5,bold:true,color:C.white,valign:"middle",margin:0});
    s.addText(b.why,{x:x+0.12,y:y+0.33,w:4.4,h:0.4,fontFace:FONT,fontSize:9.5,color:C.text,margin:0});
    s.addShape(pres.shapes.RECTANGLE,{x:x+0.12,y:y+0.74,w:4.38,h:0.22,fill:{color:"FFF1F2"},line:{color:"FCA5A5",width:0.5}});
    s.addText("Impact: "+b.impact,{x:x+0.15,y:y+0.74,w:4.32,h:0.22,fontFace:FONT,fontSize:8.5,color:C.red,valign:"middle",margin:0});
  });

  s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:5.12,w:9.5,h:0.2,fill:{color:C.light},line:{color:"E2E8F0"}});
  s.addText("The only visual element Outlook has always supported: the <img> tag. PyViz exploits this.",{x:0.3,y:5.12,w:9.4,h:0.2,fontFace:FONT,fontSize:9,italic:true,color:C.muted,align:"center",valign:"middle",margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 4 — How PyViz Works (simple mechanism)
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"How PyViz Works — Server-Side Rendering to a Plain Image Tag","No canvas, no SVG, no JavaScript. PyViz converts charts to PNG and places them as <img> tags.");

  // 3-step flow
  const steps=[
    {n:"1",color:C.navy, title:"Data",   sub:"Your existing BigQuery table.\nNo changes to data or schema."},
    {n:"2",color:C.teal, title:"Render", sub:"PyViz reads data and renders\nthe chart to a PNG image."},
    {n:"3",color:C.green,title:"Email",  sub:"PNG embedded as <img> tag.\nWorks in every email client."},
  ];
  steps.forEach((st,i)=>{
    const x=0.4+i*3.22;
    box(s,x,0.88,2.9,1.6,{shadow:true});
    s.addShape(pres.shapes.RECTANGLE,{x,y:0.88,w:2.9,h:0.42,fill:{color:st.color},line:{color:st.color}});
    s.addShape(pres.shapes.OVAL,{x:x+0.1,y:0.62,w:0.52,h:0.52,fill:{color:st.color},line:{color:st.color}});
    s.addText(st.n,{x:x+0.1,y:0.62,w:0.52,h:0.52,fontFace:FONT,fontSize:18,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(st.title,{x:x+0.12,y:0.88,w:2.66,h:0.42,fontFace:FONT,fontSize:13,bold:true,color:C.white,valign:"middle",align:"center",margin:0});
    s.addText(st.sub,{x:x+0.12,y:1.34,w:2.66,h:1.08,fontFace:FONT,fontSize:11,color:C.text,valign:"middle",align:"center",margin:0});
    if(i<2) s.addText("→",{x:x+2.9,y:1.28,w:0.32,h:0.5,fontFace:FONT,fontSize:22,bold:true,color:C.cyan,align:"center",valign:"middle",margin:0});
  });

  // Key insight banner
  s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:2.62,w:9.5,h:0.48,fill:{color:C.navy},line:{color:C.navy}});
  s.addText([
    {text:"How it works: ",options:{bold:false,color:C.gray}},
    {text:'<img src="data:image/png;base64, iVBOR...">',options:{fontFace:MONO,bold:true,color:C.cyan}},
    {text:"  — a standard image tag. Outlook renders images. It always has.",options:{color:C.white}},
  ],{x:0.35,y:2.62,w:9.3,h:0.48,fontFace:FONT,fontSize:11,valign:"middle",margin:0});

  // Mechanism diagram
  s.addText("The Substitution Mechanism",{x:0.25,y:3.22,w:9.5,h:0.3,fontFace:FONT,fontSize:11,bold:true,color:C.navy,margin:0});

  // Left: before
  box(s,0.25,3.56,4.4,1.6,{bg:"EFF6FF",border:"93C5FD",shadow:true});
  s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:3.56,w:4.4,h:0.28,fill:{color:C.blue},line:{color:C.blue}});
  s.addText("html_template (stored in email_list)",{x:0.32,y:3.56,w:4.26,h:0.28,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,valign:"middle",margin:0});
  s.addText("<h2>Monthly Risk Report</h2>\n<p>Portfolio summary for {email_id}</p>\n\n{{EXPOSURE_HEATMAP}}\n\n{{VAR_TREND_CHART}}",{x:0.35,y:3.88,w:4.2,h:1.22,fontFace:MONO,fontSize:9,color:C.navy,valign:"top",margin:0});
  s.addShape(pres.shapes.RECTANGLE,{x:0.35,y:4.3,w:2.1,h:0.2,fill:{color:C.amber,transparency:15},line:{color:C.amber}});
  s.addText("{{EXPOSURE_HEATMAP}}",{x:0.36,y:4.3,w:2.08,h:0.2,fontFace:MONO,fontSize:8.5,bold:true,color:C.amber,valign:"middle",margin:0});

  // Arrow
  s.addText("→",{x:4.7,y:4.48,w:0.5,h:0.42,fontFace:FONT,fontSize:24,bold:true,color:C.teal,align:"center",valign:"middle",margin:0});
  s.addText("Engine\nRuns",{x:4.68,y:4.9,w:0.54,h:0.28,fontFace:FONT,fontSize:7.5,color:C.muted,align:"center",margin:0});

  // Right: after
  box(s,5.28,3.56,4.47,1.6,{bg:"F0FDF4",border:"86EFAC",shadow:true});
  s.addShape(pres.shapes.RECTANGLE,{x:5.28,y:3.56,w:4.47,h:0.28,fill:{color:C.green},line:{color:C.green}});
  s.addText("Final HTML delivered to recipient",{x:5.35,y:3.56,w:4.33,h:0.28,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,valign:"middle",margin:0});
  s.addText("<h2>Monthly Risk Report</h2>\n<p>Portfolio summary for EMP-042</p>\n\n<img src=\"data:image/png;base64,iVBOR...\"\n  width=\"600\" />\n\n<img src=\"data:image/png;base64,iVBOR...\"",{x:5.35,y:3.88,w:4.32,h:1.22,fontFace:MONO,fontSize:9,color:"166534",valign:"top",margin:0});
  s.addShape(pres.shapes.RECTANGLE,{x:5.35,y:4.3,w:3.58,h:0.2,fill:{color:C.green,transparency:85},line:{color:C.green}});
  s.addText("← chart rendered inline as PNG image",{x:5.38,y:4.3,w:3.52,h:0.2,fontFace:FONT,fontSize:8.5,color:"166534",valign:"middle",margin:0});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 5 — Workflow Flowchart
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"End-to-End Workflow — email_list to email_output","Five stages, all configuration-driven — no code changes required per report or recipient");

  // ── 5-node horizontal flow ────────────────────────────────────────
  // Node: w=1.62, h=0.8. Arrow gap: w=0.24. Start x=0.35
  // Total: 5×1.62 + 4×0.24 = 8.1+0.96 = 9.06. End: 0.35+9.06=9.41 ✓
  const NW=1.62, NH=0.82, AW=0.24, NX0=0.35, NY=0.88;

  const nodes=[
    {label:"email_list",     sub:"Who receives\nwhat report",         color:C.navy},
    {label:"JOIN",           sub:"Match reports\nto chart config",     color:C.blue},
    {label:"Token Resolve",  sub:"Personalise\nper recipient",         color:C.cyan},
    {label:"Chart Render",   sub:"Query → PNG\n(4 parallel threads)",  color:C.teal},
    {label:"email_output",   sub:"Save HTML +\naudit to BigQuery",     color:C.green},
  ];

  nodes.forEach((n,i)=>{
    const x=NX0+i*(NW+AW);
    // Node box
    s.addShape(pres.shapes.RECTANGLE,{x,y:NY,w:NW,h:NH,fill:{color:n.color},line:{color:n.color},shadow:mkSh()});
    s.addText(n.label,{x:x+0.06,y:NY+0.04,w:NW-0.12,h:0.34,fontFace:FONT,fontSize:10,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(n.sub,{x:x+0.06,y:NY+0.4,w:NW-0.12,h:0.38,fontFace:FONT,fontSize:8.5,color:"D1FAE5",align:"center",margin:0});
    // Arrow between nodes
    if(i<4){
      const ax=x+NW;
      s.addText("→",{x:ax,y:NY,w:AW,h:NH,fontFace:FONT,fontSize:16,bold:true,color:C.slate,align:"center",valign:"middle",margin:0});
    }
  });

  // ── Detail cards below each node ─────────────────────────────────
  // Card: same x and w as node above. y=NY+NH+0.22=1.92. h=3.0. Bottom=4.92 ✓
  const CY=1.82, CH=3.22;

  const details=[
    {
      title:"email_list",
      color:C.navy,
      lines:[
        "One row per report × recipient",
        "Stores html_template with\n  {{CHART_VAR}} placeholders",
        "Holds recipient_email, subject",
        "filter_params JSON overrides\n  tokens per recipient",
        "report_name links to chart\n  configuration view",
      ]
    },
    {
      title:"JOIN Logic",
      color:C.blue,
      lines:[
        "Engine joins email_list with\n  chart_config_view",
        "Joined on: report_name",
        "Result: one row per\n  (recipient × chart)",
        "Brings chart_type, bq_table,\n  columns, filters, title",
        "sort_position controls order\n  within each email",
      ]
    },
    {
      title:"Token Resolution",
      color:C.cyan,
      lines:[
        "{today} → 2026-05-11",
        "{this_month} → 2026-05",
        "{this_quarter_year} → Q2-2026",
        "{email_id} → EMP-042",
        "Applied to: SQL WHERE clause,\n  chart title, email subject",
        "filter_params override built-ins",
      ]
    },
    {
      title:"Chart Rendering",
      color:C.teal,
      lines:[
        "Builds SELECT query per chart",
        "Fetches data from BigQuery",
        "Vega-Altair renders chart",
        "vl-convert exports to PNG",
        "PNG encoded as base64 string",
        "4 charts render in parallel",
      ]
    },
    {
      title:"Output & Audit",
      color:C.green,
      lines:[
        "{{VAR}} replaced with <img> tag",
        "One HTML file per recipient\n  written to output_emails/",
        "email_output table updated:",
        "  status: SUCCESS/WARN/FAILED",
        "  charts_injected / total",
        "  error_message + timestamp",
      ]
    },
  ];

  details.forEach((d,i)=>{
    const x=NX0+i*(NW+AW);
    // Connector line node→card
    s.addShape(pres.shapes.LINE,{x:x+NW/2,y:NY+NH,w:0,h:0.18,line:{color:d.color,width:1.2}});
    // Card
    box(s,x,CY,NW,CH,{shadow:true});
    s.addShape(pres.shapes.RECTANGLE,{x,y:CY,w:NW,h:0.28,fill:{color:d.color},line:{color:d.color}});
    s.addText(d.title,{x:x+0.06,y:CY,w:NW-0.1,h:0.28,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,valign:"middle",align:"center",margin:0});
    // Bullets
    s.addText(
      d.lines.map((ln,j)=>({text:ln,options:{bullet:true,breakLine:j<d.lines.length-1,fontSize:8.5,color:C.text}})),
      {x:x+0.1,y:CY+0.32,w:NW-0.16,h:CH-0.38,fontFace:FONT,valign:"top"}
    );
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 6 — Adding One Chart in 15 Minutes
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.light};
  pageHdr(s,"Adding One New Chart — 15 Minutes, SQL Only, Zero Python","An analyst adds a chart by writing one SQL block and placing one token in the HTML template");

  // 3 full-width stacked cards. No side-by-side columns. No overlap.
  const cards=[
    {
      n:"1", color:C.blue, time:"~5 min",
      title:"Add one UNION ALL block to chart_config_view (BigQuery SQL only)",
      note:"This is the only step that requires any code — plain SQL written directly in the BigQuery console.",
      lang:"SQL",
      code:`SELECT
  'Risk_Daily_Report'  AS report_name,
  'EXPOSURE_HEATMAP'   AS variable_name,  -- matches {{EXPOSURE_HEATMAP}} in template
  'heatmap_altair'     AS chart_type,
  'risk.counterparty'  AS bq_table,
  'date = {today}'     AS filters,        -- auto-resolved at run time
  'counterparty'       AS x_column,
  'exposure_usd'       AS y_columns,
  'Counterparty Exposure by Currency'  AS title,
  'teal'               AS color_theme,    620  AS width_px,  340  AS height_px`,
      h:1.72
    },
    {
      n:"2", color:C.teal, time:"~2 min",
      title:"Insert {{EXPOSURE_HEATMAP}} placeholder into html_template (one SQL UPDATE)",
      note:"The engine detects every {{TOKEN}} in the template automatically. No Python change needed.",
      lang:"SQL",
      code:`UPDATE email_list
SET html_template = html_template
  || '<h3>Counterparty Exposure — Today</h3>{{EXPOSURE_HEATMAP}}'
WHERE report_name = 'Risk_Daily_Report';`,
      h:1.14
    },
    {
      n:"3", color:C.green, time:"~30 sec",
      title:"Run the engine — the chart appears in every recipient's email automatically",
      note:"No Python files edited. No deployment. The engine picks up the new chart on the next run.",
      lang:"Output",
      code:`python chart_email_engine_v15.py
  ✓  EXPOSURE_HEATMAP  [heatmap_altair]  pos=2  (58,432 chars)
  ✓  Saved → output_emails/Risk_Daily_Report__EMP-042.html
  ✓  Status: SUCCESS   charts=2/2`,
      h:1.14
    },
  ];

  const GAP=0.05;
  let cy=0.85;

  cards.forEach(c=>{
    // Full-width card
    box(s,0.22,cy,9.56,c.h,{shadow:true});
    s.addShape(pres.shapes.RECTANGLE,{x:0.22,y:cy,w:0.06,h:c.h,fill:{color:c.color},line:{color:c.color}});

    // Header row (inside card, h=0.36)
    const HY=cy+0.08;
    // Circle badge
    s.addShape(pres.shapes.OVAL,{x:0.36,y:HY,w:0.38,h:0.38,fill:{color:c.color},line:{color:c.color}});
    s.addText(c.n,{x:0.36,y:HY,w:0.38,h:0.38,fontFace:FONT,fontSize:14,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    // Time pill
    pill(s,c.time,0.84,HY+0.06,0.72,0.24,c.color,c.color);
    // Title
    s.addText(c.title,{x:1.65,y:HY,w:7.95,h:0.38,fontFace:FONT,fontSize:10.5,bold:true,color:C.text,valign:"middle",margin:0});

    // Note line (italic, below header)
    const NY2=cy+0.5;
    s.addText("ⓘ  "+c.note,{x:1.65,y:NY2,w:7.95,h:0.2,fontFace:FONT,fontSize:8.5,italic:true,color:C.muted,margin:0});

    // Code block (fills remaining height)
    const CODE_Y=cy+0.72;
    const CODE_H=c.h-0.78;
    cblock(s,c.lang,c.code,1.65,CODE_Y,7.95,CODE_H);

    cy+=c.h+GAP;
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 7 — 14 Chart Types (bullet list, 2 columns)
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"14 Chart Types — All Available Today, All Config-Driven","Set chart_type in chart_config_view — no Python required to use any of these");

  const groups=[
    {cat:"TREND ANALYSIS",color:C.blue,col:0,items:[
      {label:"Line Chart",       type:"line_altair",        use:"Revenue, volume or rate trends over time. Shows direction and inflection points."},
      {label:"Area Chart",       type:"area_altair",        use:"Cumulative or stacked metrics over time. Visual weight reinforces magnitude."},
    ]},
    {cat:"COMPARISON",color:C.navy,col:0,items:[
      {label:"Horizontal Bar",   type:"bar_altair",         use:"Ranked comparisons — top counterparties, regions or products by value."},
      {label:"Grouped Bar",      type:"grouped_bar_altair", use:"Side-by-side groups — this period vs last period across categories."},
      {label:"Stacked Bar",      type:"stacked_bar_altair", use:"Composition over time — revenue by product line per month."},
    ]},
    {cat:"PART-TO-WHOLE",color:C.cyan,col:0,items:[
      {label:"Arc / Pie / Donut",type:"arc_altair",         use:"Portfolio share, revenue mix, exposure concentration by entity."},
      {label:"Funnel",           type:"funnel_altair",      use:"Conversion pipelines — AML review stages, deal progression, issue resolution."},
    ]},
    {cat:"RELATIONSHIPS & DISTRIBUTIONS",color:C.teal,col:1,items:[
      {label:"Bubble Scatter",   type:"scatter_altair",     use:"Correlations with size encoding — risk vs return, cost vs revenue."},
      {label:"Heatmap",          type:"heatmap_altair",     use:"Two-dimensional intensity — counterparty × currency, data domain × metric."},
      {label:"Strip Plot",       type:"strip_altair",       use:"Individual data points per category — spot outliers and distribution spread."},
      {label:"Box Plot",         type:"boxplot_altair",     use:"Statistical spread — median, quartiles, outliers for SLA or NPS data."},
    ]},
    {cat:"KPI & PERFORMANCE",color:C.amber,col:1,items:[
      {label:"Metric Card",      type:"metric_card",        use:"Single headline KPI — capital ratio, MoM change, breach count."},
      {label:"Bullet Chart",     type:"bullet_altair",      use:"Actual vs target vs tolerance band — limit utilisation, sales attainment."},
    ]},
    {cat:"DETAIL VIEW",color:C.slate,col:1,items:[
      {label:"Data Table",       type:"table_chart",        use:"Formatted ranked grid — top accounts, trade breaks, case backlog."},
    ]},
  ];

  const COL=[{x:0.25,w:4.72},{x:5.1,w:4.72}];
  const colY=[0,0];

  groups.forEach(g=>{
    const col=COL[g.col];
    let y=0.88+colY[g.col];
    // Category header
    s.addShape(pres.shapes.RECTANGLE,{x:col.x,y,w:col.w,h:0.26,fill:{color:g.color},line:{color:g.color}});
    s.addText(g.cat,{x:col.x+0.1,y,w:col.w-0.2,h:0.26,fontFace:FONT,fontSize:8.5,bold:true,color:C.white,valign:"middle",margin:0});
    y+=0.28;
    g.items.forEach((item,j)=>{
      const bg=j%2===0?C.light:C.white;
      s.addShape(pres.shapes.RECTANGLE,{x:col.x,y,w:col.w,h:0.58,fill:{color:bg},line:{color:"E2E8F0",width:0.5}});
      s.addShape(pres.shapes.RECTANGLE,{x:col.x,y,w:0.05,h:0.58,fill:{color:g.color,transparency:20},line:{color:g.color,transparency:20}});
      // Label + type
      s.addText(item.label,{x:col.x+0.14,y:y+0.04,w:1.95,h:0.24,fontFace:FONT,fontSize:10,bold:true,color:C.text,margin:0});
      s.addShape(pres.shapes.RECTANGLE,{x:col.x+2.15,y:y+0.06,w:2.42,h:0.18,fill:{color:g.color,transparency:88},line:{color:g.color,transparency:55}});
      s.addText(item.type,{x:col.x+2.17,y:y+0.06,w:2.4,h:0.18,fontFace:MONO,fontSize:7.5,color:g.color,valign:"middle",margin:0});
      // Use case
      s.addText(item.use,{x:col.x+0.14,y:y+0.3,w:col.w-0.2,h:0.24,fontFace:FONT,fontSize:8.5,color:C.muted,margin:0});
      y+=0.6;
    });
    y+=0.06; // group gap
    colY[g.col]=y-0.88;
  });

  // Divider
  s.addShape(pres.shapes.LINE,{x:4.99,y:0.88,w:0,h:4.4,line:{color:"E2E8F0",width:0.75}});
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 8 — Business Impact: Banking
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"Business Impact — Risk, Compliance and Data Governance","Chart-driven alerts and reports change how quickly decision-makers act on critical signals");

  const quads=[
    {
      title:"Risk Management",icon:"⚠",color:C.navy,x:0.25,y:0.88,
      points:[
        "VaR trend line charts show daily risk direction — readers no longer calculate movement from raw tables",
        "Limit utilisation bullet charts flag breaches against thresholds at a glance, triggering faster escalation",
        "Counterparty exposure heatmaps reveal concentration risk across currency × entity instantly",
        "Stress test scenario grouped bar charts compare multiple shock scenarios in one visual",
      ]
    },
    {
      title:"Compliance & Regulatory",icon:"⚖",color:C.teal,x:5.12,y:0.88,
      points:[
        "Capital adequacy ratio trend lines (Basel III/IV) show direction and proximity to regulatory minimum",
        "CCAR and DFAST scenario area charts make capital consumption visible across shock horizons",
        "AML transaction review funnel charts expose stage drop-offs, enabling SLA breach prevention",
        "Suspicious activity volume line charts with reference lines alert when volumes exceed control thresholds",
      ]
    },
    {
      title:"Data Governance",icon:"🗂",color:C.blue,x:0.25,y:3.15,
      points:[
        "Data quality score heatmaps (domain × dimension) make problem areas visible without scanning tables",
        "Pipeline SLA breach rate trend lines show whether data delivery is improving or deteriorating",
        "Issue aging grouped bar charts (open vs resolved) track governance backlog against clearance targets",
        "Completeness and accuracy KPI metric cards give data stewards a daily headline view of estate health",
      ]
    },
    {
      title:"Operational Reporting",icon:"📊",color:C.amber,x:5.12,y:3.15,
      points:[
        "Daily P&L stacked bar charts attribute performance across books — manual arithmetic eliminated",
        "Settlement failure rate line charts with target reference lines signal processing degradation early",
        "Reconciliation break count horizontal bar charts rank entities by break volume for prioritised action",
        "End-of-day processing metric cards give operations managers instant pass/fail status at cycle close",
      ]
    },
  ];

  quads.forEach(q=>{
    const QW=4.62, QH=2.12;
    box(s,q.x,q.y,QW,QH,{shadow:true});
    s.addShape(pres.shapes.RECTANGLE,{x:q.x,y:q.y,w:QW,h:0.36,fill:{color:q.color},line:{color:q.color}});
    s.addText(q.icon+"  "+q.title,{x:q.x+0.12,y:q.y,w:QW-0.2,h:0.36,fontFace:FONT,fontSize:11,bold:true,color:C.white,valign:"middle",margin:0});
    s.addText(
      q.points.map((p,i)=>({text:p,options:{bullet:true,breakLine:i<q.points.length-1,fontSize:9.5,color:C.text}})),
      {x:q.x+0.16,y:q.y+0.4,w:QW-0.26,h:QH-0.46,fontFace:FONT,valign:"top"}
    );
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 9 — Before vs After: Banking Scenarios
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"Before vs After — Reporting Scenarios in Banking","The same data, in two formats. One demands effort. The other delivers insight immediately.");

  // Column headers
  const HDY=0.88;
  s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:HDY,w:3.15,h:0.34,fill:{color:C.navy},line:{color:C.navy}});
  s.addShape(pres.shapes.RECTANGLE,{x:3.45,y:HDY,w:2.98,h:0.34,fill:{color:C.red},line:{color:C.red}});
  s.addShape(pres.shapes.RECTANGLE,{x:6.48,y:HDY,w:3.27,h:0.34,fill:{color:C.green},line:{color:C.green}});
  s.addText("Management Question",{x:0.3,y:HDY,w:3.05,h:0.34,fontFace:FONT,fontSize:9.5,bold:true,color:C.white,valign:"middle",margin:0});
  s.addText("Before — HTML Table",{x:3.5,y:HDY,w:2.88,h:0.34,fontFace:FONT,fontSize:9.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  s.addText("After — PyViz Chart",{x:6.53,y:HDY,w:3.17,h:0.34,fontFace:FONT,fontSize:9.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});

  const rows=[
    {color:C.navy,   q:"Is counterparty credit exposure within limits?",         before:"Exposure table — 20 rows of numbers. Limit column beside it. Reader calculates headroom row by row.", after:"heatmap_altair — colour intensity reveals breaches. Limit proximity visible across all counterparties at once."},
    {color:C.teal,   q:"Is our capital ratio trending toward the regulatory minimum?", before:"A single ratio figure for today. No context, no direction, no comparison to prior periods.", after:"line_altair with reference line — trend and proximity to Basel minimum visible in one chart."},
    {color:C.blue,   q:"Which data quality dimensions are failing this week?",    before:"Audit table: domain × dimension grid with pass/fail counts. Reader must scan entire matrix.", after:"heatmap_altair — red cells identify failing dimensions instantly across the full data estate."},
    {color:C.amber,  q:"Where is our AML review pipeline stalling?",             before:"Four count fields: referred, under review, escalated, closed. Drop-off requires arithmetic.", after:"funnel_altair — each stage narrows visually. The bottleneck stage is unmissable."},
    {color:C.purple, q:"How does this month's P&L compare to budget by book?",   before:"Two columns per book — actual and budget. Delta calculation done mentally by reader.", after:"grouped_bar_altair — actual sits beside budget per book. Variance is a visual gap, not arithmetic."},
    {color:C.red,    q:"Is the settlement failure rate rising or falling?",       before:"Daily failure count in a table. Reader must compare today to prior days to determine direction.", after:"line_altair with target reference line — trend direction and threshold breach visible immediately."},
  ];

  const RH=0.65, RGAP=0.04, SY=1.26;
  rows.forEach((r,i)=>{
    const y=SY+i*(RH+RGAP);
    const bg=i%2===0?C.white:C.light;
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y,w:9.5,h:RH,fill:{color:bg},line:{color:"E2E8F0",width:0.5}});
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y,w:0.06,h:RH,fill:{color:r.color},line:{color:r.color}});
    s.addText(r.q,{x:0.38,y:y+0.05,w:3.0,h:RH-0.1,fontFace:FONT,fontSize:9.5,bold:true,color:r.color,valign:"middle",margin:0});
    s.addShape(pres.shapes.LINE,{x:3.41,y,w:0,h:RH,line:{color:"E2E8F0",width:0.75}});
    s.addText("✗  "+r.before,{x:3.48,y:y+0.06,w:2.88,h:RH-0.1,fontFace:FONT,fontSize:9,color:C.red,valign:"middle",margin:0});
    s.addShape(pres.shapes.LINE,{x:6.42,y,w:0,h:RH,line:{color:"E2E8F0",width:0.75}});
    s.addText("✓  "+r.after,{x:6.5,y:y+0.06,w:3.22,h:RH-0.1,fontFace:FONT,fontSize:9,color:C.green,valign:"middle",margin:0});
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 10 — Today vs PyViz (4 detailed rows)
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"Current HTML Reporting vs PyViz — Key Differences","Both use the same BigQuery data source — PyViz adds the visual and automation layer");

  const HDY=0.88;
  const cols=[{x:0.25,w:2.45},{x:2.75,w:3.38},{x:6.18,w:3.57}];
  const hc=[C.navy,C.red,C.green];
  ["Capability","Current HTML + SQL Email","With PyViz"].forEach((h,i)=>{
    s.addShape(pres.shapes.RECTANGLE,{x:cols[i].x,y:HDY,w:cols[i].w,h:0.36,fill:{color:hc[i]},line:{color:hc[i]}});
    s.addText(h,{x:cols[i].x,y:HDY,w:cols[i].w,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  });

  const rows=[
    {
      cap:"Data Source",sub:"Where numbers originate",color:C.blue,h:1.08,
      before:["Analysts write SQL queries manually per report","Each query hard-coded to a specific table","Source changes require HTML template edits","No shared configuration across reports"],
      after:["Same BigQuery tables — zero migration needed","bq_table field in chart_config_view points to any table","Source change = update one field in config view","All reports share a single, unified configuration layer"],
    },
    {
      cap:"Chart Rendering",sub:"How visuals reach the reader",color:C.red,h:1.08,
      before:["Canvas, SVG and JavaScript blocked by Outlook","Chart.js, D3.js and Highcharts all fail silently","Screenshots pasted manually — data stale immediately","No mechanism for freshly-rendered charts at send time"],
      after:["Python renders charts server-side via Vega-Altair","Output is a base64 PNG inside a standard <img> tag","<img> tags render in every email client — no exceptions","Charts freshly generated on every scheduled engine run"],
    },
    {
      cap:"Dark Mode",sub:"Theming per chart",color:C.slate,h:0.88,
      before:["Not feasible — Outlook ignores CSS dark-mode queries","Maintaining two templates doubles maintenance effort"],
      after:["dark_mode flag per chart row in chart_config_view","One config field flips all colours, background, grid","Different charts in the same email may have different themes"],
    },
    {
      cap:"Audit & Error Tracking",sub:"Visibility when issues occur",color:C.amber,h:1.08,
      before:["No built-in logging — failures are silent","Wrong chart undetected until reader raises it","No record of which emails succeeded or failed","Debugging requires manual re-execution and inspection"],
      after:["email_output BigQuery table written after every run","status field: SUCCESS / WARN / FAILED per recipient","charts_injected vs total ratio reveals partial failures","Full timestamp audit trail — processed_at per recipient"],
    },
  ];

  let cy=1.3;
  rows.forEach(r=>{
    const RH=r.h, GAP=0.05;
    const bg=cy%2===0?C.white:C.light; // approx alternating
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:cy,w:9.5,h:RH,fill:{color:C.white},line:{color:"E2E8F0",width:0.5}});
    // Cap cell
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:cy,w:2.45,h:RH,fill:{color:r.color,transparency:91},line:{color:r.color,transparency:60}});
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:cy,w:0.06,h:RH,fill:{color:r.color},line:{color:r.color}});
    s.addText(r.cap,{x:0.38,y:cy+0.08,w:2.2,h:0.3,fontFace:FONT,fontSize:10.5,bold:true,color:r.color,margin:0});
    s.addText(r.sub,{x:0.38,y:cy+0.4,w:2.2,h:RH-0.46,fontFace:FONT,fontSize:8.5,color:C.muted,valign:"top",margin:0});
    // Dividers
    s.addShape(pres.shapes.LINE,{x:2.71,y:cy,w:0,h:RH,line:{color:"E2E8F0",width:0.75}});
    s.addShape(pres.shapes.LINE,{x:6.14,y:cy,w:0,h:RH,line:{color:"E2E8F0",width:0.75}});
    // Before bullets
    s.addText(r.before.map((t,i)=>({text:"✗  "+t,options:{bullet:false,breakLine:i<r.before.length-1,fontSize:9,color:C.red}})),
      {x:2.82,y:cy+0.1,w:3.24,h:RH-0.16,fontFace:FONT,valign:"top"});
    // After bullets
    s.addText(r.after.map((t,i)=>({text:"✓  "+t,options:{bullet:false,breakLine:i<r.after.length-1,fontSize:9,color:C.green}})),
      {x:6.25,y:cy+0.1,w:3.42,h:RH-0.16,fontFace:FONT,valign:"top"});
    cy+=RH+GAP;
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 11 — Effort Summary
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  s.background={color:C.white};
  pageHdr(s,"Effort Summary — Invest Once, Extend Forever","One-time setup unlocks permanent self-serve chart capability. Analysts add charts without developer involvement.");

  // Left: Setup table
  s.addText("One-Time Setup — Approximately 4 Working Days",{x:0.25,y:0.88,w:4.65,h:0.3,fontFace:FONT,fontSize:11,bold:true,color:C.navy,margin:0});
  const setup=[
    ["Deploy engine and BigQuery schema","1 day",  "Python Dev + DBA"],
    ["Design base HTML email template",  "0.5 day","Analyst"],
    ["Configure chart_config_view",      "0.5 day","Analyst"],
    ["GCP service account and IAM",      "0.5 day","GCP Admin"],
    ["Cloud Scheduler setup",            "0.5 day","DevOps"],
    ["First live report validation",     "1 day",  "Analyst + Dev"],
  ];
  const XO=[0.25,2.72,3.68], WO=[2.42,0.9,1.22];
  ["Task","Effort","Owner"].forEach((h,i)=>{
    s.addShape(pres.shapes.RECTANGLE,{x:XO[i],y:1.24,w:WO[i],h:0.3,fill:{color:C.navy},line:{color:C.navy}});
    s.addText(h,{x:XO[i],y:1.24,w:WO[i],h:0.3,fontFace:FONT,fontSize:9,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
  });
  setup.forEach((r,i)=>{
    const y=1.58+i*0.37;
    s.addShape(pres.shapes.RECTANGLE,{x:0.25,y,w:4.7,h:0.36,fill:{color:i%2===0?C.white:C.light},line:{color:"E2E8F0",width:0.5}});
    s.addText(r[0],{x:0.3,y,w:2.36,h:0.36,fontFace:FONT,fontSize:9,color:C.text,valign:"middle",margin:0});
    s.addText(r[1],{x:2.72,y,w:0.86,h:0.36,fontFace:FONT,fontSize:9,bold:true,color:C.blue,align:"center",valign:"middle",margin:0});
    s.addText(r[2],{x:3.66,y,w:1.25,h:0.36,fontFace:FONT,fontSize:8.5,color:C.muted,valign:"middle",margin:0});
  });
  const TY=1.58+setup.length*0.37;
  s.addShape(pres.shapes.RECTANGLE,{x:0.25,y:TY,w:4.7,h:0.36,fill:{color:C.teal,transparency:82},line:{color:C.teal}});
  s.addText("Total estimated effort",{x:0.3,y:TY,w:2.36,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.teal,valign:"middle",margin:0});
  s.addText("~4 days",{x:2.72,y:TY,w:0.86,h:0.36,fontFace:FONT,fontSize:9.5,bold:true,color:C.teal,align:"center",valign:"middle",margin:0});

  // Right: Ongoing
  s.addText("Ongoing Operations — Analyst Self-Serve",{x:5.15,y:0.88,w:4.6,h:0.3,fontFace:FONT,fontSize:11,bold:true,color:C.navy,margin:0});
  const ongoing=[
    {task:"Add a new chart to existing report",effort:"~15 min",color:C.green,detail:"Write one SQL UNION ALL block. No Python."},
    {task:"Add a new recipient",               effort:"~2 min", color:C.green,detail:"Insert one row in email_list table."},
    {task:"Update chart title or colour",      effort:"~2 min", color:C.green,detail:"UPDATE one field in chart_config_view."},
    {task:"Build an entirely new report",      effort:"2–3 hrs",color:C.teal, detail:"New html_template + chart config rows."},
    {task:"Add a new chart type (e.g. gauge)", effort:"~0.5 day",color:C.amber,detail:"Python renderer function — one-off effort."},
    {task:"Scheduled automated run",           effort:"0 min",  color:C.blue, detail:"Cloud Scheduler executes on cadence."},
  ];
  ongoing.forEach((item,i)=>{
    const y=1.24+i*0.68;
    box(s,5.1,y,4.65,0.62,{shadow:true});
    s.addShape(pres.shapes.RECTANGLE,{x:5.1,y,w:0.06,h:0.62,fill:{color:item.color},line:{color:item.color}});
    // Effort badge
    pill(s,item.effort,5.22,y+0.08,0.82,0.24,item.color,item.color);
    s.addText(item.task,{x:6.12,y:y+0.06,w:3.55,h:0.28,fontFace:FONT,fontSize:10,bold:true,color:C.text,margin:0});
    s.addText(item.detail,{x:6.12,y:y+0.34,w:3.55,h:0.22,fontFace:FONT,fontSize:8.5,color:C.muted,margin:0});
  });
}

// ══════════════════════════════════════════════════════════════════════
// SLIDE 12 — Impact & Next Steps (dark + light split)
// ══════════════════════════════════════════════════════════════════════
{
  const s=pres.addSlide();
  // Dark left half
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:5,h:5.625,fill:{color:C.navy},line:{color:C.navy}});
  s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:0.18,h:5.625,fill:{color:C.cyan},line:{color:C.cyan}});
  // Light right half
  s.addShape(pres.shapes.RECTANGLE,{x:5,y:0,w:5,h:5.625,fill:{color:C.light},line:{color:C.light}});

  // Left — Impact metrics
  s.addText("Impact at a Glance",{x:0.3,y:0.25,w:4.4,h:0.42,fontFace:FONT,fontSize:16,bold:true,color:C.white,valign:"middle",margin:0});
  const stats=[
    {v:"0",      u:"Python changes",  s:"to add any new chart",          color:C.cyan},
    {v:"15 min", u:"Analyst effort",  s:"per new chart — SQL only",       color:C.teal},
    {v:"14",     u:"Chart types",     s:"live and available today",       color:"38BDF8"},
    {v:"4 days", u:"Full setup",      s:"from zero to production",        color:C.green},
    {v:"1 run",  u:"N personalised",  s:"emails — one execution",         color:C.amber},
    {v:"100%",   u:"Outlook safe",    s:"base64 PNG in every client",     color:"A78BFA"},
  ];
  stats.forEach((st,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=0.25+col*2.3, y=0.82+row*1.5;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:2.1,h:1.35,fill:{color:"FFFFFF",transparency:93},line:{color:st.color,width:1.2}});
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:2.1,h:0.12,fill:{color:st.color},line:{color:st.color}});
    s.addText(st.v,{x,y:y+0.15,w:2.1,h:0.72,fontFace:FONT,fontSize:30,bold:true,color:st.color,align:"center",valign:"middle",margin:0});
    s.addText(st.u,{x,y:y+0.88,w:2.1,h:0.3,fontFace:FONT,fontSize:9.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(st.s,{x,y:y+1.15,w:2.1,h:0.2,fontFace:FONT,fontSize:8,color:C.gray,align:"center",margin:0});
  });

  // Right — Summary + Next steps
  s.addText("Key Takeaways",{x:5.2,y:0.25,w:4.55,h:0.38,fontFace:FONT,fontSize:14,bold:true,color:C.navy,valign:"middle",margin:0});
  const takes=[
    "Outlook blocks canvas, SVG and JavaScript — pie charts, trend lines and heatmaps are not possible in standard HTML email.",
    "PyViz renders charts server-side and injects base64 PNG <img> tags, which every email client supports.",
    "Adding a chart takes 15 minutes of SQL — one config row and one template token. No Python required.",
    "Tokens such as {this_month} and {email_id} personalise every chart for every recipient from a single config.",
  ];
  takes.forEach((t,i)=>{
    const y=0.72+i*0.72;
    s.addShape(pres.shapes.OVAL,{x:5.2,y:y+0.1,w:0.26,h:0.26,fill:{color:C.cyan},line:{color:C.cyan}});
    s.addText("✓",{x:5.2,y:y+0.1,w:0.26,h:0.26,fontFace:FONT,fontSize:8,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(t,{x:5.55,y,w:4.2,h:0.68,fontFace:FONT,fontSize:9.5,color:C.text,valign:"middle",margin:0});
  });

  s.addShape(pres.shapes.LINE,{x:5.2,y:3.66,w:4.55,h:0,line:{color:"E2E8F0",width:0.8}});
  s.addText("Recommended Next Steps",{x:5.2,y:3.72,w:4.55,h:0.3,fontFace:FONT,fontSize:12,bold:true,color:C.navy,margin:0});
  const steps=[
    {n:1,color:C.blue,  t:"Approve BigQuery dataset access and GCP service account"},
    {n:2,color:C.teal,  t:"Run schema SQL to create email_list, chart_config_view, email_output"},
    {n:3,color:C.green, t:"Pilot with one existing report — replace one HTML table with a chart"},
    {n:4,color:C.amber, t:"Review generated output, validate all recipients, sign off"},
    {n:5,color:C.navy,  t:"Schedule via Cloud Scheduler — fully automated from this point"},
  ];
  steps.forEach((st,i)=>{
    const y=4.08+i*0.24;
    s.addShape(pres.shapes.OVAL,{x:5.2,y,w:0.2,h:0.2,fill:{color:st.color},line:{color:st.color}});
    s.addText(String(st.n),{x:5.2,y,w:0.2,h:0.2,fontFace:FONT,fontSize:7.5,bold:true,color:C.white,align:"center",valign:"middle",margin:0});
    s.addText(st.t,{x:5.48,y,w:4.27,h:0.2,fontFace:FONT,fontSize:9,color:C.text,valign:"middle",margin:0});
  });

  s.addShape(pres.shapes.RECTANGLE,{x:0,y:5.35,w:10,h:0.28,fill:{color:"0A1A2E"},line:{color:"0A1A2E"}});
  s.addText("PyViz  ·  Intelligent Chart-Driven Reporting  ·  Confidential",{x:0,y:5.35,w:10,h:0.28,fontFace:FONT,fontSize:8,color:C.gray,align:"center",valign:"middle",margin:0});
}

// ── Write ─────────────────────────────────────────────────────────────
pres.writeFile({fileName:"PyViz_Management_Presentation.pptx"})
  .then(()=>console.log("✓ Saved: PyViz_Management_Presentation.pptx"))
  .catch(e=>{console.error("ERROR:",e);process.exit(1);});
