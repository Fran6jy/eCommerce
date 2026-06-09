// Unified product storage. Uses MongoDB when MONGODB_URI is set (persists on
// Vercel); otherwise falls back to the local data/products.json file (great for
// local dev — note: file writes are NOT persistent on Vercel's read-only FS).
import fs from 'fs';
import { connectDB, Product } from './db.js';
import { readSeed, DATA_PATH } from './seedData.js';

const useMongo = Boolean(process.env.MONGODB_URI);
export const storageMode = useMongo ? 'mongodb' : 'file';
export const LOW_STOCK_THRESHOLD = 6;

export async function init() {
    if (useMongo) await connectDB();
}

export function getCollections() {
    return readSeed().collections;
}

// ---------- helpers ----------
const PUBLIC_FIELDS = ['id', 'name', 'description', 'price', 'category', 'image', 'featured', 'new', 'sizes', 'stock'];

function shape(p) {
    const out = {};
    for (const f of PUBLIC_FIELDS) out[f] = p[f];
    return out;
}

function sanitize(body, existing = {}) {
    const out = { ...existing };
    for (const f of ['name', 'description', 'category', 'image']) {
        if (body[f] !== undefined) out[f] = String(body[f]);
    }
    if (body.price !== undefined) out.price = Math.max(0, Number(body.price) || 0);
    if (body.stock !== undefined) out.stock = Math.max(0, parseInt(body.stock, 10) || 0);
    if (body.featured !== undefined) out.featured = Boolean(body.featured);
    if (body.new !== undefined) out.new = Boolean(body.new);
    if (body.sizes !== undefined) {
        let sizes = body.sizes;
        if (typeof sizes === 'string') sizes = sizes.split(',').map((s) => s.trim()).filter(Boolean);
        out.sizes = Array.isArray(sizes) && sizes.length ? sizes : ['One Size'];
    }
    return out;
}

function newId() {
    return `br-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3).toString(36)}`;
}

// ---------- file backend ----------
function readFile() {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    data.products = (data.products || []).map((p) => ({ ...p, stock: typeof p.stock === 'number' ? p.stock : 12 }));
    return data;
}
function writeFile(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// ---------- public API ----------
export async function listProducts() {
    if (useMongo) {
        const docs = await Product.find().sort({ createdAt: -1 }).lean();
        return docs.map(shape);
    }
    return readFile().products.map(shape);
}

export async function getProduct(id) {
    if (useMongo) {
        const doc = await Product.findOne({ id }).lean();
        return doc ? shape(doc) : null;
    }
    const p = readFile().products.find((x) => x.id === id);
    return p ? shape(p) : null;
}

export async function createProduct(body) {
    if (!body.name || body.price === undefined) {
        const err = new Error('Name and price are required');
        err.code = 'VALIDATION';
        throw err;
    }
    const product = sanitize(body, {
        id: body.id || newId(),
        description: '',
        category: 'Signature',
        image: '',
        featured: false,
        new: false,
        sizes: ['One Size'],
        stock: 0,
    });
    if (useMongo) {
        const created = await Product.create(product);
        return shape(created.toObject());
    }
    const data = readFile();
    if (data.products.some((p) => p.id === product.id)) product.id = newId();
    data.products.unshift(product);
    writeFile(data);
    return shape(product);
}

export async function updateProduct(id, body) {
    if (useMongo) {
        const updated = await Product.findOneAndUpdate({ id }, sanitize(body), { new: true }).lean();
        return updated ? shape(updated) : null;
    }
    const data = readFile();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    data.products[idx] = sanitize(body, data.products[idx]);
    writeFile(data);
    return shape(data.products[idx]);
}

export async function deleteProduct(id) {
    if (useMongo) {
        const res = await Product.findOneAndDelete({ id });
        return Boolean(res);
    }
    const data = readFile();
    const before = data.products.length;
    data.products = data.products.filter((p) => p.id !== id);
    if (data.products.length === before) return false;
    writeFile(data);
    return true;
}

export async function setStock(id, stock) {
    const value = Math.max(0, parseInt(stock, 10) || 0);
    if (useMongo) {
        const updated = await Product.findOneAndUpdate({ id }, { stock: value }, { new: true }).lean();
        return updated ? shape(updated) : null;
    }
    const data = readFile();
    const p = data.products.find((x) => x.id === id);
    if (!p) return null;
    p.stock = value;
    writeFile(data);
    return shape(p);
}

// Decrement stock for purchased items (used by checkout). Floors at 0.
export async function decrementStock(items = []) {
    if (!Array.isArray(items) || items.length === 0) return;
    if (useMongo) {
        await Promise.all(
            items.map((it) =>
                Product.updateOne(
                    { id: it.id, stock: { $gte: it.quantity } },
                    { $inc: { stock: -Math.abs(it.quantity || 1) } }
                )
            )
        );
        return;
    }
    const data = readFile();
    for (const it of items) {
        const p = data.products.find((x) => x.id === it.id);
        if (p) p.stock = Math.max(0, p.stock - Math.abs(it.quantity || 1));
    }
    writeFile(data);
}
