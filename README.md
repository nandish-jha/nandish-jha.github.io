# nandish-jha.github.io — Portfolio

Static portfolio site. Zero build step. Pure HTML/CSS/JS + Three.js (CDN).

Theme: matte black + orange, signal-grid atmosphere, scroll reveals, and perspective card pan.

## Structure

```
index.html        page content
css/style.css     design tokens + layout
js/main.js        CONFIG, scroll, perspective pan
assets/           Nandish_Jha_Resume.pdf
blog/             public blog + admin desk
.nojekyll         GitHub Pages serves files as-is
```

## Edit

- **Email** — `js/main.js` → `CONFIG.email`
- **Colors / fonts** — `css/style.css` `:root`
- **Copy / projects** — `index.html`
- **Blog posts** — `blog/data/posts.json` or use `/blog/admin.html`

## Blog admin

Open https://nandish-jha.github.io/blog/admin.html

Default password: `nj-admin-2026` (change by updating the SHA-256 in `blog/js/config.js`).

Publish by downloading `posts.json` into `blog/data/`, or push from admin with a GitHub PAT (repo scope). The token is never stored.

## Deploy

Push to `main` on `nandish-jha/nandish-jha.github.io`.
Live at https://nandish-jha.github.io
