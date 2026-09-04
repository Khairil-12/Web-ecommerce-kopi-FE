// ===== PRODUCTS PAGE SCRIPT =====

const API_URL = window.API_CONFIG?.API_URL || 'http://localhost:5000/api';
let allProducts = [];
let filteredProducts = [];

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Load all products
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    allProducts = data.data || [];
    filteredProducts = [...allProducts];
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    showError('Gagal memuat produk. Silakan refresh halaman.');
  }
}

// Render products with animations
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const resultCount = document.getElementById('resultCount');

  resultCount.textContent = filteredProducts.length;

  if (filteredProducts.length === 0) {
    grid.classList.add('d-none');
    emptyState.classList.remove('d-none');
    return;
  }

  grid.classList.remove('d-none');
  emptyState.classList.add('d-none');

  grid.innerHTML = filteredProducts.map((product, index) => `
    <div class="col-md-6 col-lg-4 stagger-item animate-fade-up" style="animation-delay: ${index * 0.1}s;">
      <div class="card border-0 h-100 transition-all" style="border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(139, 69, 19, 0.15);">
        
        <!-- Product Image Container -->
        <div class="position-relative overflow-hidden" style="height: 280px; background: linear-gradient(135deg, #f5f5dc, #fff8dc);">
          <img 
            src="${product.image_url || 'https://via.placeholder.com/400x300?text=Kopi+Premium'}" 
            alt="${product.name}"
            style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);"
            class="product-image"
            onerror="this.src='https://via.placeholder.com/400x300?text=Kopi'"
          />
          <div class="position-absolute top-0 start-0 end-0 bottom-0" style="background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%);"></div>
          
          <!-- Stock Badge -->
          <span class="badge position-absolute top-3 start-3 px-3 py-2 fw-600" style="background: ${product.stock > 0 ? '#28a745' : '#dc3545'}; font-size: 0.85rem;">
            ${product.stock > 0 ? `✓ ${product.stock} Stok` : '❌ Habis'}
          </span>

          <!-- Action Overlay -->
          <div class="position-absolute bottom-0 start-0 end-0 d-flex gap-2 p-3 transition-all" style="background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%);">
            <button class="btn btn-sm w-100 add-to-cart-btn" data-id="${product.id}" style="background: linear-gradient(135deg, #d2691e, #cd853f); color: white; border: none; font-weight: 600; border-radius: 8px;">
              🛒 Keranjang
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="card-body p-4">
          <!-- Product Name -->
          <h5 class="card-title mb-2" style="color: var(--primary-color); font-weight: 700; min-height: 50px;">
            ${product.name}
          </h5>

          <!-- Description -->
          <p class="card-text small text-muted mb-3" style="min-height: 40px; line-height: 1.5;">
            ${product.description?.substring(0, 80) || 'Kopi premium pilihan berkualitas tinggi'}...
          </p>

          <!-- Rating -->
          <div class="mb-3 d-flex justify-content-between align-items-center">
            <span class="text-warning" style="font-size: 0.95rem;">★★★★★</span>
            <span class="badge bg-light text-dark small">${Math.floor(Math.random() * 50) + 10} ulasan</span>
          </div>

          <!-- Price Section -->
          <div class="mb-4 pb-3 border-bottom">
            <p class="mb-1 small text-muted">Harga:</p>
            <p class="mb-0 fs-5 fw-bold" style="color: var(--secondary-color);">
              Rp ${parseFloat(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0 })}
            </p>
            <p class="small text-muted mb-0">Per ${product.unit || '1 kg'}</p>
          </div>

          <!-- View Details Button -->
          <a 
            href="#" 
            class="btn btn-sm w-100 view-details-btn transition-all" 
            data-id="${product.id}"
            style="border: 2px solid var(--primary-color); color: var(--primary-color); background: transparent; font-weight: 600; border-radius: 10px;"
          >
            ➜ Lihat Detail
          </a>
        </div>
      </div>
    </div>
  `).join('');

  // Add hover effect to product images
  document.querySelectorAll('.product-image').forEach(img => {
    img.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.08) rotate(1deg)';
    });
    img.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1) rotate(0deg)';
    });
  });

  // Add to cart button handlers
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.getAttribute('data-id');
      const product = allProducts.find(p => p.id == productId);
      if (product) {
        addToCart(product);
        showSuccess(`${product.name} ditambahkan ke keranjang!`);
        btn.innerHTML = '✓ Ditambahkan!';
        setTimeout(() => {
          btn.innerHTML = '🛒 Keranjang';
        }, 2000);
      }
    });
  });

  // View details button handlers
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.getAttribute('data-id');
      showProductModal(productId);
    });
  });
}

