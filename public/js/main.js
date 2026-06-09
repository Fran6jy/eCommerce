// The Black Rose Signature - Main JavaScript
const state = {
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    products: [],
    collections: [],
    currentFilter: 'all',
    currentSort: 'featured'
};

const elements = {};

async function init() {
    cacheElements();
    await loadData();
    setupEventListeners();
    renderCollections();
    renderProducts();
    updateCart();
    setupAnimations();
}

function cacheElements() {
    elements.navbar = document.getElementById('navbar');
    elements.cartBtn = document.getElementById('cartBtn');
    elements.cartSidebar = document.getElementById('cartSidebar');
    elements.closeCart = document.getElementById('closeCart');
    elements.cartItems = document.getElementById('cartItems');
    elements.cartTotal = document.getElementById('cartTotal');
    elements.cartCount = document.getElementById('cartCount');
    elements.checkoutBtn = document.getElementById('checkoutBtn');
    elements.productGrid = document.getElementById('productGrid');
    elements.filterBtns = document.querySelectorAll('.filter-btn');
    elements.sortSelect = document.getElementById('sortSelect');
    elements.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    elements.mobileMenu = document.getElementById('mobileMenu');
    elements.closeMobileMenu = document.getElementById('closeMobileMenu');
    elements.searchBtn = document.getElementById('searchBtn');
    elements.searchModal = document.getElementById('searchModal');
    elements.closeSearch = document.getElementById('closeSearch');
    elements.searchInput = document.getElementById('searchInput');
    elements.searchResults = document.getElementById('searchResults');
    elements.quickViewModal = document.getElementById('quickViewModal');
    elements.closeQuickView = document.getElementById('closeQuickView');
    elements.quickViewContent = document.getElementById('quickViewContent');
    elements.newsletterForm = document.getElementById('newsletterForm');
    elements.toast = document.getElementById('toast');
    elements.toastMessage = document.getElementById('toastMessage');
}

async function loadData() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        state.products = data.products;
        state.collections = data.collections;
    } catch (error) {
        console.error('Error loading data:', error);
        const fallbackResponse = await fetch('/data/products.json');
        const data = await fallbackResponse.json();
        state.products = data.products;
        state.collections = data.collections;
    }
}

function setupEventListeners() {
    window.addEventListener('scroll', handleScroll);
    elements.cartBtn?.addEventListener('click', toggleCart);
    elements.closeCart?.addEventListener('click', toggleCart);
    elements.checkoutBtn?.addEventListener('click', handleCheckout);
    elements.mobileMenuBtn?.addEventListener('click', () => elements.mobileMenu.classList.remove('translate-x-full'));
    elements.closeMobileMenu?.addEventListener('click', () => elements.mobileMenu.classList.add('translate-x-full'));
    elements.searchBtn?.addEventListener('click', () => { elements.searchModal.classList.remove('hidden'); elements.searchInput.focus(); });
    elements.closeSearch?.addEventListener('click', () => elements.searchModal.classList.add('hidden'));
    elements.searchInput?.addEventListener('input', handleSearch);
    elements.closeQuickView?.addEventListener('click', () => { elements.quickViewModal.classList.add('hidden'); elements.quickViewModal.classList.remove('show'); });
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentFilter = e.target.dataset.filter;
            renderProducts();
        });
    });
    elements.sortSelect?.addEventListener('change', (e) => { state.currentSort = e.target.value; renderProducts(); });
    elements.newsletterForm?.addEventListener('submit', handleNewsletterSubmit);
    elements.quickViewModal?.addEventListener('click', (e) => { if (e.target === elements.quickViewModal) { elements.quickViewModal.classList.add('hidden'); elements.quickViewModal.classList.remove('show'); } });
    elements.searchModal?.addEventListener('click', (e) => { if (e.target === elements.searchModal) elements.searchModal.classList.add('hidden'); });
}

function handleScroll() {
    if (window.scrollY > 100) elements.navbar?.classList.add('scrolled');
    else elements.navbar?.classList.remove('scrolled');
}

