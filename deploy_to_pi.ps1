$defaultIP = "192.168.1.29"
Write-Host "Raspberry Pi IP [Default: $defaultIP]: " -ForegroundColor Cyan -NoNewline
$inputIP = Read-Host
$PI_IP = if ([string]::IsNullOrWhiteSpace($inputIP)) { $defaultIP } else { $inputIP.Trim() }

$defaultUser = "insolublenitrate"
Write-Host "Raspberry Pi Username [Default: $defaultUser]: " -ForegroundColor Cyan -NoNewline
$inputUser = Read-Host
$PI_USER = if ([string]::IsNullOrWhiteSpace($inputUser)) { $defaultUser } else { $inputUser.Trim() }

$DEST_DIR = "~/fantasy_dashboard"
$STAGING_DIR = Join-Path $env:TEMP "fantasy_pi_staging"
$TAR_FILE = Join-Path $env:TEMP "deploy_bundle.tar.gz"

Write-Host "`n[1/4] Preparing clean deployment package..." -ForegroundColor Yellow
if (Test-Path $STAGING_DIR) { Remove-Item -Recurse -Force $STAGING_DIR }
New-Item -ItemType Directory -Path $STAGING_DIR -Force | Out-Null

$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir)) { $scriptDir = (Get-Location).Path }

# Copy core directories excluding heavy/platform-specific files
$dirsToCopy = @("backend", "generation-2-dashboard", "frontend", "pi_deployment")
foreach ($dir in $dirsToCopy) {
    $src = Join-Path $scriptDir $dir
    $dst = Join-Path $STAGING_DIR $dir
    if (Test-Path $src) {
        robocopy $src $dst /E /XD "node_modules" ".next" "venv" "__pycache__" ".git" "out" "dist" ".vercel" /XF "*.pyc" /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    }
}

# Copy root python and config files
$rootFiles = @("main.py", "database.py", "models.py", "sleeper_ingest.py", "package.json")
foreach ($file in $rootFiles) {
    $src = Join-Path $scriptDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $STAGING_DIR -Force
    }
}

# Normalize line endings to Linux LF
Write-Host "[2/4] Normalizing Linux line endings..." -ForegroundColor Yellow
Get-ChildItem -Path (Join-Path $STAGING_DIR "pi_deployment") -Recurse -File | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $content = $content -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($_.FullName, $content, (New-Object System.Text.UTF8Encoding($false)))
}

# Create tar.gz bundle
Write-Host "[3/4] Creating fast deployment archive..." -ForegroundColor Yellow
if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }
Push-Location $STAGING_DIR
tar -czf $TAR_FILE *
Pop-Location

$bundleSize = [math]::Round(((Get-Item $TAR_FILE).Length / 1MB), 2)
Write-Host "Bundle size: $bundleSize MB" -ForegroundColor Green

# Upload to Pi
Write-Host "[4/4] Uploading bundle to Raspberry Pi ($PI_IP)..." -ForegroundColor Cyan
ssh "${PI_USER}@${PI_IP}" "mkdir -p $DEST_DIR"
scp $TAR_FILE "${PI_USER}@${PI_IP}:${DEST_DIR}/deploy_bundle.tar.gz"

Write-Host "Extracting bundle on Raspberry Pi..." -ForegroundColor Cyan
ssh "${PI_USER}@${PI_IP}" "cd $DEST_DIR && tar -xzf deploy_bundle.tar.gz && rm -f deploy_bundle.tar.gz && chmod +x pi_deployment/*.sh"

# Cleanup local temp
Remove-Item -Recurse -Force $STAGING_DIR -ErrorAction SilentlyContinue
Remove-Item -Force $TAR_FILE -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " Files pushed to Raspberry Pi successfully!         " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "To install dependencies and build on the Pi, run:"
Write-Host ""
Write-Host "    ssh ${PI_USER}@${PI_IP}" -ForegroundColor White
Write-Host "    bash ~/fantasy_dashboard/pi_deployment/install_on_pi.sh" -ForegroundColor White
Write-Host ""