// Filter and search products
function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const sortValue = document.getElementById('sortSelect').value;
  const stockFilter = document.getElementById('stockFilter').value;

  // Filter by search term
  filteredProducts = allProducts.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm));
    
    const matchesStock = stockFilter === 'all' || (stockFilter === 'available' && product.stock > 0);
    
    return matchesSearch && matchesStock;
  });

  // Sort products
  switch (sortValue) {
    case 'price-low':
      filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case 'name-asc':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      // Keep original order
      filteredProducts = [...allProducts.filter(p => {
        const matchesSearch = !searchTerm || 
          p.name.toLowerCase().includes(searchTerm) ||
          (p.description && p.description.toLowerCase().includes(searchTerm));
        const matchesStock = stockFilter === 'all' || (stockFilter === 'available' && p.stock > 0);
        return matchesSearch && matchesStock;
      })];
  }

  renderProducts();
}

// Add to cart
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: 1,
      image_url: product.image_url
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  window.dispatchEvent(new Event('cartUpdated'));
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  document.getElementById('cartCount').textContent = count;
}

// Show product modal
function showProductModal(productId) {
  const product = allProducts.find(p => p.id == productId);
  if (!product) return;

  const modal = document.createElement('div');
  modal.className = 'modal d-block animate-fade-up';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg" style="animation: slideInUp 0.3s ease;">
      <div class="modal-content border-0" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title" style="color: var(--primary-color); font-weight: 700;">Detail Produk</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div class="row g-4">
            <div class="col-md-6">
              <img 
                src="${product.image_url || 'https://via.placeholder.com/400x400?text=Kopi'}" 
                alt="${product.name}"
                style="width: 100%; border-radius: 15px; object-fit: cover;"
              />
            </div>
            <div class="col-md-6">
              <h3 style="color: var(--primary-color); font-weight: 700; margin-bottom: 10px;">${product.name}</h3>
              
              <div class="mb-3">
                <span class="text-warning">★★★★★</span>
                <span class="text-muted small ms-2">(${Math.floor(Math.random() * 50) + 10} ulasan)</span>
              </div>

              <div class="mb-4 pb-3 border-bottom">
                <p class="small text-muted mb-2">Harga:</p>
                <p class="fs-4 fw-bold" style="color: var(--secondary-color);">
                  Rp ${parseFloat(product.price).toLocaleString('id-ID')}
                </p>
                <p class="small text-muted">Per ${product.unit || '1 kg'}</p>
              </div>

              <p class="text-muted mb-4">
                ${product.description || 'Kopi premium pilihan berkualitas tinggi'}
              </p>

              <div class="mb-4">
                <p class="small fw-600 mb-2">Stok Tersedia:</p>
                <p class="fs-5" style="color: ${product.stock > 0 ? '#28a745' : '#dc3545'};">
                  ${product.stock > 0 ? `${product.stock} unit` : 'Habis'}
                </p>
              </div>

              <div class="d-flex gap-2">
                <input type="number" id="quantityInput" min="1" max="${product.stock}" value="1" class="form-control" style="width: 100px;" />
                <button class="btn flex-grow-1 add-quantity-btn" style="background: linear-gradient(135deg, #d2691e, #cd853f); color: white; border: none; font-weight: 600; border-radius: 10px;" data-id="${product.id}">
                  🛒 Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  modal.querySelector('.btn-close').addEventListener('click', () => modal.remove());
  modal.querySelector('.add-quantity-btn').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('quantityInput').value);
    const item = {
      ...product,
      quantity: qty
    };
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(p => p.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push(item);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    modal.remove();
    showSuccess(`${product.name} ditambahkan ke keranjang!`);
  });
}

// Show error message
function showError(message) {
  console.error(message);
}

// Show success message
function showSuccess(message) {
  console.log('Success:', message);
  // Could be enhanced with a toast notification
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', debounce(filterProducts, 300));
document.getElementById('sortSelect').addEventListener('change', filterProducts);
document.getElementById('stockFilter').addEventListener('change', filterProducts);
document.getElementById('resetFiltersBtn').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('sortSelect').value = 'default';
  document.getElementById('stockFilter').value = 'all';
  filterProducts();
});

const resetEmptyBtn = document.getElementById('resetEmptyBtn');
if (resetEmptyBtn) {
  resetEmptyBtn.addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = 'default';
    document.getElementById('stockFilter').value = 'all';
    filterProducts();
  });
}

