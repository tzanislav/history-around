const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
    applySecurityMiddleware,
    getClientIp,
    isSensitiveProbePath,
    startSecurityMaintenance,
} = require('./security');
const { setupRequestLogs } = require('./request-logs');

const app = express();
const PORT = process.env.PORT || 5000;

// Check if public directory exists
const publicPath = path.join(__dirname, 'public');

startSecurityMaintenance();

// Middleware
app.disable('x-powered-by');
app.use(cors());

// Parse body only for API routes to keep static path overhead low under traffic.
app.use('/api', express.json({ limit: '64kb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '64kb' }));
applySecurityMiddleware(app);
const requestLogs = setupRequestLogs(app, { baseDir: __dirname });

// Serve static files from the React app build (if it exists)
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath, {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.wasm')) {
                res.setHeader('Content-Type', 'application/wasm');
            } else if (filePath.endsWith('.data')) {
                res.setHeader('Content-Type', 'application/octet-stream');
            } else if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            }
        }
    }));
    console.log('Serving React app from public/ directory');
} else {
    console.log(' React build not found. Run "npm run build" to build the React app.');
}



// Handle React routing - serve React app for all non-API routes
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }

    // Do not serve index.html for asset/file requests.
    // This avoids returning HTML for missing JS/WASM paths (e.g., Unity loader files).
    const hasFileExtension = path.extname(req.path) !== '';
    if (hasFileExtension || req.path.startsWith('/Build/') || isSensitiveProbePath(req.path)) {
        return res.status(404).json({
            error: 'Asset not found',
            path: req.path,
        });
    }

    // Only serve SPA shell for navigation requests expecting HTML.
    if (!req.accepts('html')) {
        return next();
    }
    
    // Check if React build exists
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // React build not found - provide helpful message
        res.status(404).json({
            error: 'React app not built',
            message: 'Please run "npm run build" to build the React application',
            instructions: [
                '1. Navigate to the project root directory',
                '2. Run: npm run build (in Back-End folder)',
                '3. This will build React and copy files to public/',
                '4. Restart the server'
            ]
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    const ip = getClientIp(req);
    const message = err?.message || 'Unknown error';
    const isExpectedClientError =
        err?.status === 400 ||
        err?.status === 404 ||
        err?.status === 414 ||
        err?.status === 429 ||
        message.includes('Malformed URL');

    if (isExpectedClientError) {
        console.warn(`[${new Date().toISOString()}] ${ip} ${req.method} ${req.originalUrl} -> ${message}`);
    } else {
        console.error(err.stack || err);
    }

    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack 
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 History Around server is running on port ${PORT}`);
    console.log(`📱 React app: http://localhost:${PORT}`);
    console.log(`🔧 API health: http://localhost:${PORT}/api/health`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        requestLogs.flushRequestLogs().finally(() => {
            process.exit(0);
        });
    });
}

// Conservative timeouts help under slowloris/crawler abuse patterns.
server.requestTimeout = 15_000;
server.headersTimeout = 20_000;
server.keepAliveTimeout = 5_000;
server.maxRequestsPerSocket = 100;

module.exports = app;