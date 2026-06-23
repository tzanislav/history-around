const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 240;
const MAX_URL_LENGTH = 2048;
const requestCounters = new Map();
const SENSITIVE_PATH_PATTERNS = [
    /^\/\.git(?:\/|$)/i,
    /^\/\.env(?:$|\.)/i,
    /^\/\.svn(?:\/|$)/i,
    /^\/\.hg(?:\/|$)/i,
    /^\/wp-admin(?:\/|$)/i,
    /^\/wp-login\.php$/i,
    /^\/xmlrpc\.php$/i,
];

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

function isSensitiveProbePath(requestPath) {
    if (typeof requestPath !== 'string') {
        return false;
    }

    const normalized = requestPath.toLowerCase();
    if (SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(normalized))) {
        return true;
    }

    // Hidden path segments (e.g. /.git/HEAD) should never resolve to SPA shell.
    return normalized.split('/').some((segment) => segment.startsWith('.') && segment.length > 1);
}

function applySecurityMiddleware(app) {
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
}

function startSecurityMaintenance() {
    setInterval(cleanRateLimiterMap, RATE_LIMIT_WINDOW_MS).unref();
}

module.exports = {
    MAX_URL_LENGTH,
    applySecurityMiddleware,
    getClientIp,
    isSensitiveProbePath,
    sanitizeForLog,
    startSecurityMaintenance,
};
