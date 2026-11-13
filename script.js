(function () {
  "use strict";

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  const CONFIG = {
    github: "ItsPyDevs",
    discord: "https://discord.com/users/1211004235857137688",
  };
  const THEMES = [
    ["violet", "Violet"],
    ["cyan", "Cyan"],
    ["vert", "Vert"],
    ["ambre", "Ambre"],
    ["rose", "Rose"],
  ];

  const store = {
    get(k) {
      try {
        return localStorage.getItem("ipd-" + k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("ipd-" + k, v);
      } catch (e) {}
    },
  };

  if (getComputedStyle(root).getPropertyValue("--css-end").trim() !== "1") {
    const bn = document.createElement("div");
    bn.setAttribute("role", "alert");
    bn.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;z-index:999;padding:.7rem 1rem;background:#f7768e;color:#16161e;font:600 13px/1.4 system-ui,sans-serif;text-align:center";
    bn.textContent = "style.css est incomplet ou ancien. Remplace-le par la dernière version, puis recharge sans cache.";
    document.body.appendChild(bn);
    root.classList.add("css-bad");
  }

  const panels = $$(".panel"),
    N = panels.length;
  let fx = store.get("fx");
  const fxChosen = fx === "max" || fx === "eco" || fx === "flat";
  if (!fxChosen) fx = "max";
  let accent = store.get("accent");
  if (!THEMES.some((t) => t[0] === accent)) accent = "violet";
  root.setAttribute("data-accent", accent);

  const app = { mode3d: false, go: null, step: null, cur: null, tour: null, applyFx: null, applyAccent: null, fun: [] };

  const toastBox = $("#toasts");
  function toast(msg, action) {
    if (!toastBox) return;
    const t = document.createElement("div"),
      s = document.createElement("span");
    t.className = "toast";
    s.textContent = msg;
    t.appendChild(s);
    let timer = 0;
    const kill = () => {
      clearTimeout(timer);
      t.classList.remove("in");
      setTimeout(() => t.remove(), 320);
    };
    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = action.label;
      b.addEventListener("click", () => {
        kill();
        action.run();
      });
      t.appendChild(b);
    }
    toastBox.appendChild(t);
    while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("in")));
    timer = setTimeout(kill, action ? 8000 : 2600);
  }

  function copyText(text) {
    return new Promise((ok, ko) => {
      const fallback = () => {
        const t = document.createElement("textarea");
        t.value = text;
        t.setAttribute("readonly", "");
        t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(t);
        t.select();
        let done = false;
        try {
          done = document.execCommand("copy");
        } catch (e) {}
        t.remove();
        if (done) ok();
        else ko();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
      else fallback();
    });
  }

  function ago(iso) {
    const d = (Date.now() - new Date(iso).getTime()) / 864e5;
    if (!isFinite(d) || d < 0) return "";
    if (d < 1) return "aujourd'hui";
    if (d < 2) return "hier";
    if (d < 30) return "il y a " + Math.floor(d) + " j";
    if (d < 365) return "il y a " + Math.floor(d / 30) + " mois";
    return "il y a " + Math.floor(d / 365) + (d >= 730 ? " ans" : " an");
  }

  function cached(key, url, ttl) {
    try {
      const c = JSON.parse(sessionStorage.getItem(key));
      if (c && Date.now() - c.t < ttl) return Promise.resolve(c.d);
    } catch (e) {}
    return fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        try {
          sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d }));
        } catch (e) {}
        return d;
      });
  }

  let repoAll = [];
  function loadRepos() {
    const ul = $("#repos");
    cached("gh3d-repos", "https://api.github.com/users/" + CONFIG.github + "/repos?per_page=100&sort=pushed", 600000)
      .then((all) => {
        repoAll = all
          .filter((r) => !r.fork && r.name !== CONFIG.github && r.html_url)
          .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
        const all2 = all.filter((r) => !r.fork);
        const metaOf = (r) =>
          [r.language, r.stargazers_count ? r.stargazers_count + " ★" : "", ago(r.pushed_at)].filter(Boolean).join(" · ");
        renderLangs(all2);
        const featured = {};
        $$(".proj[data-repo]").forEach((art) => {
          const r = all2.find((x) => x.name === art.dataset.repo);
          if (!r) return;
          featured[r.name] = 1;
          const m = $(".meta", art);
          if (m) m.textContent = metaOf(r);
        });
        if (!ul || !repoAll.length) return;
        ul.textContent = "";
        const rest = repoAll.filter((r) => !featured[r.name]);
        rest.slice(0, 8).forEach((r) => {
          const li = document.createElement("li"),
            a = document.createElement("a"),
            b = document.createElement("b");
          a.href = r.html_url;
          b.textContent = r.name;
          a.appendChild(b);
          if (r.description) {
            const p = document.createElement("p");
            p.textContent = r.description;
            a.appendChild(p);
          }
          const meta = metaOf(r);
          if (meta) {
            const s = document.createElement("small");
            s.textContent = meta;
            a.appendChild(s);
          }
          li.appendChild(a);
          ul.appendChild(li);
        });
        const cnt = $("#repo-count");
        if (cnt) cnt.textContent = "(" + rest.length + ")";
      })
      .catch(() => {});
  }

  const LANG_COL = {
    Python: "#3572A5",
    Rust: "#dea584",
    JavaScript: "#f1e05a",
    Java: "#b07219",
    "C++": "#f34b7d",
    "C#": "#178600",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Markdown: "#8a8fb5",
    Shell: "#89e051",
  };
  function renderLangs(repos) {
    const bar = $("#langbar"),
      ul = $("#langs");
    if (!bar || !ul) return;
    const n = {};
    repos.forEach((r) => {
      if (r.language && r.language !== "Markdown") n[r.language] = (n[r.language] || 0) + 1;
    });
    const rows = Object.entries(n).sort((a, b) => b[1] - a[1]),
      tot = rows.reduce((s, r) => s + r[1], 0);
    if (!tot) return;
    bar.textContent = "";
    ul.textContent = "";
    rows.forEach(([l, c], i) => {
      const col = LANG_COL[l] || ["#bb9af7", "#7dcfff", "#9ece6a", "#e0af68", "#f7768e"][i % 5];
      const seg = document.createElement("i");
      seg.style.cssText = `flex:${c};background:${col}`;
      seg.title = l;
      bar.appendChild(seg);
      const li = document.createElement("li"),
        dot = document.createElement("span"),
        b = document.createElement("b");
      dot.style.background = col;
      b.textContent = l;
      li.append(
        dot,
        b,
        document.createTextNode(" " + Math.round((c / tot) * 100) + " % · " + c + (c > 1 ? " dépôts" : " dépôt")),
      );
      ul.appendChild(li);
    });
  }
  function loadFeed() {
    const ul = $("#feed");
    if (!ul) return;
    const fail = () => {
      ul.textContent = "";
      const li = document.createElement("li");
      li.textContent = "Activité indisponible pour le moment.";
      ul.appendChild(li);
    };
    cached("ipd-events", "https://api.github.com/users/" + CONFIG.github + "/events/public?per_page=30", 300000)
      .then((ev) => {
        const out = [];
        (ev || []).forEach((e) => {
          const repo = ((e.repo && e.repo.name) || "").replace(CONFIG.github + "/", "");
          if (e.type === "PushEvent" && e.payload && e.payload.commits && e.payload.commits.length)
            out.push({
              repo,
              t: e.payload.commits[e.payload.commits.length - 1].message.split("\n")[0],
              k: "commit",
              at: e.created_at,
            });
          else if (e.type === "CreateEvent" && e.payload && e.payload.ref_type === "repository")
            out.push({ repo, t: "Nouveau dépôt", k: "création", at: e.created_at });
          else if (e.type === "ReleaseEvent")
            out.push({ repo, t: "Release " + ((e.payload.release || {}).tag_name || ""), k: "release", at: e.created_at });
        });
        if (!out.length) return fail();
        ul.textContent = "";
        out.slice(0, 6).forEach((o) => {
          const li = document.createElement("li"),
            k = document.createElement("span"),
            a = document.createElement("a"),
            t = document.createElement("p"),
            s = document.createElement("small");
          k.textContent = o.k;
          a.href = "https://github.com/" + CONFIG.github + "/" + o.repo;
          a.textContent = o.repo;
          t.textContent = o.t;
          s.textContent = ago(o.at);
          li.append(k, a, t, s);
          ul.appendChild(li);
        });
      })
      .catch(fail);
  }

  function loadStats() {
    const nodes = $$("#stats b[data-key]");
    if (!nodes.length) return;
    cached("gh3d-user", "https://api.github.com/users/" + CONFIG.github, 600000)
      .then((u) =>
        nodes.forEach((n) => {
          const v = u[n.dataset.key];
          if (typeof v !== "number") return;
          n.dataset.val = String(v);
          if (!n.dataset.wait) n.textContent = v;
        }),
      )
      .catch(() => {});
  }

  function initCopy() {
    const b = $("#copy");
    if (!b) return;
    const label = b.textContent;
    b.addEventListener("click", () => {
      const done = (t) => {
        b.textContent = t;
        setTimeout(() => (b.textContent = label), 2000);
      };
      copyText(CONFIG.discord).then(
        () => done("Lien copié"),
        () => done("Copie impossible"),
      );
    });
  }

  loadRepos();
  loadFeed();
  loadStats();
  initCopy();

  const shareUrl = (i) => location.href.split("#")[0] + "#" + panels[i].id;

  function initPalette() {
    const pal = $("#pal"),
      input = $("#pal-q"),
      list = $("#pal-list"),
      btn = $("#open-pal");
    const none = { open() {}, isOpen: () => false };
    if (!pal || !input || !list || typeof pal.showModal !== "function") return none;
    const box = $(".pal-box", pal);
    let all = [],
      shown = [],
      act = 0;
    const norm = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();

    if (btn) {
      btn.hidden = false;
      const kb = $("kbd", btn);
      if (kb) kb.textContent = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? "⌘ K" : "Ctrl K";
      btn.addEventListener("click", () => open());
    }

    function commands() {
      const c = [],
        cur = app.cur ? app.cur() : 0;
      panels.forEach((p, i) => {
        const h = $("h1, h2", p);
        c.push({
          g: "Aller à",
          ic: "›",
          t: p.dataset.title || p.id,
          d: h ? h.textContent : "",
          k: String(i + 1),
          key: i < 9 ? String(i + 1) : "",
          on: i === cur,
          run: () => app.go(i),
        });
      });
      const add = (t, d, k, run, ic) => c.push({ g: "Actions", ic: ic || "▸", t, d, k, run });
      add("Copier le lien Discord", "pour m'écrire", "discord copier lien contact", () =>
        copyText(CONFIG.discord).then(
          () => toast("Lien Discord copié"),
          () => toast("Copie impossible"),
        ),
      );
      add(
        "Ouvrir Discord",
        "mon profil ↗",
        "discord message ecrire contact",
        () => window.open(CONFIG.discord, "_blank", "noopener"),
        "↗",
      );
      add(
        "Ouvrir mon GitHub",
        "github.com/" + CONFIG.github + " ↗",
        "github profil code depots",
        () => window.open("https://github.com/" + CONFIG.github, "_blank", "noopener"),
        "↗",
      );
      add("Copier le lien de cette section", "#" + panels[cur].id, "partager url ancre lien", () =>
        copyText(shareUrl(cur)).then(
          () => toast("Lien de la section copié"),
          () => toast("Copie impossible"),
        ),
      );
      if (navigator.share)
        add("Partager le site", "envoyer à quelqu'un", "partager envoyer", () =>
          navigator.share({ title: document.title, url: shareUrl(cur) }).catch(() => {}),
        );
      if (app.mode3d && app.tour)
        add(
          app.tour.active() ? "Arrêter la visite automatique" : "Lancer la visite automatique",
          "défile toutes les sections",
          "visite tour auto demo presentation",
          () => (app.tour.active() ? app.tour.stop() : app.tour.start()),
          "▶",
        );
      add("Imprimer / enregistrer en PDF", "mise en page propre", "imprimer pdf cv export", () => window.print(), "⎙");
      if (!reduce) {
        [
          ["max", "Qualité maximale", "3D, WebGL et tous les effets"],
          ["eco", "Mode éco", "3D allégée, sans WebGL"],
          ["flat", "Version simple", "page à plat, sans animation"],
        ].forEach((m) =>
          c.push({
            g: "Affichage",
            ic: "◐",
            t: m[1],
            d: m[2],
            k: "qualite performance fluide lent batterie " + m[0],
            on: fx === m[0],
            run: () => setFx(m[0]),
          }),
        );
      }
      THEMES.forEach((th) =>
        c.push({
          g: "Affichage",
          ic: "●",
          t: "Accent " + th[1],
          d: "couleur du thème",
          k: "couleur theme accent " + th[0],
          on: accent === th[0],
          run: () => setAccent(th[0]),
        }),
      );
      app.fun.forEach((f) => c.push({ g: "Délires", ic: f[4], t: f[0], d: f[1], k: f[2], run: f[3] }));
      repoAll.forEach((r, i) =>
        c.push({
          g: "Projets",
          ic: "↗",
          t: r.name,
          d: [r.language, r.description].filter(Boolean).join(" · "),
          k: "projet depot github repo",
          top: i < 5,
          run: () => window.open(r.html_url, "_blank", "noopener"),
        }),
      );
      return c;
    }

    function score(c, q) {
      if (!q.length) return 1;
      const t = norm(c.t),
        h = c.h || (c.h = norm(c.t + " " + c.d + " " + c.k + " " + c.g));
      let s = 0;
      for (const w of q) {
        if (h.indexOf(w) < 0) return 0;
        s += t.indexOf(w) === 0 ? 3 : t.indexOf(w) > 0 ? 2 : 1;
      }
      return s;
    }

    function render() {
      const q = norm(input.value).split(/\s+/).filter(Boolean);
      let rows = all.map((c) => ({ c, s: score(c, q) })).filter((r) => r.s > 0);
      if (q.length) rows.sort((a, b) => b.s - a.s);
      else rows = rows.filter((r) => r.c.g !== "Projets" || r.c.top);
      shown = rows.map((r) => r.c);
      list.textContent = "";
      if (!shown.length) {
        const li = document.createElement("li");
        li.className = "pal-empty";
        li.setAttribute("role", "presentation");
        li.textContent = "Aucun résultat";
        list.appendChild(li);
        setAct(0);
        return;
      }
      let lastG = "";
      shown.forEach((c, i) => {
        if (!q.length && c.g !== lastG) {
          lastG = c.g;
          const h = document.createElement("li");
          h.className = "pal-h";
          h.setAttribute("role", "presentation");
          h.textContent = c.g;
          list.appendChild(h);
        }
        const li = document.createElement("li"),
          g = document.createElement("span"),
          t = document.createElement("span"),
          d = document.createElement("span");
        li.className = "pal-o" + (c.on ? " on" : "");
        li.id = "pal-o" + i;
        li.dataset.i = i;
        li.setAttribute("role", "option");
        g.className = "g";
        g.textContent = c.ic;
        g.setAttribute("aria-hidden", "true");
        t.className = "t";
        t.textContent = c.t;
        d.className = "d";
        d.textContent = q.length ? [c.g, c.d].filter(Boolean).join(" · ") : c.d || "";
        li.append(g, t, d);
        if (c.key) {
          const k = document.createElement("span");
          k.className = "k";
          k.textContent = c.key;
          k.setAttribute("aria-hidden", "true");
          li.appendChild(k);
        }
        list.appendChild(li);
      });
      setAct(act);
    }

    function setAct(i) {
      act = shown.length ? (i + shown.length) % shown.length : 0;
      let cur = null;
      $$(".pal-o", list).forEach((li) => {
        const on = +li.dataset.i === act;
        li.setAttribute("aria-selected", String(on));
        if (on) cur = li;
      });
      input.setAttribute("aria-activedescendant", cur ? cur.id : "");
      if (!cur) return;
      if (act === 0) list.scrollTop = 0;
      else if (cur.offsetTop < list.scrollTop) list.scrollTop = cur.offsetTop - 6;
      else if (cur.offsetTop + cur.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = cur.offsetTop + cur.offsetHeight - list.clientHeight + 6;
    }

    function open(prefill) {
      if (pal.open) return;
      if (app.tour) app.tour.stop();
      all = commands();
      input.value = prefill || "";
      act = 0;
      render();
      root.classList.add("pal-open");
      pal.showModal();
      list.scrollTop = 0;
      if (coarse) box.focus({ preventScroll: true });
      else {
        input.focus();
        input.select();
      }
    }
    function exec(c) {
      if (!c) return;
      pal.close();
      c.run();
    }

    input.addEventListener("input", () => {
      act = 0;
      render();
    });
    pal.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAct(act + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAct(act - 1);
      } else if (e.key === "Enter" && e.target === input) {
        e.preventDefault();
        exec(shown[act]);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        pal.close();
      }
    });
    list.addEventListener("mousemove", (e) => {
      const li = e.target.closest(".pal-o");
      if (li && +li.dataset.i !== act) setAct(+li.dataset.i);
    });
    list.addEventListener("click", (e) => {
      const li = e.target.closest(".pal-o");
      if (li) exec(shown[+li.dataset.i]);
    });
    $("#pal-close").addEventListener("click", () => pal.close());
    pal.addEventListener("click", (e) => {
      if (e.target === pal) pal.close();
    });
    pal.addEventListener("close", () => root.classList.remove("pal-open"));
    return { open, isOpen: () => pal.open };
  }
  const palette = initPalette();

  function setFx(mode, opts) {
    if (mode === fx) return;
    const prev = fx;
    fx = mode;
    store.set("fx", mode);
    if (mode === "flat" || prev === "flat") {
      location.reload();
      return;
    }
    root.classList.toggle("eco", mode === "eco");
    if (app.applyFx) app.applyFx(mode);
    if (!(opts && opts.auto)) toast(mode === "eco" ? "Mode éco activé" : "Qualité maximale activée");
  }
  function setAccent(id) {
    accent = id;
    root.setAttribute("data-accent", id);
    store.set("accent", id);
    if (app.applyAccent) app.applyAccent();
    const th = THEMES.filter((t) => t[0] === id)[0];
    toast("Accent " + (th ? th[1] : id));
  }

  function flatCur() {
    let b = 0;
    panels.forEach((p, i) => {
      if (p.getBoundingClientRect().top < innerHeight * 0.45) b = i;
    });
    return b;
  }
  function flatGo(i) {
    i = clamp(i, 0, N - 1);
    panels[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    try {
      history.replaceState(null, "", "#" + panels[i].id);
    } catch (e) {}
  }
  app.go = flatGo;
  app.cur = flatCur;
  app.step = (d) => flatGo(flatCur() + d);

  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-go]");
    if (!t) return;
    e.preventDefault();
    app.go(+t.dataset.go);
  });

  addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || palette.isOpen()) return;
    const typing = e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
    const k = e.key || "";
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k.toLowerCase() === "k") {
      e.preventDefault();
      palette.open();
      return;
    }
    if (e.ctrlKey || e.metaKey || typing) return;
    if (k === "/" || k === "?") {
      e.preventDefault();
      palette.open();
      return;
    }
    const m = /^Digit([1-9])$/.exec(e.code || "") || (/^[1-9]$/.test(k) && /^Numpad([1-9])$/.exec(e.code || ""));
    if (m && +m[1] <= N) {
      e.preventDefault();
      app.go(+m[1] - 1);
    } else if (k === "ArrowRight") {
      e.preventDefault();
      app.step(1);
    } else if (k === "ArrowLeft") {
      e.preventDefault();
      app.step(-1);
    }
  });

  let reopened = [];
  addEventListener("beforeprint", () => {
    reopened = $$("details:not([open])");
    reopened.forEach((d) => (d.open = true));
    $$("[data-val]").forEach((b) => {
      b.textContent = b.dataset.val;
      delete b.dataset.wait;
    });
  });
  addEventListener("afterprint", () => {
    reopened.forEach((d) => (d.open = false));
    reopened = [];
  });

  (function fun() {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    let theme = store.get("theme") === "light" ? "light" : "dark",
      sound = store.get("sound") === "1",
      pet = false,
      clicks = 0;
    const applyTheme = () => {
      if (theme === "light") root.dataset.theme = "light";
      else delete root.dataset.theme;
    };
    applyTheme();
    let ac = null;
    const blip = (f = 660, d = 0.06) => {
      if (!sound) return;
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        const o = ac.createOscillator(),
          g = ac.createGain();
        o.type = "square";
        o.frequency.value = f;
        g.gain.value = 0.03;
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
        o.connect(g);
        g.connect(ac.destination);
        o.start();
        o.stop(ac.currentTime + d);
      } catch (e) {}
    };
    addEventListener(
      "click",
      (e) => {
        if (e.target.closest && e.target.closest("button, a, summary")) blip(520 + Math.random() * 400);
      },
      true,
    );
    const excuses = [
      "Ça marche sur ma machine.",
      "C'est pas un bug, c'est une fonctionnalité.",
      "Le cache.",
      "C'est le DNS. C'est toujours le DNS.",
      "Je l'ai testé hier, ça marchait.",
      "C'est Python 3.12 qui a changé.",
      "Le borrow checker m'en veut.",
      "Il manque un point-virgule, ça se voit pas.",
      "Quelqu'un a touché à mon code (c'était moi).",
    ];
    const blagues = [
      "Pourquoi les devs confondent Halloween et Noël ? Parce que Oct 31 = Dec 25.",
      "Un SQL entre dans un bar, voit deux tables et demande : « je peux vous JOINdre ? »",
      "Il y a 10 types de gens : ceux qui comprennent le binaire et les autres.",
      "Rust : le compilateur te hurle dessus pour ton bien.",
      'git commit -m "fix" — le message que personne n\'a jamais relu.',
    ];
    const compl = [
      "Ton code est propre. Enfin, celui que tu as commité.",
      "Tu as ouvert ce menu, donc tu as du goût.",
      "Respect pour le scroll jusqu'ici.",
      "Tu es probablement le meilleur visiteur d'aujourd'hui.",
    ];
    const ball = [
      "Oui, carrément.",
      "Non.",
      "Demande à ton compilateur.",
      "Peut-être, mais pas avant vendredi.",
      "Les signes disent oui.",
      "Très improbable.",
      "Reboote et réessaie.",
    ];
    function burst() {
      const em = ["🎉", "✨", "🐍", "🦀", "💜", "🔥"];
      for (let i = 0; i < 36; i++) {
        const e = document.createElement("span");
        e.textContent = pick(em);
        e.className = "confetti";
        e.style.cssText = `left:${Math.random() * 100}vw;font-size:${14 + Math.random() * 22}px;animation-duration:${1.6 + Math.random() * 1.8}s;animation-delay:${Math.random() * 0.4}s`;
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 4200);
      }
    }
    function bsod() {
      if ($(".bsod")) return;
      const d = document.createElement("div");
      d.className = "bsod";
      d.innerHTML =
        ":(<br><br>Ton site a rencontré un problème et doit redémarrer.<br>Code d'arrêt : <b>ITSPYDEVS_TROP_STYLE</b><br><br>0 % terminé (blague)";
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 3200);
    }
    let petEl = null,
      px = 0,
      py = 0,
      mx = 0,
      my = 0,
      praf = 0;
    addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true },
    );
    function petLoop() {
      px += (mx - px) * 0.08;
      py += (my - py) * 0.08;
      if (petEl) petEl.style.transform = `translate(${px + 14}px, ${py + 14}px) scaleX(${mx < px ? -1 : 1})`;
      praf = requestAnimationFrame(petLoop);
    }
    function togglePet() {
      pet = !pet;
      if (pet) {
        petEl = document.createElement("div");
        petEl.className = "pet";
        petEl.textContent = "🐍";
        document.body.appendChild(petEl);
        petLoop();
      } else {
        cancelAnimationFrame(praf);
        if (petEl) petEl.remove();
        petEl = null;
      }
      toast(pet ? "Un serpent te suit" : "Le serpent est parti");
    }
    const title0 = document.title;
    document.addEventListener("visibilitychange", () => {
      document.title = document.hidden ? pick(["Reviens 🥺", "Tu m'abandonnes ?", "🐍 …tu es là ?"]) : title0;
    });
    const FUN = [
      [
        "Thème clair / sombre",
        "bascule le mode (approximatif)",
        "theme clair sombre light dark mode blanc",
        () => {
          theme = theme === "light" ? "dark" : "light";
          store.set("theme", theme);
          applyTheme();
          toast(theme === "light" ? "Mode clair (tes yeux ont été prévenus)" : "Mode sombre");
        },
        "☀",
      ],
      ["Pile ou face", "décide à ma place", "pile face piece hasard", () => toast(Math.random() < 0.5 ? "Pile" : "Face"), "◎"],
      [
        "Lancer un dé (D20)",
        "1 à 20",
        "de d20 hasard jeu",
        () => {
          const n = 1 + Math.floor(Math.random() * 20);
          toast("D20 → " + n + (n === 20 ? " ! Critique" : n === 1 ? " … échec critique" : ""));
        },
        "⚄",
      ],
      [
        "Boule magique",
        "pose une question dans ta tête",
        "boule 8 magique question hasard",
        () => toast("🎱 " + pick(ball)),
        "🎱",
      ],
      ["Excuse de dev", "à ressortir en réunion", "excuse bug dev hasard", () => toast(pick(excuses)), "🐛"],
      ["Blague de dev", "niveau : fatigué", "blague humour drole dev", () => toast(pick(blagues)), "😅"],
      ["Me complimenter", "j'en avais besoin", "compliment gentil motivation", () => toast(pick(compl)), "💜"],
      ["Confettis", "pour rien", "confettis fete celebration party", burst, "🎉"],
      ["Ne pas cliquer", "vraiment", "ne pas cliquer bsod ecran bleu crash", bsod, "⚠"],
      [
        "Secouer la page",
        "tremblement de terre",
        "secouer tremblement shake",
        () => {
          root.classList.add("shake");
          setTimeout(() => root.classList.remove("shake"), 700);
        },
        "≋",
      ],
      ["Compteur de clics inutile", "+1", "clic compteur clicker inutile", () => toast("Clics inutiles : " + ++clicks), "＋"],
      [
        "Sons 8 bits : " + (sound ? "oui" : "non"),
        "bips sur chaque clic",
        "son sons bip 8bit audio muet",
        () => {
          sound = !sound;
          store.set("sound", sound ? "1" : "0");
          toast(sound ? "Sons activés" : "Sons coupés");
          blip(880, 0.1);
        },
        "♪",
      ],
      ["Compagnon serpent", "suit ta souris", "serpent compagnon pet curseur souris", togglePet, "🐍"],
      [
        "Temps perdu ici",
        "chrono honteux",
        "temps perdu chrono minutes duree",
        () => {
          const u = Math.round(performance.now() / 1000);
          toast("Tu es ici depuis " + Math.floor(u / 60) + " min " + (u % 60) + " s");
        },
        "⏱",
      ],
    ];
    app.fun = FUN;
  })();

  const progress = $("#progress i");
  if (reduce || fx === "flat" || !(window.CSS && CSS.supports && CSS.supports("transform-style", "preserve-3d"))) {
    if (progress) {
      const upd = () => {
        const m = root.scrollHeight - innerHeight;
        progress.style.transform = "scaleX(" + (m > 0 ? clamp(scrollY / m, 0, 1) : 0).toFixed(4) + ")";
      };
      addEventListener("scroll", upd, { passive: true });
      addEventListener("resize", upd);
      upd();
    }
    return;
  }

  const P = 1200;
  const GAP = 1500;
  const DWELL = 80;
  const SEG = 1.6;
  const U = 100;

  const scene = $("#scene"),
    spacer = $("#spacer"),
    hud = $("#hud"),
    dotsEl = $("#dots");
  const pager = $("#pager"),
    nextBtn = $("#next"),
    prevBtn = $("#prev"),
    warp = $("#warp");
  const nextLabel = $(".next-label", nextBtn);
  const items = panels.map((el, i) => ({
    el,
    card: $(".card", el),
    id: el.id,
    title: el.dataset.title || el.id,
    side: +el.dataset.side || 0,
    x: 0,
    z: -i * GAP,
    ry: 0,
    q: -1,
    tilt: false,
    shown: false,
    base: "",
    tfm: "",
    w: 800,
    h: 600,
  }));
  const world = $("#world");
  let W = innerWidth,
    H = innerHeight,
    wide = W >= 900,
    range = 1;
  let target = 0,
    ps = 0;
  let eco = fx === "eco";
  const mouse = { x: 0, y: 0, sx: 0, sy: 0, px: 0, py: 0, moved: false };

  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.go = i;
    b.setAttribute("aria-label", it.title);
    dotsEl.appendChild(b);
  });
  const navLinks = $$("#menu a");
  const dotBtns = $$("button", dotsEl);

  const E0 = 0.12,
    EW = 0.76;
  const ease = (t) => smooth((t - E0) / EW);
  let lat = 1,
    vert = 1;
  const TAU = Math.PI * 2;
  const MOVES = [
    { name: "Warp", fx: 0.55, pose: (e, b) => ({ k: 1 - 0.52 * b }) },
    { name: "Bascule", fx: 0.3, pose: (e, b) => ({ roll: 16 * Math.sin(e * TAU), x: 160 * lat * b }) },
    { name: "Orbite", fx: 0.2, pose: (e, b) => ({ x: 680 * lat * b, yaw: -36 * b }) },
    { name: "Grue", fx: 0.2, pose: (e, b) => ({ y: -820 * vert * b, pitch: -30 * b }) },
    {
      name: "Hélice",
      fx: 0.3,
      pose: (e) => {
        const th = e * TAU,
          s = Math.sin(th);
        return { x: 380 * lat * s, y: -300 * vert * (1 - Math.cos(th)), roll: -22 * s, yaw: -12 * s };
      },
    },
    { name: "Vertigo", fx: 0.1, pose: (e, b) => ({ k: 1 + 1.7 * b }) },
    { name: "Fouet", fx: 0.4, pose: (e) => ({ yaw: 48 * Math.sin(e * TAU), roll: -6 * Math.sin(e * TAU) }) },
  ];
  function camAt(f) {
    f = clamp(f, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(f)),
      e = ease(f - i);
    const a = items[i],
      b = items[i + 1],
      m = MOVES[i % MOVES.length];
    const bell = Math.sin(e * Math.PI),
      p = reduce ? {} : m.pose(e, bell);
    return {
      x: (a.x + (b.x - a.x) * e) * 0.85 + (p.x || 0),
      y: bell * -26 + (p.y || 0),
      z: a.z + (b.z - a.z) * e + DWELL,
      roll: p.roll || 0,
      yaw: p.yaw || 0,
      pitch: p.pitch || 0,
      k: p.k || 1,
      move: bell > 0.12 ? m.name : "",
      fx: reduce ? 0 : m.fx * bell,
    };
  }

  const R2 = (v) => v.toFixed(2);
  const pv = (it, ox, oy, t) => {
    const px = (ox * it.w) / 2,
      py = (oy * it.h) / 2;
    return `translate3d(${R2(px)}px, ${R2(py)}px, 0) ${t} translate3d(${R2(-px)}px, ${R2(-py)}px, 0)`;
  };
  const ENTER = {
    1: (a) => `translateZ(${R2(-900 * a)}px) scale(${R2(1 - 0.3 * a)})`,
    2: (a) => `rotateZ(${R2(-55 * a)}deg) scale(${R2(1 - 0.4 * a)})`,
    3: (a, d, it) => pv(it, -d, 0, `rotateY(${R2(d * 85 * a)}deg)`),
    4: (a, d, it) => `translateY(${R2(-140 * a)}px) ${pv(it, 0, -1, `rotateX(${R2(-85 * a)}deg)`)}`,
    5: (a, d) => `translateX(${R2(d * 900 * a)}px) rotateY(${R2(-d * 40 * a)}deg)`,
    6: (a, d, it) => `translateY(${R2(300 * a)}px) ${pv(it, 0, 1, `rotateX(${R2(45 * a)}deg)`)}`,
    7: (a) => `rotateZ(${R2(-150 * a)}deg) scale(${R2(1 - 0.65 * a)})`,
  };
  const EXIT = {
    0: (x) => `scale(${R2(1 + 1.1 * x)})`,
    1: (x) => `rotateZ(${R2(80 * x)}deg)`,
    2: (x, d, it) => pv(it, d, 0, `rotateY(${R2(-d * 80 * x)}deg)`),
    3: (x, d, it) => `translateY(${R2(420 * x)}px) ${pv(it, 0, 1, `rotateX(${R2(-55 * x)}deg)`)}`,
    4: (x, d) => `translateX(${R2(d * 900 * x)}px) rotateY(${R2(-d * 40 * x)}deg)`,
    5: (x) => `translateZ(${R2(-800 * x)}px) scale(${R2(1 - 0.3 * x)})`,
    6: (x) => `rotateZ(${R2(-120 * x)}deg) scale(${R2(1 - 0.5 * x)})`,
  };

  const sInv = (y) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp(y, 0, 1)) / 3);
  function gOf(f) {
    f = clamp(f, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(f));
    return i + ease(f - i);
  }
  function fOf(g) {
    g = clamp(g, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(g));
    return i + E0 + EW * sInv(g - i);
  }

  let fly = null;
  function goTo(i, instant) {
    i = clamp(Math.round(i), 0, N - 1);
    const g0 = gOf(ps * (N - 1)),
      dist = Math.abs(i - g0),
      y = (range * i) / (N - 1);
    if (instant || dist < 0.002) {
      fly = null;
      window.scrollTo(0, y);
      target = clamp(y / range, 0, 1);
      if (instant) ps = target;
      return;
    }
    fly = { g0, g1: i, i, t0: performance.now(), dur: clamp(1150 + 420 * dist, 1300, 3300) };
  }
  function stepFly(now) {
    if (!fly) return;
    const k = clamp((now - fly.t0) / fly.dur, 0, 1);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const f = k >= 1 ? fly.i : fOf(fly.g0 + (fly.g1 - fly.g0) * e);
    ps = target = clamp(f / (N - 1), 0, 1);
    window.scrollTo(0, ps * range);
    if (k >= 1) fly = null;
  }

  function stepIndex(dir) {
    if (fly) return fly.i + dir;
    const g = gOf(ps * (N - 1));
    return dir > 0 ? Math.floor(g + 0.03) + 1 : Math.ceil(g - 0.03) - 1;
  }
  app.go = goTo;
  app.cur = () => (fly ? fly.i : clamp(Math.round(ps * (N - 1)), 0, N - 1));
  app.step = (d) => goTo(clamp(stepIndex(d), 0, N - 1));

  nextBtn.addEventListener("click", () => {
    const c = stepIndex(1);
    goTo(c >= N ? 0 : c);
  });
  prevBtn.addEventListener("click", () => goTo(Math.max(0, stepIndex(-1))));

  let tourT = 0,
    tourAt = 0;
  const tour = {
    active: () => !!tourT,
    stop() {
      if (tourT) {
        clearInterval(tourT);
        tourT = 0;
      }
    },
    start() {
      tour.stop();
      tourAt = performance.now();
      const advance = () => {
        const c = stepIndex(1);
        if (c >= N) {
          tour.stop();
          toast("Visite terminée");
          return false;
        }
        goTo(c);
        return true;
      };
      toast("Visite automatique · touche l'écran ou une touche pour arrêter");
      const first = stepIndex(1);
      if (first >= N) goTo(0);
      else goTo(first);
      tourT = setInterval(advance, 6200);
    },
  };
  app.tour = tour;

  const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
  const takeOver = () => {
    fly = null;
    if (performance.now() - tourAt > 150) tour.stop();
  };
  addEventListener("wheel", takeOver, { passive: true });
  addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest && e.target.closest(".pager, [data-go], .toasts, .pal")) return;
      takeOver();
    },
    { passive: true },
  );
  addEventListener("keydown", (e) => {
    if (performance.now() - tourAt > 150) tour.stop();
    const onControl = e.target.closest && e.target.closest("button, a, summary, input, textarea, select");
    if (!e.defaultPrevented && (SCROLL_KEYS.indexOf(e.key) >= 0 || (e.key === " " && !onControl))) fly = null;
  });
  document.addEventListener("pointerdown", (e) => {
    if (!(e.target.closest && e.target.closest(".pal"))) {
      if (performance.now() - tourAt > 150) tour.stop();
    }
  });

  document.addEventListener("focusin", (e) => {
    const p = e.target.closest && e.target.closest(".panel");
    if (!p) return;
    const i = items.findIndex((it) => it.el === p);
    if (i >= 0 && Math.abs(i - (fly ? fly.i : gOf(ps * (N - 1)))) > 0.6) goTo(i);
  });
  addEventListener(
    "scroll",
    () => {
      target = clamp(scrollY / range, 0, 1);
    },
    { passive: true },
  );
  addEventListener(
    "pointermove",
    (e) => {
      mouse.x = (e.clientX / W - 0.5) * 2;
      mouse.y = (e.clientY / H - 0.5) * 2;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
      mouse.moved = true;
    },
    { passive: true },
  );

  function layout() {
    W = innerWidth;
    H = innerHeight;
    wide = W >= 900;
    lat = clamp(W / 1200, 0.45, 1);
    vert = clamp(H / 900, 0.6, 1.2);
    items.forEach((it) => {
      it.x = wide ? it.side * 340 : 0;
      it.ry = wide ? -it.side * 14 : 0;
      it.base = `translate3d(${it.x}px, 0, ${it.z}px) rotateY(${it.ry}deg)`;
      it.el.style.transform = it.tfm = it.base;
      it.w = it.card.offsetWidth || it.w;
      it.h = it.card.offsetHeight || it.h;
    });
    spacer.style.height = (N - 1) * SEG * H + H + "px";
    range = Math.max(1, (N - 1) * SEG * H);
    target = clamp(scrollY / range, 0, 1);
  }

  $$(".stats b").forEach((b) => {
    const v = parseInt(b.dataset.val || b.textContent, 10);
    if (isFinite(v)) {
      b.dataset.val = String(v);
      b.dataset.wait = "1";
      b.textContent = "0";
    }
  });
  function countUp(el) {
    const t0 = performance.now();
    (function tick(now) {
      const k = clamp((now - t0) / 1100, 0, 1),
        to = parseInt(el.dataset.val, 10) || 0;
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
      else delete el.dataset.wait;
    })(t0);
  }

  function initGL() {
    if (typeof THREE === "undefined") return null;
    const cv = $("#gl");
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      return null;
    }
    renderer.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
    cam.rotation.order = "YXZ";
    let curP = P;
    function size() {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
      renderer.setSize(innerWidth, innerHeight, false);
      cam.aspect = innerWidth / innerHeight;
      cam.fov = (2 * Math.atan(innerHeight / 2 / curP) * 180) / Math.PI;
      cam.updateProjectionMatrix();
    }
    size();

    const css = (v) => getComputedStyle(root).getPropertyValue(v).trim() || "#ffffff";
    const rgb = (hex) => {
      const c = new THREE.Color(hex);
      return [c.r, c.g, c.b];
    };

    const dot = (function () {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d"),
        g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.35, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const ADD = THREE.AdditiveBlending;

    const NS = innerWidth < 900 ? 900 : 1900,
      sp = new Float32Array(NS * 3);
    for (let i = 0; i < NS; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 90;
      sp[i * 3 + 1] = (Math.random() - 0.5) * 60;
      sp[i * 3 + 2] = 15 - Math.random() * 145;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sc.add(
      new THREE.Points(
        sg,
        new THREE.PointsMaterial({
          size: 0.13,
          map: dot,
          color: 0xbfc8ff,
          transparent: true,
          opacity: 0.8,
          blending: ADD,
          depthWrite: false,
        }),
      ),
    );

    const fp = [],
      HX = 11,
      HY = 6.5;
    for (let z = 7.5; z > -135; z -= 7.5) {
      const c = [
        [-HX, -HY],
        [HX, -HY],
        [HX, HY],
        [-HX, HY],
      ];
      for (let k = 0; k < 4; k++) {
        const a = c[k],
          b = c[(k + 1) % 4];
        fp.push(a[0], a[1], z, b[0], b[1], z);
      }
    }
    [
      [-HX, -HY],
      [HX, -HY],
      [HX, HY],
      [-HX, HY],
    ].forEach((c) => fp.push(c[0], c[1], 15, c[0], c[1], -140));
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3));
    const frameMat = new THREE.LineBasicMaterial({
      color: css("--accent"),
      transparent: true,
      opacity: 0.16,
      blending: ADD,
      depthWrite: false,
    });
    sc.add(new THREE.LineSegments(fg, frameMat));

    const gp = [],
      FY = -5.2;
    for (let x = -33; x <= 33; x += 3) gp.push(x, FY, 15, x, FY, -140);
    for (let z = 15; z >= -140; z -= 3) gp.push(-33, FY, z, 33, FY, z);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    const floorMat = new THREE.LineBasicMaterial({
      color: css("--cyan"),
      transparent: true,
      opacity: 0.1,
      blending: ADD,
      depthWrite: false,
    });
    sc.add(new THREE.LineSegments(gg, floorMat));

    function edgesOf(V) {
      let m = 1e9;
      const D = [];
      for (let i = 0; i < V.length; i++)
        for (let k = i + 1; k < V.length; k++) {
          const d = Math.hypot(V[i][0] - V[k][0], V[i][1] - V[k][1], V[i][2] - V[k][2], V[i][3] - V[k][3]);
          D.push([i, k, d]);
          if (d < m) m = d;
        }
      return D.filter((e) => e[2] < m * 1.01).map((e) => [e[0], e[1]]);
    }
    const unit = (V) => {
      const r = Math.hypot.apply(null, V[0]);
      return V.map((v) => v.map((x) => x / r));
    };
    const A = [],
      B = [],
      C = [],
      q5 = 1 / Math.sqrt(5);
    for (let i = 0; i < 16; i++) A.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    for (let a = 0; a < 4; a++)
      for (const s of [1, -1]) {
        const v = [0, 0, 0, 0];
        v[a] = s;
        B.push(v);
      }
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++)
        for (const s of [1, -1])
          for (const t of [1, -1]) {
            const v = [0, 0, 0, 0];
            v[a] = s;
            v[b] = t;
            C.push(v);
          }
    const D5 = [
      [1, 1, 1, -q5],
      [1, -1, -1, -q5],
      [-1, 1, -1, -q5],
      [-1, -1, 1, -q5],
      [0, 0, 0, Math.sqrt(5) - q5],
    ];
    const DEFS = [A, B, C, D5].map((V) => {
      const v = unit(V);
      return { V: v, E: edgesOf(v) };
    });
    const TYPES = [0, 1, 2, 3, 0, 1, 2, 0];
    const KSC = 6.5,
      DW = 2.6;
    const COL = [rgb(css("--cyan")), rgb(css("--accent")), rgb(css("--deep"))];
    function colorAt(w) {
      const t = clamp((w * 1.2 + 1.2) / 2.4, 0, 1),
        a = t < 0.5 ? COL[0] : COL[1],
        b = t < 0.5 ? COL[1] : COL[2],
        k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    function rot4(p, a, b, t) {
      const c = Math.cos(t),
        s = Math.sin(t),
        u = p[a],
        v = p[b];
      p[a] = u * c - v * s;
      p[b] = u * s + v * c;
    }

    const polys = items.map((it, i) => {
      const def = DEFS[TYPES[i % TYPES.length]],
        ne = def.E.length,
        n = def.V.length;
      const pos = new Float32Array(ne * 6),
        col = new Float32Array(ne * 6),
        pp = new Float32Array(n * 3),
        pc = new Float32Array(n * 3);
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      lg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const lm = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: ADD,
        depthWrite: false,
      });
      const pg = new THREE.BufferGeometry();
      pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
      pg.setAttribute("color", new THREE.BufferAttribute(pc, 3));
      const pm = new THREE.PointsMaterial({
        size: 0.38,
        map: dot,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: ADD,
        depthWrite: false,
      });
      const g = new THREE.Group();
      g.add(new THREE.LineSegments(lg, lm), new THREE.Points(pg, pm));
      g.visible = false;
      sc.add(g);
      return { def, g, lg, pg, lm, pm, pos, col, pp, pc, R: def.V.map(() => [0, 0, 0, 0]), phase: i * 1.7 };
    });
    function placeAt(p, x, y, z) {
      p.g.position.set(x / U, y, z / U);
    }
    function placePolys() {
      polys.forEach((p, i) => {
        const it = items[i];
        let x,
          y = -0.3,
          z = it.z - 800;
        if (i === 0) {
          x = wide ? 520 : 0;
          y = wide ? -0.2 : -2.6;
          z = -300;
          p.g.scale.setScalar(wide ? 1.35 : 0.8);
          return placeAt(p, x, y, z);
        } else if (i === N - 1) {
          x = wide ? -520 : 0;
          y = wide ? -0.2 : -2.6;
          z = it.z - 300;
          p.g.scale.setScalar(wide ? 1.35 : 0.8);
          return placeAt(p, x, y, z);
        } else x = wide ? -it.side * 620 : (i % 2 ? 1 : -1) * 170;
        p.g.position.set(x / U, y, z / U);
        p.g.scale.setScalar(wide ? 1 : 0.8);
      });
    }
    placePolys();

    function theme() {
      frameMat.color.set(css("--accent"));
      floorMat.color.set(css("--cyan"));
      COL[0] = rgb(css("--cyan"));
      COL[1] = rgb(css("--accent"));
      COL[2] = rgb(css("--deep"));
    }

    function updatePoly(p, time, f) {
      const V = p.def.V,
        R = p.R,
        E = p.def.E;
      const xw = time * 0.55 + p.phase,
        yw = time * 0.38 + f * 1.1 + p.phase * 0.7,
        zw = f * 1.6,
        xy = time * 0.17,
        xz = time * 0.11 + p.phase,
        yz = f * 0.5;
      for (let i = 0; i < V.length; i++) {
        const r = R[i],
          v = V[i];
        r[0] = v[0];
        r[1] = v[1];
        r[2] = v[2];
        r[3] = v[3];
        rot4(r, 0, 3, xw);
        rot4(r, 1, 3, yw);
        rot4(r, 2, 3, zw);
        rot4(r, 0, 1, xy);
        rot4(r, 0, 2, xz);
        rot4(r, 1, 2, yz);
        const s = KSC / (DW - r[3]),
          c = colorAt(r[3]);
        p.pp[i * 3] = r[0] * s;
        p.pp[i * 3 + 1] = r[1] * s;
        p.pp[i * 3 + 2] = r[2] * s;
        p.pc[i * 3] = c[0];
        p.pc[i * 3 + 1] = c[1];
        p.pc[i * 3 + 2] = c[2];
      }
      for (let e = 0; e < E.length; e++) {
        const a = R[E[e][0]],
          b = R[E[e][1]],
          sa = KSC / (DW - a[3]),
          sb = KSC / (DW - b[3]),
          ca = colorAt(a[3]),
          cb = colorAt(b[3]);
        p.pos[e * 6] = a[0] * sa;
        p.pos[e * 6 + 1] = a[1] * sa;
        p.pos[e * 6 + 2] = a[2] * sa;
        p.pos[e * 6 + 3] = b[0] * sb;
        p.pos[e * 6 + 4] = b[1] * sb;
        p.pos[e * 6 + 5] = b[2] * sb;
        p.col[e * 6] = ca[0];
        p.col[e * 6 + 1] = ca[1];
        p.col[e * 6 + 2] = ca[2];
        p.col[e * 6 + 3] = cb[0];
        p.col[e * 6 + 4] = cb[1];
        p.col[e * 6 + 5] = cb[2];
      }
      p.lg.attributes.position.needsUpdate = true;
      p.lg.attributes.color.needsUpdate = true;
      p.pg.attributes.position.needsUpdate = true;
      p.pg.attributes.color.needsUpdate = true;
    }

    return {
      size,
      placePolys,
      theme,
      project(x, y, z) {
        const v = new THREE.Vector3(x / U, -y / U, z / U).project(cam);
        return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
      },
      render(cx, cy, cz, f, time, pose) {
        const k = pose ? pose.k : 1,
          rad = Math.PI / 180;
        if (Math.abs(P * k - curP) > 0.5) {
          curP = P * k;
          size();
        }
        cam.position.set(cx / U, -cy / U, (cz + P) / U);
        cam.rotation.set(pose ? pose.pitch * rad : 0, pose ? -pose.yaw * rad : 0, pose ? pose.roll * rad : 0);
        cam.updateMatrixWorld(true);
        const eyeZ = cam.position.z;
        polys.forEach((p) => {
          const dist = eyeZ - p.g.position.z;
          const o = clamp((dist - 3) / 6, 0, 1) * clamp(1 - (dist - 14) / 38, 0, 1);
          p.g.visible = o > 0.01;
          if (!p.g.visible) return;
          p.lm.opacity = 0.9 * o;
          p.pm.opacity = o;
          updatePoly(p, time, f);
        });
        renderer.render(sc, cam);
      },
    };
  }
  let gl = null,
    glTried = false;
  function ensureGL() {
    if (!glTried) {
      glTried = true;
      gl = initGL();
    }
    return gl;
  }
  if (!eco) ensureGL();

  app.applyFx = (mode) => {
    eco = mode === "eco";
    perf.on = false;
    if (!eco && ensureGL()) {
      gl.size();
      gl.placePolys();
      gl.theme();
    }
  };
  app.applyAccent = () => {
    if (gl) gl.theme();
  };

  let last = performance.now(),
    time = 0,
    intro = 0,
    hudT = 0,
    raf = 0,
    curIdx = -1,
    hashT = 0;
  let lastCz = 0,
    wv = 0,
    wShown = -1,
    pShown = "",
    lastRoll = 0,
    lastYaw = 0,
    lastPitch = 0,
    camNow = null;
  if (window.ResizeObserver) {
    const ro = new ResizeObserver((es) =>
      es.forEach((en) => {
        const it = items.find((x) => x.card === en.target);
        if (it) {
          it.w = en.target.offsetWidth || it.w;
          it.h = en.target.offsetHeight || it.h;
        }
      }),
    );
    items.forEach((it) => ro.observe(it.card));
  }
  const perf = { on: fx === "max" && !fxChosen, n: 0, sum: 0, slow: 0, wins: 0 };

  function setCurrent(i) {
    if (i === curIdx) return;
    curIdx = i;
    navLinks.forEach((a) => a.setAttribute("aria-current", String(+a.dataset.go === i)));
    dotBtns.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
    const lastOne = i === N - 1;
    prevBtn.dataset.off = i === 0 ? "1" : "";
    nextBtn.dataset.idx = String(i);
    nextBtn.dataset.last = String(lastOne);
    nextLabel.textContent = lastOne ? "Retour au début" : "Suivant";
    nextBtn.setAttribute("aria-label", lastOne ? "Retour au début" : "Suivant : " + items[i + 1].title);
    clearTimeout(hashT);
    hashT = setTimeout(() => {
      try {
        history.replaceState(null, "", "#" + items[i].id);
      } catch (e) {}
    }, 400);
  }

  function frame(now) {
    const raw = (now - last) / 1000,
      dt = Math.min(0.05, raw);
    last = now;
    time += dt;
    stepFly(now);
    intro = Math.min(1, intro + dt / 1.8);
    ps += (target - ps) * (1 - Math.exp(-dt * 7));
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 4));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 4));

    const f = ps * (N - 1),
      c = camAt(f);
    camNow = c;
    const cx = c.x + (wide ? mouse.sx * 70 : 0),
      cy = c.y + (wide ? mouse.sy * 45 : 0);
    const cz = c.z + (1 - smooth(intro)) * 1800;

    const P2 = Math.round(P * c.k);
    if (P2 !== world.__p) {
      world.__p = P2;
      world.style.perspective = P2 + "px";
    }
    scene.style.transform = `translate3d(0px, 0px, ${P2}px) rotateZ(${c.roll.toFixed(2)}deg) rotateX(${c.pitch.toFixed(2)}deg) rotateY(${c.yaw.toFixed(2)}deg) translate3d(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px, ${(-(cz + P)).toFixed(2)}px)`;

    if (!eco) {
      const dd = Math.max(dt, 0.001);
      const vz = Math.abs(cz - lastCz) / dd;
      const ang = (Math.abs(c.roll - lastRoll) + Math.abs(c.yaw - lastYaw) + Math.abs(c.pitch - lastPitch)) / dd;
      const want = clamp((vz - 700) / 2600, 0, 1) * 0.5 + clamp((ang - 60) / 700, 0, 1) * 0.3 + c.fx * 0.35;
      wv += (clamp(want, 0, 0.85) - wv) * (1 - Math.exp(-dt * 9));
      const wq = Math.round(wv * 50) / 50;
      if (wq !== wShown) {
        wShown = wq;
        warp.style.opacity = wq ? String(wq) : "";
      }
    }
    lastCz = cz;
    lastRoll = c.roll;
    lastYaw = c.yaw;
    lastPitch = c.pitch;

    const idx = clamp(Math.round(f), 0, N - 1);
    for (let i = 0; i < N; i++) {
      const it = items[i],
        dz = it.z - cz;
      let vis, blur;
      if (dz <= -DWELL) {
        vis = Math.pow(clamp(1 - (-dz - DWELL) / 2200, 0, 1), 2);
        blur = clamp((-dz - DWELL - 80) / 300, 0, 5);
      } else {
        vis = 1 - smooth((dz + DWELL) / 560);
        blur = clamp((dz + DWELL) / 90, 0, 9);
      }
      if (eco) blur = 0;
      const q = Math.round(vis * 100) / 100,
        bl = Math.round(blur * 2) / 2;
      const key = q + "|" + bl;
      if (key !== it.key) {
        it.key = key;
        it.el.style.opacity = q >= 0.995 ? "" : String(q);
        it.el.style.filter = bl > 0.4 ? `blur(${bl}px)` : "";
        it.el.style.pointerEvents = q > 0.5 ? "" : "none";
      }
      if (q > 0.35 && !it.shown) {
        it.shown = true;
        $$("[data-wait]", it.el).forEach(countUp);
      }

      let fxs = "";
      if (!reduce) {
        if (dz <= -DWELL) {
          const a = clamp((-dz - DWELL) / GAP, 0, 1);
          if (a > 0.003 && ENTER[i]) fxs = ENTER[i](Math.pow(a, 1.5), it.side || 1, it);
        } else {
          const x = clamp((dz + DWELL) / 560, 0, 1);
          if (x > 0.003 && EXIT[i]) fxs = EXIT[i](x, it.side || 1, it);
        }
      }
      const tt = fxs ? it.base + " " + fxs : it.base;
      if (tt !== it.tfm) {
        it.tfm = tt;
        it.el.style.transform = tt;
      }
      const tilt = fine && wide && !eco && i === idx && q > 0.9 && !fxs;
      if (tilt) {
        it.card.style.transform = `rotateX(${(-mouse.sy * 3).toFixed(2)}deg) rotateY(${(mouse.sx * 5).toFixed(2)}deg)`;
        it.tilt = true;
      } else if (it.tilt) {
        it.card.style.transform = "";
        it.tilt = false;
      }
    }
    setCurrent(idx);

    if (mouse.moved) {
      mouse.moved = false;
      if (fine && wide && !eco) {
        const card = items[idx].card,
          r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (mouse.px - r.left).toFixed(0) + "px");
        card.style.setProperty("--my", (mouse.py - r.top).toFixed(0) + "px");
      }
    }

    if (progress) {
      const pv = ps.toFixed(4);
      if (pv !== pShown) {
        pShown = pv;
        progress.style.transform = "scaleX(" + pv + ")";
      }
    }

    hudT += dt;
    if (hudT > 0.08) {
      hudT = 0;
      hud.textContent = `${String(idx + 1).padStart(2, "0")}/${String(N).padStart(2, "0")} · ${items[idx].title.toUpperCase()} · Z ${String(Math.max(0, Math.round(DWELL - cz))).padStart(5, "0")}${c.move ? " · " + c.move.toUpperCase() : ""}`;
    }

    if (gl && !eco) gl.render(cx, cy, cz, f, time, c);

    if (perf.on && intro >= 1 && raw < 0.25) {
      perf.sum += raw;
      if (++perf.n >= 80) {
        if (perf.sum / perf.n > 1 / 24) {
          if (++perf.slow >= 2) {
            perf.on = false;
            autoEco();
          }
        } else perf.slow = 0;
        perf.n = 0;
        perf.sum = 0;
        if (++perf.wins > 12) perf.on = false;
      }
    }
  }
  function autoEco() {
    setFx("eco", { auto: true });
    toast("Animation allégée pour rester fluide.", { label: "Annuler", run: () => setFx("max") });
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    frame(now);
  }

  root.classList.add("fly");
  root.classList.toggle("eco", eco);
  pager.hidden = root.classList.contains("css-bad");
  app.mode3d = true;
  layout();
  const h0 = location.hash.slice(1),
    i0 = items.findIndex((it) => it.id === h0);
  if (i0 > 0) {
    scrollTo(0, (range * i0) / (N - 1));
    target = ps = clamp(scrollY / range, 0, 1);
  } else {
    ps = target;
  }

  addEventListener("resize", () => {
    layout();
    if (gl) {
      gl.size();
      gl.placePolys();
    }
  });
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      cancelAnimationFrame(raf);
      tour.stop();
    } else {
      last = performance.now();
      if (fly) fly.t0 += last - hiddenAt;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }
  });
  raf = requestAnimationFrame(tick);

  (function extras() {
    const mk = (tag, cls, html) => {
      const e = document.createElement(tag);
      e.className = cls;
      if (html) e.innerHTML = html;
      document.body.appendChild(e);
      return e;
    };
    const words = [
      "PYTHON",
      "RUST",
      "OLLAMA",
      "DISCORD",
      "WEBGL",
      "4D",
      "SERENITY",
      "ESP8266",
      "SPIGOT",
      "THREE.JS",
      "LOCAL-FIRST",
      "0 FRAMEWORK",
      "100 % MANUEL",
      "SUDO MAKE COFFEE",
      "CTRL+K",
      "HELLO WORLD",
    ];
    const row = words.map((w) => `<span>${w}</span>`).join("<i>◆</i>");
    mk("div", "ticker", `<div class="ticker-in">${row}<i>◆</i>${row}<i>◆</i></div>`).setAttribute("aria-hidden", "true");
    mk("div", "corner tl", "N 48.85° · E 2.35°").setAttribute("aria-hidden", "true");
    const tel = mk("pre", "telemetry");
    tel.setAttribute("aria-hidden", "true");
    const t0 = performance.now();
    let fr = 0,
      fps = 60,
      lt = t0,
      lastY = scrollY,
      vy = 0;
    (function cnt() {
      fr++;
      requestAnimationFrame(cnt);
    })();
    const hex = (n) => ("0000" + (n >>> 0).toString(16).toUpperCase()).slice(-4);
    setInterval(() => {
      const now = performance.now();
      fps = Math.round((fr * 1000) / (now - lt));
      fr = 0;
      lt = now;
      vy = Math.round(Math.abs(scrollY - lastY) / 0.12);
      lastY = scrollY;
      const c = camNow || { roll: 0, yaw: 0, pitch: 0, k: 1, move: "" };
      const u = Math.round((now - t0) / 1000),
        d = new Date();
      tel.textContent = [
        `FPS    ${String(fps).padStart(3)}`,
        `SCROLL ${String(vy).padStart(5)} px/s`,
        `ROLL   ${c.roll.toFixed(1).padStart(6)}°`,
        `YAW    ${c.yaw.toFixed(1).padStart(6)}°`,
        `PITCH  ${c.pitch.toFixed(1).padStart(6)}°`,
        `FOV×   ${(1 / c.k).toFixed(2)}`,
        `MODE   ${c.move ? c.move.toUpperCase() : "—"}`,
        `UP     ${Math.floor(u / 60)}m${String(u % 60).padStart(2, "0")}s`,
        `UTC    ${d.toISOString().slice(11, 19)}`,
        `0x${hex(Math.round(ps * 65535))}  ${"█".repeat(Math.round(ps * 12)).padEnd(12, "░")}`,
      ].join("\n");
    }, 120);
    try {
      console.log(
        "%c ItsPyDevs ",
        "background:#a78bfa;color:#0b0b14;font:700 14px monospace;padding:4px 8px",
        "\n  ╭─────────────╮\n  │ py  >>  rs  │\n  ╰─────────────╯\n  Curieux ? ↑ ↑ ↓ ↓ ← → ← → B A",
      );
    } catch (e) {}
    const kk = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    let ki = 0,
      hue = 0,
      rid = 0;
    addEventListener("keydown", (e) => {
      ki = e.code === kk[ki] ? ki + 1 : e.code === kk[0] ? 1 : 0;
      if (ki === kk.length) {
        ki = 0;
        toast("Mode arc-en-ciel activé — recommence pour l'arrêter");
        if (rid) {
          clearInterval(rid);
          rid = 0;
          document.documentElement.style.filter = "";
        } else
          rid = setInterval(() => {
            hue = (hue + 4) % 360;
            document.documentElement.style.filter = `hue-rotate(${hue}deg)`;
          }, 60);
      }
    });
  })();

  window.__tour = {
    goTo,
    ready: true,
    count: N,
    state: () => ({ fly: !!fly, ps, idx: curIdx, eco, fx, cam: camNow }),
    seek(f) {
      fly = null;
      const y = clamp(f / (N - 1), 0, 1) * range;
      scrollTo(0, y);
      target = ps = clamp(y / range, 0, 1);
    },
    project(x, y, z) {
      return gl && gl.project ? gl.project(x, y, z) : null;
    },
  };
})();
