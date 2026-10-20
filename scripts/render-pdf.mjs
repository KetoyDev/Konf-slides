// Renders a talk to PDF: every slide in its final state (all builds shown),
// captured at 1920x1080 by headless Chrome and bound into one file.
//
//   python3 -m http.server 4173          # from the repo root, in another terminal
//   node scripts/render-pdf.mjs devfest-chennai-26 kotlin-over-the-air.pdf
//
// Needs Google Chrome and python3 with Pillow (pip install pillow).
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [talk, pdfName = 'slides.pdf', base = 'http://localhost:4173'] = process.argv.slice(2);
if (!talk) { console.error('usage: node scripts/render-pdf.mjs <talk-folder> [pdf-name] [base-url]'); process.exit(1); }
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, talk, pdfName);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9337;
const work = mkdtempSync(join(tmpdir(), 'deck-pdf-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(work, 'profile')}`,
  '--hide-scrollbars', '--no-first-run', '--window-size=1920,1080', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); }
    catch { await sleep(200); }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const run = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  // ?lite: no pen draw-ins, so every slide settles in its final state
  await send('Page.navigate', { url: `${base}/${talk}/?lite` });
  await sleep(1500);
  await run(`new Promise(r => { const t = () => (window.deck && deck.isReady()) ? document.fonts.ready.then(r) : setTimeout(t, 100); t(); })`);
  await run(`document.documentElement.classList.add('embedded'); 1`); // hides the PDF button
  const total = await run('deck.getTotalSlides()');
  const shots = [];
  for (let i = 0; i < total; i++) {
    await run(`deck.slide(${i}, 0); while (deck.nextFragment()) {}; 1`);
    await sleep(1600);
    await run(`document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} }); 1`);
    await sleep(250);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const file = join(work, `slide-${String(i + 1).padStart(2, '0')}.png`);
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    shots.push(file);
    process.stdout.write(`\rslide ${i + 1}/${total}`);
  }
  const title = (await run('document.title')) || talk;
  ws.close();
  execFileSync('python3', ['-c', `
import io, sys
from PIL import Image
out, title, files = sys.argv[1], sys.argv[2], sys.argv[3:]
pages = []
for f in files:
    buf = io.BytesIO(); Image.open(f).convert('RGB').save(buf, 'JPEG', quality=88, optimize=True); buf.seek(0)
    pages.append(Image.open(buf))
pages[0].save(out, 'PDF', save_all=True, append_images=pages[1:], resolution=144, title=title, author='Aditya Shinde')
`, out, title, ...shots]);
  console.log(`\nwrote ${out}`);
} finally {
  chrome.kill();
  rmSync(work, { recursive: true, force: true });
}
