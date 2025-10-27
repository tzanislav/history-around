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