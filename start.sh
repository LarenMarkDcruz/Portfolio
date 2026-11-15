#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly SERVER_HOST="${PORTFOLIO_HOST:-127.0.0.1}"
readonly SERVER_PORT="${1:-8000}"

show_help() {
  printf '%s\n' 'Usage: ./start.sh [port]' 'Serves this portfolio locally. Default: http://127.0.0.1:8000' 'Keep this terminal open. Press Ctrl+C to stop.'
}

validate_configuration() {
  if [[ "${SERVER_PORT}" == '--help' || "${SERVER_PORT}" == '-h' ]]; then
    show_help
    exit 0
  fi
  if [[ "$#" -gt 1 || ! "${SERVER_PORT}" =~ ^[0-9]{1,5}$ ]] || ((10#${SERVER_PORT} < 1 || 10#${SERVER_PORT} > 65535)); then
    printf '%s\n' 'Choose one port between 1 and 65535.' >&2
    exit 1
  fi
  command -v python3 >/dev/null || { printf '%s\n' 'Python 3 is required.' >&2; exit 1; }
  [[ -f "${PROJECT_DIRECTORY}/dist/index.html" ]] || { printf '%s\n' 'Cannot find dist/index.html.' >&2; exit 1; }
}

start_preview_server() {
  printf 'Portfolio: http://%s:%s/\nKeep this terminal open. Ctrl+C stops the server.\n' "${SERVER_HOST}" "${SERVER_PORT}"
  exec python3 -m http.server "${SERVER_PORT}" --directory "${PROJECT_DIRECTORY}/dist" --bind "${SERVER_HOST}"
}

validate_configuration "$@"
start_preview_server
