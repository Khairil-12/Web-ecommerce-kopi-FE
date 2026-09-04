// ===== CART PAGE SCRIPT =====

const API_URL = window.API_CONFIG?.API_URL || "http://localhost:5000/api";

class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart") || "[]");
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (this.cart.length === 0) {
      this.showEmptyCart();
      return;
    }

    this.showCartContent();
    this.renderCartItems();
    this.updateSummary();
  }

  showEmptyCart() {
    document.getElementById("emptyCartState").classList.remove("d-none");
    document.getElementById("cartContent").classList.add("d-none");
    document.getElementById("ctaSection").classList.remove("d-none");
  }

  showCartContent() {
    document.getElementById("emptyCartState").classList.add("d-none");
    document.getElementById("cartContent").classList.remove("d-none");
    document.getElementById("ctaSection").classList.add("d-none");
  }

  renderCartItems() {
    const container = document.getElementById("cartItems");

    container.innerHTML = this.cart
      .map(
        (item, index) => `
      <div class="cart-item mb-4 pb-4 border-bottom animate-fade-up stagger-item" style="animation-delay: ${index * 0.1}s;">
        <div class="row g-3 align-items-start">
          <!-- Product Image -->
          <div class="col-md-2">
            <div style="background: linear-gradient(135deg, #f5f5dc, #fff8dc); border-radius: 15px; overflow: hidden; height: 120px;">
              <img 
                src="${item.image_url || "https://via.placeholder.com/150x150?text=Kopi"}" 
                alt="${item.name}"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
            </div>
          </div>

          <!-- Product Details -->
          <div class="col-md-4">
            <h6 class="fw-bold mb-2" style="color: var(--primary-color);">${item.name}</h6>
            <p class="small text-muted mb-2">Per ${item.unit || "1 kg"}</p>
            <p class="fs-6 fw-bold" style="color: var(--secondary-color);">
              Rp ${parseFloat(item.price).toLocaleString("id-ID")}
            </p>
          </div>

          <!-- Quantity Controls -->
          <div class="col-md-3">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-light decrease-qty-btn" data-index="${index}" style="border-radius: 8px; padding: 5px 10px;">
                −
              </button>
              <input 
                type="number" 
                class="form-control form-control-sm qty-input" 
                value="${item.quantity}" 
                min="1"
                data-index="${index}"
                style="text-align: center; border-radius: 8px; width: 60px;"
              />
              <button class="btn btn-sm btn-light increase-qty-btn" data-index="${index}" style="border-radius: 8px; padding: 5px 10px;">
                +
              </button>
            </div>
          </div>

          <!-- Subtotal & Remove -->
          <div class="col-md-3 text-end">
            <p class="mb-2 fw-bold" style="color: var(--primary-color);">
              Rp ${(parseFloat(item.price) * item.quantity).toLocaleString("id-ID")}
            </p>
            <button class="btn btn-sm btn-danger remove-item-btn transition-all" data-index="${index}" style="border-radius: 8px; font-size: 0.85rem;">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    this.setupItemEventListeners();
  }

  setupItemEventListeners() {
    // Quantity input change
    document.querySelectorAll(".qty-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"));
        const newQty = parseInt(e.target.value) || 1;
        this.updateQuantity(index, newQty);
      });
    });

    // Decrease quantity
    document.querySelectorAll(".decrease-qty-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"));
        const newQty = Math.max(1, this.cart[index].quantity - 1);
        this.updateQuantity(index, newQty);
      });
    });

    // Increase quantity
    document.querySelectorAll(".increase-qty-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"));
        const newQty = this.cart[index].quantity + 1;
        this.updateQuantity(index, newQty);
      });
    });

    // Remove item
    document.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"));
        this.removeItem(index);
      });
    });
  }

  updateQuantity(index, newQty) {
    this.cart[index].quantity = Math.max(1, newQty);
    this.save();
    this.renderCartItems();
    this.updateSummary();
  }

  removeItem(index) {
    const item = this.cart[index];
    const btn = document.querySelector(
      `[data-index="${index}"].remove-item-btn`,
    );

    // Animate removal
    btn.innerHTML = "✓ Dihapus";
    btn.style.background = "#28a745";

    setTimeout(() => {
      this.cart.splice(index, 1);
      this.save();
      this.render();
    }, 300);
  }

  updateSummary() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0,
    );
    const shipping = subtotal > 500000 ? 0 : 25000; // Free shipping for orders > 500k
    const discount = Math.floor(subtotal * 0.05); // 5% discount
    const total = subtotal + shipping - discount;

    const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("itemCount").textContent = itemCount;
    document.getElementById("subtotal").textContent =
      `Rp ${subtotal.toLocaleString("id-ID")}`;
    document.getElementById("shipping").textContent =
      shipping === 0 ? "GRATIS" : `Rp ${shipping.toLocaleString("id-ID")}`;
    document.getElementById("discount").textContent =
      `-Rp ${discount.toLocaleString("id-ID")}`;
    document.getElementById("total").textContent =
      `Rp ${total.toLocaleString("id-ID")}`;
  }

  save() {
    localStorage.setItem("cart", JSON.stringify(this.cart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  setupEventListeners() {
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", this.handleCheckout.bind(this));
    }
  }

  async handleCheckout(e) {
    e.preventDefault();

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null",
    );
    if (!currentUser) {
      alert("Silakan login dulu untuk melanjutkan");
      window.location.href = "login.html";
      return;
    }

    const address = document.getElementById("shippingAddress").value.trim();
    const paymentMethod = document.getElementById("paymentMethod").value;

    if (!address) {
      alert("Alamat pengiriman wajib diisi");
      return;
    }

    if (!paymentMethod) {
      alert("Pilih metode pembayaran");
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = "⏳ Memproses...";

    try {
      // Prepare checkout data
      const checkoutData = {
        user_id: currentUser.id,
        items: this.cart,
        shipping_address: address,
        payment_method: paymentMethod,
        total: this.calculateTotal(),
      };

      const response = await fetch(`${API_URL}/cart/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": currentUser.id,
        },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (data.status === "success" || data.success) {
        // Clear cart
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));

        // Show success message
        alert("✓ Checkout berhasil! Pesanan Anda telah diproses.");
        window.location.href = "index.html";
      } else {
        alert("Checkout gagal: " + (data.message || "Silakan coba lagi"));
        submitBtn.disabled = false;
        submitBtn.innerHTML = "✓ Proses Checkout";
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error: " + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = "✓ Proses Checkout";
    }
  }

  calculateTotal() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0,
    );
    const shipping = subtotal > 500000 ? 0 : 25000;
    const discount = Math.floor(subtotal * 0.05);
    return subtotal + shipping - discount;
  }
}

// Handle auth button
const authBtn = document.getElementById("authBtn");
if (authBtn) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (currentUser) {
    authBtn.textContent = `👤 ${currentUser.username || "Akun"}`;
    authBtn.href = currentUser.is_admin
      ? "dashboard_admin.html"
      : "dashboard_cust.html";
  }
}

// Initialize cart manager
document.addEventListener("DOMContentLoaded", () => {
  new CartManager();

  // Listen for cart changes from other pages
  window.addEventListener("storage", () => {
    new CartManager();
  });
});
