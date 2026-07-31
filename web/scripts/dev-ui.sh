#!/usr/bin/env bash
# Start Next.js UI dev server.
set -euo pipefail
cd "$(dirname "$0")/../ui"
exec npm run dev
