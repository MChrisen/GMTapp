# Byg Windows portable .exe (ingen Node.js på bruger-PC).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "==> Build web (dist/)"
npm run build

Write-Host "==> Electron package (Windows x64 portable)"
npx electron-builder --win portable --x64

Write-Host "==> Release files:"
Get-ChildItem release\*.exe | Format-Table Name, @{N='MB';E={[math]::Round($_.Length/1MB,1)}}
