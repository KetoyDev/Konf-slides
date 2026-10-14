/* Kotlin Over the Air — deck behaviour.
   Reveal init plus the few beats CSS can't drive alone: the slide-2
   timeline, the bundle signature highlight, count-up numbers and the
   demo fallback video. */

(function () {
  // `?lite` (or the OS reduced-motion setting): no drift, no draw-ins.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = /[?&]lite\b/.test(location.search) || reduced;
  if (lite) document.documentElement.classList.add('lite');

  const deck = new Reveal({
    width: 1920,
    height: 1080,
    margin: 0,
    minScale: 0.1,
    maxScale: 2,
    hash: true,
    center: false,
    display: 'flex', // every slide is a flex column (see .s in konf.css)
    // never fall into reveal's mobile scroll view (it activates below 435px,
    // e.g. a snapped window or a small preview) — it would swallow navigation
    scrollActivationWidth: null,

    // Stage chrome off: no arrows, no progress bar, number in speaker view only.
    controls: false,
    progress: false,
    slideNumber: 'c/t',
    showSlideNumber: 'speaker',

    // Content drifts in and settles (the `konf` transition in konf.css).
    // Background changes are animated by the wipe below, so reveal's own
    // background layer swaps instantly underneath it.
    transition: lite ? 'fade' : 'none', // the pen transition below does the motion
    backgroundTransition: lite ? 'fade' : 'none',

    // Magic-move between the four compiler code slides.
    autoAnimate: !lite,
    autoAnimateDuration: 0.8,
    autoAnimateEasing: 'cubic-bezier(.22,.8,.2,1)',

    // Presentation remotes (Logitech Spotlight / R400, Kensington, …) are
    // keyboards: Next/Back send PageDown/PageUp or the arrow keys, which
    // reveal already steps through builds and slides linearly. "Black
    // screen" sends B or "." (reveal's pause). Esc, a remote's "stop", should
    // not pop the slide overview mid-talk; the overview stays on O.
    keyboard: {
      27: () => {},
    },

    plugins: [RevealNotes],
  });

  deck.initialize();
  window.deck = deck;

  /* ---- Clicker: "start slideshow" -------------------------------------- */
  // A remote's start button sends F5 (or Shift+F5). In a browser that reloads
  // the deck, so catch it before anything else and go fullscreen instead.
  // Reveal itself ignores shifted keys, which is why this listens in capture.
  // (The speaker window already blocks F5 and forwards every other key.)
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'F5' && e.keyCode !== 116) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(() => {});
  }, true);

  /* ---- Slide 2 timeline: runs on its own click -------------------------- */
  const timers = [];
  function resetTimeline(slide) {
    const tl = slide && slide.querySelector('#timeline');
    if (!tl) return;
    timers.splice(0).forEach(clearTimeout);
    tl.classList.remove('go');
    tl.querySelectorAll('.step').forEach((s) => s.classList.remove('on'));
  }
  function runTimeline(slide) {
    const tl = slide.querySelector('#timeline');
    if (!tl) return;
    resetTimeline(slide);
    void tl.offsetWidth;
    const steps = tl.querySelectorAll('.step');
    if (lite) { tl.classList.add('go'); steps.forEach((s) => s.classList.add('on')); return; }
    timers.push(setTimeout(() => tl.classList.add('go'), 40));
    // The last step arrives late, like the users do.
    [120, 500, 880, 1300, 2350].forEach((t, i) => timers.push(setTimeout(() => steps[i] && steps[i].classList.add('on'), t)));
  }

  /* ---- Count-up numbers ------------------------------------------------- */
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const raw = el.dataset.count;
      const end = parseFloat(raw);
      const dec = (raw.split('.')[1] || '').length;
      if (lite) { el.textContent = raw; return; }
      const t0 = performance.now();
      (function tick(t) {
        const p = Math.min(1, (t - t0) / 900);
        el.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* ---- Demo fallback video (media/demo.mp4, toggled with V) ------------- */
  const demo = document.getElementById('demo');
  const video = demo && demo.querySelector('.demo-video');
  let videoReady = false;
  if (video) video.addEventListener('loadeddata', () => { videoReady = true; });
  function toggleDemoVideo(force) {
    if (!video) return;
    if (force === false) { demo.classList.remove('show-video'); video.pause(); return; }
    if (!videoReady || deck.getCurrentSlide() !== demo) return;
    const on = !demo.classList.contains('show-video');
    demo.classList.toggle('show-video', on);
    if (on) { video.currentTime = 0; video.play(); } else { video.pause(); }
  }
  deck.addKeyBinding({ keyCode: 86, key: 'V', description: 'Demo: toggle fallback video' }, () => toggleDemoVideo());

  /* ---- Background wipes --------------------------------------------------- */
  // When the surface colour changes, the new surface is drawn in on top of
  // the old one: a gradient accent band leads, the new colour follows 90 ms
  // behind it. Each destination surface has its own shape, and the shape
  // mirrors when you go backwards. Same-colour neighbours skip this and keep
  // the content drift / auto-animate.
  const SURFACE = {
    '#36333d': 'slant',   // graphite: diagram slides
    '#1d1442': 'rise',    // ink: architecture diagrams
    '#7f52ff': 'corner',  // Kotlin purple: code, statements, diagrams
    '#e44857': 'stadium', // Kotlin coral: the honest-failure slide
    '#8f2cf0': 'iris',    // gradient field: Diwali, demo
  };
  const ACCENT = 'linear-gradient(120deg, #ff8a1a 0%, #ff3d8b 45%, #c42cf0 75%, #8a3bff 100%)';
  const WIPE_MS = 820;
  const EASE = 'cubic-bezier(.65,0,.25,1)';

  function shapes(kind, forward) {
    const R = forward ? 'right' : 'left';
    switch (kind) {
      case 'slant': // a leaning edge sweeps across, like a page turning
        return forward
          ? ['polygon(115% 0%, 135% 0%, 135% 100%, 100% 100%)', 'polygon(-25% 0%, 135% 0%, 135% 100%, -40% 100%)']
          : ['polygon(-35% 0%, -15% 0%, 0% 100%, -35% 100%)', 'polygon(-35% 0%, 125% 0%, 140% 100%, -35% 100%)'];
      case 'rise': // a tilted horizon rises from the bottom (falls from the top going back)
        return forward
          ? ['polygon(0% 112%, 100% 128%, 100% 140%, 0% 140%)', 'polygon(0% -30%, 100% -14%, 100% 140%, 0% 140%)']
          : ['polygon(0% -40%, 100% -40%, 100% -12%, 0% -28%)', 'polygon(0% -40%, 100% -40%, 100% 130%, 0% 114%)'];
      case 'corner': // a disc grows out of the corner you're heading to
        return [`circle(0% at ${forward ? '100% 100%' : '0% 0%'})`, `circle(150% at ${forward ? '100% 100%' : '0% 0%'})`];
      case 'stadium': // a pill opens from the middle, the deck's own glyph
        return ['inset(47% 44% 47% 44% round 120px)', 'inset(0% 0% 0% 0% round 0px)'];
      case 'iris':
        return [`circle(0% at ${R === 'right' ? '62% 50%' : '38% 50%'})`, `circle(80% at ${R === 'right' ? '62% 50%' : '38% 50%'})`];
      default:
        return ['circle(0% at 50% 50%)', 'circle(80% at 50% 50%)'];
    }
  }

  const bgLayer = () => deck.getRevealElement().querySelector('.backgrounds');
  let wipeEls = [];
  let wipeTimer = 0;
  function clearWipe() {
    wipeEls.forEach((el) => el.remove());
    wipeEls = [];
    clearTimeout(wipeTimer);
    deck.getRevealElement().classList.remove('wiping');
  }

  function wipe(fromColor, toColor, forward, toKey) {
    clearWipe();
    const host = bgLayer();
    if (!host || !fromColor || !toColor || fromColor === toColor) return;
    // the Kotlin gradient (title, thank you) opens as a pill; solids use the map
    const kind = /gradient/.test(toColor) ? 'stadium' : (SURFACE[(toKey || toColor).toLowerCase()] || 'iris');
    const [from, to] = shapes(kind, forward);
    const layer = (bg, z) => {
      const el = document.createElement('div');
      el.className = 'bg-wipe';
      el.style.background = bg;
      el.style.zIndex = z;
      host.appendChild(el);
      wipeEls.push(el);
      return el;
    };
    layer(fromColor, 20); // hold the old surface while the new one draws in
    const accent = layer(ACCENT, 21);
    const fresh = layer(toColor, 22);
    accent.animate([{ clipPath: from }, { clipPath: to }], { duration: WIPE_MS, easing: EASE, fill: 'both' });
    fresh.animate([{ clipPath: from }, { clipPath: to }], { duration: WIPE_MS, delay: 90, easing: EASE, fill: 'both' });
    deck.getRevealElement().classList.add('wiping');
    wipeTimer = setTimeout(clearWipe, WIPE_MS + 140);
  }

  const colorOf = (slide) => slide && slide.getAttribute('data-background-color');
  const paintOf = (slide) => slide && (slide.getAttribute('data-background-gradient') || slide.getAttribute('data-background-color'));

  /* ---- Pen transition --------------------------------------------------- */
  // Every component is drawn the way the Kotlin line-art is drawn: a stroke
  // traced along its outline (stroke-dashoffset), then its fill appears.
  //   text     – an SVG copy of each word traces its glyph outlines
  //   boxes    – a rounded-rect outline traces in the border / fill colour
  //   icons    – their strokes trace
  // Exit is the reverse: the fill drains, leaving the outlines, which then
  // retract along their paths. Line-art and the sandbox wall retract too.
  // The four code slides keep their magic move.
  const PEN = !lite;
  if (PEN) document.documentElement.classList.add('pen');
  const NS = 'http://www.w3.org/2000/svg';
  const STROKES = '.art .ln, .illus .ln, .graph .wire, .spokes path, .ring .wall';
  const BLOCKS = [
    'h1', 'h2', '.label', '.lead', '.event', '.who > *', '.kq', '.who-ships > *',
    '.timeline .step', '.timeline .rail', '.lane-h', '.node-box', '.verdict', '.capdef',
    '.map .stop', '.map .wire', '.define', '.code .l', '.bubble', '.fname', '.cmd',
    '.rec', '.flow', '.strip .seg', '.sig-note', '.numbers .n', '.steps .st-i', '.steps .rail', '.tamper',
    '.ring .core', '.sticker', '.facts .fact', '.capline', '.file', '.device .plat', '.phone', '.device .under', '.policy > *',
    '.gcap', '.ladder .r', '.plane', '.nots .row', '.s-three .it', '.callback',
    '.s-thanks .qr', '.links', '.err-line', '.qr-card', '.url', '.s-follow .cap',
  ].join(',');

  const hiddenFragment = (el) => !!el.closest('.fragment:not(.visible):not(.light):not(.trigger):not(.wire)');
  function collect(root, sel) {
    const all = [...root.querySelectorAll(sel)].filter((el) => !hiddenFragment(el) && el.offsetWidth > 0);
    const set = new Set(all);
    return all.filter((el) => { for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (set.has(p)) return false; return true; });
  }
  function byPosition(els, descending) {
    const pos = new Map(els.map((el) => { const r = el.getBoundingClientRect(); return [el, r.top * 4 + r.left]; }));
    return els.sort((x, y) => (descending ? pos.get(y) - pos.get(x) : pos.get(x) - pos.get(y)));
  }
  const svgEl = (name, attrs) => { const e = document.createElementNS(NS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const transparent = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);

  // baseline from real font metrics, cached per font
  const metricCtx = document.createElement('canvas').getContext('2d');
  const metricCache = new Map();
  function ascentRatio(font) {
    if (!metricCache.has(font)) {
      metricCtx.font = font;
      const m = metricCtx.measureText('Hg');
      const asc = m.fontBoundingBoxAscent || 0.95; const desc = m.fontBoundingBoxDescent || 0.25;
      metricCache.set(font, asc / (asc + desc));
    }
    return metricCache.get(font);
  }

  // Build an overlay that holds the strokes for one component.
  // Returns { svg, strokes: [{el, len}], hide: element-to-fade }.
  function buildOverlay(block, layer, scale, origin) {
    const isSticker = block.classList.contains('sticker');
    const svg = svgEl('svg', { class: 'pen-ovl' });
    const strokes = [];
    let box;                      // overlay box in layer coordinates (unrotated)
    if (isSticker) {
      // stickers are rotated: mirror their placement instead of measuring
      const w = block.offsetWidth; const h = block.offsetHeight;
      svg.classList.add('pen-sticker');
      svg.style.cssText = block.getAttribute('style') || '';
      svg.style.width = `${w}px`; svg.style.height = `${h}px`;
      block.parentElement.appendChild(svg);
      box = { x: 0, y: 0, w, h };
    } else {
      const r = block.getBoundingClientRect();
      box = { x: (r.left - origin.left) / scale, y: (r.top - origin.top) / scale, w: r.width / scale, h: r.height / scale };
      Object.assign(svg.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
      layer.appendChild(svg);
    }
    const cs = getComputedStyle(block);
    // outline: only for components that have a visible border or fill
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const hasBorder = bw > 0 && !transparent(cs.borderTopColor);
    const hasFill = !transparent(cs.backgroundColor) || cs.backgroundImage !== 'none';
    if (hasBorder || hasFill) {
      // border-radius may be a percentage (circles) or px (pills clamp to half the height)
      const rawR = cs.borderTopLeftRadius;
      const rx = /%/.test(rawR) ? (parseFloat(rawR) / 100) * box.w : Math.min(parseFloat(rawR) || 0, box.w / 2, box.h / 2);
      const ry = /%/.test(rawR) ? (parseFloat(rawR) / 100) * box.h : rx;
      const rad = rx;
      const color = hasBorder ? cs.borderTopColor : (!transparent(cs.backgroundColor) ? cs.backgroundColor : '#ffffff');
      const sw = 2.6;
      const rect = svgEl('rect', { x: sw / 2, y: sw / 2, width: Math.max(0, box.w - sw), height: Math.max(0, box.h - sw), rx: rad, ry: ry,
        fill: 'none', stroke: color, 'stroke-width': sw, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 });
      svg.appendChild(rect); strokes.push({ el: rect, len: 1 });
    }
    // text: one SVG <text> per word, same font, traced as outlines
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.textContent.trim() && !n.parentElement.closest('svg, aside') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const ref = isSticker ? null : block.getBoundingClientRect();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const pcs = getComputedStyle(n.parentElement);
      if (pcs.visibility === 'hidden' || pcs.display === 'none') continue;
      const size = parseFloat(pcs.fontSize);
      const font = `${pcs.fontStyle} ${pcs.fontWeight} ${size}px ${pcs.fontFamily}`;
      const color = transparent(pcs.color) ? '#ffffff' : pcs.color;
      const len = Math.round(size * 4.5);
      const sw = Math.max(1.1, size / 46);
      const re = /\S+/g; let m;
      while ((m = re.exec(n.textContent))) {
        const t = svgEl('text', { fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linejoin': 'round',
          'stroke-dasharray': len, 'stroke-dashoffset': len });
        Object.assign(t.style, { font, letterSpacing: pcs.letterSpacing });
        if (isSticker) {
          t.setAttribute('x', '50%'); t.setAttribute('y', '50%');
          t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
          t.textContent = n.textContent.trim();
          svg.appendChild(t); strokes.push({ el: t, len });
          break; // the sticker's label, traced as one line
        }
        const range = document.createRange();
        range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
        const wr = range.getClientRects()[0];
        if (!wr) continue;
        const x = (wr.left - ref.left) / scale;
        const y = (wr.top - ref.top) / scale + (wr.height / scale) * ascentRatio(font);
        t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1));
        t.textContent = m[0];
        svg.appendChild(t); strokes.push({ el: t, len });
      }
      if (isSticker) break;
    }
    // icons: clone them into the overlay so their strokes can trace
    if (!isSticker) {
      block.querySelectorAll('svg.ic').forEach((ic) => {
        const ir = ic.getBoundingClientRect();
        if (!ir.width) return;
        const c = ic.cloneNode(true);
        c.setAttribute('x', ((ir.left - ref.left) / scale).toFixed(1)); c.setAttribute('y', ((ir.top - ref.top) / scale).toFixed(1));
        c.setAttribute('width', (ir.width / scale).toFixed(1)); c.setAttribute('height', (ir.height / scale).toFixed(1));
        c.setAttribute('viewBox', '0 0 48 48');
        c.style.color = getComputedStyle(ic).color;
        c.style.strokeDasharray = '170'; c.style.strokeDashoffset = '170';
        svg.appendChild(c); strokes.push({ el: c, len: 170, css: true });
      });
    }
    return { svg, strokes, block };
  }

  const dash = (s, from, to, opt) => s.el.animate([{ strokeDashoffset: from }, { strokeDashoffset: to }], opt);

  function layerFor(slide) {
    let layer = slide.querySelector(':scope > .pen-layer');
    if (!layer) { layer = document.createElement('div'); layer.className = 'pen-layer'; slide.appendChild(layer); }
    return layer;
  }
  function clearOverlays(slide) {
    slide.querySelectorAll('.pen-ovl').forEach((o) => o.remove());
    slide.querySelectorAll('[data-pen-hidden]').forEach((el) => { el.style.opacity = ''; el.removeAttribute('data-pen-hidden'); });
  }

  // Draw a set of components: trace outlines, then let the fill appear.
  function drawIn(slide, blocks, startDelay) {
    if (!blocks.length) return startDelay;
    let end = startDelay;
    const scale = deck.getScale(); const origin = slide.getBoundingClientRect(); const layer = layerFor(slide);
    const ease = 'cubic-bezier(.3,.7,.25,1)';
    byPosition(blocks, false).forEach((block, i) => {
      const ov = buildOverlay(block, layer, scale, origin);
      const target = +getComputedStyle(block).opacity || 1; // faint builds return to faint
      block.style.opacity = '0'; block.setAttribute('data-pen-hidden', '');
      const d = startDelay + Math.min(i * 70, 980);
      const trace = 820;
      end = Math.max(end, d + trace);
      ov.strokes.forEach((s) => dash(s, s.len, 0, { duration: trace, delay: d, easing: ease, fill: 'both' }));
      const fill = block.animate([{ opacity: 0 }, { opacity: target }], { duration: 320, delay: d + trace - 160, easing: 'ease-out', fill: 'both' });
      fill.onfinish = () => { block.style.opacity = ''; block.removeAttribute('data-pen-hidden'); fill.cancel(); };
      ov.svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, delay: d + trace, easing: 'ease-in', fill: 'forwards' })
        .onfinish = () => ov.svg.remove();
    });
    return end;
  }

  // Un-draw a slide: fill drains to outlines, outlines retract.
  function unDraw(slide) {
    const anims = [];
    slide.querySelectorAll('.ring .wall').forEach((w) => { w.setAttribute('pathLength', '1'); w.style.strokeDasharray = '1 2'; });
    const scale = deck.getScale(); const origin = slide.getBoundingClientRect(); const layer = layerFor(slide);
    const easeIn = 'cubic-bezier(.55,0,.75,.35)';
    byPosition(collect(slide, BLOCKS), true).forEach((block, i) => {
      const ov = buildOverlay(block, layer, scale, origin);
      const d = Math.min(i * 22, 260);
      ov.strokes.forEach((s) => { if (s.css) s.el.style.strokeDashoffset = '0'; else s.el.setAttribute('stroke-dashoffset', 0); });
      anims.push(block.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, delay: d, easing: 'ease-in', fill: 'forwards' }));
      anims.push(ov.svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: d, fill: 'both' }));
      ov.strokes.forEach((s) => anims.push(dash(s, 0, -s.len, { duration: 420, delay: d + 140, easing: easeIn, fill: 'forwards' })));
    });
    const artPending = slide.classList.contains('art-wait');
    const isArt = (el) => !!el.closest('.art, .illus');
    byPosition([...slide.querySelectorAll(STROKES)].filter((el) => !hiddenFragment(el) && !(artPending && isArt(el))), true)
      .forEach((el, i) => anims.push(el.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -1.02 }],
        { duration: 520, delay: Math.min(i * 3, 220), easing: easeIn, fill: 'forwards' })));
    if (!artPending) slide.querySelectorAll('.art .tile').forEach((el, i) => anims.push(el.animate([{ scale: '1', opacity: 1 }, { scale: '.4', opacity: 0 }],
      { duration: 380, delay: Math.min(i * 12, 220), easing: easeIn, fill: 'forwards' })));
    slide.querySelectorAll('.field, .dots, .ring .halo, .ring .wall-label, .step-dots').forEach((el) => anims.push(el.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 520, easing: 'ease-in', fill: 'forwards' })));
    return anims;
  }

  function enterSlide(slide) {
    slide.querySelectorAll('.ring .wall').forEach((w) => {
      w.setAttribute('pathLength', '1'); w.style.strokeDasharray = '1 2';
      w.animate([{ strokeDashoffset: 1.02 }, { strokeDashoffset: 0 }], { duration: 1200, delay: 120, easing: 'cubic-bezier(.3,.7,.25,1)', fill: 'backwards' });
    });
    clearTimeout(slide._artTimer);
    slide.classList.add('art-wait');
    const end = drawIn(slide, collect(slide, BLOCKS), 60);
    // the art starts as the last component finishes, overlapping a little
    slide._artTimer = setTimeout(() => slide.classList.remove('art-wait'), Math.max(0, end - 320));
  }

  let pen = null;
  const EXIT_TOTAL = 260 + 140 + 420 + 40;
  function finishPen() {
    if (!pen) return;
    clearTimeout(pen.timer);
    pen.anims.forEach((x) => x.cancel());
    clearOverlays(pen.prev);
    pen.prev.classList.remove('exiting');
    clearTimeout(pen.prev._artTimer);
    pen.prev.classList.remove('art-wait');
    pen.prev.style.display = pen.prevDisplay;
    pen.cur.classList.remove('waiting');
    pen = null;
  }
  function runPen(prev, cur) {
    finishPen();
    if (!PEN) return;
    const magicMove = prev && prev.hasAttribute('data-auto-animate') && cur.hasAttribute('data-auto-animate');
    if (prev) clearOverlays(prev);
    clearOverlays(cur);
    if (!prev || magicMove) { if (!magicMove) enterSlide(cur); return; }
    const prevDisplay = prev.style.display;
    prev.style.display = 'flex';
    prev.classList.add('exiting');
    cur.classList.add('waiting');
    pen = { prev, cur, anims: [], prevDisplay, timer: 0 };
    pen.anims = unDraw(prev);
    pen.timer = setTimeout(() => { finishPen(); enterSlide(cur); }, EXIT_TOTAL);
  }
  // a build drawn on click is drawn with the pen too
  function penFragment(f) {
    if (!PEN || f.classList.contains('light') || f.classList.contains('trigger')) return;
    const slide = f.closest('section');
    const blocks = f.matches(BLOCKS) ? [f] : collect(f, BLOCKS);
    drawIn(slide, blocks, 0);
  }

  /* ---- Wiring ------------------------------------------------------------ */
  let wipeDelay = 0;
  deck.on('ready', (e) => { if (PEN) document.fonts.ready.then(() => enterSlide(e.currentSlide)); });
  deck.on('overviewshown', () => { clearWipe(); finishPen(); });
  deck.on('overviewshown', clearWipe);

  deck.on('fragmentshown', (e) => {
    const f = e.fragment;
    const slide = f.closest('section');
    if (f.dataset.run === 'timeline') runTimeline(slide);
    if (f.hasAttribute('data-sig')) slide.classList.add('sig-on');
    countUp(f);
    penFragment(f);
  });
  deck.on('fragmenthidden', (e) => {
    const f = e.fragment;
    if (f.dataset.run === 'timeline') resetTimeline(f.closest('section'));
    if (f.hasAttribute('data-sig')) f.closest('section').classList.remove('sig-on');
  });
  deck.on('slidechanged', (e) => {
    if (!lite && !deck.isOverview() && !document.documentElement.classList.contains('print-pdf')) {
      const prev = e.previousSlide;
      const forward = prev ? deck.getIndices(prev).h <= e.indexh : true;
      // the background changes while the old slide is half un-drawn
      clearTimeout(wipeDelay);
      const from = paintOf(prev); const to = paintOf(e.currentSlide); const key = colorOf(e.currentSlide);
      wipeDelay = setTimeout(() => wipe(from, to, forward, key), prev ? 160 : 0);
      runPen(prev, e.currentSlide);
    }
    if (e.previousSlide) resetTimeline(e.previousSlide);
    if (e.previousSlide === demo) toggleDemoVideo(false);
    const s = e.currentSlide;
    if (s.querySelector('[data-run="timeline"].visible')) runTimeline(s);
    const sig = s.querySelector('[data-sig]');
    if (sig) s.classList.toggle('sig-on', sig.classList.contains('visible'));
  });
})();
