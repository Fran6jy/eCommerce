// The Black Rose Signature - Express Server
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import * as store from './lib/store.js';
import { login, authMiddleware, isConfigured } from './lib/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/data', express.static('data'));

// Ensure the storage layer (MongoDB when configured) is ready before any
// request is handled. init() is cached, so this is cheap after the first call.
app.use(async (req, res, next) => {
    try {
        await store.init();
        next();
    } catch (err) {
        console.error('Storage init failed:', err.message);
        res.status(503).json({ error: 'Storage unavailable' });
    }
});

const asyncRoute = (fn) => (req, res) => fn(req, res).catch((err) => {
    console.error(err);
    const status = err.code === 'VALIDATION' ? 400 : err.code === 'NOT_CONFIGURED' ? 503 : 500;
    res.status(status).json({ error: err.message || 'Server error' });
});

/* ============================ PUBLIC API ============================ */

// All products + collections
app.get('/api/products', asyncRoute(async (req, res) => {
    const [products, collections] = [await store.listProducts(), store.getCollections()];
    res.json({ products, collections });
}));

// Featured / new / search / category MUST be declared before "/:id"
app.get('/api/products/featured', asyncRoute(async (req, res) => {
    const products = await store.listProducts();
    res.json(products.filter((p) => p.featured));
}));

app.get('/api/products/new', asyncRoute(async (req, res) => {
    const products = await store.listProducts();
    res.json(products.filter((p) => p.new));
}));

app.get('/api/products/search', asyncRoute(async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const products = await store.listProducts();
    res.json(products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ));
}));

app.get('/api/products/category/:category', asyncRoute(async (req, res) => {
    const products = await store.listProducts();
    res.json(products.filter((p) => p.category === req.params.category));
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
    const product = await store.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
}));

// Checkout (demo). Decrements inventory for purchased items.
app.post('/api/checkout', asyncRoute(async (req, res) => {
    const { items = [] } = req.body || {};
    await store.decrementStock(items);
    res.json({
        success: true,
        message: 'Checkout session created (demo mode)',
        orderId: `order_${Date.now()}`,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    });
}));

app.post('/api/newsletter', (req, res) => {
    const { name, email } = req.body || {};
    console.log(`New subscriber: ${name} <${email}>`);
    res.json({ success: true, message: 'Welcome to the Chapter. Signed in Strength.' });
});

app.post('/api/contact', (req, res) => {
    const { name, email } = req.body || {};
    console.log(`Contact form submission from ${name} <${email}>`);
    res.json({ success: true, message: 'Your message has been received. We will respond shortly.' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', storage: store.storageMode, adminConfigured: isConfigured(), timestamp: new Date().toISOString() });
});

/* ============================ ADMIN API ============================ */

// Login -> JWT
app.post('/admin/login', asyncRoute(async (req, res) => {
    const { username, password } = req.body || {};
    const token = login(username, password);
    if (!token) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token, expiresIn: '8h' });
}));

// Full product list (with stock) for the admin table
app.get('/admin/products', authMiddleware, asyncRoute(async (req, res) => {
    res.json({ products: await store.listProducts(), storage: store.storageMode, lowStockThreshold: store.LOW_STOCK_THRESHOLD });
}));

// Create
app.post('/admin/product', authMiddleware, asyncRoute(async (req, res) => {
    const product = await store.createProduct(req.body || {});
    res.status(201).json(product);
}));

// Update
app.put('/admin/product/:id', authMiddleware, asyncRoute(async (req, res) => {
    const product = await store.updateProduct(req.params.id, req.body || {});
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
}));

// Delete
app.delete('/admin/product/:id', authMiddleware, asyncRoute(async (req, res) => {
    const ok = await store.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
}));

// Update stock
app.patch('/admin/product/:id/stock', authMiddleware, asyncRoute(async (req, res) => {
    const product = await store.setStock(req.params.id, req.body?.stock);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
}));

/* ============================ PAGES ============================ */

// Admin panel page
app.get('/admin', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'admin.html'));
});

// Serve index.html for all other routes (SPA support)
app.get('/{*path}', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server (only when run directly, e.g. locally — not on Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🌹 THE BLACK ROSE SIGNATURE                     ║
║                                                   ║
║   Server running on http://localhost:${PORT}        ║
║   Admin panel:  http://localhost:${PORT}/admin      ║
║   Storage mode: ${store.storageMode.padEnd(34)}║
║                                                   ║
╚═══════════════════════════════════════════════════╝
        `);
    });
}

// Export the Express app as the handler for Vercel's serverless runtime
export default app;
