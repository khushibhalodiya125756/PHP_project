// DREAM Main Customer Panel Application JavaScript

class GlowApp {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('dream_user') || localStorage.getItem('glowai_user') || 'null');
    this.allProducts = [];
    this.allCategories = [];
    this.allBrands = [];
    this.cart = [];
    this.wishlistIds = new Set();
    this.appliedCoupon = null;
    this.currentTheme = localStorage.getItem('dream_theme') || localStorage.getItem('glowai_theme') || 'light';

    this.init();
  }

  async init() {
    this.applyTheme(this.currentTheme);
    await this.fetchInitialData();
    this.populateStorefrontCategoryFilters();
    this.bindEvents();
    this.updateUserUI();
    this.refreshCart();
    this.refreshWishlist();
    this.renderHomePage();
    this.filterShopProducts();
  }

  populateStorefrontCategoryFilters() {
    const catSelect = document.getElementById('shop-category-select');
    if (!catSelect || !this.allCategories.length) return;

    const currentVal = catSelect.value;
    catSelect.innerHTML = '<option value="">All Categories</option>' +
      this.allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (currentVal) catSelect.value = currentVal;
  }

  onCategoryFilterChange() {
    const catSelect = document.getElementById('shop-category-select');
    const subCatSelect = document.getElementById('shop-subcategory-select');
    const pillsContainer = document.getElementById('shop-subcategory-pills-container');
    const pillsList = document.getElementById('shop-subcategory-pills');

    const catId = catSelect ? catSelect.value : '';
    const selectedCategory = this.allCategories.find(c => c.id == catId);

    if (subCatSelect) {
      if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
        subCatSelect.innerHTML = '<option value="">All Sub-Categories</option>' +
          selectedCategory.subcategories.map(s => `<option value="${s.slug || s.name}">${s.name}</option>`).join('');
        subCatSelect.disabled = false;
      } else {
        // Collect all subcategories from all categories if no category selected
        const allSubs = [];
        this.allCategories.forEach(c => {
          if (c.subcategories) {
            c.subcategories.forEach(s => {
              if (!allSubs.some(x => x.name === s.name)) allSubs.push(s);
            });
          }
        });

        subCatSelect.innerHTML = '<option value="">All Sub-Categories</option>' +
          allSubs.map(s => `<option value="${s.slug || s.name}">${s.name}</option>`).join('');
        subCatSelect.disabled = false;
      }
      subCatSelect.value = '';
    }

    // Render Subcategory Quick Pills
    if (pillsContainer && pillsList) {
      const subsToDisplay = (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0)
        ? selectedCategory.subcategories
        : [];

      if (subsToDisplay.length > 0) {
        pillsContainer.classList.remove('hidden');
        pillsList.innerHTML = `
          <button onclick="window.glowApp.selectSubCategoryPill('', this)" class="subcat-pill flex items-center gap-2 whitespace-nowrap text-xs font-bold pl-1.5 pr-3.5 py-1.5 rounded-full border transition-all bg-[#4a3f44] text-white border-[#4a3f44] shadow-xs cursor-pointer">
            <img src="${selectedCategory.image_url}" alt="${selectedCategory.name}" class="w-5 h-5 rounded-full object-cover border border-white/40" onerror="this.src='https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100'" />
            <span>All ${selectedCategory.name}</span>
          </button>
        ` + subsToDisplay.map(s => `
          <button onclick="window.glowApp.selectSubCategoryPill('${s.slug || s.name}', this)" class="subcat-pill flex items-center gap-2 whitespace-nowrap text-xs font-medium pl-1.5 pr-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 hover:border-[#e5c1b3] hover:text-[#4a3f44] dark:hover:text-white transition-all shadow-2xs cursor-pointer group">
            <img src="${s.image_url || selectedCategory.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100'}" alt="${s.name}" class="w-5 h-5 rounded-full object-cover border border-stone-200 dark:border-stone-700 group-hover:scale-110 transition-transform" onerror="this.src='${selectedCategory.image_url}'" />
            <span>${s.name}</span>
          </button>
        `).join('');
      } else {
        pillsContainer.classList.add('hidden');
      }
    }

    this.filterShopProducts();
  }

  selectSubCategoryPill(subCatSlug, btnElement) {
    const subCatSelect = document.getElementById('shop-subcategory-select');
    if (subCatSelect) subCatSelect.value = subCatSlug;

    // Update active pill UI
    document.querySelectorAll('.subcat-pill').forEach(btn => {
      btn.className = 'subcat-pill flex items-center gap-2 whitespace-nowrap text-xs font-medium pl-1.5 pr-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 hover:border-[#e5c1b3] hover:text-[#4a3f44] dark:hover:text-white transition-all shadow-2xs cursor-pointer group';
    });
    if (btnElement) {
      btnElement.className = 'subcat-pill flex items-center gap-2 whitespace-nowrap text-xs font-bold pl-1.5 pr-3.5 py-1.5 rounded-full border transition-all bg-[#4a3f44] text-white border-[#4a3f44] shadow-xs cursor-pointer';
    }

    this.filterShopProducts();
  }

  filterBySubCategory(subCatSlug, catId = null) {
    window.location.hash = 'shop';
    const catSelect = document.getElementById('shop-category-select');
    if (catSelect && catId) {
      catSelect.value = catId;
      this.onCategoryFilterChange();
    }
    const subSelect = document.getElementById('shop-subcategory-select');
    if (subSelect) subSelect.value = subCatSlug;
    this.filterShopProducts();
  }

  resetShopFilters() {
    const search = document.getElementById('shop-search-input');
    const cat = document.getElementById('shop-category-select');
    const subcat = document.getElementById('shop-subcategory-select');
    const skin = document.getElementById('shop-skintype-select');
    const concern = document.getElementById('shop-concern-select');
    const sort = document.getElementById('shop-sort-select');

    if (search) search.value = '';
    if (cat) cat.value = '';
    if (subcat) subcat.value = '';
    if (skin) skin.value = '';
    if (concern) concern.value = '';
    if (sort) sort.value = 'newest';

    const pillsContainer = document.getElementById('shop-subcategory-pills-container');
    if (pillsContainer) pillsContainer.classList.add('hidden');

    this.filterShopProducts();
  }

  // ------------------------------------------
  // Theme & Toast Utilities
  // ------------------------------------------
  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('dream_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtnIcon = document.getElementById('theme-toggle-icon');
    if (themeBtnIcon) {
      themeBtnIcon.className = theme === 'dark' ? 'fas fa-sun text-amber-400' : 'fas fa-moon text-stone-600';
    }
  }

  toggleTheme() {
    this.applyTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  // ------------------------------------------
  // Initial Data Fetch
  // ------------------------------------------
  async fetchInitialData() {
    try {
      const [prodRes, catRes, brandRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/store/settings')
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      const settingsData = await settingsRes.json();

      if (prodData.success) this.allProducts = prodData.products;
      if (catData.success) this.allCategories = catData.categories;
      if (brandData.success) this.allBrands = brandData.brands;
      if (settingsData.success && settingsData.settings) {
        this.storeSettings = settingsData.settings;
        if (this.storeSettings.banner_announcement) {
          const bannerEl = document.getElementById('top-banner-announcement-text');
          if (bannerEl) bannerEl.innerHTML = this.storeSettings.banner_announcement;
        }
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      this.showToast('Failed loading products. Please refresh.', 'error');
    }
  }

  // ------------------------------------------
  // Cart & Wishlist AJAX
  // ------------------------------------------
  async refreshCart() {
    const userId = this.currentUser ? this.currentUser.id : undefined;
    const sessionId = localStorage.getItem('dream_session_id') || localStorage.getItem('glowai_session_id') || 'session-' + Date.now();
    localStorage.setItem('dream_session_id', sessionId);

    try {
      const res = await fetch(`/api/cart?user_id=${userId || ''}&session_id=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        this.cart = data.items;
        this.updateCartBadge();
        this.renderCartDrawer();
      }
    } catch (err) {
      console.error('Cart refresh error:', err);
    }
  }

  updateCartBadge() {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  async addToCart(productId, quantity = 1) {
    const userId = this.currentUser ? this.currentUser.id : undefined;
    const sessionId = localStorage.getItem('dream_session_id') || localStorage.getItem('glowai_session_id');

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, session_id: sessionId, product_id: productId, quantity })
      });
      const data = await res.json();
      if (data.success) {
        await this.refreshCart();
        this.showToast('Added to bag!', 'success');
      }
    } catch (err) {
      this.showToast('Error adding to bag', 'error');
    }
  }

  async updateCartQuantity(cartId, quantity) {
    try {
      await fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      await this.refreshCart();
    } catch (err) {
      this.showToast('Error updating bag', 'error');
    }
  }

  async refreshWishlist() {
    if (!this.currentUser) return;
    try {
      const res = await fetch(`/api/wishlist?user_id=${this.currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        this.wishlistIds = new Set(data.wishlist.map(item => item.product_id));
        this.updateWishlistBadge();
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  }

  updateWishlistBadge() {
    const badges = document.querySelectorAll('.wishlist-count-badge');
    badges.forEach(b => {
      b.textContent = this.wishlistIds.size;
      b.style.display = this.wishlistIds.size > 0 ? 'flex' : 'none';
    });
  }

  async toggleWishlist(productId) {
    if (!this.currentUser) {
      this.showToast('Please login to manage your wishlist', 'info');
      this.openAuthModal('login');
      return;
    }

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.currentUser.id, product_id: productId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.inWishlist) {
          this.wishlistIds.add(productId);
          this.showToast('Saved to wishlist!', 'success');
        } else {
          this.wishlistIds.delete(productId);
          this.showToast('Removed from wishlist', 'info');
        }
        this.updateWishlistBadge();
        this.renderWishlistPage();
      }
    } catch (err) {
      this.showToast('Error updating wishlist', 'error');
    }
  }

  renderWishlistModal() {
    if (!this.currentUser) {
      this.showToast('Please sign in to view your wishlist', 'info');
      this.openAuthModal('login');
      return;
    }

    const modal = document.getElementById('wishlist-modal');
    const container = document.getElementById('wishlist-modal-list');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const savedProducts = this.allProducts.filter(p => this.wishlistIds.has(p.id));

    if (savedProducts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 space-y-3">
          <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-400 flex items-center justify-center mx-auto text-xl">
            <i class="far fa-heart"></i>
          </div>
          <p class="text-xs font-bold text-stone-700 dark:text-stone-300">Your wishlist is empty</p>
          <p class="text-[11px] text-stone-400 max-w-xs mx-auto">Browse our formulas and click the heart icon to save items to your wishlist.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = savedProducts.map(p => `
      <div class="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60">
        <img src="${p.main_image}" class="w-14 h-14 rounded-xl object-cover shrink-0" />
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-xs truncate text-stone-900 dark:text-white">${p.name}</h4>
          <p class="text-[11px] text-stone-500 dark:text-stone-400">${p.category_name || 'Skincare'}</p>
          <p class="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">₹${p.unitPrice ? p.unitPrice.toFixed(2) : (p.price ? Number(p.price).toFixed(2) : '0.00')}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="window.glowApp.addToCart(${p.id})" class="px-3 py-1.5 rounded-xl bg-[#4a3f44] hover:bg-[#5a4f54] text-white text-[11px] font-bold transition-colors">
            Add to Bag
          </button>
          <button onclick="window.glowApp.toggleWishlist(${p.id})" class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 flex items-center justify-center text-xs transition-colors">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  renderWishlistPage() {
    const modal = document.getElementById('wishlist-modal');
    if (modal && !modal.classList.contains('hidden')) {
      this.renderWishlistModal();
    }
  }

  async renderMyOrdersModal(specificOrderNumber = null) {
    const modal = document.getElementById('my-orders-modal');
    const container = document.getElementById('my-orders-modal-list');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    container.innerHTML = `
      <div class="text-center py-10 space-y-3">
        <i class="fas fa-spinner fa-spin text-2xl text-[#4a3f44] dark:text-[#e5c1b3]"></i>
        <p class="text-xs text-stone-500">Loading your order history...</p>
      </div>
    `;

    try {
      let orders = [];
      if (specificOrderNumber) {
        const res = await fetch(`/api/orders/track/${encodeURIComponent(specificOrderNumber)}`);
        const data = await res.json();
        if (data.success && data.order) {
          orders = [data.order];
        } else {
          container.innerHTML = `
            <div class="text-center py-10 space-y-3">
              <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto text-xl">
                <i class="fas fa-exclamation-circle"></i>
              </div>
              <p class="text-xs font-bold text-stone-700 dark:text-stone-300">Order Not Found</p>
              <p class="text-[11px] text-stone-400 max-w-xs mx-auto">No order found matching "${specificOrderNumber}". Please double-check the order number.</p>
            </div>
          `;
          return;
        }
      } else {
        const userId = this.currentUser ? this.currentUser.id : '';
        const userEmail = this.currentUser ? this.currentUser.email : (localStorage.getItem('dream_subscribed_email') || '');
        const res = await fetch(`/api/orders/my-orders?user_id=${userId}&email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (data.success && data.orders) {
          orders = data.orders;
        }
      }

      if (orders.length === 0) {
        container.innerHTML = `
          <div class="text-center py-10 space-y-3">
            <div class="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto text-xl">
              <i class="fas fa-box-open"></i>
            </div>
            <p class="text-xs font-bold text-stone-700 dark:text-stone-300">No Orders Found</p>
            <p class="text-[11px] text-stone-400 max-w-xs mx-auto">You haven't placed any orders yet, or search using your Order Number above.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = orders.map(o => {
        const items = o.items || [];
        const total = typeof o.total_amount === 'number' ? o.total_amount : (o.subtotal || 0);
        const statusColors = {
          'Placed': 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          'Processing': 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          'Shipped': 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          'Delivered': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          'Cancelled': 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
        const badgeStyle = statusColors[o.order_status] || 'bg-stone-100 text-stone-600 border-stone-200';

        return `
          <div class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-3">
            <div class="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-700/60 pb-2.5">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-xs text-[#4a3f44] dark:text-white">${o.order_number}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}">${o.order_status || 'Placed'}</span>
                </div>
                <p class="text-[10px] text-stone-400 mt-0.5">${o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</p>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-stone-900 dark:text-white block">₹${Number(total).toFixed(2)}</span>
                <span class="text-[10px] text-stone-400 font-mono">${o.tracking_number ? 'TRK: ' + o.tracking_number : 'Processing'}</span>
              </div>
            </div>

            <!-- Item Thumbnails -->
            <div class="space-y-2">
              ${items.map(i => `
                <div class="flex items-center gap-3 text-xs">
                  <img src="${i.product_image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100'}" class="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="font-bold truncate text-stone-800 dark:text-stone-200">${i.product_name || 'Clinical Formula'}</p>
                    <p class="text-[10px] text-stone-400">Qty: ${i.quantity || 1} × ₹${(i.unit_price || 0).toFixed(2)}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Footer Details & Address -->
            <div class="text-[10px] text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <span><i class="fas fa-map-marker-alt text-stone-400 mr-1"></i> ${o.shipping_address || 'Shipping details recorded'}</span>
              <span class="font-semibold text-stone-600 dark:text-stone-300">Payment: ${o.payment_method || 'Razorpay'}</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = `
        <div class="text-center py-10 space-y-3">
          <p class="text-xs font-bold text-rose-500">Failed to load orders. Please try again.</p>
        </div>
      `;
    }
  }

  handleOrderLookup(e) {
    e.preventDefault();
    const input = document.getElementById('order-lookup-input');
    const orderNum = input ? input.value.trim() : '';
    if (!orderNum) {
      this.renderMyOrdersModal();
      return;
    }
    this.renderMyOrdersModal(orderNum);
  }

  // ------------------------------------------
  // UI Renderers (Home, Shop, Details, Cart, Checkout)
  // ------------------------------------------
  renderHomePage() {
    const featured = this.allProducts.filter(p => p.is_featured).slice(0, 4);
    const bestSellers = this.allProducts.filter(p => p.is_bestseller).slice(0, 4);
    const newArrivals = this.allProducts.filter(p => p.is_new_arrival).slice(0, 4);

    const featGrid = document.getElementById('featured-products-grid');
    if (featGrid) featGrid.innerHTML = featured.map(p => this.renderProductCard(p)).join('');

    const bestGrid = document.getElementById('bestseller-products-grid');
    if (bestGrid) bestGrid.innerHTML = bestSellers.map(p => this.renderProductCard(p)).join('');

    const newGrid = document.getElementById('newarrivals-products-grid');
    if (newGrid) newGrid.innerHTML = newArrivals.map(p => this.renderProductCard(p)).join('');

    // Category Grid
    const catGrid = document.getElementById('home-categories-grid');
    if (catGrid) {
      catGrid.innerHTML = this.allCategories.slice(0, 6).map(c => `
        <div class="group glass-panel rounded-2xl p-4 text-center hover:shadow-xl transition-all border border-rose-100/50 dark:border-stone-800 flex flex-col justify-between">
          <a href="#shop" onclick="window.glowApp.filterByCategory(${c.id})" class="block cursor-pointer">
            <div class="w-16 h-16 mx-auto rounded-full overflow-hidden mb-3 border-2 border-rose-300/40 group-hover:scale-110 transition-transform">
              <img src="${c.image_url}" class="w-full h-full object-cover" />
            </div>
            <h4 class="font-bold text-sm text-stone-800 dark:text-stone-100 group-hover:text-rose-500 transition-colors mb-1.5">${c.name}</h4>
          </a>
          ${c.subcategories && c.subcategories.length > 0 ? `
            <div class="flex flex-wrap justify-center gap-1.5 pt-2.5 border-t border-stone-200/40 dark:border-stone-700/40">
              ${c.subcategories.slice(0, 3).map(s => `
                <button onclick="window.glowApp.filterBySubCategory('${s.slug || s.name}', ${c.id})" class="inline-flex items-center gap-1.5 text-[10px] pl-1 pr-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800/80 text-[#6d5f65] dark:text-stone-300 hover:bg-[#e5c1b3]/30 hover:text-[#4a3f44] dark:hover:text-[#e5c1b3] font-medium transition-all group/sub cursor-pointer shadow-2xs">
                  <img src="${s.image_url || c.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100'}" alt="${s.name}" class="w-3.5 h-3.5 rounded-full object-cover group-hover/sub:scale-110 transition-transform" onerror="this.src='${c.image_url}'" />
                  <span class="truncate max-w-[90px]">${s.name}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');
    }
  }

  renderProductCard(p) {
    const inWishlist = this.wishlistIds.has(p.id);
    const effectivePrice = p.discounted_price || p.original_price;
    const discountPercent = p.discounted_price ? Math.round(((p.original_price - p.discounted_price) / p.original_price) * 100) : 0;

    return `
      <div class="product-card glass-panel rounded-2xl overflow-hidden flex flex-col justify-between group relative border border-stone-200/60 dark:border-stone-800">
        <!-- Badges & Wishlist -->
        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          ${discountPercent > 0 ? `<span class="badge-discount text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">${discountPercent}% OFF</span>` : ''}
          ${p.is_bestseller ? `<span class="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Bestseller</span>` : ''}
        </div>

        <button onclick="window.glowApp.toggleWishlist(${p.id})" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-rose-500 transition-colors shadow-xs">
          <i class="${inWishlist ? 'fas fa-heart text-rose-500' : 'far fa-heart'}"></i>
        </button>

        <!-- Image -->
        <div class="relative h-56 overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer" onclick="window.glowApp.openProductModal(${p.id})">
          <img src="${p.main_image}" alt="${p.name}" class="img-zoom w-full h-full object-cover" />
        </div>

        <!-- Info -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
              <div class="flex items-center gap-1.5 truncate mr-1">
                <span class="font-bold text-[#4a3f44] dark:text-[#e5c1b3]">${p.brand_name || 'GlowLab'}</span>
                ${p.sub_category ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-[#e5c1b3]/20 text-[#4a3f44] dark:text-[#e5c1b3] font-semibold">${p.sub_category}</span>` : ''}
              </div>
              <span class="text-amber-500 flex items-center gap-1 font-semibold shrink-0">
                <i class="fas fa-star text-[10px]"></i> ${p.rating_avg.toFixed(1)} (${p.review_count})
              </span>
            </div>
            <h3 onclick="window.glowApp.openProductModal(${p.id})" class="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2 cursor-pointer hover:text-rose-500 transition-colors mb-2">
              ${p.name}
            </h3>
          </div>

          <div>
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg font-bold text-rose-600 dark:text-rose-400">₹${effectivePrice.toFixed(2)}</span>
              ${p.discounted_price ? `<span class="text-xs text-stone-400 line-through">₹${p.original_price.toFixed(2)}</span>` : ''}
            </div>

            <div class="flex gap-2">
              <button onclick="window.glowApp.addToCart(${p.id})" class="flex-1 bg-stone-900 hover:bg-rose-600 dark:bg-stone-800 dark:hover:bg-rose-600 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <i class="fas fa-shopping-bag"></i> Add to Bag
              </button>
              <button onclick="window.glowApp.openProductModal(${p.id})" title="Quick View" class="w-10 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-xl flex items-center justify-center text-xs transition-colors">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  openProductModal(productId) {
    const p = this.allProducts.find(prod => prod.id === productId);
    if (!p) return;

    const modal = document.getElementById('product-detail-modal');
    const content = document.getElementById('product-detail-content');
    if (!modal || !content) return;

    const effectivePrice = p.discounted_price || p.original_price;

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Image & Gallery -->
        <div>
          <div class="rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 h-80 mb-4">
            <img id="detail-main-img" src="${p.main_image}" class="w-full h-full object-cover" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-bold text-rose-500 uppercase tracking-wider">${p.brand_name || 'GlowLab'}</span>
                  ${p.category_name ? `<span class="text-[11px] text-stone-400">• ${p.category_name}</span>` : ''}
                  ${p.sub_category ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e5c1b3]/30 text-[#4a3f44] dark:text-[#e5c1b3] font-bold">${p.sub_category}</span>` : ''}
                </div>
                <h2 class="font-serif text-2xl font-bold text-stone-900 dark:text-white mt-1">${p.name}</h2>
              </div>
              <button onclick="window.glowApp.toggleWishlist(${p.id})" class="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-rose-500">
                <i class="${this.wishlistIds.has(p.id) ? 'fas fa-heart' : 'far fa-heart'}"></i>
              </button>
            </div>

            <div class="flex items-center gap-2 mb-4">
              <span class="text-amber-500 text-sm font-bold flex items-center gap-1">
                <i class="fas fa-star"></i> ${p.rating_avg.toFixed(1)}
              </span>
              <span class="text-xs text-stone-400">(${p.review_count} customer reviews)</span>
              <span class="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full ml-auto">In Stock (${p.stock_qty})</span>
            </div>

            <div class="flex items-baseline gap-3 mb-4">
              <span class="text-2xl font-bold text-rose-600 dark:text-rose-400">₹${effectivePrice.toFixed(2)}</span>
              ${p.discounted_price ? `<span class="text-sm text-stone-400 line-through">₹${p.original_price.toFixed(2)}</span>` : ''}
            </div>

            <p class="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6">${p.description}</p>

            <div class="space-y-3 mb-6 text-xs">
              <div><strong class="text-stone-900 dark:text-white">Suitable Skin Types:</strong> ${p.suitable_skin_types}</div>
              <div><strong class="text-stone-900 dark:text-white">Skin Concerns Addressed:</strong> ${p.skin_concerns}</div>
              <div><strong class="text-stone-900 dark:text-white">Key Ingredients:</strong> ${p.ingredients}</div>
              <div><strong class="text-stone-900 dark:text-white">How To Use:</strong> ${p.how_to_use}</div>
            </div>
          </div>

          <div class="flex gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
            <div class="flex items-center border border-stone-300 dark:border-stone-700 rounded-xl">
              <button onclick="let input=document.getElementById('modal-qty'); input.value=Math.max(1, parseInt(input.value)-1)" class="px-3 py-2 text-stone-600 dark:text-stone-300">-</button>
              <input id="modal-qty" type="number" value="1" min="1" class="w-12 text-center text-sm font-bold bg-transparent border-0 focus:outline-none dark:text-white" />
              <button onclick="let input=document.getElementById('modal-qty'); input.value=parseInt(input.value)+1" class="px-3 py-2 text-stone-600 dark:text-stone-300">+</button>
            </div>
            <button onclick="window.glowApp.addToCart(${p.id}, parseInt(document.getElementById('modal-qty').value)); document.getElementById('product-detail-modal').classList.add('hidden')" class="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl transition-colors">
              Add To Bag
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  // Filter Shop Products
  filterShopProducts() {
    const search = document.getElementById('shop-search-input')?.value || '';
    const categoryId = document.getElementById('shop-category-select')?.value || '';
    const subCategory = document.getElementById('shop-subcategory-select')?.value || '';
    const skinType = document.getElementById('shop-skintype-select')?.value || '';
    const skinConcern = document.getElementById('shop-concern-select')?.value || '';
    const sortBy = document.getElementById('shop-sort-select')?.value || 'newest';

    const url = `/api/products?search=${encodeURIComponent(search)}&category_id=${categoryId}&sub_category=${encodeURIComponent(subCategory)}&skin_type=${skinType}&skin_concern=${skinConcern}&sort_by=${sortBy}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const shopGrid = document.getElementById('shop-products-grid');
          const countLabel = document.getElementById('shop-result-count');
          if (countLabel) countLabel.textContent = `${data.count} items found`;

          if (shopGrid) {
            if (data.products.length === 0) {
              shopGrid.innerHTML = `
                <div class="col-span-full text-center py-16">
                  <i class="fas fa-spa text-4xl text-rose-300 mb-3"></i>
                  <p class="text-stone-500 font-medium">No products match your selected filters.</p>
                </div>
              `;
            } else {
              shopGrid.innerHTML = data.products.map(p => this.renderProductCard(p)).join('');
            }
          }
        }
      });
  }

  filterByCategory(catId) {
    const select = document.getElementById('shop-category-select');
    if (select) select.value = catId;
    window.location.hash = 'shop';
    this.onCategoryFilterChange();
  }

  // Cart Drawer & Checkout
  renderCartDrawer() {
    const drawerList = document.getElementById('cart-drawer-list');
    const drawerSubtotal = document.getElementById('cart-drawer-subtotal');
    if (!drawerList) return;

    if (this.cart.length === 0) {
      drawerList.innerHTML = `
        <div class="text-center py-12 text-stone-400">
          <i class="fas fa-shopping-bag text-4xl mb-3"></i>
          <p class="text-sm font-medium">Your shopping bag is empty.</p>
        </div>
      `;
      if (drawerSubtotal) drawerSubtotal.textContent = '₹0.00';
      return;
    }

    let subtotal = 0;
    drawerList.innerHTML = this.cart.map(item => {
      const p = item.product;
      subtotal += item.totalPrice;
      return `
        <div class="flex gap-3 items-center border-b border-stone-200 dark:border-stone-800 pb-3">
          <img src="${p.main_image}" class="w-16 h-16 rounded-xl object-cover shrink-0" />
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-xs truncate text-stone-900 dark:text-white">${p.name}</h4>
            <p class="text-xs text-rose-600 font-semibold mt-0.5">₹${p.unitPrice.toFixed(2)}</p>
            <div class="flex items-center gap-2 mt-2">
              <button onclick="window.glowApp.updateCartQuantity(${item.id}, ${item.quantity - 1})" class="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-xs font-bold">-</button>
              <span class="text-xs font-bold text-stone-800 dark:text-stone-200">${item.quantity}</span>
              <button onclick="window.glowApp.updateCartQuantity(${item.id}, ${item.quantity + 1})" class="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-xs font-bold">+</button>
            </div>
          </div>
          <button onclick="window.glowApp.updateCartQuantity(${item.id}, 0)" class="text-stone-400 hover:text-rose-500 text-xs">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    if (drawerSubtotal) drawerSubtotal.textContent = '₹' + subtotal.toFixed(2);
  }

  async openCheckoutModal() {
    if (this.cart.length === 0) {
      this.showToast('Your shopping bag is empty!', 'info');
      return;
    }

    // Require User Authentication for Checkout
    if (!this.currentUser) {
      this.pendingCheckoutAfterLogin = true;
      this.showToast('Please sign in or create an account to proceed to checkout', 'info');
      
      // Close cart drawer if open so modal is prominent
      const cartDrawer = document.getElementById('cart-drawer');
      if (cartDrawer) cartDrawer.classList.add('translate-x-full');

      const notice = document.getElementById('auth-checkout-notice');
      if (notice) notice.classList.remove('hidden');

      this.openAuthModal('login');
      return;
    }

    const modal = document.getElementById('checkout-modal');
    const formView = document.getElementById('checkout-form-view');
    const successView = document.getElementById('checkout-success-view');

    if (!modal) return;

    // Reset views & button
    if (formView) formView.classList.remove('hidden');
    if (successView) {
      successView.classList.add('hidden');
      successView.classList.remove('flex');
    }
    const submitBtn = document.getElementById('btn-place-order');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> Place Order Now`;
    }

    // Pre-fill user details
    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    if (this.currentUser) {
      if (nameInput) nameInput.value = this.currentUser.full_name || '';
      if (emailInput) emailInput.value = this.currentUser.email || '';
    }

    // Populate Free Sample Bottle product selector & verify 1st-order eligibility
    await this.populateSampleSelect();

    // Load Razorpay config & custom key if set
    await this.loadRazorpayKeyConfig();

    // Render Cart Items preview inside checkout column
    this.renderCheckoutItemsPreview();

    // Calculate subtotal & grand totals
    this.updateCheckoutTotals();

    // Hide cart drawer if open
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) cartDrawer.classList.add('translate-x-full');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  renderCheckoutItemsPreview() {
    const list = document.getElementById('checkout-items-preview-list');
    const badge = document.getElementById('checkout-items-count-badge');
    if (!list) return;

    const totalQty = this.cart.reduce((s, i) => s + i.quantity, 0);
    if (badge) badge.textContent = `${totalQty} Item${totalQty === 1 ? '' : 's'}`;

    if (this.cart.length === 0) {
      list.innerHTML = `<div class="text-center py-4 text-xs text-stone-400">Your shopping bag is empty</div>`;
      return;
    }

    list.innerHTML = this.cart.map(item => `
      <div class="flex items-center gap-3 pt-2">
        <div class="relative w-12 h-12 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 overflow-hidden shrink-0">
          <img src="${item.product.main_image || '/public/assets/images/placeholder.jpg'}" alt="${item.product.name}" class="w-full h-full object-cover" />
          <span class="absolute -top-1 -right-1 bg-[#4a3f44] text-[#e5c1b3] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
            ${item.quantity}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <h5 class="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">${item.product.name}</h5>
          <p class="text-[10px] text-stone-500 truncate">${item.product.category_name || 'Skincare'} • ₹${item.product.unitPrice.toFixed(2)} each</p>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-stone-900 dark:text-white">₹${item.totalPrice.toFixed(2)}</span>
        </div>
      </div>
    `).join('');
  }

  updateCheckoutTotals() {
    let subtotal = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);

    // Delivery Method
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'standard';
    let shipping = subtotal >= 50 ? 0 : 5.99;
    if (deliveryMethod === 'priority') {
      shipping = 9.99;
    }

    // Free shipping threshold label for standard
    const stdPriceEl = document.getElementById('delivery-option-standard-price');
    if (stdPriceEl) {
      stdPriceEl.textContent = subtotal >= 50 ? 'FREE' : '₹5.99';
    }

    // Coupon discount
    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.type === 'percent') {
        discount = subtotal * (this.appliedCoupon.value / 100);
      } else if (this.appliedCoupon.type === 'freeship') {
        shipping = 0;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = discountedSubtotal * 0.08;
    const grandTotal = discountedSubtotal + tax + shipping;

    const subEl = document.getElementById('checkout-summary-subtotal');
    const shipEl = document.getElementById('checkout-summary-shipping');
    const taxEl = document.getElementById('checkout-summary-tax');
    const totalEl = document.getElementById('checkout-summary-total');
    const discountLine = document.getElementById('checkout-summary-discount-line');
    const discountCodeEl = document.getElementById('checkout-summary-promo-code');
    const discountAmtEl = document.getElementById('checkout-summary-discount-amount');

    if (subEl) subEl.textContent = '₹' + subtotal.toFixed(2);
    if (shipEl) shipEl.textContent = shipping === 0 ? 'FREE' : '₹' + shipping.toFixed(2);
    if (taxEl) taxEl.textContent = '₹' + tax.toFixed(2);
    if (totalEl) totalEl.textContent = '₹' + grandTotal.toFixed(2);

    if (discount > 0 && discountLine) {
      discountLine.classList.remove('hidden');
      discountLine.classList.add('flex');
      if (discountCodeEl) discountCodeEl.textContent = this.appliedCoupon.code;
      if (discountAmtEl) discountAmtEl.textContent = '-₹' + discount.toFixed(2);
    } else if (discountLine) {
      discountLine.classList.add('hidden');
      discountLine.classList.remove('flex');
    }
  }

  applyPromoCode() {
    const input = document.getElementById('checkout-promo-input');
    const status = document.getElementById('checkout-promo-status');
    if (!input || !status) return;

    const code = input.value.trim().toUpperCase();
    if (!code) {
      this.showToast('Please enter a promo code', 'error');
      return;
    }

    if (code === 'GLOW10' || code === 'WELCOME10') {
      this.appliedCoupon = { code: code, type: 'percent', value: 10 };
      status.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1';
      status.innerHTML = `<i class="fas fa-check-circle"></i> Applied ${code} (10% Off Your Order)`;
      status.classList.remove('hidden');
      this.showToast(`Applied ${code}: 10% discount!`, 'success');
    } else if (code === 'GLOW20' || code === 'WELCOME20') {
      this.appliedCoupon = { code: code, type: 'percent', value: 20 };
      status.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1';
      status.innerHTML = `<i class="fas fa-check-circle"></i> Applied ${code} (20% Off Your Order)`;
      status.classList.remove('hidden');
      this.showToast(`Applied ${code}: 20% discount!`, 'success');
    } else if (code === 'FREESHIP') {
      this.appliedCoupon = { code: code, type: 'freeship', value: 0 };
      status.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1';
      status.innerHTML = `<i class="fas fa-check-circle"></i> Applied FREESHIP (Complimentary Shipping)`;
      status.classList.remove('hidden');
      this.showToast('Applied FREESHIP: Free shipping on your order!', 'success');
    } else {
      status.className = 'text-[10px] font-bold text-rose-600 flex items-center gap-1';
      status.innerHTML = `<i class="fas fa-exclamation-circle"></i> Invalid Code. Try GLOW10 or WELCOME20`;
      status.classList.remove('hidden');
      this.showToast('Invalid promo code. Try GLOW10 or WELCOME20', 'error');
    }

    this.updateCheckoutTotals();
  }

  selectExpressPayment(method) {
    const radio = document.querySelector(`input[name="payment_method"][value="${method}"]`);
    if (radio) {
      radio.checked = true;
      this.togglePaymentFields(method);
      this.showToast(`Selected express ${method} checkout`, 'info');
    }
  }

  // ------------------------------------------
  // Payment Methods & Formatting
  // ------------------------------------------
  togglePaymentFields(method) {
    const razorpayBox = document.getElementById('payment-details-razorpay');
    const codBox = document.getElementById('payment-details-cod');

    if (razorpayBox) razorpayBox.classList.add('hidden');
    if (codBox) codBox.classList.add('hidden');

    if (method === 'Razorpay' && razorpayBox) razorpayBox.classList.remove('hidden');
    if (method === 'Cash on Delivery' && codBox) codBox.classList.remove('hidden');
  }

  async loadRazorpayKeyConfig() {
    const input = document.getElementById('razorpay-custom-key-input');
    const status = document.getElementById('razorpay-key-status');
    const savedKey = localStorage.getItem('razorpay_custom_key_id');

    if (input && savedKey) {
      input.value = savedKey;
      if (status) status.textContent = 'Custom Key Connected';
    } else {
      try {
        const res = await fetch('/api/razorpay/config');
        const data = await res.json();
        if (data.success && data.key_id && input && !input.value) {
          input.value = data.key_id;
          if (status) status.textContent = data.configured ? 'Env Key Active' : 'Demo Mode Active';
        }
      } catch (e) {
        // Fallback
      }
    }
  }

  saveRazorpayCustomKey() {
    const input = document.getElementById('razorpay-custom-key-input');
    const status = document.getElementById('razorpay-key-status');
    if (!input) return;

    const val = input.value.trim();
    if (val) {
      localStorage.setItem('razorpay_custom_key_id', val);
      if (status) {
        status.textContent = 'Key Saved!';
        status.className = 'text-[9px] font-bold text-emerald-600 dark:text-emerald-400';
      }
      this.showToast('Razorpay Key ID saved successfully!', 'success');
    } else {
      localStorage.removeItem('razorpay_custom_key_id');
      if (status) {
        status.textContent = 'Default Key Active';
        status.className = 'text-[9px] font-bold text-indigo-600 dark:text-indigo-400';
      }
      this.showToast('Cleared custom key. Using default Razorpay config.', 'info');
    }
  }

  formatCardNumber(input) {
    if (!input) return;
    let v = input.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < v.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += v[i];
    }
    input.value = formatted.substring(0, 19);

    const icon = document.getElementById('card-brand-icon');
    if (icon) {
      if (v.startsWith('4')) {
        icon.className = 'fab fa-cc-visa absolute right-3 top-2.5 text-blue-600 text-sm';
      } else if (v.startsWith('5')) {
        icon.className = 'fab fa-cc-mastercard absolute right-3 top-2.5 text-orange-500 text-sm';
      } else if (v.startsWith('3')) {
        icon.className = 'fab fa-cc-amex absolute right-3 top-2.5 text-blue-400 text-sm';
      } else if (v.startsWith('6')) {
        icon.className = 'fab fa-cc-discover absolute right-3 top-2.5 text-orange-600 text-sm';
      } else {
        icon.className = 'fas fa-credit-card absolute right-3 top-2.5 text-stone-400 text-sm';
      }
    }
  }

  formatCardExpiry(input) {
    if (!input) return;
    let v = input.value.replace(/\D/g, '');
    if (v.length >= 2) {
      input.value = v.substring(0, 2) + '/' + v.substring(2, 4);
    } else {
      input.value = v;
    }
  }

  getSavedCards() {
    return JSON.parse(localStorage.getItem('dream_saved_cards') || '[{"id":1,"holder":"Jane Doe","brand":"Visa","last4":"4242","expiry":"12/28","isDefault":true}]');
  }

  renderSavedPaymentMethodsModal() {
    const modal = document.getElementById('saved-payment-methods-modal');
    const container = document.getElementById('saved-cards-list');
    if (!modal || !container) return;

    const cards = this.getSavedCards();
    if (cards.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-xs text-stone-400">No saved payment cards yet. Add one below!</div>`;
    } else {
      container.innerHTML = cards.map(c => `
        <div class="bg-stone-50 dark:bg-stone-800 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-lg text-[#4a3f44] dark:text-[#e5c1b3]">
              <i class="fab fa-cc-${c.brand.toLowerCase() || 'visa'}"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-stone-800 dark:text-white flex items-center gap-1.5">
                <span>${c.brand} •••• ${c.last4}</span>
                ${c.isDefault ? `<span class="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">Default</span>` : ''}
              </div>
              <p class="text-[10px] text-stone-500">${c.holder} • Exp ${c.expiry}</p>
            </div>
          </div>
          <button type="button" onclick="window.glowApp?.removeSavedCard(${c.id})" class="text-rose-500 hover:text-rose-700 text-xs p-1 cursor-pointer">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `).join('');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  savePaymentCard(cardData) {
    const cards = this.getSavedCards();
    const cleanNum = cardData.cardNumber.replace(/\s/g, '');
    const newCard = {
      id: Date.now(),
      holder: cardData.holder || 'Valued Customer',
      brand: cleanNum.startsWith('5') ? 'Mastercard' : cleanNum.startsWith('3') ? 'Amex' : 'Visa',
      last4: cleanNum.slice(-4) || '4242',
      expiry: cardData.expiry || '12/28',
      isDefault: cards.length === 0
    };
    cards.push(newCard);
    localStorage.setItem('dream_saved_cards', JSON.stringify(cards));
    this.showToast(`Saved ${newCard.brand} •••• ${newCard.last4} to your wallet!`, 'success');
    this.renderSavedPaymentMethodsModal();
  }

  removeSavedCard(id) {
    let cards = this.getSavedCards().filter(c => c.id !== id);
    if (cards.length > 0 && !cards.some(c => c.isDefault)) {
      cards[0].isDefault = true;
    }
    localStorage.setItem('dream_saved_cards', JSON.stringify(cards));
    this.showToast('Payment method removed', 'info');
    this.renderSavedPaymentMethodsModal();
  }

  async checkFirstOrderEligibility(email = '') {
    const userId = this.currentUser ? this.currentUser.id : '';
    const sampleBox = document.getElementById('checkout-first-order-sample-box');
    const noticeBox = document.getElementById('checkout-returning-customer-notice');
    const sampleSummaryLine = document.getElementById('checkout-summary-sample-line');

    try {
      const query = new URLSearchParams();
      if (userId) query.set('user_id', userId.toString());
      if (email) query.set('email', email);

      const res = await fetch(`/api/orders/check-first-order?${query.toString()}`);
      const data = await res.json();
      
      const isFirstOrder = data.success ? data.isFirstOrder : true;

      if (isFirstOrder) {
        if (sampleBox) sampleBox.classList.remove('hidden');
        if (noticeBox) noticeBox.classList.add('hidden');
        if (sampleSummaryLine) sampleSummaryLine.classList.remove('hidden');
      } else {
        if (sampleBox) sampleBox.classList.add('hidden');
        if (noticeBox) noticeBox.classList.remove('hidden');
        if (sampleSummaryLine) sampleSummaryLine.classList.add('hidden');
      }
      return isFirstOrder;
    } catch (err) {
      return true;
    }
  }

  async populateSampleSelect() {
    const sampleSelect = document.getElementById('checkout-sample-product-select');
    const emailInput = document.getElementById('checkout-email');
    const currentEmail = emailInput ? emailInput.value.trim() : (this.currentUser ? this.currentUser.email : '');

    const isFirstOrder = await this.checkFirstOrderEligibility(currentEmail);

    if (!sampleSelect) return;

    if (!this.allProducts || this.allProducts.length === 0) {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) this.allProducts = data.products;
      } catch (err) {}
    }

    if (this.allProducts && this.allProducts.length > 0) {
      sampleSelect.innerHTML = this.allProducts.map((p, idx) => `
        <option value="${p.id}" ${idx === 0 ? 'selected' : ''}>
          Deluxe Sample Bottle: ${p.name} (${p.category_name || 'Clinical Formula'}) - $0.00 FREE
        </option>
      `).join('');
    }
  }

  async handleCheckoutSubmit(e) {
    e.preventDefault();
    if (this.cart.length === 0) {
      this.showToast('Your shopping bag is empty!', 'error');
      return;
    }

    if (!this.currentUser) {
      this.showToast('Sign in is required to place your order', 'error');
      this.pendingCheckoutAfterLogin = true;
      document.getElementById('checkout-modal')?.classList.add('hidden');
      const notice = document.getElementById('auth-checkout-notice');
      if (notice) notice.classList.remove('hidden');
      this.openAuthModal('login');
      return;
    }

    const name = document.getElementById('checkout-name')?.value.trim();
    const email = document.getElementById('checkout-email')?.value.trim();
    const address = document.getElementById('checkout-address')?.value.trim();
    const city = document.getElementById('checkout-city')?.value.trim();
    const zip = document.getElementById('checkout-zip')?.value.trim();
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'Razorpay';

    if (!name || !email || !address || !city || !zip) {
      this.showToast('Please fill out all required shipping fields', 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-place-order');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Processing Order...</span>`;
    }

    const fullAddress = `${address}, ${city}, ${zip}`;
    let subtotal = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);

    // Verify first order status before attaching free gift
    const isFirstOrder = await this.checkFirstOrderEligibility(email);

    // Read selected free sample bottle only if eligible for 1st order
    const sampleSelect = document.getElementById('checkout-sample-product-select');
    const selectedSampleId = (isFirstOrder && sampleSelect) ? parseInt(sampleSelect.value) : null;
    const selectedSampleProduct = selectedSampleId ? this.allProducts.find(p => p.id === selectedSampleId) : null;

    const itemsPayload = this.cart.map(i => ({
      product_id: i.product.id,
      product_name: i.product.name,
      product_image: i.product.main_image,
      unit_price: i.product.unitPrice,
      quantity: i.quantity
    }));

    if (selectedSampleProduct) {
      itemsPayload.push({
        product_id: selectedSampleProduct.id,
        product_name: `[FREE GIFT] Sample Bottle - ${selectedSampleProduct.name}`,
        product_image: selectedSampleProduct.main_image,
        unit_price: 0,
        quantity: 1
      });
    }

    const orderPayload = {
      user_id: this.currentUser ? this.currentUser.id : null,
      customer_name: name,
      customer_email: email,
      shipping_address: fullAddress,
      payment_method: paymentMethod,
      items: itemsPayload,
      subtotal: subtotal,
      applied_coupon: this.appliedCoupon ? this.appliedCoupon.code : null
    };

    // Calculate Grand Total for Razorpay
    let deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'standard';
    let shipping = subtotal >= 50 ? 0 : 5.99;
    if (deliveryMethod === 'priority') shipping = 9.99;

    let discount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.type === 'percent') discount = subtotal * (this.appliedCoupon.value / 100);
      else if (this.appliedCoupon.type === 'freeship') shipping = 0;
    }
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = discountedSubtotal * 0.08;
    const grandTotal = discountedSubtotal + tax + shipping;

    if (paymentMethod === 'Razorpay') {
      try {
        const rpRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'INR',
            notes: { customer_name: name, customer_email: email }
          })
        });
        const rpData = await rpRes.json();

        if (rpData.success && rpData.order) {
          const customKey = document.getElementById('razorpay-custom-key-input')?.value.trim() || localStorage.getItem('razorpay_custom_key_id');
          const activeKeyId = customKey || rpData.key_id || 'rzp_test_glow_demo';

          const options = {
            key: activeKeyId,
            amount: rpData.order.amount,
            currency: rpData.order.currency || 'INR',
            name: "DREAM Skincare",
            description: `Order Checkout - ${this.cart.length} item(s)`,
            image: "/assets/images/logo-icon.svg",
            order_id: rpData.order.id,
            prefill: {
              name: name,
              email: email
            },
            theme: {
              color: "#4a3f44"
            },
            handler: async (response) => {
              try {
                this.showToast('Razorpay payment authorized! Finalizing order...', 'info');
                await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(response)
                });
                orderPayload.payment_method = 'Razorpay';
                orderPayload.razorpay_payment_id = response.razorpay_payment_id;
                await this.submitFinalOrderPayload(orderPayload, selectedSampleProduct);
              } catch (err) {
                this.showToast('Razorpay payment verification failed', 'error');
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> Place Order Now`;
                }
              }
            },
            modal: {
              ondismiss: () => {
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> Place Order Now`;
                }
                this.showToast('Razorpay payment window closed.', 'info');
              }
            }
          };

          if (typeof window.Razorpay !== 'undefined') {
            const rzp = new window.Razorpay(options);
            rzp.open();
          } else {
            // Fallback mode
            this.showToast('Processing Razorpay transaction in express mode...', 'info');
            orderPayload.payment_method = 'Razorpay';
            await this.submitFinalOrderPayload(orderPayload, selectedSampleProduct);
          }
        } else {
          this.showToast(rpData.error || 'Failed to initialize Razorpay checkout', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> Place Order Now`;
          }
        }
      } catch (err) {
        this.showToast('Razorpay service error', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> Place Order Now`;
        }
      }
    } else {
      // Direct checkout for other payment methods
      await this.submitFinalOrderPayload(orderPayload, selectedSampleProduct);
    }
  }

  async submitFinalOrderPayload(orderPayload, selectedSampleProduct) {
    const submitBtn = document.getElementById('btn-place-order');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        this.appliedCoupon = null;
        await this.refreshCart();

        const formView = document.getElementById('checkout-form-view');
        const successView = document.getElementById('checkout-success-view');
        const numEl = document.getElementById('order-success-num');
        const trackEl = document.getElementById('order-success-tracking');
        const sampleNote = document.getElementById('order-success-sample-note');
        const sampleText = document.getElementById('order-success-sample-text');

        if (numEl) numEl.textContent = data.order.order_number;
        if (trackEl) trackEl.textContent = data.order.tracking_number;

        if (selectedSampleProduct && sampleNote && sampleText) {
          sampleText.innerHTML = `🎁 <strong>Free Gift Included:</strong> Deluxe Sample Bottle of <em>${selectedSampleProduct.name}</em> ($0.00)`;
          sampleNote.classList.remove('hidden');
          sampleNote.classList.add('flex');
        } else if (sampleNote) {
          sampleNote.classList.add('hidden');
        }

        if (formView) formView.classList.add('hidden');
        if (successView) {
          successView.classList.remove('hidden');
          successView.classList.add('flex');
        }

        if (selectedSampleProduct) {
          this.showToast('Order placed successfully with your free first-order sample gift!', 'success');
        } else {
          this.showToast('Order placed successfully! Thank you for your purchase.', 'success');
        }
      } else {
        this.showToast(data.error || 'Failed to place order', 'error');
      }
    } catch (err) {
      this.showToast('Server error placing order', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> Place Order Now`;
      }
    }
  }

  // ------------------------------------------
  // Newsletter Subscription Action
  // ------------------------------------------
  async handleNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const statusMsg = document.getElementById('newsletter-status-msg');
    const submitBtn = document.getElementById('btn-newsletter-submit');

    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      if (statusMsg) {
        statusMsg.className = 'text-[11px] p-3 rounded-xl border bg-rose-950/60 border-rose-800 text-rose-300 block';
        statusMsg.innerHTML = '<i class="fas fa-exclamation-circle mr-1.5"></i> Please enter a valid email address.';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Subscribing...</span>`;
    }

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer_newsletter' })
      });
      const data = await res.json();

      if (data.success) {
        if (statusMsg) {
          statusMsg.className = 'text-[11px] p-3 rounded-xl border bg-emerald-950/80 border-emerald-700/80 text-emerald-200 block';
          statusMsg.innerHTML = `
            <div class="flex items-start gap-2">
              <i class="fas fa-check-circle text-emerald-400 text-sm mt-0.5 shrink-0"></i>
              <div>
                <p class="font-bold text-white">${data.message}</p>
                <p class="text-[10px] text-emerald-300 mt-0.5">Use discount code <span class="font-mono font-bold underline bg-emerald-900/60 px-1.5 py-0.5 rounded">${data.discount_code || 'GLOW15'}</span> at checkout for 15% off!</p>
              </div>
            </div>
          `;
        }
        this.showToast('Welcome to DREAM Beauty Insider Club! 15% off code: GLOW15', 'success');
        if (emailInput) emailInput.value = '';
        localStorage.setItem('dream_subscribed_email', email);
      } else {
        if (statusMsg) {
          statusMsg.className = 'text-[11px] p-3 rounded-xl border bg-rose-950/60 border-rose-800 text-rose-300 block';
          statusMsg.innerHTML = `<i class="fas fa-exclamation-circle mr-1.5"></i> ${data.error || 'Failed to subscribe.'}`;
        }
        this.showToast(data.error || 'Subscription failed', 'error');
      }
    } catch (err) {
      if (statusMsg) {
        statusMsg.className = 'text-[11px] p-3 rounded-xl border bg-rose-950/60 border-rose-800 text-rose-300 block';
        statusMsg.innerHTML = `<i class="fas fa-exclamation-triangle mr-1.5"></i> Server error. Please try again later.`;
      }
      this.showToast('Newsletter subscription server error', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Subscribe</span> <i class="fas fa-arrow-right text-[10px]"></i>`;
      }
    }
  }

  // ------------------------------------------
  // User Authentication UI
  // ------------------------------------------
  updateUserUI() {
    const userBtn = document.getElementById('nav-user-btn');
    if (userBtn) {
      if (this.currentUser) {
        const initial = (this.currentUser.full_name || 'U').charAt(0).toUpperCase();
        const firstName = (this.currentUser.full_name || 'User').split(' ')[0];
        userBtn.innerHTML = `
          <span class="w-7 h-7 rounded-full bg-[#4a3f44] text-[#e5c1b3] font-serif font-bold flex items-center justify-center text-xs shadow-xs">
            ${initial}
          </span>
          <span class="text-xs font-bold text-[#4a3f44] dark:text-stone-200 hidden md:inline pr-1">${firstName}</span>
        `;
      } else {
        userBtn.innerHTML = `<i class="fas fa-user text-[#4a3f44] dark:text-stone-200 px-1 text-xs"></i><span class="text-xs font-bold text-[#4a3f44] dark:text-stone-200 hidden md:inline pr-1">Sign In</span>`;
      }
    }

    // Update Cart Drawer Checkout Button State
    const cartCheckoutBtn = document.getElementById('btn-cart-checkout');
    if (cartCheckoutBtn) {
      if (this.currentUser) {
        cartCheckoutBtn.innerHTML = `<i class="fas fa-lock text-xs"></i> <span>Proceed To Checkout</span>`;
      } else {
        cartCheckoutBtn.innerHTML = `<i class="fas fa-user-lock text-xs text-[#e5c1b3]"></i> <span>Sign In To Checkout</span>`;
      }
    }
  }

  handleUserNavClick() {
    if (this.currentUser) {
      const modal = document.getElementById('user-profile-modal');
      if (!modal) return;

      const avatar = document.getElementById('profile-modal-avatar');
      const name = document.getElementById('profile-modal-name');
      const email = document.getElementById('profile-modal-email');
      const badge = document.getElementById('profile-provider-badge');

      if (avatar) avatar.textContent = (this.currentUser.full_name || 'D').charAt(0).toUpperCase();
      if (name) name.textContent = this.currentUser.full_name || 'DREAM Member';
      if (email) email.textContent = this.currentUser.email || 'user@example.com';
      if (badge) {
        badge.innerHTML = `<i class="fas fa-user-check text-emerald-500"></i> Authenticated Account`;
      }

      const editName = document.getElementById('profile-edit-name');
      const editPhone = document.getElementById('profile-edit-phone');
      const editPass = document.getElementById('profile-edit-password');
      if (editName) editName.value = this.currentUser.full_name || '';
      if (editPhone) editPhone.value = this.currentUser.phone || '';
      if (editPass) editPass.value = '';

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      this.openAuthModal('login');
    }
  }

  async handleSaveUserProfile(e) {
    e.preventDefault();
    if (!this.currentUser) return;
    const btn = document.getElementById('btn-save-profile-changes');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Saving Changes...';
    }

    const full_name = document.getElementById('profile-edit-name')?.value?.trim();
    const phone = document.getElementById('profile-edit-phone')?.value?.trim();
    const password = document.getElementById('profile-edit-password')?.value?.trim();

    try {
      const payload = { user_id: this.currentUser.id, full_name, phone };
      if (password && password.length > 0) {
        payload.password = password;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.currentUser = { ...this.currentUser, ...data.user };
        localStorage.setItem('dream_user', JSON.stringify(this.currentUser));
        this.updateUserUI();

        const avatar = document.getElementById('profile-modal-avatar');
        const name = document.getElementById('profile-modal-name');
        if (avatar) avatar.textContent = (data.user.full_name || 'D').charAt(0).toUpperCase();
        if (name) name.textContent = data.user.full_name || 'DREAM Member';

        const passInput = document.getElementById('profile-edit-password');
        if (passInput) passInput.value = '';

        this.showToast('Your profile changes have been saved!', 'success');
      } else {
        this.showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      this.showToast('Server error saving profile changes', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  }

  openAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.clearAuthErrors();
    const notice = document.getElementById('auth-checkout-notice');
    if (notice && !this.pendingCheckoutAfterLogin) {
      notice.classList.add('hidden');
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.switchAuthTab(tab);
  }

  clearAuthErrors() {
    const loginErr = document.getElementById('login-error-msg');
    const regErr = document.getElementById('reg-error-msg');
    if (loginErr) loginErr.classList.add('hidden');
    if (regErr) regErr.classList.add('hidden');
  }

  showLoginError(msg) {
    const loginErr = document.getElementById('login-error-msg');
    if (loginErr) {
      const span = loginErr.querySelector('.msg-text');
      if (span) span.textContent = msg;
      loginErr.classList.remove('hidden');
    } else {
      this.showToast(msg, 'error');
    }
  }

  showRegError(msg) {
    const regErr = document.getElementById('reg-error-msg');
    if (regErr) {
      const span = regErr.querySelector('.msg-text');
      if (span) span.textContent = msg;
      regErr.classList.remove('hidden');
    } else {
      this.showToast(msg, 'error');
    }
  }

  switchAuthTab(tab) {
    this.clearAuthErrors();
    const loginForm = document.getElementById('auth-login-form') || document.getElementById('form-login');
    const regForm = document.getElementById('auth-register-form') || document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabReg = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      loginForm?.classList.remove('hidden');
      regForm?.classList.add('hidden');
      tabLogin?.classList.add('border-[#4a3f44]', 'text-[#4a3f44]', 'dark:text-[#e5c1b3]');
      tabLogin?.classList.remove('border-transparent', 'text-[#6d5f65]');
      tabReg?.classList.remove('border-[#4a3f44]', 'text-[#4a3f44]', 'dark:text-[#e5c1b3]');
      tabReg?.classList.add('border-transparent', 'text-[#6d5f65]');
    } else {
      loginForm?.classList.add('hidden');
      regForm?.classList.remove('hidden');
      tabReg?.classList.add('border-[#4a3f44]', 'text-[#4a3f44]', 'dark:text-[#e5c1b3]');
      tabReg?.classList.remove('border-transparent', 'text-[#6d5f65]');
      tabLogin?.classList.remove('border-[#4a3f44]', 'text-[#4a3f44]', 'dark:text-[#e5c1b3]');
      tabLogin?.classList.add('border-transparent', 'text-[#6d5f65]');
    }
  }

  handleForgotPassword() {
    const emailVal = document.getElementById('login-email')?.value || '';
    const email = prompt('Reset Your DREAM Password:\nPlease enter your registered email address:', emailVal);
    if (!email) return;

    this.showToast(`A password reset link has been sent to ${email}`, 'success');
  }

  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  }

  async loginAsDemo() {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if (emailInput) emailInput.value = 'jane@example.com';
    if (passInput) passInput.value = 'password123';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com', password: 'password123' })
      });
      const data = await res.json();
      if (data.success) {
        this.currentUser = data.user;
        localStorage.setItem('dream_user', JSON.stringify(data.user));
        this.updateUserUI();
        this.refreshWishlist();
        this.showToast(`Welcome, ${data.user.full_name}! (Demo Mode)`, 'success');
        document.getElementById('auth-modal')?.classList.add('hidden');

        if (this.pendingCheckoutAfterLogin) {
          this.pendingCheckoutAfterLogin = false;
          setTimeout(() => this.openCheckoutModal(), 200);
        }
      }
    } catch (err) {
      this.showToast('Demo login error', 'error');
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('dream_user');
    localStorage.removeItem('glowai_user');
    this.updateUserUI();
    this.showToast('Logged out successfully', 'info');
    window.location.hash = '';
  }

  bindEvents() {
    // Theme Toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    // Cart Drawer Toggle
    document.querySelectorAll('[data-action="toggle-cart"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const drawer = document.getElementById('cart-drawer');
        drawer?.classList.toggle('translate-x-full');
      });
    });

    // Close Modals (Close button click or backdrop click)
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-modal"]')) {
        e.target.closest('.modal-container')?.classList.add('hidden');
      } else if (e.target.classList.contains('modal-container')) {
        e.target.classList.add('hidden');
      }
    });

    // Close Modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-container').forEach(m => m.classList.add('hidden'));
      }
    });

    // Hash Route Navigation Listener
    const handleHashRoute = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#login') {
        this.openAuthModal('login');
      } else if (hash === '#register' || hash === '#signup') {
        this.openAuthModal('register');
      } else if (hash === '#profile') {
        this.handleUserNavClick();
      }
    };
    window.addEventListener('hashchange', handleHashRoute);
    handleHashRoute();

    // Search input listener
    const searchInput = document.getElementById('shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterShopProducts());
    }

    // Login Form Submit (supports both #auth-login-form and #form-login)
    const handleLoginSubmit = async (e) => {
      e.preventDefault();
      this.clearAuthErrors();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const submitBtn = document.getElementById('btn-login-submit') || e.target.querySelector('button[type="submit"]');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!email || !password) {
        this.showLoginError('Please enter both email address and password.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Authenticating...</span>`;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          this.currentUser = data.user;
          localStorage.setItem('dream_user', JSON.stringify(data.user));
          this.updateUserUI();
          this.refreshWishlist();
          this.showToast(`Welcome back, ${data.user.full_name}!`, 'success');
          document.getElementById('auth-modal')?.classList.add('hidden');

          if (this.pendingCheckoutAfterLogin) {
            this.pendingCheckoutAfterLogin = false;
            setTimeout(() => this.openCheckoutModal(), 200);
          }
        } else {
          this.showLoginError(data.error || 'Invalid email or password.');
          this.showToast(data.error || 'Login failed', 'error');
        }
      } catch (err) {
        this.showLoginError('Network error during sign-in. Please try again.');
        this.showToast('Authentication server error', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In</span>`;
        }
      }
    };

    document.getElementById('auth-login-form')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);

    // Register Form Submit (supports both #auth-register-form and #form-register)
    const handleRegisterSubmit = async (e) => {
      e.preventDefault();
      this.clearAuthErrors();

      const fullNameInput = document.getElementById('reg-fullname');
      const emailInput = document.getElementById('reg-email');
      const phoneInput = document.getElementById('reg-phone');
      const passwordInput = document.getElementById('reg-password');
      const submitBtn = document.getElementById('btn-reg-submit') || e.target.querySelector('button[type="submit"]');

      const full_name = fullNameInput ? fullNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!full_name || !email || !password) {
        this.showRegError('Please complete all required fields.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Creating Account...</span>`;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name, email, phone, password })
        });
        const data = await res.json();
        if (data.success) {
          this.currentUser = data.user;
          localStorage.setItem('dream_user', JSON.stringify(data.user));
          this.updateUserUI();
          this.showToast('Account created successfully!', 'success');
          document.getElementById('auth-modal')?.classList.add('hidden');

          if (this.pendingCheckoutAfterLogin) {
            this.pendingCheckoutAfterLogin = false;
            setTimeout(() => this.openCheckoutModal(), 200);
          }
        } else {
          this.showRegError(data.error || 'Failed to create account.');
          this.showToast(data.error || 'Registration failed', 'error');
        }
      } catch (err) {
        this.showRegError('Network error during registration. Please try again.');
        this.showToast('Registration server error', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Create Account</span>`;
        }
      }
    };

    document.getElementById('auth-register-form')?.addEventListener('submit', handleRegisterSubmit);
    document.getElementById('form-register')?.addEventListener('submit', handleRegisterSubmit);

    // Checkout Form Submit
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));

    // Listen to email change in checkout form to update first-order eligibility dynamically
    const checkoutEmailInput = document.getElementById('checkout-email');
    if (checkoutEmailInput) {
      checkoutEmailInput.addEventListener('input', (e) => this.checkFirstOrderEligibility(e.target.value.trim()));
      checkoutEmailInput.addEventListener('change', (e) => this.checkFirstOrderEligibility(e.target.value.trim()));
    }

    // Newsletter Footer Form Submit
    document.getElementById('newsletter-footer-form')?.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));

    // My Orders Lookup Form Submit
    document.getElementById('my-orders-lookup-form')?.addEventListener('submit', (e) => this.handleOrderLookup(e));

    // Add Saved Payment Method Form Submit
    document.getElementById('add-payment-method-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const holder = document.getElementById('new-card-name')?.value.trim();
      const cardNumber = document.getElementById('new-card-number')?.value.trim();
      const expiry = document.getElementById('new-card-expiry')?.value.trim();
      const cvc = document.getElementById('new-card-cvc')?.value.trim();
      if (!cardNumber || !expiry || !cvc) {
        this.showToast('Please fill in all card details', 'error');
        return;
      }
      this.savePaymentCard({ holder, cardNumber, expiry, cvc });
      e.target.reset();
    });

    // Edit User Profile Form Submit
    document.getElementById('form-user-edit-profile')?.addEventListener('submit', (e) => this.handleSaveUserProfile(e));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.glowApp = new GlowApp();
});
