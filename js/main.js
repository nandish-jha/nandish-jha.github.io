import * as THREE from "three";

const CONFIG = {
  email: "nandish.d.jha@gmail.com",
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();
const email = document.getElementById("emailLink");
email.href = "mailto:" + CONFIG.email;

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
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.06}s`;
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ── 3D tilt cards (mouse-follow) ── */
const tilts = [...document.querySelectorAll(".tilt")];
tilts.forEach((card) => {
  const depth = parseFloat(card.dataset.depth || "0.45");
  let raf = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0;

  const render = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    card.style.transform = `rotateX(${cy}deg) rotateY(${cx}deg) translateZ(0)`;
    raf = requestAnimationFrame(render);
  };

  card.addEventListener("pointerenter", () => {
    if (reduced) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  });

  card.addEventListener("pointermove", (e) => {
    if (reduced) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tx = px * 14 * depth;
    ty = -py * 12 * depth;
  });

  card.addEventListener("pointerleave", () => {
    tx = 0;
    ty = 0;
    setTimeout(() => cancelAnimationFrame(raf), 500);
  });
});

/* ── Ambient Three.js scene ── */
(function initScene() {
  const canvas = document.getElementById("scene3d");
  if (!canvas || reduced) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
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
  const materials = [
    new THREE.MeshPhysicalMaterial({
      color: orange,
      metalness: 0.35,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      emissive: orange,
      emissiveIntensity: 0.18,
    }),
    new THREE.MeshPhysicalMaterial({
      color: matte,
      metalness: 0.4,
      roughness: 0.55,
      clearcoat: 0.3,
    }),
    new THREE.MeshPhysicalMaterial({
      color: "#ff7a45",
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.45,
      emissive: orange,
      emissiveIntensity: 0.08,
    }),
  ];

  // Soft elongated forms in a dark stage — cinematic, not product clones
  const forms = [];
  const geos = [
    new THREE.CapsuleGeometry(0.28, 1.1, 8, 24),
    new THREE.CylinderGeometry(0.22, 0.32, 1.4, 32),
    new THREE.SphereGeometry(0.45, 32, 32),
    new THREE.TorusGeometry(0.55, 0.08, 16, 64),
    new THREE.CapsuleGeometry(0.2, 0.8, 6, 20),
  ];

  for (let i = 0; i < 11; i++) {
    const geo = geos[i % geos.length];
    const mat = materials[i % materials.length];
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / 11) * Math.PI * 2;
    const radius = 1.8 + (i % 4) * 0.45;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.sin(i * 1.7) * 1.1) + 0.15,
      Math.sin(angle) * radius - 0.8
    );
    mesh.rotation.set(i * 0.3, i * 0.5, i * 0.15);
    mesh.scale.setScalar(0.55 + (i % 3) * 0.2);
    group.add(mesh);
    forms.push({
      mesh,
      speed: 0.12 + (i % 5) * 0.04,
      orbit: radius,
      phase: angle,
      bob: 0.22 + (i % 4) * 0.08,
    });
  }

  // Soft theatrical lighting — orange key on matte black
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const key = new THREE.DirectionalLight(0xff5a1f, 1.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0xff7a45, 22, 16, 2);
  fill.position.set(-1.5, 1.2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(-4, -1, -3);
  scene.add(rim);

  // Mouse parallax for camera
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  let scrollY = 0;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  }, { passive: true });

  let t = 0;
  function frame() {
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
    requestAnimationFrame(frame);
  }
  frame();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
