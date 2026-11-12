// Zero-dependency CDP layout check at 375/768/1440.
// Usage: node tools/check-layout.mjs [url] [--shots dist/shots]
// Without a url it serves the repo root on 127.0.0.1 (ephemeral port).
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let shots = null;
let urlArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--shots') { shots = args[i + 1]; i++; continue; }
  if (args[i].startsWith('--')) continue;
  urlArg ??= args[i];
}
if (shots) {
  const dir = resolve(shots);
  const dist = join(ROOT, 'dist');
  if (dir !== dist && !dir.startsWith(dist + sep)) {
    console.error(`--shots must be inside ${dist}`);
    process.exit(2);
  }
  shots = dir;
}

const EXES = [process.env.BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const EXE = EXES.find((p) => existsSync(p));
if (!EXE) { console.error('No Edge/Chrome found. Set BROWSER.'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = urlArg ? null : await startStaticServer(ROOT);
const url = urlArg ?? server.url;
// Expected counts come from the content manifest, not from hard-coded numbers.
const manifest = JSON.parse(readFileSync(join(ROOT, 'tools', 'content-manifest.json'), 'utf8'));
const EXPECT = {
  companies: manifest.companies.length,
  cards: manifest.projects.filter((p) => p.company === 'kn-curation').length,
  keywordBlocks: manifest.keywords.length,
};
const prof = mkdtempSync(join(tmpdir(), 'layoutprof-'));
// Port 0 = the browser picks a free port and reports it in <profile>/DevToolsActivePort,
// so the port we talk to is guaranteed to belong to the browser we launched.
const proc = spawn(EXE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let failed = 0;
const report = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };
let ws;

try {
  let PORT;
  for (let i = 0; i < 100 && !PORT; i++) {
    try {
      const n = Number(readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]);
      if (n > 0) PORT = n;
    } catch { /* not written yet */ }
    if (!PORT) await sleep(100);
  }
  if (!PORT) throw new Error('browser did not report a debugging port');
  let list;
  for (let i = 0; i < 60 && !list?.some((t) => t.type === 'page'); i++) {
    try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { await sleep(100); }
  }
  if (!list) throw new Error('browser did not start');
  ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed');
    return r.result.value;
  };

  await send('Page.enable');
  await send('Emulation.setScrollbarsHidden', { hidden: true });
  if (shots) mkdirSync(shots, { recursive: true });

  const origin = new URL(url).origin;
  for (const [w, h] of [[320, 812], [375, 812], [768, 1024], [1440, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: `${url}${url.includes('?') ? '&' : '?'}w=${w}` });
    // poll until the new document (not about:blank / the previous width's page) is complete
    for (let i = 0; i < 100; i++) {
      const st = await evalJs(`location.href.includes('w=${w}') && document.readyState === 'complete'`);
      if (st) break;
      await sleep(100);
    }
    await evalJs('document.fonts.ready.then(() => 1)');
    // layout settled: two identical document heights in a row
    for (let i = 0, last = -1; i < 20; i++) {
      const h = await evalJs('document.documentElement.scrollHeight');
      if (h === last) break;
      last = h;
      await sleep(50);
    }
    const p = `${w}px`;

    // (a) overflow
    const o = await evalJs(`(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const wide = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > vw + 0.5 || r.left < -0.5) && getComputedStyle(e).position !== 'fixed';
      }).slice(0, 5).map((e) => e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '') + (e.id ? '#' + e.id : ''));
      return { vw, scrollW: de.scrollWidth, bodyScrollW: document.body.scrollWidth, wide };
    })()`);
    const oOk = o.scrollW <= o.vw && o.bodyScrollW <= o.vw;
    report(oOk, `${p} overflow: viewport ${o.vw}, scrollWidth ${o.scrollW}, body ${o.bodyScrollW}${oOk ? '' : ' offenders ' + JSON.stringify(o.wide)}`);

    // (b) grid columns
    const want = w <= 375 ? 1 : w === 768 ? 2 : 3;
    const g = await evalJs(`[...document.querySelectorAll('.project-grid')].map((e) => ({ id: e.parentElement.id, cols: getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean).length }))`);
    const gOk = g.length === EXPECT.companies && g.every((x) => x.cols === want);
    report(gOk, `${p} grid columns: want ${want}, got ${JSON.stringify(g.map((x) => x.id + ':' + x.cols))}`);

    // (c) equal heights per row
    const eq = await evalJs(`(() => {
      const cards = [...document.querySelectorAll('#kn-curation .project-grid > .project')];
      const rows = new Map();
      cards.forEach((c) => { const k = c.offsetTop; rows.set(k, (rows.get(k) || []).concat(c.getBoundingClientRect().height)); });
      return { cards: cards.length, bad: [...rows.values()].filter((hs) => Math.max(...hs) - Math.min(...hs) > 1).length };
    })()`);
    report(eq.cards === EXPECT.cards && eq.bad === 0, `${p} equal heights in kn-curation: ${eq.cards}/${EXPECT.cards} cards, ${eq.bad} uneven rows`);

    // keyword section shows all three blocks
    const kw = await evalJs(`(() => {
      const blocks = [...document.querySelectorAll('#keywords .keyword-block')];
      return blocks.map((b) => {
        const r = b.getBoundingClientRect(), t = b.querySelector('.keyword-title'), l = b.querySelectorAll('.keyword-list a');
        const tr = t ? t.getBoundingClientRect() : { width: 0, height: 0 };
        const lv = [...l].every((a) => { const x = a.getBoundingClientRect(); return x.width > 0 && x.height > 0 && getComputedStyle(a).visibility === 'visible'; });
        return r.height > 0 && tr.width > 0 && tr.height > 0 && l.length > 0 && lv && getComputedStyle(b).display !== 'none';
      });
    })()`);
    report(kw.length === EXPECT.keywordBlocks && kw.every(Boolean), `${p} keyword section: ${kw.length} blocks, visible ${JSON.stringify(kw)}`);

    // anchors land below the fixed header; meta visible without hovering
    // poll until scrollY stops changing (smooth scrolling finished)
    const settleScroll = async () => {
      let last = null;
      let same = 0;
      for (let i = 0; i < 40 && same < 3; i++) {
        await sleep(50);
        const y = await evalJs('Math.round(window.scrollY * 10)');
        same = y === last ? same + 1 : 0;
        last = y;
      }
    };
    const jump = async (hash, viaSel) => {
      await evalJs('window.scrollTo(0, 0)');
      await settleScroll();
      if (viaSel) await evalJs(`document.querySelector(${JSON.stringify(viaSel)}).click()`);
      else await evalJs(`location.hash = ${JSON.stringify(hash)}`);
      await settleScroll();
      return evalJs(`(() => {
        const hd = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
        const t = document.querySelector(${JSON.stringify(hash)});
        const top = t.getBoundingClientRect().top;
        const m = t.querySelector('.meta');
        const mr = m ? m.getBoundingClientRect() : null;
        return { hd, top, metaTop: mr && mr.top, metaBottom: mr && mr.bottom, ih: innerHeight };
      })()`);
    };
    const visible = (sel) => evalJs(`(() => { const a = document.querySelector(${JSON.stringify(sel)}); if (!a) return false; const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()`);
    const cases = [
      ['#career', '.site-nav a[href="#career"]'],
      ['#keywords', null],
      ['#abbey-road', '.career a[href="#abbey-road"]'],
      ['#kn-fsd', '.keyword-list a[href="#kn-fsd"]'],
      ['#gi-oneday', '.keyword-list a[href="#gi-oneday"]'],
      ['#ab-peach', null],
    ];
    for (const [target, sel] of cases) {
      const viaSel = sel && (await visible(sel)) ? sel : null;
      const v = await jump(target, viaSel);
      const delta = v.top - v.hd;
      report(delta >= -0.5 && delta <= 32.5, `${p} anchor ${target}${viaSel ? ' (link click)' : ' (hash)'}: offset below header (nominal --header-h) ${delta.toFixed(1)}px`);
      if (v.metaTop != null) {
        report(v.metaTop >= v.hd - 0.5 && v.metaBottom <= v.ih + 0.5, `${p} meta of ${target} visible: top ${v.metaTop.toFixed(1)}, bottom ${v.metaBottom.toFixed(1)}, header ${v.hd.toFixed(1)}, viewport ${v.ih}`);
      }
    }
    await evalJs('window.scrollTo(0, 0)');

    // tap targets
    const tap = await evalJs(`(() => {
      const bad = [];
      document.querySelectorAll('.site-nav a, .career a, .keyword-list a, .links a, .cover-mail a, .contact-list a').forEach((a) => {
        const r = a.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const min = a.closest('.keyword-list') ? 48 : 44;
        if (r.height < min - 0.5) bad.push((a.getAttribute('href') || '').slice(0, 24) + ':' + r.height.toFixed(1));
      });
      return bad;
    })()`);
    report(tap.length === 0, `${p} tap targets: ${tap.length ? 'too small ' + JSON.stringify(tap.slice(0, 5)) : 'all >= 44px (keywords >= 48px)'}`);

    // fonts, same-origin only
    const f = await evalJs(`({
      family: getComputedStyle(document.body).fontFamily,
      check: document.fonts.check('16px Pretendard'),
      foreign: performance.getEntriesByType('resource').map((e) => e.name).filter((n) => new URL(n).origin !== ${JSON.stringify(origin)}),
      woff2: performance.getEntriesByType('resource').filter((e) => /\\.woff2/.test(e.name)).length,
    })`);
    report(/^"?Pretendard/.test(f.family) && f.check && f.foreign.length === 0, `${p} fonts: family ${f.family.split(',')[0]}, check ${f.check}, woff2 requests ${f.woff2}, third-party ${f.foreign.length}`);

    if (shots) {
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      writeFileSync(join(shots, `w${w}.png`), Buffer.from(s.data, 'base64'));
    }
  }
} catch (e) {
  failed++;
  console.log(`FAIL check-layout crashed: ${e.message}`);
} finally {
  try { ws?.close(); } catch {}
  if (process.platform === 'win32') {
    if (proc.pid) spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
    // the launcher may hand off to child processes: kill browser processes started with our temp profile.
    // Match by image name + profile tag and exclude this PowerShell itself ($PID), whose own command line contains the tag.
    const tag = prof.split(/[\\/]/).pop();
    const ps = `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.Name -match '^(msedge|chrome)\\.exe$' -and $_.CommandLine -like '*${tag}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
    spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
  } else {
    proc.kill();
  }
  await sleep(500);
  for (let i = 0; i < 5; i++) {
    try { rmSync(prof, { recursive: true, force: true }); break; } catch (e) {
      if (i === 4) console.warn(`warn: could not remove temp profile ${prof}: ${e.message}`);
      else await sleep(500);
    }
  }
  await server?.close();
}
process.exit(failed ? 1 : 0);
