const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 240;
const MAX_URL_LENGTH = 2048;
const requestCounters = new Map();
const LOGS_TOKEN = process.env.LOGS_TOKEN || '';
const LOGS_FLUSH_INTERVAL_MS = 1000;
const LOGS_BATCH_SIZE = 50;
const MAX_RECENT_REQUESTS = 400;

// Check if public directory exists
const publicPath = path.join(__dirname, 'public');
const logsPath = path.join(__dirname, 'logs');
const requestLogFilePath = path.join(logsPath, 'requests.log');
const requestLogQueue = [];
const recentRequests = [];
let isFlushingLogs = false;

fs.mkdirSync(logsPath, { recursive: true });

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
}

function cleanRateLimiterMap() {
    const now = Date.now();

    for (const [ip, entry] of requestCounters.entries()) {
        if (entry.resetAt <= now) {
            requestCounters.delete(ip);
        }
    }
}

function sanitizeForLog(value) {
    return String(value || '')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function queueRequestLog(entry) {
    const line = [
        entry.timestamp,
        entry.ip,
        entry.method,
        entry.path,
        entry.status,
        `${entry.durationMs.toFixed(1)}ms`,
        `ua="${entry.userAgent}"`,
    ].join(' | ') + '\n';

    requestLogQueue.push(line);
    recentRequests.push(entry);
    if (recentRequests.length > MAX_RECENT_REQUESTS) {
        recentRequests.shift();
    }

    if (requestLogQueue.length >= LOGS_BATCH_SIZE) {
        flushRequestLogs().catch((err) => {
            console.error('Failed to flush request logs:', err);
        });
    }
}

async function flushRequestLogs() {
    if (isFlushingLogs || requestLogQueue.length === 0) {
        return;
    }

    isFlushingLogs = true;
    const batch = requestLogQueue.splice(0, requestLogQueue.length).join('');

    try {
        await fs.promises.appendFile(requestLogFilePath, batch, 'utf8');
    } finally {
        isFlushingLogs = false;
        if (requestLogQueue.length > 0) {
            setImmediate(() => {
                flushRequestLogs().catch((err) => {
                    console.error('Failed to flush request logs:', err);
                });
            });
        }
    }
}

function isLogsAuthorized(req) {
    if (!LOGS_TOKEN) {
        return true;
    }

    const queryToken = typeof req.query?.token === 'string' ? req.query.token : '';
    const headerToken = typeof req.headers['x-logs-token'] === 'string' ? req.headers['x-logs-token'] : '';
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '';

    return queryToken === LOGS_TOKEN || headerToken === LOGS_TOKEN || authHeader === LOGS_TOKEN;
}

setInterval(cleanRateLimiterMap, RATE_LIMIT_WINDOW_MS).unref();
setInterval(() => {
    flushRequestLogs().catch((err) => {
        console.error('Failed to flush request logs:', err);
    });
}, LOGS_FLUSH_INTERVAL_MS).unref();

// Middleware
app.disable('x-powered-by');
app.use(cors());

// Parse body only for API routes to keep static path overhead low under traffic.
app.use('/api', express.json({ limit: '64kb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '64kb' }));

// Fast request guard for malformed/abusive traffic.
app.use((req, res, next) => {
    if (req.originalUrl.length > MAX_URL_LENGTH) {
        return res.status(414).json({
            error: 'URL too long',
        });
    }

    try {
        decodeURIComponent(req.path);
    } catch (_err) {
        return res.status(400).json({
            error: 'Malformed URL',
        });
    }

    // Non-API routes are static/SPA only.
    if (!req.path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return res.status(405).json({
            error: 'Method not allowed',
        });
    }

    next();
});

// Lightweight in-memory rate limiter by IP.
app.use((req, res, next) => {
    // Keep health checks and localhost free from rate limiting noise.
    if (req.path === '/api/health' || req.ip === '127.0.0.1' || req.ip === '::1') {
        return next();
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const current = requestCounters.get(ip);

    if (!current || current.resetAt <= now) {
        requestCounters.set(ip, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        return next();
    }

    current.count += 1;

    if (current.count > RATE_LIMIT_MAX_REQUESTS) {
        const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds.toString());

        return res.status(429).json({
            error: 'Too many requests',
            retryAfterSeconds,
        });
    }

    next();
});

// Buffered request logger: keeps recent records in memory and flushes batched lines to disk.
app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const ip = sanitizeForLog(getClientIp(req));
    const method = sanitizeForLog(req.method);
    const routePath = sanitizeForLog(req.originalUrl).slice(0, MAX_URL_LENGTH);
    const userAgent = sanitizeForLog(req.headers['user-agent'] || '-').slice(0, 300);

    res.on('finish', () => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        queueRequestLog({
            timestamp: new Date().toISOString(),
            ip,
            method,
            path: routePath,
            status: res.statusCode,
            durationMs: elapsedMs,
            userAgent,
        });
    });

    next();
});

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
    console.log('✅ Serving React app from public/ directory');
} else {
    console.log('⚠️  React build not found. Run "npm run build" to build the React app.');
}

// API Routes (you can add your API endpoints here)
app.get('/api/health', (req, res) => {
    const publicExists = fs.existsSync(publicPath);
    const unityBuildPath = path.join(publicPath, 'Build');
    const unityBuildExists = fs.existsSync(unityBuildPath);
    const unityFiles = unityBuildExists ? fs.readdirSync(unityBuildPath) : [];
    
    res.json({ 
        message: 'History Around API is running!', 
        timestamp: new Date().toISOString(),
        reactBuildExists: publicExists,
        unityBuildExists: unityBuildExists,
        unityFiles: unityFiles,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Debug endpoint to check Unity files
app.get('/api/unity-status', (req, res) => {
    const unityBuildPath = path.join(publicPath, 'Build');
    const requiredFiles = [
        'Web.loader.js',
        'Web.framework.js',
        'Web.data',
        'Web.wasm',
        'web.loader.js',
        'web.framework.js',
        'web.data',
        'web.wasm'
    ];
    const fileStatus = {};
    
    requiredFiles.forEach(file => {
        const filePath = path.join(unityBuildPath, file);
        fileStatus[file] = {
            exists: fs.existsSync(filePath),
            path: filePath,
            url: `/Build/${file}`
        };
    });
    
    res.json({
        message: 'Unity build file status',
        buildPath: unityBuildPath,
        files: fileStatus,
        hasUppercaseSet: ['Web.loader.js', 'Web.framework.js', 'Web.data', 'Web.wasm'].every(file => fileStatus[file].exists),
        hasLowercaseSet: ['web.loader.js', 'web.framework.js', 'web.data', 'web.wasm'].every(file => fileStatus[file].exists)
    });
});

// Example API route for future use
app.get('/api/history', (req, res) => {
    res.json({ 
        message: 'Historical data endpoint',
        data: [] 
    });
});

app.get('/logs', (req, res) => {
        if (!isLogsAuthorized(req)) {
                return res.status(403).send('Forbidden');
        }

        const requestedLimit = Number.parseInt(String(req.query.limit || '200'), 10);
        const limit = Number.isFinite(requestedLimit)
                ? Math.max(10, Math.min(500, requestedLimit))
                : 200;

        const latest = recentRequests.slice(-limit).reverse();
        const rows = latest.map((entry) => {
                const line = `${entry.timestamp} | ${entry.ip} | ${entry.method} | ${entry.path} | ${entry.status} | ${entry.durationMs.toFixed(1)}ms | ua=\"${entry.userAgent}\"`;
                return `<div>${escapeHtml(line)}</div>`;
        }).join('');

        const authNote = LOGS_TOKEN
                ? '<p>Token protection is enabled. Supply ?token=... or x-logs-token.</p>'
                : '<p>Token protection is disabled (set LOGS_TOKEN to enable).</p>';

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>History Around Request Logs</title>
        <style>
            body { background:#0f1720; color:#e8eef4; margin:0; font:14px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
            main { padding:16px; }
            h1 { margin:0 0 8px; font-size:18px; }
            p { margin:0 0 14px; color:#9fb3c3; }
            .meta { margin-bottom:12px; color:#9fb3c3; }
            .logs { background:#0b1118; border:1px solid #1e2c39; border-radius:8px; padding:10px; max-height:78vh; overflow:auto; }
            .logs div { padding:2px 0; border-bottom:1px dotted #1a2632; white-space:pre-wrap; word-break:break-word; }
            .logs div:last-child { border-bottom:none; }
        </style>
    </head>
    <body>
        <main>
            <h1>History Around Request Logs</h1>
            <p class="meta">Showing latest ${limit} requests from in-memory buffer. File path: ${escapeHtml(requestLogFilePath)}</p>
            ${authNote}
            <div class="logs">${rows || '<div>No requests logged yet.</div>'}</div>
        </main>
    </body>
</html>`);
});

// Handle React routing - serve React app for all non-API routes
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }

    // Do not serve index.html for asset/file requests.
    // This avoids returning HTML for missing JS/WASM paths (e.g., Unity loader files).
    const hasFileExtension = path.extname(req.path) !== '';
    if (hasFileExtension || req.path.startsWith('/Build/')) {
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
        flushRequestLogs().finally(() => {
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