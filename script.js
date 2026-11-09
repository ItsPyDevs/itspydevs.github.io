(() => {
  "use strict";

  const OWNER = "ItsPyDevs";
  const SITE_REPO = "itspydevs.github.io";
  const DISCORD = "https://discord.com/users/1211004235857137688";
  const PINNED = ["AskIfGay", "ChloeV2", "Genderize", "GitLive", "ItsPyDevs", SITE_REPO];
  const SECTIONS = {
    apropos: "À propos", domaines: "Domaines", competences: "Compétences", atelier: "Atelier",
    projets: "Projets", activite: "Activité", faq: "FAQ", contact: "Contact",
  };
  const LANG_COLORS = {
    Python: "#bb9af7", Rust: "#ff9e64", JavaScript: "#f0db4f", "C#": "#8a5cd6",
    Java: "#5b9bd5", HTML: "#e34c26", CSS: "#6a8fd8", TypeScript: "#3178c6", Shell: "#89e051",
  };
  const FORTUNES = [
    "Un bug n'est jamais aléatoire : il est juste mal observé.",
    "Fais-le marcher, fais-le propre, fais-le vite. Dans cet ordre.",
    "Rust te dit non avant de planter. Python te dit oui, puis plante.",
    "Un script de 20 lignes qui tourne vaut mieux qu'une architecture de 2000.",
    "Le meilleur commentaire est un nom de variable bien choisi.",
    "Commit petit, commit souvent.",
    "Coder, c'est transformer les problèmes en solutions codées.",
    "Hiiiiiii 👋",
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
    if (m) m.content = t === "light" ? "#f2f6fb" : "#1a1b26";
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

  /* ---------- Rail de navigation (grands écrans) ---------- */
  function buildRail() {
    const ol = $("#rail-list");
    if (!ol) return;
    ol.replaceChildren(...Object.entries(SECTIONS).map(([id, label]) => {
      const li = el("li");
      li.dataset.id = id;
      const a = el("a");
      a.href = "#" + id;
      a.setAttribute("aria-label", label);
      a.append(el("span", "rail-dot"), el("span", "rail-label", label));
      li.append(a);
      return li;
    }));
    syncRail();
  }
  function syncRail() {
    $$("#rail-list li").forEach((li) => {
      const s = document.getElementById(li.dataset.id);
      li.hidden = !s || s.hidden;
    });
  }

  /* ---------- Même idée, deux langages ---------- */
  const DUO = {
    py: {
      code: [
        "from collections import Counter",
        "",
        "def top_mots(texte, n=3):",
        "    mots = texte.lower().split()",
        "    return Counter(mots).most_common(n)",
      ].join("\n"),
      note: "Quatre lignes : idéal pour tester une idée en quelques minutes.",
    },
    rs: {
      code: [
        "use std::collections::HashMap;",
        "",
        "fn top_mots(texte: &str, n: usize) -> Vec<(String, usize)> {",
        "    let mut freq: HashMap<String, usize> = HashMap::new();",
        "    for mot in texte.to_lowercase().split_whitespace() {",
        "        *freq.entry(mot.to_string()).or_insert(0) += 1;",
        "    }",
        "    let mut v: Vec<_> = freq.into_iter().collect();",
        "    v.sort_by(|a, b| b.1.cmp(&a.1));",
        "    v.truncate(n);",
        "    v",
        "}",
      ].join("\n"),
      note: "Plus long, mais typé et compilé : c'est lui que je sors quand la vitesse compte.",
    },
  };

  function initDuo() {
    const fig = $("#duo");
    if (!fig) return;
    const code = $("code", fig);
    const note = $("#duo-note");
    const panel = $("#duo-code");
    const tabs = $$('[role="tab"]', fig);
    let cur = "py";
    let typeT = 0;
    /* Le code se tape à l'écran (par blocs de 3 caractères) quand on change d'onglet ou qu'on arrive sur le widget. */
    const typeInto = (text) => {
      clearTimeout(typeT);
      if (!ANIM) { code.textContent = text; return; }
      let i = 0;
      panel.classList.add("typing");
      const tick = () => {
        i = Math.min(text.length, i + 6);
        code.textContent = text.slice(0, i);
        if (i < text.length) typeT = setTimeout(tick, 16);
        else panel.classList.remove("typing");
      };
      tick();
    };
    const show = (lang, focus, instant) => {
      cur = lang;
      tabs.forEach((t) => {
        const on = t.dataset.lang === lang;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) { panel.setAttribute("aria-labelledby", t.id); if (focus) t.focus(); }
      });
      if (instant) { clearTimeout(typeT); panel.classList.remove("typing"); code.textContent = DUO[lang].code; }
      else typeInto(DUO[lang].code);
      note.textContent = DUO[lang].note;
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(t.dataset.lang));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        show(next.dataset.lang, true);
      });
    });
    show("py", false, true);
    if (ANIM) {
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        typeInto(DUO[cur].code);
      }, { threshold: 0.55 });
      io.observe(fig);
    }
  }

  buildRail();
  initDuo();

  /* ---------- Progression et section active ---------- */
  function markCurrent(id) {
    $$(".nav-links a, .rail a").forEach((a) => {
      if (a.getAttribute("href") !== "#" + id) { a.removeAttribute("aria-current"); return; }
      a.setAttribute("aria-current", "true");
      const ul = a.closest(".nav-links");
      if (ul && ul.scrollWidth > ul.clientWidth) {
        const ar = a.getBoundingClientRect();
        const ur = ul.getBoundingClientRect();
        ul.scrollTo({ left: ul.scrollLeft + (ar.left - ur.left) - (ul.clientWidth - ar.width) / 2, behavior: ANIM ? "smooth" : "auto" });
      }
    });
  }
  const progress = $("#progress");
  const railFill = $("#rail-fill");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking || !progress) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - innerHeight;
      const k = max > 0 ? Math.min(1, scrollY / max) : 0;
      progress.style.transform = `scaleX(${k})`;
      if (railFill) railFill.style.transform = `scaleY(${k})`;
      if (max > 0 && scrollY >= max - 4) markCurrent("contact");
      ticking = false;
    });
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    const links = $$(".nav-links a, .rail a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) markCurrent(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", ...Object.keys(SECTIONS)].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Animations d'apparition ---------- */
  const revealIO = ANIM ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealIO.unobserve(e.target);
      if (e.target.matches(".langs")) runCounters(e.target);
      if (e.target.matches(".section > h2")) scramble(e.target);
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
      [".duo", 0], [".steps li", 80], [".contact-lead", 0], [".contact-links", 0], [".foot > *", 80],
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
    let muted = [143, 151, 189], py = [187, 154, 247], rs = [125, 207, 255];
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
    li.dataset.name = r.name;
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

  /* Réorganisation animée (FLIP) : les projets qui restent glissent vers leur nouvelle place, les nouveaux apparaissent. */
  function renderList(animate) {
    const rows = scope().filter((r) => state.filter === "all" || r.language === state.filter);
    const first = animate && ANIM
      ? new Map($$(".project", list).filter((li) => li.dataset.name).map((li) => [li.dataset.name, li.getBoundingClientRect()]))
      : null;
    list.replaceChildren(...rows.map(projectItem));
    if (!first || typeof Element.prototype.animate !== "function") return;
    $$(".project", list).forEach((li, i) => {
      const f = first.get(li.dataset.name);
      if (f) {
        const dy = f.top - li.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
      } else {
        li.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 45, easing: "ease-out", fill: "backwards" });
      }
    });
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
      b.addEventListener("click", () => { state.filter = l; renderFilters(); renderList(true); });
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
    renderList(true);
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
    syncRail();
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
        copyBtn.classList.add("ok");
        copyBtn.textContent = "Copié";
      } catch (e) {
        copyStatus.textContent = "Copie impossible : " + DISCORD;
      }
      setTimeout(() => {
        copyStatus.textContent = "";
        copyBtn.classList.remove("ok");
        copyBtn.textContent = "Copier le lien Discord";
      }, 2400);
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
      domaines: "domaines", competences: "competences", skills: "competences", atelier: "atelier", workshop: "atelier", faq: "faq",
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
        ["stack", "mon environnement"],
        ["citation", "ma citation"],
        ["faq", "questions fréquentes"],
        ["contact", "où me joindre"],
        ["goto <section>", "aller à une section"],
        ["theme [clair|sombre]", "changer de thème"],
        ["fortune", "une phrase au hasard"],
        ["ls, date, clear", "le reste"],
      ].forEach(([c, d]) => line(`  ${c.padEnd(22)}${d}`));
      line("Ctrl K ouvre la palette de commandes.");
    },
    about() {
      line("Antoine, alias ItsPyDevs. Développeur passionné 🚀");
      line("Python en premier, et j'apprends Java, C# et HTML/CSS.");
      line("Des outils utiles, clairs et puissants : IA, apps, plugins Minecraft.");
    },
    neofetch() {
      [
        "  ┌────────┐   itspydevs@github",
        "  │ >_ py  │   ──────────────────",
        "  └────────┘   Langages  Python, Java, C#, HTML/CSS, Rust",
        "               Outils    Linux, Kivy, Spigot, Git",
        "               Style     interfaces sombres, code propre",
        "               Statut    🚀 Focusing",
      ].forEach((t) => line(t, "art"));
    },
    skills() {
      line("Langages : Python, Java, C#, HTML, CSS, JavaScript, Rust, SQLite");
      line("Outils   : Linux, Kivy, Spigot, VS Code, Visual Studio, Eclipse, Git, GitHub");
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
    stack() {
      line("Système   : Linux (et Termux sur Android)");
      line("Éditeurs  : VS Code, Visual Studio, Eclipse");
      line("Langages  : Python (principal), Java, C#, HTML/CSS, Rust");
      line("Outils    : Git, GitHub, Ollama, yt-dlp, Kivy, Spigot");
    },
    citation() {
      line("« Coder, c'est transformer les problèmes en solutions codées. »");
    },
    faq() {
      line("Réponses rapides : goto faq");
      goTo("faq");
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
  const aliases = { projects: "projets", whoami: "about", cd: "goto", dir: "ls", env: "stack", quote: "citation", cat: "open" };

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

  /* =====================================================================
     Moteur de défilement : une animation propre à chaque section.
     Un seul écouteur de scroll ; chaque section déclare sa fonction, appelée
     uniquement quand elle est proche de l'écran.
     ===================================================================== */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isNarrow = () => innerWidth < 640;

  /* Écrit une variable CSS seulement si elle change (évite des recalculs inutiles). */
  function put(node, key, value) {
    const v = String(value);
    if (!node._c) node._c = {};
    if (node._c[key] === v) return;
    node._c[key] = v;
    node.style.setProperty(key, v);
  }

  const trackers = [];
  const trackMap = new WeakMap();
  const trackIO = ANIM ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { const t = trackMap.get(e.target); if (t) t.vis = e.isIntersecting; });
    schedule();
  }, { rootMargin: "35% 0px 35% 0px" }) : null;
  let scheduled = false;

  function schedule() {
    if (!trackIO || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const vh = innerHeight;
      trackers.forEach((t) => { if (t.vis) t.fn(t.el.getBoundingClientRect(), vh); });
    });
  }
  function track(node, fn) {
    if (!trackIO || !node) return;
    const t = { el: node, fn, vis: false };
    trackers.push(t);
    trackMap.set(node, t);
    trackIO.observe(node);
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  /* Titres de section : les caractères se « décodent » à la première apparition. */
  function scramble(h) {
    if (!ANIM || h.dataset.scrambled) return;
    h.dataset.scrambled = "1";
    const txt = h.textContent;
    h.setAttribute("aria-label", txt);
    const G = "{}[]<>/=+-*#;:";
    const total = txt.length;
    const t0 = performance.now();
    const D = 480 + total * 35;
    (function step(now) {
      const k = clamp((now - t0) / D);
      const fixed = Math.floor(k * total);
      let s = "";
      for (let i = 0; i < total; i++) s += i < fixed || txt[i] === " " ? txt[i] : G[(Math.random() * G.length) | 0];
      h.textContent = k < 1 ? s : txt;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* Hero : parallaxe. Texte, terminal et fond bougent à des vitesses différentes. */
  function initHeroScroll() {
    const hero = $("#top");
    track(hero, (r) => put(hero, "--hp", clamp(-r.top / r.height).toFixed(3)));
  }

  /* Bande : la vitesse et le sens suivent le défilement, avec une inclinaison selon la vélocité. */
  function initTicker() {
    const box = $(".ticker");
    const tr = $(".ticker-track");
    if (!ANIM || !box || !tr || !tr.firstElementChild) return;
    box.classList.add("js");
    const first = tr.firstElementChild;
    let w = first.offsetWidth, x = 0, vis = false, raf = 0, last = 0, ly = scrollY, sv = 0;
    const measure = () => { w = first.offsetWidth; };
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    function loop(now) {
      raf = 0;
      if (!vis) return;
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;
      const y = scrollY;
      sv = lerp(sv, clamp((y - ly) / dt, -2600, 2600), 1 - Math.exp(-dt * 7));
      ly = y;
      x += (-38 - sv * 0.35) * dt;
      if (w > 0) { x %= w; if (x > 0) x -= w; }
      tr.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${clamp(-sv / 220, -14, 14).toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver((es) => {
      vis = es[0].isIntersecting;
      if (vis && !raf) { last = performance.now(); ly = scrollY; raf = requestAnimationFrame(loop); }
    }).observe(box);
  }

  /* À propos : le texte s'allume mot à mot pendant la lecture. */
  function initReadAlong() {
    const box = $(".about-text");
    if (!ANIM || !box) return;
    const words = [];
    $$("p", box).forEach((p) => {
      const nodes = [];
      p.textContent.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) nodes.push(document.createTextNode(tok));
        else { const s = el("span", "w", tok); words.push(s); nodes.push(s); }
      });
      p.replaceChildren(...nodes);
    });
    let lit = 0;
    track(box, (r, vh) => {
      const n = Math.ceil(clamp((vh * 0.88 - r.top) / (vh * 0.33 + r.height)) * words.length);
      if (n === lit) return;
      for (let i = Math.min(n, lit); i < Math.max(n, lit); i++) words[i].classList.toggle("on", i < n);
      lit = n;
    });
  }

  /* Domaines : la ligne la plus proche du centre de l'écran prend le focus, les autres s'estompent. */
  function initDomainFocus() {
    const wrap = $(".domains");
    const items = $$(".domain");
    track(wrap, (r, vh) => {
      let best = null, bd = Infinity;
      items.forEach((d) => {
        const b = d.getBoundingClientRect();
        const dist = Math.abs(b.top + b.height / 2 - vh * 0.5) / (vh * 0.5);
        put(d, "--f", Math.pow(1 - clamp(dist), 1.4).toFixed(3));
        if (dist < bd) { bd = dist; best = d; }
      });
      items.forEach((d) => d.classList.toggle("is-focus", d === best && bd < 0.6));
    });
  }

  /* Compétences : icônes en cascade, rangées qui dérivent en sens opposés, effet magnétique. */
  function initSkills() {
    const rows = $$(".skill-row");
    rows.forEach((row, ri) => {
      $$("li", row).forEach((li, i) => li.style.setProperty("--i", String(i)));
      const dir = ri % 2 ? -1 : 1;
      track(row, (r, vh) => {
        const p = clamp((vh - r.top) / (vh + r.height));
        put(row, "--drift", ((p - 0.5) * 2 * (isNarrow() ? 14 : 34) * dir).toFixed(1) + "px");
      });
    });
    if (!finePointer) return;
    $$(".skill-row dd").forEach((dd) => {
      const imgs = $$("li img", dd);
      const reset = (img) => { img.style.removeProperty("--mx"); img.style.removeProperty("--my"); };
      dd.addEventListener("pointermove", (e) => {
        imgs.forEach((img) => {
          const b = img.getBoundingClientRect();
          const dx = e.clientX - (b.left + b.width / 2);
          const dy = e.clientY - (b.top + b.height / 2);
          const d = Math.hypot(dx, dy);
          if (d < 110) {
            const k = (1 - d / 110) * 0.35;
            img.style.setProperty("--mx", (dx * k).toFixed(1) + "px");
            img.style.setProperty("--my", (dy * k).toFixed(1) + "px");
          } else reset(img);
        });
      });
      dd.addEventListener("pointerleave", () => imgs.forEach(reset));
    });
  }

  /* Projets : barre de filtres collante, halo qui suit le curseur. */
  function initProjects() {
    const tb = $(".toolbar");
    const wrap = $(".projects-wrap");
    const hdr = $(".site-header");
    track(wrap, (r) => {
      if (!tb) return;
      const hh = hdr ? hdr.offsetHeight : 56;
      tb.classList.toggle("stuck", tb.getBoundingClientRect().top <= hh + 8 && r.bottom > hh + tb.offsetHeight + 8);
    });
    if (finePointer && list) {
      list.addEventListener("pointermove", (e) => {
        const li = e.target.closest && e.target.closest(".project");
        if (!li) return;
        const b = li.getBoundingClientRect();
        li.style.setProperty("--px", (e.clientX - b.left).toFixed(0) + "px");
        li.style.setProperty("--py", (e.clientY - b.top).toFixed(0) + "px");
      });
    }
  }

  /* Activité : la timeline se remplit au défilement, les points s'allument au passage. */
  function initFeed() {
    const feed = $("#feed");
    track(feed, (r, vh) => {
      const line = vh * 0.62;
      put(feed, "--fp", clamp((line - r.top) / r.height).toFixed(3));
      $$("li", feed).forEach((li) => li.classList.toggle("on", li.getBoundingClientRect().top < line));
    });
  }

  /* Étapes et principes : un filet se trace selon la position à l'écran. */
  function scrub(nodes) {
    nodes.forEach((n) => track(n, (r, vh) => put(n, "--c", clamp((vh * 0.92 - r.top) / (vh * 0.3)).toFixed(3))));
  }

  /* Contact : boutons magnétiques. */
  function initMagnets() {
    if (!finePointer) return;
    $$(".contact-links a, .copy-btn").forEach((n) => {
      n.addEventListener("pointermove", (e) => {
        const b = n.getBoundingClientRect();
        n.style.setProperty("--mx", ((e.clientX - (b.left + b.width / 2)) * 0.22).toFixed(1) + "px");
        n.style.setProperty("--my", ((e.clientY - (b.top + b.height / 2)) * 0.3).toFixed(1) + "px");
      });
      n.addEventListener("pointerleave", () => { n.style.removeProperty("--mx"); n.style.removeProperty("--my"); });
    });
  }

  /* Pied de page : le mot-symbole se resserre et se révèle en arrivant. */
  function initFooter() {
    const f = $(".site-footer");
    const w = $("#wordmark");
    if (!f || !w) return;
    track(f, (r, vh) => {
      const p = clamp((vh - r.top) / (r.height * 0.85));
      put(w, "letter-spacing", (-0.1 + 0.065 * p).toFixed(3) + "em");
      put(w, "transform", `translateY(${((1 - p) * 46).toFixed(1)}px)`);
      put(w, "opacity", (0.15 + 0.85 * p).toFixed(3));
    });
  }

  const siteHeader = $(".site-header");
  const syncHeader = () => { if (siteHeader) root.style.setProperty("--header-h", siteHeader.offsetHeight + "px"); };
  syncHeader();
  window.addEventListener("resize", syncHeader);

  if (ANIM) {
    initHeroScroll();
    initTicker();
    initReadAlong();
    initDomainFocus();
    initSkills();
    initProjects();
    initFeed();
    scrub($$(".method li, .steps li"));
    initMagnets();
    initFooter();
  }
})();

/* ==========================================================================
   v7 — Mode futur : hypercube 4D (tesseract) en WebGL, tunnel 3D, tilt 3D, HUD
   Dépend de three.js (r128, global THREE). Tout est optionnel : sans WebGL ou
   avec prefers-reduced-motion, le site reste identique à la v6.
   ========================================================================== */
(function () {
  "use strict";
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce) return;

  /* ---------- Tilt 3D (indépendant de WebGL) ---------- */
  function initTilt() {
    if (!fine) return;
    const sel = ".method li, .domain, .project, .skill-row, .steps li, .likes li, .flow li, .wip li, .levels li, .stats li, .kv > div";
    document.querySelectorAll(sel).forEach((el) => {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, over = false;
      const loop = () => {
        cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
        const a = Math.hypot(cx, cy);
        el.style.rotate = a < 0.02 ? "none" : `${(-cy).toFixed(3)} ${cx.toFixed(3)} 0 ${(a * 7).toFixed(2)}deg`;
        raf = over || a > 0.02 ? requestAnimationFrame(loop) : 0;
      };
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        over = true; if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("pointerleave", () => { tx = ty = 0; over = false; if (!raf) raf = requestAnimationFrame(loop); });
    });
    // le titre se penche vers le curseur
    const h1 = document.querySelector("h1");
    const hero = document.querySelector(".hero");
    if (h1 && hero) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        h1.style.rotate = `${(-y).toFixed(3)} ${x.toFixed(3)} 0 ${(Math.hypot(x, y) * 14).toFixed(2)}deg`;
      });
      hero.addEventListener("pointerleave", () => { h1.style.rotate = "none"; });
    }
  }

  /* ---------- Profondeur au scroll : les titres basculent dans l'espace ---------- */
  function initDepth() {
    const heads = [...document.querySelectorAll(".section > h2")];
    let queued = false;
    const run = () => {
      queued = false;
      const vh = innerHeight;
      heads.forEach((h) => {
        const r = h.getBoundingClientRect();
        const k = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / vh - 0.45) * 2)); // -1 haut … 1 bas
        h.style.rotate = `1 0 0 ${(k * 26).toFixed(1)}deg`;
        h.style.translate = `0 0 ${(-Math.abs(k) * 60).toFixed(0)}px`;
      });
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener("resize", run);
    run();
  }

  /* ---------- Scène WebGL ---------- */
  function initGL() {
    if (typeof THREE === "undefined") return;
    let renderer;
    const cv = document.createElement("canvas");
    cv.id = "gl"; cv.setAttribute("aria-hidden", "true");
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return; }
    document.body.prepend(cv);
    root.classList.add("gl");

    const small = matchMedia("(max-width: 52rem)").matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 8;

    const light = () => root.dataset.theme === "light";
    const palette = () => light()
      ? { a: [0.04, 0.48, 0.66], b: [0.42, 0.2, 0.78], c: [0.54, 0.17, 0.89], blend: THREE.NormalBlending, star: 0x4a3a8a }
      : { a: [0.49, 0.81, 1.0], b: [0.73, 0.6, 0.97], c: [0.54, 0.17, 0.89], blend: THREE.AdditiveBlending, star: 0xbfc8ff };
    let pal = palette();

    /* tesseract : 16 sommets (±1,±1,±1,±1), 32 arêtes */
    const V = [];
    for (let i = 0; i < 16; i++) V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    const E = [];
    for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) E.push([i, j]); }

    function makeCube(scale) {
      const pos = new Float32Array(E.length * 6), col = new Float32Array(E.length * 6);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: pal.blend, depthWrite: false }));
      const pp = new Float32Array(16 * 3), pc = new Float32Array(16 * 3);
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
      pg.setAttribute("color", new THREE.BufferAttribute(pc, 3));
      const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, blending: pal.blend, depthWrite: false, sizeAttenuation: true }));
      const grp = new THREE.Group(); grp.add(lines, pts);
      return { grp, lines, pts, pos, col, pp, pc, scale, p3: V.map(() => [0, 0, 0]), w: new Float32Array(16) };
    }
    const cubes = [makeCube(1.55), makeCube(0.8)];
    const hyper = new THREE.Group();
    cubes.forEach((c) => hyper.add(c.grp));
    scene.add(hyper);

    function colorAt(w) { // w∈[-1.2,1.2] → cyan → jaune → orange
      const t = Math.max(0, Math.min(1, (w + 1.2) / 2.4));
      const [A, B, C] = [pal.a, pal.b, pal.c];
      return t < 0.5 ? A.map((v, i) => v + (B[i] - v) * t * 2) : B.map((v, i) => v + (C[i] - v) * (t - 0.5) * 2);
    }


    /* ---- post-traitement : aberration chromatique, glitch, givre ---- */
    const rt = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
    const postScene = new THREE.Scene();
    const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const post = new THREE.ShaderMaterial({
      uniforms: { tex: { value: rt.texture }, uTime: { value: 0 }, uGlitch: { value: 0 }, uAb: { value: 0.0012 }, uFrost: { value: 0 }, uAdd: { value: light() ? 0 : 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: [
        "uniform sampler2D tex; uniform float uTime, uGlitch, uAb, uFrost, uAdd; varying vec2 vUv;",
        "float h(float n){ return fract(sin(n * 91.345) * 47453.5453); }",
        "float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
        "void main(){",
        "  vec2 uv = vUv;",
        "  float row = floor(uv.y * 38.0 + floor(uTime * 14.0));",
        "  float band = step(0.82, h(row)) * uGlitch;",
        "  uv.x += (h(row + 3.0) - 0.5) * 0.14 * band;",
        "  vec2 d = uv - 0.5;",
        "  float ab = uAb + uGlitch * 0.012 + length(d) * 0.004;",
        "  vec2 o = normalize(d + 1e-4) * ab;",
        "  float edge = smoothstep(0.25, 0.75, length(d) * 1.4) * uFrost;",
        "  vec2 j = (vec2(h2(uv * vec2(900.0, 500.0) + uTime), h2(uv * vec2(500.0, 900.0) - uTime)) - 0.5) * 0.03 * edge;",
        "  vec4 r = texture2D(tex, uv + o + j); vec4 g = texture2D(tex, uv + j); vec4 b = texture2D(tex, uv - o + j);",
        "  vec3 c = vec3(r.r, g.g, b.b); float a = max(max(r.a, g.a), b.a);",
        "  c += vec3(0.55, 0.75, 1.0) * edge * 0.08 * a;",
        "  float m = max(c.r, max(c.g, c.b));",
        "  a = clamp(max(a, m * uAdd), 0.0, 1.0);",
        "  gl_FragColor = vec4(c, a);",
        "}"
      ].join("\n"),
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
    });
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

    /* ---- cristaux de glace : croissance procédurale (prismes hexagonaux + pointes) ---- */
    const crystalMat = new THREE.ShaderMaterial({
      uniforms: { uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uO: { value: 0 } },
      vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform vec3 uA; uniform vec3 uB; uniform float uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); vec3 c = mix(uA, uB, f); gl_FragColor = vec4(c * (0.25 + f * 1.6), (0.10 + f * 0.75) * uO); }",
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: pal.blend,
    });
    const crystals = new THREE.Group();
    const crystalEdges = [];
    const crystalItems = [];
    (function () {
      let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const Y = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < 18; i++) {
        const dir = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
        const len = 0.9 + rnd() * 1.5, rad = 0.09 + rnd() * 0.15, tip = rad * (1.6 + rnd());
        const body = new THREE.CylinderGeometry(rad, rad * 1.08, len, 6, 1, true).toNonIndexed(); body.computeVertexNormals();
        const cap = new THREE.ConeGeometry(rad, tip, 6, 1, true).toNonIndexed(); cap.computeVertexNormals();
        const piv = new THREE.Group();
        const m1 = new THREE.Mesh(body, crystalMat); m1.position.y = 0.25 + len / 2;
        const m2 = new THREE.Mesh(cap, crystalMat); m2.position.y = 0.25 + len + tip / 2;
        const lm = new THREE.LineBasicMaterial({ color: 0x7dcfff, transparent: true, opacity: 0, blending: pal.blend, depthWrite: false });
        const e1 = new THREE.LineSegments(new THREE.EdgesGeometry(body, 20), lm); e1.position.copy(m1.position);
        const e2 = new THREE.LineSegments(new THREE.EdgesGeometry(cap, 20), lm); e2.position.copy(m2.position);
        piv.add(m1, m2, e1, e2);
        piv.quaternion.setFromUnitVectors(Y, dir);
        crystals.add(piv);
        crystalItems.push(piv); crystalEdges.push(lm);
      }
    })();
    crystals.visible = false;
    hyper.add(crystals);

    /* ---- essaim de particules : se reforme en mots (comme les liens de la section contact) ---- */
    const M = small ? 1400 : 2800;
    const swCur = new Float32Array(M * 3), swTgt = new Float32Array(M * 3), swCol = new Float32Array(M * 3);
    const swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute("position", new THREE.BufferAttribute(swCur, 3));
    swGeo.setAttribute("color", new THREE.BufferAttribute(swCol, 3));
    const swarm = new THREE.Points(swGeo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0, blending: pal.blend, depthWrite: false }));
    swarm.visible = false;
    scene.add(swarm);
    for (let i = 0; i < M; i++) { swCur[i * 3] = (Math.random() - 0.5) * 12; swCur[i * 3 + 1] = (Math.random() - 0.5) * 8; swCur[i * 3 + 2] = (Math.random() - 0.5) * 6; }
    const swCache = {};
    let swLabel = "", swMode = "vortex";
    function swVortex() {
      for (let i = 0; i < M; i++) {
        const a = (i / M) * Math.PI * 2 * 5, r = 0.8 + (i % 9) * 0.28 + Math.random() * 0.1;
        swTgt[i * 3] = Math.cos(a) * r; swTgt[i * 3 + 1] = Math.sin(a) * r * 0.55; swTgt[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      }
    }
    function swText(label) {
      if (!swCache[label]) {
        const cv2 = document.createElement("canvas"); cv2.width = 760; cv2.height = 200;
        const x = cv2.getContext("2d"); x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
        let fs = 150; x.font = `900 ${fs}px "Bricolage Grotesque", Arial Black, sans-serif`;
        while (x.measureText(label).width > 720 && fs > 40) { fs -= 8; x.font = `900 ${fs}px "Bricolage Grotesque", Arial Black, sans-serif`; }
        x.fillText(label, 380, 104);
        const d = x.getImageData(0, 0, 760, 200).data, pts = [];
        for (let py = 0; py < 200; py += 3) for (let px = 0; px < 760; px += 3) if (d[(py * 760 + px) * 4 + 3] > 128) pts.push([(px - 380) / 760 * 7, -(py - 100) / 760 * 7]);
        swCache[label] = pts;
      }
      const pts = swCache[label];
      for (let i = 0; i < M; i++) { const p = pts[(Math.random() * pts.length) | 0] || [0, 0]; swTgt[i * 3] = p[0]; swTgt[i * 3 + 1] = p[1]; swTgt[i * 3 + 2] = (Math.random() - 0.5) * 0.25; }
    }
    function swSet(label) {
      if (label === swLabel) return;
      swLabel = label;
      if (!label) { swMode = "vortex"; swVortex(); } else { swMode = "text"; swText(label); }
    }
    swSet("");
    window.__swarm = swSet;

    /* tunnel d'étoiles */
    const N = small ? 500 : 1100;
    const sp = new Float32Array(N * 3);
    const spd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 16;
      sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = Math.sin(a) * r; sp[i * 3 + 2] = -Math.random() * 90 + 10;
      spd[i] = 0.4 + Math.random() * 0.9;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.09, color: pal.star, transparent: true, opacity: 0.75, blending: pal.blend, depthWrite: false }));
    scene.add(stars);

    /* anneaux de « temps » : une 4e dimension lisible, en orbite autour de l'hypercube */
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(3.1 + i * 0.7, 0.008, 6, 160),
        new THREE.MeshBasicMaterial({ color: i === 1 ? 0xbb9af7 : 0x7dcfff, transparent: true, opacity: 0.35, blending: pal.blend, depthWrite: false }));
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      rings.push(m); hyper.add(m);
    }

    /* état */
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });
    let scrollY = scrollY0(), lastY = scrollY, vel = 0, prog = 0;
    function scrollY0() { return window.pageYOffset || 0; }
    addEventListener("scroll", () => { scrollY = window.pageYOffset; }, { passive: true });
    function resize() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      const pr = renderer.getPixelRatio(); rt.setSize(Math.max(2, Math.floor(w * pr)), Math.max(2, Math.floor(h * pr)));
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    addEventListener("resize", resize); resize();

    const mo = new MutationObserver(() => {
      pal = palette();
      cubes.forEach((c) => { c.lines.material.blending = pal.blend; c.pts.material.blending = pal.blend; c.lines.material.needsUpdate = true; c.pts.material.needsUpdate = true; });
      post.uniforms.uAdd.value = light() ? 0 : 1;
      crystalMat.blending = pal.blend; crystalMat.needsUpdate = true; swarm.material.blending = pal.blend; swarm.material.needsUpdate = true;
      crystalEdges.forEach((m) => { m.blending = pal.blend; m.needsUpdate = true; });
      stars.material.color.setHex(pal.star); stars.material.blending = pal.blend; stars.material.needsUpdate = true;
      rings.forEach((r) => { r.material.blending = pal.blend; r.material.needsUpdate = true; });
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    const hud = document.createElement("div");
    hud.className = "hud"; hud.setAttribute("aria-hidden", "true");
    document.body.appendChild(hud);

    function rot4(p, a, b, t) { const c = Math.cos(t), s = Math.sin(t); const u = p[a], v = p[b]; p[a] = u * c - v * s; p[b] = u * s + v * c; }

    let t0 = performance.now(), time = 0, hudT = 0, running = true, glow = 1;
    const SEC_IDS = ["top", "apropos", "domaines", "competences", "atelier", "projets", "activite", "faq", "contact"];
    const SEC_NAME = { top: "ACCUEIL", apropos: "A PROPOS", domaines: "DOMAINES", competences: "COMPETENCES", atelier: "ATELIER", projets: "PROJETS", activite: "ACTIVITE", faq: "FAQ", contact: "CONTACT" };
    const SEC_MODE = { top: "t", apropos: "t", domaines: "c", competences: "c", atelier: "c", projets: "c", activite: "c", faq: "c", contact: "s" };
    const HUES = [[[0.49, 0.81, 1.0], [0.73, 0.6, 0.97]], [[0.73, 0.6, 0.97], [1.0, 0.45, 0.62]], [[0.49, 0.81, 1.0], [0.9, 0.95, 1.0]]];
    let wT = 1, wC = 0, wS = 0, secId = "top", mode = "t", tr = 0, grow = 0, hueIdx = 0, frameN = 0, swT = 0;
    window.__glitch = () => { tr = 1; };
    function currentSection() {
      let id = "top";
      for (const s of SEC_IDS) { const e = document.getElementById(s); if (e && !e.hidden && e.getBoundingClientRect().top < innerHeight * 0.5) id = s; }
      if (window.pageYOffset + innerHeight >= document.documentElement.scrollHeight - 4) id = "contact";
      return id;
    }
    document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) { t0 = performance.now(); requestAnimationFrame(frame); } });

    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      prog += ((scrollY / max) - prog) * 0.08;
      vel += ((scrollY - lastY) - vel) * 0.12; lastY = scrollY;
      time += dt * (0.55 + Math.min(3.5, Math.abs(vel) * 0.06));
      mouse.sx += (mouse.x - mouse.sx) * 0.05; mouse.sy += (mouse.y - mouse.sy) * 0.05;

      // angles 4D : XW et YW tournent en continu, ZW avance avec le scroll
      const aXW = time * 0.7, aYW = time * 0.45 + prog * 9, aZW = prog * 14, aXY = time * 0.2;
      cubes.forEach((c, k) => {
        const dir = k ? -1 : 1;
        for (let i = 0; i < 16; i++) {
          const p = V[i].slice();
          rot4(p, 0, 3, aXW * dir); rot4(p, 1, 3, aYW * dir); rot4(p, 2, 3, aZW); rot4(p, 0, 1, aXY);
          const s = 1 / (2.4 - p[3]); // projection 4D → 3D (perspective sur W)
          const q = c.p3[i]; q[0] = p[0] * s * c.scale * 2.2; q[1] = p[1] * s * c.scale * 2.2; q[2] = p[2] * s * c.scale * 2.2;
          c.w[i] = p[3];
          const rgb = colorAt(p[3]);
          c.pp.set(q, i * 3); c.pc.set(rgb, i * 3);
        }
        E.forEach(([a, b], e) => {
          c.pos.set(c.p3[a], e * 6); c.pos.set(c.p3[b], e * 6 + 3);
          c.col.set(colorAt(c.w[a]), e * 6); c.col.set(colorAt(c.w[b]), e * 6 + 3);
        });
        c.lines.geometry.attributes.position.needsUpdate = true;
        c.lines.geometry.attributes.color.needsUpdate = true;
        c.pts.geometry.attributes.position.needsUpdate = true;
        c.pts.geometry.attributes.color.needsUpdate = true;
      });

      // placement : à droite dans le hero, puis dérive de part et d'autre selon la section
      const wide = innerWidth > 832;
      if ((frameN++ & 7) === 0) {
        const id = currentSection();
        if (id !== secId) {
          secId = id; tr = Math.max(tr, 0.55);
          const nm = SEC_MODE[id];
          if (nm !== mode) { mode = nm; tr = 1; grow = 0; hueIdx = (hueIdx + 1) % HUES.length; }
          if (window.__snd) window.__snd.whoosh();
        }
      }
      wT += ((mode === "t" ? 1 : mode === "s" ? 0.35 : 0) - wT) * 0.06;
      wC += ((mode === "c" ? 1 : 0) - wC) * 0.06;
      wS += ((mode === "s" ? 1 : 0) - wS) * 0.06;
      tr *= Math.exp(-dt * 3.2); grow = Math.min(1, grow + dt * 0.75);
      const sections = 5.2, s = prog * sections;
      const x = wide ? 2.6 * Math.cos(s * 1.6) * (prog < 0.02 ? 1 : 0.9) : 0;
      const y = wide ? Math.sin(s * 1.1) * 0.5 : 2.2 - Math.min(1, prog * 6) * 0.2;
      hyper.position.set(x, y, -prog * 4);
      const sc = wide ? 1 : 0.72;
      hyper.scale.setScalar(sc * (1 + Math.min(0.5, Math.abs(vel) * 0.01)));
      hyper.rotation.y = mouse.sx * 1.2 + time * 0.12;
      hyper.rotation.x = mouse.sy * 0.9 + Math.sin(time * 0.3) * 0.15;
      rings.forEach((r, i) => { r.rotation.z += dt * (0.25 + i * 0.12) * (i % 2 ? -1 : 1); r.rotation.x += dt * 0.08; });

      // lisibilité : plus discret dès qu'on quitte le hero
      const target = prog < 0.04 ? (wide ? 1 : 0.5) : (wide ? 0.55 : 0.28);
      glow += (target - glow) * 0.06;
      cubes.forEach((c) => { c.lines.material.opacity = 0.95 * glow * wT; c.pts.material.opacity = glow * wT; c.grp.visible = wT > 0.01; });
      rings.forEach((r) => (r.material.opacity = 0.35 * glow * wT));
      crystals.visible = wC > 0.01;
      if (crystals.visible) {
        const [ha, hb] = HUES[hueIdx];
        crystalMat.uniforms.uA.value.setRGB(ha[0], ha[1], ha[2]); crystalMat.uniforms.uB.value.setRGB(hb[0], hb[1], hb[2]);
        crystalMat.uniforms.uO.value = wC * (wide ? 0.95 : 0.4);
        crystalEdges.forEach((m) => { m.opacity = wC * 0.5; m.color.setRGB(hb[0], hb[1], hb[2]); });
        crystalItems.forEach((p, i) => {
          const k = Math.max(0, Math.min(1, grow * 1.6 - (i / crystalItems.length) * 0.6));
          const e = 1 - Math.pow(1 - k, 3);
          p.scale.set(0.35 + 0.65 * e, Math.max(0.001, e), 0.35 + 0.65 * e);
        });
        crystals.rotation.y += dt * 0.25; crystals.rotation.z += dt * 0.07;
      }
      // essaim (section contact)
      swarm.visible = wS > 0.01;
      if (swarm.visible) {
        swT += dt;
        if (!window.__swarmHover) { const ph = swT % 9; window.__swarm(ph > 6 ? "ITSPYDEVS" : ""); }
        swarm.material.opacity = wS * (wide ? 0.8 : 0.6);
        swarm.position.set(wide ? 2.2 : 0, wide ? 1.0 : 1.6, 0);
        swarm.scale.setScalar(wide ? 1 : 0.62);
        swarm.rotation.z += ((swMode === "vortex" ? swarm.rotation.z + dt * 0.35 : 0) - swarm.rotation.z) * (swMode === "vortex" ? 1 : 0.08);
        const arr2 = swGeo.attributes.position.array, col2 = swGeo.attributes.color.array;
        for (let i = 0; i < M; i++) {
          const i3 = i * 3; let sp = 0;
          for (let a = 0; a < 3; a++) { const dd = swTgt[i3 + a] - arr2[i3 + a]; arr2[i3 + a] += dd * 0.07; sp += Math.abs(dd); }
          arr2[i3] += Math.sin(time * 2 + i) * 0.002; arr2[i3 + 1] += Math.cos(time * 2.3 + i * 1.7) * 0.002;
          const v = Math.min(1, sp * 0.6);
          col2[i3] = 0.73 + v * 0.0 + v * (0.9 - 0.73); col2[i3 + 1] = 0.6 + v * (0.95 - 0.6); col2[i3 + 2] = 0.97 + v * 0.03;
        }
        swGeo.attributes.position.needsUpdate = true; swGeo.attributes.color.needsUpdate = true;
      }
      stars.material.opacity = 0.75 * (0.5 + 0.5 * glow);

      // tunnel : les étoiles filent vers la caméra, plus vite quand on scrolle
      const arr = sg.attributes.position.array, push = dt * (4 + Math.abs(vel) * 0.8);
      for (let i = 0; i < N; i++) {
        let z = arr[i * 3 + 2] + push * spd[i] * (vel < 0 ? -1 : 1);
        if (z > 12) z -= 100; else if (z < -90) z += 100;
        arr[i * 3 + 2] = z;
      }
      sg.attributes.position.needsUpdate = true;
      camera.position.x = mouse.sx * 1.4; camera.position.y = -mouse.sy * 1.0;
      camera.rotation.z = Math.sin(prog * Math.PI * 2) * 0.12;
      camera.lookAt(0, 0, 0);

      post.uniforms.uTime.value = time;
      post.uniforms.uGlitch.value = Math.min(1, tr * 0.9 + Math.min(0.35, Math.abs(vel) * 0.004));
      post.uniforms.uFrost.value = tr;
      post.uniforms.uAb.value = 0.0012 + Math.min(0.008, Math.abs(vel) * 0.00006);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(postScene, postCam);

      hudT += dt;
      if (hudT > 0.1) {
        hudT = 0;
        const d = (v) => String(Math.round(((v * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, "0");
        hud.textContent = `${SEC_NAME[secId]} · 4D XW ${d(aXW)}° YW ${d(aYW)}° ZW ${d(aZW)}° · ${Math.round(prog * 100)}%`;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    root.classList.add("gl-ready");
  }

  function initTyped() {
    const el = document.getElementById("typed");
    if (!el) return;
    const L = JSON.parse(el.dataset.lines);
    const txt = el.querySelector(".t");
    let i = 0, n = L[0].length, del = false;
    (function tick() {
      const s = L[i];
      n += del ? -1 : 1;
      txt.textContent = s.slice(0, n);
      let d = del ? 28 : 62;
      if (!del && n >= s.length) { del = true; d = 1500; }
      else if (del && n <= 0) { del = false; i = (i + 1) % L.length; d = 350; }
      setTimeout(tick, d);
    })();
  }
  function initStats() {
    const nums = [...document.querySelectorAll("#stats b")];
    if (!nums.length) return;
    const play = (b) => {
      const to = +b.dataset.count; const t0 = performance.now(), D = 1100;
      (function s(now) { const k = Math.min(1, (now - t0) / D); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(s); })(t0);
    };
    nums.forEach((b) => { b.textContent = b.dataset.count; });
    try {
      fetch("https://api.github.com/users/ItsPyDevs").then((r) => r.ok ? r.json() : null).then((u) => {
        if (!u) return;
        nums.forEach((b) => { const v = u[b.dataset.key]; if (typeof v === "number") b.dataset.count = v; b.textContent = b.dataset.count; });
      }).catch(() => {});
    } catch (e) {}
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { nums.forEach(play); io.disconnect(); } }), { threshold: 0.4 });
    io.observe(document.getElementById("stats"));
  }
  function initReveal() {
    if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;
    const els = document.querySelectorAll(".stats li, .likes li, .flow li, .kv > div, .levels li, .wip li, .faq details, .sub");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.animate([{ opacity: 0, translate: "0 28px" }, { opacity: 1, translate: "0 0" }], { duration: 650, easing: "cubic-bezier(0.2,0.7,0.2,1)", delay: (e.target._i || 0) * 70, fill: "backwards" });
    }), { threshold: 0.15 });
    els.forEach((el) => { const sib = [...el.parentNode.children].indexOf(el); el._i = Math.min(sib, 5); io.observe(el); });
  }

  /* ---------- Intro « système » ---------- */
  function initBoot() {
    const b = document.getElementById("boot");
    if (!b) return;
    if (!root.classList.contains("booting")) { b.remove(); return; }
    const log = document.getElementById("boot-log"), fill = document.getElementById("boot-fill"), pct = document.getElementById("boot-pct"), name = b.querySelector(".boot-name");
    const LINES = ["INITIALISATION DU NOYAU", "CHARGEMENT DU TESSERACT 4D", "CRISTALLISATION DES SECTIONS", "SYNCHRONISATION DU TERMINAL", "SYSTEME PRET"];
    const WORD = "ITSPYDEVS", CH = "▮▯01<>/\\_-+#";
    root.style.overflow = "hidden";
    let t0 = performance.now(), D = 2400, done = false;
    function end() {
      if (done) return; done = true;
      b.classList.add("out");
      if (window.__glitch) window.__glitch();
      try { sessionStorage.setItem("booted", "1"); } catch (e) {}
      setTimeout(() => { root.classList.remove("booting"); root.style.overflow = ""; b.remove(); }, 780);
    }
    function step(now) {
      if (done) return;
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 2.2);
      pct.textContent = String(Math.round(e * 100)).padStart(3, "0");
      fill.style.transform = `scaleX(${e})`;
      const n = Math.min(LINES.length, 1 + Math.floor(e * LINES.length));
      log.textContent = LINES.slice(0, n).map((l, i) => (i === n - 1 && p < 1 ? "> " + l + " …" : "✓ " + l)).join("\n");
      const k = Math.floor(e * WORD.length * 1.15);
      name.textContent = WORD.split("").map((c, i) => (i < k ? c : CH[(Math.random() * CH.length) | 0])).join("");
      if (p < 1) requestAnimationFrame(step); else setTimeout(end, 350);
    }
    requestAnimationFrame(step);
    b.addEventListener("click", () => { D = 1; t0 = -1e9; });
    addEventListener("keydown", (e) => { if (!done && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) { D = 1; t0 = -1e9; } });
    setTimeout(end, 6000);
  }

  /* ---------- Curseur à anneau ---------- */
  function initCursor() {
    if (!fine) return;
    const ring = document.createElement("div"), dot = document.createElement("div");
    ring.className = "cur-ring"; dot.className = "cur-dot";
    ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    document.body.append(ring, dot);
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; ring.style.opacity = dot.style.opacity = "1"; rx = x; ry = y; }
      dot.style.transform = `translate(${x}px, ${y}px)`;
      ring.classList.toggle("hot", !!e.target.closest && !!e.target.closest("a, button, summary, input, [role=tab]"));
    }, { passive: true });
    document.addEventListener("pointerleave", () => { ring.style.opacity = dot.style.opacity = "0"; shown = false; });
    (function loop() { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(loop); })();
  }

  /* ---------- Son (synthétisé, désactivé par défaut) ---------- */
  function initSound() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    let ctx = null, on = false;
    try { on = localStorage.getItem("snd") === "1"; } catch (e) {}
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "icon-btn"; btn.id = "snd";
    btn.setAttribute("aria-label", "Activer ou couper le son"); btn.textContent = "♪";
    const sync = () => { btn.setAttribute("aria-pressed", String(on)); btn.classList.toggle("off", !on); };
    sync();
    const slot = document.querySelector(".nav-actions");
    if (slot) slot.prepend(btn);
    const ensure = () => { if (!ctx) ctx = new AC(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
    function tone(f1, f2, dur, vol, type) {
      if (!on) return; const c = ensure(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = type || "sine"; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    window.__snd = {
      tick: () => tone(1200, 900, 0.05, 0.025),
      click: () => tone(300, 90, 0.14, 0.05, "square"),
      whoosh: () => {
        if (!on) return; const c = ensure(), n = c.sampleRate * 0.5, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
        s.buffer = buf; f.type = "bandpass"; f.Q.value = 2.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.45);
        g.gain.value = 0.05; s.connect(f).connect(g).connect(c.destination); s.start(t);
      },
    };
    btn.addEventListener("click", () => {
      on = !on; try { localStorage.setItem("snd", on ? "1" : "0"); } catch (e) {}
      sync(); if (on) { ensure(); window.__snd.click(); }
    });
    document.addEventListener("pointerover", (e) => { if (e.target.closest && e.target.closest("a, button, summary")) window.__snd.tick(); });
    document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("a, button, summary") && e.target !== btn) window.__snd.click(); });
  }

  /* ---------- Texte qui se « décode » au survol ---------- */
  function initHoverScramble() {
    const CH = "▮▯01<>/\\_-+#";
    document.querySelectorAll(".nav-links a, .btn, .contact-links a, .foot-links a").forEach((el) => {
      if (el.children.length || el.childNodes.length !== 1) return;
      const orig = el.textContent; let t = 0;
      el.addEventListener("pointerenter", () => {
        cancelAnimationFrame(t); const t0 = performance.now();
        (function f(now) {
          const k = Math.min(1, (now - t0) / 380), n = Math.floor(k * orig.length);
          el.textContent = orig.split("").map((c, i) => (c === " " || i < n ? c : CH[(Math.random() * CH.length) | 0])).join("");
          if (k < 1) t = requestAnimationFrame(f); else el.textContent = orig;
        })(t0);
      });
    });
  }

  /* ---------- Survol des liens de contact : l'essaim écrit le mot ---------- */
  function initSwarmLinks() {
    const map = [["a[href*='discord']", "DISCORD"], ["a[href*='github.com/ItsPyDevs']", "GITHUB"], ["#copy-discord", "COPIER"]];
    const sw = () => window.__swarm;
    map.forEach(([sel, word]) => document.querySelectorAll("#contact " + sel).forEach((el) => {
      const on = () => { if (sw()) { const g = document.querySelector("#gl"); sw()(word); } window.__swarmHover = true; };
      const off = () => { window.__swarmHover = false; if (sw()) sw()(""); };
      el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
      el.addEventListener("focus", on); el.addEventListener("blur", off);
    }));
  }

  function boot() { initBoot(); initCursor(); initSound(); initHoverScramble(); initSwarmLinks(); initStats(); initReveal(); initTyped(); initTilt(); initDepth(); initGL(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
