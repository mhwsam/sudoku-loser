
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    mobileMenuButton.addEventListener("click", function() {
      if (mobileMenu.style.display === "flex") {
        mobileMenu.style.display = "none";
      } else {
        mobileMenu.style.display = "flex";
        mobileMenu.style.flexDirection = "column";
      }
    });
    // Dynamic current year
    document.getElementById("currentYear").textContent = new Date().getFullYear();
