SERVICE_ACCOUNT_KEY_FILE = "service_account_key.json"
PROJECT_ID               = "your-gcp-project-id"

EMAIL_LIST_TABLE         = "your_project.your_dataset.email_list"
CHART_CONFIG_VIEW        = "your_project.your_dataset.chart_config_view"
EMAIL_OUTPUT_TABLE       = "your_project.your_dataset.email_output"

WRITE_MODE               = "APPEND"      # APPEND | TRUNCATE
OUTPUT_DIR               = "output_emails"
MAX_WORKERS              = 4

# True  → synthetic mock data (no BQ credentials needed)
# False → query live BigQuery tables
USE_MOCK                 = True

# Global token overrides — merged into every email's variable context.
# Per-email email_id from email_list is merged on top per dispatch.
TABLE_VARS: dict = {
    # "env":    "prod",
    # "region": "APAC",
}
