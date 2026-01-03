# Unity Files for EC2 Deployment

The large Unity WebGL files are not included in this repository due to GitHub's 100MB file size limit. We are using Brotli-compressed files (`.br`) for better performance.

## Required Files (Missing from Git)

You need to upload these files to `Back-End/public/Build/` on your EC2 server:

- `Web.data.br` - Compressed Unity game data
- `Web.wasm.br` - Compressed Unity WebAssembly binary
- `Web.framework.js.br` - Compressed Unity framework

## How to Upload Unity Files to EC2

### Option 1: Automated PowerShell Script (Recommended)

We have created a script that automatically uploads all files from your local `Back-End/public/Build/` folder to the server.

1. Ensure your key file (`adimari-key-pair.pem`) is in the project root.
2. Run the script from PowerShell:
   ```powershell
   .\upload-unity-files.ps1
   ```

### Option 2: Manual SCP Upload

If you prefer to upload files manually:

```bash
# From your local machine where you have the Unity build
scp -i "adimari-key-pair.pem" Back-End/public/Build/Web.data.br ubuntu@ec2-54-76-118-84.eu-west-1.compute.amazonaws.com:/home/ubuntu/history-around/Back-End/public/Build/
scp -i "adimari-key-pair.pem" Back-End/public/Build/Web.wasm.br ubuntu@ec2-54-76-118-84.eu-west-1.compute.amazonaws.com:/home/ubuntu/history-around/Back-End/public/Build/
scp -i "adimari-key-pair.pem" Back-End/public/Build/Web.framework.js.br ubuntu@ec2-54-76-118-84.eu-west-1.compute.amazonaws.com:/home/ubuntu/history-around/Back-End/public/Build/
```

## Verify Unity Files

After uploading, verify the files exist and the server recognizes them:

```bash
# Check Unity status
curl http://ec2-54-76-118-84.eu-west-1.compute.amazonaws.com:5000/api/unity-status
```

Should return `allFilesExist: true`.

## File Structure

Your `Back-End/public/Build/` folder on the server should contain:
```
Build/
├── Web.data.br         ← Upload this
├── Web.framework.js.br ← Upload this
├── Web.loader.js       ← Already in git
└── Web.wasm.br         ← Upload this
```