#!/usr/bin/env bash
# Start ApplyPilot API server in development mode with auto-reload.
set -euo pipefail
cd "$(dirname "$0")/../.."
export PYTHONPATH="${PYTHONPATH:-}:$(pwd)/src"
exec uvicorn web.api.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir src --reload-dir web/api
