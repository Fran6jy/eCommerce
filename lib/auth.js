// JWT-based admin authentication
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const isProd = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

// Credentials come from env. In local dev we allow safe defaults so the
// panel is testable immediately; in production they MUST be set.
function config() {
    return {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || (isProd ? null : 'blackrose'),
        secret: process.env.JWT_SECRET || (isProd ? null : 'dev-secret-change-me'),
    };
}

export function isConfigured() {
    const c = config();
    return Boolean(c.password && c.secret);
}

function safeEqual(a, b) {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}

export function login(username, password) {
    const c = config();
    if (!c.password || !c.secret) {
        const err = new Error('Admin is not configured on the server');
        err.code = 'NOT_CONFIGURED';
        throw err;
    }
    const ok = safeEqual(username || '', c.username) && safeEqual(password || '', c.password);
    if (!ok) return null;
    return jwt.sign({ sub: c.username, role: 'admin' }, c.secret, { expiresIn: '8h' });
}

export function authMiddleware(req, res, next) {
    const c = config();
    if (!c.secret) {
        return res.status(503).json({ error: 'Admin is not configured on the server' });
    }
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
        req.admin = jwt.verify(token, c.secret);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }
}
