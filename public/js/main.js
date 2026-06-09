// The Black Rose Signature - Main JavaScript
const LOW_STOCK = 6;
const state = {
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    products: [],
    collections: [],
    currentFilter: 'all',
    currentSort: 'featured',
    selectedSize: null,
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
    spawnPetals();
    hideLoading();
}

function cacheElements() {
    const ids = ['navbar', 'cartBtn', 'cartSidebar', 'closeCart', 'cartItems', 'cartTotal',
        'cartCount', 'checkoutBtn', 'productGrid', 'sortSelect', 'mobileMenuBtn', 'mobileMenu',
        'closeMobileMenu', 'searchBtn', 'searchModal', 'closeSearch', 'searchInput', 'searchResults',
        'quickViewModal', 'closeQuickView', 'quickViewContent', 'newsletterForm', 'toast',
        'toastMessage', 'loading', 'petals'];
    ids.forEach(id => { elements[id] = document.getElementById(id); });
    elements.filterBtns = document.querySelectorAll('.filter-btn');
    elements.mobileLinks = document.querySelectorAll('.mobile-link');
}

async function loadData() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('api');
        const data = await response.json();
        state.products = data.products || [];
        state.collections = data.collections || [];
    } catch (error) {
        console.warn('API unavailable, falling back to static data:', error);
        try {
            const fallback = await fetch('/data/products.json');
            const data = await fallback.json();
            state.products = data.products || [];
            state.collections = data.collections || [];
        } catch (e) {
            console.error('Failed to load product data:', e);
        }
    }
}

function setupEventListeners() {
    window.addEventListener('scroll', handleScroll);
    elements.cartBtn?.addEventListener('click', openCart);
    elements.closeCart?.addEventListener('click', closeCart);
    elements.checkoutBtn?.addEventListener('click', handleCheckout);
    elements.mobileMenuBtn?.addEventListener('click', () => elements.mobileMenu.classList.remove('translate-x-full'));
    elements.closeMobileMenu?.addEventListener('click', () => elements.mobileMenu.classList.add('translate-x-full'));
    elements.mobileLinks.forEach(link => link.addEventListener('click', () => elements.mobileMenu.classList.add('translate-x-full')));
    elements.searchBtn?.addEventListener('click', () => { elements.searchModal.classList.remove('hidden'); elements.searchInput.focus(); });
    elements.closeSearch?.addEventListener('click', () => elements.searchModal.classList.add('hidden'));
    elements.searchInput?.addEventListener('input', handleSearch);
    elements.closeQuickView?.addEventListener('click', closeQuickView);
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.currentFilter = e.currentTarget.dataset.filter;
            renderProducts();
        });
    });
    elements.sortSelect?.addEventListener('change', (e) => { state.currentSort = e.target.value; renderProducts(); });
    elements.newsletterForm?.addEventListener('submit', handleNewsletterSubmit);
    elements.quickViewModal?.addEventListener('click', (e) => { if (e.target === elements.quickViewModal) closeQuickView(); });
    elements.searchModal?.addEventListener('click', (e) => { if (e.target === elements.searchModal) elements.searchModal.classList.add('hidden'); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.searchModal.classList.add('hidden');
            closeQuickView();
            closeCart();
        }
    });
}

function handleScroll() {
    if (window.scrollY > 60) elements.navbar?.classList.add('scrolled');
    else elements.navbar?.classList.remove('scrolled');
}

function openCart() { elements.cartSidebar?.classList.remove('translate-x-full'); }
function closeCart() { elements.cartSidebar?.classList.add('translate-x-full'); }

