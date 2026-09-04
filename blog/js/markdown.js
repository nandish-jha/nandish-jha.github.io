/** Lightweight markdown → HTML (enough for blog posts). */
export function renderMarkdown(src = "") {
  const escaped = String(src)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
  let codeBuf = [];

  const closeLists = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  const inline = (t) =>
    t
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (inCode) {
        out.push(`<pre><code>${codeBuf.join("\n")}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        closeLists();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    if (!raw.trim()) {
      closeLists();
      continue;
    }

    if (/^### /.test(raw)) {
      closeLists();
      out.push(`<h3>${inline(raw.slice(4))}</h3>`);
      continue;
    }
    if (/^## /.test(raw)) {
      closeLists();
      out.push(`<h2>${inline(raw.slice(3))}</h2>`);
      continue;
    }
    if (/^# /.test(raw)) {
      closeLists();
      out.push(`<h1>${inline(raw.slice(2))}</h1>`);
      continue;
    }
    if (/^[-*] /.test(raw)) {
      if (!inUl) { closeLists(); out.push("<ul>"); inUl = true; }
      out.push(`<li>${inline(raw.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\. /.test(raw)) {
      if (!inOl) { closeLists(); out.push("<ol>"); inOl = true; }
      out.push(`<li>${inline(raw.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    closeLists();
    out.push(`<p>${inline(raw)}</p>`);
  }

  closeLists();
  if (inCode) out.push(`<pre><code>${codeBuf.join("\n")}</code></pre>`);
  return out.join("\n");
}

export function slugify(title = "") {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function formatDate(iso) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function loadPosts() {
  const res = await fetch("./data/posts.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load posts");
  const data = await res.json();
  const posts = Array.isArray(data.posts) ? data.posts : [];
  return posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
