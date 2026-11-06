# Sets up the daily "Codex activity" update on this Windows PC.
# Right-click this file > "Run with PowerShell" (or run it from a PowerShell window).
# To remove it later:  Unregister-ScheduledTask -TaskName "Codex activity sync"

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$taskName = "Codex activity sync"
$log = Join-Path $env:LOCALAPPDATA "codex-sync.log"

function Fail($msg) { Write-Host "`n$msg`n" -ForegroundColor Red; Read-Host "Press Enter to close"; exit 1 }

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { Fail "Node.js is not installed. Install the LTS version from https://nodejs.org and run this again." }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "Git is not installed. Install it from https://git-scm.com and run this again." }
if (-not (Test-Path (Join-Path $env:USERPROFILE ".codex\sessions"))) {
  Write-Host "Note: no Codex logs found in $env:USERPROFILE\.codex\sessions yet. The update will pick them up once Codex has been used on this PC." -ForegroundColor Yellow
}

# Run once now, so you can sign in to GitHub the first time it pushes.
Write-Host "Updating your Codex card now..." -ForegroundColor Cyan
Push-Location $repo
try { & $node "scripts\codex-sync.mjs"; if ($LASTEXITCODE -ne 0) { Fail "The update failed (see the message above)." } }
finally { Pop-Location }

# Then every day at 9pm (or as soon as the PC is on, if it was off at 9pm).
$cmdArgs = "/c `"`"$node`" scripts\codex-sync.mjs >> `"$log`" 2>&1`""
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $cmdArgs -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Daily -At 9pm
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Updates the Codex activity card on github.com/Yohjit-2910" -Force | Out-Null

Write-Host "`nDone! Your Codex card will update every day at 9pm." -ForegroundColor Green
Write-Host "Log file: $log"
Read-Host "Press Enter to close"
