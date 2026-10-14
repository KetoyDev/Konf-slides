/* Kotlin Over the Air — generated artwork.

   Two kinds of art, both seeded so every render is identical:

   1. Monoline glyph tiles (`<svg class="art" data-art="line">`): a grid of
      geometric glyphs (rings, pills, half-discs, hatching, arches, lenses)
      drawn with one thin stroke and clipped to a silhouette — by default the
      Kotlin "K" mark. Each stroke draws itself in when its slide appears.

   2. Solid gradient tiles (`data-art="solid"`): chunky filled shapes for the
      edges of diagram slides.

   Attributes: data-cols, data-rows, data-cell (px), data-seed,
               data-mask = k | rect | k-mirror, data-stroke (colour or url(#id)). */

(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return (s % 1000003) / 1000003;
    };
  }

  const pick = (r, list) => list[Math.floor(r() * list.length) % list.length];
  const f = (n) => Math.round(n * 10) / 10;

  /* ---------- Silhouettes ------------------------------------------------ */
  // The Kotlin mark: a square with a triangular notch cut from the right edge.
  function maskPoints(kind, W, H) {
    if (kind === 'k') return [[0, 0], [W, 0], [W / 2, H / 2], [W, H], [0, H]];
    if (kind === 'k-mirror') return [[W, 0], [0, 0], [W / 2, H / 2], [0, H], [W, H]];
    return [[0, 0], [W, 0], [W, H], [0, H]];
  }

  /* ---------- Monoline glyphs ------------------------------------------- */
  // Each returns one or more path `d` strings for a cell at (x, y, w, h).
  function rectD(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
  }
  function circleD(cx, cy, r) {
    return `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
  }

  const LINE_GLYPHS = {
    pill(x, y, w, h, r) {
      const m = Math.min(w, h);
      const out = [rectD(x, y, w, h, m / 2)];
      if (r() < 0.6) { const i = m * 0.2; out.push(rectD(x + i, y + i, w - 2 * i, h - 2 * i, (m - 2 * i) / 2)); }
      return out;
    },
    ring(x, y, w, h, r) {
      const R = Math.min(w, h) / 2;
      const out = [circleD(x + w / 2, y + h / 2, R)];
      if (r() < 0.55) out.push(circleD(x + w / 2, y + h / 2, R * 0.36));
      return out;
    },
    dee(x, y, w, h, r) {
      const dir = Math.floor(r() * 4);
      const R = Math.min(w, h) / 2;
      if (dir === 0) return [`M${f(x)} ${f(y)}H${f(x + w - R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w - R)} ${f(y + h)}H${f(x)}Z`];
      if (dir === 1) return [`M${f(x + w)} ${f(y)}H${f(x + R)}A${f(R)} ${f(R)} 0 0 0 ${f(x + R)} ${f(y + h)}H${f(x + w)}Z`];
      if (dir === 2) return [`M${f(x)} ${f(y + h)}V${f(y + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w)} ${f(y + R)}V${f(y + h)}Z`];
      return [`M${f(x)} ${f(y)}V${f(y + h - R)}A${f(R)} ${f(R)} 0 0 0 ${f(x + w)} ${f(y + h - R)}V${f(y)}Z`];
    },
    hatch(x, y, w, h, r) {
      const n = 3 + Math.floor(r() * 3);
      const out = [rectD(x, y, w, h, 0)];
      const vertical = r() < 0.5;
      const half = r() < 0.6;
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1);
        if (vertical) out.push(`M${f(x + w * t)} ${f(half ? y + h / 2 : y)}V${f(y + h)}`);
        else out.push(`M${f(half ? x + w / 2 : x)} ${f(y + h * t)}H${f(x + w)}`);
      }
      return out;
    },
    tri(x, y, w, h, r) {
      const c = Math.floor(r() * 4);
      const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      pts.splice(c, 1);
      return [rectD(x, y, w, h, 0), `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`];
    },
    arch(x, y, w, h) {
      const R = w / 2;
      return [`M${f(x)} ${f(y + h)}V${f(y + R)}A${f(R)} ${f(R)} 0 0 1 ${f(x + w)} ${f(y + R)}V${f(y + h)}Z`,
              `M${f(x + w * 0.3)} ${f(y + h)}V${f(y + R)}A${f(w * 0.2)} ${f(w * 0.2)} 0 0 1 ${f(x + w * 0.7)} ${f(y + R)}V${f(y + h)}`];
    },
    lens(x, y, w, h) {
      return [rectD(x, y, w, h, 0),
              `M${f(x)} ${f(y + h / 2)}Q${f(x + w / 2)} ${f(y - h * 0.15)} ${f(x + w)} ${f(y + h / 2)}Q${f(x + w / 2)} ${f(y + h * 1.15)} ${f(x)} ${f(y + h / 2)}Z`,
              circleD(x + w / 2, y + h / 2, Math.min(w, h) * 0.13)];
    },
    quarter(x, y, w, h, r) {
      const c = Math.floor(r() * 4);
      const ox = c % 2 ? x + w : x;
      const oy = c > 1 ? y + h : y;
      const sx = c % 2 ? -1 : 1;
      const sy = c > 1 ? -1 : 1;
      const out = [rectD(x, y, w, h, 0)];
      [1, 0.62].forEach((k) => {
        out.push(`M${f(ox + sx * w * k)} ${f(oy)}A${f(w * k)} ${f(h * k)} 0 0 ${sx * sy > 0 ? 1 : 0} ${f(ox)} ${f(oy + sy * h * k)}`);
      });
      return out;
    },
  };

  /* ---------- Solid glyphs --------------------------------------------- */
  const SOLID_GLYPHS = {
    disc: (x, y, w, h) => circleD(x + w / 2, y + h / 2, Math.min(w, h) / 2),
    pill: (x, y, w, h) => rectD(x, y, w, h, Math.min(w, h) / 2),
    square: (x, y, w, h) => rectD(x, y, w, h, 0),
    dee: (x, y, w, h, r) => LINE_GLYPHS.dee(x, y, w, h, r)[0],
    arch: (x, y, w, h) => LINE_GLYPHS.arch(x, y, w, h)[0],
    quarter(x, y, w, h, r) {
      const c = Math.floor(r() * 4);
      const ox = c % 2 ? x + w : x;
      const oy = c > 1 ? y + h : y;
      const sx = c % 2 ? -1 : 1;
      const sy = c > 1 ? -1 : 1;
      return `M${f(ox)} ${f(oy)}H${f(ox + sx * w)}A${f(w)} ${f(h)} 0 0 ${sx * sy > 0 ? 1 : 0} ${f(ox)} ${f(oy + sy * h)}Z`;
    },
  };

  /* ---------- Layout ----------------------------------------------------- */
  function layout(cols, rows, r, allowWide) {
    const used = Array.from({ length: rows }, () => Array(cols).fill(false));
    const cells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (used[row][col]) continue;
        let w = 1; let h = 1;
        const roll = r();
        if (allowWide && roll < 0.28 && col + 1 < cols && !used[row][col + 1]) w = 2;
        else if (allowWide && roll < 0.42 && row + 1 < rows) h = 2;
        for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) used[row + dy][col + dx] = true;
        cells.push({ col, row, w, h });
      }
    }
    return cells;
  }

  function el(name, attrs) {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  let uid = 0;

  function render(svg) {
    const kind = svg.dataset.art || 'line';
    const cols = +svg.dataset.cols || 6;
    const rows = +svg.dataset.rows || 6;
    const cell = +svg.dataset.cell || 120;
    const seed = +svg.dataset.seed || 7;
    const mask = svg.dataset.mask || 'k';
    const W = cols * cell; const H = rows * cell;
    const r = rng(seed);
    const id = `art${uid++}`;

    svg.setAttribute('viewBox', `-4 -4 ${W + 8} ${H + 8}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '';

    const poly = maskPoints(mask, W, H).map((p) => p.join(' ')).join(' ');
    const defs = el('defs', {});
    const clip = el('clipPath', { id: `${id}-clip` });
    clip.appendChild(el('polygon', { points: poly }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    const g = el('g', { 'clip-path': `url(#${id}-clip)` });
    svg.appendChild(g);
    const maxD = W + H;

    if (kind === 'line') {
      const stroke = svg.dataset.stroke || 'url(#gLine)';
      const names = Object.keys(LINE_GLYPHS);
      layout(cols, rows, r, true).forEach((c) => {
        const x = c.col * cell; const y = c.row * cell; const w = c.w * cell; const h = c.h * cell;
        const name = c.w !== c.h ? (r() < 0.75 ? 'pill' : 'hatch') : pick(r, names);
        const delay = ((x + y) / maxD) * 1.4;
        LINE_GLYPHS[name](x, y, w, h, r).forEach((d) => {
          g.appendChild(el('path', { d, class: 'ln', pathLength: '1', stroke, style: `--d:${delay.toFixed(2)}s` }));
        });
      });
      svg.appendChild(el('polygon', { points: poly, class: 'ln edge', pathLength: '1', stroke, style: '--d:0s' }));
    } else {
      const fills = (svg.dataset.fills || 'url(#gWarm),url(#gSun),url(#gViolet),url(#gPink)').split(',');
      const names = Object.keys(SOLID_GLYPHS);
      layout(cols, rows, r, true).forEach((c) => {
        if (r() < 0.12) return; // breathing holes, like the reference mosaics
        const x = c.col * cell; const y = c.row * cell; const w = c.w * cell; const h = c.h * cell;
        const name = c.w !== c.h ? 'pill' : pick(r, names);
        const delay = ((x + y) / maxD) * 0.9;
        g.appendChild(el('path', { d: SOLID_GLYPHS[name](x, y, w, h, r), class: 'tile', fill: pick(r, fills), style: `--d:${delay.toFixed(2)}s` }));
      });
    }
  }

  /* ---------- Gradient field ------------------------------------------ */
  // A few huge, soft, overlapping geometric shapes in violet → magenta →
  // pink, like the KotlinConf'27 call-for-speakers key visual.
  const FIELD = `
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="fBase" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#6e2df5"/><stop offset=".55" stop-color="#a72cf0"/><stop offset="1" stop-color="#e83fd9"/></linearGradient>
        <linearGradient id="fA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fd0"/><stop offset="1" stop-color="#c03af5"/></linearGradient>
        <linearGradient id="fB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f45ff"/><stop offset="1" stop-color="#5a2df0"/></linearGradient>
        <linearGradient id="fC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7ad8"/><stop offset="1" stop-color="#ff4fb0"/></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#fBase)"/>
      <g>
        <circle class="shape" cx="1180" cy="-120" r="860" fill="url(#fA)" opacity=".55"/>
        <path class="shape" d="M0 1080 V260 A820 820 0 0 1 820 1080 Z" fill="url(#fB)" opacity=".55"/>
        <rect class="shape" x="1390" y="0" width="530" height="560" fill="url(#fC)" opacity=".38"/>
        <circle class="shape" cx="1760" cy="1180" r="620" fill="#7a2ff5" opacity=".42"/>
      </g>
    </svg>`;

  /* ---------- Backdrop patterns ----------------------------------------- */
  // Quieter companions to the glyph field, so dark slides don't all wear the
  // same texture. All are thin strokes that draw in once.
  //   data-art="rings"  data-cx data-cy data-from data-to data-gap
  //   data-art="waves"  data-n data-amp data-len
  //   data-art="hatch"  data-r data-gap   (a hatched quarter-disc, origin top-right)
  function renderPattern(svg, kind) {
    const W = +svg.dataset.w || 1920; const H = +svg.dataset.h || 1080;
    const stroke = svg.dataset.stroke || 'rgba(255,255,255,.1)';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '';
    const add = (name, attrs, i, step) => svg.appendChild(el(name, Object.assign({ class: 'ln', pathLength: '1', stroke, style: `--d:${(i * step).toFixed(2)}s` }, attrs)));

    if (kind === 'rings') {
      const cx = +svg.dataset.cx; const cy = +svg.dataset.cy;
      const from = +svg.dataset.from || 300; const to = +svg.dataset.to || 1400; const gap = +svg.dataset.gap || 56;
      for (let r = from, i = 0; r <= to; r += gap, i++) add('circle', { cx, cy, r, fill: 'none' }, i, 0.05);
    } else if (kind === 'waves') {
      const n = +svg.dataset.n || 14; const amp = +svg.dataset.amp || 28; const len = +svg.dataset.len || 520;
      for (let i = 0; i < n; i++) {
        const y = 40 + i * ((H - 80) / (n - 1));
        const phase = i * 0.42;
        let d = `M0 ${f(y + Math.sin(phase) * amp)}`;
        for (let x = 40; x <= W; x += 40) d += `L${x} ${f(y + Math.sin(phase + (x / len) * Math.PI * 2) * amp * (0.55 + 0.45 * Math.sin(x / W * Math.PI)))}`;
        add('path', { d, fill: 'none' }, i, 0.06);
      }
    } else if (kind === 'hatch') {
      const R = +svg.dataset.r || Math.min(W, H); const gap = +svg.dataset.gap || 26;
      const id = `hatch${uid++}`;
      const defs = el('defs', {});
      const cp = el('clipPath', { id });
      cp.appendChild(el('path', { d: `M${W} 0 H${W - R} A${R} ${R} 0 0 0 ${W} ${R} Z` }));
      defs.appendChild(cp); svg.appendChild(defs);
      const g = el('g', { 'clip-path': `url(#${id})` }); svg.appendChild(g);
      let i = 0;
      for (let k = -R; k <= R * 2; k += gap, i++) {
        g.appendChild(el('path', { d: `M${W - R + k} 0 L${W - R + k - R} ${R}`, class: 'ln', pathLength: '1', stroke, style: `--d:${(i * 0.02).toFixed(2)}s` }));
      }
      add('path', { d: `M${W - R} 0 A${R} ${R} 0 0 0 ${W} ${R}`, fill: 'none', stroke: svg.dataset.edge || stroke }, 0, 0);
      add('path', { d: `M${W - R * 0.62} 0 A${R * 0.62} ${R * 0.62} 0 0 0 ${W} ${R * 0.62}`, fill: 'none', stroke: svg.dataset.edge || stroke }, 4, 0.1);
    }
  }

  function renderAll(root) {
    (root || document).querySelectorAll('svg.art').forEach((svg) => {
      const kind = svg.dataset.art;
      if (kind === 'rings' || kind === 'waves' || kind === 'hatch') renderPattern(svg, kind);
      else render(svg);
    });
    (root || document).querySelectorAll('[data-field]').forEach((d) => { d.innerHTML = FIELD; });
  }

  window.KonfArt = { renderAll };
  renderAll();
})();