function renderCollections() {
    const container = document.querySelector('#collections .grid');
    if (!container) return;
    container.innerHTML = state.collections.map(c => `
        <div class="collection-card group fade-in aspect-[4/5]">
            <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style="background-image:url('${c.image}')"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <div class="collection-overlay">
                <div>
                    <h3 class="text-2xl font-serif text-gold mb-1">${c.name}</h3>
                    <p class="text-ivory/70 font-light mb-4">${c.description}</p>
                    <a href="#shop" class="inline-block px-6 py-2 border border-gold text-gold uppercase tracking-wider text-xs hover:bg-gold hover:text-black transition-all duration-300">Shop Now</a>
                </div>
            </div>
        </div>
    `).join('');
    revealOnScroll(container.querySelectorAll('.fade-in'));
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
    if (filtered.length === 0) {
        elements.productGrid.innerHTML = `<p class="col-span-full text-center text-ivory/40 py-16 font-light">No pieces in this chapter yet.</p>`;
        return;
    }
    elements.productGrid.innerHTML = filtered.map(p => {
        const stock = typeof p.stock === 'number' ? p.stock : null;
        const soldOut = stock !== null && stock <= 0;
        const low = stock !== null && stock > 0 && stock <= LOW_STOCK;
        const badge = soldOut
            ? '<span class="absolute top-3 left-3 bg-black/80 text-ivory text-[10px] uppercase tracking-wider px-3 py-1 border border-ivory/30">Sold Out</span>'
            : p.new ? '<span class="absolute top-3 left-3 bg-crimson text-white text-[10px] uppercase tracking-wider px-3 py-1">New</span>'
            : p.featured ? '<span class="absolute top-3 left-3 bg-gold text-black text-[10px] uppercase tracking-wider px-3 py-1">Featured</span>' : '';
        const action = soldOut
            ? '<span class="text-xs uppercase tracking-wider text-ivory/30">Sold Out</span>'
            : `<button onclick="addToCart('${p.id}')" class="text-xs uppercase tracking-wider hover:text-gold transition-colors duration-300">Add to Cart +</button>`;
        return `
        <div class="product-card fade-in group ${soldOut ? 'opacity-70' : ''}">
            <div class="aspect-[3/4] relative overflow-hidden bg-burgundy-dark">
                <div class="product-image absolute inset-0 bg-cover bg-center ${soldOut ? 'grayscale' : ''}" style="background-image:url('${p.image}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                ${badge}
                <div class="product-actions">
                    <button onclick="quickView('${p.id}')" class="w-full py-3 bg-gold text-black uppercase tracking-wider text-xs hover:bg-crimson hover:text-white transition-all duration-300">Quick View</button>
                </div>
            </div>
            <div class="pt-4">
                <p class="text-gold/60 text-[10px] uppercase tracking-[0.2em] mb-1">${p.category}${low ? ` · <span class="text-crimson">Only ${stock} left</span>` : ''}</p>
                <h3 class="font-serif text-lg mb-1">${p.name}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-gold font-serif text-xl">$${p.price}</span>
                    ${action}
                </div>
            </div>
        </div>`;
    }).join('');
    revealOnScroll(elements.productGrid.querySelectorAll('.fade-in'));
}

