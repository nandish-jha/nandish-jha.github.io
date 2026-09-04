import { loadPosts, formatDate, renderMarkdown } from "./markdown.js";

const article = document.getElementById("article");
const params = new URLSearchParams(location.search);
const id = params.get("id");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

try {
  const posts = await loadPosts();
  const post = posts.find((p) => p.id === id && p.published !== false);
  if (!post) {
    article.innerHTML = `<p class="empty">Post not found. <a href="./">Back to blog</a></p>`;
  } else {
    document.title = `${post.title} — Nandish Jha`;
    article.innerHTML = `
      <header class="article-head">
        <div class="post-meta">
          <span>${formatDate(post.date)}</span>
          <span>${escapeHtml(post.category || "note")}</span>
          ${(post.tags || []).map((t) => `<span>#${escapeHtml(t)}</span>`).join("")}
        </div>
        <h1>${escapeHtml(post.title)}</h1>
      </header>
      <div class="prose">${renderMarkdown(post.body || "")}</div>
    `;
  }
} catch (err) {
  article.innerHTML = `<p class="empty">Could not load post. ${escapeHtml(err.message)}</p>`;
}
