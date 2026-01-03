$EC2_HOST = "ec2-54-76-118-84.eu-west-1.compute.amazonaws.com"
$EC2_USER = "ubuntu"
$KEY_FILE = "adimari-key-pair.pem"
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

Write-Host "Starting upload of Unity Build files AND server.js to EC2..." -ForegroundColor Cyan

# Construct SCP command for Build files
# -i: Identity file
# -r: Recursive (though we are using wildcard)
# -o StrictHostKeyChecking=no: Avoid prompt for host key
$scpCommand = "scp -i `"$KEY_FILE`" -r $LOCAL_PATH ${EC2_USER}@${EC2_HOST}:${REMOTE_PATH}"

# Construct SCP command for server.js
$SERVER_JS_LOCAL = "Back-End\server.js"
$SERVER_JS_REMOTE = "/home/ubuntu/history-around/Back-End/"
$scpServerCommand = "scp -i `"$KEY_FILE`" $SERVER_JS_LOCAL ${EC2_USER}@${EC2_HOST}:${SERVER_JS_REMOTE}"

# Construct SCP command for unity-game.html
$UNITY_HTML_REMOTE = "/home/ubuntu/history-around/Back-End/public/"
$scpHtmlCommand = "scp -i `"$KEY_FILE`" $UNITY_HTML_DEST ${EC2_USER}@${EC2_HOST}:${UNITY_HTML_REMOTE}"

Write-Host "Uploading from: $LOCAL_PATH"
Write-Host "Uploading to:   $REMOTE_PATH"
Write-Host "This might take a while depending on your upload speed..."

# Execute SCP for Build files
Invoke-Expression $scpCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: Build upload failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

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
