# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side-only React + TypeScript + Vite PWA with no backend or database. All data is embedded in TypeScript source files.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves on `http://127.0.0.1:5173/`) |
| Type-check + build | `npm run build` (`tsc && vite build`) |
| Data validation | `npm run validate:data` |
| Offline smoke test | `npm run offline:smoke` (requires `dist/` from build) |
| Full QA pipeline | `npm run qa` (validate → build → smoke) |

### Notes

- There is no dedicated linter (ESLint/Prettier). The TypeScript strict-mode check (`tsc`) is the primary code quality gate; it runs as part of `npm run build`.
- There is no test framework (Jest/Vitest). Validation is done via `npm run validate:data` (cross-reference checks) and `npm run offline:smoke` (build artifact checks).
- The dev server binds to `127.0.0.1:5173` by default (set in `package.json` via `--host 127.0.0.1`).
- Python 3 with `pypdf` is only needed for `npm run extract:pdfs` and `npm run build:search-index`; their outputs are already committed so these scripts don't need to run during normal development.
- The app is a PWA with a service worker; during development you can ignore service worker caching since Vite dev server handles HMR.
