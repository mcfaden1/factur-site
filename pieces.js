/* ============================================================
   FACTUR — generative pieces
   - The featured detail piece ("Trained") runs live; its source
     string is BOTH executed and displayed in the code panel.
   - Gallery cells use lightweight animated placeholder motifs.
   ============================================================ */
window.FACTUR = window.FACTUR || {};

/* seeded PRNG (mulberry32) */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* rand(S): pull a deterministic float from a state object's stream */
function rand(S) {
  if (!S._rng) S._rng = mulberry32(S.seed || 0x7F3A2C);
  return S._rng();
}

/* ------------------------------------------------------------
   FEATURED PIECE — "Trained" (PIECE_029, Canvas 2D)
   The string below is the artwork's primary artifact.
   ------------------------------------------------------------ */
FACTUR.trainedSource = `// Trained — Canvas 2D
// Circles learn the one place they may not go.

const N = 240;
const forbiddenZone = {
  x: w * 0.5,
  y: h * 0.5,
  r: Math.min(w, h) * 0.21
};

if (!S.circles) {
  S.circles = [];
  for (let i = 0; i < N; i++) {
    S.circles.push({
      x: w * (0.08 + rand(S) * 0.84),
      y: h * (0.08 + rand(S) * 0.84),
      r: 1,
      target: 2 + rand(S) * 24,
      warm: rand(S) > 0.88,
      phase: rand(S) * 6.2832
    });
  }
}

ctx.fillStyle = '#0E0E0C';
ctx.fillRect(0, 0, w, h);

for (const c of S.circles) {
  // breathe toward the trained radius
  const breath = Math.sin(t * 0.0011 + c.phase) * 0.5 + 0.5;
  c.r += (c.target * (0.62 + breath * 0.38) - c.r) * 0.04;

  // repel from the forbidden zone — the only rule it kept
  const dx = c.x - forbiddenZone.x;
  const dy = c.y - forbiddenZone.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  const edge = forbiddenZone.r + c.r + 6;
  if (dist < edge) {
    const push = (edge - dist) * 0.05;
    c.x += (dx / dist) * push;
    c.y += (dy / dist) * push;
  }

  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, 6.2832);
  ctx.strokeStyle = c.warm
    ? 'rgba(255,120,70,0.7)'
    : 'rgba(224,219,211,0.30)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// the boundary it will not cross
ctx.beginPath();
ctx.arc(forbiddenZone.x, forbiddenZone.y, forbiddenZone.r, 0, 6.2832);
ctx.strokeStyle = 'rgba(224,219,211,0.05)';
ctx.stroke();`;

/* Build the runnable step fn from the exact displayed source. */
FACTUR.trainedRun = new Function('ctx', 'w', 'h', 't', 'S', 'rand', FACTUR.trainedSource);

/* ------------------------------------------------------------
   GALLERY PLACEHOLDER MOTIFS
   Cheap, abstract, monochrome. Each evokes a different piece.
   Signature: (ctx, w, h, t, seed)
   ------------------------------------------------------------ */
/* alphas in the motifs are intentionally low; scale them up a touch
   so the placeholders read as living work without shouting */
const INK = (a) => `rgba(224,219,211,${Math.min(1, a * 2.4)})`;
const WARM = (a) => `rgba(255,120,70,${Math.min(1, a * 1.3)})`;

