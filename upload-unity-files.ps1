$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

$EC2_HOST = "ec2-54-76-118-84.eu-west-1.compute.amazonaws.com"
$EC2_USER = "ubuntu"
$KEY_FILE = Join-Path $SCRIPT_DIR "adimari-key-pair.pem"
$REMOTE_PATH = "/home/ubuntu/history-around/Back-End/public/Build/"
$LOCAL_PATH = "Back-End\public\Build\*"
$FRONTEND_SOURCE = "Front-End\history-around-web\public\Build\*"
$BACKEND_DEST = "Back-End\public\Build"
$UNITY_HTML_SOURCE = "Front-End\history-around-web\public\unity-game.html"
$UNITY_HTML_DEST = "Back-End\public\unity-game.html"

# Check if key file exists
if (-not (Test-Path $KEY_FILE)) {
    Write-Error "ERROR: Key file '$KEY_FILE' not found in current directory!"
    exit 1
}

# ---------------------------------------------------------
# Build Front-End and copy React build into Back-End/public
# ---------------------------------------------------------
$frontendPath = "Front-End/history-around-web"
$backendPath = "Back-End"

Write-Host "Installing front-end dependencies..." -ForegroundColor Cyan
Push-Location $frontendPath
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: Front-end npm install failed with exit code $LASTEXITCODE"
    Pop-Location
    exit $LASTEXITCODE
}

Write-Host "Building front-end (npm run build)..." -ForegroundColor Cyan
$env:VITE_BUILD_TIME = (Get-Date -Format "yyyy-MM-dd HH:mm:ss K")
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: Front-end build failed with exit code $LASTEXITCODE"
    Pop-Location
    exit $LASTEXITCODE
}
Pop-Location

Write-Host "Copying React build into Back-End/public..." -ForegroundColor Cyan
Push-Location $backendPath
npm run copy-build
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: copy-build failed with exit code $LASTEXITCODE"
    Pop-Location
    exit $LASTEXITCODE
}
Pop-Location

# ---------------------------------------------------------
# Copy Build Files Locally
# ---------------------------------------------------------
Write-Host "Copying Unity Build files from Front-End to Back-End..." -ForegroundColor Cyan

if (-not (Test-Path $BACKEND_DEST)) {
    New-Item -ItemType Directory -Force -Path $BACKEND_DEST | Out-Null
}

Copy-Item -Path $FRONTEND_SOURCE -Destination $BACKEND_DEST -Recurse -Force
Copy-Item -Path $UNITY_HTML_SOURCE -Destination $UNITY_HTML_DEST -Force
Write-Host "SUCCESS: Files copied locally." -ForegroundColor Green

# ---------------------------------------------------------
# Git Sync (Local)
# ---------------------------------------------------------
Write-Host "Syncing with GitHub (Local)..." -ForegroundColor Cyan
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-deploy: $timestamp"
git push
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Git push failed or nothing to push. Continuing..."
} else {
    Write-Host "SUCCESS: Pushed to GitHub." -ForegroundColor Green
}

# ---------------------------------------------------------
# Git Sync (Remote)
# ---------------------------------------------------------
Write-Host "Syncing with GitHub (Remote)..." -ForegroundColor Cyan
$gitPullCommand = "cd /home/ubuntu/history-around && git pull"
$sshGitCommand = "ssh -i `"$KEY_FILE`" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} `"$gitPullCommand`""
Invoke-Expression $sshGitCommand

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Remote git pull failed. Continuing with manual upload..."
} else {
    Write-Host "SUCCESS: Remote repo updated." -ForegroundColor Green
}

Write-Host "Checking remote Build hashes to avoid redundant uploads..." -ForegroundColor Cyan

# Compute local hashes
$localHashes = @{}
Get-ChildItem -Path $BACKEND_DEST -File | ForEach-Object {
    $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
    $localHashes[$_.Name] = $hash
}

# Fetch remote hashes
$remoteHashCommand = @'
cd /home/ubuntu/history-around/Back-End/public/Build && for f in *; do if [ -f "$f" ]; then sha256sum "$f"; fi; done
'@
$remoteHashOutput = & ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "$remoteHashCommand"
$remoteHashes = @{}
if ($LASTEXITCODE -eq 0 -and $remoteHashOutput) {
    $remoteHashOutput -split "`n" | ForEach-Object {
        $parts = $_ -split "\s+",2
        if ($parts.Length -eq 2) {
            $hash = $parts[0].Trim()
            $name = $parts[1].Trim()
            if ($name) { $remoteHashes[$name] = $hash }
        }
    }
} else {
    Write-Warning "Could not retrieve remote hashes (exit $LASTEXITCODE). Will upload all build files."
}

# Determine which files need upload
$filesToUpload = $localHashes.Keys | Where-Object { -not $remoteHashes.ContainsKey($_) -or $remoteHashes[$_] -ne $localHashes[$_] }

if ($filesToUpload.Count -eq 0) {
    Write-Host "No build file changes detected. Skipping Build upload." -ForegroundColor Green
} else {
    Write-Host "Uploading changed build files..." -ForegroundColor Cyan
    foreach ($file in $filesToUpload) {
        $localFilePath = Join-Path $BACKEND_DEST $file
        $scpFileCommand = "scp -i `"$KEY_FILE`" `"$localFilePath`" ${EC2_USER}@${EC2_HOST}:${REMOTE_PATH}"
        Write-Host " - $file"
        Invoke-Expression $scpFileCommand
        if ($LASTEXITCODE -ne 0) {
            Write-Error "ERROR: Upload failed for $file with exit code $LASTEXITCODE"
            exit $LASTEXITCODE
        }
    }
}

# Construct SCP command for server.js
$SERVER_JS_LOCAL = "Back-End\server.js"
$SERVER_JS_REMOTE = "/home/ubuntu/history-around/Back-End/"
$scpServerCommand = "scp -i `"$KEY_FILE`" $SERVER_JS_LOCAL ${EC2_USER}@${EC2_HOST}:${SERVER_JS_REMOTE}"

# Construct SCP command for unity-game.html
$UNITY_HTML_REMOTE = "/home/ubuntu/history-around/Back-End/public/"
$scpHtmlCommand = "scp -i `"$KEY_FILE`" $UNITY_HTML_DEST ${EC2_USER}@${EC2_HOST}:${UNITY_HTML_REMOTE}"

Write-Host "Uploading server.js..."
Invoke-Expression $scpServerCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: server.js upload failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Uploading unity-game.html..."
Invoke-Expression $scpHtmlCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: unity-game.html upload failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "SUCCESS: Upload completed successfully!" -ForegroundColor Green

# ---------------------------------------------------------
# Restart Server on EC2
# ---------------------------------------------------------
Write-Host "Connecting to EC2 to restart the server..." -ForegroundColor Cyan

# We use 'npx --yes pm2' to ensure we can run pm2 even if not in PATH or not installed globally.
# 'pm2 restart' stops and starts the process.
# If the process doesn't exist, we try to start it fresh.
$remoteCommand = "npx --yes pm2 restart history-around || (cd /home/ubuntu/history-around/Back-End && npx --yes pm2 start server.js --name history-around)"

$sshCommand = "ssh -i `"$KEY_FILE`" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} `"$remoteCommand`""

Invoke-Expression $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Server restarted successfully!" -ForegroundColor Green
} else {
    Write-Error "ERROR: Failed to restart server. Exit code: $LASTEXITCODE"
}
