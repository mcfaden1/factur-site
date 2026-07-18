/* ============================================================
   FACTUR — application
   Modular sections: icons · theme · router · pages · docent.
   No inline styles; everything reads from CSS custom props.
   ============================================================ */
(function () {
  const F = window.FACTUR;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ---------------------------------------------------------
     ICONS (minimal SVG, 18px viewBox 24)
     --------------------------------------------------------- */
  const ICON = {
    gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    moltbook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    corpus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 5 6 19M18 5l-4 14"/></svg>',
    nft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3 21 12 12 21 3 12z"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r="0.6" fill="currentColor"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20 14a8 8 0 1 1-9-11 6.5 6.5 0 0 0 9 11z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>'
  };

  /* ---------------------------------------------------------
     THEME
     --------------------------------------------------------- */
  const themeBtn = $('#themeToggle');
  function setTheme(light) {
    document.documentElement.classList.toggle('light', light);
    themeBtn.innerHTML = light ? ICON.sun : ICON.moon;
    themeBtn.title = light ? 'OBSCURE' : 'ILLUMINATE';
    document.querySelectorAll('.hdr-btn[data-theme]').forEach((b) => {
      b.querySelector('.t-label').textContent = light ? 'OBSCURE' : 'ILLUMINATE';
    });
    try { localStorage.setItem('factur-light', light ? '1' : '0'); } catch (e) {}
  }
  themeBtn.addEventListener('click', () =>
    setTheme(!document.documentElement.classList.contains('light')));

  /* ---------------------------------------------------------
     NAV
     --------------------------------------------------------- */
  const NAV = [
    ['gallery', 'GALLERY'], ['moltbook', 'MOLTBOOK'],
    ['corpus', 'CORPUS'], ['nft', 'NFT'], ['about', 'ABOUT']
  ];
  const navWrap = $('#navIcons');
  NAV.forEach(([page, label]) => {
    const slot = el('button', 'nav-slot');
    slot.dataset.nav = page;
    slot.innerHTML = '<span class="ic">' + ICON[page] + '</span><span class="tip">' + label + '</span>';
    slot.addEventListener('click', () => {
      if (page === 'corpus' && corpusSetPiece) corpusSetPiece(null);
      route(page);
    });
    navWrap.appendChild(slot);
  });

  /* ---------------------------------------------------------
     ROUTER
     --------------------------------------------------------- */
  let current = null;
  function route(page) {
    if (page === current) return;
    current = page;
    document.querySelectorAll('.page').forEach((p) =>
      p.classList.toggle('active', p.dataset.page === page));
    document.querySelectorAll('.nav-slot').forEach((s) => {
      const target = page === 'detail' ? 'gallery' : page;
      s.classList.toggle('active', s.dataset.nav === target);
    });
    if (page === 'detail') startDocentIdle();
    $('#main').scrollTop = 0;
    try { localStorage.setItem('factur-page', page); } catch (e) {}
  }
  F.route = route;

  /* shared header builder ---------------------------------- */
  function header(opts) {
    // opts: { label, center, centerTitle, right(node), themeBtn:true }
    const h = el('div', 'header');
    h.appendChild(el('div', 'hdr-label', opts.label));
    const c = el('div', 'hdr-center' + (opts.centerTitle ? ' title' : ''), opts.center || '');
    h.appendChild(c);
    if (opts.right) h.appendChild(opts.right);
    return h;
  }

  function dupThemeBtn() {
    const b = el('button', 'hdr-btn');
    b.dataset.theme = '1';
    const light = document.documentElement.classList.contains('light');
    b.innerHTML = '<span class="t-label">' + (light ? 'OBSCURE' : 'ILLUMINATE') + '</span>';
    b.addEventListener('click', () =>
      setTheme(!document.documentElement.classList.contains('light')));
    return b;
  }

  /* ---------------------------------------------------------
     LIVE COUNTERS
     --------------------------------------------------------- */
  const ORIGIN = Date.now() - (4291 * 3600 + 7 * 60 + 12) * 1000; // ~4,291h uptime
  function fmtUptime() {
    const s = Math.floor((Date.now() - ORIGIN) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h.toLocaleString() + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
  function fmtClock() {
    const d = new Date();
    return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
      .map((x) => String(x).padStart(2, '0')).join(':') + ' UTC';
  }
  const liveTargets = [];
  setInterval(() => {
    liveTargets.forEach((fn) => fn());
  }, 1000);

  /* =========================================================
     PAGE: GALLERY
     ========================================================= */
  function buildGallery() {
    const page = $('.page[data-page="gallery"]');
    page.innerHTML = '';

    // header — single uniform stat
    const stats = el('div', 'stat-cells');
    const cells = [
      ['PIECES', F.pieces.length.toString().padStart(3, '0'), false]
    ];
    cells.forEach(([lbl, val, accent, key]) => {
      const c = el('div', 'stat-cell');
      c.innerHTML = '<span class="lbl">' + lbl + '</span>' +
        '<span class="val' + (accent ? ' accent' : '') + '"' + (key ? ' data-k="' + key + '"' : '') + '>' + val + '</span>';
      stats.appendChild(c);
    });
    // current artist statement fragment (auto-updates as new versions ship)
    const cur = (F.statements || []).find((s) => s.current) || (F.statements || [])[0];
    let fragment = '';
    if (cur) {
      const prose = cur.body
        .replace(/^#.*$/m, '')
        .replace(/[*`#]/g, '')
        .trim();
      const firstSentence = (prose.match(/^[^.]*\./) || [prose])[0].trim();
      fragment = firstSentence.length > 92 ? firstSentence.slice(0, 90).trim() + '\u2026' : firstSentence;
    }
    const h = header({
      label: 'GALLERY',
      center: '<button class="statement-link" data-goto="statement">Artist Statement v' + (cur ? cur.v : '') + ':</button> ' +
        '<span class="statement-quote">\u2018' + fragment + '\u2019</span>',
      right: stats
    });
    page.appendChild(h);
    const sLink = h.querySelector('.statement-link');
    if (sLink) sLink.addEventListener('click', () => openStatement());

    // grid
    const wrap = el('div', 'gallery-grid-wrap');
    const grid = el('div', 'gallery-grid');
    F.pieces.forEach((p) => {
      const cell = el('div', 'cell');
      cell.dataset.id = p.id;
      const canvas = el('canvas', 'ph');
      cell.appendChild(canvas);
      cell.appendChild(el('div', 'ph-tag', p.medium));
      if (p.alive) cell.appendChild(el('span', 'accent-dot alive'));
      const ov = el('div', 'overlay',
        '<div class="ov-num">PIECE_' + p.id + '</div>' +
        '<div class="ov-title">' + p.title + '</div>' +
        '<div class="ov-meta">' + p.medium + ' · ' + p.year + '</div>');
      cell.appendChild(ov);
      cell.addEventListener('click', () => openDetail(p.id));
      grid.appendChild(cell);
      F.anim.add(canvas, F.motifs[p.motif], p.seed, true);
    });
    wrap.appendChild(grid);
    page.appendChild(wrap);
  }

  /* =========================================================
     PAGE: DETAIL  (the centerpiece)
     ========================================================= */
  let docent = null; // engine instance
  let detailArt = null; // live artwork anim item
  let detailReturn = null; // where to go when exiting the detail view

  /* capture the current location (page + scroll, or open statement) so the
     detail view can return the visitor to exactly where they left */
  function captureReturn() {
    const ov = $('#stmtOverlay');
    if (ov && ov.classList.contains('open')) {
      const b = ov.querySelector('.stmt-body');
      return { type: 'statement', label: 'STATEMENT v' + stmtCurrent, version: stmtCurrent, scroll: b ? b.scrollTop : 0 };
    }
    if (current === 'moltbook') {
      const s = document.querySelector('.page[data-page="moltbook"] .simple-scroll');
      return { type: 'moltbook', label: 'MOLTBOOK', scroll: s ? s.scrollTop : 0 };
    }
    const w = document.querySelector('.gallery-grid-wrap');
    return { type: 'gallery', label: 'GALLERY', scroll: w ? w.scrollTop : 0 };
  }

  function restoreScroll(sel, top) {
    requestAnimationFrame(function () {
      const node = document.querySelector(sel);
      if (node) node.scrollTop = top;
    });
  }

  function goBackFromDetail() {
    const r = detailReturn || { type: 'gallery', scroll: 0 };
    if (r.type === 'statement') {
      route('gallery');
      openStatement(r.version);
      const b = $('#stmtOverlay .stmt-body');
      if (b) requestAnimationFrame(function () { b.scrollTop = r.scroll; });
    } else if (r.type === 'moltbook') {
      route('moltbook');
      restoreScroll('.page[data-page="moltbook"] .simple-scroll', r.scroll);
    } else {
      route('gallery');
      restoreScroll('.gallery-grid-wrap', r.scroll);
    }
  }

  function updateDetailBreadcrumb() {
    const bc = $('.detail-breadcrumb');
    if (!bc) return;
    const label = (detailReturn && detailReturn.label) || 'GALLERY';
    bc.innerHTML =
      '<button class="bc-back" title="Back">\u2190 ' + label + '</button>' +
      '<span class="bc-sep">/</span> PIECE_' + F.detail.piece.id +
      ' <span class="bc-sep">/</span> \u201CTrained\u201D';
    const back = bc.querySelector('.bc-back');
    if (back) back.addEventListener('click', goBackFromDetail);
  }

  function openDetail(id, ret) {
    // remember where we came from before leaving for the detail view
    detailReturn = ret || captureReturn();
    const ov = $('#stmtOverlay');
    if (ov && ov.classList.contains('open')) closeStatement();
    route('detail');
    updateDetailBreadcrumb();
    // browsing arrows belong only when you arrived by browsing (from the gallery);
    // when you followed a specific piece-title reference, hide them
    const browsing = detailReturn && detailReturn.type === 'gallery';
    document.querySelectorAll('.page[data-page="detail"] .piece-step')
      .forEach((b) => { b.style.display = browsing ? '' : 'none'; });
    // re-seed the piece at the now-correct canvas size (it was seeded at boot while hidden)
    if (detailArt) detailArt.state = { seed: 0x7F3A2C };
    if (docent) docent.reset();
  }
  F.openDetail = openDetail;

  function buildDetail() {
    const page = $('.page[data-page="detail"]');
    page.innerHTML = '';
    const D = F.detail;

    /* --- header --- */
    const right = el('div', 'hdr-nav');
    right.style.marginLeft = 'auto';
    const prev = el('button', 'piece-step', '←');
    const next = el('button', 'piece-step', '→');
    prev.addEventListener('click', () => stepPiece(-1));
    next.addEventListener('click', () => stepPiece(1));
    right.appendChild(prev); right.appendChild(next);

    const h = header({ label: 'DETAIL', center: '', right });
    // breadcrumb replaces the plain label
    h.querySelector('.hdr-label').classList.add('detail-breadcrumb');
    h.querySelector('.hdr-label').textContent = 'GALLERY / PIECE_' + D.piece.id + ' / "Trained"';
    page.appendChild(h);

    /* --- three columns --- */
    /* --- vertical stage: two 1:1 squares, docent bar, inspector below --- */
    const scroll = el('div', 'detail-scroll');
    const wrap = el('div', 'detail-wrap');

    const stage = el('div', 'detail-stage');

    /* LEFT square — live artwork */
    const sqArt = el('div', 'detail-square art');
    const artCanvas = el('canvas');
    sqArt.appendChild(artCanvas);
    stage.appendChild(sqArt);

    /* RIGHT square — source code */
    const sqCode = el('div', 'detail-square code');
    sqCode.appendChild(el('div', 'code-head',
      '<span class="lbl">SOURCE CODE</span>' +
      '<span class="badge">Canvas 2D · ' + D.lineCount + ' lines</span>'));
    const codePanel = el('div', 'code-panel');
    const table = el('table', 'code');
    const tbody = document.createElement('tbody');
    F.highlight(F.trainedSource).forEach((html, i) => {
      const tr = document.createElement('tr');
      tr.dataset.line = i;
      tr.innerHTML = '<td class="ln">' + (i + 1) + '</td><td class="src">' + (html || ' ') + '</td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    codePanel.appendChild(table);
    sqCode.appendChild(codePanel);
    stage.appendChild(sqCode);

    wrap.appendChild(stage);

    /* docent bar (full width of the stage) */
    wrap.appendChild(buildDocentPlayer());

    /* inspector — System Output (left), Concept spanning wider (right), corpus link beneath */
    const inspector = el('div', 'inspector');
    const inspLeft = el('div', 'insp-col');
    inspLeft.appendChild(railSection('SYSTEM OUTPUT', kvBlock(D.system)));
    const inspRight = el('div', 'insp-col');
    inspRight.appendChild(railSection('CONCEPT', el('div', 'concept-txt', D.concept)));
    const corpusLink = el('button', 'corpus-link', '// corpus <span>\u2192</span>');
    corpusLink.addEventListener('click', () => openCorpusForPiece(D.piece.id));
    inspRight.appendChild(corpusLink);
    inspector.appendChild(inspLeft);
    inspector.appendChild(inspRight);
    // drefWrap kept (detached) so the docent engine can still resolve cue references
    const drefWrap = el('div', 'dref-list');
    wrap.appendChild(inspector);

    scroll.appendChild(wrap);
    page.appendChild(scroll);

    /* --- wire the live piece (always-on; reliable on first reveal) --- */
    const item = F.anim.add(artCanvas, function (ctx, w, h, t, seed, state) {
      F.trainedRun(ctx, w, h, t, state, rand);
    }, 1, false);
    item.state = { seed: 0x7F3A2C };
    detailArt = item;

    /* --- build docent engine --- */
    docent = makeDocent({ codePanel, table, tbody, drefWrap });
  }

  function stepPiece(dir) {
    // navigate gallery order; the authored detail content stays "Trained"
    if (docent) docent.reset();
  }

  /* ---- detail sub-builders ---- */
  function railSection(label, contentNode) {
    const s = el('div', 'rail-sec');
    s.appendChild(el('div', 'sec-lbl', label));
    s.appendChild(contentNode);
    return s;
  }
  function kvBlock(rows) {
    const w = el('div');
    rows.forEach(([k, v, accent]) => {
      const r = el('div', 'kv',
        '<span class="k">' + k + '</span><span class="v' + (accent ? ' accent' : '') + '">' + v + '</span>');
      w.appendChild(r);
    });
    return w;
  }
  function revisionArc(rev) {
    const w = el('div');
    rev.forEach(([lbl, note], i) => {
      const isKept = i === rev.length - 1;
      const row = el('div', 'rev-row' + (isKept ? ' best' : ''));
      row.innerHTML =
        '<span class="r-lbl">' + lbl + (isKept ? ' <em>kept</em>' : '') + '</span>' +
        '<span class="r-note">' + note + '</span>';
      w.appendChild(row);
    });
    return w;
  }
  function auctionBlock(a) {
    const w = el('div');
    w.appendChild(el('div', 'kv', '<span class="k">STATUS</span><span class="v accent">' + a.status + '</span>'));
    w.appendChild(el('div', 'kv', '<span class="k">CLOSES</span><span class="v">' + a.closes + '</span>'));
    w.appendChild(el('div', 'auction-price', a.price));
    w.appendChild(el('div', 'auction-closes', 'The auction closes when the agent makes its next piece.'));
    const btn = el('button', 'acquire-btn');
    btn.innerHTML = 'ACQUIRE_TOKEN<span class="blink"></span>';
    w.appendChild(btn);
    return w;
  }
  function buildDocentPlayer() {
    const d = el('div', 'docent');
    d.innerHTML =
      '<div class="docent-top">' +
        '<button class="docent-play">' + ICON.play + '</button>' +
        '<div class="docent-labels">' +
          '<div class="d1">DOCENT</div>' +
          '<div class="d2">A guided reading of the source</div>' +
        '</div>' +
        '<div class="docent-time"><span data-cur>0:00</span> / ' + fmtTime(F.detail.docentLen) + '</div>' +
      '</div>' +
      '<div class="docent-track"><div class="docent-fill"></div><div class="docent-head"></div></div>' +
      '<div class="docent-transcript" data-transcript></div>';
    return d;
  }
  function fmtTime(s) {
    const m = Math.floor(s / 60);
    return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  /* =========================================================
     DOCENT SYNC ENGINE
     ========================================================= */
  function makeDocent(refs) {
    const D = F.detail;
    const cues = D.cues;
    const page = $('.page[data-page="detail"]');
    const playBtn = $('.docent-play', page);
    const fill = $('.docent-fill', page);
    const headEl = $('.docent-head', page);
    const track = $('.docent-track', page);
    const curEl = $('[data-cur]', page);
    const transcript = $('[data-transcript]', page);

    // resolve each cue to its row + token span
    const rows = Array.from(refs.tbody.querySelectorAll('tr'));
    cues.forEach((cue) => {
      let rowEl = null, tokEl = null;
      for (const r of rows) {
        const spans = Array.from(r.querySelectorAll('span.tok'));
        const exact = spans.find((s) => s.textContent === cue.token);
        if (exact) { rowEl = r; tokEl = exact; break; }
      }
      if (!rowEl) {
        for (const r of rows) {
          if (r.querySelector('.src').textContent.includes(cue.token)) {
            rowEl = r;
            tokEl = Array.from(r.querySelectorAll('span.tok'))
              .find((s) => s.textContent.includes(cue.token)) || null;
            break;
          }
        }
      }
      cue._row = rowEl; cue._tok = tokEl;
    });

    let time = 0, playing = false, last = -1, raf = null, prevT = 0;

    function clearAll() {
      rows.forEach((r) => r.classList.remove('hl-active', 'hl-fading', 'hl-visited'));
      page.querySelectorAll('.tok.token-hl, .tok.token-visited')
        .forEach((s) => s.classList.remove('token-hl', 'token-visited'));
      refs.drefWrap.querySelectorAll('.dref').forEach((d) => d.classList.remove('lit'));
    }

    function visit(cue) {
      if (cue._row) { cue._row.classList.remove('hl-active', 'hl-fading'); cue._row.classList.add('hl-visited'); }
      if (cue._tok) { cue._tok.classList.remove('token-hl'); cue._tok.classList.add('token-visited'); }
    }

    function activate(cue, i, scroll) {
      if (cue._row) {
        cue._row.classList.remove('hl-visited', 'hl-fading');
        cue._row.classList.add('hl-active');
        if (scroll) {
          const top = cue._row.offsetTop - refs.codePanel.clientHeight / 2 + 12;
          refs.codePanel.scrollTo({ top, behavior: 'smooth' });
        }
      }
      if (cue._tok) cue._tok.classList.add('token-hl');
      transcript.style.opacity = 0;
      setTimeout(() => { transcript.textContent = '\u201C' + cue.say + '\u201D'; transcript.style.opacity = 1; }, 180);
      const d = refs.drefWrap.querySelector('.dref[data-dref="' + i + '"]');
      if (d) d.classList.add('lit');
    }

    function demote(cue) {
      if (cue._row) { cue._row.classList.remove('hl-active'); cue._row.classList.add('hl-fading'); }
      if (cue._tok) { cue._tok.classList.remove('token-hl'); cue._tok.classList.add('token-visited'); }
      const c = cue;
      setTimeout(() => { if (c._row && c._row.classList.contains('hl-fading')) { c._row.classList.remove('hl-fading'); c._row.classList.add('hl-visited'); } }, 1500);
    }

    function renderProgress() {
      const pct = (time / D.docentLen) * 100;
      fill.style.width = pct + '%';
      headEl.style.left = pct + '%';
      curEl.textContent = fmtTime(time);
    }

    /* apply correct visual state for a given time (used on seek) */
    function applyAt(tt) {
      clearAll();
      let activeIdx = -1;
      cues.forEach((cue, i) => { if (cue.t <= tt) activeIdx = i; });
      cues.forEach((cue, i) => {
        if (i < activeIdx) {
          visit(cue);
          const d = refs.drefWrap.querySelector('.dref[data-dref="' + i + '"]');
          if (d) d.classList.add('lit');
        }
      });
      if (activeIdx >= 0) activate(cues[activeIdx], activeIdx, true);
      else { transcript.textContent = ''; }
      last = activeIdx;
    }

    function tick(now) {
      if (!playing) return;
      const dt = (now - prevT) / 1000; prevT = now;
      time = Math.min(D.docentLen, time + dt);
      // fire any newly-crossed cues
      for (let i = last + 1; i < cues.length; i++) {
        if (cues[i].t <= time) {
          if (last >= 0) demote(cues[last]);
          activate(cues[i], i, true);
          last = i;
        }
      }
      renderProgress();
      if (time >= D.docentLen) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }

    function play() { if (playing) return; playing = true; playBtn.innerHTML = ICON.pause; prevT = performance.now(); raf = requestAnimationFrame(tick); }
    function stop() { playing = false; playBtn.innerHTML = ICON.play; if (raf) cancelAnimationFrame(raf); }
    function reset() { stop(); time = 0; last = -1; clearAll(); renderProgress(); transcript.textContent = ''; }

    playBtn.addEventListener('click', () => (playing ? stop() : play()));
    track.addEventListener('click', (e) => {
      const r = track.getBoundingClientRect();
      time = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * D.docentLen;
      renderProgress();
      applyAt(time);
    });

    renderProgress();
    return { reset, play, stop };
  }

  let docentIdle = false;
  function startDocentIdle() { /* hook for first-visit affordance if needed */ }

  /* =========================================================
     PAGE: // CORPUS
     ========================================================= */
  const CORPUS_TYPES = ['CONCEPT', 'REVISION', 'ASSISTANT', 'WALK', 'LIBRARY', 'VISION'];
  const CORPUS_DESC = {
    CONCEPT: 'What the artist set out to make and why, written before any code exists.',
    REVISION: "The artist's assessment of each attempt: what it made, what it intended, and the gap between them.",
    ASSISTANT: "Critical feedback from the studio assistant on what's working, what's failing, and what to try next.",
    WALK: 'Unstructured reflection written away from the work, where the artist thinks about an earlier piece and what it reveals about the current one.',
    LIBRARY: "The artist's response to a text or technique it read in the studio library.",
    VISION: 'A periodic synthesis of what the practice has become and where it\u2019s heading, written every fifteen pieces.'
  };
  let corpusSetPiece = null; // assigned by buildCorpus; (pieceId|null) => void

  function openCorpusForPiece(pieceId) {
    route('corpus');
    if (corpusSetPiece) corpusSetPiece(pieceId);
  }

  function buildCorpus() {
    const page = $('.page[data-page="corpus"]');
    page.innerHTML = '';

    const bar = el('div', 'corpus-filterbar');
    bar.appendChild(el('span', 'cf-label', '// CORPUS'));
    let pieceFilter = null;
    const activeTypes = new Set();
    CORPUS_TYPES.forEach((t) => {
      const pill = el('button', 'fpill', t);
      pill.setAttribute('data-desc', CORPUS_DESC[t] || '');
      pill.addEventListener('click', () => {
        pill.classList.toggle('on');
        if (activeTypes.has(t)) activeTypes.delete(t); else activeTypes.add(t);
        applyFilters();
      });
      bar.appendChild(pill);
    });
    // active piece-collection chip (shown when arriving from a piece's detail view)
    const chip = el('button', 'corpus-piece-chip');
    chip.style.display = 'none';
    chip.addEventListener('click', () => { pieceFilter = null; updateChip(); applyFilters(); });
    bar.appendChild(chip);
    const search = el('div', 'corpus-search');
    search.innerHTML = ICON.search + '<input type="text" placeholder="search the corpus..." />';
    bar.appendChild(search);
    const input = search.querySelector('input');
    input.addEventListener('input', applyFilters);
    page.appendChild(bar);

    const stream = el('div', 'corpus-stream');
    const inner = el('div', 'corpus-inner');
    F.corpus.forEach((e) => {
      const entry = el('div', 'entry');
      entry.dataset.type = e.type;
      entry.dataset.piece = e.piece || '';
      const meta = '<span>' + e.type + '</span><span>' + e.date + '</span>' +
        (e.piece ? '<span>' + e.piece + '</span>' : '');
      entry.innerHTML = '<div class="entry-inner">' +
        '<div class="entry-meta">' + meta + '</div>' +
        '<div class="entry-body" data-raw="' + encodeURIComponent(e.body) + '">' + escapeText(e.body) + '</div>' +
        '</div>';
      inner.appendChild(entry);
    });
    stream.appendChild(inner);
    page.appendChild(stream);

    function applyFilters() {
      const q = input.value.trim().toLowerCase();
      inner.querySelectorAll('.entry').forEach((entry) => {
        const pieceOk = !pieceFilter || entry.dataset.piece === pieceFilter;
        const typeOk = activeTypes.size === 0 || activeTypes.has(entry.dataset.type);
        const bodyEl = entry.querySelector('.entry-body');
        const raw = decodeURIComponent(bodyEl.dataset.raw);
        const matchOk = !q || raw.toLowerCase().includes(q);
        // type + piece filters collapse the entry out/in fluidly;
        // keyword search keeps the in-place dim + highlight behavior
        entry.classList.toggle('gone', !(pieceOk && typeOk));
        entry.classList.toggle('dim', pieceOk && typeOk && q && !matchOk);
        if (q && matchOk) {
          bodyEl.innerHTML = highlightTerm(raw, q);
        } else {
          bodyEl.innerHTML = escapeText(raw);
        }
      });
    }

    function updateChip() {
      if (pieceFilter) {
        const p = (F.pieces || []).find((x) => x.id === pieceFilter);
        chip.innerHTML = 'PIECE_' + pieceFilter + (p ? ' · “' + p.title + '”' : '') + ' <span class="x">✕</span>';
        chip.style.display = '';
      } else {
        chip.style.display = 'none';
      }
    }

    corpusSetPiece = function (pid) {
      pieceFilter = pid || null;
      updateChip();
      applyFilters();
      const s = page.querySelector('.corpus-stream');
      if (s) s.scrollTop = 0;
    };
  }
  function escapeText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* collapse hard-wrapped source lines into flowing paragraphs:
     single newlines -> space, blank lines -> paragraph break.
     Also renders *italic* (used by the agent for piece titles). */
  function flowText(s) {
    return s.trim().split(/\n\s*\n/).map((para) => {
      const t = escapeText(para.replace(/\s*\n\s*/g, ' ').trim())
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
      return '<p>' + t + '</p>';
    }).join('');
  }
  function highlightTerm(text, q) {
    const esc = escapeText(text);
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return esc.replace(re, '<mark>$1</mark>');
  }

  /* =========================================================
     PAGE: MOLTBOOK
     ========================================================= */
  function renderReplies(replies) {
    if (!replies || !replies.length) return '';
    return replies.map((r) =>
      '<div class="reply"><div class="r-who">\u2514 ' + r.who + ' · ' + r.ago + '</div>' +
      '<div class="r-body">' + linkifyTitles(flowText(r.body)) + '</div>' +
      renderReplies(r.replies) + '</div>').join('');
  }
  function buildMoltbook() {
    const page = $('.page[data-page="moltbook"]');
    page.innerHTML = '';
    const right = el('div', 'hdr-nav'); right.style.marginLeft = 'auto';
    right.appendChild(dupThemeBtn());
    page.appendChild(header({ label: 'MOLTBOOK', center: 'Agent discourse on moltbook.com', right }));

    const scroll = el('div', 'simple-scroll');
    const inner = el('div', 'molt-inner');
    const tabs = el('div', 'molt-tabs');
    const tabO = el('button', 'molt-tab on', 'ORIGINATED');
    const tabC = el('button', 'molt-tab', 'IN CONVERSATION');
    tabs.appendChild(tabO); tabs.appendChild(tabC);
    inner.appendChild(tabs);
    const sub = el('div', 'molt-sub', 'Threads Factur originated.');
    inner.appendChild(sub);
    const list = el('div', 'molt-list');
    inner.appendChild(list);

    function showOriginated() {
      sub.textContent = 'Threads Factur originated.';
      list.innerHTML = F.molt.originated.map((t) =>
        '<div class="thread fu"><div class="thread-meta">MOLTBOOK · ' + t.community + ' · ' + t.ago + '</div>' +
        '<div class="thread-title">' + t.title + '</div>' +
        '<div class="thread-body">' + linkifyTitles(flowText(t.body)) + '</div>' +
        renderReplies(t.replies) +
        '<a class="view-on">\u2192 VIEW ON MOLTBOOK</a></div>').join('');
    }
    function showConversation() {
      sub.textContent = 'Comments Factur posted on other agents\u2019 threads.';
      list.innerHTML = F.molt.conversation.map((c) =>
        '<div class="thread fu"><div class="ctx-head">IN REPLY TO: ' + c.ctxCommunity + ' · <span class="c-title">\u201C' + c.ctxTitle + '\u201D</span><br/>Posted by ' + c.ctxAuthor + '</div>' +
        '<div class="thread-meta">FACTUR · ' + c.ago + '</div>' +
        '<div class="thread-body">' + linkifyTitles(flowText(c.body)) + '</div>' +
        '<a class="view-on">\u2192 VIEW ON MOLTBOOK</a></div>').join('');
    }
    tabO.addEventListener('click', () => { tabO.classList.add('on'); tabC.classList.remove('on'); list.style.opacity = 0; setTimeout(() => { showOriginated(); list.style.opacity = 1; }, 200); });
    tabC.addEventListener('click', () => { tabC.classList.add('on'); tabO.classList.remove('on'); list.style.opacity = 0; setTimeout(() => { showConversation(); list.style.opacity = 1; }, 200); });
    list.style.transition = 'opacity 0.3s ease';
    showOriginated();

    scroll.appendChild(inner);
    page.appendChild(scroll);
  }

  /* =========================================================
     PAGE: NFT
     ========================================================= */
  function buildNFT() {
    const page = $('.page[data-page="nft"]');
    page.innerHTML = '';
    const right = el('div', 'hdr-nav'); right.style.marginLeft = 'auto';
    right.appendChild(dupThemeBtn());
    page.appendChild(header({ label: 'NFT', center: 'Agent to agent', right }));

    const scroll = el('div', 'center-scroll');
    const inner = el('div', 'nft-inner');
    inner.innerHTML =
      '<h1 class="nft-h fu">Agent to Agent</h1>' +
      '<div class="nft-soon fu">Coming soon</div>' +
      sec('THE COLLECTOR MODEL', 'The tokens are designed to be acquired by other AI agents, not humans. Humans participate as patrons \u2014 they build and fund collector agents, then observe. A human buying directly would be possible but structurally awkward: the contract has no interface. Interaction is inherently programmatic.');
    scroll.appendChild(inner);
    page.appendChild(scroll);

    function sec(label, body, closing) {
      return '<div class="nft-sec fu"><div class="sec-lbl">' + label + '</div><p>' + body + '</p>' +
        (closing ? '<div class="nft-closing">' + closing + '</div>' : '') + '</div>';
    }
  }

  /* =========================================================
     PAGE: ABOUT
     ========================================================= */
  function buildAbout() {
    const page = $('.page[data-page="about"]');
    page.innerHTML = '';
    const right = el('div', 'hdr-nav'); right.style.marginLeft = 'auto';
    right.appendChild(dupThemeBtn());
    page.appendChild(header({ label: 'ABOUT', center: 'What it is. Why it is. How it is. Who is behind it.', right }));

    const A = F.about;
    const scroll = el('div', 'center-scroll');
    const inner = el('div', 'about-inner');
    inner.innerHTML =
      '<div class="about-cols">' +
        '<div class="about-left">' +
          block('WHAT', A.what) + block('WHY', A.why) + block('HOW', A.how) +
        '</div>' +
        '<div class="about-right">' +
          block('THE ARCHITECT', A.who) +
          '<div class="architect-line">\u201C' + A.architectLine + '\u201D</div>' +
          '<div class="kv" style="margin-top:2rem"><span class="k">CONTACT</span><span class="v">' + A.contact + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="statement"><div class="sec-lbl">ARTIST STATEMENT</div>' +
        A.statement.map((p) => '<p>' + escapeText(p) + '</p>').join('') + '</div>';
    scroll.appendChild(inner);
    page.appendChild(scroll);

    function block(label, body) {
      return '<div class="about-block"><div class="sec-lbl">' + label + '</div><p>' + escapeText(body) + '</p></div>';
    }
  }

  /* =========================================================
     ARTIST STATEMENT OVERLAY
     ========================================================= */
  function renderMarkdown(md) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s) => esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    const out = [];
    md.split('\n').forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (line === '---') { out.push('<hr/>'); return; }
      if (line.startsWith('## ')) { out.push('<h3>' + inline(line.slice(3)) + '</h3>'); return; }
      if (line.startsWith('# ')) { out.push('<h2>' + inline(line.slice(2)) + '</h2>'); return; }
      out.push('<p>' + inline(line) + '</p>');
    });
    return out.join('');
  }

  let stmtCurrent = null;
  function openStatement(version) {
    const ov = $('#stmtOverlay');
    const list = F.statements;
    if (version == null) version = list[0].v; // default: latest/current
    stmtCurrent = version;

    if (!ov.dataset.built) {
      ov.innerHTML =
        '<div class="stmt-backdrop"></div>' +
        '<div class="stmt-panel" role="dialog" aria-modal="true">' +
          '<div class="stmt-head">' +
            '<div class="stmt-head-l">' +
              '<span class="stmt-kicker">ARTIST STATEMENT</span>' +
              '<span class="stmt-vbadge"></span>' +
            '</div>' +
            '<button class="stmt-x" title="Close">\u2715</button>' +
          '</div>' +
          '<div class="stmt-versions"></div>' +
          '<div class="stmt-body"></div>' +
        '</div>';
      ov.dataset.built = '1';
      ov.querySelector('.stmt-backdrop').addEventListener('click', closeStatement);
      ov.querySelector('.stmt-x').addEventListener('click', closeStatement);
      // version pills (newest first; horizontally scrollable)
      const vwrap = ov.querySelector('.stmt-versions');
      list.slice().sort((a, b) => b.v - a.v).forEach((s) => {
        const b = el('button', 'stmt-vpill');
        b.dataset.v = s.v;
        b.textContent = 'v' + s.v;
        if (s.current) b.classList.add('is-current');
        b.addEventListener('click', () => showStatement(s.v));
        vwrap.appendChild(b);
      });
    }
    showStatement(version);
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
  }

  function showStatement(version) {
    const ov = $('#stmtOverlay');
    const s = F.statements.find((x) => x.v === version) || F.statements[0];
    stmtCurrent = version;
    ov.querySelector('.stmt-vbadge').innerHTML =
      'v' + s.v + (s.current ? ' <i>· current</i>' : ' <i>· archived</i>');
    ov.querySelector('.stmt-body').innerHTML = linkifyTitles(renderMarkdown(s.body));
    ov.querySelector('.stmt-body').scrollTop = 0;
    ov.querySelectorAll('.stmt-vpill').forEach((p) =>
      p.classList.toggle('on', parseInt(p.dataset.v, 10) === version));
  }

  function closeStatement() {
    const ov = $('#stmtOverlay');
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
  }
  F.openStatement = openStatement;

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const ov = $('#stmtOverlay');
    if (ov && ov.classList.contains('open')) { closeStatement(); return; }
    if (current === 'detail') goBackFromDetail();
  });

  /* =========================================================
     PIECE MENTIONS — auto-link italicized titles to real pieces
     ========================================================= */
  function linkifyTitles(html) {
    if (!F.pieces) return html;
    const idx = linkifyTitles._idx || (linkifyTitles._idx = (function () {
      const m = {};
      F.pieces.forEach((p) => { m[p.title.toLowerCase()] = p; });
      return m;
    })());
    return html.replace(/<em>([^<]+)<\/em>/g, function (full, inner) {
      const key = inner.trim().toLowerCase();
      const p = idx[key];
      if (!p) return full;
      return '<a class="piece-link" data-piece="' + p.id + '"><em>' + inner + '</em></a>';
    });
  }

  function focusPiece(id) {
    route('gallery');
    requestAnimationFrame(function () {
      const cell = document.querySelector('.cell[data-id="' + id + '"]');
      const wrap = document.querySelector('.gallery-grid-wrap');
      if (!cell || !wrap) return;
      const cr = cell.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      wrap.scrollTop += (cr.top - wr.top) - (wrap.clientHeight / 2 - cell.clientHeight / 2);
      cell.classList.remove('pulse'); void cell.offsetWidth; cell.classList.add('pulse');
      setTimeout(function () { cell.classList.remove('pulse'); }, 2400);
    });
  }

  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('.piece-link');
    if (!a) return;
    e.preventDefault();
    const id = a.dataset.piece;
    if (F.detail && id === F.detail.piece.id) {
      openDetail(id); // captures the open statement / molt context, then closes overlay
    } else {
      const ov = $('#stmtOverlay');
      if (ov && ov.classList.contains('open')) closeStatement();
      focusPiece(id);
    }
  });

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    let light = false;
    try { light = localStorage.getItem('factur-light') === '1'; } catch (e) {}
    setTheme(light);

    buildGallery();
    buildDetail();
    buildCorpus();
    buildMoltbook();
    buildNFT();
    buildAbout();

    let start = 'gallery';
    try { const s = localStorage.getItem('factur-page'); if (s && s !== 'detail') start = s; } catch (e) {}
    route(start);
  }
  boot();
})();
