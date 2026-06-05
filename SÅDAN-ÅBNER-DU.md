# Sådan åbner du GMT Eksamenhjælp

## Anbefalet: færdig app (ingen installation af Node)

Hent den **færdigpakkede app** fra GitHub Releases — ikke kildekoden alene.

1. [github.com/MChrisen/GMTapp/releases](https://github.com/MChrisen/GMTapp/releases)
2. Mac: download `.dmg` → træk til Programmer → start **GMT Eksamenhjælp**
3. Windows: download `.exe` → dobbeltklik

**Du skal ikke** køre `npm install` eller `Start GMT.command`.

---

## Kun hvis du udvikler fra kildekode

```bash
npm install
npm run package:mac
open release/mac-arm64/GMT\ Eksamenhjælp.app
```
