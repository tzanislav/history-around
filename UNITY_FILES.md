# Unity Files for EC2 Deployment

The large Unity WebGL files are not included in this repository due to GitHub's 100MB file size limit.

## Required Files (Missing)

You need to upload these files to `Back-End/public/Build/` on your EC2 server:

- `Web.data` (~160MB) - Unity game data
- `Web.wasm` (~110MB) - Unity WebAssembly binary

## How to Upload Unity Files to EC2

### Option 1: SCP Upload
```bash
# From your local machine where you have the Unity build
scp Web.data ubuntu@your-server-ip:/home/ubuntu/history-around/Back-End/public/Build/
scp Web.wasm ubuntu@your-server-ip:/home/ubuntu/history-around/Back-End/public/Build/
```

### Option 2: Direct Copy on Server
```bash
# If you have Unity files on your server already
cp /path/to/unity/build/Web.data /path/to/project/Back-End/public/Build/
cp /path/to/unity/build/Web.wasm /path/to/project/Back-End/public/Build/
```

### Option 3: Rebuild Unity
1. Open your Unity project
2. Build for WebGL platform
3. Copy `Web.data` and `Web.wasm` from Unity's build output
4. Upload to EC2 server

## Verify Unity Files

After uploading, verify the files exist:
```bash
# Check Unity status
curl http://your-server-ip:5000/api/unity-status

# Should show allFilesExist: true
```

## File Structure

Your `Back-End/public/Build/` folder should contain:
```
Build/
├── Web.data         ← Upload this (large file)
├── Web.framework.js ← Already in git
├── Web.loader.js    ← Already in git
└── Web.wasm         ← Upload this (large file)
```