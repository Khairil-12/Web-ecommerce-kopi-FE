// ===== INDEX PAGE SCRIPT =====

// Configuration
const API_URL = window.API_CONFIG?.API_URL || "http://localhost:5000/api";

// Intersection Observer for animations on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("fade-in-on-scroll");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all fade-in elements
document
  .querySelectorAll(".animate-fade-up, .animate-fade-left, .animate-fade-right")
  .forEach((el) => {
    observer.observe(el);
  });

// Load products preview
async function loadProductsPreview() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const products = data.data.slice(0, 3); // Show only 3 products
    const container = document.getElementById("productsPreview");

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-muted">Belum ada produk tersedia</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products
      .map(
        (product, index) => `
      <div class="col-md-6 col-lg-4 stagger-item animate-fade-up">
        <div class="card border-0 h-100 hover-lift transition-all" style="border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(139, 69, 19, 0.15);">
          <!-- Product Image -->
          <div class="position-relative overflow-hidden" style="height: 250px; background: linear-gradient(135deg, #f5f5dc, #fff8dc);">
            <img 
              src="${product.image_url || "https://via.placeholder.com/300x250?text=Kopi"}" 
              alt="${product.name}"
              style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;"
              class="product-image"
            />
            <div class="position-absolute top-0 start-0 end-0 bottom-0" style="background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%);"></div>
            
            <!-- Badge -->
            <span class="badge bg-danger position-absolute top-3 end-3" style="font-weight: 600;">
              ${product.stock > 0 ? "✓ Stok" : "❌ Habis"}
            </span>
          </div>

          <!-- Product Info -->
          <div class="card-body p-4">
            <h5 class="card-title mb-2" style="color: var(--primary-color); font-weight: 700;">
              ${product.name}
            </h5>
            <p class="card-text small text-muted mb-3" style="min-height: 40px;">
              ${product.description?.substring(0, 60) || "Kopi premium pilihan"}...
            </p>

            <!-- Rating (simulation) -->
            <div class="mb-3">
              <span class="text-warning small">★★★★★</span>
              <span class="text-muted small ms-2">(${Math.floor(Math.random() * 50) + 10} review)</span>
            </div>

            <!-- Price -->
            <div class="mb-3">
              <p class="mb-0 fs-5 fw-bold" style="color: var(--secondary-color);">
                Rp ${parseFloat(product.price).toLocaleString("id-ID")}
              </p>
              <p class="small text-muted mb-0">
                Per ${product.unit || "1kg"}
              </p>
            </div>

            <!-- Action Button -->
            <a 
              href="products.html" 
              class="btn btn-sm w-100 transition-all" 
              style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); color: white; border: none; font-weight: 600; border-radius: 10px;"
            >
              Lihat Detail & Beli
            </a>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    // Add hover effect to product images
    document.querySelectorAll(".product-image").forEach((img) => {
      img.addEventListener("mouseenter", () => {
        img.style.transform = "scale(1.1)";
      });
      img.addEventListener("mouseleave", () => {
        img.style.transform = "scale(1)";
      });
    });
  } catch (error) {
    console.error("Error loading products:", error);
    const container = document.getElementById("productsPreview");
    container.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Gagal memuat produk. Silakan refresh halaman.</p>
      </div>
    `;
  }
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const cartCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0,
  );
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) {
    cartCountEl.textContent = cartCount;
  }
}

// Newsletter subscription
const newsletterForm = document.querySelector('form[style*="flex-wrap"]');
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value;

    // Show success message
    const btn = newsletterForm.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "✓ Berhasil Berlangganan!";
    btn.style.background = "var(--success-color)";

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
      newsletterForm.reset();
    }, 3000);
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadProductsPreview();
  updateCartCount();

  // Listen for cart changes
  window.addEventListener("storage", () => {
    updateCartCount();
  });

  // Add smooth scroll behavior for buttons
  document
    .querySelectorAll(
      'a[href*="products.html"], a[href*="cart.html"], a[href*="register.html"]',
    )
    .forEach((link) => {
      link.addEventListener("click", function (e) {
        // Let the navigation happen normally
      });
    });

  // Add performance optimization: lazy load images
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          observer.unobserve(img);
        }
      });
    });

    document
      .querySelectorAll("img[data-src]")
      .forEach((img) => imageObserver.observe(img));
  }
});

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
