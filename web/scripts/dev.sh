#!/usr/bin/env bash
# Start both API and UI dev servers concurrently.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting ApplyPilot Web UI..."
echo "  API: http://localhost:8000"
echo "  UI:  http://localhost:3000"
echo ""

trap 'kill 0' EXIT

bash "$SCRIPT_DIR/dev-api.sh" &
API_PID=$!

bash "$SCRIPT_DIR/dev-ui.sh" &
UI_PID=$!

wait $API_PID $UI_PID
