const path = require('path');
const fs = require('fs');
const { MAX_URL_LENGTH, getClientIp, sanitizeForLog } = require('./security');

const LOGS_TOKEN = process.env.LOGS_TOKEN || '';
const LOGS_FLUSH_INTERVAL_MS = 1000;
const LOGS_BATCH_SIZE = 50;
const MAX_RECENT_REQUESTS = 400;

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function loadLogsPageTemplate(logsPageTemplatePath) {
    try {
        return fs.readFileSync(logsPageTemplatePath, 'utf8');
    } catch (err) {
        console.warn(`Failed to read logs page template at ${logsPageTemplatePath}: ${err.message}`);
        return '<!doctype html><html><body><main><h1>History Around Request Logs</h1><p>Template missing.</p><div>{{ROWS}}</div></main></body></html>';
    }
}

function getLogFileCreatedDate(requestLogFilePath) {
    try {
        const stats = fs.statSync(requestLogFilePath);
        return stats.birthtime.toISOString();
    } catch (_err) {
        return 'Not available yet (log file will be created after first flush).';
    }
}

function renderLogsPageTemplate(template, values) {
    return template
        .replace('{{LIMIT}}', String(values.limit))
        .replace('{{LOG_FILE_PATH}}', values.logFilePath)
        .replace('{{AUTH_NOTE}}', values.authNote)
        .replace('{{ROWS}}', values.rows)
        .replace('{{DATE_CREATED}}', values.dateCreated)
        .replace('{{LAST_UPDATED}}', values.lastUpdated);
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

function setupRequestLogs(app, options = {}) {
    const baseDir = options.baseDir || __dirname;
    const logsPath = path.join(baseDir, 'logs');
    const requestLogFilePath = path.join(logsPath, 'requests.log');
    const logsPageTemplatePath = path.join(baseDir, 'templates', 'logs-page.html');

    const requestLogQueue = [];
    const recentRequests = [];
    let isFlushingLogs = false;

    fs.mkdirSync(logsPath, { recursive: true });

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

    setInterval(() => {
        flushRequestLogs().catch((err) => {
            console.error('Failed to flush request logs:', err);
        });
    }, LOGS_FLUSH_INTERVAL_MS).unref();

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

            let outcomeClass = 'line--allowed';
            if ([400, 403, 405, 414, 429].includes(entry.status)) {
                outcomeClass = 'line--blocked';
            } else if (entry.status >= 500) {
                outcomeClass = 'line--server-error';
            }

            return `<div class="${outcomeClass}">${escapeHtml(line)}</div>`;
        }).join('');

        const authNote = LOGS_TOKEN
            ? '<p>Token protection is enabled. Supply ?token=... or x-logs-token.</p>'
            : '<p>Token protection is disabled (set LOGS_TOKEN to enable).</p>';

        const template = loadLogsPageTemplate(logsPageTemplatePath);
        const pageHtml = renderLogsPageTemplate(template, {
            limit,
            logFilePath: escapeHtml(requestLogFilePath),
            authNote,
            rows: rows || '<div>No requests logged yet.</div>',
            dateCreated: escapeHtml(getLogFileCreatedDate(requestLogFilePath)),
            lastUpdated: new Date().toISOString(),
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(pageHtml);
    });

    return {
        flushRequestLogs,
    };
}

module.exports = {
    setupRequestLogs,
};
