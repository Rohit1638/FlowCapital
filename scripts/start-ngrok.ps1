# Start ngrok tunnel for FlowCapital backend (port 8030)
# Requires: ngrok authtoken configured once via `ngrok config add-authtoken TOKEN`

$ErrorActionPreference = "Stop"

$ngrok = "C:\Users\Rohit Ram\AppData\Local\Microsoft\WinGet\Links\ngrok.exe"
if (-not (Test-Path $ngrok)) {
    $cmd = Get-Command ngrok -ErrorAction SilentlyContinue
    if ($cmd) { $ngrok = $cmd.Source } else { throw "ngrok not found. Install: winget install Ngrok.Ngrok" }
}

Write-Host "Checking backend on http://127.0.0.1:8031/api/v1/health ..."
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8031/api/v1/health" -TimeoutSec 5
    Write-Host "Backend OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "Backend not running on 8031! Start it first:" -ForegroundColor Red
    Write-Host "  cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8031"
    exit 1
}

Write-Host ""
Write-Host "Starting ngrok tunnel on port 8031 ..."
Write-Host "After start, open http://127.0.0.1:4040 for the public HTTPS URL"
Write-Host ""
Write-Host "Test endpoints:"
Write-Host "  /api/v1/health"
Write-Host "  /api/v1/integrations/asset-status/DA-2026-001"
Write-Host ""

& $ngrok http 8031