window.quickView = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    state.selectedSize = null;
    const stock = typeof product.stock === 'number' ? product.stock : null;
    const soldOut = stock !== null && stock <= 0;
    const low = stock !== null && stock > 0 && stock <= LOW_STOCK;
    const stockLine = soldOut
        ? '<p class="text-crimson text-sm uppercase tracking-wider mb-6">Currently sold out</p>'
        : low ? `<p class="text-crimson text-sm uppercase tracking-wider mb-6">Only ${stock} left in stock</p>`
        : stock !== null ? '<p class="text-emerald-400/80 text-sm uppercase tracking-wider mb-6">In stock</p>' : '';
    const ctaButton = soldOut
        ? '<button disabled class="w-full py-4 bg-ivory/10 text-ivory/40 uppercase tracking-[0.15em] text-sm cursor-not-allowed">Sold Out</button>'
        : `<button onclick="addToCart('${product.id}')" class="w-full py-4 bg-gold text-black uppercase tracking-[0.15em] text-sm hover:bg-crimson hover:text-white transition-all duration-500">Add to Cart</button>`;
    elements.quickViewContent.innerHTML = `
        <div class="aspect-square bg-cover bg-center ${soldOut ? 'grayscale' : ''}" style="background-image:url('${product.image}')"></div>
        <div class="flex flex-col justify-center">
            <p class="text-gold/60 text-xs uppercase tracking-[0.2em] mb-2">${product.category}</p>
            <h2 class="text-3xl md:text-4xl font-serif mb-3">${product.name}</h2>
            <p class="text-2xl text-gold font-serif mb-3">$${product.price}</p>
            ${stockLine}
            <p class="text-ivory/70 font-light leading-relaxed mb-8">${product.description}</p>
            ${product.sizes && product.sizes.length > 0 ? `<div class="mb-8"><label class="block text-xs uppercase tracking-wider mb-3 text-ivory/60">Select Size</label><div class="flex flex-wrap gap-2" id="sizeSelector">${product.sizes.map(s => `<button class="size-btn px-4 py-2 border border-gold/30 text-sm hover:border-gold transition-colors" data-size="${s}">${s}</button>`).join('')}</div></div>` : ''}
            ${ctaButton}
            <div class="mt-8 pt-6 border-t border-gold/10 text-ivory/40 text-xs space-y-1">
                <p>Complimentary shipping on orders over $500</p>
                <p>30-day returns · Signed and authenticated</p>
            </div>
        </div>
    `;
    elements.quickViewModal.classList.remove('hidden');
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('border-gold', 'text-gold', 'bg-gold/10'));
            btn.classList.add('border-gold', 'text-gold', 'bg-gold/10');
            state.selectedSize = btn.dataset.size;
        });
    });
};

function closeQuickView() { elements.quickViewModal.classList.add('hidden'); }

window.addToCart = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    if (typeof product.stock === 'number' && product.stock <= 0) {
        showToast('This piece is currently sold out');
        return;
    }
    const size = state.selectedSize || (product.sizes && product.sizes[0]) || 'One Size';
    const key = `${productId}__${size}`;
    const existing = state.cart.find(item => item.key === key);
    if (existing) existing.quantity += 1;
    else state.cart.push({ key, id: product.id, name: product.name, price: product.price, image: product.image, size, quantity: 1 });
    saveCart();
    updateCart();
    showToast(`${product.name} added to cart`);
    closeQuickView();
    state.selectedSize = null;
};

window.removeFromCart = function(key) {
    state.cart = state.cart.filter(item => item.key !== key);
    saveCart();
    updateCart();
};

window.updateQuantity = function(key, delta) {
    const item = state.cart.find(item => item.key === key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(key);
    else { saveCart(); updateCart(); }
};

function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }

