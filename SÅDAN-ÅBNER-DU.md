# Sådan åbner du GMT Eksamenhjælp

## Krav (alle platforme)

1. Installer **[Node.js LTS](https://nodejs.org)** (version 20 eller nyere).
2. Hent projektet: `git clone https://github.com/MChrisen/GMTapp.git` og åbn mappen.

Appen er **allerede bygget** i repoet (`dist/`). Du skal ikke køre build selv — kun installere Electron første gang.

---

## Mac — anbefalet

**Dobbeltklik `Start GMT.command`**

- Åbner Terminal og viser fremskridt/fejl.
- Første start: `npm install` (2–5 min), derefter åbnes appen.

Alternativ: **`Start GMT.app`** (samme resultat via Terminal).

Første gang macOS blokerer måske: **højreklik → Åbn → Åbn**.

### Fejlsøgning Mac

```bash
cd GMTapp   # eller mappenavn efter klon
npm install --omit=dev
npm start
```

Se log: `.gmt-launch.log` i projektmappen.

---

## Windows

**Dobbeltklik `Start GMT.bat`**

---

## Efter `git pull`

Dobbeltklik `Start GMT.command` / `Start GMT.bat` igen. Ved store opdateringer kan du manuelt køre:

```bash
npm install --omit=dev
```

---

## Udviklere (ændrer kode)

```bash
npm install
npm run build    # opdater dist/
npm run desktop
```

Commit `dist/` efter build, så andre ikke skal bygge.
