"""
BigQuery client — service-account auth, read + write.

IAM roles required on the service account:
  roles/bigquery.dataViewer
  roles/bigquery.dataEditor   (for email_output writes)
  roles/bigquery.jobUser

Set SERVICE_ACCOUNT_KEY_FILE and PROJECT_ID below, then instantiate:
    bq = BigQueryClient()

Or pass overrides directly:
    bq = BigQueryClient(key_file="path/to/key.json", project_id="my-project")
"""

import json
import os

import pandas as pd

# ── Configuration ─────────────────────────────────────────────────────────────
SERVICE_ACCOUNT_KEY_FILE = "service_account_key.json"
PROJECT_ID               = "your-gcp-project-id"


class BigQueryClient:
    """
    Wraps google-cloud-bigquery with service-account credentials.
    All google.cloud imports are deferred to __init__ so the module can be
    imported without google-cloud-bigquery installed (mock-mode use case).
    """

    def __init__(self,
                 key_file:   str = SERVICE_ACCOUNT_KEY_FILE,
                 project_id: str = PROJECT_ID):
        if not os.path.isfile(key_file):
            raise FileNotFoundError(
                f"Service account key not found: '{key_file}'\n"
                "GCP Console → IAM & Admin → Service Accounts → Keys → Add Key → JSON.\n"
                f"Save the downloaded JSON as '{key_file}' next to this script."
            )
        from google.oauth2 import service_account
        from google.cloud import bigquery

        creds = service_account.Credentials.from_service_account_file(
            key_file, scopes=["https://www.googleapis.com/auth/bigquery"]
        )
        self.client = bigquery.Client(project=project_id, credentials=creds)

        with open(key_file) as f:
            meta = json.load(f)
        print(f"  [AUTH] {meta.get('client_email', '?')}  /  {meta.get('project_id', '?')}")

    def query(self, sql: str) -> pd.DataFrame:
        """Run a SELECT and return results as a DataFrame."""
        return self.client.query(sql).to_dataframe()

    def insert_rows(self, table_id: str, rows: list, write_mode: str = "APPEND") -> None:
        """Load a list of dicts into table_id using the email_output schema."""
        from google.cloud import bigquery

        _F = bigquery.SchemaField
        schema = [
            _F("email_id",         "STRING"),
            _F("report_name",      "STRING"),
            _F("recipient_email",  "STRING"),
            _F("subject",          "STRING"),
            _F("final_html",       "STRING"),
            _F("charts_injected",  "INTEGER"),
            _F("total_charts",     "INTEGER"),
            _F("status",           "STRING"),
            _F("error_message",    "STRING"),
            _F("processed_at",     "TIMESTAMP"),
        ]
        disp = {
            "APPEND":   bigquery.WriteDisposition.WRITE_APPEND,
            "TRUNCATE": bigquery.WriteDisposition.WRITE_TRUNCATE,
        }.get(write_mode.upper(), bigquery.WriteDisposition.WRITE_APPEND)

        job_cfg = bigquery.LoadJobConfig(schema=schema, write_disposition=disp)
        job = self.client.load_table_from_dataframe(
            pd.DataFrame(rows), table_id, job_config=job_cfg
        )
        job.result()
        print(f"  [BQ WRITE] {len(rows)} row(s) → {table_id}  ({write_mode})")
