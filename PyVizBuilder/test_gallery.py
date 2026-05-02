import os

from .mock_data import _build_mock_cases
from .charts import render_chart


def run_visual_test(dark: bool = False, out_path: str = "chart_test_gallery.html") -> None:
    """
    Render all 8 Altair chart types with mock data and write a self-contained
    HTML gallery.  No BigQuery connection required.
    """
    cases    = _build_mock_cases(dark)
    bg_color = "#1A1F2B" if dark else "#F4F6FA"
    card_bg  = "#222838" if dark else "#FFFFFF"
    txt_col  = "#E8ECF4" if dark else "#1F2937"
    tag_bg   = "#2A3145" if dark else "#EEF2FF"
    tag_col  = "#A4D0F2" if dark else "#4338CA"
    border   = "#2E3650" if dark else "#E5E7EB"

    chart_cards = []
    ok = err = 0

    for i, (label, df, cfg) in enumerate(cases, 1):
        print(f"  [{i:2d}/14]  {label:<22s}", end=" ", flush=True)
        try:
            b64 = render_chart(df, cfg)
            if b64:
                card = f"""
        <div style="background:{card_bg};border-radius:12px;padding:20px 24px 16px;
                    border:1px solid {border};break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="background:{tag_bg};color:{tag_col};font-family:monospace;
                         font-size:11px;font-weight:700;padding:3px 10px;
                         border-radius:20px;">{label}</span>
            <span style="font-size:13px;color:{txt_col};font-weight:600;
                         font-family:Arial,sans-serif;">{cfg['title']}</span>
          </div>
          <img src="{b64}" alt="{label}"
               style="display:block;max-width:100%;height:auto;border-radius:6px;" />
        </div>"""
                chart_cards.append(card)
                print("OK")
                ok += 1
            else:
                print("WARN — render returned None")
                err += 1
        except Exception as exc:
            print(f"ERROR — {exc}")
            err += 1

    mode_badge = "dark" if dark else "light"
    mode_color = "#4A9EFF" if dark else "#4338CA"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BigQuery Chart Engine v15 — Visual Test Gallery</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: {bg_color};
      font-family: Arial, "Helvetica Neue", sans-serif;
      padding: 32px 24px 48px;
      min-height: 100vh;
    }}
    .header {{
      max-width: 1200px; margin: 0 auto 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid {border};
    }}
    .header h1 {{
      font-size: 22px; font-weight: 700; color: {txt_col};
      margin-bottom: 6px;
    }}
    .header p {{
      font-size: 13px; color: {'#8FA4C8' if dark else '#6B7280'};
      line-height: 1.6;
    }}
    .badge {{
      display: inline-block;
      background: {mode_color};
      color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 10px; border-radius: 20px;
      margin-left: 8px; vertical-align: middle;
      text-transform: uppercase; letter-spacing: .05em;
    }}
    .stats {{
      display: flex; gap: 20px; margin-top: 12px;
    }}
    .stat {{
      font-size: 12px;
      color: {'#8FA4C8' if dark else '#6B7280'};
    }}
    .stat strong {{ color: {txt_col}; }}
    .grid {{
      max-width: 1300px; margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(640px, 1fr));
      gap: 20px;
    }}
  </style>
</head>
<body>
  <div class="header">
    <h1>BigQuery Chart Engine v15
      <span class="badge">{mode_badge} mode</span>
    </h1>
    <p>Visual test gallery — all 8 Altair chart types rendered with synthetic mock data.
       No BigQuery connection required.</p>
    <div class="stats">
      <div class="stat">Rendered: <strong>{ok}</strong></div>
      <div class="stat">Failed: <strong>{err}</strong></div>
      <div class="stat">Total: <strong>{ok + err}</strong></div>
    </div>
  </div>
  <div class="grid">
{''.join(chart_cards)}
  </div>
</body>
</html>"""

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"\n  Gallery written -> {os.path.abspath(out_path)}")
    print(f"  Rendered {ok}/{ok+err} charts successfully.")