// Handle auth button
const authBtn = document.getElementById('authBtn');
if (authBtn) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (currentUser) {
    authBtn.textContent = `👤 ${currentUser.username || 'Akun'}`;
    authBtn.href = currentUser.is_admin ? 'dashboard_admin.html' : 'dashboard_cust.html';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();

  window.addEventListener('storage', () => {
    updateCartCount();
  });
});
          .filter(Boolean);
      }
      const normalized = Object.assign({}, raw, { category: categories });
      return {
        id: parseInt(id, 10),
        ...normalized,
        categoryString: categories.join(" "),
        searchString: this.createSearchString(normalized),
      };
    });
  }

  createSearchString(product) {
    if (!product) return "";
    const categories = Array.isArray(product.category)
      ? product.category
      : product.category
      ? String(product.category)
          .split(/,|;/)
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
    const badges = Array.isArray(product.badges)
      ? product.badges.map((b) => b && b.text).filter(Boolean)
      : [];
    const specs = Array.isArray(product.specs) ? product.specs : [];
    return [
      product.name || "",
      product.description || "",
      ...categories,
      ...badges,
      product.origin || "",
      product.roastLevel || "",
      product.process || "",
      ...specs,
    ]
      .join(" ")
      .toLowerCase();
  }

  init() {
    this.setupEventListeners();
    this.renderProducts();
    this.updateResultsInfo();
    this.setupSearchSuggestions();
    this.updateFilterButtons();
  }

  updateFilterButtons() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-category") === this.currentCategory)
        btn.classList.add("active");
      else if (
        this.currentCategory === "all" &&
        btn.getAttribute("data-category") === "all"
      )
        btn.classList.add("active");
    });
  }

  setupEventListeners() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.currentCategory = e.currentTarget.getAttribute("data-category");
        this.currentPage = 1;
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.updateURLWithCategory(this.currentCategory);
        this.filterAndSortProducts();
      });
    });

    const sortEl = document.getElementById("sortSelect");
    if (sortEl)
      sortEl.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.filterAndSortProducts();
      });

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn)
      searchBtn.addEventListener("click", () => this.performSearch());
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.performSearch();
      });
      searchInput.addEventListener("input", (e) =>
        this.showSearchSuggestions(e.target.value)
      );
      searchInput.addEventListener("focus", () => {
        const so = document.getElementById("searchOptions");
        if (so) so.classList.add("active");
      });
    }

    document.querySelectorAll(".search-option-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const filterType = e.currentTarget.getAttribute("data-filter");
        const filterValue = e.currentTarget.getAttribute("data-value");
        e.currentTarget.classList.toggle("active");
        if (e.currentTarget.classList.contains("active"))
          this.activeFilters[filterType].push(filterValue);
        else
          this.activeFilters[filterType] = this.activeFilters[
            filterType
          ].filter((v) => v !== filterValue);
        this.currentPage = 1;
        this.filterAndSortProducts();
      });
    });

    document.addEventListener("click", (e) => {
      const searchInput = document.getElementById("searchInput");
      const searchOptions = document.getElementById("searchOptions");
      if (!searchInput || !searchOptions) return;
      if (!searchInput.contains(e.target) && !searchOptions.contains(e.target))
        searchOptions.classList.remove("active");
    });

    const resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) resetBtn.addEventListener("click", () => this.resetFilters());
  }

  updateURLWithCategory(category) {
    try {
      const url = new URL(window.location);
      if (category === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", category);
      window.history.pushState({}, "", url);
    } catch (e) {
      /* ignore for file:// */
    }
  }

  performSearch() {
    const el = document.getElementById("searchInput");
    this.currentSearch = el ? el.value.toLowerCase().trim() : "";
    this.currentPage = 1;
    if (this.currentSearch) {
      this.searchHistory.unshift(this.currentSearch);
      if (this.searchHistory.length > 5) this.searchHistory.pop();
    }
    this.filterAndSortProducts();
    this.hideSearchSuggestions();
  }

  showSearchSuggestions(query) {
    const suggestionsContainer = document.getElementById("searchSuggestions");
    if (!suggestionsContainer) return;
    if (!query || query.length < 2) {
      suggestionsContainer.classList.remove("active");
      return;
    }
    const suggestions = new Set();
    this.allProducts.forEach((p) => {
      if (p.name && p.name.toLowerCase().includes(query))
        suggestions.add(p.name);
      (p.category || []).forEach((cat) => {
        if (cat.toLowerCase().includes(query))
          suggestions.add(cat.charAt(0).toUpperCase() + cat.slice(1));
      });
      (p.badges || []).forEach((b) => {
        if (b.text && b.text.toLowerCase().includes(query))
          suggestions.add(b.text);
      });
    });
    this.searchHistory.forEach((term) => {
      if (term.includes(query)) suggestions.add(`🔍 ${term}`);
    });
    const popular = [
      "gayo",
      "toraja",
      "luwak",
      "espresso",
      "arabica",
      "robusta",
      "specialty",
    ];
    popular.forEach((t) => {
      if (t.includes(query))
        suggestions.add(t.charAt(0).toUpperCase() + t.slice(1));
    });
    if (suggestions.size > 0) {
      let html = "";
      Array.from(suggestions)
        .slice(0, 8)
        .forEach(
          (s) =>
            (html += `<div class="suggestion-item" data-suggestion="${s.replace(
              "🔍 ",
              ""
            )}">${s}</div>`)
        );
      suggestionsContainer.innerHTML = html;
      suggestionsContainer.classList.add("active");
      suggestionsContainer
        .querySelectorAll(".suggestion-item")
        .forEach((item) =>
          item.addEventListener("click", (e) => {
            const s = e.currentTarget.getAttribute("data-suggestion");
            const input = document.getElementById("searchInput");
            if (input) input.value = s;
            this.performSearch();
          })
        );
    } else suggestionsContainer.classList.remove("active");
  }

  hideSearchSuggestions() {
    const s = document.getElementById("searchSuggestions");
    if (s) s.classList.remove("active");
  }

  setupSearchSuggestions() {
    document.addEventListener("click", (e) => {
      const suggestions = document.getElementById("searchSuggestions");
      const input = document.getElementById("searchInput");
      if (!suggestions || !input) return;
      if (!suggestions.contains(e.target) && !input.contains(e.target))
        suggestions.classList.remove("active");
    });
  }

  resetFilters() {
    this.currentCategory = "all";
    this.currentSearch = "";
    this.currentSort = "default";
    this.currentPage = 1;
    this.activeFilters = { origin: [], roast: [], process: [] };
    const si = document.getElementById("searchInput");
    if (si) si.value = "";
    const ss = document.getElementById("sortSelect");
    if (ss) ss.value = "default";
    document
      .querySelectorAll(".search-option-btn")
      .forEach((b) => b.classList.remove("active"));
    this.updateFilterButtons();
    this.updateURLWithCategory("all");
    if (typeof updatePageTitleByCategory === "function")
      updatePageTitleByCategory("all");
    document.title = "Products - Kopi Prima";
    const pt = document.getElementById("pageTitle");
    if (pt) pt.textContent = "Produk Kopi Prima";
    const pd = document.getElementById("pageDescription");
    if (pd)
      pd.textContent =
        "Temukan biji kopi berkualitas dari berbagai daerah di Indonesia";
    this.filterAndSortProducts();
  }

  filterAndSortProducts() {
    this.filteredProducts = [...this.allProducts];
    if (this.currentCategory !== "all")
      this.filteredProducts = this.filteredProducts.filter((p) =>
        (p.category || []).includes(this.currentCategory)
      );
    if (this.currentSearch)
      this.filteredProducts = this.filteredProducts.filter(
        (p) => p.searchString && p.searchString.includes(this.currentSearch)
      );
    Object.keys(this.activeFilters).forEach((ft) => {
      if (this.activeFilters[ft].length > 0) {
        this.filteredProducts = this.filteredProducts.filter((product) => {
          if (ft === "origin")
            return this.activeFilters.origin.includes(product.origin);
          if (ft === "roast")
            return this.activeFilters.roast.includes(product.roastLevel);
          if (ft === "process")
            return this.activeFilters.process.includes(product.process);
          return true;
        });
      }
    });
    this.sortProducts();
    this.renderProducts();
    this.updateResultsInfo();
  }

  sortProducts() {
    switch (this.currentSort) {
      case "price-low":
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "popular":
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        this.filteredProducts.sort((a, b) => a.id - b.id);
    }
  }

  renderProducts() {
    const productsGrid = document.getElementById("productsGrid");
    const emptyState = document.getElementById("emptyState");
    const pagination = document.getElementById("pagination");
    if (!productsGrid) return;
    if (this.filteredProducts.length === 0) {
      productsGrid.innerHTML = "";
      if (emptyState) emptyState.classList.remove("d-none");
      if (pagination) pagination.classList.add("d-none");
      return;
    }
    if (emptyState) emptyState.classList.add("d-none");
    if (pagination) pagination.classList.remove("d-none");
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const currentProducts = this.filteredProducts.slice(startIndex, endIndex);
    productsGrid.innerHTML = "";
    currentProducts.forEach((product, index) => {
      const productHTML = this.createProductHTML(product);
      const productElement = document.createElement("div");
      productElement.className = "col-md-6 col-lg-4 col-xl-3";
      productElement.setAttribute(
        "data-category",
        product.categoryString || ""
      );
      productElement.innerHTML = productHTML;
      productsGrid.appendChild(productElement);
      setTimeout(() => {
        const card = productElement.querySelector(".product-card");
        if (card) {
          card.classList.add("visible");
          card.style.animationDelay = `${index * 0.1}s`;
        }
      }, 10);
    });
    this.attachProductEventListeners();
    this.setupPagination();
  }

  createProductHTML(product) {
    const typeClass =
      product.type === "green-bean" ? "green-bean-tag" : "roasted-bean-tag";
    const typeBadge =
      product.type === "green-bean" ? "green-bean" : "roasted-bean";
    const typeText =
      product.type === "green-bean" ? "Green Beans" : "Roasted Beans";
    return `
      <div class="card product-card h-100">
        <div class="position-relative">
          <div class="type-badge ${typeBadge}">${typeText}</div>
          <img src="${this.resolveImgSrc(
            product.image || product.image_url || ""
          )}" class="card-img-top product-image" alt="${
      product.name || ""
    }" loading="lazy">
          <div class="price-tag ${typeClass}">Rp ${
      product.price ? product.price.toLocaleString("id-ID") : "0"
    }</div>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title text-primary">${product.name || ""}</h5>
          <p class="price-per-unit text-muted">${product.pricePer || ""}</p>
          <p class="card-text text-muted flex-grow-1">${(
            product.description || ""
          ).substring(0, 100)}...</p>
          <div class="mt-auto">
            <div class="d-flex flex-wrap gap-2 mb-3">
              ${(product.badges || [])
                .map((b) => `<span class="badge ${b.class}">${b.text}</span>`)
                .join("")}
            </div>
            <div class="row g-2">
              <div class="col-6 weight-options">
                <div class="form-control form-control-sm text-center" aria-hidden="true">1 kg</div>
              </div>
              <div class="col-6">
                <button class="btn btn-primary w-100 btn-sm add-to-cart-btn" data-id="${
                  product.id
                }"><i class="fas fa-cart-plus me-1"></i>Add 1 kg to Cart</button>
              </div>
            </div>
            <button class="btn btn-outline-primary w-100 mt-2 btn-sm btn-detail" data-id="${
              product.id
            }"><i class="fas fa-info-circle me-1"></i>Detail</button>
          </div>
        </div>
      </div>
    `;
  }

  attachProductEventListeners() {
    document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.removeEventListener("click", this._addHandler);
      btn.addEventListener("click", (e) => {
        const productId = parseInt(e.currentTarget.getAttribute("data-id"), 10);
        const weightSelect = document.querySelector(
          `select[data-product="${productId}"]`
        );
        const weight = weightSelect ? parseInt(weightSelect.value, 10) : 1000;
        if (window.cartSystem) window.cartSystem.addToCart(productId, weight);
      });
    });

    document.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.removeEventListener("click", this._detailHandler);
      btn.addEventListener("click", (e) => {
        const productId = parseInt(e.currentTarget.getAttribute("data-id"), 10);
        this.showProductDetails(productId);
      });
    });
  }

  showProductDetails(productId) {
    const product = window.products && window.products[productId];
    if (!product) return;
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) modalTitle.textContent = product.name || "";
    const modalImage = document.getElementById("modalImage");
    if (modalImage) {
      modalImage.src = product.image || "";
      modalImage.alt = product.name || "";
    }
    const modalPrice = document.getElementById("modalPrice");
    if (modalPrice)
      modalPrice.textContent = `Rp ${
        product.price ? product.price.toLocaleString("id-ID") : "0"
      }`;
    const modalPricePerUnit = document.getElementById("modalPricePerUnit");
    if (modalPricePerUnit)
      modalPricePerUnit.textContent = product.pricePer || "";
    const modalDescription = document.getElementById("modalDescription");
    if (modalDescription)
      modalDescription.textContent = product.description || "";
    const badgesContainer = document.getElementById("modalBadges");
    if (badgesContainer) {
      badgesContainer.innerHTML = "";
      (product.badges || []).forEach((b) => {
        const span = document.createElement("span");
        span.className = `badge ${b.class} me-2`;
        span.textContent = b.text;
        badgesContainer.appendChild(span);
      });
    }
    const specsContainer = document.getElementById("modalSpecs");
    if (specsContainer) {
      const specs = Array.isArray(product.specs) ? product.specs : [];
      if (specs.length === 0) {
        specsContainer.innerHTML =
          '<li class="mb-2 text-muted">Tidak ada spesifikasi.</li>';
      } else {
        specsContainer.innerHTML = specs
          .map((spec) => `<li class="mb-2">${spec}</li>`) // simple list
          .join("");
      }
    }

    // Populate structured spec metadata if present (spec_meta)
    const specMetaContainer = document.getElementById("modalSpecMeta");
    if (specMetaContainer) {
      const meta = product.spec_meta || {};
      const keys = Object.keys(meta || {});
      if (!keys.length) {
        specMetaContainer.innerHTML = "";
        specMetaContainer.style.display = "none";
      } else {
        specMetaContainer.style.display = "block";
        let metaHtml = "";
        // preferred order for common keys
        const preferred = [
          "asal",
          "origin",
          "altitude",
          "process",
          "roast",
          "roast_level",
          "grade",
        ];
        const ordered = [];
        preferred.forEach((k) => {
          if (k in meta) ordered.push(k);
        });
        keys.forEach((k) => {
          if (!ordered.includes(k)) ordered.push(k);
        });
        ordered.forEach((k) => {
          const label = k
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          metaHtml += `<div class="mb-1"><strong>${label}:</strong> ${meta[k]}</div>`;
        });
        specMetaContainer.innerHTML = metaHtml;
      }
    }
    const weightSelect = document.getElementById("modalWeight");
    if (weightSelect) {
      // We sell per kilogram only — show static 1 kg and set data-weight to 1000 grams
      weightSelect.innerText = "1 kg";
      weightSelect.setAttribute("data-weight", "1000");
    }
    const modalQuantity = document.getElementById("modalQuantity");
    if (modalQuantity) modalQuantity.value = 1;
    const modalAddToCartBtn = document.getElementById("modalAddToCart");
    if (modalAddToCartBtn) {
      modalAddToCartBtn.onclick = () => {
        // modalWeight may be a select (old) or a static div with data-weight
        let weight = 1000;
        const mw = document.getElementById("modalWeight");
        if (mw) {
          if (mw.tagName && mw.tagName.toLowerCase() === "select") {
            weight = parseInt(mw.value, 10) || 1000;
          } else {
            weight = parseInt(mw.getAttribute("data-weight"), 10) || 1000;
          }
        }
        const quantity =
          parseInt(document.getElementById("modalQuantity").value, 10) || 1;
        for (let i = 0; i < quantity; i++)
          if (window.cartSystem) window.cartSystem.addToCart(productId, weight);
        const modalEl = document.getElementById("productModal");
        if (modalEl) {
          const bs = bootstrap.Modal.getInstance(modalEl);
          if (bs) bs.hide();
        }
      };
    }
    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    if (modal) modal.show();
  }

  setupPagination() {
    const totalPages = Math.ceil(
      (this.filteredProducts.length || 0) / this.productsPerPage
    );
    const paginationContainer = document.getElementById("pagination");
    if (!paginationContainer) return;
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }
    let html = "";
    const maxVisiblePages = 5;
    html += `<li class="page-item ${
      this.currentPage === 1 ? "disabled" : ""
    }"><a class="page-link" href="#" aria-label="Previous" data-page="${
      this.currentPage - 1
    }"><span aria-hidden="true">&laquo;</span></a></li>`;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages)
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    for (let i = startPage; i <= endPage; i++)
      html += `<li class="page-item ${
        i === this.currentPage ? "active" : ""
      }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    html += `<li class="page-item ${
      this.currentPage === totalPages ? "disabled" : ""
    }"><a class="page-link" href="#" aria-label="Next" data-page="${
      this.currentPage + 1
    }"><span aria-hidden="true">&raquo;</span></a></li>`;
    paginationContainer.innerHTML = html;
    paginationContainer.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(e.currentTarget.getAttribute("data-page"), 10);
        if (page && page >= 1 && page <= totalPages) this.goToPage(page);
      });
    });
  }

  goToPage(page) {
    this.currentPage = page;
    this.renderProducts();
    this.updateResultsInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateResultsInfo() {
    const startIndex = (this.currentPage - 1) * this.productsPerPage + 1;
    const endIndex = Math.min(
      this.currentPage * this.productsPerPage,
      this.filteredProducts.length
    );
    const totalProducts = this.filteredProducts.length || 0;
    const ri = document.getElementById("resultsInfo");
    if (ri)
      ri.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${totalProducts} produk`;
  }
}

class CartSystem {
  constructor() {
    // Do not persist cart in localStorage. Server (requires login) is authoritative.
    this.cart = [];
    this.shippingCost = 15000;
    this.init();
  }

  init() {
    this.updateCartCount();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const cartBtn = document.getElementById("cartBtn");
    if (cartBtn) cartBtn.addEventListener("click", () => this.openCart());
    const closeCart = document.getElementById("closeCart");
    if (closeCart) closeCart.addEventListener("click", () => this.closeCart());
    const cartOverlay = document.getElementById("cartOverlay");
    if (cartOverlay)
      cartOverlay.addEventListener("click", () => this.closeCart());
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn)
      checkoutBtn.addEventListener("click", () => this.checkout());
    const clearCartBtn = document.getElementById("clearCartBtn");
    if (clearCartBtn)
      clearCartBtn.addEventListener("click", () => this.clearCart());
  }

  addToCart(productId, weight = 1000) {
    const product =
      window.products && window.products[productId]
        ? window.products[productId]
        : null;
    if (!product) return;
    const weightOption = (product.weightOptions || []).find(
      (opt) => opt.value === weight
    );
    const priceMultiplier = weightOption ? weightOption.priceMultiplier : 1;
    const itemPrice = Math.round((product.price || 0) * priceMultiplier);
    // Require login and use server API to add to cart
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    let userId = null;
    try {
      const cu = localStorage.getItem("currentUser");
      if (cu) {
        const parsed = JSON.parse(cu);
        userId = String(parsed.id || parsed.user_id || null);
      }
    } catch (e) {}
    if (!userId) userId = localStorage.getItem("user_id") || null;

    if (!isLoggedIn || !userId) {
      if (
        confirm(
          "Anda perlu login untuk menambahkan produk ke keranjang. Login sekarang?"
        )
      ) {
        window.location.href = "login.html?redirect=products.html";
      }
      return;
    }

    // Call server API to add
      fetch(`${window.API_BASE || "http://127.0.0.1:5000/api"}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    })
      .then((r) =>
        r.json().then((j) => ({ ok: r.ok, status: r.status, body: j }))
      )
      .then((resp) => {
        if (!resp.ok) {
          alert(resp.body.message || `Add to cart failed (${resp.status})`);
          return;
        }
        // Update badge from server
        this.updateCartCount();
        this.showAddToCartNotification(product.name);
      })
      .catch((err) => {
        console.error("Add to cart error", err);
        alert("Gagal menambahkan ke keranjang");
      });
  }

  removeFromCart(index) {
    // Cart is server-side. Open cart page to manage items or implement API calls here.
    alert(
      "Untuk menghapus item, buka halaman Keranjang (cart.html) dan hapus dari sana."
    );
  }

  updateQuantity(index, newQuantity) {
    // Quantity updates are server-side. Direct users to cart page.
    alert(
      "Untuk mengubah jumlah, buka halaman Keranjang (cart.html) dan ubah jumlah item di sana."
    );
  }

  saveCart() {
    // No-op: cart persistence is handled by server
  }

  updateCartCount() {
    // If user is logged in, prefer server-side cart count to stay consistent
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      try {
        // derive user id from currentUser
        let userId = null;
        const cu = localStorage.getItem("currentUser");
        if (cu) {
          const parsed = JSON.parse(cu);
          userId = String(
            parsed.id || parsed.user_id || parsed.id === 0
              ? parsed.id || parsed.user_id
              : null
          );
        }
        if (!userId) userId = localStorage.getItem("user_id") || null;
        if (userId) {
          fetch(`${window.API_BASE || "http://127.0.0.1:5000/api"}/cart`, {
            headers: { "X-User-ID": userId },
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              const cnt =
                json && json.data && json.data.item_count
                  ? json.data.item_count
                  : 0;
              const el = document.getElementById("cartCount");
              if (el) el.textContent = cnt;
            })
            .catch((e) => {
              // fallback to local
              const totalItems = this.cart.reduce((s, i) => s + i.quantity, 0);
              const el = document.getElementById("cartCount");
              if (el) el.textContent = totalItems;
            });
          return;
        }
      } catch (e) {
        // fallthrough to local
      }
    }

    const totalItems = this.cart.reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = totalItems;
  }

  openCart() {
    this.updateCartDisplay();
    document.getElementById("cartSidebar").classList.add("active");
    document.getElementById("cartOverlay").classList.add("active");
  }
  closeCart() {
    document.getElementById("cartSidebar").classList.remove("active");
    document.getElementById("cartOverlay").classList.remove("active");
  }

  updateCartDisplay() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartSubtotal = document.getElementById("cartSubtotal");
    const cartTotal = document.getElementById("cartTotal");
    if (!cartItemsContainer || !cartSubtotal || !cartTotal) return;
    if (this.cart.length === 0) {
      cartItemsContainer.innerHTML = `<div class="text-center py-5"><i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i><p class="text-muted">Keranjang belanja kosong</p></div>`;
      cartSubtotal.textContent = "Rp 0";
      cartTotal.textContent = `Rp ${this.shippingCost.toLocaleString("id-ID")}`;
      return;
    }
    let itemsHTML = "";
    let subtotal = 0;
    this.cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      let weightLabel = `${item.weight}g`;
      if (item.weight >= 1000) weightLabel = `${item.weight / 1000}kg`;
      itemsHTML += `
      <div class="cart-item">
        <div class="d-flex">
          <img src="${this.resolveImgSrc(
            item.image || item.image_url || ""
          )}" alt="${
        item.name || ""
      }" class="rounded" style="width:60px;height:60px;object-fit:cover;">
          <div class="ms-3 flex-grow-1">
            <h6 class="mb-1">${item.name}</h6>
            <small class="text-muted">${weightLabel} • Rp ${item.price.toLocaleString(
        "id-ID"
      )}</small>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="input-group input-group-sm" style="width:120px;">
                <button class="btn btn-outline-secondary" type="button" onclick="window.cartSystem.updateQuantity(${index}, ${
        item.quantity - 1
      })">-</button>
                <input type="text" class="form-control text-center" value="${
                  item.quantity
                }" readonly>
                <button class="btn btn-outline-secondary" type="button" onclick="window.cartSystem.updateQuantity(${index}, ${
        item.quantity + 1
      })">+</button>
              </div>
              <span class="fw-bold">Rp ${itemTotal.toLocaleString(
                "id-ID"
              )}</span>
              <button class="btn btn-link text-danger btn-sm" onclick="window.cartSystem.removeFromCart(${index})"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    });
    const total = subtotal + this.shippingCost;
    cartItemsContainer.innerHTML = itemsHTML;
    cartSubtotal.textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
    cartTotal.textContent = `Rp ${total.toLocaleString("id-ID")}`;
  }

  checkout() {
    if (this.cart.length === 0) {
      alert("Keranjang belanja kosong!");
      return;
    }
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      if (confirm("Anda perlu login untuk checkout. Lanjut ke halaman login?"))
        window.location.href = "login.html?redirect=checkout";
      return;
    }
    showLoading();
    setTimeout(() => {
      hideLoading();
      const orderNumber = "ORD-" + Date.now().toString().slice(-8);
      const subtotal = this.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const total = subtotal + this.shippingCost;
      this.showNotification(
        `<div class="d-flex align-items-center"><i class="fas fa-check-circle fa-2x me-3"></i><div><h5 class="mb-1">Checkout Berhasil!</h5><p class="mb-0">Order #${orderNumber} telah diterima.</p><p class="mb-0">Total: Rp ${total.toLocaleString(
          "id-ID"
        )}</p><small>Kami akan mengirimkan konfirmasi ke email Anda.</small></div></div>`,
        "success"
      );
      this.clearCart(true);
    }, 1500);
  }

  clearCart(showNotification = false) {
    if (this.cart.length === 0) return;
    if (
      !showNotification &&
      !confirm("Apakah Anda yakin ingin mengosongkan keranjang belanja?")
    )
      return;
    this.cart = [];
    this.saveCart();
    this.updateCartCount();
    this.updateCartDisplay();
    if (showNotification)
      this.showNotification("Keranjang belanja telah dikosongkan", "info");
  }

  showAddToCartNotification(productName) {
    this.showNotification(
      `<div class="d-flex align-items-center"><i class="fas fa-check-circle me-2"></i><span>${productName} ditambahkan ke keranjang!</span></div>`,
      "success"
    );
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3`;
    notification.style.zIndex = "9999";
    notification.style.minWidth = "300px";
    notification.innerHTML = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

// Utility functions used by the page
function showLoading() {
  const el = document.getElementById("loadingSpinner");
  if (el) el.classList.add("active");
}
function hideLoading() {
  const el = document.getElementById("loadingSpinner");
  if (el) el.classList.remove("active");
}
function createCoffeeBean() {
  if (window.innerWidth > 768) {
    const bean = document.createElement("div");
    bean.className = "coffee-bean";
    bean.innerHTML = "☕";
    bean.style.left = Math.random() * window.innerWidth + "px";
    bean.style.animationDuration = Math.random() * 3 + 2 + "s";
    document.body.appendChild(bean);
    setTimeout(() => bean.remove(), 5000);
  }
}

// Expose classes globally (so products.html init can instantiate them)
if (typeof window !== "undefined") {
  window.ProductManager = ProductManager;
  window.CartSystem = CartSystem;
}

async function addToCart(productId, quantity = 1) {
  const API_URL = window.API_BASE || "http://127.0.0.1:5000";
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("Silakan login terlebih dahulu");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Gagal menambahkan ke keranjang");
      return;
    }

    // sukses
    showCartSidebar();
    await loadCartSidebar();
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat menambahkan ke keranjang");
  }
}
