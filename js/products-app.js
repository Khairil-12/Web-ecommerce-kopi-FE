/* products-app.js
   Contains ProductManager and CartSystem class definitions and utility functions.
   These rely on a global `products` mapping (window.products) which is populated
   by `products.js` via fetchProductsFromApi().
*/

class ProductManager {
  constructor() {
    this.currentPage = 1;
    this.productsPerPage = 8;
    this.currentCategory = "all";
    this.currentSort = "default";
    this.currentSearch = "";
    this.activeFilters = { origin: [], roast: [], process: [] };
    this.allProducts = this.prepareProductsData();
    this.filteredProducts = [...this.allProducts];
    this.searchHistory = [];

    // Check for URL parameter first
    const urlCategory =
      typeof applyCategoryFilterFromURL === "function"
        ? applyCategoryFilterFromURL()
        : null;
    if (urlCategory) this.currentCategory = urlCategory;

    this.init();
  }

  prepareProductsData() {
    if (typeof window.products === "undefined" || !window.products) return [];
    return Object.keys(window.products).map((id) => {
      const raw = window.products[id] || {};
      const categories = Array.isArray(raw.category)
        ? raw.category
        : raw.category
        ? [raw.category]
        : [];
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
      ? [product.category]
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
          <img src="${
            product.image || ""
          }" class="card-img-top product-image" alt="${
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
                <select class="form-select form-select-sm" data-product="${
                  product.id
                }">
                  ${(product.weightOptions || [])
                    .map(
                      (option) =>
                        `<option value="${option.value}">${option.label}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="col-6">
                <button class="btn btn-primary w-100 btn-sm add-to-cart-btn" data-id="${
                  product.id
                }"><i class="fas fa-cart-plus me-1"></i>Add to Cart</button>
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
      specsContainer.innerHTML = "";
      (product.specs || []).forEach((spec) => {
        const li = document.createElement("li");
        li.className = "mb-2";
        li.textContent = spec;
        specsContainer.appendChild(li);
      });
    }
    const weightSelect = document.getElementById("modalWeight");
    if (weightSelect) {
      weightSelect.innerHTML = (product.weightOptions || [])
        .map(
          (option) =>
            `<option value="${option.value}">${option.label} - Rp ${Math.round(
              (product.price || 0) * (option.priceMultiplier || 1)
            ).toLocaleString("id-ID")}</option>`
        )
        .join("");
    }
    const modalQuantity = document.getElementById("modalQuantity");
    if (modalQuantity) modalQuantity.value = 1;
    const modalAddToCartBtn = document.getElementById("modalAddToCart");
    if (modalAddToCartBtn) {
      modalAddToCartBtn.onclick = () => {
        const weight =
          parseInt(document.getElementById("modalWeight").value, 10) || 1000;
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
    this.cart = JSON.parse(localStorage.getItem("kopiprima_cart")) || [];
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
    const existingIndex = this.cart.findIndex(
      (item) => item.id === productId && item.weight === weight
    );
    if (existingIndex !== -1) this.cart[existingIndex].quantity += 1;
    else
      this.cart.push({
        id: productId,
        name: product.name,
        price: itemPrice,
        weight: weight,
        quantity: 1,
        image: product.image,
        type: product.type,
      });
    this.saveCart();
    this.updateCartCount();
    this.updateCartDisplay();
    this.showAddToCartNotification(product.name);
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.saveCart();
    this.updateCartCount();
    this.updateCartDisplay();
  }

  updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
      this.removeFromCart(index);
      return;
    }
    this.cart[index].quantity = newQuantity;
    this.saveCart();
    this.updateCartCount();
    this.updateCartDisplay();
  }

  saveCart() {
    localStorage.setItem("kopiprima_cart", JSON.stringify(this.cart));
  }

  updateCartCount() {
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
          <img src="${item.image || ""}" alt="${
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
