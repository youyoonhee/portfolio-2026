// Converts a flat-background pixel-art JPG into a small transparent PNG for img/deco/.
// Usage: node tools/make-deco.mjs <input.jpg> <output.png> --height <px> [--tol <n>] [--fringe <n>]
//        node tools/make-deco.mjs <input.jpg> --probe
// The background is the median colour of the 1px border; only pixels CONNECTED to the edge are cleared
// (flood fill), so enclosed light areas such as a white cat body stay opaque.
// Output is restricted to img/deco/ and is resized with nearest-neighbour to keep pixels crisp.
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DECO = join(ROOT, 'img', 'deco');
const USAGE = 'usage: node tools/make-deco.mjs <input.jpg> <output.png> --height <px> [--tol <n>] [--fringe <n>]\n       node tools/make-deco.mjs <input.jpg> --probe';

function fail(msg) { console.error(`make-deco: ${msg}\n${USAGE}`); process.exit(1); }

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const input = args[0];
if (!input || input.startsWith('--')) fail('missing input');
if (!existsSync(input)) fail(`input not found: ${basename(input)}`);

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const px = (x, y) => (y * W + x) * 3;

const median = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[s.length >> 1]; };
const border = [];
for (let x = 0; x < W; x++) { border.push(px(x, 0), px(x, H - 1)); }
for (let y = 1; y < H - 1; y++) { border.push(px(0, y), px(W - 1, y)); }
const bg = [0, 1, 2].map((c) => median(border.map((p) => data[p + c])));
const dist = (p) => Math.max(Math.abs(data[p] - bg[0]), Math.abs(data[p + 1] - bg[1]), Math.abs(data[p + 2] - bg[2]));

if (args.includes('--probe')) {
  const hist = {};
  for (let p = 0; p < data.length; p += 3) { const d = dist(p); const k = d > 40 ? '>40' : String(Math.floor(d / 4) * 4); hist[k] = (hist[k] ?? 0) + 1; }
  console.log(`size ${W}x${H} border-median rgb(${bg.join(',')})`);
  console.log('distance histogram (bucket of 4):', JSON.stringify(hist));
  process.exit(0);
}

const out = args[1];
if (!out || out.startsWith('--')) fail('missing output');
const outAbs = resolve(ROOT, out);
const rel = relative(DECO, outAbs);
if (rel.startsWith('..') || isAbsolute(rel) || dirname(rel) !== '.' || !/^[a-z0-9-]+\.png$/.test(rel)) fail('output must be img/deco/<name>.png');
const height = Number(flag('--height'));
if (!Number.isInteger(height) || height < 1) fail('--height must be a positive integer');
const tol = flag('--tol') === undefined ? 24 : Number(flag('--tol'));
const fringe = flag('--fringe') === undefined ? 0 : Number(flag('--fringe'));
if (!Number.isFinite(tol) || !Number.isFinite(fringe)) fail('--tol/--fringe must be numbers');

// flood fill from the border (4-connected)
const gone = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
let qh = 0, qt = 0;
const seed = (x, y) => { const i = y * W + x; if (!gone[i] && dist(px(x, y)) <= tol) { gone[i] = 1; queue[qt++] = i; } };
for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
while (qh < qt) {
  const i = queue[qh++]; const x = i % W, y = (i / W) | 0;
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const j = ny * W + nx;
    if (!gone[j] && dist(px(nx, ny)) <= tol) { gone[j] = 1; queue[qt++] = j; }
  }
}
// optional one-ring fringe clean-up next to cleared pixels
if (fringe > tol) {
  const extra = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (gone[i] || dist(px(x, y)) > fringe) continue;
    if ((x > 0 && gone[i - 1]) || (x < W - 1 && gone[i + 1]) || (y > 0 && gone[i - W]) || (y < H - 1 && gone[i + W])) extra.push(i);
  }
  for (const i of extra) gone[i] = 1;
}

const rgba = Buffer.alloc(W * H * 4);
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x, p = px(x, y), o = i * 4;
  rgba[o] = data[p]; rgba[o + 1] = data[p + 1]; rgba[o + 2] = data[p + 2];
  rgba[o + 3] = gone[i] ? 0 : 255;
  if (!gone[i]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
if (maxX < 0) fail('nothing left after background removal (tol too high)');

const res = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .resize({ height, kernel: 'nearest' })
  .png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 })
  .toFile(outAbs);
console.log(`${relative(ROOT, outAbs).replaceAll('\\', '/')} ${res.width}x${res.height} ${res.size}`);
