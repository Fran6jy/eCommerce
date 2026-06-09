// The Black Rose Signature - Admin Console
const TOKEN_KEY = 'brs_admin_token';
let products = [];
let lowThreshold = 6;

const $ = (id) => document.getElementById(id);
const el = {};
['loginView', 'dashboardView', 'loginForm', 'username', 'password', 'loginError',
 'logoutBtn', 'storageBadge', 'statProducts', 'statUnits', 'statValue', 'statLow',
 'searchBox', 'addBtn', 'tableBody', 'emptyState', 'productModal', 'modalTitle',
 'closeModal', 'cancelModal', 'productForm', 'modalError', 'toast',
 'f_id', 'f_name', 'f_category', 'f_price', 'f_stock', 'f_sizes', 'f_image',
 'f_description', 'f_featured', 'f_new'].forEach((id) => { el[id] = $(id); });

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US');
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, options = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
            ...(options.headers || {}),
        },
    });
    if (res.status === 401) { logout(); throw new Error('Session expired. Please sign in again.'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

/* ---------- Auth ---------- */
el.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.loginError.classList.add('hidden');
    try {
        const res = await fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: el.username.value, password: el.password.value }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Login failed');
        setToken(data.token);
        showDashboard();
    } catch (err) {
        el.loginError.textContent = err.message;
        el.loginError.classList.remove('hidden');
    }
});

el.logoutBtn.addEventListener('click', logout);

function logout() {
    clearToken();
    el.dashboardView.classList.add('hidden');
    el.loginView.classList.remove('hidden');
    el.password.value = '';
}

function showDashboard() {
    el.loginView.classList.add('hidden');
    el.dashboardView.classList.remove('hidden');
    loadProducts();
}

/* ---------- Data ---------- */
async function loadProducts() {
    try {
        const data = await api('/admin/products');
        products = data.products || [];
        lowThreshold = data.lowStockThreshold ?? 6;
        el.storageBadge.textContent = `Storage: ${data.storage}`;
        el.storageBadge.classList.remove('hidden');
        renderStats();
        renderTable();
    } catch (err) {
        toast(err.message, true);
    }
}

function renderStats() {
    const units = products.reduce((s, p) => s + (p.stock || 0), 0);
    const value = products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0);
    const low = products.filter((p) => (p.stock || 0) <= lowThreshold).length;
    el.statProducts.textContent = products.length;
    el.statUnits.textContent = units.toLocaleString('en-US');
    el.statValue.textContent = money(value);
    el.statLow.textContent = low;
}

function stockStatus(stock) {
    if (stock <= 0) return { label: 'Out of stock', cls: 'text-crimson border-crimson/40' };
    if (stock <= lowThreshold) return { label: 'Low stock', cls: 'text-gold border-gold/40' };
    return { label: 'In stock', cls: 'text-emerald-400 border-emerald-400/30' };
}

