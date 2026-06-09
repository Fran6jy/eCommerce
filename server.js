// The Black Rose Signature - Express Server
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/data', express.static('data'));

// Load products data
let productsData = { products: [], collections: [] };
try {
    const dataPath = join(__dirname, 'data', 'products.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    productsData = JSON.parse(rawData);
} catch (error) {
    console.error('Error loading products data:', error);
}

// API Routes

// Get all products and collections
app.get('/api/products', (req, res) => {
    res.json(productsData);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const product = productsData.products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

// Get products by category
app.get('/api/products/category/:category', (req, res) => {
    const filtered = productsData.products.filter(
        p => p.category === req.params.category
    );
    res.json(filtered);
});

// Get featured products
app.get('/api/products/featured', (req, res) => {
    const featured = productsData.products.filter(p => p.featured);
    res.json(featured);
});

// Get new products
app.get('/api/products/new', (req, res) => {
    const newProducts = productsData.products.filter(p => p.new);
    res.json(newProducts);
});

// Search products
app.get('/api/products/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const results = productsData.products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    res.json(results);
});

// Stripe checkout endpoint (placeholder for real integration)
app.post('/api/checkout', (req, res) => {
    const { items, customerInfo } = req.body;
    
    // In production, this would create a Stripe checkout session
    // For demo purposes, we'll return a mock response
    res.json({
        success: true,
        message: 'Checkout session created (demo mode)',
        orderId: `order_${Date.now()}`,
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
});

// Newsletter subscription endpoint
app.post('/api/newsletter', (req, res) => {
    const { name, email } = req.body;
    
    // In production, this would add to your email service (Mailchimp, etc.)
    console.log(`New subscriber: ${name} <${email}>`);
    
    res.json({
        success: true,
        message: 'Welcome to the Chapter. Signed in Strength.'
    });
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // In production, this would send an email or save to database
    console.log(`Contact form submission from ${name} <${email}>`);
    
    res.json({
        success: true,
        message: 'Your message has been received. We will respond shortly.'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes (SPA support)
app.get('/{*path}', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🌹 THE BLACK ROSE SIGNATURE                     ║
║                                                   ║
║   Server running on http://localhost:${PORT}        ║
║                                                   ║
║   Born in darkness. Bloomed in silence.           ║
║   Signed in strength.                             ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
});
