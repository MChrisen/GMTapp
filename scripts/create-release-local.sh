#!/bin/bash
# Opret GitHub Release med lokal DMG (kræver: gh auth login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TAG="${1:-v0.1.2}"
DMG="$ROOT/release/GMT-Eksamenhjaelp-mac-arm64.dmg"
ZIP="$ROOT/release/GMT-Eksamenhjaelp-mac-arm64.zip"

if ! command -v gh >/dev/null; then
  echo "Installer GitHub CLI: brew install gh && gh auth login"
  exit 1
fi

if [[ ! -f "$DMG" ]]; then
  echo "Mangler DMG. Kør: npm run package:mac"
  exit 1
fi

gh release create "$TAG" \
  --repo MChrisen/GMTapp \
  --title "GMT Eksamenhjælp $TAG" \
  --notes "Dobbeltklik DMG (Mac) eller ZIP. Ingen Node.js nødvendig." \
  "$DMG" ${ZIP:+"$ZIP"}

echo "OK: https://github.com/MChrisen/GMTapp/releases/tag/$TAG"