function toggleCart() { elements.cartSidebar?.classList.toggle('open'); }

function renderCollections() {
    const container = document.querySelector('#collections .grid');
    if (!container) return;
    container.innerHTML = state.collections.map(collection => `
        <div class="collection-card group fade-in">
            <div class="aspect-[4/5] bg-gradient-to-br from-burgundy to-black flex items-center justify-center relative overflow-hidden">
                <span class="text-7xl group-hover:scale-110 transition-transform duration-700">${collection.image}</span>
                <div class="collection-overlay">
                    <div>
                        <h3 class="text-2xl font-serif text-gold mb-2">${collection.name}</h3>
                        <p class="text-gray-300 font-light mb-4">${collection.description}</p>
                        <a href="#shop" class="inline-block px-6 py-2 border border-gold text-gold uppercase tracking-wider text-sm hover:bg-gold hover:text-black transition-all duration-300">Shop Now</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    setTimeout(() => { document.querySelectorAll('#collections .fade-in').forEach((el, i) => { setTimeout(() => el.classList.add('visible'), i * 150); }); }, 100);
}

function renderProducts() {
    if (!elements.productGrid) return;
    let filtered = [...state.products];
    if (state.currentFilter !== 'all') filtered = filtered.filter(p => p.category === state.currentFilter);
    switch (state.currentSort) {
        case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
        case 'newest': filtered.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0)); break;
        default: filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    elements.productGrid.innerHTML = filtered.map(product => `
        <div class="product-card fade-in group">
            <div class="aspect-[3/4] bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
                <div class="product-image absolute inset-0 flex items-center justify-center text-8xl">${product.image}</div>
                ${product.new ? '<span class="absolute top-4 left-4 bg-crimson text-white text-xs uppercase tracking-wider px-3 py-1">New</span>' : ''}
                ${product.featured && !product.new ? '<span class="absolute top-4 left-4 bg-gold text-black text-xs uppercase tracking-wider px-3 py-1">Featured</span>' : ''}
                <div class="product-actions">
                    <button onclick="quickView('${product.id}')" class="w-full py-3 bg-gold text-black uppercase tracking-wider text-sm hover:bg-crimson hover:text-white transition-all duration-300">Quick View</button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-serif text-lg mb-1">${product.name}</h3>
                <p class="text-gray-400 text-sm mb-2 line-clamp-2">${product.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-gold font-serif text-xl">$${product.price}</span>
                    <button onclick="addToCart('${product.id}')" class="text-sm uppercase tracking-wider hover:text-gold transition-colors duration-300">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
    setTimeout(() => { document.querySelectorAll('#productGrid .fade-in').forEach((el, i) => { setTimeout(() => el.classList.add('visible'), i * 100); }); }, 100);
}

window.quickView = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    elements.quickViewContent.innerHTML = `
        <div class="aspect-square bg-gradient-to-b from-gray-900 to-black flex items-center justify-center"><span class="text-9xl">${product.image}</span></div>
        <div class="flex flex-col justify-center">
            <h2 class="text-4xl font-serif mb-4">${product.name}</h2>
            <p class="text-2xl text-gold font-serif mb-6">$${product.price}</p>
            <p class="text-gray-300 font-light leading-relaxed mb-8">${product.description}</p>
            ${product.sizes.length > 0 ? `<div class="mb-6"><label class="block text-sm uppercase tracking-wider mb-3">Size</label><div class="flex flex-wrap gap-2" id="sizeSelector">${product.sizes.map(size => `<button class="size-btn px-4 py-2 border border-gray-600 hover:border-gold transition-colors duration-300" data-size="${size}">${size}</button>`).join('')}</div></div>` : ''}
            <button onclick="addToCart('${product.id}')" class="w-full py-4 bg-gold text-black uppercase tracking-widest hover:bg-crimson hover:text-white transition-all duration-500">Add to Cart</button>
            <div class="mt-8 pt-8 border-t border-gray-800"><p class="text-sm text-gray-400">Free shipping on orders over $500</p><p class="text-sm text-gray-400 mt-2">30-day returns</p></div>
        </div>
    `;
    elements.quickViewModal.classList.remove('hidden');
    elements.quickViewModal.classList.add('show');
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => { b.classList.remove('border-gold', 'text-gold'); b.classList.add('border-gray-600'); });
            btn.classList.remove('border-gray-600');
            btn.classList.add('border-gold', 'text-gold');
        });
    });
};

