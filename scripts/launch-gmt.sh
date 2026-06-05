#!/bin/bash
# GMT Eksamenhjælp — fælles launcher (Mac). Kaldes fra Start GMT.app.
set -e

SCRIPT_PATH="${BASH_SOURCE[0]}"
while [[ -L "$SCRIPT_PATH" ]]; do
  SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
done
PROJECT_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
cd "$PROJECT_DIR"

LOG_FILE="$PROJECT_DIR/.gmt-launch.log"
exec >>"$LOG_FILE" 2>&1
echo "=== $(date) launch-gmt.sh ==="

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh" --no-use 2>/dev/null || true
  nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
fi
if [[ -d "$HOME/.fnm" ]] && command -v "$HOME/.fnm/fnm" >/dev/null 2>&1; then
  eval "$("$HOME/.fnm/fnm" env)" 2>/dev/null || true
fi

alert() {
  local msg="$1"
  /usr/bin/osascript -e "display alert \"GMT Eksamenhjælp\" message \"${msg//\"/\\\"}\" as critical" 2>/dev/null || true
}

fail() {
  alert "$1"
  exit 1
}

chmod +x "$PROJECT_DIR/scripts/launch-gmt.sh" 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js er ikke installeret. Hent LTS fra nodejs.org, genstart Mac, og dobbeltklik Start GMT.app igen."
fi

if ! command -v npm >/dev/null 2>&1; then
  fail "npm blev ikke fundet. Geninstallér Node.js fra nodejs.org."
fi

xattr -dr com.apple.quarantine "$PROJECT_DIR" 2>/dev/null || true

ELECTRON_BIN="$PROJECT_DIR/node_modules/.bin/electron"
if [[ ! -x "$ELECTRON_BIN" ]]; then
  /usr/bin/osascript -e 'display notification "Installerer afhængigheder (første gang)…" with title "GMT Eksamenhjælp"' 2>/dev/null || true
  npm install --no-fund --no-audit || fail "npm install fejlede. Se .gmt-launch.log i projektmappen."
fi

if [[ ! -f "$PROJECT_DIR/dist/index.html" ]]; then
  /usr/bin/osascript -e 'display notification "Bygger appen (første gang)…" with title "GMT Eksamenhjælp"' 2>/dev/null || true
  npm run build || fail "Build fejlede. Se .gmt-launch.log i projektmappen."
fi

exec "$ELECTRON_BIN" "$PROJECT_DIR"
