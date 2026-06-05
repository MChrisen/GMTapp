@echo off
setlocal
cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  GMT Eksamenhjælp: Node.js er ikke installeret.
  echo  Hent LTS fra https://nodejs.org og kør denne fil igen.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\electron\cli.js" (
  echo Installerer afhængigheder...
  call npm install --no-fund --no-audit
)

if not exist "dist\index.html" (
  echo Bygger appen...
  call npm run build
)

call npx --yes electron .
endlocal
