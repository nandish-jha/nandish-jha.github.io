(function initThemeToggle() {
  const KEY = "nj-theme";
  const root = document.documentElement;

  function current() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function sync(btn) {
    const light = current() === "light";
    btn.setAttribute("aria-pressed", light ? "true" : "false");
    btn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    btn.textContent = light ? "Dark" : "Light";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch (err) {
      /* private mode */
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(sync);
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    sync(btn);
    btn.addEventListener("click", () => {
      apply(current() === "light" ? "dark" : "light");
    });
  });
})();
