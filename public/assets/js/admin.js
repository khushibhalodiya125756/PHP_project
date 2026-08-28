// DREAM Advanced Admin Dashboard JavaScript

class AdminApp {
  constructor() {
    this.adminUser = JSON.parse(localStorage.getItem('dream_admin') || localStorage.getItem('glowai_admin') || 'null');
    this.currentTab = 'overview';
    this.products = [];
    this.orders = [];
    this.categories = [];
    this.coupons = [];
    this.reviews = [];
    this.customers = [];
    this.skinAnalyses = [];
    this.storeSettings = null;
    this.adminProfile = null;
    this.charts = {};

    this.init();
  }

  init() {
    if (this.adminUser) {
      this.showDashboard();
      this.loadDashboardData();
    } else {
      this.showLogin();
    }

    this.bindEvents();
    this.startLiveClock();
    this.setupTheme();
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('dream_theme') || localStorage.getItem('glowai_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('dream_theme', nextTheme);
  }

  startLiveClock() {
    const clockEl = document.getElementById('live-admin-clock');
    if (!clockEl) return;
    const update = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    update();
    setInterval(update, 1000);
  }

  showLogin() {
    document.getElementById('admin-login-screen')?.classList.remove('hidden');
    document.getElementById('admin-dashboard-screen')?.classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('admin-login-screen')?.classList.add('hidden');
    document.getElementById('admin-dashboard-screen')?.classList.remove('hidden');
    
    const adminNameEl = document.getElementById('admin-user-name');
    if (adminNameEl && this.adminUser) {
      adminNameEl.textContent = this.adminUser.username || 'Admin';
    }
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `p-3.5 px-4 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 text-white ${
      type === 'success' ? 'bg-emerald-600' :
      type === 'error' ? 'bg-rose-600' :
      type === 'warning' ? 'bg-amber-600' :
      'bg-[#4a3f44]'
    }`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon} text-sm"></i> <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  openConfirmModal({ title, message, confirmBtnText = 'Delete', isDanger = true, onConfirm }) {
    const modal = document.getElementById('admin-confirm-modal');
    if (!modal) {
      if (onConfirm) onConfirm();
      return;
    }

    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const actionTextEl = document.getElementById('confirm-modal-action-text');
    const actionBtn = document.getElementById('confirm-modal-action-btn');
    const cancelBtn = document.getElementById('confirm-modal-cancel-btn');
    const closeBtn = document.getElementById('confirm-modal-close-btn');
    const iconContainer = document.getElementById('confirm-modal-icon-container');
    const iconEl = document.getElementById('confirm-modal-icon');

    if (titleEl) titleEl.textContent = title || 'Confirm Action';
    if (messageEl) messageEl.textContent = message || 'Are you sure you want to proceed?';
    if (actionTextEl) actionTextEl.textContent = confirmBtnText || 'Confirm';

    if (isDanger) {
      if (iconContainer) {
        iconContainer.className = 'w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0';
      }
      if (iconEl) iconEl.className = 'fas fa-trash-alt';
      if (actionBtn) {
        actionBtn.className = 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer';
      }
    } else {
      if (iconContainer) {
        iconContainer.className = 'w-12 h-12 rounded-2xl bg-[#4a3f44]/10 dark:bg-stone-800 text-[#4a3f44] dark:text-[#e5c1b3] flex items-center justify-center text-xl shrink-0';
      }
      if (iconEl) iconEl.className = 'fas fa-exclamation-circle';
      if (actionBtn) {
        actionBtn.className = 'px-5 py-2.5 rounded-xl bg-[#4a3f44] hover:bg-[#5a4f54] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer';
      }
    }

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    };

