/* ============================================================
   FACTUR — Tweaks panel (vanilla, host-protocol compatible)
   Sections: GLOBAL · TYPE · GALLERY · DETAIL · MOTION
   Speaks the editor host protocol:
     posts  __edit_mode_available  on load
     listens __activate_edit_mode / __deactivate_edit_mode
     posts  __edit_mode_set_keys   to persist
     posts  __edit_mode_dismissed  on close
   ============================================================ */
(function () {
  const root = document.documentElement;
  const setVar = (k, v) => root.style.setProperty(k, v);
  const setAttr = (k, v, def) => { if (v === def) root.removeAttribute(k); else root.setAttribute(k, v); };

  /* ---- accent options (the one warm note) ---- */
  const ACCENTS = [
    { key: 'ember',    name: 'Ember',    rgb: [255, 120, 70] },
    { key: 'signal',   name: 'Signal',   rgb: [233, 69, 60] },
    { key: 'amber',    name: 'Amber',    rgb: [231, 176, 70] },
    { key: 'phosphor', name: 'Phosphor', rgb: [120, 205, 130] },
    { key: 'cyan',     name: 'Cyan',     rgb: [86, 190, 214] },
    { key: 'violet',   name: 'Violet',   rgb: [157, 130, 246] }
  ];
  const rgba = (rgb, a) => 'rgba(' + rgb.join(',') + ',' + a + ')';
  const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  const findAccent = (k) => ACCENTS.find((a) => a.key === k) || ACCENTS[0];

  const DISPLAY_FONTS = ['Syne', 'Space Grotesk', 'Archivo'];
  const MONO_FONTS = ['JetBrains Mono', 'IBM Plex Mono', 'Space Mono'];

  /* ---- defaults + state ---- */
  const DEFAULTS = {
    accent: 'ember', backdrop: 'ink', hairlines: 1, contrast: 35,
    fontDisplay: 'Syne', fontMono: 'JetBrains Mono', scale: 1.2,
    density: 280, dots: 'on',
    syntax: 'spectrum', codeSize: 0.68,
    motion: 'on', cursor: 'cross'
  };
  const KEYS = Object.keys(DEFAULTS);
  const state = Object.assign({}, DEFAULTS);
  KEYS.forEach((k) => {
    try {
      const raw = localStorage.getItem('factur-twk-' + k);
      if (raw != null) state[k] = (typeof DEFAULTS[k] === 'number') ? parseFloat(raw) : raw;
    } catch (e) {}
  });

  /* ---- appliers ---- */
  const APPLY = {
    accent(v) {
      const a = findAccent(v).rgb;
      setVar('--accent', rgba(a, 0.9));
      setVar('--accent-solid', hex(a));
      setVar('--accent-bg', rgba(a, 0.12));
      setVar('--accent-glow', rgba(a, 0.25));
    },
    backdrop(v) { setAttr('data-bg', v, 'ink'); },
    hairlines(v) { setVar('--hl-mult', v); },
    contrast(v) { setVar('--contrast', v + '%'); },
    fontDisplay(v) { setVar('--font-display', "'" + v + "'"); },
    fontMono(v) { setVar('--font-mono', "'" + v + "'"); },
    scale(v) { setVar('--type-scale', v); },
    density(v) { setVar('--cell-min', v + 'px'); },
    dots(v) { setAttr('data-dots', v, 'on'); },
    syntax(v) { setAttr('data-syntax', v, 'spectrum'); },
    codeSize(v) { setVar('--text-code', v + 'rem'); },
    motion(v) { setAttr('data-motion', v, 'on'); },
    cursor(v) { setAttr('data-cursor', v === 'cross' ? 'cross' : 'default', 'cross'); }
  };

  function applyAll() { KEYS.forEach((k) => APPLY[k](state[k])); }
  applyAll(); // before paint

  function set(key, val, persistHost) {
    state[key] = val;
    APPLY[key](val);
    try { localStorage.setItem('factur-twk-' + key, val); } catch (e) {}
    if (persistHost) {
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*'); } catch (e) {}
    }
  }

  /* ---- preset CSS (mode-aware bits live here as data-attr rules) ---- */
  const presetCSS = `
  /* backdrop presets */
  html[data-bg="warm"]{--bg:#0A0806;--bg2:#100D0A;--bg3:#16120E;}
  html.light[data-bg="warm"]{--bg:#F3EEE4;--bg2:#EBE5D9;--bg3:#E5DDCF;}
  html[data-bg="pure"]{--bg:#000000;--bg2:#080808;--bg3:#101010;}
  html.light[data-bg="pure"]{--bg:#FFFFFF;--bg2:#F5F3EF;--bg3:#EDEBE5;}

  /* syntax themes */
  html[data-syntax="mono"]{--syn-key:#cdc8bd;--syn-str:#a7a299;--syn-num:#cdc8bd;
    --syn-com:#5a5852;--syn-fn:#e0dbd1;--syn-var:#a7a299;--syn-punc:#86837b;}
  html.light[data-syntax="mono"]{--syn-key:#2c2a25;--syn-str:#6b6860;--syn-num:#2c2a25;
    --syn-com:#a6a39b;--syn-fn:#0c0c0a;--syn-var:#6b6860;--syn-punc:#9a978f;}
  html[data-syntax="warm"]{--syn-key:#ff9d6b;--syn-str:#c2a888;--syn-num:#e6b079;
    --syn-com:#5f5c55;--syn-fn:#ffb88c;--syn-var:#d9b98c;--syn-punc:#8b887f;}
  html.light[data-syntax="warm"]{--syn-key:#c2611f;--syn-str:#8a6a3a;--syn-num:#a06a1a;
    --syn-com:#9a978f;--syn-fn:#c2691e;--syn-var:#8a6a1a;--syn-punc:#6b6860;}

  /* alive dots off */
  html[data-dots="off"] .accent-dot{display:none;}

  /* motion off */
  html[data-motion="off"] *{animation:none!important;transition:none!important;}
  html[data-motion="off"] .page.active .fu{opacity:1!important;transform:none!important;}

  /* panel chrome */
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:248px;
    max-height:calc(100vh - 32px);background:var(--bg2);color:var(--ink);
    border:1px solid var(--hairline2);font-family:var(--font-mono),monospace;font-weight:300;
    box-shadow:0 18px 50px rgba(0,0,0,0.5);display:none;flex-direction:column;cursor:crosshair;}
  .twk-panel.open{display:flex;}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;flex:0 0 auto;
    padding:0.7rem 0.5rem 0.7rem 0.9rem;border-bottom:1px solid var(--hairline2);
    cursor:move;user-select:none;}
  .twk-hd b{font-size:0.58rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink-mid);font-weight:400;}
  .twk-x{appearance:none;border:none;background:transparent;color:var(--ink-mid);
    width:22px;height:22px;font-size:0.8rem;line-height:1;cursor:crosshair;}
  .twk-x:hover{color:var(--ink);}
  .twk-body{padding:0.4rem 0.9rem 1rem;display:flex;flex-direction:column;gap:0.2rem;
    overflow-y:auto;min-height:0;}
  .twk-body::-webkit-scrollbar{width:8px;}
  .twk-body::-webkit-scrollbar-thumb{background:var(--hairline2);}

  .twk-sec{font-size:0.5rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-mid);
    padding:0.95rem 0 0.55rem;border-bottom:1px solid var(--hairline);margin-bottom:0.55rem;}
  .twk-sec:first-child{padding-top:0.4rem;}
  .twk-row{display:flex;flex-direction:column;gap:0.4rem;margin-bottom:0.7rem;}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;}
  .twk-lbl span{font-size:0.56rem;letter-spacing:0.04em;color:var(--ink);}
  .twk-lbl em{font-size:0.52rem;font-style:normal;color:var(--ink-mid);font-variant-numeric:tabular-nums;letter-spacing:0.04em;white-space:nowrap;}

  .twk-swatches{display:grid;grid-template-columns:repeat(6,1fr);gap:0.35rem;}
  .twk-swatch{appearance:none;border:1px solid var(--hairline2);background:transparent;
    aspect-ratio:1;padding:0;cursor:crosshair;position:relative;transition:border-color 0.18s;}
  .twk-swatch i{position:absolute;inset:3px;display:block;background:var(--sw);}
  .twk-swatch:hover{border-color:var(--ink-dim);}
  .twk-swatch.on{border-color:var(--ink);}
  .twk-swatch.on::after{content:'';position:absolute;inset:-4px;border:1px solid var(--sw);}

  .twk-seg{display:flex;border:1px solid var(--hairline2);}
  .twk-seg button{flex:1 1 0;min-width:0;appearance:none;background:transparent;border:none;
    border-left:1px solid var(--hairline2);color:var(--ink-mid);cursor:crosshair;
    font-family:inherit;font-size:0.52rem;letter-spacing:0.08em;text-transform:uppercase;
    padding:0.42rem 0.2rem;transition:color 0.15s,background 0.15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .twk-seg button:first-child{border-left:none;}
  .twk-seg button:hover{color:var(--ink);}
  .twk-seg button.on{color:var(--ink);background:var(--bg3);}

  .twk-sel{appearance:none;width:100%;background:var(--bg3);border:1px solid var(--hairline2);
    color:var(--ink);font-family:inherit;font-size:0.56rem;letter-spacing:0.04em;
    padding:0.45rem 0.6rem;cursor:crosshair;}

  .twk-range{appearance:none;width:100%;height:2px;background:var(--hairline2);outline:none;cursor:crosshair;}
  .twk-range::-webkit-slider-thumb{appearance:none;width:11px;height:11px;background:var(--ink);cursor:crosshair;border-radius:0;}
  .twk-range::-moz-range-thumb{width:11px;height:11px;background:var(--ink);cursor:crosshair;border:none;border-radius:0;}

  .twk-note{font-size:0.5rem;line-height:1.6;color:var(--ink-mid);
    border-top:1px solid var(--hairline);padding-top:0.7rem;margin-top:0.3rem;letter-spacing:0.02em;}
  .twk-reset{appearance:none;background:transparent;border:1px solid var(--hairline2);color:var(--ink-mid);
    font-family:inherit;font-size:0.52rem;letter-spacing:0.12em;text-transform:uppercase;
    padding:0.5rem;cursor:crosshair;margin-top:0.5rem;transition:color 0.15s,border-color 0.15s;}
  .twk-reset:hover{color:var(--ink);border-color:var(--ink-dim);}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = presetCSS;
  document.head.appendChild(styleEl);

  /* ---- control builders ---- */
  const elx = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

  function section(label) { return elx('div', 'twk-sec', label); }

  function labelRow(label, valText) {
    const l = elx('div', 'twk-lbl');
    l.innerHTML = '<span>' + label + '</span><em>' + (valText != null ? valText : '') + '</em>';
    return l;
  }

  function swatchRow() {
    const row = elx('div', 'twk-row');
    const wrap = elx('div', 'twk-swatches');
    ACCENTS.forEach((a) => {
      const b = elx('button', 'twk-swatch', '<i></i>');
      b.dataset.key = a.key; b.title = a.name; b.style.setProperty('--sw', hex(a.rgb));
      b.addEventListener('click', () => { set('accent', a.key, true); refreshAccent(); });
      wrap.appendChild(b);
    });
    const lbl = labelRow('Accent');
    row.appendChild(lbl); row.appendChild(wrap);
    row._refresh = () => {
      const a = findAccent(state.accent);
      lbl.querySelector('em').textContent = a.name + ' · ' + hex(a.rgb);
      wrap.querySelectorAll('.twk-swatch').forEach((s) => s.classList.toggle('on', s.dataset.key === state.accent));
    };
    accentRefreshers.push(row._refresh);
    return row;
  }

  function segRow(label, key, opts) {
    // opts: [{val,label}]
    const row = elx('div', 'twk-row');
    row.appendChild(labelRow(label));
    const seg = elx('div', 'twk-seg');
    opts.forEach((o) => {
      const b = elx('button', null, o.label);
      b.dataset.val = o.val;
      b.classList.toggle('on', state[key] === o.val);
      b.addEventListener('click', () => {
        set(key, o.val, true);
        seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.val === o.val));
      });
      seg.appendChild(b);
    });
    row.appendChild(seg);
    return row;
  }

  function selectRow(label, key, opts) {
    const row = elx('div', 'twk-row');
    row.appendChild(labelRow(label));
    const sel = elx('select', 'twk-sel');
    opts.forEach((o) => {
      const op = document.createElement('option');
      op.value = o; op.textContent = o; if (state[key] === o) op.selected = true;
      sel.appendChild(op);
    });
    sel.addEventListener('change', () => set(key, sel.value, true));
    row.appendChild(sel);
    return row;
  }

  function sliderRow(label, key, min, max, step, fmt) {
    const row = elx('div', 'twk-row');
    const lbl = labelRow(label, fmt(state[key]));
    row.appendChild(lbl);
    const r = elx('input', 'twk-range');
    r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = state[key];
    r.addEventListener('input', () => {
      const v = parseFloat(r.value);
      set(key, v, false);
      lbl.querySelector('em').textContent = fmt(v);
    });
    r.addEventListener('change', () => set(key, parseFloat(r.value), true));
    row.appendChild(r);
    return row;
  }

  const accentRefreshers = [];
  function refreshAccent() { accentRefreshers.forEach((fn) => fn()); }

  /* ---- assemble panel ---- */
  const panel = elx('div', 'twk-panel');
  panel.appendChild((function () {
    const hd = elx('div', 'twk-hd', '<b>Tweaks</b>');
    const x = elx('button', 'twk-x', '\u2715'); x.title = 'Close';
    hd.appendChild(x);
    return hd;
  })());
  const body = elx('div', 'twk-body');

  body.appendChild(section('Global'));
  body.appendChild(swatchRow());
  body.appendChild(segRow('Backdrop', 'backdrop', [
    { val: 'ink', label: 'Ink' }, { val: 'warm', label: 'Warm' }, { val: 'pure', label: 'Pure' }
  ]));
  body.appendChild(sliderRow('Hairlines', 'hairlines', 0.3, 2.2, 0.1, (v) => v.toFixed(1) + '\u00D7'));
  body.appendChild(sliderRow('Text contrast', 'contrast', 0, 100, 5, (v) => v > 0 ? '+' + Math.round(v) + '%' : 'base'));

  body.appendChild(section('Type'));
  body.appendChild(selectRow('Display', 'fontDisplay', DISPLAY_FONTS));
  body.appendChild(selectRow('Mono', 'fontMono', MONO_FONTS));
  body.appendChild(sliderRow('Scale', 'scale', 0.9, 1.15, 0.01, (v) => Math.round(v * 100) + '%'));

  body.appendChild(section('Gallery'));
  body.appendChild(sliderRow('Density', 'density', 200, 380, 10, (v) => Math.round(v) + 'px'));
  body.appendChild(segRow('Alive dots', 'dots', [
    { val: 'on', label: 'On' }, { val: 'off', label: 'Off' }
  ]));

  body.appendChild(section('Detail'));
  body.appendChild(segRow('Syntax', 'syntax', [
    { val: 'spectrum', label: 'Spectrum' }, { val: 'mono', label: 'Mono' }, { val: 'warm', label: 'Warm' }
  ]));
  body.appendChild(sliderRow('Code size', 'codeSize', 0.58, 0.86, 0.02, (v) => v.toFixed(2) + 'r'));

  body.appendChild(section('Motion'));
  body.appendChild(segRow('Animations', 'motion', [
    { val: 'on', label: 'On' }, { val: 'off', label: 'Off' }
  ]));
  body.appendChild(segRow('Cursor', 'cursor', [
    { val: 'cross', label: 'Cross' }, { val: 'default', label: 'Arrow' }
  ]));

  body.appendChild(elx('div', 'twk-note',
    'The interface is yours to retune. The artwork keeps its authored palette.'));
  const reset = elx('button', 'twk-reset', 'Reset all');
  reset.addEventListener('click', () => {
    KEYS.forEach((k) => set(k, DEFAULTS[k], true));
    rebuildControls();
  });
  body.appendChild(reset);

  panel.appendChild(body);
  document.body.appendChild(panel);
  refreshAccent();

  function rebuildControls() {
    // simplest: reload reflect by re-rendering segs/selects/sliders/swatches
    panel.remove();
    document.querySelectorAll('.twk-panel').forEach((p) => p.remove());
    // re-run by reloading the module state into a fresh build is heavy;
    // instead just sync DOM controls:
    location.reload();
  }

  /* ---- close + drag + protocol ---- */
  panel.querySelector('.twk-x').addEventListener('click', () => {
    panel.classList.remove('open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  });

  (function makeDraggable() {
    const hd = panel.querySelector('.twk-hd');
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    hd.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('twk-x')) return;
      dragging = true;
      const r = panel.getBoundingClientRect();
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      panel.style.left = ox + 'px'; panel.style.top = oy + 'px';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = (ox + e.clientX - sx) + 'px';
      panel.style.top = (oy + e.clientY - sy) + 'px';
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  })();

  window.addEventListener('message', (e) => {
    const t = e && e.data && e.data.type;
    if (t === '__activate_edit_mode') panel.classList.add('open');
    else if (t === '__deactivate_edit_mode') panel.classList.remove('open');
    else if (t === '__edit_mode_set_keys' && e.data.edits) {
      Object.keys(e.data.edits).forEach((k) => { if (KEYS.indexOf(k) >= 0) set(k, e.data.edits[k], false); });
    }
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
})();
