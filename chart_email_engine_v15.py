"""
BigQuery Chart Engine v15 — entry point.

All implementation lives in PyVizBuilder/.
Edit PyVizBuilder/config.py to change PROJECT_ID, USE_MOCK, etc.

Usage:
  python chart_email_engine_v15.py              # production run
  python chart_email_engine_v15.py --test       # visual gallery (no BQ needed)
  python chart_email_engine_v15.py --test --dark
  python chart_email_engine_v15.py --test --out preview.html
"""

import os
import sys

from PyVizBuilder.config import (
    SERVICE_ACCOUNT_KEY_FILE, PROJECT_ID, WRITE_MODE, MAX_WORKERS,
    EMAIL_LIST_TABLE, CHART_CONFIG_VIEW, EMAIL_OUTPUT_TABLE,
    USE_MOCK, TABLE_VARS, OUTPUT_DIR,
)
from PyVizBuilder.bq_client import BigQueryClient
from PyVizBuilder.engine import process_emails
from PyVizBuilder.test_gallery import run_visual_test


if __name__ == "__main__":
    if "--test" in sys.argv:
        dark     = "--dark" in sys.argv
        out_idx  = sys.argv.index("--out") if "--out" in sys.argv else -1
        out_path = sys.argv[out_idx + 1] if out_idx != -1 else "chart_test_gallery.html"
        print("=" * 62)
        print("  BigQuery Chart Engine v15  —  Visual Test Mode")
        print(f"  Rendering all 8 Altair chart types ({'dark' if dark else 'light'} mode)")
        print("=" * 62)
        run_visual_test(dark=dark, out_path=out_path)
        print("=" * 62)
    else:
        print("=" * 62)
        print("  BigQuery Chart Engine  v15")
        print("  One HTML per (report_name × email_id) combination")
        print("=" * 62)
        print(f"  Key file          : {SERVICE_ACCOUNT_KEY_FILE}")
        print(f"  Project           : {PROJECT_ID}")
        print(f"  Write mode        : {WRITE_MODE}")
        print(f"  email_list        : {EMAIL_LIST_TABLE}")
        print(f"  chart_config_view : {CHART_CONFIG_VIEW}")
        print(f"  email_output      : {EMAIL_OUTPUT_TABLE}")
        print(f"  Chart types       : line_altair, bar_altair, scatter_altair,")
        print(f"                      heatmap_altair, area_altair, strip_altair,")
        print(f"                      boxplot_altair, arc_altair")
        print(f"  Workers           : {MAX_WORKERS}")
        print(f"  Group key         : (report_name, email_id)")
        print(f"  Var resolve       : email_id > TABLE_VARS > built-in tokens")
        if TABLE_VARS:
            print(f"  Custom vars       : {list(TABLE_VARS.keys())}")
        print(f"  Data source       : {'MOCK (synthetic data)' if USE_MOCK else 'BigQuery (live)'}")
        print()

        bq   = None if USE_MOCK else BigQueryClient()
        rows = process_emails(bq)

        print(f"\n{'='*62}")
        print(f"  Done — {len(rows)} HTML(s) generated.")
        for r in rows:
            icon = {"SUCCESS": "✓", "WARN": "⚠", "FAILED": "✗"}.get(r["status"], "?")
            print(f"  {icon}  [{r['report_name']}]  email_id={r['email_id']}"
                  f"  →  {r['recipient_email']}"
                  f"  status={r['status']}"
                  f"  charts={r['charts_injected']}/{r['total_charts']}")
            if r["error_message"]:
                print(f"      {r['error_message']}")
        print(f"  Files → {os.path.abspath(OUTPUT_DIR)}/")
        print("=" * 62)
