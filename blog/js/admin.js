import { BLOG_CONFIG } from "./config.js";
import { loadPosts, sha256, slugify, renderMarkdown } from "./markdown.js";

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const adminStatus = document.getElementById("adminStatus");
const postPicker = document.getElementById("postPicker");
const editorForm = document.getElementById("editorForm");

const fields = {
  title: document.getElementById("title"),
  slug: document.getElementById("slug"),
  date: document.getElementById("date"),
  category: document.getElementById("category"),
  tags: document.getElementById("tags"),
  excerpt: document.getElementById("excerpt"),
  body: document.getElementById("body"),
  published: document.getElementById("published"),
  token: document.getElementById("token"),
};

let posts = [];
let activeId = null;
let titleTouchedSlug = false;

function setStatus(el, msg, kind = "") {
  el.textContent = msg || "";
  el.className = "status" + (kind ? ` ${kind}` : "");
}

function isAuthed() {
  return sessionStorage.getItem(BLOG_CONFIG.sessionKey) === "1";
}

function showAdmin(on) {
  loginView.hidden = on;
  adminView.hidden = !on;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function blankPost() {
  return {
    id: `draft-${Date.now()}`,
    title: "",
    date: today(),
    category: "story",
    tags: [],
    excerpt: "",
    published: true,
    body: "",
  };
}

function readForm() {
  const title = fields.title.value.trim();
  const id = fields.slug.value.trim() || slugify(title);
  return {
    id,
    title,
    date: fields.date.value || today(),
    category: fields.category.value,
    tags: fields.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
    excerpt: fields.excerpt.value.trim(),
    published: fields.published.checked,
    body: fields.body.value,
  };
}

function fillForm(post) {
  activeId = post.id;
  titleTouchedSlug = true;
  fields.title.value = post.title || "";
  fields.slug.value = post.id || "";
  fields.date.value = post.date || today();
  fields.category.value = post.category || "story";
  fields.tags.value = (post.tags || []).join(", ");
  fields.excerpt.value = post.excerpt || "";
  fields.body.value = post.body || "";
  fields.published.checked = post.published !== false;
  renderPicker();
}

function renderPicker() {
  postPicker.innerHTML = posts
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map((p) => `
      <button type="button" class="post-pick ${p.id === activeId ? "is-active" : ""}" data-id="${p.id}">
        ${escapeHtml(p.title || "(untitled)")}
        <small>${p.date || "—"} · ${p.published === false ? "draft" : p.category}</small>
      </button>
    `).join("") || `<p style="color:var(--ink-dim);font-size:14px">No posts yet.</p>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function persistDraft() {
  localStorage.setItem(BLOG_CONFIG.draftKey, JSON.stringify({ posts }));
}

function payload() {
  return JSON.stringify({ posts }, null, 2) + "\n";
}

async function unlock(password) {
  const hash = await sha256(password);
  if (hash !== BLOG_CONFIG.adminHash) {
    setStatus(loginStatus, "Wrong password.", "err");
    return false;
  }
  sessionStorage.setItem(BLOG_CONFIG.sessionKey, "1");
  return true;
}

async function bootEditor() {
  try {
    const draft = localStorage.getItem(BLOG_CONFIG.draftKey);
    if (draft) {
      const parsed = JSON.parse(draft);
      if (Array.isArray(parsed.posts)) posts = parsed.posts;
    }
    if (!posts.length) posts = await loadPosts();
  } catch {
    posts = await loadPosts().catch(() => []);
  }
  if (!posts.length) posts = [blankPost()];
  fillForm(posts[0]);
  showAdmin(true);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus(loginStatus, "Checking…");
  const ok = await unlock(document.getElementById("password").value);
  if (ok) {
    setStatus(loginStatus, "");
    await bootEditor();
  }
});

fields.title.addEventListener("input", () => {
  if (!titleTouchedSlug || !fields.slug.value) {
    fields.slug.value = slugify(fields.title.value);
  }
});
fields.slug.addEventListener("input", () => { titleTouchedSlug = true; });

postPicker.addEventListener("click", (e) => {
  const btn = e.target.closest(".post-pick");
  if (!btn) return;
  const post = posts.find((p) => p.id === btn.dataset.id);
  if (post) fillForm(post);
});

document.getElementById("newPostBtn").addEventListener("click", () => {
  const p = blankPost();
  posts.unshift(p);
  fillForm(p);
  setStatus(adminStatus, "New draft ready.", "ok");
});

editorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const next = readForm();
  if (!next.title) {
    setStatus(adminStatus, "Title is required.", "err");
    return;
  }
  const idx = posts.findIndex((p) => p.id === activeId);
  // If slug changed, replace by activeId; also guard duplicate ids
  const clash = posts.findIndex((p) => p.id === next.id && p.id !== activeId);
  if (clash !== -1) {
    setStatus(adminStatus, "That slug already exists. Pick another.", "err");
    return;
  }
  if (idx === -1) posts.unshift(next);
  else posts[idx] = next;
  activeId = next.id;
  persistDraft();
  renderPicker();
  setStatus(adminStatus, "Saved to working list (local). Push or download to publish.", "ok");
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (!activeId) return;
  if (!confirm("Delete this post from the working list?")) return;
  posts = posts.filter((p) => p.id !== activeId);
  if (!posts.length) posts = [blankPost()];
  persistDraft();
  fillForm(posts[0]);
  setStatus(adminStatus, "Deleted from working list.", "ok");
});

document.getElementById("previewBtn").addEventListener("click", () => {
  const next = readForm();
  const w = window.open("", "_blank");
  if (!w) {
    setStatus(adminStatus, "Pop-up blocked — allow pop-ups for preview.", "err");
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><title>Preview</title>
    <link rel="stylesheet" href="css/blog.css" />
    </head><body><div class="bg"></div><div class="shell">
    <p class="eyebrow">Preview</p>
    <h1 style="font-size:clamp(36px,7vw,56px);margin:12px 0 24px">${escapeHtml(next.title)}</h1>
    <div class="prose">${renderMarkdown(next.body)}</div>
    </div></body></html>`);
  w.document.close();
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([payload()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "posts.json";
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus(adminStatus, "Downloaded posts.json — replace blog/data/posts.json and push.", "ok");
});

document.getElementById("pushBtn").addEventListener("click", async () => {
  const token = fields.token.value.trim();
  if (!token) {
    setStatus(adminStatus, "Paste a GitHub PAT first (repo scope).", "err");
    return;
  }
  setStatus(adminStatus, "Pushing to GitHub…");
  const { owner, repo, branch, postsPath } = BLOG_CONFIG;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${postsPath}`;
  try {
    let sha;
    const getRes = await fetch(`${apiBase}?ref=${branch}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (getRes.ok) {
      const meta = await getRes.json();
      sha = meta.sha;
    } else if (getRes.status !== 404) {
      throw new Error(`Could not read file (${getRes.status})`);
    }

    const content = btoa(unescape(encodeURIComponent(payload())));
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "chore(blog): update posts",
        content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `Push failed (${putRes.status})`);
    }
    localStorage.removeItem(BLOG_CONFIG.draftKey);
    setStatus(adminStatus, "Pushed. GitHub Pages will refresh in a minute or two.", "ok");
  } catch (err) {
    setStatus(adminStatus, err.message || "Push failed.", "err");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(BLOG_CONFIG.sessionKey);
  fields.token.value = "";
  showAdmin(false);
  setStatus(loginStatus, "Locked.", "ok");
});

if (isAuthed()) bootEditor();
