# Sådan åbner du GMT Eksamenhjælp

## Mac

**Dobbeltklik på `Start GMT.app`** i projektmappen (ved siden af `package.json`).

Første gang macOS kan blokere:

1. **Højreklik** på `Start GMT.app` → **Åbn** → **Åbn**

**Krav:** [Node.js LTS](https://nodejs.org). Første start installerer pakker og bygger — det tager et par minutter.

### Hvis appen stadig ikke åbner

Åbn **Terminal** i projektmappen og kør:

```bash
npm install
npm start
```

Fejl logges i `.gmt-launch.log` i projektmappen.

## Windows

Dobbeltklik **`Start GMT.bat`**.

Eller i kommandoprompt: `npm install` derefter `npm start`.

## Opdater launcher efter ændring i AppleScript

```bash
./scripts/build-launcher-app.sh
```
