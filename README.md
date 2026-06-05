# GMT Eksamenhjælp

Offline eksamenshjælp til GMT.

## Download (ingen Node.js)

**[GitHub Releases → seneste version](https://github.com/MChrisen/GMTapp/releases/latest)**

### Mac

| Processor | Fil |
|-----------|-----|
| **Apple Silicon** (M1/M2/M3) | `GMT-Eksamenhjaelp-mac-arm64.dmg` (eller `.zip`) |
| **Intel** | `GMT-Eksamenhjaelp-mac-x64.dmg` (eller `.zip`) |

### Windows

| Fil | Brug |
|-----|------|
| **`GMT-Eksamenhjaelp-win-x64.exe`** | Dobbeltklik — kører uden installation |

Ved Windows SmartScreen: **Flere oplysninger** → **Kør alligevel**.

Mere hjælp: **[SÅDAN-ÅBNER-DU.md](SÅDAN-ÅBNER-DU.md)**

## Udvikler

```bash
npm install
npm run package:mac    # Mac DMG/ZIP i release/
npm run package:win    # Windows .exe i release/
```
