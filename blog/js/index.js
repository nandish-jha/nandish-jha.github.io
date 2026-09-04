import { loadPosts, formatDate } from "./markdown.js";

const listEl = document.getElementById("postList");
const filters = document.getElementById("filters");
let posts = [];
let filter = "all";

function render() {
  const visible = posts.filter((p) => p.published !== false)
    .filter((p) => filter === "all" || p.category === filter);

  if (!visible.length) {
    listEl.innerHTML = `<p class="empty">No posts in this lane yet. Check back soon.</p>`;
    return;
  }

  listEl.innerHTML = visible.map((p) => `
    <a class="post-card" href="post.html?id=${encodeURIComponent(p.id)}">
      <div class="post-meta">
        <span>${formatDate(p.date)}</span>
        <span>${p.category || "note"}</span>
      </div>
      <h2>${escapeHtml(p.title)}</h2>
      <p class="excerpt">${escapeHtml(p.excerpt || "")}</p>
    </a>
  `).join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  filter = btn.dataset.filter;
  filters.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
  render();
});

try {
  posts = await loadPosts();
  render();
} catch (err) {
  listEl.innerHTML = `<p class="empty">Could not load posts. ${escapeHtml(err.message)}</p>`;
}
