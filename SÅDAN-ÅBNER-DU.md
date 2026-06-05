# Sådan åbner du GMT Eksamenhjælp

## 1. Download den rigtige version

[Github Releases (seneste)](https://github.com/MChrisen/GMTapp/releases/latest)

| Din Mac | Fil |
|---------|-----|
| **M1 / M2 / M3** (Apple Silicon) | `GMT-Eksamenhjaelp-mac-arm64.dmg` |
| **Intel** (ældre Mac) | `GMT-Eksamenhjaelp-mac-x64.dmg` |

Tjek:  → Om denne Mac → **Processor** → "Apple" = arm64, "Intel" = x64.

## 2. Installer

**DMG virker ikke?** Brug **.zip** i stedet: udpak → dobbeltklik **GMT Eksamenhjælp.app**.

1. Åbn `.dmg` eller udpak `.zip`
2. Træk **GMT Eksamenhjælp** til **Programmer** (valgfrit)
3. Start appen

## 3. macOS siger appen er blokeret

Usigneret app — det er normalt:

1. **Højreklik** på appen → **Åbn** → **Åbn**
2. Eller: Systemindstillinger → Privatliv og sikkerhed → **Åbn alligevel**

## Windows

1. [Releases](https://github.com/MChrisen/GMTapp/releases/latest) → **`GMT-Eksamenhjaelp-win-x64.exe`**
2. Dobbeltklik (evt. flyt til Skrivebord)
3. Ved **Windows beskytter din PC**: **Flere oplysninger** → **Kør alligevel**

Ingen installation og ingen Node.js.

---

## 4. Stadig problemer? (Mac)

Terminal (erstatter sti med din Downloads-mappe):

```bash
xattr -cr ~/Downloads/GMT-Eksamenhjaelp-mac-*.dmg
xattr -cr ~/Applications/GMT\ Eksamenhjælp.app
open ~/Applications/GMT\ Eksamenhjælp.app
```
