/* Prinshu Somay — interactions
   Everything here enhances a page that already works without JavaScript. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------------------------------------------------------------
     Paper / Ink theme
  --------------------------------------------------------------- */
  const themeBtn = $('[data-theme-toggle]');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
  const syncTheme = () => {
    if (!themeBtn) return;
    const dark = currentTheme() === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.querySelector('[data-theme-label]').textContent = dark ? 'Paper' : 'Ink';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light paper theme' : 'Switch to dark ink theme');
  };
  themeBtn?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('theme', next);
    syncTheme();
  });
  systemDark.addEventListener?.('change', syncTheme);
  syncTheme();

  /* ---------------------------------------------------------------
     Red margin: reading progress and section index
  --------------------------------------------------------------- */
  let ticking = false;
  const topbar = $('.topbar');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    root.style.setProperty('--progress', p.toFixed(4));
    topbar?.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateProgress); }
  }, { passive: true });
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
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
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
      const w = stage.clientWidth;
      const vw = w < 600 ? 1024 : 1440;
      const scale = w / vw;
      iframe.style.width = vw + 'px';
      iframe.style.height = (stage.clientHeight / scale) + 'px';
      iframe.style.transform = `scale(${scale})`;
    };
    const show = view => {
      tabs.forEach(t => {
        const on = t.dataset.view === view;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      frame.dataset.showing = view;
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
     Rupee units: millions (as filed) or crores (as read in India)
  --------------------------------------------------------------- */
  const unitBtns = $$('[data-unit]');
  const fmtIntl = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const setUnit = unit => {
    unitBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.unit === unit)));
    $$('[data-millions]').forEach(cell => {
      const m = parseFloat(cell.dataset.millions);
      const rupee = cell.dataset.rupee === 'true' ? '₹' : '';
      if (unit === 'crore') {
        const cr = m / 10;
        const digits = cr >= 1000 ? 0 : 2;
        cell.textContent = rupee + new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(cr) + ' Cr';
      } else {
        cell.textContent = rupee + fmtIntl.format(m) + ' M';
      }
    });
    store.set('units', unit);
  };
  unitBtns.forEach(b => b.addEventListener('click', () => setUnit(b.dataset.unit)));
  if (unitBtns.length) setUnit(store.get('units') === 'crore' ? 'crore' : 'million');

  /* ---------------------------------------------------------------
     Project index: a preview follows the pointer on desktop
  --------------------------------------------------------------- */
  const index = $('[data-project-index]');
  const floater = $('[data-floater]');
  if (index && floater && finePointer.matches && !reduceMotion.matches) {
    const img = $('img', floater);
    let x = 0, y = 0, fx = 0, fy = 0, raf = 0, active = false;
    const loop = () => {
      fx += (x - fx) * 0.18; fy += (y - fy) * 0.18;
      floater.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      raf = active || Math.abs(x - fx) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    $$('[data-preview]', index).forEach(row => {
      row.addEventListener('pointerenter', e => {
        img.src = row.dataset.preview; img.alt = '';
        if (!active) { fx = x = e.clientX + 28; fy = y = e.clientY - 90; }
        active = true; floater.classList.add('is-visible');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener('pointermove', e => { x = e.clientX + 28; y = e.clientY - 90; });
      row.addEventListener('pointerleave', () => { active = false; floater.classList.remove('is-visible'); });
    });
  }

  /* ---------------------------------------------------------------
     Live from GitHub
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
    const langColor = { HTML: '#E34C26', TypeScript: '#3178C6', JavaScript: '#C9A800', Python: '#3572A5', CSS: '#563D7C', 'Jupyter Notebook': '#DA5B0B' };
    const rel = iso => {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const steps = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [604800, 'day'], [2629800, 'week'], [31557600, 'month'], [Infinity, 'year']];
      const div = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 };
      for (const [lim, unit] of steps) if (s < lim) return rtf.format(-Math.round(s / div[unit]), unit);
      return '';
    };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const render = (repos, commit) => {
      list.innerHTML = repos.filter(r => !r.fork).map(r => {
        const desc = r.description || notes[r.name] || 'No description yet.';
        const color = langColor[r.language] || 'var(--ink-3)';
        const live = r.homepage ? `<a class="repo-live" href="${esc(r.homepage)}">Live site</a>` : '';
        return `<li class="repo">
          <a class="repo-name" href="${esc(r.html_url)}">${esc(r.name)}</a>
          <p class="repo-desc">${esc(notes[r.name] || desc)}</p>
          <p class="repo-meta">${r.language ? `<span class="lang"><i style="background:${color}"></i>${esc(r.language)}</span>` : ''}<span>Updated ${esc(rel(r.pushed_at))}</span>${live}</p>
        </li>`;
      }).join('');
      if (meta && commit) {
        meta.innerHTML = `Latest commit to this site, ${esc(rel(commit.date))}: <a href="${esc(commit.url)}">${esc(commit.message)}</a>`;
      }
      gh.dataset.state = 'loaded';
    };
    const cacheKey = 'gh-cache-v1';
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch (e) { cached = null; }
    if (cached && Date.now() - cached.t < 10 * 60 * 1000) {
      render(cached.repos, cached.commit);
    } else {
      Promise.all([
        fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=12`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
        fetch(`https://api.github.com/repos/${user}/${user}.github.io/commits?per_page=1`).then(r => r.ok ? r.json() : []).catch(() => [])
      ]).then(([repos, commits]) => {
        const first = Array.isArray(commits) ? commits[0] : null;
        const c = first ? {
          date: first.commit.author.date,
          message: first.commit.message.split('\n')[0],
          url: first.html_url
        } : null;
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
      label.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
      btn.classList.toggle('is-done', ok);
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { label.textContent = original; btn.classList.remove('is-done'); }, 2200);
    });
  });

  /* ---------------------------------------------------------------
     Percentile bars fill once they are on screen
  --------------------------------------------------------------- */
  const bars = $$('[data-bar]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const bo = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-filled'); bo.unobserve(e.target); }
    }), { threshold: 0.6 });
    bars.forEach(b => bo.observe(b));
  } else {
    bars.forEach(b => b.classList.add('is-filled'));
  }

  root.classList.add('js-ready');
})();
