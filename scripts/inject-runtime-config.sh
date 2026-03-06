#!/usr/bin/env bash
set -euo pipefail

if [ -z "${MAPBOX_PUBLIC_TOKEN:-}" ]; then
  echo "Missing required secret/env: MAPBOX_PUBLIC_TOKEN"
  exit 1
fi

WEBHOOK_URL="${GAS_WEBHOOK_URL:-${GOOGLE_SHEETS_WEBHOOK_URL:-}}"

js_escape() {
  local value="${1:-}"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  printf '%s' "$value"
}

MAPBOX_TOKEN_ESCAPED="$(js_escape "${MAPBOX_PUBLIC_TOKEN}")"
GA_ID_ESCAPED="$(js_escape "${GA_MEASUREMENT_ID:-}")"
WEBHOOK_ESCAPED="$(js_escape "${WEBHOOK_URL}")"

cat > assets/js/config.public.js <<EOF
// Generated during deployment.
window.MAPBOX_TOKEN = "${MAPBOX_TOKEN_ESCAPED}";
window.GA_MEASUREMENT_ID = "${GA_ID_ESCAPED}";
window.GAS_WEBHOOK_URL = "${WEBHOOK_ESCAPED}";
window.LEADS_WEBHOOK_URL = "${WEBHOOK_ESCAPED}";
EOF
