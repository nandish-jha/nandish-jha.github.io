# nandish-jha.github.io — Portfolio

Static portfolio site. Zero build step, zero dependencies. Pure HTML/CSS/JS.

Theme: waveform-viewer / bench terminal. Nav is a signal pane, skills are a
register map, projects report PASS, and the repo grid loads live from the
GitHub API so it never goes stale.

## Structure

```
index.html        page content (edit text here)
css/style.css     all styling — design tokens at the top under :root
js/main.js        CONFIG object, boot animation, waveform, live repo fetch
assets/           drop Nandish_Jha_Resume.pdf here
.nojekyll         tells GitHub Pages to serve files as-is
```

## Before deploying — 2 required edits

1. **Email** — open `js/main.js`, set `CONFIG.email` to your real address.
2. **Resume** — compile `main-5.tex` to PDF and save it as
   `assets/Nandish_Jha_Resume.pdf` (or change the link in `index.html`,
   section `0x10 RESUME`).

## Deploy to GitHub Pages

### Option A — user site (recommended, cleanest URL)

```bash
# 1. Create a repo named exactly:  nandish-jha.github.io
# 2. From inside this folder:
git init
git add .
git commit -m "portfolio v1"
git branch -M main
git remote add origin git@github.com:nandish-jha/nandish-jha.github.io.git
git push -u origin main
```

Site goes live at **https://nandish-jha.github.io** within ~2 minutes.
No settings changes needed — Pages auto-enables for `*.github.io` repos.
If it doesn't: repo → Settings → Pages → Source: `main` / root.

### Option B — project site

Push to any repo (e.g. `portfolio`), then Settings → Pages →
Source: `main` / root. URL becomes `nandish-jha.github.io/portfolio`.

## Customizing

- **Colors / fonts**: `css/style.css`, `:root` block at the top.
- **Featured project cards**: `index.html`, section `0x0C PROJECTS`.
  Repos listed in `CONFIG.featured` (js/main.js) are excluded from the
  live grid so they don't appear twice.
- **Live repo grid**: fetches `api.github.com/users/nandish-jha/repos`
  in the visitor's browser. Forks are filtered out. If the API
  rate-limits, the grid falls back to a direct GitHub link.
- **Sections**: each `<section>` in index.html is self-contained —
  delete or reorder freely; update the signal-pane nav to match.

## Notes

- `prefers-reduced-motion` is respected: animations render instantly.
- Responsive down to ~360px; nav collapses to a toggle below 900px.
- No analytics, no trackers, no cookies.
