$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$Ec2Host = "ec2-54-76-118-84.eu-west-1.compute.amazonaws.com"
$Ec2User = "ubuntu"
$KeyFile = Join-Path $ScriptDir "adimari-key-pair.pem"

$FrontendPath = "newFront-end"
$BackendPath = "Back-End"

$UnityBuildSource = Join-Path $FrontendPath "public\Build"
$UnityBuildDest = Join-Path $BackendPath "public\Build"
$UnityHtmlSource = Join-Path $FrontendPath "public\unity-game.html"
$UnityHtmlDest = Join-Path $BackendPath "public\unity-game.html"

$RemoteRepoPath = "/home/ubuntu/history-around"
$RemoteBackendPath = "/home/ubuntu/history-around/Back-End"
$RemotePublicParent = "/home/ubuntu/history-around/Back-End/"

function Invoke-Step {
    param(
        [string]$Message,
        [scriptblock]$Action
    )

    Write-Host $Message -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Message (exit code $LASTEXITCODE)"
    }
}

function Update-UnityBuildNames {
    param([string]$BuildDirectory)

    if (-not (Test-Path $BuildDirectory)) {
        Write-Warning "Unity build directory not found: $BuildDirectory"
        return
    }

    $canonicalMap = @{
        "web.loader.js"    = "Web.loader.js"
        "web.framework.js" = "Web.framework.js"
        "web.data"         = "Web.data"
        "web.wasm"         = "Web.wasm"
    }

    foreach ($sourceName in $canonicalMap.Keys) {
        $canonicalName = $canonicalMap[$sourceName]
        $sourcePath = Join-Path $BuildDirectory $sourceName

        if (Test-Path $sourcePath) {
            $item = Get-Item $sourcePath

            # Already normalized with the desired case.
            if ($item.Name -ceq $canonicalName) {
                continue
            }

            # On Windows, case-only "copy" hits self-copy errors. Use a two-step rename.
            $tempName = "$canonicalName.casefix"
            $tempPath = Join-Path $BuildDirectory $tempName

            if (Test-Path $tempPath) {
                Remove-Item -Path $tempPath -Force
            }

            Rename-Item -Path $sourcePath -NewName $tempName -Force
            Rename-Item -Path $tempPath -NewName $canonicalName -Force
        }
    }
}

if (-not (Test-Path $KeyFile)) {
    throw "Key file '$KeyFile' not found in project root."
}

Invoke-Step "Installing front-end dependencies..." {
    Push-Location $FrontendPath
    npm install
    Pop-Location
}

Invoke-Step "Building front-end (npm run build)..." {
    Push-Location $FrontendPath
    $env:VITE_BUILD_TIME = (Get-Date -Format "yyyy-MM-dd HH:mm:ss K")
    npm run build
    Pop-Location
}

Invoke-Step "Copying React build into Back-End/public..." {
    Push-Location $BackendPath
    npm run copy-build
    Pop-Location
}

Write-Host "Copying Unity files from newFront-end to Back-End..." -ForegroundColor Cyan
if (-not (Test-Path $UnityBuildDest)) {
    New-Item -ItemType Directory -Force -Path $UnityBuildDest | Out-Null
}

if (Test-Path (Join-Path $UnityBuildSource "*")) {
    Copy-Item -Path (Join-Path $UnityBuildSource "*") -Destination $UnityBuildDest -Recurse -Force
    Update-UnityBuildNames -BuildDirectory $UnityBuildDest
    Write-Host "SUCCESS: Unity Build files copied and normalized (Web.* naming)." -ForegroundColor Green
} else {
    Write-Warning "Unity Build files not found at '$UnityBuildSource'. Keeping existing Back-End/public/Build files."
}

if (Test-Path $UnityHtmlSource) {
    Copy-Item -Path $UnityHtmlSource -Destination $UnityHtmlDest -Force
    Write-Host "SUCCESS: unity-game.html copied." -ForegroundColor Green
} else {
    Write-Warning "unity-game.html not found at '$UnityHtmlSource'. Keeping existing Back-End/public/unity-game.html file."
}

Write-Host "Syncing with GitHub (Local)..." -ForegroundColor Cyan
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-deploy: $timestamp"
if ($LASTEXITCODE -ne 0) {
    Write-Warning "No commit created (likely no changes). Continuing..."
}

git push
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Local git push failed. Deployment will continue with manual upload fallback if needed."
}

Write-Host "Syncing with GitHub (Remote)..." -ForegroundColor Cyan
$remotePullCommand = "cd $RemoteRepoPath && git pull"
& ssh -i "$KeyFile" -o StrictHostKeyChecking=no ${Ec2User}@${Ec2Host} "$remotePullCommand"
$remotePullSucceeded = ($LASTEXITCODE -eq 0)

if (-not $remotePullSucceeded) {
    Write-Warning "Remote git pull failed. Forcing remote repo to match origin/main..."
    $remoteForceSyncCommand = "cd $RemoteRepoPath && git fetch origin main && git reset --hard origin/main && git clean -fd"
    & ssh -i "$KeyFile" -o StrictHostKeyChecking=no ${Ec2User}@${Ec2Host} "$remoteForceSyncCommand"
    $remotePullSucceeded = ($LASTEXITCODE -eq 0)
}

if ($remotePullSucceeded) {
    Write-Host "SUCCESS: Remote repo synced to latest main." -ForegroundColor Green
} else {
    Write-Warning "Remote git sync failed. Uploading Back-End/public and server.js directly..."

    $scpPublicCommand = "scp -i `"$KeyFile`" -r `"$BackendPath\public`" ${Ec2User}@${Ec2Host}:${RemotePublicParent}"
    Invoke-Expression $scpPublicCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload Back-End/public (exit code $LASTEXITCODE)"
    }

    $scpServerCommand = "scp -i `"$KeyFile`" `"$BackendPath\server.js`" ${Ec2User}@${Ec2Host}:${RemoteBackendPath}/"
    Invoke-Expression $scpServerCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload Back-End/server.js (exit code $LASTEXITCODE)"
    }

    Write-Host "SUCCESS: Fallback upload completed." -ForegroundColor Green
}

Write-Host "Restarting server on EC2..." -ForegroundColor Cyan
$remoteRestartCommand = "npx --yes pm2 restart history-around || (cd $RemoteBackendPath && npx --yes pm2 start server.js --name history-around)"
& ssh -i "$KeyFile" -o StrictHostKeyChecking=no ${Ec2User}@${Ec2Host} "$remoteRestartCommand"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Deployment complete and server restarted." -ForegroundColor Green
} else {
    throw "Failed to restart server on EC2 (exit code $LASTEXITCODE)"
}
