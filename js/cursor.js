(function initCursor() {
  const el = document.getElementById("siteCursor");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!el || reduced || !finePointer) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let cx = x;
  let cy = y;
  let raf = 0;
  let visible = false;

  const render = () => {
    cx += (x - cx) * 0.28;
    cy += (y - cy) * 0.28;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  const interactive = "a, button, .btn, .theme-toggle, .resume-float, .life-track, .work-nav, .filter-btn, .post-card, .post-pick, input, textarea, select, label[for], summary, [role='button']";

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    x = e.clientX;
    y = e.clientY;
    if (!visible) {
      visible = true;
      el.classList.remove("is-hidden");
      cx = x;
      cy = y;
    }
    const over = e.target && e.target.closest ? e.target.closest(interactive) : null;
    el.classList.toggle("is-hover", Boolean(over));
    kick();
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    visible = false;
    el.classList.add("is-hidden");
  });

  const syncScrollLabel = () => {
    el.classList.toggle("is-scrolled", window.scrollY > 48);
  };
  window.addEventListener("scroll", syncScrollLabel, { passive: true });
  syncScrollLabel();
  el.classList.add("is-hidden");
})();