function renderTable() {
    const q = el.searchBox.value.trim().toLowerCase();
    const rows = products.filter((p) =>
        !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));

    el.emptyState.classList.toggle('hidden', rows.length > 0);
    el.tableBody.innerHTML = rows.map((p) => {
        const st = stockStatus(p.stock || 0);
        return `
        <tr class="border-t border-gold/10 hover:bg-burgundy-dark/20">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-14 bg-cover bg-center bg-burgundy-dark flex-shrink-0" style="background-image:url('${escapeHtml(p.image)}')"></div>
                    <div>
                        <p class="font-serif text-base leading-tight">${escapeHtml(p.name)}</p>
                        <p class="text-ivory/30 text-xs">${escapeHtml(p.id)}</p>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-ivory/70">${escapeHtml(p.category)}</td>
            <td class="px-4 py-3 text-right text-gold font-serif text-base">${money(p.price)}</td>
            <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="adjustStock('${p.id}', -1)" class="w-7 h-7 border border-gold/30 hover:border-gold leading-none">&minus;</button>
                    <input type="number" min="0" value="${p.stock || 0}" onchange="setStock('${p.id}', this.value)" class="w-14 bg-black border border-gold/20 text-center py-1 text-sm">
                    <button onclick="adjustStock('${p.id}', 1)" class="w-7 h-7 border border-gold/30 hover:border-gold leading-none">+</button>
                </div>
            </td>
            <td class="px-4 py-3 text-center">
                <span class="inline-block px-2.5 py-1 border text-[11px] uppercase tracking-wider ${st.cls}">${st.label}</span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
                <button onclick="editProduct('${p.id}')" class="text-ivory/70 hover:text-gold uppercase tracking-wider text-xs mr-4">Edit</button>
                <button onclick="removeProduct('${p.id}')" class="text-ivory/50 hover:text-crimson uppercase tracking-wider text-xs">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

el.searchBox.addEventListener('input', renderTable);

/* ---------- Stock ---------- */
window.adjustStock = function (id, delta) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setStock(id, Math.max(0, (p.stock || 0) + delta));
};

window.setStock = async function (id, value) {
    try {
        const updated = await api(`/admin/product/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ stock: Number(value) }),
        });
        const idx = products.findIndex((x) => x.id === id);
        if (idx > -1) products[idx] = updated;
        renderStats();
        renderTable();
        toast('Stock updated');
    } catch (err) { toast(err.message, true); }
};

/* ---------- Modal / CRUD ---------- */
el.addBtn.addEventListener('click', () => openModal());
el.closeModal.addEventListener('click', closeModal);
el.cancelModal.addEventListener('click', closeModal);
el.productModal.addEventListener('click', (e) => { if (e.target === el.productModal) closeModal(); });

function openModal(product) {
    el.modalError.classList.add('hidden');
    el.productForm.reset();
    if (product) {
        el.modalTitle.textContent = 'Edit Product';
        el.f_id.value = product.id;
        el.f_name.value = product.name;
        el.f_category.value = product.category;
        el.f_price.value = product.price;
        el.f_stock.value = product.stock || 0;
        el.f_sizes.value = (product.sizes || []).join(', ');
        el.f_image.value = product.image || '';
        el.f_description.value = product.description || '';
        el.f_featured.checked = !!product.featured;
        el.f_new.checked = !!product.new;
    } else {
        el.modalTitle.textContent = 'Add Product';
        el.f_id.value = '';
        el.f_stock.value = 0;
    }
    el.productModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal() {
    el.productModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

window.editProduct = function (id) {
    const p = products.find((x) => x.id === id);
    if (p) openModal(p);
};

el.productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.modalError.classList.add('hidden');
    const payload = {
        name: el.f_name.value.trim(),
        category: el.f_category.value,
        price: Number(el.f_price.value),
        stock: Number(el.f_stock.value),
        sizes: el.f_sizes.value,
        image: el.f_image.value.trim(),
        description: el.f_description.value.trim(),
        featured: el.f_featured.checked,
        new: el.f_new.checked,
    };
    const id = el.f_id.value;
    try {
        if (id) {
            await api(`/admin/product/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            toast('Product updated');
        } else {
            await api('/admin/product', { method: 'POST', body: JSON.stringify(payload) });
            toast('Product created');
        }
        closeModal();
        await loadProducts();
    } catch (err) {
        el.modalError.textContent = err.message;
        el.modalError.classList.remove('hidden');
    }
});

window.removeProduct = async function (id) {
    const p = products.find((x) => x.id === id);
    if (!confirm(`Delete "${p ? p.name : id}"? This cannot be undone.`)) return;
    try {
        await api(`/admin/product/${id}`, { method: 'DELETE' });
        toast('Product deleted');
        await loadProducts();
    } catch (err) { toast(err.message, true); }
};

/* ---------- Toast ---------- */
let toastTimer;
function toast(message, isError = false) {
    el.toast.textContent = message;
    el.toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 text-sm uppercase tracking-wider transition-all duration-500 pointer-events-none ${isError ? 'bg-crimson text-white' : 'bg-gold text-black'}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.classList.add('translate-y-24', 'opacity-0'); }, 3000);
}

/* ---------- Boot ---------- */
if (getToken()) showDashboard();
