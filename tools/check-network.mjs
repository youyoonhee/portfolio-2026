// Network check: loads the page at three viewports in fresh contexts, scrolls to the bottom,
// and fails on any response >= 400 or failed request. Chrome only (CHROME_PATH may point to Edge).
// Usage: node tools/check-network.mjs [url] [--probe-404] [--timeout-ms N] [--out <file>]
//        node tools/check-network.mjs --self-test
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, isAbsolute } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), '..');
const VIEWPORTS = [[375, 812], [768, 1024], [1440, 900]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function insideDist(p) {
  const rel = relative(join(ROOT, 'dist'), resolve(p));
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

async function scrollAll(page) {
  await page.evaluate(async () => {
    const step = 600;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  });
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});
}

function listen(page, failures, skipUrl) {
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url() !== skipUrl) failures.push(`${res.status()} ${res.url()}`);
  });
  page.on('requestfailed', (req) => {
    failures.push(`FAILED ${req.url()} ${req.failure()?.errorText ?? ''}`);
  });
}

export async function runNetwork(browser, url, { probe404 = false } = {}) {
  const base = url.endsWith('/') ? url : url + '/';
  const failures = [];
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.createBrowserContext();
    try {
      const page = await ctx.newPage();
      await page.setViewport({ width: w, height: h });
      const local = [];
      listen(page, local, null);
      const res = await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
      if (!res || res.status() >= 400) local.push(`${res?.status()} ${base}`);
      await scrollAll(page);
      failures.push(...local.map((f) => `[${w}x${h}] ${f}`));
    } finally {
      await ctx.close().catch(() => {});
    }
  }
  let probe = null;
  if (probe404) {
    const probeUrl = base + 'x/y';
    const ctx = await browser.createBrowserContext();
    try {
      const page = await ctx.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      const local = [];
      listen(page, local, probeUrl);
      const res = await page.goto(probeUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      const status = res?.status() ?? 0;
      const h1 = await page.$eval('h1', (e) => e.textContent.trim()).catch(() => '');
      probe = { url: probeUrl, status, h1, subFailures: local };
      if (status !== 404) failures.push(`probe-404: status ${status}, expected 404`);
      if (h1 !== '페이지를 찾을 수 없습니다.') failures.push(`probe-404: h1 is "${h1}"`);
      failures.push(...local.map((f) => `[probe-404] ${f}`));
    } finally {
      await ctx.close().catch(() => {});
    }
  }
  return { failures, probe };
}

async function runWithTimeout(url, opts, timeoutMs, outFile) {
  let browser;
  let timedOut = false;
  const timer = setTimeout(async () => {
    timedOut = true;
    console.log(`network: timeout after ${timeoutMs} ms`);
    await closeBrowser(browser);
    process.exit(1);
  }, timeoutMs);
  try {
    browser = await launchChrome();
    if (timedOut) return 1;
    const version = await browser.version();
    console.log(`browser: ${version}`);
    const { failures, probe } = await runNetwork(browser, url, opts);
    failures.forEach((f) => console.log(f));
    console.log(`network: ${failures.length} failing requests`);
    if (outFile) {
      const rel = resolve(outFile);
      if (!insideDist(rel)) { console.log('--out must be inside dist/'); return 2; }
      mkdirSync(dirname(rel), { recursive: true });
      writeFileSync(rel, JSON.stringify({ browser: version, url, viewports: VIEWPORTS.map(([w, h]) => `${w}x${h}`), failures, probe404: probe }, null, 2) + '\n');
    }
    return failures.length ? 1 : 0;
  } finally {
    clearTimeout(timer);
    await closeBrowser(browser);
  }
}

function selfTest() {
  const results = [];
  const base = mkdtempSync(join(tmpdir(), 'check-network-'));
  const mk = (name, html) => {
    const dir = join(base, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    return dir;
  };
  try {
    const bad = mk('bad', '<!doctype html><meta charset="utf-8"><title>t</title><link rel="icon" href="data:,"><link rel="stylesheet" href="missing.css"><p>x</p>');
    const good = mk('good', '<!doctype html><meta charset="utf-8"><title>t</title><link rel="icon" href="data:,"><p>x</p>');
    const run = (dir) => spawnSync(process.execPath, [SELF, '--root', dir, '--timeout-ms', '90000'], { encoding: 'utf8' });
    const rb = run(bad);
    results.push(['broken stylesheet fails', rb.status === 1 && /404 http:\/\/127\.0\.0\.1:\d+\/missing\.css/.test(rb.stdout)]);
    const rg = run(good);
    results.push(['clean fixture passes', rg.status === 0 && /network: 0 failing requests/.test(rg.stdout)]);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  let failed = 0;
  for (const [n, ok] of results) { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`); if (!ok) failed++; }
  if (failed) { console.log(`check-network self-test: ${failed} failed`); return 1; }
  console.log(`check-network self-test: ${results.length} passed`);
  return 0;
}

const args = process.argv.slice(2);
const flag = (n) => args.indexOf(n);
const val = (n) => (flag(n) > -1 ? args[flag(n) + 1] : null);

if (args.includes('--self-test')) {
  process.exit(selfTest());
}
const timeoutMs = Number(val('--timeout-ms') ?? 120000);
const outFile = val('--out');
const rootOpt = val('--root');
const urlArg = args.find((a, i) => /^https?:\/\//.test(a) && args[i - 1] !== '--out');
const probe404 = args.includes('--probe-404');

let server;
let code = 1;
try {
  let url = urlArg;
  if (!url) {
    server = await startStaticServer(rootOpt ? resolve(rootOpt) : ROOT);
    url = server.url;
  }
  code = await runWithTimeout(url, { probe404 }, timeoutMs, outFile);
} catch (err) {
  console.log(`network: error ${String(err && err.message).slice(0, 200)}`);
  code = 1;
} finally {
  if (server) await server.close();
}
process.exit(code);
