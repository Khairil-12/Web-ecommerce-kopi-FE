document.addEventListener("DOMContentLoaded", function () {
  // ===== INITIALIZE AUTH SYSTEM =====
  const auth = window.authSystem;
  auth.updateAuthUI();

  // ===== MOBILE NAVIGATION =====
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");

      if (window.innerWidth <= 768) {
        if (navMenu.classList.contains("active")) {
          let mobileLoginItem = document.querySelector(".mobile-login");
          if (!mobileLoginItem) {
            mobileLoginItem = document.createElement("li");
            mobileLoginItem.className = "nav-item mobile-login";
            mobileLoginItem.innerHTML = `
              <div class="login-section-mobile">
                <span id="userInfoMobile" class="user-info" style="display: none"></span>
                <a href="login.html" id="loginBtnMobile" class="btn btn-login">Login</a>
                <button id="logoutBtnMobile" class="btn btn-logout" style="display: none">Logout</button>
              </div>
            `;
            navMenu.appendChild(mobileLoginItem);
            updateMobileLoginUI();
          } else {
            mobileLoginItem.style.display = "block";
            updateMobileLoginUI();
          }
        } else {
          const mobileLoginItem = document.querySelector(".mobile-login");
          if (mobileLoginItem) {
            mobileLoginItem.style.display = "none";
          }
        }
      }
    });
  }

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      if (hamburger && navMenu) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });
  });

  // ===== MOBILE LOGIN SYSTEM =====
  function updateMobileLoginUI() {
    const userInfoMobile = document.getElementById("userInfoMobile");
    const loginBtnMobile = document.getElementById("loginBtnMobile");
    const logoutBtnMobile = document.getElementById("logoutBtnMobile");

    if (userInfoMobile && loginBtnMobile && logoutBtnMobile) {
      const currentUser = auth.getCurrentUser();

      if (currentUser) {
        userInfoMobile.textContent = `Hello, ${currentUser.username}`;
        userInfoMobile.style.display = "inline";
        logoutBtnMobile.style.display = "inline";
        loginBtnMobile.style.display = "none";

        // Add logout event listener
        logoutBtnMobile.onclick = function () {
          auth.logout().then((result) => {
            if (result.success) {
              if (hamburger && navMenu) {
                hamburger.classList.remove("active");
                navMenu.classList.remove("active");
              }
              auth.updateAuthUI();
              updateMobileLoginUI();
            }
          });
        };
      } else {
        userInfoMobile.style.display = "none";
        logoutBtnMobile.style.display = "none";
        loginBtnMobile.style.display = "inline";
      }
    }
  }

  // ===== LOGOUT FUNCTIONALITY =====
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      const result = await auth.logout();
      if (result.success) {
        alert("Anda telah logout!");
        auth.updateAuthUI();
        updateMobileLoginUI();
      }
    });
  }

  // ===== SMOOTH SCROLLING =====
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");

      if (
        this.classList.contains("btn-login") ||
        this.classList.contains("btn-logout")
      ) {
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("active");
        });
        this.classList.add("active");

        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // ===== ACTIVE NAVIGATION ON SCROLL =====
  function updateActiveNavigation() {
    const sections = document.querySelectorAll(".section");
    const navLinks = document.querySelectorAll(".nav-link");

    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollY >= sectionTop - 100) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }

  // ===== CONTACT FORM HANDLING =====
  const contactForm = document.getElementById("contactForm");
  const formResult = document.getElementById("formResult");
  const backToForm = document.getElementById("backToForm");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      document.querySelectorAll(".error-message").forEach((error) => {
        error.style.display = "none";
        error.textContent = "";
      });

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const company = document.getElementById("company").value.trim();
      const message = document.getElementById("message").value.trim();

      let isValid = true;

      // Name validation
      if (name === "") {
        showError("nameError", "Name is required");
        isValid = false;
      } else if (name.length < 2) {
        showError("nameError", "Name must be at least 2 characters long");
        isValid = false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email === "") {
        showError("emailError", "Email is required");
        isValid = false;
      } else if (!emailRegex.test(email)) {
        showError("emailError", "Please enter a valid email address");
        isValid = false;
      }

      // Phone validation (Indonesian phone format)
      const phoneRegex = /^(?:\+62|62|0)[2-9][0-9]{7,11}$/;
      const cleanedPhone = phone.replace(/\D/g, "");
      if (phone === "") {
        showError("phoneError", "Phone number is required");
        isValid = false;
      } else if (!phoneRegex.test(cleanedPhone)) {
        showError("phoneError", "Please enter a valid Indonesian phone number");
        isValid = false;
      }

      // Message validation
      if (message === "") {
        showError("messageError", "Message is required");
        isValid = false;
      } else if (message.length < 10) {
        showError(
          "messageError",
          "Message must be at least 10 characters long"
        );
        isValid = false;
      }

      if (isValid) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
          localStorage.setItem("userName", name);
        }

        document.getElementById("resultName").textContent = name;
        document.getElementById("resultEmail").textContent = email;
        document.getElementById("resultPhone").textContent = phone;
        document.getElementById("resultCompany").textContent =
          company || "Not provided";
        document.getElementById("resultMessage").textContent = message;
        document.getElementById("resultTime").textContent =
          new Date().toLocaleString();

        contactForm.style.display = "none";
        if (formResult) {
          formResult.style.display = "block";
        }

        if (!currentUser) {
          auth.updateAuthUI();
        }

        if (formResult) {
          formResult.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        setTimeout(() => {
          alert(
            `Thank you ${name}! Your message has been submitted successfully.`
          );
        }, 500);
      }
    });
  }

  // Helper function to show error messages
  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  // Back to form functionality
  if (backToForm && formResult) {
    backToForm.addEventListener("click", function () {
      formResult.style.display = "none";
      if (contactForm) {
        contactForm.style.display = "block";
        contactForm.reset();
        contactForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ===== REAL-TIME FORM VALIDATION =====
  function setupRealTimeValidation() {
    // Name validation
    const nameInput = document.getElementById("name");
    if (nameInput) {
      nameInput.addEventListener("input", function () {
        if (this.value.trim().length >= 2) {
          hideError("nameError");
        }
      });
    }

    // Email validation
    const emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.addEventListener("input", function () {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(this.value.trim())) {
          hideError("emailError");
        }
      });
    }

    // Phone validation
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        const phoneRegex = /^(?:\+62|62|0)[2-9][0-9]{7,11}$/;
        const cleanedPhone = this.value.replace(/\D/g, "");
        if (phoneRegex.test(cleanedPhone)) {
          hideError("phoneError");
        }
      });
    }

    // Message validation
    const messageInput = document.getElementById("message");
    if (messageInput) {
      messageInput.addEventListener("input", function () {
        if (this.value.trim().length >= 10) {
          hideError("messageError");
        }
      });
    }
  }

  function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.style.display = "none";
    }
  }

  // ===== ANIMATIONS =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document
    .querySelectorAll(".product-card, .stat-item, .step, .certificate")
    .forEach((el) => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        observer.observe(el);
      }
    });

  function createCoffeeBean() {
    const bean = document.createElement("div");
    bean.innerHTML = "☕";
    bean.style.position = "fixed";
    bean.style.top = "-50px";
    bean.style.left = Math.random() * window.innerWidth + "px";
    bean.style.fontSize = Math.random() * 20 + 10 + "px";
    bean.style.opacity = "0.7";
    bean.style.zIndex = "-1";
    bean.style.pointerEvents = "none";
    bean.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;

    document.body.appendChild(bean);

    setTimeout(() => {
      bean.remove();
    }, 5000);
  }

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  if (window.innerWidth > 768) {
    setInterval(createCoffeeBean, 1000);
  }

  setupRealTimeValidation();
  updateMobileLoginUI();

  window.addEventListener("scroll", updateActiveNavigation);

  window.addEventListener("resize", updateMobileLoginUI);
});