window.addToCart = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) existingItem.quantity += 1;
    else state.cart.push({ ...product, quantity: 1 });
    saveCart();
    updateCart();
    showToast(`${product.name} added to cart`);
    elements.quickViewModal.classList.add('hidden');
    elements.quickViewModal.classList.remove('show');
};

window.removeFromCart = function(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
};

window.updateQuantity = function(productId, delta) {
    const item = state.cart.find(item => item.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(productId);
    else { saveCart(); updateCart(); }
};

function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }

function updateCart() {
    if (!elements.cartItems) return;
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = `<div class="text-center py-12"><span class="text-6xl block mb-4">🛍️</span><p class="text-gray-400 font-light">Your cart is empty</p><a href="#shop" class="inline-block mt-4 text-gold underline">Continue Shopping</a></div>`;
        elements.cartTotal.textContent = '$0.00';
        elements.checkoutBtn.disabled = true;
        elements.cartCount.style.opacity = '0';
    } else {
        elements.cartItems.innerHTML = state.cart.map(item => `<div class="cart-item"><div class="w-20 h-20 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center text-4xl">${item.image}</div><div><h4 class="font-serif mb-1">${item.name}</h4><p class="text-gold">$${item.price}</p><div class="flex items-center mt-2 space-x-3"><button onclick="updateQuantity('${item.id}', -1)" class="w-8 h-8 border border-gray-600 hover:border-gold transition-colors">&minus;</button><span class="text-sm">${item.quantity}</span><button onclick="updateQuantity('${item.id}', 1)" class="w-8 h-8 border border-gray-600 hover:border-gold transition-colors">&plus;</button></div></div><button onclick="removeFromCart('${item.id}')" class="text-gray-400 hover:text-crimson transition-colors text-xl">&times;</button></div>`).join('');
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        elements.cartTotal.textContent = `$${total.toFixed(2)}`;
        elements.checkoutBtn.disabled = false;
        elements.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        elements.cartCount.style.opacity = '1';
    }
}

function handleCheckout() {
    if (state.cart.length === 0) return;
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    showToast('Redirecting to checkout...');
    setTimeout(() => { alert(`Checkout Integration:\n\nTotal: $${total.toFixed(2)}\n\nIn production, this would redirect to Stripe checkout.`); }, 1000);
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query || query.length < 2) { elements.searchResults.innerHTML = ''; return; }
    const results = state.products.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    if (results.length === 0) { elements.searchResults.innerHTML = `<div class="col-span-3 text-center py-12"><p class="text-gray-400">No products found</p></div>`; }
    else { elements.searchResults.innerHTML = results.slice(0, 6).map(product => `<div class="product-card cursor-pointer" onclick="quickView('${product.id}'); document.getElementById('searchModal').classList.add('hidden');"><div class="aspect-square bg-gradient-to-b from-gray-900 to-black flex items-center justify-center text-6xl mb-4">${product.image}</div><h4 class="font-serif text-lg">${product.name}</h4><p class="text-gold">$${product.price}</p></div>`).join(''); }
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    showToast('Welcome to the Chapter. Signed in Strength.');
    e.target.reset();
}

function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => { elements.toast.classList.remove('show'); }, 3000);
}

function setupAnimations() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to('.hero-title', { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 0.5 });
        gsap.to('.hero-tagline', { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 0.8 });
        gsap.to('.hero-buttons', { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', delay: 1.1 });
        gsap.utils.toArray('.story-block').forEach((block) => {
            gsap.to(block, { scrollTrigger: { trigger: block, start: 'top 80%', toggleClass: 'visible' }, opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
