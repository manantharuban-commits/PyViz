import json
import os

import pandas as pd

from .config import SERVICE_ACCOUNT_KEY_FILE, PROJECT_ID


class BigQueryClient:
    """
    Service Account auth. Handles READ (query) and WRITE (insert).

    IAM roles needed:
      - roles/bigquery.dataViewer
      - roles/bigquery.dataEditor   (for email_output writes)
      - roles/bigquery.jobUser

    Set SERVICE_ACCOUNT_KEY_FILE to downloaded JSON key path.
    GCP Console → IAM & Admin → Service Accounts → Keys → Add Key → JSON.
    """

    def __init__(self):
        key_path = SERVICE_ACCOUNT_KEY_FILE
        if not os.path.isfile(key_path):
            raise FileNotFoundError(
                f"Service account key not found: '{key_path}'\n"
                "GCP Console → IAM & Admin → Service Accounts → Keys → Add Key → JSON.\n"
                f"Save downloaded JSON as '{key_path}' next to this script."
            )
        from google.oauth2 import service_account
        from google.cloud import bigquery
        creds = service_account.Credentials.from_service_account_file(
            key_path, scopes=["https://www.googleapis.com/auth/bigquery"]
        )
        self.client = bigquery.Client(project=PROJECT_ID, credentials=creds)
        with open(key_path) as f:
            m = json.load(f)
        print(f"  [AUTH] {m.get('client_email', '?')}  /  {m.get('project_id', '?')}")

    def query(self, sql: str) -> pd.DataFrame:
        return self.client.query(sql).to_dataframe()

    def insert_rows(self, table_id: str, rows: list, write_mode: str = "APPEND"):
        from google.cloud import bigquery
        _FIELD = bigquery.SchemaField
        schema = [
            _FIELD("email_id",         "STRING"),
            _FIELD("report_name",      "STRING"),
            _FIELD("recipient_email",  "STRING"),
            _FIELD("subject",          "STRING"),
            _FIELD("final_html",       "STRING"),
            _FIELD("charts_injected",  "INTEGER"),
            _FIELD("total_charts",     "INTEGER"),
            _FIELD("status",           "STRING"),
            _FIELD("error_message",    "STRING"),
            _FIELD("processed_at",     "TIMESTAMP"),
        ]
        disp = {
            "APPEND":   bigquery.WriteDisposition.WRITE_APPEND,
            "TRUNCATE": bigquery.WriteDisposition.WRITE_TRUNCATE,
        }.get(write_mode.upper(), bigquery.WriteDisposition.WRITE_APPEND)
        cfg = bigquery.LoadJobConfig(schema=schema, write_disposition=disp)
        job = self.client.load_table_from_dataframe(
            pd.DataFrame(rows), table_id, job_config=cfg
        )
        job.result()
        print(f"  [BQ WRITE] {len(rows)} row(s) → {table_id}  ({write_mode})")
