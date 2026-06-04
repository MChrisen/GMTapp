#!/bin/zsh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ELECTRON_BIN="./node_modules/.bin/electron"

if [ ! -x "$ELECTRON_BIN" ]; then
  echo "Installerer afhængigheder (første gang kan tage et øjeblik)..."
  npm install
fi

if [ ! -f "./dist/index.html" ]; then
  echo "Bygger appen..."
  npm run build
fi

# Electron requestSingleInstanceLock: anden start fokuserer eksisterende vindue
exec "$ELECTRON_BIN" .
