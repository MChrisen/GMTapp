@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\electron\cli.js" (
  echo Installerer afhaengigheder...
  call npm install
)

if not exist "dist\index.html" (
  echo Bygger appen...
  call npm run build
)

call npx electron .
endlocal
