// Manual seed: load data/products.json into MongoDB. Run with: npm run seed
// Requires MONGODB_URI in the environment (.env).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product, connectDB } from '../lib/db.js';
import { readSeed } from '../lib/seedData.js';

dotenv.config();

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set. Add it to your .env file.');
        process.exit(1);
    }
    await connectDB();
    const { products } = readSeed();
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products into MongoDB.`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
