#!/bin/bash
# Byg signert .app + HFS+ DMG (bedre kompatibilitet end APFS-DMG) + ZIP.
# Brug: ./scripts/package-mac-release.sh arm64|x64
set -euo pipefail

ARCH="${1:-arm64}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CSC_IDENTITY_AUTO_DISCOVERY=false

echo "==> Build web (dist/)"
npm run build

echo "==> Electron package ($ARCH)"
npx electron-builder --mac dir "--$ARCH"

case "$ARCH" in
  arm64) APP_DIR="release/mac-arm64" ;;
  x64)   APP_DIR="release/mac" ;;
  *)
    echo "Ukendt arch: $ARCH (brug arm64 eller x64)"
    exit 1
    ;;
esac

APP="$APP_DIR/GMT Eksamenhjælp.app"
if [[ ! -d "$APP" ]]; then
  echo "Mangler app: $APP"
  ls -la release/ || true
  exit 1
fi

echo "==> Signér app (adhoc — tillader åbning efter højreklik-Åbn)"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP" 2>/dev/null || codesign --verify --deep "$APP"

DMG="release/GMT-Eksamenhjaelp-mac-${ARCH}.dmg"
ZIP="release/GMT-Eksamenhjaelp-mac-${ARCH}.zip"
rm -f "$DMG" "$ZIP"

echo "==> Opret DMG (HFS+, virker på flere macOS-versioner)"
hdiutil create \
  -volname "GMT Eksamenhjælp" \
  -srcfolder "$APP" \
  -ov \
  -format UDZO \
  -fs HFS+J \
  "$DMG"

echo "==> Verificér DMG"
hdiutil verify "$DMG"

echo "==> Opret ZIP"
(cd "$APP_DIR" && zip -ry "../$(basename "$ZIP")" "GMT Eksamenhjælp.app")

ls -lh "$DMG" "$ZIP"
echo "Færdig: $DMG"
