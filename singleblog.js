document.addEventListener("DOMContentLoaded", function () {
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (prefersDarkMode) {
    document.body.classList.add("dark");
    darkModeToggle.checked = true;
  }
  darkModeToggle.addEventListener("change", function () {
    document.body.classList.toggle("dark");
  });
  document.getElementById("year").textContent = new Date().getFullYear();
});
