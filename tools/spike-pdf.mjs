// PDF spike runner: prints index.html (or a fixture) to an A4 PDF with headless Edge/Chrome.
// Output is restricted to <repo>/dist/ (gitignored). No dependencies beyond Node built-ins.
// usage: node tools/spike-pdf.mjs <out.pdf> [--browser edge|chrome] [--url <url>] [--lazy-fixture]
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, statSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';
import { startStaticServer } from './lib/static-server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const outArg = args.find((a, i) => !a.startsWith('--') && (i === 0 || !['--browser', '--url'].includes(args[i - 1])));

if (!outArg) { console.error('usage: spike-pdf.mjs <out.pdf> [--browser edge|chrome] [--url <url>] [--lazy-fixture]'); process.exit(2); }
const out = resolve(outArg);
if (!out.startsWith(distDir + sep)) {
  console.error('refusing: output must be inside dist/ (gitignored)');
  process.exit(2);
}

const BROWSERS = {
  edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
};
const browser = process.env.BROWSER || BROWSERS[opt('--browser') || 'edge'];
if (!browser || !existsSync(browser)) { console.error('browser not found'); process.exit(2); }

function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}
function solidPng(w, h, [r, g, b]) {
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

if (opt('--url')?.startsWith('-')) { console.error('refusing: --url must not start with "-"'); process.exit(2); }
mkdirSync(distDir, { recursive: true });
if (flag('--lazy-fixture') && !opt('--url')) {
  writeFileSync(join(distDir, 'lazy-fixture.html'),
    '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>lazy fixture</title>' +
    '<style>body{margin:0}.spacer{height:3000px}img{display:block}</style></head><body>' +
    '<div class="spacer"></div><img loading="lazy" width="240" height="160" src="lazy-fixture.png" alt=""></body></html>');
  writeFileSync(join(distDir, 'lazy-fixture.png'), solidPng(240, 160, [10, 122, 61]));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function killTree(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    // process.kill(-pid) is unsupported on Windows; taskkill /T takes down renderer/GPU children too
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try { process.kill(-child.pid); } catch { /* already gone */ }
    try { process.kill(child.pid); } catch { /* already gone */ }
  }
}
const t0 = Date.now();
let server = null;
let profile = null;
let code = 0;
try {
  let url = opt('--url');
  if (!url) {
    server = await startStaticServer(root, { allow: ['dist'] }); // dist is denied by default; fixtures live there
    const base = server.url.endsWith('/') ? server.url : server.url + '/';
    url = flag('--lazy-fixture') ? `${base}dist/lazy-fixture.html` : `${base}index.html`;
  }
  if (existsSync(out)) unlinkSync(out);
  profile = mkdtempSync(join(tmpdir(), 'spike-pdf-profile-'));
  const child = spawn(browser, [
    '--headless=new', '--disable-gpu', `--user-data-dir=${profile}`,
    '--no-pdf-header-footer', `--print-to-pdf=${out.replaceAll('\\', '/')}`, url,
  ], { detached: process.platform !== 'win32', stdio: 'ignore' });
  let spawnError = null;
  let failedExit = null; // the launcher may exit 0 after handing off to the real browser, so only a non-zero exit is conclusive
  child.on('error', (e) => { spawnError = e; });
  child.on('exit', (c, sig) => { if (c !== 0) failedExit = `code ${c ?? sig}`; });

  let last = -1; let stable = 0;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    await sleep(300);
    if (spawnError) break;
    if (existsSync(out)) {
      const size = statSync(out).size;
      if (size > 0 && size === last) { if (++stable >= 2) break; } else stable = 0;
      last = size;
    } else if (failedExit) break;
  }
  if (spawnError) { console.error(`browser failed to start: ${spawnError.message}`); code = 1; }
  else if (stable < 2) { console.error(failedExit ? `browser exited (${failedExit}) without writing a PDF` : 'timeout: PDF not written within 30s'); code = 1; }
  else console.log(`ok ${statSync(out).size} bytes in ${Date.now() - t0} ms`);
  killTree(child);
} finally {
  if (server) await server.close();
  if (profile) {
    let removed = false;
    for (let i = 0; i < 5 && !removed; i++) {
      await sleep(500);
      try { rmSync(profile, { recursive: true, force: true }); removed = true; } catch (e) {
        if (i === 4) console.warn(`warn: could not remove temp profile ${profile}: ${e.message}`);
      }
    }
  }
}
process.exit(code);
