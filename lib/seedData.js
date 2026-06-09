// Loads the bundled product catalogue (used to seed Mongo and as the file-store source)
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = join(__dirname, '..', 'data', 'products.json');

const DEFAULT_STOCK = 12;

export function readSeed() {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    const products = (data.products || []).map(p => ({
        ...p,
        stock: typeof p.stock === 'number' ? p.stock : DEFAULT_STOCK,
    }));
    return { products, collections: data.collections || [] };
}