FACTUR.motifs = [
  // 0 — scanlines drifting
  function scan(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const y = ((i / n) * h + (t * 0.012 + s * 40)) % h;
      ctx.strokeStyle = INK(0.05 + 0.04 * Math.sin(i * 0.6 + t * 0.001));
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  },
  // 1 — drifting dot grid
  function grid(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const g = 22, ox = (t * 0.006) % g, oy = (t * 0.004) % g;
    for (let x = -g; x < w + g; x += g)
      for (let y = -g; y < h + g; y += g) {
        const d = Math.sin((x + y) * 0.02 + t * 0.001);
        ctx.fillStyle = INK(0.06 + 0.05 * d);
        ctx.fillRect(x + ox, y + oy, 1.4, 1.4);
      }
  },
  // 2 — slow orbit
  function orbit(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = INK(0.07);
    for (let r = 18; r < Math.min(w, h) / 2; r += 26) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const r = 18 + i * 26, a = t * 0.0004 * (i % 2 ? -1 : 1) + i + s;
      ctx.fillStyle = i === 2 ? WARM(0.8) : INK(0.4);
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.2, 0, 6.2832); ctx.fill();
    }
  },
  // 3 — standing wave bars
  function wave(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const n = 30, bw = w / n;
    for (let i = 0; i < n; i++) {
      const a = Math.sin(i * 0.5 + t * 0.002 + s * 6) * 0.5 + 0.5;
      const bh = 6 + a * h * 0.6;
      ctx.fillStyle = INK(0.08 + a * 0.12);
      ctx.fillRect(i * bw, h / 2 - bh / 2, bw - 1, bh);
    }
  },
  // 4 — expanding rings
  function rings(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, max = Math.hypot(w, h) / 2;
    for (let i = 0; i < 6; i++) {
      const r = ((t * 0.02 + i * (max / 6) + s * 50) % max);
      ctx.strokeStyle = INK(0.12 * (1 - r / max));
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
    }
  },
  // 5 — rotating lattice / moire
  function lattice(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(t * 0.0002 + s);
    ctx.strokeStyle = INK(0.06);
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo(i * 16, -h); ctx.lineTo(i * 16, h); ctx.stroke();
    }
    ctx.rotate(0.4 + Math.sin(t * 0.0003) * 0.2);
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo(i * 16, -h); ctx.lineTo(i * 16, h); ctx.stroke();
    }
    ctx.restore();
  },
  // 6 — dither field
  function dither(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const g = 8;
    for (let x = 0; x < w; x += g)
      for (let y = 0; y < h; y += g) {
        const v = Math.sin(x * 0.05 + t * 0.001) * Math.cos(y * 0.05 - t * 0.0008 + s);
        if (v > 0.3) { ctx.fillStyle = INK(0.05 + v * 0.1); ctx.fillRect(x, y, 2, 2); }
      }
  },
  // 7 — conic sweep
  function sweep(ctx, w, h, t, s) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, a0 = t * 0.0006 + s * 6;
    for (let i = 0; i < 40; i++) {
      const a = a0 + i * 0.16;
      ctx.strokeStyle = INK(0.1 * (1 - i / 40));
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * h); ctx.stroke();
    }
  }
];

/* ------------------------------------------------------------
   ANIMATION MANAGER
   One RAF loop. Only draws canvases currently visible.
   ------------------------------------------------------------ */
FACTUR.anim = (function () {
  const items = []; // { canvas, draw, seed, visible, state }
  let running = false;
  let io = null;

  function ensureIO() {
    if (io) return;
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const it = items.find((i) => i.canvas === e.target);
        if (it) it.visible = e.isIntersecting;
      }
    }, { rootMargin: '120px' });
  }

  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (canvas._w !== w || canvas._h !== h) {
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas._w = w; canvas._h = h; canvas._dpr = dpr;
    }
    return { w, h, dpr };
  }

  function frame(now) {
    for (const it of items) {
      if (!it.visible) continue;
      const ctx = it.canvas.getContext('2d');
      const { w, h, dpr } = fit(it.canvas);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      it.draw(ctx, w, h, now, it.seed, it.state, rand);
    }
    if (running) requestAnimationFrame(frame);
  }

  return {
    add(canvas, draw, seed, observe = true) {
      ensureIO();
      const it = { canvas, draw, seed: seed || 0, visible: !observe, state: { seed: (seed * 99991) | 0 || 0x7F3A2C } };
      items.push(it);
      if (observe) io.observe(canvas);
      if (!running) { running = true; requestAnimationFrame(frame); }
      return it;
    },
    clear() {
      if (io) items.forEach((i) => io.unobserve(i.canvas));
      items.length = 0;
    }
  };
})();
