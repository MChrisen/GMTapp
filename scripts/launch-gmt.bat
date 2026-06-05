@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set NPM_CONFIG_UPDATE_NOTIFIER=false

if not exist ".gmt-launch.log" type nul > ".gmt-launch.log"
echo === %date% %time% launch-gmt.bat ===>> ".gmt-launch.log"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  GMT Eksamenhjælp: Node.js er ikke installeret.
  echo  Hent LTS fra https://nodejs.org og dobbeltklik Start GMT.bat igen.
  echo.
  pause
  exit /b 1
)

set HAS_DIST=0
if exist "dist\index.html" set HAS_DIST=1

if not exist "node_modules\electron\dist\electron.exe" (
  echo Installerer GMT - foerste gang kan tage et par minutter...
  if "%HAS_DIST%"=="1" (
    call npm ci --omit=dev --no-fund --no-audit
  ) else (
    call npm ci --no-fund --no-audit
  )
  if errorlevel 1 (
    echo npm install fejlede. Se .gmt-launch.log
    pause
    exit /b 1
  )
)

if "%HAS_DIST%"=="0" (
  echo Bygger appen...
  call npm run build
  if errorlevel 1 (
    echo Build fejlede.
    pause
    exit /b 1
  )
)

call npx --no-install electron .
endlocal
