# Sådan åbner du GMT Eksamenhjælp

## Vigtigt (Mac)

**Dobbeltklik `Start GMT.command`** i mappen **GMTapp** (efter `git clone`).

| Fil | Brug? |
|-----|--------|
| **Start GMT.command** | ✅ Ja — primær start |
| **OPEN-GMT.command** | ✅ Samme (alternativt navn) |
| **Start GMT.app** | Kun genvej — åbner `.command` i samme mappe. Virker **ikke** hvis du kun har kopieret `.app` væk fra mappen |

Hvis Terminal viser `AppTranslocation` eller `No such file or directory` på `launch-gmt.sh`, har du åbnet **kun** `.app`-filen. Klon hele projektet og brug **`.command`**.

---

## Trin

1. [Node.js LTS](https://nodejs.org) (v20+)
2. `git clone https://github.com/MChrisen/GMTapp.git`
3. Åbn mappen **GMTapp** i Finder
4. Dobbeltklik **`Start GMT.command`**

Første gang: 2–5 min (`npm install`). Appen er allerede bygget (`dist/` i repo).

macOS blokerer måske første gang: **højreklik → Åbn → Åbn**.

### Fejlsøgning

```bash
cd GMTapp
npm install --omit=dev
npm start
```

Log: `.gmt-launch.log`

---

## Windows

Dobbeltklik **`Start GMT.bat`** i mappen GMTapp.
