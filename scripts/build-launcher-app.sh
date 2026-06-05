#!/bin/bash
# Bygger/opdaterer Start GMT.app fra AppleScript-kilden.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
rm -rf "Start GMT.app"
osacompile -o "Start GMT.app" "scripts/Start-GMT.applescript"
xattr -cr "Start GMT.app" 2>/dev/null || true
echo "OK: Start GMT.app"
