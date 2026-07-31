#!/usr/bin/env bash
# Start ApplyPilot Next.js UI dev server with self-healing port cleanup.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$(cd "$SCRIPT_DIR/../ui" && pwd)"

PORT="${UI_PORT:-3000}"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Self-healing: Check and free port if occupied
free_port() {
  local p="$1"
  local pids
  pids=$(lsof -ti :"$p" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}[SELF-HEALING] Port $p is occupied by PID(s): $pids. Cleaning up stale process...${NC}"
    kill -15 $pids 2>/dev/null || true
    sleep 1
    # Force kill if still running
    pids_remaining=$(lsof -ti :"$p" 2>/dev/null || true)
    if [ -n "$pids_remaining" ]; then
      kill -9 $pids_remaining 2>/dev/null || true
    fi
    echo -e "${GREEN}[SELF-HEALING] Port $p freed successfully.${NC}"
  fi
}

free_port "$PORT"

cd "$UI_DIR"

# Self-healing: Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}[SELF-HEALING] UI node_modules missing. Installing npm packages...${NC}"
  npm install
fi

echo -e "${CYAN}✨ Starting Next.js SaaS Web UI on http://localhost:${PORT}${NC}"
exec npx next dev --port "$PORT"
