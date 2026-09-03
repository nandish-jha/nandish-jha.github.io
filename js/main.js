/* ============================================================
   NANDISH JHA — PORTFOLIO  ·  js/main.js
   Material You Dark · Terracotta
   ============================================================ */

const CONFIG = {
  email: "nandish.d.jha@gmail.com",
  githubUser: "nandish-jha",
  featured: [
    "nest_hub_on_LCD",
    "electronic_card_lock",
    "ucosii_binary_game_hal",
    "discord_light_chat_web_app",
    "space-booker",
    "boop-app",
    "xswitch-verification",
    "full_microprocessor",
    "LogLens",
  ],
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Basics ── */
document.getElementById("year").textContent = new Date().getFullYear();
const emailLink = document.getElementById("emailLink");
emailLink.href = "mailto:" + CONFIG.email;
document.getElementById("emailValue").textContent = CONFIG.email;

/* ── Top bar scroll effect ── */
const topBar = document.getElementById("topBar");
let lastScroll = 0;
window.addEventListener("scroll", () => {
  topBar.classList.toggle("scrolled", window.scrollY > 32);
  lastScroll = window.scrollY;
}, { passive: true });

/* ── Mobile nav drawer ── */
const navToggle = document.getElementById("navToggle");
const navDrawer = document.getElementById("navDrawer");
const navScrim = document.getElementById("navScrim");
const drawerClose = document.getElementById("drawerClose");

function openDrawer() {
  navDrawer.classList.add("open");
  navScrim.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  navDrawer.classList.remove("open");
  navScrim.classList.remove("open");
  document.body.style.overflow = "";
}

navToggle.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
navScrim.addEventListener("click", closeDrawer);
navDrawer.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeDrawer();
});

/* ── Active section tracking ── */
const navChips = [...document.querySelectorAll(".nav-chip")];
const drawerLinks = [...document.querySelectorAll(".drawer-link")];
const sectionIds = navChips.map((a) => a.dataset.section);
const sectionEls = sectionIds.map((id) => document.getElementById(id));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const idx = sectionEls.indexOf(en.target);
      if (idx < 0) continue;
      navChips.forEach((c) => c.classList.remove("active"));
      drawerLinks.forEach((l) => l.classList.remove("active"));
      navChips[idx].classList.add("active");
      if (drawerLinks[idx]) drawerLinks[idx].classList.add("active");
    }
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sectionEls.forEach((s) => s && sectionObserver.observe(s));

/* ── Scroll reveal animations ── */
if (!reducedMotion) {
  const revealTargets = [
    ...document.querySelectorAll(".section-header"),
    ...document.querySelectorAll(".about-text"),
    ...document.querySelectorAll(".detail-card"),
    ...document.querySelectorAll(".resume-card"),
    ...document.querySelectorAll(".hero-content"),
  ];
  revealTargets.forEach((el) => el.classList.add("reveal"));

  const staggerTargets = [
    document.querySelector(".skills-grid"),
    document.querySelector(".proj-grid"),
    document.querySelector(".beyond-grid"),
    document.querySelector(".contact-grid"),
    document.querySelector(".hero-chips"),
  ];
  staggerTargets.forEach((el) => { if (el) el.classList.add("stagger"); });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          revealObserver.unobserve(en.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  [...revealTargets, ...staggerTargets.filter(Boolean)].forEach((el) =>
    revealObserver.observe(el)
  );
}

/* ── Live GitHub repos ── */
(async function loadRepos() {
  const grid = document.getElementById("repoGrid");
  const status = document.getElementById("repoStatus");
  try {
    const res = await fetch(
      `https://api.github.com/users/${CONFIG.githubUser}/repos?per_page=100&sort=pushed`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const repos = await res.json();

    const shown = repos.filter(
      (r) => !r.fork && !CONFIG.featured.includes(r.name)
    );
    if (!shown.length) throw new Error("empty");

    status.remove();
    for (const r of shown) {
      const a = document.createElement("a");
      a.className = "repo";
      a.href = r.html_url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `
        <span class="r-name">${r.name}</span>
        <span class="r-desc">${r.description ? escapeHtml(r.description) : "—"}</span>
        <span class="r-meta">${r.language || "mixed"}</span>`;
      grid.appendChild(a);
    }
  } catch (e) {
    status.innerHTML =
      `GitHub API unavailable — <a href="https://github.com/${CONFIG.githubUser}?tab=repositories" target="_blank" rel="noopener">browse directly</a>`;
  }
})();

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
