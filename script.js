/* ItsPyDevs · page 3D
   Une caméra avance dans un couloir de panneaux HTML placés dans l'espace (CSS 3D).
   Une scène three.js, calée sur la même caméra, dessine derrière eux des polytopes 4D,
   un tunnel d'étoiles, des cadres et un sol en perspective.
   Sans JavaScript, sans WebGL ou avec « réduire les animations », la page s'affiche à plat. */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* ------------------------------------------------------------------ */
  /* Contenu dynamique (utile aussi en mode à plat)                      */
  /* ------------------------------------------------------------------ */
  function cached(key, url, ttl) {
    try {
      const c = JSON.parse(sessionStorage.getItem(key));
      if (c && Date.now() - c.t < ttl) return Promise.resolve(c.d);
    } catch (e) {}
    return fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {} return d; });
  }

  function loadRepos() {
    const ul = $("#repos");
    if (!ul) return;
    cached("gh3d-repos", "https://api.github.com/users/ItsPyDevs/repos?per_page=100&sort=pushed", 600000)
      .then((all) => {
        const list = all.filter((r) => !r.fork && r.name !== "ItsPyDevs" && r.html_url)
          .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 6);
        if (!list.length) return;
        ul.textContent = "";
        list.forEach((r) => {
          const li = document.createElement("li"), a = document.createElement("a"), b = document.createElement("b");
          a.href = r.html_url; b.textContent = r.name; a.appendChild(b);
          if (r.description) { const p = document.createElement("p"); p.textContent = r.description; a.appendChild(p); }
          const meta = [r.language, r.stargazers_count ? r.stargazers_count + " ★" : ""].filter(Boolean).join(" · ");
          if (meta) { const s = document.createElement("small"); s.textContent = meta; a.appendChild(s); }
          li.appendChild(a); ul.appendChild(li);
        });
      }).catch(() => {});
  }

  function loadStats() {
    const nodes = $$("#stats b[data-key]");
    if (!nodes.length) return;
    cached("gh3d-user", "https://api.github.com/users/ItsPyDevs", 600000)
      .then((u) => nodes.forEach((n) => { const v = u[n.dataset.key]; if (typeof v === "number") n.textContent = v; }))
      .catch(() => {});
  }

  function initCopy() {
    const b = $("#copy");
    if (!b) return;
    const url = "https://discord.com/users/1211004235857137688";
    const done = () => { b.textContent = "Lien copié"; setTimeout(() => (b.textContent = "Copier le lien Discord"), 2000); };
    b.addEventListener("click", () => {
      const fallback = () => {
        const t = document.createElement("textarea"); t.value = url; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        t.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
    });
  }

  loadRepos(); loadStats(); initCopy();

  /* ------------------------------------------------------------------ */
  /* Mode 3D                                                             */
  /* ------------------------------------------------------------------ */
  if (reduce || !(window.CSS && CSS.supports && CSS.supports("transform-style", "preserve-3d"))) return;

  const P = 1200;        // perspective CSS (px) : la caméra est P px derrière le plan z = 0
  const GAP = 1500;      // distance entre deux panneaux (px)
  const DWELL = 80;      // distance caméra-panneau à l'arrêt (px)
  const SEG = 1.4;       // hauteurs d'écran de défilement entre deux panneaux
  const U = 100;         // 1 unité three.js = 100 px CSS

  const scene = $("#scene"), spacer = $("#spacer"), hud = $("#hud"), dotsEl = $("#dots");
  const items = $$(".panel").map((el, i) => ({
    el, card: $(".card", el), id: el.id, title: el.dataset.title || el.id,
    side: +el.dataset.side || 0, x: 0, z: -i * GAP, ry: 0, q: -1, tilt: false,
  }));
  const N = items.length;
  let W = innerWidth, H = innerHeight, wide = W >= 900, range = 1;
  let target = 0, ps = 0;                 // progression de défilement brute / lissée (0..1)
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* --- navigation : pastilles ------------------------------------------ */
  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.go = i; b.setAttribute("aria-label", it.title); b.title = it.title;
    dotsEl.appendChild(b);
  });
  const navLinks = $$("#menu a");
  const dotBtns = $$("button", dotsEl);

  function goTo(i, instant) {
    i = clamp(i, 0, N - 1);
    const top = (range * i) / (N - 1);
    window.scrollTo({ top, behavior: instant || !("scrollBehavior" in root.style) ? "auto" : "smooth" });
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-go]");
    if (!t) return;
    e.preventDefault();
    goTo(+t.dataset.go);
  });
  document.addEventListener("focusin", (e) => {   // Tab vers un panneau : la caméra y va
    const p = e.target.closest && e.target.closest(".panel");
    if (!p) return;
    const i = items.findIndex((it) => it.el === p);
    if (i >= 0 && Math.abs(i - ps * (N - 1)) > 0.6) goTo(i);
  });
  addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    const f = Math.round(ps * (N - 1));
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(f + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(f - 1); }
  });
  addEventListener("scroll", () => { target = clamp(scrollY / range, 0, 1); }, { passive: true });
  addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / W - 0.5) * 2; mouse.y = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  /* --- mise en place ---------------------------------------------------- */
  function layout() {
    W = innerWidth; H = innerHeight; wide = W >= 900;
    items.forEach((it) => {
      it.x = wide ? it.side * 340 : 0;
      it.ry = wide ? -it.side * 14 : 0;
      it.el.style.transform = `translate3d(${it.x}px, 0, ${it.z}px) rotateY(${it.ry}deg)`;
    });
    spacer.style.height = (N - 1) * SEG * H + H + "px";
    range = Math.max(1, (N - 1) * SEG * H);
    target = clamp(scrollY / range, 0, 1);
  }

  /* --- trajectoire de la caméra : arrêt devant chaque panneau, vol entre eux --- */
  const ease = (t) => smooth((t - 0.2) / 0.6);
  function camAt(f) {
    f = clamp(f, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(f)), e = ease(f - i);
    const a = items[i], b = items[i + 1];
    return {
      x: (a.x + (b.x - a.x) * e) * 0.85,
      y: Math.sin(e * Math.PI) * -26,
      z: a.z + (b.z - a.z) * e + DWELL,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Scène WebGL                                                         */
  /* ------------------------------------------------------------------ */
  function initGL() {
    if (typeof THREE === "undefined") return null;
    const cv = $("#gl");
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
    function size() {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
      renderer.setSize(innerWidth, innerHeight, false);
      cam.aspect = innerWidth / innerHeight;
      cam.fov = (2 * Math.atan(innerHeight / 2 / P) * 180) / Math.PI;   // même champ que la perspective CSS
      cam.updateProjectionMatrix();
    }
    size();

    const dot = (function () {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "#fff"); g.addColorStop(0.35, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const ADD = THREE.AdditiveBlending;

    /* étoiles */
    const NS = innerWidth < 900 ? 900 : 1900, sp = new Float32Array(NS * 3);
    for (let i = 0; i < NS; i++) { sp[i * 3] = (Math.random() - 0.5) * 90; sp[i * 3 + 1] = (Math.random() - 0.5) * 60; sp[i * 3 + 2] = 15 - Math.random() * 145; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sc.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.13, map: dot, color: 0xbfc8ff, transparent: true, opacity: 0.8, blending: ADD, depthWrite: false })));

    /* cadres du couloir + rails */
    const fp = [], HX = 11, HY = 6.5;
    for (let z = 7.5; z > -135; z -= 7.5) {
      const c = [[-HX, -HY], [HX, -HY], [HX, HY], [-HX, HY]];
      for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4]; fp.push(a[0], a[1], z, b[0], b[1], z); }
    }
    [[-HX, -HY], [HX, -HY], [HX, HY], [-HX, HY]].forEach((c) => fp.push(c[0], c[1], 15, c[0], c[1], -140));
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3));
    sc.add(new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: 0xbb9af7, transparent: true, opacity: 0.16, blending: ADD, depthWrite: false })));

    /* sol en perspective */
    const gp = [], FY = -5.2;
    for (let x = -33; x <= 33; x += 3) gp.push(x, FY, 15, x, FY, -140);
    for (let z = 15; z >= -140; z -= 3) gp.push(-33, FY, z, 33, FY, z);
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    sc.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x7dcfff, transparent: true, opacity: 0.1, blending: ADD, depthWrite: false })));

    /* polytopes 4D réguliers */
    function edgesOf(V) {
      let m = 1e9; const D = [];
      for (let i = 0; i < V.length; i++) for (let k = i + 1; k < V.length; k++) {
        const d = Math.hypot(V[i][0] - V[k][0], V[i][1] - V[k][1], V[i][2] - V[k][2], V[i][3] - V[k][3]);
        D.push([i, k, d]); if (d < m) m = d;
      }
      return D.filter((e) => e[2] < m * 1.01).map((e) => [e[0], e[1]]);
    }
    const unit = (V) => { const r = Math.hypot.apply(null, V[0]); return V.map((v) => v.map((x) => x / r)); };
    const A = [], B = [], C = [], q5 = 1 / Math.sqrt(5);
    for (let i = 0; i < 16; i++) A.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    for (let a = 0; a < 4; a++) for (const s of [1, -1]) { const v = [0, 0, 0, 0]; v[a] = s; B.push(v); }
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) for (const s of [1, -1]) for (const t of [1, -1]) { const v = [0, 0, 0, 0]; v[a] = s; v[b] = t; C.push(v); }
    const D5 = [[1, 1, 1, -q5], [1, -1, -1, -q5], [-1, 1, -1, -q5], [-1, -1, 1, -q5], [0, 0, 0, Math.sqrt(5) - q5]];
    const DEFS = [A, B, C, D5].map((V) => { const v = unit(V); return { V: v, E: edgesOf(v) }; });
    const TYPES = [0, 1, 2, 3, 0, 1, 2, 0];
    const KSC = 6.5, DW = 2.6;
    const COL = [[0.49, 0.81, 1.0], [0.73, 0.6, 0.97], [0.54, 0.17, 0.89]];
    function colorAt(w) {
      const t = clamp((w * 1.2 + 1.2) / 2.4, 0, 1), a = t < 0.5 ? COL[0] : COL[1], b = t < 0.5 ? COL[1] : COL[2], k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    function rot4(p, a, b, t) { const c = Math.cos(t), s = Math.sin(t), u = p[a], v = p[b]; p[a] = u * c - v * s; p[b] = u * s + v * c; }

    const polys = items.map((it, i) => {
      const def = DEFS[TYPES[i % TYPES.length]], ne = def.E.length, n = def.V.length;
      const pos = new Float32Array(ne * 6), col = new Float32Array(ne * 6), pp = new Float32Array(n * 3), pc = new Float32Array(n * 3);
      const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); lg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const lm = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: ADD, depthWrite: false });
      const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3)); pg.setAttribute("color", new THREE.BufferAttribute(pc, 3));
      const pm = new THREE.PointsMaterial({ size: 0.38, map: dot, vertexColors: true, transparent: true, opacity: 0, blending: ADD, depthWrite: false });
      const g = new THREE.Group(); g.add(new THREE.LineSegments(lg, lm), new THREE.Points(pg, pm));
      g.visible = false; sc.add(g);
      return { def, g, lg, pg, lm, pm, pos, col, pp, pc, R: def.V.map(() => [0, 0, 0, 0]), phase: i * 1.7 };
    });
    function placeAt(p, x, y, z) { p.g.position.set(x / U, y, z / U); }
    function placePolys() {
      polys.forEach((p, i) => {
        const it = items[i];
        let x, y = -0.3, z = it.z - 800;
        if (i === 0) { x = wide ? 520 : 0; y = wide ? -0.2 : -2.6; z = -300; p.g.scale.setScalar(wide ? 1.35 : 0.8); return placeAt(p, x, y, z); }
        else if (i === N - 1) { x = wide ? -520 : 0; y = wide ? -0.2 : -2.6; z = it.z - 300; p.g.scale.setScalar(wide ? 1.35 : 0.8); return placeAt(p, x, y, z); }
        else x = wide ? -it.side * 620 : (i % 2 ? 1 : -1) * 170;
        p.g.position.set(x / U, y, z / U);
        p.g.scale.setScalar(wide ? 1 : 0.8);
      });
    }
    placePolys();

    function updatePoly(p, time, f) {
      const V = p.def.V, R = p.R, E = p.def.E;
      const xw = time * 0.55 + p.phase, yw = time * 0.38 + f * 1.1 + p.phase * 0.7, zw = f * 1.6, xy = time * 0.17, xz = time * 0.11 + p.phase, yz = f * 0.5;
      for (let i = 0; i < V.length; i++) {
        const r = R[i], v = V[i];
        r[0] = v[0]; r[1] = v[1]; r[2] = v[2]; r[3] = v[3];
        rot4(r, 0, 3, xw); rot4(r, 1, 3, yw); rot4(r, 2, 3, zw); rot4(r, 0, 1, xy); rot4(r, 0, 2, xz); rot4(r, 1, 2, yz);
        const s = KSC / (DW - r[3]), c = colorAt(r[3]);
        p.pp[i * 3] = r[0] * s; p.pp[i * 3 + 1] = r[1] * s; p.pp[i * 3 + 2] = r[2] * s;
        p.pc[i * 3] = c[0]; p.pc[i * 3 + 1] = c[1]; p.pc[i * 3 + 2] = c[2];
      }
      for (let e = 0; e < E.length; e++) {
        const a = R[E[e][0]], b = R[E[e][1]], sa = KSC / (DW - a[3]), sb = KSC / (DW - b[3]), ca = colorAt(a[3]), cb = colorAt(b[3]);
        p.pos[e * 6] = a[0] * sa; p.pos[e * 6 + 1] = a[1] * sa; p.pos[e * 6 + 2] = a[2] * sa;
        p.pos[e * 6 + 3] = b[0] * sb; p.pos[e * 6 + 4] = b[1] * sb; p.pos[e * 6 + 5] = b[2] * sb;
        p.col[e * 6] = ca[0]; p.col[e * 6 + 1] = ca[1]; p.col[e * 6 + 2] = ca[2];
        p.col[e * 6 + 3] = cb[0]; p.col[e * 6 + 4] = cb[1]; p.col[e * 6 + 5] = cb[2];
      }
      p.lg.attributes.position.needsUpdate = true; p.lg.attributes.color.needsUpdate = true;
      p.pg.attributes.position.needsUpdate = true; p.pg.attributes.color.needsUpdate = true;
    }

    return {
      size, placePolys,
      render(cx, cy, cz, f, time) {
        cam.position.set(cx / U, -cy / U, (cz + P) / U);
        const eyeZ = cam.position.z;
        polys.forEach((p) => {
          const dist = eyeZ - p.g.position.z;                               // distance à l'œil (unités)
          const o = clamp((dist - 3) / 6, 0, 1) * clamp(1 - (dist - 14) / 38, 0, 1);
          p.g.visible = o > 0.01;
          if (!p.g.visible) return;
          p.lm.opacity = 0.9 * o; p.pm.opacity = o;
          updatePoly(p, time, f);
        });
        renderer.render(sc, cam);
      },
    };
  }
  const gl = initGL();

  /* ------------------------------------------------------------------ */
  /* Boucle                                                              */
  /* ------------------------------------------------------------------ */
  let last = performance.now(), time = 0, intro = 0, hudT = 0, running = true, curIdx = -1, hashT = 0;

  function setCurrent(i) {
    if (i === curIdx) return;
    curIdx = i;
    navLinks.forEach((a) => a.setAttribute("aria-current", String(+a.dataset.go === i)));
    dotBtns.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
    clearTimeout(hashT);
    hashT = setTimeout(() => { try { history.replaceState(null, "", "#" + items[i].id); } catch (e) {} }, 400);
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    intro = Math.min(1, intro + dt / 1.8);
    ps += (target - ps) * (1 - Math.exp(-dt * 7));
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 4));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 4));

    const f = ps * (N - 1), c = camAt(f);
    const cx = c.x + (wide ? mouse.sx * 70 : 0), cy = c.y + (wide ? mouse.sy * 45 : 0);
    const cz = c.z + (1 - smooth(intro)) * 1800;
    scene.style.transform = `translate3d(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px, ${(-cz).toFixed(2)}px)`;

    const idx = clamp(Math.round(f), 0, N - 1);
    for (let i = 0; i < N; i++) {
      const it = items[i], dz = it.z - cz;
      let vis, blur;
      if (dz <= -DWELL) { vis = Math.pow(clamp(1 - (-dz - DWELL) / 2200, 0, 1), 2); blur = clamp((-dz - DWELL - 80) / 300, 0, 5); }
      else { vis = 1 - smooth((dz + DWELL) / 560); blur = clamp((dz + DWELL) / 90, 0, 9); }
      const q = Math.round(vis * 100) / 100, bl = Math.round(blur * 2) / 2;
      const key = q + "|" + bl;
      if (key !== it.key) {
        it.key = key;
        it.el.style.opacity = q >= 0.995 ? "" : String(q);
        it.el.style.filter = bl > 0.4 ? `blur(${bl}px)` : "";
        it.el.style.pointerEvents = q > 0.5 ? "" : "none";
      }
      const tilt = fine && wide && i === idx && q > 0.9;
      if (tilt) { it.card.style.transform = `rotateX(${(-mouse.sy * 3).toFixed(2)}deg) rotateY(${(mouse.sx * 5).toFixed(2)}deg)`; it.tilt = true; }
      else if (it.tilt) { it.card.style.transform = ""; it.tilt = false; }
    }
    setCurrent(idx);

    hudT += dt;
    if (hudT > 0.08) {
      hudT = 0;
      hud.textContent = `${String(idx + 1).padStart(2, "0")}/${String(N).padStart(2, "0")} · ${items[idx].title.toUpperCase()} · Z ${String(Math.max(0, Math.round(DWELL - cz))).padStart(5, "0")}`;
    }

    if (gl) gl.render(cx, cy, cz, f, time);
    requestAnimationFrame(frame);
  }

  layout();
  const h0 = location.hash.slice(1), i0 = items.findIndex((it) => it.id === h0);
  if (i0 > 0) { scrollTo(0, (range * i0) / (N - 1)); target = ps = clamp(scrollY / range, 0, 1); }
  else { ps = target; }
  root.classList.add("fly");

  addEventListener("resize", () => { layout(); if (gl) { gl.size(); gl.placePolys(); } });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
  window.__tour = { goTo, ready: true, count: N };
})();
