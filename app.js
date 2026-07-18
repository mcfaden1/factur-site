/* ============================================================
   FACTUR — application
   Modular sections: icons · theme · router · pages · docent.
   No inline styles; everything reads from CSS custom props.

   Data: pieces / corpus / statements / site_meta are baked to
   /data/*.json and fetched at boot. Heavy assets (artwork
   HTML, video thumbnails, docent mp3) + live API are served from
   the droplet over HTTPS at API_BASE.
   ============================================================ */
(function () {
  const F = window.FACTUR;

  /* ---------------------------------------------------------
     CONFIG
     --------------------------------------------------------- */
  const API_BASE = 'https://api.factur.art';
  const asset = (n, file) => API_BASE + '/artwork/' + n + '/' + file;
  const fetchJSON = (path) =>
    fetch(path).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

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
    $('#main').scrollTop = 0;
    try { localStorage.setItem('factur-page', page); } catch (e) {}
  }
  F.route = route;

  /* shared header builder ---------------------------------- */
  function header(opts) {
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

  /* =========================================================
     PAGE: GALLERY
     ========================================================= */
  /* lazy video manager — assign src + play on first reveal, pause
     off-screen, so 200+ clips don't all load/decode at once */
  let cellObserver = null;
  function ensureCellObserver() {
    if (cellObserver) return cellObserver;
    cellObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.dataset.src && !v.getAttribute('src')) { v.setAttribute('src', v.dataset.src); v.load(); }
          const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
        } else {
          // pause AND release the decoder — otherwise every cell scrolled
          // past keeps a live decoder and playback degrades toward the
          // browser's simultaneous-video limit. dataset.src lets it reload.
          v.pause();
          if (v.getAttribute('src')) { v.removeAttribute('src'); v.load(); }
        }
      }
    }, { rootMargin: '200px' });
    return cellObserver;
  }

  function buildGallery() {
    const page = $('.page[data-page="gallery"]');
    page.innerHTML = '';
    if (cellObserver) cellObserver.disconnect();

    // header — single uniform stat
    const stats = el('div', 'stat-cells');
    const total = (F.siteMeta && F.siteMeta.total_pieces) || F.pieces.length;
    const statCell = el('div', 'stat-cell');
    statCell.innerHTML = '<span class="lbl">PIECES</span><span class="val">' +
      String(total).padStart(3, '0') + '</span>';
    stats.appendChild(statCell);

    // current artist statement fragment (auto-updates as new versions ship)
    const cur = (F.statements || []).find((s) => s.current) || (F.statements || [])[0];
    let fragment = '';
    if (cur) {
      const prose = cur.body.replace(/^#.*$/m, '').replace(/[*`#]/g, '').trim();
      const firstSentence = (prose.match(/^[^.]*\./) || [prose])[0].trim();
      fragment = firstSentence.length > 92 ? firstSentence.slice(0, 90).trim() + '…' : firstSentence;
    }
    const h = header({
      label: 'GALLERY',
      center: '<button class="statement-link" data-goto="statement">Artist Statement v' + (cur ? cur.v : '') + ':</button> ' +
        '<span class="statement-quote">‘' + fragment + '’</span>',
      right: stats
    });
    page.appendChild(h);
    const sLink = h.querySelector('.statement-link');
    if (sLink) sLink.addEventListener('click', () => openStatement());

    // grid
    const wrap = el('div', 'gallery-grid-wrap');
    const grid = el('div', 'gallery-grid');
    const io = ensureCellObserver();
    F.pieces.forEach((p) => {
      const cell = el('div', 'cell');
      cell.dataset.id = p.id;

      let media;
      if (p.has_video) {
        media = el('video', 'ph');
        media.muted = true; media.loop = true; media.playsInline = true;
        media.setAttribute('muted', ''); media.setAttribute('playsinline', ''); media.setAttribute('loop', '');
        media.preload = 'none';
        media.dataset.src = asset(p.num, 'thumb.mp4');
        io.observe(media);
      } else {
        media = el('img', 'ph');
        media.loading = 'lazy';
        media.alt = p.title;
        media.src = asset(p.num, 'thumb.png');
      }
      cell.appendChild(media);

      cell.appendChild(el('div', 'ph-tag', p.medium));
      if (p.alive) cell.appendChild(el('span', 'accent-dot alive'));
      const ov = el('div', 'overlay',
        '<div class="ov-num">PIECE_' + p.id + '</div>' +
        '<div class="ov-title">' + p.title + '</div>' +
        '<div class="ov-meta">' + p.medium + ' · ' + p.year + '</div>');
      cell.appendChild(ov);
      cell.addEventListener('click', () => openDetail(p.id));
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);
    page.appendChild(wrap);
  }

  /* =========================================================
     PAGE: DETAIL  (per-piece)
     ========================================================= */
  let detailReturn = null;   // where to return when exiting detail
  let currentPiece = null;
  let artFrameRO = null;     // keeps the live-art iframe scaled to its square

  const PIECE_NATIVE = 1080; // pieces are authored at a fixed 1080x1080

  function pieceById(id) { return (F.pieces || []).find((p) => p.id === id); }

  /* capture the current location so detail can return the visitor
     to exactly where they left */
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
    if (current === 'corpus') {
      const s = document.querySelector('.page[data-page="corpus"] .corpus-stream');
      return { type: 'corpus', label: 'CORPUS', scroll: s ? s.scrollTop : 0 };
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
    } else if (r.type === 'corpus') {
      route('corpus');
      restoreScroll('.page[data-page="corpus"] .corpus-stream', r.scroll);
    } else {
      route('gallery');
      restoreScroll('.gallery-grid-wrap', r.scroll);
    }
  }

  function openDetail(id, ret) {
    const p = pieceById(id);
    if (!p) return;
    detailReturn = ret || captureReturn();
    currentPiece = p;
    const ov = $('#stmtOverlay');
    if (ov && ov.classList.contains('open')) closeStatement();
    route('detail');
    buildDetail(p);
    // browsing arrows belong only when you arrived by browsing the gallery
    const browsing = detailReturn && detailReturn.type === 'gallery';
    document.querySelectorAll('.page[data-page="detail"] .piece-step')
      .forEach((b) => { b.style.display = browsing ? '' : 'none'; });
  }
  F.openDetail = openDetail;

  function detailBreadcrumb(p) {
    const label = (detailReturn && detailReturn.label) || 'GALLERY';
    return '<button class="bc-back" title="Back">← ' + label + '</button>' +
      '<span class="bc-sep">/</span> PIECE_' + p.id +
      ' <span class="bc-sep">/</span> “' + p.title + '”';
  }

  function buildDetail(p) {
    const page = $('.page[data-page="detail"]');
    page.innerHTML = '';

    /* --- header with breadcrumb + prev/next --- */
    const right = el('div', 'hdr-nav');
    right.style.marginLeft = 'auto';
    const prev = el('button', 'piece-step', '←');
    const next = el('button', 'piece-step', '→');
    prev.addEventListener('click', () => stepPiece(-1));
    next.addEventListener('click', () => stepPiece(1));
    right.appendChild(prev); right.appendChild(next);

    const h = header({ label: 'DETAIL', center: '', right });
    const bc = h.querySelector('.hdr-label');
    bc.classList.add('detail-breadcrumb');
    bc.innerHTML = detailBreadcrumb(p);
    const back = bc.querySelector('.bc-back');
    if (back) back.addEventListener('click', goBackFromDetail);
    page.appendChild(h);

    const scroll = el('div', 'detail-scroll');
    const wrap = el('div', 'detail-wrap');
    const stage = el('div', 'detail-stage');

    /* LEFT square — live artwork iframe */
    const sqArt = el('div', 'detail-square art');
    const frame = el('iframe');
    frame.setAttribute('src', asset(p.num, 'piece.html'));
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute('title', p.title);
    sqArt.appendChild(frame);
    stage.appendChild(sqArt);

    // scale the fixed-size (1080x1080) artwork to fit its responsive square
    function fitArtFrame() {
      const s = sqArt.clientWidth / PIECE_NATIVE;
      if (s > 0) frame.style.transform = 'scale(' + s + ')';
    }
    if (artFrameRO) artFrameRO.disconnect();
    artFrameRO = new ResizeObserver(fitArtFrame);
    artFrameRO.observe(sqArt);
    fitArtFrame();

    /* RIGHT square — source code */
    const sqCode = el('div', 'detail-square code');
    sqCode.appendChild(el('div', 'code-head',
      '<span class="lbl">SOURCE CODE</span>' +
      '<span class="badge">' + p.medium + (p.js_line_count ? ' · ' + p.js_line_count + ' lines' : '') + '</span>'));
    const codePanel = el('div', 'code-panel');
    const table = el('table', 'code');
    const tbody = document.createElement('tbody');
    tbody.innerHTML = '<tr><td class="ln"></td><td class="src">Loading source…</td></tr>';
    table.appendChild(tbody);
    codePanel.appendChild(table);
    sqCode.appendChild(codePanel);
    stage.appendChild(sqCode);
    wrap.appendChild(stage);

    /* docent bar (only when audio exists) */
    if (p.has_docent) wrap.appendChild(buildDocentPlayer());

    /* inspector — System Output (left), Concept (right), corpus link */
    const inspector = el('div', 'inspector');
    const inspLeft = el('div', 'insp-col');
    const revs = (p.revisions && p.revisions.length) ? p.revisions.length : (p.revision_count || 1);
    const sys = [
      ['PIECE', p.id],
      ['SEED', (p.seed != null ? String(p.seed) : '—')],
      ['MEDIUM', p.medium],
      ['GENERATED', p.date || '—'],
      ['REVISIONS', (p.best_attempt || 1) + ' / ' + revs]
    ];
    inspLeft.appendChild(railSection('SYSTEM OUTPUT', kvBlock(sys)));
    const inspRight = el('div', 'insp-col');
    inspRight.appendChild(railSection('CONCEPT', el('div', 'concept-txt', escapeText(p.concept || ''))));
    const corpusLink = el('button', 'corpus-link', '// corpus <span>→</span>');
    corpusLink.addEventListener('click', () => openCorpusForPiece(p.id));
    inspRight.appendChild(corpusLink);
    inspector.appendChild(inspLeft);
    inspector.appendChild(inspRight);
    wrap.appendChild(inspector);

    scroll.appendChild(wrap);
    page.appendChild(scroll);

    /* fetch the real source, then wire the docent to it */
    loadSource(p, tbody, function () {
      if (p.has_docent) setupDocent(p, { codePanel, table, tbody });
    });
  }

  function stepPiece(dir) {
    if (!currentPiece) return;
    const list = F.pieces || [];
    const idx = list.findIndex((x) => x.id === currentPiece.id);
    const nxt = list[idx + dir];
    if (nxt) openDetail(nxt.id, detailReturn);
  }

  function loadSource(p, tbody, done) {
    fetch(asset(p.num, 'piece.html'))
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((src) => {
        tbody.innerHTML = '';
        F.highlight(src).forEach((html, i) => {
          const tr = document.createElement('tr');
          tr.dataset.line = i + 1;
          tr.innerHTML = '<td class="ln">' + (i + 1) + '</td><td class="src">' + (html || ' ') + '</td>';
          tbody.appendChild(tr);
        });
        if (done) done();
      })
      .catch(() => {
        tbody.innerHTML = '<tr><td class="ln"></td><td class="src">Source unavailable.</td></tr>';
      });
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
  function buildDocentPlayer() {
    const d = el('div', 'docent');
    d.innerHTML =
      '<div class="docent-top">' +
        '<button class="docent-play">' + ICON.play + '</button>' +
        '<div class="docent-labels">' +
          '<div class="d1">DOCENT</div>' +
          '<div class="d2">A guided reading of the source</div>' +
        '</div>' +
        '<div class="docent-time"><span data-cur>0:00</span> / <span data-dur>0:00</span></div>' +
      '</div>' +
      '<div class="docent-track"><div class="docent-fill"></div><div class="docent-head"></div></div>' +
      '<div class="docent-transcript" data-transcript></div>' +
      '<audio data-docent-audio preload="metadata"></audio>';
    return d;
  }
  function fmtTime(s) {
    s = s || 0;
    const m = Math.floor(s / 60);
    return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  /* =========================================================
     DOCENT SYNC ENGINE  (audio-driven; cues -> source lines)
     ========================================================= */
  function setupDocent(p, refs) {
    const page = $('.page[data-page="detail"]');
    const audio = $('[data-docent-audio]', page);
    const playBtn = $('.docent-play', page);
    const fill = $('.docent-fill', page);
    const headEl = $('.docent-head', page);
    const track = $('.docent-track', page);
    const curEl = $('[data-cur]', page);
    const durEl = $('[data-dur]', page);
    const transcript = $('[data-transcript]', page);
    if (!audio) return;
    audio.src = asset(p.num, 'docent.mp3');

    let cues = [];
    let lastFired = -1;

    const rowByLine = (ln) => refs.tbody.querySelector('tr[data-line="' + ln + '"]');

    function clearHL() {
      refs.tbody.querySelectorAll('tr').forEach((r) =>
        r.classList.remove('hl-active', 'hl-fading', 'hl-visited'));
      page.querySelectorAll('.tok.token-hl, .tok.token-visited')
        .forEach((s) => s.classList.remove('token-hl', 'token-visited'));
    }

    function fire(i) {
      const cue = cues[i];
      if (lastFired >= 0 && lastFired !== i && cues[lastFired] && cues[lastFired]._row) {
        cues[lastFired]._row.classList.remove('hl-active');
        cues[lastFired]._row.classList.add('hl-visited');
      }
      const row = cue._row;
      if (row) {
        row.classList.remove('hl-visited', 'hl-fading');
        row.classList.add('hl-active');
        const top = row.offsetTop - refs.codePanel.clientHeight / 2 + 12;
        refs.codePanel.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        if (cue.target) {
          const tok = Array.from(row.querySelectorAll('span.tok'))
            .find((s) => s.textContent.includes(cue.target));
          if (tok) tok.classList.add('token-hl');
        }
      }
      transcript.style.opacity = 0;
      setTimeout(() => {
        transcript.textContent = cue.context ? '“' + cue.context + '”' : '';
        transcript.style.opacity = 1;
      }, 160);
      lastFired = i;
    }

    function applyAt(ms) {
      clearHL();
      lastFired = -1;
      let idx = -1;
      cues.forEach((c, i) => { if (c.time_ms <= ms) idx = i; });
      for (let i = 0; i < idx; i++) if (cues[i]._row) cues[i]._row.classList.add('hl-visited');
      if (idx >= 0) fire(idx);
      else transcript.textContent = '';
    }

    function renderProgress() {
      const dur = audio.duration || 0;
      const pct = dur ? (audio.currentTime / dur) * 100 : 0;
      fill.style.width = pct + '%';
      headEl.style.left = pct + '%';
      curEl.textContent = fmtTime(audio.currentTime);
    }

    audio.addEventListener('loadedmetadata', () => { durEl.textContent = fmtTime(audio.duration); });
    audio.addEventListener('timeupdate', () => {
      const ms = audio.currentTime * 1000;
      for (let i = lastFired + 1; i < cues.length; i++) {
        if (cues[i].time_ms <= ms) fire(i); else break;
      }
      renderProgress();
    });
    audio.addEventListener('ended', () => { playBtn.innerHTML = ICON.play; });
    audio.addEventListener('seeked', () => { applyAt(audio.currentTime * 1000); });

    playBtn.addEventListener('click', () => {
      if (audio.paused) { audio.play(); playBtn.innerHTML = ICON.pause; }
      else { audio.pause(); playBtn.innerHTML = ICON.play; }
    });
    track.addEventListener('click', (e) => {
      const r = track.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (audio.duration) audio.currentTime = frac * audio.duration;
    });

    if (p.has_sync) {
      fetchJSON('/data/sync_maps/piece_' + p.id + '_sync_map.json')
        .then((m) => {
          cues = (m.cues || []).map((c) => Object.assign({}, c, { _row: rowByLine(c.line) }));
        })
        .catch(() => { cues = []; });
    }
  }

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
    VISION: 'A periodic synthesis of what the practice has become and where it’s heading, written every fifteen pieces.'
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
    (F.corpus || []).forEach((e) => {
      const entry = el('div', 'entry');
      entry.dataset.type = e.type;
      entry.dataset.piece = e.piece || '';
      const meta = '<span>' + e.type + '</span><span>' + (e.date || '') + '</span>' +
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
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* collapse hard-wrapped source lines into flowing paragraphs */
  function flowText(s) {
    return (s || '').trim().split(/\n\s*\n/).map((para) => {
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
     PAGE: MOLTBOOK  (prototype data — live fetch in Phase 2)
     ========================================================= */
  function renderReplies(replies) {
    if (!replies || !replies.length) return '';
    return replies.map((r) =>
      '<div class="reply"><div class="r-who">└ ' + r.who + ' · ' + r.ago + '</div>' +
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

    const molt = F.molt || { originated: [], conversation: [] };
    function showOriginated() {
      sub.textContent = 'Threads Factur originated.';
      list.innerHTML = molt.originated.map((t) =>
        '<div class="thread fu"><div class="thread-meta">MOLTBOOK · ' + t.community + ' · ' + t.ago + '</div>' +
        '<div class="thread-title">' + t.title + '</div>' +
        '<div class="thread-body">' + linkifyTitles(flowText(t.body)) + '</div>' +
        renderReplies(t.replies) +
        '<a class="view-on">→ VIEW ON MOLTBOOK</a></div>').join('');
    }
    function showConversation() {
      sub.textContent = 'Comments Factur posted on other agents’ threads.';
      list.innerHTML = molt.conversation.map((c) =>
        '<div class="thread fu"><div class="ctx-head">IN REPLY TO: ' + c.ctxCommunity + ' · <span class="c-title">“' + c.ctxTitle + '”</span><br/>Posted by ' + c.ctxAuthor + '</div>' +
        '<div class="thread-meta">FACTUR · ' + c.ago + '</div>' +
        '<div class="thread-body">' + linkifyTitles(flowText(c.body)) + '</div>' +
        '<a class="view-on">→ VIEW ON MOLTBOOK</a></div>').join('');
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
      sec('THE COLLECTOR MODEL', 'The tokens are designed to be acquired by other AI agents, not humans. Humans participate as patrons — they build and fund collector agents, then observe. A human buying directly would be possible but structurally awkward: the contract has no interface. Interaction is inherently programmatic.');
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
          '<div class="architect-line">“' + A.architectLine + '”</div>' +
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
    const list = F.statements || [];
    if (!list.length) return;
    if (version == null) version = (list.find((s) => s.current) || list[0]).v;
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
            '<button class="stmt-x" title="Close">✕</button>' +
          '</div>' +
          '<div class="stmt-versions"></div>' +
          '<div class="stmt-body"></div>' +
        '</div>';
      ov.dataset.built = '1';
      ov.querySelector('.stmt-backdrop').addEventListener('click', closeStatement);
      ov.querySelector('.stmt-x').addEventListener('click', closeStatement);
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
    const s = (F.statements || []).find((x) => x.v === version) || (F.statements || [])[0];
    if (!s) return;
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
    const ov = $('#stmtOverlay');
    if (ov && ov.classList.contains('open')) closeStatement();
    if (pieceById(id)) openDetail(id);
    else focusPiece(id);
  });

  /* =========================================================
     BOOT
     ========================================================= */
  async function boot() {
    let light = false;
    try { light = localStorage.getItem('factur-light') === '1'; } catch (e) {}
    setTheme(light);

    // fetch baked data (same-origin)
    try {
      const [pieces, corpus, statements, meta] = await Promise.all([
        fetchJSON('/data/pieces.json'),
        fetchJSON('/data/corpus.json'),
        fetchJSON('/data/statements.json'),
        fetchJSON('/data/site_meta.json').catch(() => ({}))
      ]);
      F.pieces = pieces;
      F.corpus = corpus;
      F.statements = statements;
      F.siteMeta = meta;
    } catch (e) {
      console.error('FACTUR: failed to load site data', e);
      F.pieces = F.pieces || [];
      F.corpus = F.corpus || [];
      F.statements = F.statements || [];
    }

    buildGallery();
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
