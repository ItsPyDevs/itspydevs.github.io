(() => {
  "use strict";

  const OWNER = "ItsPyDevs";
  const SITE_REPO = "itspydevs.github.io";
  const DISCORD = "https://discord.com/users/1211004235857137688";
  const PINNED = ["AskIfGay", "ChloeV2", "Genderize", "GitLive", "ItsPyDevs", SITE_REPO];
  const SECTIONS = {
    apropos: "À propos", domaines: "Domaines", competences: "Compétences",
    projets: "Projets", activite: "Activité", contact: "Contact",
  };
  const LANG_COLORS = {
    Python: "#ffd43b", Rust: "#e0703a", JavaScript: "#f0db4f", "C#": "#8a5cd6",
    Java: "#5b9bd5", HTML: "#e34c26", CSS: "#6a8fd8", TypeScript: "#3178c6", Shell: "#89e051",
  };
  const FORTUNES = [
    "Un bug n'est jamais aléatoire : il est juste mal observé.",
    "Fais-le marcher, fais-le propre, fais-le vite. Dans cet ordre.",
    "Rust te dit non avant de planter. Python te dit oui, puis plante.",
    "Un script de 20 lignes qui tourne vaut mieux qu'une architecture de 2000.",
    "Le meilleur commentaire est un nom de variable bien choisi.",
    "Commit petit, commit souvent.",
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ANIM = !reduceMotion && "IntersectionObserver" in window;
  if (!ANIM) root.classList.remove("anim");
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const langColor = (l) => LANG_COLORS[l] || "#93a1b5";
  const isPinned = (n) => PINNED.some((p) => p.toLowerCase() === n.toLowerCase());
  const pct = (n, total) => Math.round((n / total) * 100);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* ---------- Thème ---------- */
  const themeBtn = $("#theme-toggle");
  if (themeBtn) themeBtn.setAttribute("aria-pressed", String(root.dataset.theme === "light"));
  const themeIcon = themeBtn && themeBtn.querySelector("svg");
  const spinThemeIcon = (t) => { if (themeIcon) themeIcon.style.transform = t === "light" ? "rotate(180deg)" : ""; };
  spinThemeIcon(root.dataset.theme);

  function setTheme(t) {
    root.dataset.theme = t;
    if (ANIM) {
      root.classList.add("theme-anim");
      setTimeout(() => root.classList.remove("theme-anim"), 450);
    }
    spinThemeIcon(t);
    try { localStorage.setItem("theme", t); } catch (e) { /* stockage indisponible */ }
    const m = $('meta[name="theme-color"]');
    if (m) m.content = t === "light" ? "#f5f6f8" : "#0d1520";
    if (themeBtn) themeBtn.setAttribute("aria-pressed", String(t === "light"));
    window.dispatchEvent(new Event("themechange"));
  }
  const toggleTheme = () => setTheme(root.dataset.theme === "light" ? "dark" : "light");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  function goTo(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignoré */ }
    return true;
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Progression et section active ---------- */
  const progress = $("#progress");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking || !progress) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      ticking = false;
    });
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    const links = $$(".nav-links a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(SECTIONS).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Animations d'apparition ---------- */
  const revealIO = ANIM ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealIO.unobserve(e.target);
      if (e.target.matches(".langs")) runCounters(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;

  function reveal(nodes, step = 70) {
    if (!revealIO) return;
    nodes.forEach((n, i) => {
      n.classList.add("reveal");
      n.style.setProperty("--d", Math.min(i, 4) * step + "ms");
      revealIO.observe(n);
    });
  }

  function runCounters(scopeEl) {
    $$("[data-count]", scopeEl).forEach((li) => {
      const target = Number(li.dataset.count);
      const suffix = li.dataset.suffix || "";
      const t0 = performance.now();
      const D = 900;
      const stepFn = (now) => {
        const k = Math.min(1, (now - t0) / D);
        li.textContent = `${Math.round(target * (1 - Math.pow(1 - k, 3)))} ${suffix}`;
        if (k < 1) requestAnimationFrame(stepFn);
      };
      requestAnimationFrame(stepFn);
    });
  }

  function splitTitle() {
    const h1 = $("#top h1");
    if (!ANIM || !h1) return;
    const txt = h1.textContent;
    h1.setAttribute("aria-label", txt);
    h1.replaceChildren(...[...txt].map((ch, i) => {
      const s = el("span", "ch", ch);
      s.style.setProperty("--i", String(i));
      s.setAttribute("aria-hidden", "true");
      return s;
    }));
  }

  function initTilt() {
    const av = $(".avatar");
    if (!ANIM || !av || !matchMedia("(hover: hover)").matches) return;
    av.addEventListener("pointermove", (e) => {
      const b = av.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      av.style.transform = `perspective(600px) rotateY(${(x * 14).toFixed(1)}deg) rotateX(${(-y * 14).toFixed(1)}deg)`;
    });
    av.addEventListener("pointerleave", () => { av.style.transform = ""; });
  }

  function initReveal() {
    [
      [".section > h2", 0], [".about", 0], [".method li", 90], [".domain", 60], [".skill-row", 80],
      [".toolbar", 0], ["#projects .project", 60], [".langs", 0], [".more", 0], [".feed-lead", 0],
      [".contact-lead", 0], [".contact-links", 0], [".foot > *", 80],
    ].forEach(([sel, step]) => reveal($$(sel), step));
    root.classList.add("ready");
  }

  splitTitle();
  initReveal();
  initTilt();

  /* ---------- Champ de glyphes du hero ---------- */
  function initField() {
    const hero = $("#top");
    const cv = $("#field");
    if (!hero || !cv) return;
    const ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) return;
    const h1 = $("h1", hero);

    const GLYPHS = "{}[]()<>=+-*/;:#&|!?_%$~^".split("");
    const CELL = 22;
    const FONT = 14;
    const SWEEP_MS = 1800;
    const RADIUS = 150;

    let w = 0, h = 0, cols = 0, rows = 0;
    let glyphs = [], lvl = new Float32Array(0);
    let muted = [147, 161, 181], py = [255, 212, 59], rs = [224, 112, 58];
    let mx = -1e4, my = -1e4, sweepT0 = null, raf = 0, idle = 0;

    const rgb = (hex) => {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex);
      if (!m) return [147, 161, 181];
      const n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    function readColors() {
      const cs = getComputedStyle(root);
      muted = rgb(cs.getPropertyValue("--muted").trim());
      py = rgb(cs.getPropertyValue("--accent").trim());
      rs = rgb(cs.getPropertyValue("--rust").trim());
    }

    function frame(now) {
      raf = 0;
      const sweeping = sweepT0 !== null && now - sweepT0 < SWEEP_MS + 700;
      const front = sweeping ? ((now - sweepT0) / SWEEP_MS) * (w + h * 0.6 + 400) - 200 : -1e5;
      let active = false;

      ctx.clearRect(0, 0, w, h);
      ctx.font = `500 ${FONT}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c * CELL + CELL / 2;
          const y = r * CELL + CELL / 2;
          let t = 0;
          const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS) { const k = 1 - Math.sqrt(d2) / RADIUS; t = k * k; }
          if (sweeping) {
            const d = x + y * 0.6 - front;
            const s = Math.exp(-(d * d) / (2 * 90 * 90));
            if (s > t) t = s;
          }
          let v = lvl[i] * 0.9;
          if (t > v) v = t;
          if (v < 0.02) v = 0; else active = true;
          lvl[i] = v;

          const f = c / Math.max(1, cols - 1);
          const gr = py[0] + (rs[0] - py[0]) * f, gg = py[1] + (rs[1] - py[1]) * f, gb = py[2] + (rs[2] - py[2]) * f;
          const R = Math.round(muted[0] + (gr - muted[0]) * v);
          const G = Math.round(muted[1] + (gg - muted[1]) * v);
          const B = Math.round(muted[2] + (gb - muted[2]) * v);
          ctx.fillStyle = `rgba(${R},${G},${B},${(0.13 + 0.87 * v).toFixed(3)})`;
          ctx.fillText(glyphs[i], x, y);
        }
      }
      if (active || sweeping) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      glyphs = Array.from({ length: cols * rows }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
      lvl = new Float32Array(cols * rows);
      kick();
    }

    readColors();
    window.addEventListener("themechange", () => { readColors(); kick(); });
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener("resize", resize);
    resize();

    if (reduceMotion) return;

    /* Le titre réagit aussi : largeur et graisse de la police variable suivent la souris. */
    function tuneTitle(e) {
      if (!h1 || e.pointerType !== "mouse") return;
      const b = hero.getBoundingClientRect();
      const fx = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
      const fy = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height));
      h1.style.fontStretch = (75 + fx * 11).toFixed(1) + "%";
      h1.style.fontWeight = String(Math.round(620 + fy * 180));
    }
    function resetTitle() {
      if (!h1) return;
      h1.style.fontStretch = "";
      h1.style.fontWeight = "";
    }

    hero.addEventListener("pointermove", (e) => {
      const b = hero.getBoundingClientRect();
      mx = e.clientX - b.left;
      my = e.clientY - b.top;
      clearTimeout(idle);
      idle = setTimeout(() => { mx = my = -1e4; }, 700);
      tuneTitle(e);
      kick();
    });
    hero.addEventListener("pointerleave", () => { mx = my = -1e4; resetTitle(); kick(); });

    const start = () => { sweepT0 = performance.now(); kick(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  }
  initField();

  /* ---------- Données GitHub ---------- */
  const state = { repos: [], user: null, showAll: false, filter: "all" };
  const list = $("#projects");
  const filtersEl = $("#filters");
  const toggleAll = $("#toggle-all");

  async function getData(url, key, { text = false, accept = "application/vnd.github+json" } = {}) {
    try {
      const c = sessionStorage.getItem(key);
      if (c) { const { t, d } = JSON.parse(c); if (Date.now() - t < 600000) return d; }
    } catch (e) { /* cache indisponible */ }
    const res = await fetch(url, { headers: { Accept: accept } });
    if (!res.ok) throw new Error(String(res.status));
    const d = text ? await res.text() : await res.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* ignoré */ }
    return d;
  }

  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  function rel(date) {
    const s = (new Date(date) - Date.now()) / 1000;
    const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const [u, n] of units) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
    return "à l'instant";
  }
  const monthFmt = new Intl.DateTimeFormat("fr", { month: "short", year: "numeric" });

  const scope = () => state.repos.filter((r) => state.showAll || isPinned(r.name));
  const findRepo = (n) => state.repos.find((r) => r.name.toLowerCase() === String(n).toLowerCase());

  function dotFor(lang) {
    const d = el("span", "dot");
    d.style.background = langColor(lang);
    d.setAttribute("aria-hidden", "true");
    return d;
  }

  function metaItems(r) {
    const items = [];
    if (r.language) { const m = el("li"); m.append(dotFor(r.language), r.language); items.push(m); }
    if (r.stargazers_count > 0) items.push(el("li", null, `${r.stargazers_count} ★`));
    if (r.pushed_at) items.push(el("li", null, "Mis à jour " + monthFmt.format(new Date(r.pushed_at))));
    return items;
  }

  function projectItem(r) {
    const li = el("li", "project");
    const body = el("div", "project-body");
    const h = el("h3");
    const a = el("a", null, r.name);
    a.href = r.html_url;
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openProject(r);
    });
    h.append(a);
    body.append(h);
    if (r.description) body.append(el("p", "desc", r.description));
    const meta = el("ul", "meta");
    meta.append(...metaItems(r));
    li.append(body, meta);
    return li;
  }

  function renderList() {
    const rows = scope().filter((r) => state.filter === "all" || r.language === state.filter);
    list.replaceChildren(...rows.map(projectItem));
  }

  function renderFilters() {
    const langs = [...new Set(scope().map((r) => r.language).filter(Boolean))].sort();
    if (state.filter !== "all" && !langs.includes(state.filter)) state.filter = "all";
    filtersEl.replaceChildren();
    filtersEl.hidden = langs.length < 2;
    if (langs.length < 2) return;
    ["all", ...langs].forEach((l) => {
      const b = el("button", "chip", l === "all" ? "Tous" : l);
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.filter === l));
      b.addEventListener("click", () => { state.filter = l; renderFilters(); renderList(); });
      filtersEl.append(b);
    });
  }

  function fillBar(barEl, legendEl, entries) {
    const total = entries.reduce((a, [, n]) => a + n, 0);
    barEl.replaceChildren();
    legendEl.replaceChildren();
    if (!total) return false;
    entries.forEach(([l, n], k) => {
      const seg = el("span");
      seg.style.setProperty("--k", String(k));
      seg.style.flex = String(n);
      seg.style.background = langColor(l);
      seg.title = l;
      barEl.append(seg);
      const li = el("li");
      li.append(dotFor(l), `${l} ${pct(n, total)} %`);
      legendEl.append(li);
    });
    barEl.setAttribute("aria-label", entries.map(([l, n]) => `${l} ${pct(n, total)} %`).join(", "));
    return true;
  }

  function renderLangs() {
    const counts = new Map();
    state.repos.filter((r) => r.language).forEach((r) => counts.set(r.language, (counts.get(r.language) || 0) + 1));
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);
    if (!fillBar($("#bar"), $("#legend"), sorted)) return;

    const stars = state.repos.reduce((a, r) => a + r.stargazers_count, 0);
    const totals = $("#totals");
    const counter = (n, suffix) => {
      const li = el("li", null, `${n} ${suffix}`);
      li.dataset.count = String(n);
      li.dataset.suffix = suffix;
      return li;
    };
    totals.replaceChildren(counter(state.repos.length, "dépôts"), counter(stars, "étoiles"));
    if (state.user && typeof state.user.followers === "number") totals.append(counter(state.user.followers, "abonnés"));
    $("#langs").hidden = false;
  }

  function renderPulse() {
    const pulse = $("#pulse");
    const latest = [...state.repos].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];
    if (!pulse || !latest) return;
    const a = el("a", null, latest.name);
    a.href = latest.html_url;
    pulse.replaceChildren("Dernière activité : ", a, " " + rel(latest.pushed_at));
    pulse.hidden = false;
  }

  function renderSiteUpdated() {
    const p = $("#site-updated");
    const r = findRepo(SITE_REPO);
    if (!p || !r) return;
    p.textContent = "Site mis à jour " + rel(r.pushed_at) + ".";
    p.hidden = false;
  }

  function updateToggle() {
    const extra = state.repos.filter((r) => !isPinned(r.name)).length;
    toggleAll.hidden = extra === 0;
    toggleAll.textContent = state.showAll ? "Voir moins" : `Voir tous les dépôts (${state.repos.length})`;
    toggleAll.setAttribute("aria-expanded", String(state.showAll));
  }
  toggleAll.addEventListener("click", () => {
    state.showAll = !state.showAll;
    updateToggle();
    renderFilters();
    renderList();
  });

  async function loadRepos() {
    const [rp, us] = await Promise.allSettled([
      getData(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=pushed`, "gh-repos"),
      getData(`https://api.github.com/users/${OWNER}`, "gh-user"),
    ]);
    if (rp.status !== "fulfilled" || !Array.isArray(rp.value)) return;
    const order = (n) => { const i = PINNED.findIndex((p) => p.toLowerCase() === n.toLowerCase()); return i < 0 ? 999 : i; };
    state.repos = rp.value
      .filter((r) => !r.archived && (!r.fork || isPinned(r.name)))
      .sort((a, b) => order(a.name) - order(b.name) || new Date(b.pushed_at) - new Date(a.pushed_at));
    state.user = us.status === "fulfilled" ? us.value : null;
    if (!state.repos.length) return;
    updateToggle();
    renderFilters();
    renderList();
    renderLangs();
    renderPulse();
    renderSiteUpdated();
  }

  async function loadEvents() {
    try {
      const ev = await getData(`https://api.github.com/users/${OWNER}/events/public?per_page=30`, "gh-events");
      if (!Array.isArray(ev)) return [];
      return ev.filter((e) => e.type === "PushEvent" && e.repo && e.repo.name).slice(0, 8).map((e) => {
        const commits = (e.payload && e.payload.commits) || [];
        const last = commits[commits.length - 1];
        return {
          repo: e.repo.name.split("/").pop(),
          when: e.created_at,
          msg: last && last.message ? last.message.split("\n")[0] : "",
        };
      });
    } catch (e) {
      return [];
    }
  }

  function renderFeed(events) {
    let rows = events;
    let lead = "Les dernières mises à jour de mes dépôts publics, lues directement depuis GitHub.";
    if (!rows.length) {
      rows = [...state.repos]
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 6)
        .map((r) => ({ repo: r.name, when: r.pushed_at, msg: r.description || "" }));
      lead = "Les dépôts mis à jour le plus récemment, lus directement depuis GitHub.";
    }
    if (!rows.length) return;
    $("#feed-lead").textContent = lead;
    const nodes = rows.map((r) => {
      const li = el("li");
      li.append(el("span", "when", rel(r.when)));
      const body = el("div");
      const a = el("a", "repo", r.repo);
      a.href = `https://github.com/${OWNER}/${r.repo}`;
      body.append(a);
      if (r.msg) body.append(el("p", "msg", r.msg));
      li.append(body);
      return li;
    });
    $("#feed").replaceChildren(...nodes);
    reveal(nodes);
    $("#activite").hidden = false;
    $("#nav-activite").hidden = false;
  }

  Promise.all([loadRepos().catch(() => {}), loadEvents()]).then(([, events]) => renderFeed(events)).catch(() => {});

  /* ---------- Fiche projet ---------- */
  const pDlg = $("#project");
  let pToken = 0;

  function readmeExcerpt(md) {
    const text = md
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/[*_`>]/g, "");
    const paras = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter((p) => p.length > 30);
    const out = paras.slice(0, 2).join("\n\n");
    return out.length > 600 ? out.slice(0, 597) + "…" : out;
  }

  async function openProject(r) {
    if (!pDlg || typeof pDlg.showModal !== "function") { window.open(r.html_url, "_blank", "noopener"); return; }
    const token = ++pToken;
    $("#project-title").textContent = r.name;
    $("#project-desc").textContent = r.description || "";
    $("#project-desc").hidden = !r.description;
    $("#project-link").href = r.html_url;

    const meta = $("#project-meta");
    meta.replaceChildren(...metaItems(r));
    if (r.created_at) meta.append(el("li", null, "Créé " + monthFmt.format(new Date(r.created_at))));
    if (r.pushed_at) meta.append(el("li", null, "Dernière activité " + rel(r.pushed_at)));

    $("#project-topics").replaceChildren(...(r.topics || []).map((t) => el("li", null, t)));
    $("#project-langs").hidden = true;
    const readme = $("#project-readme");
    readme.textContent = "Chargement du README…";
    if (!pDlg.open) pDlg.showModal();

    const base = `https://api.github.com/repos/${OWNER}/${r.name}`;
    const [langs, md] = await Promise.allSettled([
      getData(`${base}/languages`, `gh-lang-${r.name}`),
      getData(`${base}/readme`, `gh-readme-${r.name}`, { text: true, accept: "application/vnd.github.raw+json" }),
    ]);
    if (token !== pToken) return;

    if (langs.status === "fulfilled" && langs.value && typeof langs.value === "object") {
      const entries = Object.entries(langs.value).sort((a, b) => b[1] - a[1]);
      const pb = $("#project-bar");
      pb.classList.remove("grown");
      $("#project-langs").hidden = !fillBar(pb, $("#project-legend"), entries);
      requestAnimationFrame(() => requestAnimationFrame(() => pb.classList.add("grown")));
    }
    const ex = md.status === "fulfilled" && typeof md.value === "string" ? readmeExcerpt(md.value) : "";
    readme.textContent = ex;
  }

  if (pDlg) {
    $("#project-close").addEventListener("click", () => pDlg.close());
    pDlg.addEventListener("click", (e) => { if (e.target === pDlg) pDlg.close(); });
  }

  /* ---------- Copier le lien Discord ---------- */
  const copyBtn = $("#copy-discord");
  const copyStatus = $("#copy-status");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(DISCORD);
        copyStatus.textContent = "Lien Discord copié.";
      } catch (e) {
        copyStatus.textContent = "Copie impossible : " + DISCORD;
      }
      setTimeout(() => { copyStatus.textContent = ""; }, 3000);
    });
  }

  /* ---------- Terminal ---------- */
  const out = $("#repl-out");
  const form = $("#repl-form");
  const input = $("#repl-in");
  const history_ = [];
  let hIndex = 0;

  function line(text, cls = "res") {
    const p = el("p", cls, text);
    out.append(p);
    return p;
  }
  function typeWelcome(text) {
    const p = line("", "res");
    if (!ANIM) { p.textContent = text; return; }
    out.setAttribute("aria-live", "off");
    p.classList.add("typing");
    let i = 0;
    const tick = () => {
      i += 1;
      p.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, 26);
      else { p.classList.remove("typing"); out.setAttribute("aria-live", "polite"); }
    };
    setTimeout(tick, 1100);
  }
  function linkLine(label, text, href) {
    const p = el("p", "res");
    p.append(document.createTextNode(label));
    const a = el("a", null, text);
    a.href = href;
    p.append(a);
    out.append(p);
  }

  const resolveSection = (arg) => {
    const k = norm(arg || "").replace(/^#|\//g, "");
    const map = {
      apropos: "apropos", "a-propos": "apropos", about: "apropos",
      domaines: "domaines", competences: "competences", skills: "competences",
      projets: "projets", projects: "projets", activite: "activite", activity: "activite",
      contact: "contact", top: "top", accueil: "top", home: "top",
    };
    return map[k];
  };

  const commands = {
    help() {
      line("Commandes disponibles :");
      [
        ["about", "qui je suis"],
        ["neofetch", "résumé du profil"],
        ["skills", "langages et outils"],
        ["projets", "mes dépôts GitHub"],
        ["open <projet>", "ouvrir la fiche d'un projet"],
        ["stats", "chiffres GitHub"],
        ["contact", "où me joindre"],
        ["goto <section>", "aller à une section"],
        ["theme [clair|sombre]", "changer de thème"],
        ["fortune", "une phrase au hasard"],
        ["ls, date, clear", "le reste"],
      ].forEach(([c, d]) => line(`  ${c.padEnd(22)}${d}`));
      line("Ctrl K ouvre la palette de commandes.");
    },
    about() {
      line("ItsPyDevs, développeur indépendant.");
      line("Python en premier, Rust quand la vitesse compte.");
      line("Bots, outils et applications, de préférence en local.");
    },
    neofetch() {
      [
        "  ┌────────┐   itspydevs@github",
        "  │ py  rs │   ──────────────────",
        "  └────────┘   Langages  Python, Rust, JavaScript, C#, Java",
        "               Outils    VS Code, Git, GitHub",
        "               Style     local-first, petites itérations",
      ].forEach((t) => line(t, "art"));
    },
    skills() {
      line("Langages : Python, Rust, JavaScript, C#, Java, HTML, CSS, SQLite");
      line("Outils   : VS Code, Visual Studio, Eclipse, Git, GitHub");
    },
    projets() {
      const names = state.repos.length ? scope().map((r) => r.name) : PINNED;
      names.forEach((n) => linkLine("  ", n, `https://github.com/${OWNER}/${n}`));
      line("Tape « open <projet> » pour voir la fiche.");
    },
    open(args) {
      const name = args[0];
      if (!name) { line("usage : open <projet>", "err"); return; }
      const r = findRepo(name);
      if (r) { line(`Ouverture de ${r.name}…`); openProject(r); return; }
      const known = PINNED.find((p) => p.toLowerCase() === name.toLowerCase());
      if (known) { line(`Ouverture de ${known} sur GitHub…`); window.open(`https://github.com/${OWNER}/${known}`, "_blank", "noopener"); return; }
      line(`projet introuvable : ${name}`, "err");
    },
    stats() {
      if (!state.repos.length) { line("Données GitHub non chargées.", "err"); return; }
      const stars = state.repos.reduce((a, r) => a + r.stargazers_count, 0);
      line(`${state.repos.length} dépôts publics, ${stars} étoiles`);
      if (state.user && typeof state.user.followers === "number") line(`${state.user.followers} abonnés`);
    },
    contact() {
      linkLine("Discord : ", "discord.com/users/1211004235857137688", DISCORD);
      linkLine("GitHub  : ", "github.com/ItsPyDevs", "https://github.com/ItsPyDevs");
    },
    ls() {
      line("apropos/  domaines/  competences/  projets/  activite/  contact/");
    },
    goto(args) {
      const id = resolveSection(args[0]);
      if (!id) { line("usage : goto apropos | domaines | competences | projets | activite | contact", "err"); return; }
      line(`→ ${id}`);
      goTo(id);
    },
    theme(args) {
      const a = norm(args[0] || "");
      if (["light", "clair"].includes(a)) setTheme("light");
      else if (["dark", "sombre"].includes(a)) setTheme("dark");
      else toggleTheme();
      line(`Thème : ${root.dataset.theme === "light" ? "clair" : "sombre"}`);
    },
    fortune() {
      line(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
    },
    date() {
      line(new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }));
    },
    sudo() {
      line("Permission refusée : ce terminal est en lecture seule.", "err");
    },
    clear() {
      out.textContent = "";
    },
  };
  const aliases = { projects: "projets", whoami: "about", cd: "goto", dir: "ls", cat: "open" };

  function run(raw) {
    const text = raw.trim();
    if (!text) return;
    history_.push(text);
    hIndex = history_.length;
    const [name, ...args] = text.split(/\s+/);
    let cmd = name.toLowerCase();
    cmd = aliases[cmd] || cmd;
    if (cmd === "clear") { commands.clear(); return; }
    line(text, "cmd");
    const before = out.children.length;
    if (Object.prototype.hasOwnProperty.call(commands, cmd)) commands[cmd](args);
    else line(`commande inconnue : ${name}. Tape « help ».`, "err");
    [...out.children].slice(before).forEach((p, i) => p.style.setProperty("--n", String(Math.min(i, 12))));
    out.scrollTop = out.scrollHeight;
  }

  if (out && form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      run(input.value);
      input.value = "";
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && history_.length) {
        e.preventDefault();
        hIndex = Math.max(0, hIndex - 1);
        input.value = history_[hIndex];
      } else if (e.key === "ArrowDown" && history_.length) {
        e.preventDefault();
        hIndex = Math.min(history_.length, hIndex + 1);
        input.value = history_[hIndex] || "";
      } else if (e.key === "Tab") {
        const v = input.value.trim().toLowerCase();
        if (!v || v.includes(" ")) return;
        e.preventDefault();
        const names = [...Object.keys(commands), ...Object.keys(aliases)].filter((n) => n.startsWith(v));
        if (names.length === 1) input.value = names[0] + " ";
        else if (names.length > 1) line(names.join("  "));
      }
    });

    $$(".repl-chips button").forEach((b) => b.addEventListener("click", () => run(b.dataset.cmd)));
    typeWelcome("Bienvenue. Tape « help » pour voir les commandes.");
  }

  /* ---------- Palette de commandes ---------- */
  const dlg = $("#palette");
  const pin = $("#palette-in");
  const plist = $("#palette-list");
  const openBtn = $("#palette-open");
  let items = [], shown = [], sel = 0;

  const openUrl = (u) => window.open(u, "_blank", "noopener");

  function buildItems() {
    const repos = state.repos.length ? state.repos : PINNED.map((n) => ({ name: n, html_url: `https://github.com/${OWNER}/${n}`, fake: true }));
    items = [
      ...Object.entries(SECTIONS)
        .filter(([id]) => { const s = document.getElementById(id); return s && !s.hidden; })
        .map(([id, label]) => ({ label: "Aller à " + label, hint: "#" + id, run: () => goTo(id) })),
      { label: "Ouvrir le terminal", hint: "terminal", run: () => { goTo("top"); setTimeout(() => input && input.focus({ preventScroll: true }), 80); } },
      { label: "Changer de thème", hint: "thème", run: toggleTheme },
      { label: "Copier le lien Discord", hint: "contact", run: () => copyBtn && copyBtn.click() },
      { label: "Ouvrir GitHub", hint: "lien", run: () => openUrl("https://github.com/ItsPyDevs") },
      { label: "Ouvrir Discord", hint: "lien", run: () => openUrl(DISCORD) },
      ...repos.map((r) => ({
        label: "Projet : " + r.name,
        hint: r.language || "dépôt",
        run: () => (r.fake ? openUrl(r.html_url) : openProject(r)),
      })),
    ];
  }

  function paintSelection() {
    $$("li", plist).forEach((li, i) => li.setAttribute("aria-selected", String(i === sel)));
    const cur = plist.children[sel];
    if (cur && cur.id) {
      pin.setAttribute("aria-activedescendant", cur.id);
      cur.scrollIntoView({ block: "nearest" });
    } else {
      pin.removeAttribute("aria-activedescendant");
    }
  }

  function renderPalette() {
    const q = norm(pin.value.trim());
    shown = items.filter((it) => !q || norm(it.label).includes(q) || norm(it.hint).includes(q));
    sel = 0;
    plist.replaceChildren();
    if (!shown.length) {
      plist.append(el("li", "palette-empty", "Aucun résultat"));
      pin.removeAttribute("aria-activedescendant");
      return;
    }
    shown.forEach((it, i) => {
      const li = el("li");
      li.id = "pal-" + i;
      li.setAttribute("role", "option");
      li.append(el("span", null, it.label), el("small", null, it.hint));
      li.addEventListener("click", () => exec(i));
      li.addEventListener("pointermove", () => { if (sel !== i) { sel = i; paintSelection(); } });
      plist.append(li);
    });
    paintSelection();
  }

  function exec(i) {
    const it = shown[i];
    if (!it) return;
    dlg.close();
    it.run();
  }

  function openPalette() {
    if (!dlg || typeof dlg.showModal !== "function") return;
    if (dlg.open || (pDlg && pDlg.open)) return;
    buildItems();
    pin.value = "";
    renderPalette();
    dlg.showModal();
    pin.focus();
  }

  if (dlg && pin && plist) {
    pin.addEventListener("input", renderPalette);
    pin.addEventListener("keydown", (e) => {
      if (!shown.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % shown.length; paintSelection(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % shown.length; paintSelection(); }
      else if (e.key === "Enter") { e.preventDefault(); exec(sel); }
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    if (openBtn) openBtn.addEventListener("click", openPalette);
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    }
  });
})();