    const handleAction = async () => {
      newActionBtn.disabled = true;
      const origText = newActionBtn.innerHTML;
      newActionBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Processing...';
      try {
        if (onConfirm) await onConfirm();
      } finally {
        newActionBtn.disabled = false;
        newActionBtn.innerHTML = origText;
        closeModal();
      }
    };

    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);
    newActionBtn.addEventListener('click', handleAction);

    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update active tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('bg-white/20', 'text-white', 'font-bold', 'border-l-4', 'border-l-[#e5c1b3]');
      } else {
        btn.classList.remove('bg-white/20', 'text-white', 'font-bold', 'border-l-4', 'border-l-[#e5c1b3]');
      }
    });

    // Hide all tab sections
    document.querySelectorAll('.admin-tab-content').forEach(sec => sec.classList.add('hidden'));

    // Show selected section
    const targetSec = document.getElementById(`tab-${tabId}`);
    if (targetSec) targetSec.classList.remove('hidden');

    // Update Topbar Title
    const titles = {
      'overview': { title: 'Dashboard Overview', sub: 'Live sales performance & store metrics' },
      'products': { title: 'Products Catalog', sub: 'Skincare inventory management & pricing' },
      'orders': { title: 'Customer Orders', sub: 'Fulfillment workflow, status updates & invoices' },
      'categories': { title: 'Categories', sub: 'Organize skincare product lines & visual banners' },
      'coupons': { title: 'Discounts & Coupons', sub: 'Manage promotional codes & campaign offers' },
      'skin-diagnostics': { title: 'Skin Diagnostics AI', sub: 'Customer AI visual analysis records & skin insights' },
      'customers': { title: 'Customer Accounts', sub: 'View customer order history & account status' },
      'reviews': { title: 'Reviews Moderation', sub: 'Approve, reject, or remove customer product reviews' },
      'settings': { title: 'Store Settings', sub: 'Manage store parameters & BeautyBot system rules' }
    };

    const topTitle = document.getElementById('topbar-title');
    const topSub = document.getElementById('topbar-subtitle');
    if (topTitle && titles[tabId]) topTitle.textContent = titles[tabId].title;
    if (topSub && titles[tabId]) topSub.textContent = titles[tabId].sub;
  }

  async loadDashboardData() {
    try {
      await Promise.all([
        this.fetchStats(),
        this.fetchProducts(),
        this.fetchOrders(),
        this.fetchCategories(),
        this.fetchCoupons(),
        this.fetchReviews(),
        this.fetchCustomers(),
        this.fetchSkinAnalyses(),
        this.fetchStoreSettings(),
        this.fetchOwnerProfile()
      ]);

      this.updateBadges();
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }

  updateBadges() {
    // Product count badge
    const prodBadge = document.getElementById('badge-products-count');
    if (prodBadge) prodBadge.textContent = this.products.length;

    // Pending orders badge
    const pendingCount = this.orders.filter(o => o.order_status === 'Placed' || o.order_status === 'Processing').length;
    const pendingBadge = document.getElementById('badge-pending-orders');
    if (pendingBadge) {
      if (pendingCount > 0) {
        pendingBadge.textContent = pendingCount;
        pendingBadge.classList.remove('hidden');
      } else {
        pendingBadge.classList.add('hidden');
      }
    }
  }

  async fetchStats() {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (data.success) {
        const stats = data.stats;
        document.getElementById('stat-revenue').textContent = '₹' + stats.totalRevenue.toFixed(2);
        document.getElementById('stat-orders').textContent = stats.totalOrders;
        document.getElementById('stat-products').textContent = stats.totalProducts;
        document.getElementById('stat-customers').textContent = stats.totalCustomers;
        document.getElementById('stat-low-stock-count').textContent = stats.lowStockProducts;

        this.renderCharts();
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }

  async fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        this.products = data.products || [];
        this.renderProductsTable();
        this.renderLowStockTable();
        this.populateCategoryDropdowns();
      }
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  }

  async fetchOrders() {
    try {
      const res = await fetch('/api/orders/admin/all');
      const data = await res.json();
      if (data.success) {
        this.orders = data.orders || [];
        this.renderOrdersTable();
        this.renderRecentOrdersFeed();
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
    }
  }

  async fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        this.categories = data.categories || [];
        this.renderCategoriesGrid();
        this.populateCategoryDropdowns();
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  }

  async fetchCoupons() {
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success) {
        this.coupons = data.coupons || [];
        this.renderCouponsTable();
      }
    } catch (err) {
      console.error('Coupons fetch error:', err);
    }
  }

  async fetchReviews() {
    try {
      const res = await fetch('/api/reviews/admin/all');
      const data = await res.json();
      if (data.success) {
        this.reviews = data.reviews || [];
        this.renderReviewsList();
      }
    } catch (err) {
      console.error('Reviews fetch error:', err);
    }
  }

  async fetchCustomers() {
    try {
      const res = await fetch('/api/customers/admin/all');
      const data = await res.json();
      if (data.success) {
        this.customers = data.customers || [];
        this.renderCustomersTable();
      }
    } catch (err) {
      console.error('Customers fetch error:', err);
    }
  }

  async fetchSkinAnalyses() {
    try {
      const res = await fetch('/api/admin/skin-analyses');
      const data = await res.json();
      if (data.success) {
        this.skinAnalyses = data.analyses || [];
        this.renderSkinAnalysesTable();
        this.renderSkinTypeChart();
      }
    } catch (err) {
      console.error('Skin analyses fetch error:', err);
    }
  }

  async fetchStoreSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        this.storeSettings = data.settings;
        this.populateStoreSettings(data.settings);
      }
    } catch (err) {
      console.error('Store settings fetch error:', err);
    }
  }

  populateStoreSettings(settings) {
    if (!settings) return;
    const setValue = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setValue('setting-store-name', settings.store_name);
    setValue('setting-tagline', settings.tagline);
    setValue('setting-currency-code', settings.currency_code);
    setValue('setting-currency-symbol', settings.currency_symbol);
    setValue('setting-tax-rate', settings.tax_rate);
    setValue('setting-free-shipping-threshold', settings.free_shipping_threshold);
    setValue('setting-standard-shipping-fee', settings.standard_shipping_fee);
    setValue('setting-support-email', settings.support_email);
    setValue('setting-support-phone', settings.support_phone);
    setValue('setting-store-address', settings.store_address);
    setValue('setting-banner-announcement', settings.banner_announcement);

    setValue('setting-ai-bot-name', settings.ai_bot_name);
    setValue('setting-ai-system-prompt', settings.ai_system_prompt);
  }

  async fetchOwnerProfile() {
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (data.success && data.profile) {
        this.adminProfile = data.profile;
        this.populateOwnerProfile(data.profile);
      }
    } catch (err) {
      console.error('Owner profile fetch error:', err);
    }
  }

  populateOwnerProfile(profile) {
    if (!profile) return;
    const setValue = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setValue('owner-profile-name', profile.full_name);
    setValue('owner-profile-username', profile.username);
    setValue('owner-profile-phone', profile.phone);
    setValue('owner-profile-email', profile.email);
    setValue('owner-profile-avatar', profile.avatar_url);

    const nameDisplay = document.getElementById('admin-user-name');
    if (nameDisplay) {
      nameDisplay.textContent = profile.full_name || profile.username || 'Admin';
    }

    const avatarDisplay = document.getElementById('admin-user-avatar');
    if (avatarDisplay && profile.avatar_url) {
      avatarDisplay.src = profile.avatar_url;
    }
  }

  showToast(message, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'admin-toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-800/95 border-emerald-600 text-white' : (type === 'error' ? 'bg-rose-800/95 border-rose-600 text-white' : 'bg-[#4a3f44]/95 border-[#e5c1b3] text-white');
    const iconClass = type === 'success' ? 'fa-circle-check text-emerald-300' : (type === 'error' ? 'fa-circle-exclamation text-rose-300' : 'fa-circle-info text-[#e5c1b3]');

    toast.className = `${bgClass} pointer-events-auto backdrop-blur-md px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 text-xs transition-all transform duration-300 translate-y-3 opacity-0`;
    toast.innerHTML = `
      <i class="fas ${iconClass} text-base shrink-0"></i>
      <span class="flex-1 font-medium leading-tight">${message}</span>
      <button class="text-white/70 hover:text-white shrink-0 ml-1 text-xs" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  populateCategoryDropdowns() {
    const filterCat = document.getElementById('filter-product-category');
    const formCat = document.getElementById('prod-form-category');
    
    if (filterCat) {
      const currentVal = filterCat.value;
      filterCat.innerHTML = '<option value="">All Categories</option>' + 
        this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      filterCat.value = currentVal;
    }

    if (formCat) {
      const currentVal = formCat.value;
      formCat.innerHTML = this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      if (currentVal) {
        formCat.value = currentVal;
      } else if (this.categories.length > 0) {
        formCat.value = this.categories[0].id;
      }
      this.onCategoryChange(formCat.value);
    }
  }

  onCategoryChange(categoryId, selectedSubCategory = '') {
    const subCatSelect = document.getElementById('prod-form-subcategory');
    const countBadge = document.getElementById('prod-form-subcat-count');
    if (!subCatSelect) return;

    const cat = this.categories.find(c => c.id == categoryId);
    if (cat && cat.subcategories && cat.subcategories.length > 0) {
      if (countBadge) countBadge.textContent = `(${cat.subcategories.length} available)`;
      subCatSelect.innerHTML = '<option value="">-- No Sub-Category --</option>' +
        cat.subcategories.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
      subCatSelect.disabled = false;
    } else {
      if (countBadge) countBadge.textContent = '(0 available)';
      subCatSelect.innerHTML = '<option value="">None available</option>';
      subCatSelect.disabled = false;
    }

    if (selectedSubCategory) {
      subCatSelect.value = selectedSubCategory;
    } else {
      subCatSelect.value = '';
    }

    this.onSubCategoryChange(subCatSelect.value, categoryId);
  }

  onSubCategoryChange(subCategoryName, categoryId = null) {
    const previewBox = document.getElementById('prod-form-subcat-preview');
    const imgEl = document.getElementById('prod-form-subcat-img');
    const labelEl = document.getElementById('prod-form-subcat-label');
    const descEl = document.getElementById('prod-form-subcat-desc');

    if (!previewBox) return;

    const catId = categoryId || document.getElementById('prod-form-category')?.value;
    const cat = this.categories.find(c => c.id == catId);
    const sub = cat?.subcategories?.find(s => s.name === subCategoryName);

    if (sub && subCategoryName) {
      if (imgEl) imgEl.src = sub.image_url || cat.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100';
      if (labelEl) labelEl.textContent = `${sub.name} (Sub-Category)`;
      if (descEl) descEl.textContent = sub.description || `Mapped under ${cat.name} category`;
      previewBox.classList.remove('hidden');
      previewBox.classList.add('flex');
    } else {
      previewBox.classList.add('hidden');
      previewBox.classList.remove('flex');
    }
  }

  // Render Charts using Chart.js
  renderCharts() {
    // 1. Sales Trend Line Chart
    const ctxSales = document.getElementById('chart-sales-overview')?.getContext('2d');
    if (ctxSales && window.Chart) {
      if (this.charts.sales) this.charts.sales.destroy();

      this.charts.sales = new window.Chart(ctxSales, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          datasets: [{
            label: 'Monthly Revenue (₹)',
            data: [2800, 3400, 3100, 4800, 5600, 6900, 6400, 8200],
            borderColor: '#4a3f44',
            backgroundColor: 'rgba(74, 63, 68, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#e5c1b3',
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' } }
          }
        }
      });
    }

    // 2. Category Share Doughnut Chart
    const ctxCat = document.getElementById('chart-category-share')?.getContext('2d');
    if (ctxCat && window.Chart) {
      if (this.charts.category) this.charts.category.destroy();

      this.charts.category = new window.Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: ['Serums', 'Cleansers', 'Moisturizers', 'Sunscreens', 'Toners'],
          datasets: [{
            data: [38, 24, 18, 12, 8],
            backgroundColor: ['#4a3f44', '#e5c1b3', '#81b29a', '#d4a373', '#6d5f65'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
          }
        }
      });
    }
  }

  renderSkinTypeChart() {
    const ctxSkin = document.getElementById('chart-skintype-dist')?.getContext('2d');
    if (ctxSkin && window.Chart) {
      if (this.charts.skin) this.charts.skin.destroy();

      const counts = { 'Combination': 0, 'Oily': 0, 'Dry': 0, 'Sensitive': 0, 'Normal': 0 };
      this.skinAnalyses.forEach(a => {
        if (counts[a.skin_type] !== undefined) counts[a.skin_type]++;
        else counts['Combination']++;
      });

      this.charts.skin = new window.Chart(ctxSkin, {
        type: 'bar',
        data: {
          labels: Object.keys(counts),
          datasets: [{
            label: 'Diagnosed Users Count',
            data: Object.values(counts),
            backgroundColor: ['#4a3f44', '#e5c1b3', '#81b29a', '#d4a373', '#6d5f65'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  // Render Low Stock Table
  renderLowStockTable() {
    const tbody = document.getElementById('admin-low-stock-body');
    if (!tbody) return;

    const lowStockItems = this.products.filter(p => p.stock_qty <= 12).slice(0, 5);
    if (lowStockItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-stone-400">All products have sufficient stock levels!</td></tr>`;
      return;
    }

    tbody.innerHTML = lowStockItems.map(p => `
      <tr class="border-b border-stone-100 dark:border-stone-800 hover:bg-white/40">
        <td class="py-2.5 font-bold text-[#4a3f44] dark:text-stone-200 flex items-center gap-2">
          <img src="${p.main_image}" class="w-7 h-7 rounded-lg object-cover" />
          <span class="truncate max-w-[140px]">${p.name}</span>
        </td>
        <td class="py-2.5 text-stone-500">${p.category_name}</td>
        <td class="py-2.5">
          <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${p.stock_qty <= 5 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
            ${p.stock_qty} left
          </span>
        </td>
        <td class="py-2.5 text-right">
          <button onclick="window.adminApp.openAddProductModal(${p.id})" class="text-[#4a3f44] dark:text-[#e5c1b3] font-bold hover:underline">Restock</button>
        </td>
      </tr>
    `).join('');
  }

  // Render Recent Orders Feed
  renderRecentOrdersFeed() {
    const feed = document.getElementById('admin-recent-orders-feed');
    if (!feed) return;

    const recent = this.orders.slice(0, 4);
    if (recent.length === 0) {
      feed.innerHTML = `<p class="text-xs text-stone-400">No orders placed yet.</p>`;
      return;
    }

    feed.innerHTML = recent.map(o => `
      <div class="p-3 bg-white/60 dark:bg-stone-800/60 rounded-xl border border-white/50 dark:border-stone-700 flex items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#4a3f44]/10 text-[#4a3f44] dark:text-[#e5c1b3] flex items-center justify-center font-bold text-xs">
            <i class="fas fa-receipt"></i>
          </div>
          <div>
            <span class="font-bold text-[#4a3f44] dark:text-white block">${o.order_number}</span>
            <span class="text-[10px] text-stone-500">${o.customer_name} • ₹${o.total_amount.toFixed(2)}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${this.getOrderBadgeClass(o.order_status)}">
            ${o.order_status}
          </span>
          <button onclick="window.adminApp.openInvoiceModal(${o.id})" class="text-stone-400 hover:text-[#4a3f44] p-1"><i class="fas fa-eye"></i></button>
        </div>
      </div>
    `).join('');
  }

  getOrderBadgeClass(status) {
    switch (status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-800';
      case 'Shipped': return 'bg-indigo-100 text-indigo-800';
      case 'Processing': return 'bg-amber-100 text-amber-800';
      case 'Cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  }

  // Render Products Table
  renderProductsTable() {
    const tbody = document.getElementById('admin-products-table-body');
    if (!tbody) return;

    const searchKey = (document.getElementById('filter-product-search')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('filter-product-category')?.value;

    let filtered = this.products.filter(p => {
      if (searchKey && !p.name.toLowerCase().includes(searchKey) && !p.sku.toLowerCase().includes(searchKey)) return false;
      if (catFilter && p.category_id != catFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-stone-400 text-xs">No matching products found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr class="border-b border-stone-200/60 dark:border-stone-800 hover:bg-white/40 text-xs">
        <td class="p-3">
          <div class="flex items-center gap-3">
            <img src="${p.main_image}" class="w-10 h-10 rounded-xl object-cover border border-white/60" />
            <div>
              <span class="font-bold text-[#4a3f44] dark:text-white block">${p.name}</span>
              ${p.is_featured ? '<span class="text-[9px] bg-[#e5c1b3]/30 text-[#4a3f44] font-bold px-1.5 py-0.5 rounded">Featured</span>' : ''}
              ${p.is_bestseller ? '<span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded ml-1">Bestseller</span>' : ''}
            </div>
          </div>
        </td>
        <td class="p-3 text-stone-500 font-mono">${p.sku}</td>
        <td class="p-3">
          <span class="font-bold text-stone-800 dark:text-stone-200 block">${p.category_name}</span>
          ${p.sub_category ? `<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-[#e5c1b3]/30 text-[#4a3f44] dark:text-[#e5c1b3] font-semibold inline-block mt-0.5">${p.sub_category}</span>` : '<span class="text-[10px] text-stone-400 italic">No sub-cat</span>'}
        </td>
        <td class="p-3 font-semibold text-[#4a3f44] dark:text-[#e5c1b3]">
          ₹${(p.discounted_price || p.original_price).toFixed(2)}
          ${p.discounted_price ? `<span class="line-through text-stone-400 text-[10px] block">₹${p.original_price.toFixed(2)}</span>` : ''}
        </td>
        <td class="p-3">
          <span class="px-2.5 py-1 rounded-full font-bold text-[10px] ${p.stock_qty <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
            ${p.stock_qty} in stock
          </span>
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
            ${p.status}
          </span>
        </td>
        <td class="p-3 text-right space-x-2">
          <button onclick="window.adminApp.openAddProductModal(${p.id})" class="text-indigo-600 hover:text-indigo-800 font-bold p-1"><i class="fas fa-edit"></i> Edit</button>
          <button onclick="window.adminApp.deleteProduct(${p.id})" class="text-rose-600 hover:text-rose-800 font-bold p-1"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // Render Orders Table
  renderOrdersTable() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;

    const searchKey = (document.getElementById('filter-order-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('filter-order-status')?.value;

    let filtered = this.orders.filter(o => {
      if (searchKey && !o.order_number.toLowerCase().includes(searchKey) && !o.customer_name.toLowerCase().includes(searchKey)) return false;
      if (statusFilter && o.order_status !== statusFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-stone-400 text-xs">No orders matching filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(o => `
      <tr class="border-b border-stone-200/60 dark:border-stone-800 hover:bg-white/40 text-xs">
        <td class="p-3 font-bold text-[#4a3f44] dark:text-[#e5c1b3]">${o.order_number}</td>
        <td class="p-3">
          <span class="font-bold text-[#4a3f44] dark:text-white block">${o.customer_name}</span>
          <span class="text-[10px] text-stone-500">${o.customer_email || ''}</span>
        </td>
        <td class="p-3 font-medium">${o.items ? o.items.length : 1} items</td>
        <td class="p-3 font-bold text-[#4a3f44] dark:text-white">₹${o.total_amount.toFixed(2)}</td>
        <td class="p-3">
          <select onchange="window.adminApp.updateOrderStatus(${o.id}, this.value)" class="bg-white/80 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer">
            <option value="Placed" ${o.order_status === 'Placed' ? 'selected' : ''}>Placed</option>
            <option value="Confirmed" ${o.order_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Packed" ${o.order_status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Out for Delivery" ${o.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td class="p-3 text-stone-500">${new Date(o.created_at).toLocaleDateString()}</td>
        <td class="p-3 text-right">
          <button onclick="window.adminApp.openInvoiceModal(${o.id})" class="bg-[#4a3f44] hover:bg-[#5a4f54] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors">
            <i class="fas fa-file-invoice"></i> View Invoice
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Export filtered orders to downloadable CSV
  exportOrdersCSV() {
    const searchKey = (document.getElementById('filter-order-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('filter-order-status')?.value;

    let filtered = this.orders.filter(o => {
      if (searchKey && !o.order_number.toLowerCase().includes(searchKey) && !o.customer_name.toLowerCase().includes(searchKey)) return false;
      if (statusFilter && o.order_status !== statusFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      this.showToast('No orders match the current filter to export.', 'info');
      return;
    }

    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Order ID',
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Shipping Address',
      'Payment Method',
      'Fulfillment Status',
      'Tracking Number',
      'Items Summary',
      'Total Amount (₹)'
    ];

    const rows = filtered.map(o => {
      const itemsSummary = o.items && o.items.length > 0
        ? o.items.map(i => `${i.product_name || 'Product'} (x${i.quantity || 1})`).join('; ')
        : 'N/A';

      const dateStr = o.created_at ? new Date(o.created_at).toISOString().replace('T', ' ').substring(0, 19) : '';

      return [
        o.id,
        o.order_number || '',
        dateStr,
        o.customer_name || '',
        o.customer_email || '',
        o.shipping_address || '',
        o.payment_method || 'Razorpay',
        o.order_status || 'Placed',
        o.tracking_number || '',
        itemsSummary,
        typeof o.total_amount === 'number' ? o.total_amount.toFixed(2) : '0.00'
      ].map(escapeCSV).join(',');
    });

    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    const filterSuffix = statusFilter ? `_${statusFilter.toLowerCase()}` : '';
    link.setAttribute('download', `DREAM_Orders_Export_${today}${filterSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`Successfully exported ${filtered.length} order(s) to CSV!`, 'success');
  }

  // Render Categories Grid
  renderCategoriesGrid() {
    const grid = document.getElementById('admin-categories-grid');
    if (!grid) return;

    grid.innerHTML = this.categories.map(c => `
      <div class="glass-panel rounded-2xl overflow-hidden border border-white/60 dark:border-stone-800 flex flex-col justify-between shadow-xs">
        <div class="h-32 relative">
          <img src="${c.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <h4 class="text-white font-serif font-bold text-base leading-tight drop-shadow-sm">${c.name}</h4>
            <span class="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">
              ${c.subcategories ? c.subcategories.length : 0} Sub-Cats
            </span>
          </div>
        </div>
        <div class="p-4 space-y-3.5 text-xs flex-1 flex flex-col justify-between">
          <div>
            <p class="text-[#6d5f65] dark:text-stone-300 mb-3">${c.description || 'Skincare category line'}</p>
            
            <!-- Subcategories List with Photo Thumbnails -->
            <div class="space-y-2 pt-2.5 border-t border-stone-200/50 dark:border-stone-700/50">
              <div class="flex items-center justify-between text-[10px] font-bold text-[#6d5f65] dark:text-stone-400 uppercase tracking-wider">
                <span>Sub-Categories with Photos</span>
                <button onclick="window.adminApp.openAddSubCategoryModal(${c.id})" class="text-[#4a3f44] dark:text-[#e5c1b3] hover:underline flex items-center gap-1 font-bold">
                  <i class="fas fa-plus text-[9px]"></i> Add Sub-Category
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                ${c.subcategories && c.subcategories.length > 0 ? c.subcategories.map(s => `
                  <div class="flex items-center gap-2 p-1.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 group hover:border-[#4a3f44]/30 transition-all">
                    <img src="${s.image_url || c.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200'}" alt="${s.name}" class="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-stone-200 dark:border-stone-700" onerror="this.src='${c.image_url}'" />
                    <div class="min-w-0 flex-1">
                      <p class="text-[11px] font-bold text-[#4a3f44] dark:text-stone-100 truncate">${s.name}</p>
                      <p class="text-[9px] text-[#6d5f65] dark:text-stone-400 truncate">${s.slug || 'sub-category'}</p>
                    </div>
                    <button onclick="window.adminApp.deleteSubCategory(${c.id}, ${s.id})" title="Delete Sub-Category" class="text-stone-400 hover:text-rose-600 p-1.5 transition-colors">
                      <i class="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                `).join('') : '<div class="col-span-2 text-[10px] text-stone-400 italic py-1">No sub-categories added yet.</div>'}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-stone-200/50">
            <span class="text-[10px] font-bold text-[#4a3f44] dark:text-[#e5c1b3]">ACTIVE CATEGORY</span>
            <button onclick="window.adminApp.deleteCategory(${c.id})" class="text-rose-600 hover:text-rose-800 font-bold text-xs"><i class="fas fa-trash"></i> Delete Category</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render Coupons Table
  renderCouponsTable() {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;

    if (this.coupons.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 text-xs">No coupons created yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.coupons.map(c => `
      <tr class="border-b border-stone-200/60 dark:border-stone-800 hover:bg-white/40 text-xs">
        <td class="p-3 font-mono font-bold text-[#4a3f44] dark:text-[#e5c1b3]">${c.code}</td>
        <td class="p-3 capitalize">${c.discount_type}</td>
        <td class="p-3 font-bold text-emerald-600">${c.discount_type === 'percentage' ? c.discount_value + '%' : '₹' + c.discount_value}</td>
        <td class="p-3">₹${c.min_order_amount.toFixed(2)}</td>
        <td class="p-3">
          <button onclick="window.adminApp.toggleCouponStatus(${c.id})" class="px-2.5 py-1 rounded-full font-bold text-[10px] ${c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}">
            ${c.status.toUpperCase()}
          </button>
        </td>
        <td class="p-3 text-right">
          <button onclick="window.adminApp.deleteCoupon(${c.id})" class="text-rose-600 hover:text-rose-800 font-bold p-1"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  // Render Skin Analyses Table
  renderSkinAnalysesTable() {
    const tbody = document.getElementById('admin-scans-table-body');
    if (!tbody) return;

    const totalEl = document.getElementById('stat-total-scans');
    if (totalEl) totalEl.textContent = this.skinAnalyses.length;

    if (this.skinAnalyses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-stone-400 text-xs">No AI skin scans conducted yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.skinAnalyses.map(a => `
      <tr class="border-b border-stone-200/60 dark:border-stone-800 hover:bg-white/40 text-xs">
        <td class="p-3 font-bold text-[#4a3f44] dark:text-white">${a.user_name || 'Guest Customer'}</td>
        <td class="p-3 font-semibold text-[#4a3f44] dark:text-[#e5c1b3]">${a.skin_type}</td>
        <td class="p-3 text-stone-600 dark:text-stone-300">Dark Spots, Redness</td>
        <td class="p-3 font-bold text-emerald-600">${a.overall_health_score} / 100</td>
        <td class="p-3 text-stone-500">${new Date(a.created_at).toLocaleDateString()}</td>
        <td class="p-3 text-right">
          <button onclick="alert('${a.notes || 'Gentle antioxidant focus recommendations.'}')" class="text-indigo-600 hover:underline font-bold">View Notes</button>
        </td>
      </tr>
    `).join('');
  }

  // Render Customers Table
  renderCustomersTable() {
    const tbody = document.getElementById('admin-customers-table-body');
    if (!tbody) return;

    tbody.innerHTML = this.customers.map(cust => `
      <tr class="border-b border-stone-200/60 dark:border-stone-800 hover:bg-white/40 text-xs">
        <td class="p-3 font-bold text-[#4a3f44] dark:text-white">${cust.full_name}</td>
        <td class="p-3 text-stone-500">${cust.email}</td>
        <td class="p-3 font-semibold">${cust.order_count} orders</td>
        <td class="p-3 font-bold text-emerald-600">₹${cust.total_spent.toFixed(2)}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${cust.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${cust.status.toUpperCase()}
          </span>
        </td>
        <td class="p-3 text-right">
          <button onclick="window.adminApp.toggleCustomerStatus(${cust.id}, '${cust.status}')" class="text-stone-600 hover:text-stone-900 font-bold underline">
            ${cust.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Render Reviews List
  renderReviewsList() {
    const list = document.getElementById('admin-reviews-list');
    if (!list) return;

    if (this.reviews.length === 0) {
      list.innerHTML = `<p class="text-xs text-stone-400">No product reviews submitted yet.</p>`;
      return;
    }

    list.innerHTML = this.reviews.map(r => `
      <div class="p-4 bg-white/60 dark:bg-stone-800/60 rounded-2xl border border-white/60 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-[#4a3f44] dark:text-white">${r.user_name}</span>
            <div class="text-amber-400 text-[10px]">
              ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            </div>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${r.status.toUpperCase()}
            </span>
          </div>
          <p class="font-bold text-stone-800 dark:text-stone-200">"${r.title}"</p>
          <p class="text-stone-600 dark:text-stone-400 italic">${r.comment}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${r.status !== 'approved' ? `
            <button onclick="window.adminApp.updateReviewStatus(${r.id}, 'approved')" class="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold text-[10px]">Approve</button>
          ` : ''}
          <button onclick="window.adminApp.deleteReview(${r.id})" class="bg-rose-500 text-white px-3 py-1 rounded-lg font-bold text-[10px]">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // Modals & Handlers
  openAddProductModal(productId = null) {
    const modal = document.getElementById('add-product-modal');
    const form = document.getElementById('form-add-product');
    const title = document.getElementById('modal-product-title');
    const submitBtn = document.getElementById('prod-form-submit-btn');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('prod-form-id').value = '';

    if (productId !== null && productId !== undefined && productId !== '') {
      const numId = Number(productId);
      const prod = this.products.find(p => Number(p.id) === numId);
      if (prod) {
        if (title) title.textContent = 'Edit Skincare Product';
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Product';
        document.getElementById('prod-form-id').value = prod.id;
        document.getElementById('prod-form-name').value = prod.name || '';
        document.getElementById('prod-form-category').value = prod.category_id || 1;
        this.onCategoryChange(prod.category_id, prod.sub_category);
        document.getElementById('prod-form-brand').value = prod.brand_id || 1;
        document.getElementById('prod-form-price').value = prod.original_price;
        document.getElementById('prod-form-discount').value = prod.discounted_price || '';
        document.getElementById('prod-form-stock').value = prod.stock_qty !== undefined ? prod.stock_qty : 25;
        document.getElementById('prod-form-image').value = prod.main_image || '';
        const imgPreview = document.getElementById('prod-form-image-preview');
        if (imgPreview) imgPreview.src = prod.main_image || '';
        document.getElementById('prod-form-desc').value = prod.description || '';
        document.getElementById('prod-form-ingredients').value = prod.ingredients || '';
        document.getElementById('prod-form-featured').checked = !!prod.is_featured;
        document.getElementById('prod-form-bestseller').checked = !!prod.is_bestseller;
      }
    } else {
      if (title) title.textContent = 'Add New Skincare Product';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Save Product Catalog Item';
      const firstCat = document.getElementById('prod-form-category')?.value;
      if (firstCat) this.onCategoryChange(firstCat);
      const defaultImg = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800';
      document.getElementById('prod-form-image').value = defaultImg;
      const imgPreview = document.getElementById('prod-form-image-preview');
      if (imgPreview) imgPreview.src = defaultImg;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async handleProductImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      this.showToast('Uploading product photo...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        document.getElementById('prod-form-image').value = data.url;
        const imgPreview = document.getElementById('prod-form-image-preview');
        if (imgPreview) imgPreview.src = data.url;
        this.showToast('Product photo uploaded successfully!', 'success');
      } else {
        this.showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      this.showToast('Error uploading photo', 'error');
    }
  }

  deleteProduct(id) {
    const numId = Number(id);
    const prod = this.products.find(p => Number(p.id) === numId);
    const prodName = prod ? prod.name : 'this product';
    this.openConfirmModal({
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete "${prodName}" from the catalog? This will also remove it from customer bags and wishlists.`,
      confirmBtnText: 'Delete Product',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/products/${numId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            this.showToast(`Product "${prodName}" deleted successfully!`, 'success');
            await this.fetchProducts();
            await this.fetchStats();
          } else {
            this.showToast(data.error || 'Failed to delete product', 'error');
          }
        } catch (err) {
          console.error('Delete product error:', err);
          this.showToast('Server error while deleting product', 'error');
        }
      }
    });
  }

  openAddCategoryModal() {
    const modal = document.getElementById('add-category-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  }

  openAddSubCategoryModal(categoryId) {
    const modal = document.getElementById('add-subcategory-modal');
    const cat = this.categories.find(c => c.id == categoryId);
    if (!modal || !cat) return;

    document.getElementById('subcat-parent-id').value = cat.id;
    document.getElementById('add-subcat-parent-name').textContent = `Adding sub-category under: ${cat.name}`;
    document.getElementById('subcat-name-input').value = '';
    document.getElementById('subcat-slug-input').value = '';
    if (document.getElementById('subcat-desc-input')) {
      document.getElementById('subcat-desc-input').value = '';
    }

    const defaultImg = cat.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400';
    const imgInput = document.getElementById('subcat-image-input');
    const imgPreview = document.getElementById('subcat-preview-img');
    if (imgInput) imgInput.value = defaultImg;
    if (imgPreview) imgPreview.src = defaultImg;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  async handleSubcatImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      this.showToast('Uploading photo...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        document.getElementById('subcat-image-input').value = data.url;
        document.getElementById('subcat-preview-img').src = data.url;
        this.showToast('Photo uploaded successfully!', 'success');
      } else {
        this.showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      this.showToast('Error uploading photo', 'error');
    }
  }

  deleteSubCategory(categoryId, subcategoryId) {
    const cat = this.categories.find(c => c.id == categoryId);
    const sub = cat?.subcategories?.find(s => s.id == subcategoryId);
    const subName = sub ? sub.name : 'this sub-category';
    this.openConfirmModal({
      title: 'Delete Sub-Category',
      message: `Are you sure you want to remove the sub-category "${subName}"? Products with this subcategory will retain their parent category.`,
      confirmBtnText: 'Delete Sub-Category',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/categories/${categoryId}/subcategories/${subcategoryId}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            this.showToast(`Sub-category "${subName}" removed successfully!`, 'success');
            await this.fetchCategories();
            await this.fetchProducts();
          } else {
            this.showToast(data.error || 'Failed deleting sub-category', 'error');
          }
        } catch (err) {
          console.error('Delete subcategory error:', err);
          this.showToast('Server error deleting sub-category', 'error');
        }
      }
    });
  }

  deleteCategory(id) {
    const cat = this.categories.find(c => c.id === id);
    const catName = cat ? cat.name : 'this category';
    this.openConfirmModal({
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${catName}"? Any products assigned to this category will automatically be kept safe.`,
      confirmBtnText: 'Delete Category',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            this.showToast(`Category "${catName}" deleted successfully!`, 'success');
            await this.fetchCategories();
            await this.fetchProducts();
            await this.fetchStats();
          } else {
            this.showToast(data.error || 'Failed to delete category', 'error');
          }
        } catch (err) {
          console.error('Delete category error:', err);
          this.showToast('Server error while deleting category', 'error');
        }
      }
    });
  }

  openAddCouponModal() {
    const modal = document.getElementById('add-coupon-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  }

  async toggleCouponStatus(id) {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        this.showToast('Coupon status updated!', 'success');
        this.fetchCoupons();
      } else {
        this.showToast(data.error || 'Failed to update coupon', 'error');
      }
    } catch (err) {
      this.showToast('Error updating coupon', 'error');
    }
  }

  deleteCoupon(id) {
    const coupon = this.coupons.find(c => c.id === id);
    const code = coupon ? coupon.code : 'this promo code';
    this.openConfirmModal({
      title: 'Delete Coupon',
      message: `Are you sure you want to delete promo coupon "${code}"?`,
      confirmBtnText: 'Delete Coupon',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            this.showToast(`Coupon "${code}" deleted successfully!`, 'success');
            await this.fetchCoupons();
          } else {
            this.showToast(data.error || 'Failed to delete coupon', 'error');
          }
        } catch (err) {
          console.error('Delete coupon error:', err);
          this.showToast('Server error deleting coupon', 'error');
        }
      }
    });
  }

  async updateOrderStatus(orderId, status) {
    try {
      const res = await fetch(`/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: status })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Order status updated to "${status}"`, 'success');
        this.fetchOrders();
        this.fetchStats();
      } else {
        this.showToast(data.error || 'Failed to update order status', 'error');
      }
    } catch (err) {
      this.showToast('Error updating order status', 'error');
    }
  }

  async updateReviewStatus(id, status) {
    try {
      const res = await fetch(`/api/reviews/admin/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Review ${status}!`, 'success');
        this.fetchReviews();
      } else {
        this.showToast(data.error || 'Failed updating review', 'error');
      }
    } catch (err) {
      this.showToast('Error updating review status', 'error');
    }
  }

  deleteReview(id) {
    this.openConfirmModal({
      title: 'Delete Review',
      message: 'Are you sure you want to permanently delete this customer review?',
      confirmBtnText: 'Delete Review',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/reviews/admin/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            this.showToast('Review deleted successfully!', 'success');
            await this.fetchReviews();
          } else {
            this.showToast(data.error || 'Failed deleting review', 'error');
          }
        } catch (err) {
          console.error('Delete review error:', err);
          this.showToast('Server error deleting review', 'error');
        }
      }
    });
  }

  async toggleCustomerStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/customers/admin/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Customer account marked as ${nextStatus}`, 'success');
        this.fetchCustomers();
      } else {
        this.showToast(data.error || 'Failed to update customer status', 'error');
      }
    } catch (err) {
      this.showToast('Error updating customer account', 'error');
    }
  }

  openInvoiceModal(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('order-invoice-modal');
    const container = document.getElementById('invoice-modal-content');
    if (!modal || !container) return;

    let parsedAddress = {};
    try {
      parsedAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
    } catch (e) {
      parsedAddress = { address: order.shipping_address };
    }

    const items = order.items || [];
    const subtotal = order.subtotal || order.total_amount || 0;
    const tax = order.tax_amount || (subtotal * 0.08);
    const shipping = typeof order.shipping_fee === 'number' ? order.shipping_fee : (subtotal > 50 ? 0 : 5.99);

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Invoice Header -->
        <div class="flex items-center justify-between border-b pb-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-serif font-bold text-2xl text-[#4a3f44] dark:text-white">DREAM</h2>
              <span class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#e5c1b3]/30 text-[#4a3f44] dark:text-[#e5c1b3]">Clinical Skincare</span>
            </div>
            <p class="text-xs text-stone-500 mt-0.5">Official Order Invoice & Fulfillment Receipt</p>
          </div>
          <div class="text-right">
            <span class="font-bold text-sm text-[#4a3f44] dark:text-[#e5c1b3] block">${order.order_number}</span>
            <span class="text-xs text-stone-500">${new Date(order.created_at).toLocaleDateString()}</span>
            <div class="mt-1">
              <span class="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                Status: ${order.order_status || 'Placed'}
              </span>
            </div>
          </div>
        </div>

        <!-- Customer & Shipping Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
            <h4 class="font-bold text-stone-400 uppercase tracking-wider mb-1">Customer Details</h4>
            <p class="font-bold text-[#4a3f44] dark:text-white">${order.customer_name}</p>
            <p class="text-stone-500">${order.customer_email || 'customer@example.com'}</p>
            <p class="text-stone-500 mt-1">Payment Method: <span class="font-semibold text-stone-700 dark:text-stone-300">${order.payment_method || 'Razorpay'}</span></p>
          </div>
          <div class="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
            <h4 class="font-bold text-stone-400 uppercase tracking-wider mb-1">Shipping Destination</h4>
            <p class="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
              ${parsedAddress.street || parsedAddress.address || '123 Beauty Lane'}<br>
              ${parsedAddress.city || 'Los Angeles'}, ${parsedAddress.state || 'CA'} ${parsedAddress.zip || '90001'}
            </p>
            <p class="text-stone-500 mt-1">Tracking #: <strong class="font-mono text-stone-700 dark:text-stone-300">${order.tracking_number || 'TRK-9821382'}</strong></p>
          </div>
        </div>

        <!-- Order Items Table -->
        <div>
          <h4 class="font-bold text-stone-400 uppercase tracking-wider text-xs mb-2">Purchased Items</h4>
          <div class="overflow-x-auto border rounded-xl border-stone-200 dark:border-stone-800">
            <table class="w-full text-left text-xs">
              <thead class="bg-stone-50 dark:bg-stone-800/80 text-stone-500">
                <tr>
                  <th class="p-2.5">Item</th>
                  <th class="p-2.5">Price</th>
                  <th class="p-2.5">Qty</th>
                  <th class="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
                ${items.map(item => {
                  const unitPrice = typeof item.unit_price === 'number' ? item.unit_price : 0;
                  const qty = item.quantity || 1;
                  const itemTotal = typeof item.total_price === 'number' ? item.total_price : (unitPrice * qty);
                  return `
                    <tr>
                      <td class="p-2.5 font-bold flex items-center gap-2">
                        <img src="${item.product_image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100'}" class="w-8 h-8 rounded-lg object-cover border border-stone-200 dark:border-stone-700" />
                        <span>${item.product_name}</span>
                      </td>
                      <td class="p-2.5">₹${unitPrice.toFixed(2)}</td>
                      <td class="p-2.5">${qty}</td>
                      <td class="p-2.5 text-right font-bold">₹${itemTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totals Summary -->
        <div class="flex justify-end text-xs">
          <div class="w-60 space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div class="flex justify-between text-stone-500">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${order.discount_amount ? `
              <div class="flex justify-between text-rose-600 font-semibold">
                <span>Discount (${order.coupon_code || ''}):</span>
                <span>-₹${order.discount_amount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-stone-500">
              <span>Tax (8%):</span>
              <span>₹${tax.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-stone-500">
              <span>Shipping:</span>
              <span>${shipping === 0 ? 'FREE' : '₹' + shipping.toFixed(2)}</span>
            </div>
            <div class="flex justify-between font-serif font-bold text-base text-[#4a3f44] dark:text-white pt-2 border-t border-stone-200 dark:border-stone-800">
              <span>Total Paid:</span>
              <span>₹${(order.total_amount || (subtotal + tax + shipping)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Footer Receipt Note -->
        <div class="text-[11px] text-stone-400 text-center pt-2 border-t border-stone-100 dark:border-stone-800">
          Thank you for choosing DREAM Clinical Skincare. For inquiries regarding this receipt, please contact <a href="mailto:support@dreambeauty.com" class="underline">support@dreambeauty.com</a>.
        </div>

        <!-- Print Action Bar -->
        <div class="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800 no-print print:hidden">
          <button onclick="window.print()" class="bg-[#4a3f44] hover:bg-[#5a4f54] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer">
            <i class="fas fa-print"></i> Print Invoice
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  bindEvents() {
    // Nav Tabs switching
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Theme toggle
    document.getElementById('admin-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Mobile sidebar toggle
    document.getElementById('btn-mobile-sidebar-toggle')?.addEventListener('click', () => {
      const sidebar = document.querySelector('aside');
      sidebar?.classList.toggle('hidden');
    });

    // Filter listeners
    document.getElementById('filter-product-search')?.addEventListener('input', () => this.renderProductsTable());
    document.getElementById('filter-product-category')?.addEventListener('change', () => this.renderProductsTable());
    document.getElementById('filter-order-search')?.addEventListener('input', () => this.renderOrdersTable());
    document.getElementById('filter-order-status')?.addEventListener('change', () => this.renderOrdersTable());

    // Admin Login Form
    document.getElementById('form-admin-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-username').value;
      const password = document.getElementById('admin-password').value;

      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          this.adminUser = data.admin;
          localStorage.setItem('dream_admin', JSON.stringify(data.admin));
          this.showDashboard();
          this.loadDashboardData();
          this.showToast('Logged in successfully', 'success');
        } else {
          this.showToast(data.error || 'Admin login failed', 'error');
        }
      } catch (err) {
        this.showToast('Server error during login', 'error');
      }
    });

    // Add/Edit Product Form
    document.getElementById('form-add-product')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      payload.is_featured = document.getElementById('prod-form-featured')?.checked || false;
      payload.is_bestseller = document.getElementById('prod-form-bestseller')?.checked || false;

      const id = document.getElementById('prod-form-id')?.value;
      const method = id ? 'PUT' : 'POST';
      const endpoint = id ? `/api/products/${id}` : '/api/products';

      const submitBtn = document.getElementById('prod-form-submit-btn');
      const origText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving Product...';
      }

      try {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          this.closeProductModal();
          this.showToast(id ? 'Product updated successfully in catalog!' : 'New product added successfully!', 'success');
          await this.fetchProducts();
          await this.fetchStats();
        } else {
          this.showToast(data.error || 'Failed saving product', 'error');
        }
      } catch (err) {
        console.error('Save product error:', err);
        this.showToast('Server error while saving product', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      }
    });

    // Add Category Form
    document.getElementById('form-add-category')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(e.target).entries());

      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('add-category-modal')?.classList.add('hidden');
          this.showToast('Category added successfully!', 'success');
          this.fetchCategories();
        } else {
          this.showToast(data.error || 'Failed adding category', 'error');
        }
      } catch (err) {
        this.showToast('Error adding category', 'error');
      }
    });

    // Add Sub-Category Form
    document.getElementById('form-add-subcategory')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const catId = document.getElementById('subcat-parent-id').value;
      const name = document.getElementById('subcat-name-input').value;
      const slug = document.getElementById('subcat-slug-input').value;
      const image_url = document.getElementById('subcat-image-input')?.value;
      const description = document.getElementById('subcat-desc-input')?.value;

      try {
        const res = await fetch(`/api/categories/${catId}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug, image_url, description })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('add-subcategory-modal')?.classList.add('hidden');
          this.showToast('Sub-category with photo added successfully!', 'success');
          this.fetchCategories();
        } else {
          this.showToast(data.error || 'Failed adding sub-category', 'error');
        }
      } catch (err) {
        this.showToast('Error adding sub-category', 'error');
      }
    });

    // Add Coupon Form
    document.getElementById('form-add-coupon')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(e.target).entries());

      try {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('add-coupon-modal')?.classList.add('hidden');
          this.showToast('Coupon created successfully!', 'success');
          this.fetchCoupons();
        } else {
          this.showToast(data.error || 'Failed adding coupon', 'error');
        }
      } catch (err) {
        this.showToast('Error adding coupon', 'error');
      }
    });

    // Save Owner Profile Form (Tab 9 - Card 1)
    document.getElementById('form-owner-profile')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-owner-profile');
      const origHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin text-[#e5c1b3]"></i> Saving Profile...';
      }

      const full_name = document.getElementById('owner-profile-name')?.value?.trim();
      const username = document.getElementById('owner-profile-username')?.value?.trim();
      const phone = document.getElementById('owner-profile-phone')?.value?.trim();
      const email = document.getElementById('owner-profile-email')?.value?.trim();
      const password = document.getElementById('owner-profile-password')?.value?.trim();
      const avatar_url = document.getElementById('owner-profile-avatar')?.value?.trim();

      const payload = { full_name, username, phone, email, avatar_url };
      if (password && password.length > 0) {
        payload.password = password;
      }

      try {
        const res = await fetch('/api/admin/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.profile) {
          this.adminProfile = data.profile;
          if (this.adminUser) {
            this.adminUser = { ...this.adminUser, ...data.profile };
            localStorage.setItem('dream_admin', JSON.stringify(this.adminUser));
          }
          this.populateOwnerProfile(data.profile);
          const passInput = document.getElementById('owner-profile-password');
          if (passInput) passInput.value = '';
          this.showToast('Owner credentials & profile saved successfully!', 'success');
        } else {
          this.showToast(data.error || 'Failed to update owner profile', 'error');
        }
      } catch (err) {
        console.error('Owner profile save error:', err);
        this.showToast('Server error saving owner profile', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    });

    // Save Store Settings Form (Tab 9 - Card 2)
    document.getElementById('form-store-settings')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-store-settings');
      const origHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin text-[#e5c1b3]"></i> Saving Settings...';
      }

      const store_name = document.getElementById('setting-store-name')?.value?.trim();
      const tagline = document.getElementById('setting-tagline')?.value?.trim();
      const currency_code = document.getElementById('setting-currency-code')?.value?.trim();
      const currency_symbol = document.getElementById('setting-currency-symbol')?.value?.trim();
      const tax_rate = parseFloat(document.getElementById('setting-tax-rate')?.value) || 0;
      const free_shipping_threshold = parseFloat(document.getElementById('setting-free-shipping-threshold')?.value) || 0;
      const standard_shipping_fee = parseFloat(document.getElementById('setting-standard-shipping-fee')?.value) || 0;
      const support_email = document.getElementById('setting-support-email')?.value?.trim();
      const support_phone = document.getElementById('setting-support-phone')?.value?.trim();
      const store_address = document.getElementById('setting-store-address')?.value?.trim();
      const banner_announcement = document.getElementById('setting-banner-announcement')?.value?.trim();

      const payload = {
        store_name,
        tagline,
        currency_code,
        currency_symbol,
        tax_rate,
        free_shipping_threshold,
        standard_shipping_fee,
        support_email,
        support_phone,
        store_address,
        banner_announcement
      };

      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.settings) {
          this.storeSettings = data.settings;
          this.populateStoreSettings(data.settings);
          this.showToast('Store settings & financial rules saved successfully!', 'success');
        } else {
          this.showToast(data.error || 'Failed to save store settings', 'error');
        }
      } catch (err) {
        console.error('Store settings save error:', err);
        this.showToast('Server error saving store settings', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    });

    // Save AI Engine Settings Form (Tab 9 - Card 3)
    document.getElementById('form-ai-settings')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-ai-settings');
      const origHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin text-[#e5c1b3]"></i> Updating AI Engine...';
      }

      const ai_bot_name = document.getElementById('setting-ai-bot-name')?.value?.trim();
      const ai_system_prompt = document.getElementById('setting-ai-system-prompt')?.value?.trim();

      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai_bot_name, ai_system_prompt })
        });
        const data = await res.json();
        if (data.success && data.settings) {
          this.storeSettings = data.settings;
          this.populateStoreSettings(data.settings);
          this.showToast('BeautyBot AI Engine prompt & persona updated successfully!', 'success');
        } else {
          this.showToast(data.error || 'Failed to update AI settings', 'error');
        }
      } catch (err) {
        console.error('AI settings save error:', err);
        this.showToast('Server error updating AI settings', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      }
    });

    // Logout
    document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
      this.adminUser = null;
      localStorage.removeItem('dream_admin');
      localStorage.removeItem('glowai_admin');
      this.showLogin();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminApp = new AdminApp();
});
