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
$RemoteUnityBuildPath = "/home/ubuntu/history-around/Back-End/public/Build"

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
            if ($item.Name -ceq $canonicalName) {
                continue
            }

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
if ($LASTEXITCODE -ne 0) {
    throw "git add failed with exit code $LASTEXITCODE"
}

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No local changes to commit." -ForegroundColor Yellow
} else {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-deploy: $timestamp"
    if ($LASTEXITCODE -ne 0) {
        throw "git commit failed with exit code $LASTEXITCODE"
    }
}

git push
if ($LASTEXITCODE -ne 0) {
    throw "git push failed with exit code $LASTEXITCODE"
}

Write-Host "Syncing with GitHub (Remote) and ignoring remote local changes..." -ForegroundColor Cyan
$remoteForceSyncCommand = "cd $RemoteRepoPath && git fetch origin main && git reset --hard origin/main && git clean -fd"
& ssh -i "$KeyFile" -o StrictHostKeyChecking=no ${Ec2User}@${Ec2Host} "$remoteForceSyncCommand"
if ($LASTEXITCODE -ne 0) {
    throw "Remote git force sync failed with exit code $LASTEXITCODE"
}
Write-Host "SUCCESS: Remote repo forced to latest origin/main." -ForegroundColor Green

Write-Host "Uploading changed Unity Build files only..." -ForegroundColor Cyan

$localHashes = @{}
if (Test-Path $UnityBuildDest) {
    Get-ChildItem -Path $UnityBuildDest -File | ForEach-Object {
        $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash.ToLower()
        $localHashes[$_.Name] = $hash
    }
}

$remoteHashCommand = "mkdir -p $RemoteUnityBuildPath; cd $RemoteUnityBuildPath; for f in *; do if [ -f \"`$f\" ]; then sha256sum \"`$f\"; fi; done"

$remoteHashOutput = & ssh -i "$KeyFile" -o StrictHostKeyChecking=no ${Ec2User}@${Ec2Host} "$remoteHashCommand"

$remoteHashes = @{}
if ($LASTEXITCODE -eq 0 -and $remoteHashOutput) {
    $remoteHashOutput -split "`n" | ForEach-Object {
        $line = $_.Trim()
        if (-not $line) {
            return
        }

        $parts = $line -split "\s+", 2
        if ($parts.Length -eq 2) {
            $remoteHashes[$parts[1].Trim()] = $parts[0].Trim().ToLower()
        }
    }
} elseif ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to read remote Unity hashes (exit code $LASTEXITCODE). Uploading all Unity build files."
}

$filesToUpload = @()
if ($LASTEXITCODE -ne 0) {
    $filesToUpload = $localHashes.Keys
} else {
    $filesToUpload = $localHashes.Keys | Where-Object {
        (-not $remoteHashes.ContainsKey($_)) -or ($remoteHashes[$_] -ne $localHashes[$_])
    }
}

if ($filesToUpload.Count -eq 0) {
    Write-Host "No Unity Build file changes detected. Skipping Unity upload." -ForegroundColor Green
} else {
    foreach ($file in $filesToUpload) {
        $localFilePath = Join-Path $UnityBuildDest $file
        $scpFileCommand = "scp -i `"$KeyFile`" `"$localFilePath`" ${Ec2User}@${Ec2Host}:${RemoteUnityBuildPath}/"
        Write-Host "Uploading: $file"
        Invoke-Expression $scpFileCommand
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to upload Unity file '$file' (exit code $LASTEXITCODE)"
        }
    }
    Write-Host "SUCCESS: Changed Unity Build files uploaded." -ForegroundColor Green
}

Write-Host "Restarting server on EC2..." -ForegroundColor Cyan
$remoteRestartCommand = "npx --yes pm2 restart history-around || (cd $RemoteBackendPath && npx --yes pm2 start server.js --name history-around)"
& ssh -i "$KeyFile" -o StrictHostKeyChecking=no ${Ec2User}@${Ec2Host} "$remoteRestartCommand"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Deployment complete and server restarted." -ForegroundColor Green
} else {
    throw "Failed to restart server on EC2 (exit code $LASTEXITCODE)"
}
