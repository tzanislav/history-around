$EC2_HOST = "ec2-54-76-118-84.eu-west-1.compute.amazonaws.com"
$EC2_USER = "ubuntu"
$KEY_FILE = "adimari-key-pair.pem"
$REMOTE_PATH = "/home/ubuntu/history-around/Back-End/public/Build/"
$LOCAL_PATH = "Back-End\public\Build\*"

Write-Host "🚀 Starting upload of Unity Build files to EC2..." -ForegroundColor Cyan

# Check if key file exists
if (-not (Test-Path $KEY_FILE)) {
    Write-Error "❌ Key file '$KEY_FILE' not found in current directory!"
    exit 1
}

# Construct SCP command
# -i: Identity file
# -r: Recursive (though we are using wildcard)
# -o StrictHostKeyChecking=no: Avoid prompt for host key
$scpCommand = "scp -i `"$KEY_FILE`" -r $LOCAL_PATH ${EC2_USER}@${EC2_HOST}:${REMOTE_PATH}"

Write-Host "📂 Uploading from: $LOCAL_PATH"
Write-Host "📂 Uploading to:   $REMOTE_PATH"
Write-Host "⏳ This might take a while depending on your upload speed..."

# Execute SCP
Invoke-Expression $scpCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Upload completed successfully!" -ForegroundColor Green
} else {
    Write-Error "❌ Upload failed with exit code $LASTEXITCODE"
}
