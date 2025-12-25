// auth.js - Authentication System for Kopi Prima
class AuthSystem {
  constructor() {
    // Use absolute API base so pages opened via file:// can reach backend
    this.baseUrl = "http://localhost:5000/api";
    this.init();
  }

  init() {
    console.log("AuthSystem initialized");
  }

  // Check current authentication status
  async checkAuth() {
    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const currentUser = localStorage.getItem("currentUser");

      console.log("checkAuth called:", { isLoggedIn, currentUser });

      // Validate if data exists and is valid
      if (isLoggedIn === "true" && currentUser) {
        try {
          const user = JSON.parse(currentUser);
          if (user && user.username && user.username.trim() !== "") {
            console.log("✅ User authenticated:", user.username);
            return {
              success: true,
              user: user,
            };
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      console.log("❌ No valid authentication found");
      return { success: false };
    } catch (error) {
      console.error("Auth check error:", error);
      return { success: false };
    }
  }

  // Login user
  async login(username, password) {
    try {
      console.log("Attempting login for:", username);

      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success && data.user) {
        // Store authentication data
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("userName", data.user.username);
        localStorage.setItem("userEmail", data.user.email || "");

        // Set login timestamp
        localStorage.setItem("loginTimestamp", Date.now().toString());

        console.log("✅ Login successful, user data stored");

        // Trigger UI update
        this.updateAuthUI();

        // Return success with user data
        return {
          ...data,
          redirectUrl: "/index.html", // Redirect ke index setelah login
        };
      } else {
        console.error("Login failed:", data.message);
        return data;
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan jaringan. Coba lagi nanti.",
      };
    }
  }

  // Register user
  async register(userData) {
    try {
      console.log("Registering user:", userData.username);

      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log("Register response:", data);

      return data;
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan jaringan. Coba lagi nanti.",
      };
    }
  }

  // Logout user - TANPA REDIRECT KE LOGIN
  async logout() {
    try {
      console.log("Logging out user...");

      // Get username before clearing for logging
      const currentUser = this.getCurrentUser();
      const username = currentUser ? currentUser.username : "Unknown";

      // Clear ALL authentication data from localStorage
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("loginTimestamp");

      // Clear sessionStorage as well
      sessionStorage.clear();

      // Clear any auth-related cookies
      this.clearAuthCookies();

      console.log(`✅ User "${username}" logged out successfully`);
      console.log("✅ All auth data cleared from storage");

      // Force UI update
      this.updateAuthUI();

      return {
        success: true,
        message: "Logout berhasil! Anda sekarang dalam mode Guest.",
        username: username,
        // TIDAK ADA redirectUrl di sini, tetap di halaman yang sama
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat logout.",
      };
    }
  }

  // Clear authentication cookies
  clearAuthCookies() {
    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

        // Clear auth-related cookies
        if (
          name.includes("auth") ||
          name.includes("session") ||
          name.includes("token")
        ) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      }
    } catch (error) {
      console.error("Error clearing cookies:", error);
    }
  }

  // Update UI based on authentication status
  async updateAuthUI() {
    try {
      const auth = await this.checkAuth();
      console.log("updateAuthUI - auth status:", auth);

      const userInfo = document.getElementById("userInfo");
      const loginBtn = document.getElementById("loginBtn");
      const logoutBtn = document.getElementById("logoutBtn");
      const userName = document.getElementById("userName");
      const userGreeting = document.getElementById("userGreeting");

      if (auth.success && auth.user) {
        // User is logged in
        console.log("Setting UI to logged in state for:", auth.user.username);

        if (userInfo) {
          userInfo.textContent = `Hello, ${auth.user.username}`;
          userInfo.classList.remove("d-none");
          userInfo.style.display = "inline";
        }

        if (loginBtn) {
          loginBtn.classList.add("d-none");
          loginBtn.style.display = "none";
        }

        if (logoutBtn) {
          logoutBtn.classList.remove("d-none");
          logoutBtn.style.display = "inline-block";
        }

        if (userName) {
          userName.textContent = auth.user.username;
        }

        if (userGreeting) {
          userGreeting.textContent = `Selamat datang, ${auth.user.username}!`;
        }
      } else {
        // User is not logged in (Guest)
        console.log("Setting UI to guest state");

        if (userInfo) {
          userInfo.textContent = "";
          userInfo.classList.add("d-none");
          userInfo.style.display = "none";
        }

        if (loginBtn) {
          loginBtn.classList.remove("d-none");
          loginBtn.style.display = "inline-block";
        }

        if (logoutBtn) {
          logoutBtn.classList.add("d-none");
          logoutBtn.style.display = "none";
        }

        if (userName) {
          userName.textContent = "Guest";
        }

        if (userGreeting) {
          userGreeting.textContent = "Selamat datang, Guest!";
        }

        // Ensure localStorage is clean
        this.ensureCleanStorage();
      }

      console.log("UI update complete");
    } catch (error) {
      console.error("Error updating auth UI:", error);
    }
  }

  // Ensure localStorage is clean when user is not authenticated
  ensureCleanStorage() {
    try {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (isLoggedIn !== "true") {
        // Clear any residual auth data
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("loginTimestamp");
      }
    } catch (error) {
      console.error("Error ensuring clean storage:", error);
    }
  }

  // Protect routes - redirect to login if not authenticated
  protectRoute() {
    this.checkAuth().then((auth) => {
      if (!auth.success) {
        console.log("Route protected - redirecting to login");
        window.location.href = "/login.html";
      }
    });
  }

  // Get current user data
  getCurrentUser() {
    try {
      const userData = localStorage.getItem("currentUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    return isLoggedIn === "true";
  }

  // Get user's name
  getUserName() {
    const user = this.getCurrentUser();
    return user ? user.username : "Guest";
  }

  // Validate session (check if login is still valid)
  validateSession() {
    try {
      const loginTimestamp = localStorage.getItem("loginTimestamp");
      if (!loginTimestamp) return false;

      const loginTime = parseInt(loginTimestamp);
      const currentTime = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Check if session is expired
      if (currentTime - loginTime > sessionDuration) {
        console.log("Session expired, auto logging out...");
        this.logout(); // Auto logout tanpa redirect
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating session:", error);
      return false;
    }
  }

  // Get auth status for debugging
  getAuthStatus() {
    return {
      isLoggedIn: localStorage.getItem("isLoggedIn"),
      currentUser: this.getCurrentUser(),
      userName: localStorage.getItem("userName"),
      loginTimestamp: localStorage.getItem("loginTimestamp"),
    };
  }
}

// Create global auth instance
const auth = new AuthSystem();

// Initialize auth system when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded - initializing auth...");

  // Validate session on page load
  auth.validateSession();

  // Update UI
  auth.updateAuthUI();
});

// Make auth system globally accessible
window.authSystem = auth;

// Global helper functions
window.checkLogin = function () {
  return auth.checkAuth();
};

// Logout tanpa redirect
window.logoutUser = async function () {
  const result = await auth.logout();
  if (result.success) {
    console.log("Logout successful, staying on current page");
    // Tidak ada redirect, hanya update UI
  }
  return result;
};

window.getCurrentUser = function () {
  return auth.getCurrentUser();
};

window.getAuthStatus = function () {
  return auth.getAuthStatus();
};

// Export for module systems (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthSystem;
}
