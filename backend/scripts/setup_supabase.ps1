# Apply FlowCapital schema + seed to Supabase.
# Method A (recommended when Postgres ports are blocked): Supabase CLI over HTTPS.
# Method B: Paste database/full_setup.sql into Supabase Dashboard → SQL Editor.

$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $BackendRoot

$ProjectRef = "vastwvtdzaambohbbasj"
$SetupSql = Join-Path $BackendRoot "database\full_setup.sql"
$SchemaSql = Join-Path $BackendRoot "database\schema.sql"

Write-Host "FlowCapital Supabase setup" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SetupSql)) {
    Write-Host "Generating full_setup.sql ..."
    $env:PYTHONPATH = "."
    & (Join-Path $BackendRoot ".venv\Scripts\python.exe") (Join-Path $BackendRoot "scripts\generate_setup_sql.py")
}

function Test-PostgresPort {
    param([string]$HostName, [int]$Port)
    try {
        $result = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue -ErrorAction Stop
        return $result.TcpTestSucceeded
    } catch {
        return $false
    }
}

$pooler = "aws-0-ap-south-1.pooler.supabase.com"
$pg5432 = Test-PostgresPort $pooler 5432
$pg6543 = Test-PostgresPort $pooler 6543
Write-Host "Postgres connectivity: pooler:5432=$pg5432, pooler:6543=$pg6543"

if ($pg5432 -or $pg6543) {
    Write-Host ""
    Write-Host "Trying direct Python setup (DATABASE_URL from .env) ..." -ForegroundColor Yellow
    $env:PYTHONPATH = "."
    $python = Join-Path $BackendRoot ".venv\Scripts\python.exe"
    & $python -m app.db_init
    if ($LASTEXITCODE -eq 0) {
        & $python -m app.seed.demo_seed
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database setup complete via DATABASE_URL." -ForegroundColor Green
            exit 0
        }
    }
    Write-Host "Python setup failed; trying Supabase CLI ..." -ForegroundColor Yellow
}

if ($env:SUPABASE_ACCESS_TOKEN) {
    Write-Host ""
    Write-Host "Applying via Supabase CLI (Management API / HTTPS) ..." -ForegroundColor Yellow
    npx --yes supabase db query --linked --project-ref $ProjectRef -f $SetupSql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database setup complete via Supabase CLI." -ForegroundColor Green
        exit 0
    }
}

Write-Host ""
Write-Host "Could not reach Postgres from this network and no SUPABASE_ACCESS_TOKEN is set." -ForegroundColor Red
Write-Host ""
Write-Host "Do ONE of the following:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1) SQL Editor (fastest, no local Postgres needed):"
Write-Host "   - Open https://supabase.com/dashboard/project/$ProjectRef/sql/new"
Write-Host "   - Copy ALL of: backend\database\full_setup.sql"
Write-Host "   - Click Run"
Write-Host ""
Write-Host "2) Supabase CLI over HTTPS:"
Write-Host "   - Run: npx supabase login"
Write-Host "   - Then re-run: .\scripts\setup_supabase.ps1"
Write-Host "   - Or set SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens"
Write-Host ""
Write-Host "3) If Postgres ports are blocked (common on office/school WiFi):"
Write-Host "   - Use mobile hotspot OR allow outbound TCP 5432/6543"
Write-Host "   - In Supabase: Project Settings > Database > disable IP restrictions if enabled"
Write-Host ""
Write-Host "After tables exist, start the API:"
Write-Host "   uvicorn app.main:app --reload --port 8000"
exit 1
