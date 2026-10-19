/* Prinshu Somay — interactions and motion
   The page works without JavaScript; everything here is enhancement.
   All motion stops for visitors who ask their system for reduced motion. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const cssVar = name => getComputedStyle(root).getPropertyValue(name).trim();
  window.__siteReady = true;

  /* ---------------------------------------------------------------
     Colour themes: Midnight, Aurora, Paper
  --------------------------------------------------------------- */
  const themeBtns = $$('[data-set-theme]');
  const themeMeta = $('meta[name="theme-color"]');
  const themeListeners = [];
  const applyTheme = (theme, animate) => {
    if (animate && !reduce) {
      root.classList.add('theme-fade');
      clearTimeout(applyTheme._t);
      applyTheme._t = setTimeout(() => root.classList.remove('theme-fade'), 600);
    }
    root.dataset.theme = theme;
    themeBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.setTheme === theme)));
    if (themeMeta) themeMeta.content = cssVar('--bg') || '#070B14';
    themeListeners.forEach(fn => fn(theme));
  };
  themeBtns.forEach((b, i) => {
    b.addEventListener('click', () => { applyTheme(b.dataset.setTheme, true); store.set('theme', b.dataset.setTheme); });
    b.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      const next = themeBtns[(i + dir + themeBtns.length) % themeBtns.length];
      next.focus(); next.click();
    });
  });
  applyTheme(root.dataset.theme || 'midnight', false);
  themeBtns.forEach(b => { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
  themeListeners.push(() => themeBtns.forEach(b => { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; }));

  /* ---------------------------------------------------------------
     Name: set letter by letter
  --------------------------------------------------------------- */
  const nameEl = $('[data-split]');
  if (nameEl) {
    let i = 0;
    $$('.name-word', nameEl).forEach(word => {
      const text = word.textContent;
      word.textContent = '';
      [...text].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = ch; s.style.setProperty('--i', i++);
        s.setAttribute('aria-hidden', 'true');
        word.appendChild(s);
      });
    });
    nameEl.classList.add('is-split');
  }

  /* ---------------------------------------------------------------
     The prompt: types what Prinshu is working on
  --------------------------------------------------------------- */
  const typer = $('[data-typer]');
  if (typer && !reduce) {
    const lines = [
      'Building a research terminal from Reliance Jio’s draft red herring prospectus',
      'Modelling DCF, comparables, LBO and M&A in a 300-hour valuation program',
      'Scoring 100 percentile in Fundamentals of Mathematics at IIM Sirmaur',
      'Running regressions on 60+ quarters of Titan’s financials',
      'Shipping the complaint system for IIM Sirmaur’s Infra-IT Committee',
      'Preparing for NISM certification in financial markets'
    ];
    let line = 0, pos = lines[0].length, deleting = true;
    const tick = () => {
      const text = lines[line];
      if (deleting) {
        pos = Math.max(0, pos - 2);
        typer.textContent = text.slice(0, pos);
        if (pos === 0) { deleting = false; line = (line + 1) % lines.length; return setTimeout(tick, 380); }
        return setTimeout(tick, 16);
      }
      const next = lines[line];
      pos += 1;
      typer.textContent = next.slice(0, pos);
      if (pos >= next.length) { deleting = true; return setTimeout(tick, 2600); }
      return setTimeout(tick, 22 + Math.random() * 38);
    };
    setTimeout(tick, 4200);
  }

  /* ---------------------------------------------------------------
     Orbit: signal rings and satellites, after the Jio terminal's tower
  --------------------------------------------------------------- */
  const canvas = $('[data-orbit]');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero');
    let w = 0, h = 0, dpr = 1, running = false, raf = 0, t0 = performance.now();
    let mx = 0, my = 0, px = 0, py = 0;
    let colors = {};
    const readColors = () => { colors = { a: cssVar('--accent'), b: cssVar('--accent-2'), ink: cssVar('--ink'), paper: root.dataset.theme === 'paper' }; };
    readColors();
    themeListeners.push(() => { readColors(); if (!running) draw(performance.now()); });

    const rings = [
      { r: 0.46, tilt: -0.20, speed: 0.050, sats: [0.0, 0.52], size: 2.6 },
      { r: 0.36, tilt: 0.14, speed: -0.075, sats: [0.18, 0.7], size: 2.2 },
      { r: 0.27, tilt: -0.06, speed: 0.110, sats: [0.4], size: 2.0 }
    ];
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + 0.3, p: Math.random() * Math.PI * 2 }));

    let centreY = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nr = nameEl ? nameEl.getBoundingClientRect() : null;
      centreY = nr ? (nr.top + nr.height / 2 - rect.top) : rect.height * 0.4;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const hexA = (c, a) => {
      if (!c) return `rgba(255,255,255,${a})`;
      if (c.startsWith('#')) {
        const n = c.length === 4 ? c.slice(1).split('').map(x => x + x).join('') : c.slice(1, 7);
        const v = parseInt(n, 16);
        return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
      }
      return c;
    };

    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      px += (mx - px) * 0.05; py += (my - py) * 0.05;
      const cx = w / 2 + px * 18, cy = centreY + py * 12;
      const base = Math.min(w < 600 ? w * 1.25 : w, 1240);
      const dim = colors.paper ? 0.55 : 1;

      // stars
      stars.forEach(s => {
        const a = (0.25 + 0.35 * Math.sin(t * 0.9 + s.p)) * dim;
        ctx.fillStyle = hexA(colors.ink, Math.max(0, a) * 0.5);
        ctx.beginPath(); ctx.arc(s.x * w + px * 6, s.y * h + py * 4, s.r, 0, Math.PI * 2); ctx.fill();
      });

      // signal pulses expanding from the centre
      for (let k = 0; k < 3; k++) {
        const phase = ((t / 4.2) + k / 3) % 1;
        const rx = base * (0.08 + phase * 0.5), ry = rx * 0.22;
        ctx.strokeStyle = hexA(colors.a, (1 - phase) * 0.22 * dim);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      }

      rings.forEach((ring, ri) => {
        const rx = base * ring.r, ry = rx * 0.24;
        const tilt = ring.tilt + px * 0.03;
        // ring
        const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
        g.addColorStop(0, hexA(colors.b, 0.02 * dim));
        g.addColorStop(0.5, hexA(ri % 2 ? colors.b : colors.a, 0.30 * dim));
        g.addColorStop(1, hexA(colors.a, 0.04 * dim));
        ctx.strokeStyle = g; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, tilt, 0, Math.PI * 2); ctx.stroke();

        // satellites with trails
        ring.sats.forEach(off => {
          const a0 = (t * ring.speed + off) * Math.PI * 2;
          for (let k = 14; k >= 0; k--) {
            const a = a0 - k * 0.022 * Math.sign(ring.speed);
            const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
            const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
            const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
            const front = Math.sin(a) > 0 ? 1 : 0.45;
            const alpha = (k === 0 ? 1 : (1 - k / 15) * 0.35) * front * dim;
            if (k === 0) {
              ctx.shadowColor = colors.a; ctx.shadowBlur = 16;
              ctx.fillStyle = hexA(colors.paper ? colors.b : '#FFFFFF', alpha);
              ctx.beginPath(); ctx.arc(x, y, ring.size * (front > 0.5 ? 1.15 : 0.85), 0, Math.PI * 2); ctx.fill();
              ctx.shadowBlur = 0;
            } else {
              ctx.fillStyle = hexA(colors.a, alpha);
              ctx.beginPath(); ctx.arc(x, y, ring.size * 0.6, 0, Math.PI * 2); ctx.fill();
            }
          }
        });
      });
    }

    const loop = now => { draw(now); if (running) raf = requestAnimationFrame(loop); };
    const start = () => { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    resize(); draw(performance.now());
    window.addEventListener('resize', () => { resize(); if (!running) draw(performance.now()); });
    if (!reduce) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop()))).observe(hero);
      } else start();
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    }
    if (finePointer && hero) {
      const glow = $('[data-cursor-glow]', hero);
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (glow && !reduce) { glow.style.left = (e.clientX - r.left) + 'px'; glow.style.top = (e.clientY - r.top) + 'px'; hero.classList.add('is-pointer'); }
      });
      hero.addEventListener('pointerleave', () => { mx = my = 0; hero.classList.remove('is-pointer'); });
    }
  }

  /* ---------------------------------------------------------------
     Ticker: loop seamlessly
  --------------------------------------------------------------- */
  const ticker = $('.ticker');
  if (ticker && !reduce) {
    const track = $('.ticker-track', ticker);
    [...track.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    const setDur = () => ticker.style.setProperty('--ticker-dur', Math.round(track.scrollWidth / 2 / 55) + 's');
    setDur(); window.addEventListener('resize', setDur);
    ticker.classList.add('is-looping');
  }

  /* ---------------------------------------------------------------
     Red margin: reading progress and section index; top bar state
  --------------------------------------------------------------- */
  let ticking = false;
  const topbar = $('.topbar');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    root.style.setProperty('--progress', p.toFixed(4));
    topbar?.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  const indexLinks = $$('[data-index-link]');
  const sections = indexLinks.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const setActive = id => indexLinks.forEach(a => {
      const on = a.hash === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------------------------------------------------------------
     Scroll reveals and word-by-word headings
  --------------------------------------------------------------- */
  $$('.section-head h2').forEach(h2 => {
    const words = h2.textContent.trim().split(/\s+/);
    h2.setAttribute('aria-label', h2.textContent.trim());
    h2.textContent = '';
    words.forEach((word, i) => {
      const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      const s = document.createElement('span'); s.textContent = word; w.style.setProperty('--wi', i);
      w.appendChild(s); h2.appendChild(w);
      if (i < words.length - 1) h2.appendChild(document.createTextNode(' '));
    });
  });
  const revealSel = [
    '.cover .statement', '.particulars', '.contents', '.project-index li', '.case--feature .frame', '.figures-block',
    '.pair .case', '.repo', '.entry', '.timeline li', '.percentiles li', '.league', '.plain li', '.sub',
    '.courses tbody tr', '.skills > div', '.col-label', '.education tr', '.contact-lead', '.contact-email',
    '.contact-actions', '.contact-list > div', '.section-note'
  ];
  const revealEls = $$(revealSel.join(','));
  const groups = new Map();
  revealEls.forEach(el => {
    el.setAttribute('data-reveal', '');
    const key = el.parentElement;
    const n = groups.get(key) || 0; groups.set(key, n + 1);
    el.style.setProperty('--ri', Math.min(n, 6));
  });
  if ('IntersectionObserver' in window && !reduce) {
    const ro = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => ro.observe(el));
    $$('.section-head').forEach(el => ro.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
    $$('.section-head').forEach(el => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------------
     Pointer spotlight on cards, gentle tilt on screenshots
  --------------------------------------------------------------- */
  $$('.repo, .entry, .particulars').forEach(el => el.setAttribute('data-spotlight', ''));
  if (finePointer) {
    $$('[data-spotlight]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (!reduce) {
      $$('[data-tilt]').forEach(el => {
        el.addEventListener('pointermove', e => {
          if (el.dataset.showing === 'live') return;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(1100px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      });
    }
  }

  /* ---------------------------------------------------------------
     Live status: each project site is checked from the visitor's browser
  --------------------------------------------------------------- */
  const checked = new Map();
  const checkSite = url => {
    if (checked.has(url)) return checked.get(url);
    const started = performance.now();
    const ctrl = 'AbortController' in window ? new AbortController() : null;
    const timer = setTimeout(() => ctrl?.abort(), 9000);
    const p = fetch(url, { cache: 'no-store', signal: ctrl?.signal, mode: 'cors' })
      .then(r => ({ ok: r.ok, code: r.status, ms: Math.round(performance.now() - started) }))
      .catch(() => ({ ok: false, code: 0, ms: 0 }))
      .finally(() => clearTimeout(timer));
    checked.set(url, p);
    return p;
  };
  $$('[data-status]').forEach(el => {
    const label = $('[data-status-text]', el);
    checkSite(el.dataset.status).then(res => {
      el.dataset.state = res.ok ? 'up' : 'down';
      if (label) label.textContent = res.ok ? `Live, ${res.ms} ms` : (res.code ? `Responded ${res.code}` : 'Not responding');
      el.title = res.ok ? `Checked just now from your browser: responded in ${res.ms} ms` : 'The site did not respond to a check from your browser';
    });
  });

  /* ---------------------------------------------------------------
     Screenshot / live preview switch inside each browser frame
  --------------------------------------------------------------- */
  $$('[data-frame]').forEach(frame => {
    const tabs = $$('[data-view]', frame);
    const stage = $('[data-stage]', frame);
    const url = frame.dataset.frame;
    let iframe = null;
    const fit = () => {
      if (!iframe) return;
      const sw = stage.clientWidth;
      const vw = sw < 600 ? 1024 : 1440;
      const scale = sw / vw;
      iframe.style.width = vw + 'px';
      iframe.style.height = (stage.clientHeight / scale) + 'px';
      iframe.style.transform = `scale(${scale})`;
    };
    const show = view => {
      tabs.forEach(t => { const on = t.dataset.view === view; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      frame.dataset.showing = view;
      frame.style.transform = '';
      if (view === 'live' && !iframe) {
        iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = 'Live preview of ' + url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer';
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
        iframe.addEventListener('load', () => frame.classList.add('is-loaded'));
        stage.appendChild(iframe);
        fit();
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(t.dataset.view));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); show(next.dataset.view);
      });
    });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
  });

  /* ---------------------------------------------------------------
     Rupee units (millions as filed, or crores) with counting figures
  --------------------------------------------------------------- */
  const unitBtns = $$('[data-unit]');
  const cells = $$('[data-millions]');
  let unit = store.get('units') === 'crore' ? 'crore' : 'million';
  const fmtIntl = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const format = (m, cell) => {
    const rupee = cell.dataset.rupee === 'true' ? '₹' : '';
    if (unit === 'crore') {
      const cr = m / 10;
      return rupee + new Intl.NumberFormat('en-IN', { maximumFractionDigits: cr >= 1000 ? 0 : 2 }).format(cr) + ' Cr';
    }
    return rupee + fmtIntl.format(m) + ' M';
  };
  const paint = (k = 1) => cells.forEach(cell => {
    const m = parseFloat(cell.dataset.millions);
    const v = k >= 1 ? m : (m >= 100 ? Math.round(m * k) : Math.round(m * k * 10) / 10);
    cell.textContent = format(v, cell);
  });
  const toggle = $('.unit-toggle');
  let thumb = null;
  if (toggle) { thumb = document.createElement('span'); thumb.className = 'thumb'; thumb.setAttribute('aria-hidden', 'true'); toggle.prepend(thumb); }
  const moveThumb = () => {
    const on = unitBtns.find(b => b.getAttribute('aria-pressed') === 'true');
    if (thumb && on) { thumb.style.left = on.offsetLeft + 'px'; thumb.style.width = on.offsetWidth + 'px'; }
  };
  const setUnit = u => {
    unit = u;
    unitBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.unit === u)));
    moveThumb(); paint(1); store.set('units', u);
  };
  unitBtns.forEach(b => b.addEventListener('click', () => setUnit(b.dataset.unit)));
  if (unitBtns.length) {
    setUnit(unit);
    window.addEventListener('resize', moveThumb);
    if (document.fonts?.ready) document.fonts.ready.then(moveThumb);
  }
  const figBlock = $('.figures-block');
  if (figBlock && cells.length && !reduce && 'IntersectionObserver' in window) {
    paint(0);
    const co = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      co.disconnect();
      const t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        paint(1 - Math.pow(1 - p, 4));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.35 });
    co.observe(figBlock);
  }

  /* ---------------------------------------------------------------
     Project index: a preview follows the pointer on desktop
  --------------------------------------------------------------- */
  const index = $('[data-project-index]');
  const floater = $('[data-floater]');
  if (index && floater && finePointer && !reduce) {
    const img = $('img', floater);
    let x = 0, y = 0, fx = 0, fy = 0, raf = 0, active = false;
    const loop = () => {
      fx += (x - fx) * 0.16; fy += (y - fy) * 0.16;
      floater.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      raf = active || Math.abs(x - fx) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    $$('[data-preview]', index).forEach(row => {
      row.addEventListener('pointerenter', e => {
        img.src = row.dataset.preview;
        if (!active) { fx = x = e.clientX + 32; fy = y = e.clientY - 100; }
        active = true; floater.classList.add('is-visible');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener('pointermove', e => { x = e.clientX + 32; y = e.clientY - 100; });
      row.addEventListener('pointerleave', () => { active = false; floater.classList.remove('is-visible'); });
    });
  }

  /* ---------------------------------------------------------------
     On GitHub, live
  --------------------------------------------------------------- */
  const gh = $('[data-github]');
  if (gh) {
    const user = gh.dataset.github;
    const list = $('[data-github-list]', gh);
    const meta = $('[data-github-meta]', gh);
    const notes = {
      'prinshusomay.github.io': 'This portfolio. Plain HTML, CSS and JavaScript on GitHub Pages, with live checks of every project.',
      'IIM-Sirmaur-Infra-IT': 'The campus management tool rebuilt in React, TypeScript and Firebase, with separate student, staff and admin dashboards.',
      'complaint-system': 'Complaint management system for the Infrastructure IT Committee: routing, tracking by ID and an admin dashboard.'
    };
    const langColor = { HTML: '#E34C26', TypeScript: '#3178C6', JavaScript: '#E5C100', Python: '#3572A5', CSS: '#663399', 'Jupyter Notebook': '#DA5B0B' };
    const rel = iso => {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const steps = [[60, 'second', 1], [3600, 'minute', 60], [86400, 'hour', 3600], [604800, 'day', 86400], [2629800, 'week', 604800], [31557600, 'month', 2629800], [Infinity, 'year', 31557600]];
      for (const [lim, u, d] of steps) if (s < lim) return rtf.format(-Math.round(s / d), u);
      return '';
    };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const render = (repos, commit) => {
      list.innerHTML = repos.filter(r => !r.fork).map(r => {
        const desc = notes[r.name] || r.description || 'No description yet.';
        const color = langColor[r.language] || 'var(--ink-3)';
        const live = r.homepage ? `<a class="repo-live" href="${esc(r.homepage)}">Live site</a>` : '';
        return `<li class="repo is-in" data-reveal data-spotlight>
          <a class="repo-name" href="${esc(r.html_url)}">${esc(r.name)}</a>
          <p class="repo-desc">${esc(desc)}</p>
          <p class="repo-meta">${r.language ? `<span class="lang"><i style="background:${color}"></i>${esc(r.language)}</span>` : ''}<span>Updated ${esc(rel(r.pushed_at))}</span>${live}</p>
        </li>`;
      }).join('');
      if (finePointer) $$('.repo', list).forEach(el => el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }));
      if (meta && commit) meta.innerHTML = `Latest commit to this site, ${esc(rel(commit.date))}: <a href="${esc(commit.url)}">${esc(commit.message)}</a>`;
      gh.dataset.state = 'loaded';
    };
    const cacheKey = 'gh-cache-v2';
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch (e) { cached = null; }
    if (cached && Date.now() - cached.t < 10 * 60 * 1000) {
      render(cached.repos, cached.commit);
    } else {
      Promise.all([
        fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=12`).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch(`https://api.github.com/repos/${user}/${user}.github.io/commits?per_page=1`).then(r => (r.ok ? r.json() : [])).catch(() => [])
      ]).then(([repos, commits]) => {
        const first = Array.isArray(commits) ? commits[0] : null;
        const c = first ? { date: first.commit.author.date, message: first.commit.message.split('\n')[0], url: first.html_url } : null;
        render(repos, c);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), repos, commit: c })); } catch (e) { /* ignore */ }
      }).catch(() => {
        gh.dataset.state = 'error';
        if (meta) meta.textContent = 'GitHub did not answer just now, so this list is the copy saved with the page.';
      });
    }
  }

  /* ---------------------------------------------------------------
     Copy email
  --------------------------------------------------------------- */
  $$('[data-copy]').forEach(btn => {
    const label = $('[data-copy-label]', btn) || btn;
    const original = label.textContent;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      label.textContent = ok ? 'Copied to clipboard' : 'Press Ctrl+C to copy';
      btn.classList.toggle('is-done', ok);
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { label.textContent = original; btn.classList.remove('is-done'); }, 2200);
    });
  });

  /* ---------------------------------------------------------------
     Percentile bars fill once they are on screen
  --------------------------------------------------------------- */
  const bars = $$('[data-bar]');
  if ('IntersectionObserver' in window && !reduce) {
    const bo = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-filled'); bo.unobserve(e.target); }
    }), { threshold: 0.6 });
    bars.forEach(b => bo.observe(b));
  } else {
    bars.forEach(b => b.classList.add('is-filled'));
  }

  root.classList.add('js-ready');
})();
