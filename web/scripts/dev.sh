#!/usr/bin/env bash
# ApplyPilot Full-Stack Dev Launcher — Resilient, Self-Healing & Robust Process Supervisor
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

API_PORT="${API_PORT:-8000}"
UI_PORT="${UI_PORT:-3000}"

# Colors
GREEN='\033[1;32m'
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "================================================================"
echo "          🚀 ApplyPilot Full Stack Control Center              "
echo "================================================================"
echo -e "${NC}"

# Self-healing helper: Force clean stale processes occupying target ports
cleanup_stale_ports() {
  for port in "$API_PORT" "$UI_PORT"; do
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo -e "${YELLOW}[SELF-HEALING] Pre-flight: Clearing stale process(es) on port $port (PID: $pids)...${NC}"
      kill -15 $pids 2>/dev/null || true
      sleep 1
      pids_rem=$(lsof -ti :"$port" 2>/dev/null || true)
      if [ -n "$pids_rem" ]; then
        kill -9 $pids_rem 2>/dev/null || true
      fi
    fi
  done
}

cleanup_stale_ports

# Track background process PIDs
API_PID=""
UI_PID=""

shutdown() {
  echo -e "\n${YELLOW}🛑 Shutting down ApplyPilot services...${NC}"
  if [ -n "$API_PID" ]; then
    kill -15 "$API_PID" 2>/dev/null || true
  fi
  if [ -n "$UI_PID" ]; then
    kill -15 "$UI_PID" 2>/dev/null || true
  fi
  # Guarantee ports are freed
  cleanup_stale_ports
  echo -e "${GREEN}✅ ApplyPilot full stack shut down cleanly.${NC}"
  exit 0
}

# Trap termination signals for graceful exit
trap shutdown SIGINT SIGTERM EXIT

# Start API in background
echo -e "${CYAN}▶ Launching FastAPI Backend on port ${API_PORT}...${NC}"
bash "$SCRIPT_DIR/dev-api.sh" &
API_PID=$!

# Start UI in background
echo -e "${CYAN}▶ Launching Next.js SaaS Web UI on port ${UI_PORT}...${NC}"
bash "$SCRIPT_DIR/dev-ui.sh" &
UI_PID=$!

echo -e "\n${GREEN}✔ Both service supervisors launched successfully!${NC}"
echo -e "   • ${BOLD}FastAPI Backend API:${NC} http://localhost:${API_PORT}"
echo -e "   • ${BOLD}OpenAPI Interactive Docs:${NC} http://localhost:${API_PORT}/docs"
echo -e "   • ${BOLD}Next.js SaaS Control Panel:${NC} http://localhost:${UI_PORT}\n"

# Wait for both processes
wait $API_PID $UI_PID
