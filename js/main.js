import * as THREE from "three";

const CONFIG = {
  email: "nandish.d.jha@gmail.com",
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const isNarrow = window.matchMedia("(max-width: 960px)").matches;
const isMobilePerf = reduced || isCoarse || isNarrow;

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
    { threshold: isMobilePerf ? 0.08 : 0.18, rootMargin: "0px 0px -4% 0px" }
  );
  reveals.forEach((el, i) => {
    if (!isMobilePerf) el.style.transitionDelay = `${(i % 4) * 0.06}s`;
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ── 3D tilt cards (desktop pointer only) ── */
if (!isMobilePerf) {
  const tilts = [...document.querySelectorAll(".tilt")];
  tilts.forEach((card) => {
    const depth = parseFloat(card.dataset.depth || "0.45");
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let tracking = false;

    const render = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      card.style.transform = `rotateX(${cy}deg) rotateY(${cx}deg) translateZ(0)`;
      if (tracking || Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(render);
      } else {
        raf = 0;
      }
    };

    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      tracking = true;
      if (!raf) raf = requestAnimationFrame(render);
    });

    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 14 * depth;
      ty = -py * 12 * depth;
    });

    card.addEventListener("pointerleave", () => {
      tracking = false;
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(render);
    });
  });
}

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

  prev.addEventListener("click", () => {
    list.scrollBy({ left: -step(), behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    list.scrollBy({ left: step(), behavior: "smooth" });
  });
  list.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();

  // Convert vertical wheel to horizontal when hovering the rail (desktop)
  if (!isMobilePerf) {
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

  // Drag to scroll (desktop)
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

/* ── Ambient Three.js scene (desktop only) ── */
(function initScene() {
  const canvas = document.getElementById("scene3d");
  if (!canvas || isMobilePerf) {
    canvas?.remove();
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.2, 7.5);

  const group = new THREE.Group();
  scene.add(group);

  const orange = new THREE.Color("#ff5a1f");
  const matte = new THREE.Color("#1a1a1a");
  // StandardMaterial is far cheaper than PhysicalMaterial
  const materials = [
    new THREE.MeshStandardMaterial({
      color: orange,
      metalness: 0.35,
      roughness: 0.35,
      emissive: orange,
      emissiveIntensity: 0.18,
    }),
    new THREE.MeshStandardMaterial({
      color: matte,
      metalness: 0.4,
      roughness: 0.55,
    }),
    new THREE.MeshStandardMaterial({
      color: "#ff7a45",
      metalness: 0.2,
      roughness: 0.35,
      transparent: true,
      opacity: 0.45,
      emissive: orange,
      emissiveIntensity: 0.08,
    }),
  ];

  const forms = [];
  const geos = [
    new THREE.CapsuleGeometry(0.28, 1.1, 4, 12),
    new THREE.CylinderGeometry(0.22, 0.32, 1.4, 16),
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.TorusGeometry(0.55, 0.08, 8, 32),
    new THREE.CapsuleGeometry(0.2, 0.8, 4, 10),
  ];

  for (let i = 0; i < 8; i++) {
    const geo = geos[i % geos.length];
    const mat = materials[i % materials.length];
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / 8) * Math.PI * 2;
    const radius = 1.8 + (i % 4) * 0.45;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.sin(i * 1.7) * 1.1) + 0.15,
      Math.sin(angle) * radius - 0.8
    );
    mesh.rotation.set(i * 0.3, i * 0.5, i * 0.15);
    mesh.scale.setScalar(0.55 + (i % 3) * 0.2);
    mesh.frustumCulled = true;
    group.add(mesh);
    forms.push({
      mesh,
      speed: 0.12 + (i % 5) * 0.04,
      orbit: radius,
      phase: angle,
      bob: 0.22 + (i % 4) * 0.08,
    });
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xff5a1f, 1.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0xff7a45, 18, 14, 2);
  fill.position.set(-1.5, 1.2, 3);
  scene.add(fill);

  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollY = 0;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  }, { passive: true });

  let t = 0;
  let rafId = 0;
  let running = false;
  const intro = document.getElementById("intro");

  function frame() {
    if (!running) return;
    t += 0.008;
    forms.forEach((f, i) => {
      f.phase += 0.0015 * f.speed;
      f.mesh.position.x = Math.cos(f.phase) * f.orbit;
      f.mesh.position.z = Math.sin(f.phase) * f.orbit - 1.2;
      f.mesh.position.y =
        Math.sin(t * f.speed + i) * f.bob + Math.cos(t * 0.4 + i) * 0.15;
      f.mesh.rotation.x += 0.004 * f.speed;
      f.mesh.rotation.y += 0.006 * f.speed;
    });

    group.rotation.y = mouse.x * 0.25 + scrollY * 0.00025;
    group.rotation.x = mouse.y * -0.12 + scrollY * 0.0001;
    camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.25 + 0.2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -1);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  const start = () => {
    if (running || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  // Only animate while the intro is on screen
  if (intro) {
    const vis = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      },
      { threshold: 0.05 }
    );
    vis.observe(intro);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (intro) {
      const r = intro.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
    } else start();
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
})();
