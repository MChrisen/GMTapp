#!/bin/bash
# Dobbeltklik åbner Terminal og starter GMT (mest pålideligt efter git clone).
DIR="$(cd "$(dirname "$0")" && pwd)"
xattr -dr com.apple.quarantine "$DIR" 2>/dev/null || true
chmod +x "$DIR/Start GMT.command" "$DIR/scripts/launch-gmt.sh" 2>/dev/null || true
exec /bin/bash "$DIR/scripts/launch-gmt.sh"
