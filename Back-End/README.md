# History Around - Backend Server

This Express.js server serves the React History Around application and provides API endpoints.

## 🚀 Quick Start

### Development
```bash
npm run dev    # Start with nodemon (auto-restart on changes)
```

### Production
```bash
npm start      # Start the server
```

### Build & Deploy
```bash
npm run build  # Build React app and copy to public folder
```

## 📁 Project Structure

```
Back-End/
├── server.js          # Main Express server
├── package.json       # Dependencies and scripts
├── public/            # Built React app files
│   ├── index.html     # React app entry point
│   ├── assets/        # CSS and JS bundles
│   ├── Build/         # Unity WebGL files
│   └── unity-game.html # Unity game loader
└── README.md          # This file
```

## 🔧 API Endpoints

- `GET /api/health` - Server health check
- `GET /api/history` - Historical data endpoint (placeholder)
- `GET /*` - Serves React app (SPA routing)

## 🌐 URLs

- **React App**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health
- **Unity Game**: http://localhost:5000/unity-game.html

## 📦 Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **path**: File path utilities
- **nodemon**: Development auto-restart (dev dependency)

## 🔄 Deployment Workflow

1. **Develop React app** in `Front-End/history-around-web/`
2. **Build React app**: `npm run build` (in Back-End)
3. **Start server**: `npm start`
4. **Access app**: http://localhost:5000

## 🎮 Unity Integration

The server automatically serves:
- Unity WebGL build files from `/Build/`
- Unity game loader at `/unity-game.html`
- React app with Unity iframe integration

## 🛠️ Adding API Routes

Add new routes in `server.js`:

```javascript
app.get('/api/your-endpoint', (req, res) => {
    res.json({ message: 'Your data here' });
});
```

All API routes should start with `/api/` to avoid conflicts with React routing.

## 🌐 EC2 Server Deployment

### Quick Deploy (Recommended)
```bash
# From project root directory
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment Steps
```bash
# 1. Install dependencies and build
cd Back-End
npm run deploy

# 2. Upload Unity files (if missing)
# Copy Web.data and Web.wasm to Back-End/public/Build/

# 3. Start server
npm start
```

### Unity Files Note
Due to GitHub's 100MB file size limit, the large Unity files (`Web.data` and `Web.wasm`) are not included in the repository. You need to upload them manually:

```bash
# On your EC2 server, copy your Unity build files:
scp Web.data your-server:/path/to/project/Back-End/public/Build/
scp Web.wasm your-server:/path/to/project/Back-End/public/Build/

# Or rebuild Unity and copy locally:
# 1. Build Unity project for WebGL
# 2. Copy Web.data and Web.wasm to Back-End/public/Build/
```

### Production with PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start with PM2
pm2 start server.js --name history-around

# Auto-start on boot
pm2 startup
pm2 save
```

## 🐛 Troubleshooting EC2 Issues

### "ENOENT: no such file or directory" Error
This means React build files are missing. Run:
```bash
npm run deploy
```

### Check Server Status
Visit: `http://your-server-ip:5000/api/health`