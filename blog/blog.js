
// Dark mode based on preference
document.addEventListener("DOMContentLoaded", function () {
  const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (prefersDarkMode) {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  } else {
    document.body.classList.add("light");
  }
  darkModeToggle.addEventListener("change", function () {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
  });

  // Set current year in footer
  document.getElementById("year").textContent = new Date().getFullYear();

  // Table of Contents scrollspy
  const sections = document.querySelectorAll(".blog-content h2, .blog-content h3");
  const tocLinks = document.querySelectorAll(".toc-list a");

  function updateTOC() {
    let found = false;
    
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const rect = section.getBoundingClientRect();
      
      if (rect.top <= 100 && !found) {
        found = true;
        
        const id = section.getAttribute("id");
        tocLinks.forEach(link => {
          link.classList.remove("active");
          link.parentElement.classList.remove("active");
          
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
            link.parentElement.classList.add("active");
          }
        });
      }
    }
  }

  // Smooth scroll for TOC links
  tocLinks.forEach(link => {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: "smooth"
      });
    });
  });

  window.addEventListener("scroll", updateTOC);
  updateTOC(); // Initial call
});
