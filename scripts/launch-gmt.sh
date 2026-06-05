#!/bin/bash
# GMT Eksamenhjælp — Mac-launcher. Kræver Node.js LTS (nodejs.org).
set -e

SCRIPT_PATH="${BASH_SOURCE[0]}"
while [[ -L "$SCRIPT_PATH" ]]; do
  SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
done
PROJECT_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
cd "$PROJECT_DIR"

LOG_FILE="$PROJECT_DIR/.gmt-launch.log"
: >"$LOG_FILE"
exec >>"$LOG_FILE" 2>&1
echo "=== $(date) launch-gmt.sh pwd=$PROJECT_DIR ==="

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:${PATH:-}"
export NPM_CONFIG_UPDATE_NOTIFIER=false
export npm_config_loglevel=error
export NPM_CONFIG_CACHE="${PROJECT_DIR}/.npm-cache"
mkdir -p "$NPM_CONFIG_CACHE"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
  nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
fi
if command -v "$HOME/.fnm/fnm" >/dev/null 2>&1; then
  eval "$("$HOME/.fnm/fnm" env)" 2>/dev/null || true
fi

NODE_BIN=""
for candidate in "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node; do
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    NODE_BIN="$candidate"
    export PATH="$(dirname "$NODE_BIN"):$PATH"
    break
  fi
done

alert() {
  /usr/bin/osascript -e "display alert \"GMT Eksamenhjælp\" message \"${1//\"/\\\"}\" as critical" 2>/dev/null || echo "GMT: $1" >&2
}

fail() {
  alert "$1"
  exit 1
}

chmod +x "$PROJECT_DIR/scripts/launch-gmt.sh" 2>/dev/null || true
xattr -dr com.apple.quarantine "$PROJECT_DIR" 2>/dev/null || true

if [[ -z "$NODE_BIN" ]]; then
  fail "Node.js mangler. Installer LTS fra nodejs.org, genstart Mac, og start igen."
fi

if ! command -v npm >/dev/null 2>&1; then
  fail "npm mangler. Geninstallér Node.js fra nodejs.org."
fi

HAS_DIST=0
[[ -f "$PROJECT_DIR/dist/index.html" ]] && HAS_DIST=1

install_deps() {
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    if [[ "$HAS_DIST" -eq 1 ]]; then
      echo "npm ci --omit=dev (dist findes — springer build-værktøj over)"
      npm ci --omit=dev --no-fund --no-audit
    else
      echo "npm ci (fuld install + build)"
      npm ci --no-fund --no-audit
    fi
  else
    npm install --no-fund --no-audit
  fi
}

ELECTRON_BIN="$PROJECT_DIR/node_modules/.bin/electron"
if [[ ! -x "$ELECTRON_BIN" ]]; then
  /usr/bin/osascript -e 'display notification "Installerer GMT (første gang kan tage 2–5 min)…" with title "GMT Eksamenhjælp"' 2>/dev/null || true
  install_deps || fail "npm install fejlede. Åbn .gmt-launch.log eller kør: npm install"
fi

if [[ "$HAS_DIST" -eq 0 ]]; then
  /usr/bin/osascript -e 'display notification "Bygger appen første gang…" with title "GMT Eksamenhjælp"' 2>/dev/null || true
  npm run build || fail "Build fejlede. Se .gmt-launch.log"
fi

if [[ ! -x "$ELECTRON_BIN" ]]; then
  fail "Electron blev ikke installeret. Kør i Terminal: cd \"$(basename "$PROJECT_DIR")\" && npm install"
fi

echo "Starter Electron…"
exec "$ELECTRON_BIN" "$PROJECT_DIR"
