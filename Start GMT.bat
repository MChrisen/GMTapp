@echo off
REM Start GMT Eksamenhjælp (kun hvis du kører fra kildekode med Node.js).
REM Brugere: download GMT-Eksamenhjaelp-win-x64.exe fra GitHub Releases i stedet.
cd /d "%~dp0"
if exist "release\GMT-Eksamenhjaelp-win-x64.exe" (
  start "" "release\GMT-Eksamenhjaelp-win-x64.exe"
  exit /b 0
)
echo.
echo  Download den færdige Windows-app fra:
echo  https://github.com/MChrisen/GMTapp/releases/latest
echo.
pause