function updateCart() {
    if (!elements.cartItems) return;
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = `<div class="text-center py-16"><span class="text-5xl block mb-4">🥀</span><p class="text-ivory/40 font-light">Your cart is empty</p><button onclick="document.getElementById('closeCart').click()" class="inline-block mt-4 text-gold underline text-sm">Continue Shopping</button></div>`;
        elements.cartTotal.textContent = '$0.00';
        elements.checkoutBtn.disabled = true;
        elements.cartCount.style.opacity = '0';
        return;
    }
    elements.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="w-20 h-24 bg-cover bg-center" style="background-image:url('${item.image}')"></div>
            <div>
                <h4 class="font-serif text-lg leading-tight">${item.name}</h4>
                <p class="text-ivory/40 text-xs mb-1">Size: ${item.size}</p>
                <p class="text-gold">$${item.price}</p>
                <div class="flex items-center mt-2 space-x-3">
                    <button onclick="updateQuantity('${item.key}', -1)" class="w-7 h-7 border border-gold/30 hover:border-gold transition-colors">&minus;</button>
                    <span class="text-sm w-5 text-center">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.key}', 1)" class="w-7 h-7 border border-gold/30 hover:border-gold transition-colors">&plus;</button>
                </div>
            </div>
            <button onclick="removeFromCart('${item.key}')" class="text-ivory/40 hover:text-crimson transition-colors text-xl self-start">&times;</button>
        </div>
    `).join('');
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    elements.cartTotal.textContent = `$${total.toFixed(2)}`;
    elements.checkoutBtn.disabled = false;
    elements.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.style.opacity = '1';
}

async function handleCheckout() {
    if (state.cart.length === 0) return;
    showToast('Preparing your checkout...');
    try {
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: state.cart, customerInfo: {} }),
        });
        const data = await res.json();
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        alert(`Order received (demo mode)\n\nOrder: ${data.orderId || 'pending'}\nTotal: $${total.toFixed(2)}\n\nIn production this redirects to Stripe checkout.`);
    } catch (e) {
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        alert(`Checkout (demo mode)\n\nTotal: $${total.toFixed(2)}\n\nConnect Stripe keys to enable live payments.`);
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query || query.length < 2) { elements.searchResults.innerHTML = ''; return; }
    const results = state.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query));
    if (results.length === 0) {
        elements.searchResults.innerHTML = `<p class="col-span-full text-center text-ivory/40 py-12">No products found for "${e.target.value}"</p>`;
        return;
    }
    elements.searchResults.innerHTML = results.slice(0, 6).map(p => `
        <div class="product-card cursor-pointer group" onclick="document.getElementById('searchModal').classList.add('hidden'); quickView('${p.id}');">
            <div class="aspect-square bg-cover bg-center mb-3" style="background-image:url('${p.image}')"></div>
            <h4 class="font-serif text-lg">${p.name}</h4>
            <p class="text-gold">$${p.price}</p>
        </div>
    `).join('');
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.get('name'), email: formData.get('email') }),
    }).catch(() => {});
    showToast('Welcome to the Chapter. Signed in Strength.');
    e.target.reset();
}

let toastTimer;
function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { elements.toast.classList.add('translate-y-24', 'opacity-0'); }, 3000);
}

function revealOnScroll(nodes) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    nodes.forEach(n => observer.observe(n));
}

function setupAnimations() {
    // Generic scroll reveal for static story blocks
    revealOnScroll(document.querySelectorAll('.story-block'));

    if (typeof gsap !== 'undefined') {
        gsap.from('.hero-eyebrow', { opacity: 0, y: 20, duration: 1.2, delay: 0.3, ease: 'power3.out' });
        gsap.from('.hero-title', { opacity: 0, y: 40, duration: 1.4, delay: 0.5, ease: 'power3.out' });
        gsap.from('.hero-tagline', { opacity: 0, y: 30, duration: 1.4, delay: 0.9, ease: 'power3.out' });
        gsap.from('.hero-buttons', { opacity: 0, y: 30, duration: 1.4, delay: 1.2, ease: 'power3.out' });

        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            // Hero parallax
            gsap.to('.hero-image', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: true } });
            gsap.to('.chapter-bg', { yPercent: 15, ease: 'none', scrollTrigger: { trigger: '#chapter36', start: 'top bottom', end: 'bottom top', scrub: true } });
        }
    }
}

function spawnPetals() {
    if (!elements.petals) return;
    const petalCount = 14;
    for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement('span');
        petal.className = 'petal';
        petal.textContent = '🌹';
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.animationDuration = `${8 + Math.random() * 10}s`;
        petal.style.animationDelay = `${Math.random() * 10}s`;
        petal.style.fontSize = `${10 + Math.random() * 14}px`;
        petal.style.opacity = `${0.15 + Math.random() * 0.35}`;
        elements.petals.appendChild(petal);
    }
}

function hideLoading() {
    if (!elements.loading) return;
    elements.loading.classList.add('loaded');
    setTimeout(() => elements.loading.remove(), 700);
}

document.addEventListener('DOMContentLoaded', init);
