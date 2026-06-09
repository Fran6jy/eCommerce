// MongoDB connection + Product model (with a serverless-safe cached connection)
import mongoose from 'mongoose';
import { readSeed } from './seedData.js';

const productSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, default: 'Signature', trim: true },
        image: { type: String, default: '' },
        featured: { type: Boolean, default: false },
        new: { type: Boolean, default: false },
        sizes: { type: [String], default: ['One Size'] },
        stock: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

export const Product =
    mongoose.models.Product || mongoose.model('Product', productSchema);

// Cache the connection across serverless invocations / hot reloads.
let cached = global._brsMongoose;
if (!cached) cached = global._brsMongoose = { conn: null, promise: null };

export async function connectDB() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, { bufferCommands: false })
            .then((m) => m);
    }
    cached.conn = await cached.promise;
    await ensureSeeded();
    return cached.conn;
}

// Seed the collection from products.json the first time the DB is empty.
async function ensureSeeded() {
    const count = await Product.estimatedDocumentCount();
    if (count === 0) {
        const { products } = readSeed();
        await Product.insertMany(products);
        console.log(`Seeded ${products.length} products into MongoDB`);
    }
}
