# GMT Eksamenhjælp

Offline eksamenshjælp til GMT.

## Brug på Mac (ingen Node.js)

1. Gå til **[Releases (seneste)](https://github.com/MChrisen/GMTapp/releases/latest)**
2. **Apple Silicon (M1/M2/M3):** `GMT-Eksamenhjaelp-mac-arm64.dmg` — **Intel Mac:** `GMT-Eksamenhjaelp-mac-x64.dmg`  
   DMG driller? Brug **.zip** i stedet.
3. Åbn DMG → træk **GMT Eksamenhjælp** til Programmer
4. Dobbeltklik appen

Første gang: højreklik → **Åbn** → **Åbn**, hvis macOS advarer.

## Brug på Windows

Download **`GMT-Eksamenhjaelp-win-x64.exe`** (portable) fra Releases og dobbeltklik.

## Udvikler (byg selv)

```bash
git clone https://github.com/MChrisen/GMTapp.git
cd GMTapp
npm install
npm run package:mac    # → release/GMT-Eksamenhjaelp-mac-arm64.dmg
```

Den færdige app ligger i mappen **`release/`**.
