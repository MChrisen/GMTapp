#!/bin/bash
# ═══ START HER (Mac) — dobbeltklik denne fil i mappen GMTapp ═══
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit 1

echo ""
echo "  GMT Eksamenhjælp"
echo "  Mappe: $DIR"
echo ""

if [[ ! -f "$DIR/package.json" ]]; then
  echo "FEJL: package.json mangler. Du skal køre fra hele GMTapp-mappen fra GitHub."
  echo "  git clone https://github.com/MChrisen/GMTapp.git"
  read -r -p "Tryk Enter for at lukke…"
  exit 1
fi

if [[ ! -f "$DIR/scripts/launch-gmt.sh" ]]; then
  echo "FEJL: scripts/launch-gmt.sh mangler. Kør: git pull"
  read -r -p "Tryk Enter for at lukke…"
  exit 1
fi

xattr -dr com.apple.quarantine "$DIR" 2>/dev/null || true
chmod +x "$DIR/Start GMT.command" "$DIR/scripts/launch-gmt.sh" 2>/dev/null || true

if ! /bin/bash "$DIR/scripts/launch-gmt.sh"; then
  echo ""
  echo "Start fejlede. Se log: $DIR/.gmt-launch.log"
  tail -20 "$DIR/.gmt-launch.log" 2>/dev/null || true
  read -r -p "Tryk Enter for at lukke…"
  exit 1
fi
