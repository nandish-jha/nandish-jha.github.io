/* ============================================================
   NANDISH JHA — PORTFOLIO  ·  js/main.js
   ============================================================ */

/* ─── EDIT ME ───────────────────────────────────────────────
   One place for everything personal. Change values here only. */
const CONFIG = {
  email: "nandish.d.jha@gmail.com",          // <-- set your real email
  githubUser: "nandish-jha",
  // Repos already shown as featured cards — excluded from the live grid
  featured: [
    "nest_hub_on_LCD",
    "electronic_card_lock",
    "ucosii_binary_game_hal",
    "discord_light_chat_web_app",
    "space-booker",
  ],
};
/* ──────────────────────────────────────────────────────────── */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── footer year + email wiring ── */
document.getElementById("year").textContent = new Date().getFullYear();
const emailLink = document.getElementById("emailLink");
emailLink.href = "mailto:" + CONFIG.email;
emailLink.textContent = CONFIG.email;

/* ── boot log typewriter ──
   Mimics a QuestaSim/vsim session loading the page as a testbench. */
const BOOT_LINES = [
  { t: "$ vsim -voptargs=+acc work.portfolio_tb -do wave.do", c: "cmd" },
  { t: "# Loading work.portfolio_tb", c: "" },
  { t: "# UVM_INFO @ 0: reporter [RNTST] Running test portfolio_test...", c: "" },
  { t: "# UVM_INFO @ 0: candidate [INIT] Nandish Jha :: DV / ASIC / Embedded — ready.", c: "ok" },
];

const bootEl = document.getElementById("bootLog");

function renderBootInstant() {
  bootEl.innerHTML = BOOT_LINES
    .map((l) => `<span class="${l.c}">${l.t}</span>`)
    .join("\n");
}

async function typeBoot() {
  if (reducedMotion) { renderBootInstant(); return; }
  for (const line of BOOT_LINES) {
    const span = document.createElement("span");
    span.className = line.c;
    bootEl.appendChild(span);
    for (const ch of line.t) {
      span.textContent += ch;
      // commands type slower than log output — feels like a real session
      await sleep(line.c === "cmd" ? 18 : 5);
    }
    bootEl.appendChild(document.createTextNode("\n"));
  }
  const cur = document.createElement("span");
  cur.className = "cursor";
  bootEl.appendChild(cur);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
typeBoot();

/* ── hero waveform ──
   Draws three traces into the SVG: clk (square), rst_n (deassert),
   career_bus (bus transitions with hex labels). Animated via
   stroke-dashoffset so the trace "sweeps" in like a live capture. */
(function drawWave() {
  const svg = document.getElementById("waveSvg");
  const W = 760, H = 190;
  const NS = "http://www.w3.org/2000/svg";
  const rows = [38, 95, 152];      // y-centers for the 3 traces
  const A = 16;                    // amplitude (half-height of a toggle)
  const X0 = 170;                  // trace start — clears the signal-name column

  // timebase grid lines
  for (let x = X0; x < W; x += 48) {
    const g = document.createElementNS(NS, "line");
    g.setAttribute("x1", x); g.setAttribute("x2", x);
    g.setAttribute("y1", 8); g.setAttribute("y2", H - 8);
    g.setAttribute("stroke", "#141C26");
    svg.appendChild(g);
  }

  // clk: clean square wave
  let d = `M ${X0} ${rows[0] + A}`;
  for (let x = X0; x < W - 10; x += 40) {
    d += ` H ${x + 20} V ${rows[0] - A} H ${x + 40} V ${rows[0] + A}`;
  }
  addPath(d, "#FFB454", 0);

  // rst_n: low, then deasserts (goes high) early and stays high
  d = `M ${X0} ${rows[1] + A} H ${X0 + 110} V ${rows[1] - A} H ${W - 10}`;
  addPath(d, "#5BE49B", 300);

  // career_bus: bus-style "eye" transitions
  d = `M ${X0} ${rows[2]}`;
  const seg = 142;
  for (let x = X0; x < W - 30; x += seg) {
    d += ` M ${x} ${rows[2] - A} H ${x + seg - 14} L ${x + seg} ${rows[2]} ` +
         ` M ${x} ${rows[2] + A} H ${x + seg - 14} L ${x + seg} ${rows[2]} `;
  }
  addPath(d, "#62D2E8", 600);

  // bus value labels
  const labels = ["CE_2024", "CS_2027", "DV_ROLE", "0xC0FFEE"];
  labels.forEach((txt, i) => {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", X0 + 16 + i * seg);
    t.setAttribute("y", rows[2] + 4);
    t.setAttribute("fill", "#5F7080");
    t.setAttribute("font-size", "11");
    t.setAttribute("font-family", "JetBrains Mono, monospace");
    t.textContent = txt;
    svg.appendChild(t);
  });

  function addPath(dStr, color, delay) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", dStr);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", "2");
    svg.appendChild(p);
    if (reducedMotion) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    p.style.transition = `stroke-dashoffset 1.6s ease ${delay}ms`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { p.style.strokeDashoffset = "0"; })
    );
  }
})();

/* ── live GitHub repo grid ──
   Fetched in the visitor's browser, so the list never goes stale.
   Featured repos and forks are filtered out. Fails quietly with a
   link fallback if the API rate-limits. */
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
      `// GitHub API unavailable right now — browse directly: ` +
      `<a href="https://github.com/${CONFIG.githubUser}?tab=repositories" target="_blank" rel="noopener">github.com/${CONFIG.githubUser}</a>`;
  }
})();

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* ── nav: active section highlight + mobile toggle ── */
const pane = document.getElementById("signalPane");
const toggle = document.getElementById("paneToggle");
toggle.addEventListener("click", () => pane.classList.toggle("open"));
pane.addEventListener("click", (e) => {
  if (e.target.closest("a")) pane.classList.remove("open");
});

const sigLinks = [...document.querySelectorAll(".sig")];
const sections = sigLinks.map((a) => document.querySelector(a.getAttribute("href")));
const io = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      sigLinks.forEach((a) => a.classList.remove("active"));
      const idx = sections.indexOf(en.target);
      if (idx >= 0) sigLinks[idx].classList.add("active");
    }
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => s && io.observe(s));
