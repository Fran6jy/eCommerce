# 🌹 The Black Rose Signature

> Born in darkness. Bloomed in silence. Signed in strength.

A fully functional, high-end luxury e-commerce website built with modern web technologies. This is not just an online store—it's a cinematic identity brand experience.

## ✨ Features

### Frontend
- **Cinematic Hero Section** - Full-screen animated intro with parallax effects
- **Chapter 36 Story Section** - Emotional storytelling with scroll-triggered reveals
- **Collections Grid** - Hover animations and gold foil highlights
- **Product Shop** - Filter by category, sort by price/newest/featured
- **Quick View Modal** - Instant product preview with size selection
- **Shopping Cart** - Persistent cart with localStorage, quantity updates
- **Search Functionality** - Real-time product search
- **Newsletter Signup** - Email capture with branded messaging
- **Mobile Responsive** - Fully responsive design with hamburger menu
- **GSAP Animations** - Smooth scroll-triggered animations

### Backend (Express)
- RESTful API for products
- Product filtering and search endpoints
- Checkout endpoint (Stripe-ready)
- Newsletter subscription endpoint
- Health check endpoint

### Design
- **Color Palette**: Deep Black (#0A0A0A), Blood Burgundy (#3B0A0A), Crimson (#C8102E), Metallic Gold (#D4AF37), Ivory (#F5F1E8)
- **Typography**: Cormorant Garamond (serif), Montserrat (sans-serif)
- **Animations**: Subtle fade-ins, hover glows, parallax scrolling

## 📁 Project Structure

```
the-black-rose-signature/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles/
│   │   └── main.css        # Custom CSS styles
│   └── js/
│       └── main.js         # Frontend JavaScript
├── data/
│   └── products.json       # Product & collection data
├── server.js               # Express backend server
├── package.json            # Node.js dependencies
├── .env                    # Environment variables
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /workspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛒 Demo Products Included

The shop comes pre-loaded with 12 luxury products across 5 categories:

| Category | Products |
|----------|----------|
| Apparel | Black Rose Hoodie, Leather Jacket, Silk Slip Dress, Embroidered Blazer |
| Accessories | Crimson Silk Scarf, Gold Thorn Ring, Velvet Choker, Rose Thorn Bracelet |
| Fragrance | Midnight Eau de Parfum |
| Home | Chapter 36 Candle |
| Signature | Noir Lip Elixir, Signature Box Set |

## 💳 Stripe Integration

To enable real payments:

1. Get your Stripe API keys from [stripe.com](https://stripe.com)
2. Update `.env` with your keys:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Update the checkout logic in `public/js/main.js` to use Stripe.js

## 🎨 Customization

### Colors
Edit CSS variables in `public/styles/main.css`:
```css
:root {
    --color-black: #0A0A0A;
    --color-burgundy: #3B0A0A;
    --color-crimson: #C8102E;
    --color-gold: #D4AF37;
    --color-ivory: #F5F1E8;
}
```

### Products
Add/edit products in `data/products.json`:
```json
{
  "id": "prod_001",
  "name": "Product Name",
  "description": "Poetic description...",
  "price": 185,
  "category": "apparel",
  "image": "🖤",
  "sizes": ["S", "M", "L"],
  "featured": true,
  "new": false
}
```

## 📱 Mobile Responsive

The website is fully responsive with:
- Hamburger menu for mobile navigation
- Touch-friendly buttons and interactions
- Optimized layouts for all screen sizes
- Mobile-first CSS approach

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products and collections |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/category/:category` | Filter by category |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/new` | Get new arrivals |
| GET | `/api/products/search?q=query` | Search products |
| POST | `/api/checkout` | Create checkout session |
| POST | `/api/newsletter` | Subscribe to newsletter |
| GET | `/api/health` | Health check |

## 🚢 Deployment

### Vercel/Netlify
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Deploy automatically on push

### Render/Railway
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables

## 📝 Brand Voice

All copy follows the luxury editorial style:
- Emotional and empowering
- Minimal but poetic
- Identity-focused

Examples:
- "This is not fashion. This is identity."
- "A chapter of becoming."
- "Designed for those who move in silence but leave impact everywhere."

## 🙏 Credits

Built with:
- HTML5, CSS3, JavaScript
- Tailwind CSS (CDN)
- GSAP for animations
- Express.js backend
- Google Fonts (Cormorant Garamond, Montserrat)

---

**Signed in Strength.** 🌹
