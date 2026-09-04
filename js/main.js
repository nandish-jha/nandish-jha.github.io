const CONFIG = {
  email: "nandish.d.jha@gmail.com",
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.getElementById("year").textContent = new Date().getFullYear();
const email = document.getElementById("emailLink");
email.href = "mailto:" + CONFIG.email;

/* ── Floating dock scroll state ── */
const navDock = document.getElementById("navDock");
let dockTicking = false;
window.addEventListener("scroll", () => {
  if (dockTicking) return;
  dockTicking = true;
  requestAnimationFrame(() => {
    navDock?.classList.toggle("is-compact", window.scrollY > 40);
    dockTicking = false;
  });
}, { passive: true });

/* ── Section rail (right-side progress) ── */
(function initSectionRail() {
  const rail = document.getElementById("sectionRail");
  if (!rail) return;
  const links = [...rail.querySelectorAll("a[data-section]")];
  const sections = links
    .map((a) => document.getElementById(a.dataset.section))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((a) => {
      const on = a.dataset.section === id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  if (reduced || !("IntersectionObserver" in window)) {
    setActive(sections[0]?.id || "intro");
    return;
  }

  const visible = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
      });
      let best = null;
      let bestScore = -1;
      visible.forEach((ratio, id) => {
        if (ratio > bestScore) {
          bestScore = ratio;
          best = id;
        }
      });
      if (best) setActive(best);
    },
    {
      threshold: [0.15, 0.35, 0.55, 0.75],
      rootMargin: "-18% 0px -35% 0px",
    }
  );
  sections.forEach((s) => io.observe(s));
  setActive("intro");
})();

/* ── Off the clock mixtape ── */
(function initLifeReel() {
  const tracks = [...document.querySelectorAll(".life-track")];
  const panels = [...document.querySelectorAll(".life-feature")];
  if (!tracks.length) return;
  tracks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.life;
      tracks.forEach((t) => t.classList.toggle("is-active", t === btn));
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.lifePanel === id));
    });
  });
})();

/* ── Scroll reveals ── */
const reveals = [...document.querySelectorAll(".reveal")];
if (!reduced) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.05}s`;
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ── Perspective pan on cards (mouse + finger) ── */
(function initPerspectivePan() {
  if (reduced) return;

  const cards = [...document.querySelectorAll(".tilt")].map((el) => ({
    el,
    depth: parseFloat(el.dataset.depth || "0.5"),
    rx: 0,
    ry: 0,
    tx: 0,
    ty: 0,
    visible: false,
  }));
  if (!cards.length) return;

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
  let raf = 0;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const card = cards.find((c) => c.el === e.target);
        if (card) card.visible = e.isIntersecting;
      });
    },
    { rootMargin: "10% 0px", threshold: 0.05 }
  );
  cards.forEach((c) => io.observe(c.el));

  const apply = () => {
    raf = 0;
    let moving = false;

    cards.forEach((card) => {
      if (!card.visible) {
        card.tx = 0;
        card.ty = 0;
      } else if (pointer.active) {
        const r = card.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const nx = (pointer.x - cx) / Math.max(r.width, 1);
        const ny = (pointer.y - cy) / Math.max(r.height, 1);
        const clamp = (v, m) => Math.max(-m, Math.min(m, v));
        card.ty = clamp(-ny * 14 * card.depth, 10);
        card.tx = clamp(nx * 16 * card.depth, 12);
      } else {
        card.tx = 0;
        card.ty = 0;
      }

      card.rx += (card.tx - card.rx) * 0.14;
      card.ry += (card.ty - card.ry) * 0.14;

      if (Math.abs(card.rx) > 0.02 || Math.abs(card.ry) > 0.02 ||
          Math.abs(card.tx - card.rx) > 0.02 || Math.abs(card.ty - card.ry) > 0.02) {
        moving = true;
      }

      const z = Math.min(18, (Math.abs(card.rx) + Math.abs(card.ry)) * 0.6);
      card.el.style.transform =
        `rotateX(${card.ry.toFixed(2)}deg) rotateY(${card.rx.toFixed(2)}deg) translateZ(${z.toFixed(2)}px)`;
    });

    if (moving) raf = requestAnimationFrame(apply);
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const setPointer = (x, y, active) => {
    pointer.x = x;
    pointer.y = y;
    pointer.active = active;
    kick();
  };

  window.addEventListener("pointermove", (e) => {
    setPointer(e.clientX, e.clientY, true);
  }, { passive: true });

  window.addEventListener("pointerdown", (e) => {
    setPointer(e.clientX, e.clientY, true);
  }, { passive: true });

  window.addEventListener("pointerup", () => {
    // Keep last pose briefly on mouse; ease home on touch lift
    if (!finePointer) {
      pointer.active = false;
      kick();
    }
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
    kick();
  });

  // Touch: follow finger while scrolling/dragging without blocking scroll
  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t) return;
    setPointer(t.clientX, t.clientY, true);
  }, { passive: true });

  window.addEventListener("touchend", () => {
    pointer.active = false;
    kick();
  }, { passive: true });

  window.addEventListener("scroll", kick, { passive: true });
})();

/* ── Projects horizontal rail ── */
(function initWorkRail() {
  const list = document.getElementById("workList");
  const prev = document.getElementById("workPrev");
  const next = document.getElementById("workNext");
  if (!list || !prev || !next) return;

  const step = () => {
    const card = list.querySelector(".work-item");
    return card ? card.getBoundingClientRect().width + 20 : 400;
  };

  const updateButtons = () => {
    const max = list.scrollWidth - list.clientWidth - 4;
    prev.disabled = list.scrollLeft <= 4;
    next.disabled = list.scrollLeft >= max;
  };

  prev.addEventListener("click", () => list.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => list.scrollBy({ left: step(), behavior: "smooth" }));
  list.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();

  if (finePointer) {
    list.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        if (list.scrollWidth <= list.clientWidth) return;
        e.preventDefault();
        list.scrollLeft += e.deltaY;
      },
      { passive: false }
    );
  }

  let down = false;
  let startX = 0;
  let startLeft = 0;
  let moved = false;

  list.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = list.scrollLeft;
    list.setPointerCapture(e.pointerId);
  });
  list.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    list.scrollLeft = startLeft - dx;
  });
  const endDrag = () => { down = false; };
  list.addEventListener("pointerup", endDrag);
  list.addEventListener("pointercancel", endDrag);

  list.querySelectorAll(".work-item").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (moved) e.preventDefault();
    });
  });
})();
