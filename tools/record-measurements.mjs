// Builds tools/measurements.json from report files only (Lighthouse JSON, check-nu --out JSON,
// linkinator JSON) plus explicit browser results. Nothing is typed by hand.
// Usage: node tools/record-measurements.mjs --lighthouse a.json [--lighthouse b.json ...] --nu nu.json
//          --links links.json --browser "Chrome=157.0:headless" --untested "iOS Safari:real-device"
//          [--record file] [--dry-run]
//        node tools/record-measurements.mjs --self-test
// Report inputs must live inside dist/ (gitignored).
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, isAbsolute } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { validateRecord } from './colophon-sync.mjs';

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), '..');
const DEFAULT_RECORD = join(ROOT, 'tools', 'measurements.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

class Exit extends Error {
  constructor(code, msg) { super(msg); this.code = code; }
}

function readReport(file, distRoot) {
  const p = resolve(file);
  const rel = relative(distRoot, p);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) throw new Exit(2, `report must be inside dist/: ${file}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

const median = (a) => [...a].sort((x, y) => x - y)[(a.length - 1) / 2];
const seoDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

export function summariseLighthouse(runs) {
  if (!runs.length) throw new Exit(2, 'no lighthouse runs');
  if (runs.length % 2 === 0) throw new Exit(2, 'lighthouse run count must be odd');
  const forms = new Set(runs.map((r) => r.configSettings?.formFactor));
  if (forms.size !== 1 || ![...forms][0]) throw new Exit(1, 'lighthouse formFactor differs between runs');
  const cat = (key) => median(runs.map((r) => Math.round((r.categories?.[key]?.score ?? NaN) * 100)));
  const latest = runs.map((r) => r.fetchTime).sort().at(-1);
  return {
    measuredAt: seoDate(latest),
    lighthouse: {
      form: [...forms][0],
      performance: cat('performance'),
      accessibility: cat('accessibility'),
      bestPractices: cat('best-practices'),
      seo: cat('seo'),
      crawlableFailed: runs.every((r) => r.audits?.['is-crawlable']?.score === 0),
    },
  };
}

async function recheck(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
    console.log(`recheck ${res.status} ${url}`);
    return res.status < 400;
  } catch (e) {
    console.log(`recheck error ${url}`);
    return false;
  }
}

export async function countBroken(links, recheckFn = recheck) {
  const broken = [...new Set((links.links || []).filter((l) => l.state === 'BROKEN' && !String(l.url).startsWith('mailto:')).map((l) => l.url))];
  let n = 0;
  for (const u of broken) if (!(await recheckFn(u))) n++;
  return n;
}

function parseBrowsers(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--browser') {
      const m = /^(.+?)=(.+):(headless|real-device)$/.exec(args[++i] || '');
      if (!m) throw new Exit(1, 'bad --browser value');
      out.push({ name: m[1], version: m[2], tested: true, method: m[3] });
    } else if (args[i] === '--untested') {
      const m = /^(.+):(headless|real-device)$/.exec(args[++i] || '');
      if (!m) throw new Exit(1, 'bad --untested value');
      out.push({ name: m[1], version: null, tested: false, method: m[2] });
    }
  }
  const names = out.map((b) => b.name);
  if (new Set(names).size !== names.length) throw new Exit(1, 'duplicate browser name');
  return out;
}

export async function build(args, { distRoot = join(ROOT, 'dist'), recheckFn } = {}) {
  const multi = (flag) => args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));
  const val = (flag) => multi(flag)[0] ?? null;
  const lhFiles = multi('--lighthouse');
  const recordPath = resolve(val('--record') || DEFAULT_RECORD);
  const existing = existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, 'utf8')) : null;

  const lh = summariseLighthouse(lhFiles.map((f) => readReport(f, distRoot)));
  const nuFile = val('--nu');
  const linksFile = val('--links');
  if (!nuFile || !linksFile) throw new Exit(2, '--nu and --links are required');
  const nu = readReport(nuFile, distRoot);
  const links = readReport(linksFile, distRoot);
  let browsers = parseBrowsers(args);
  if (existing?.browsers) {
    const order = existing.browsers.map((b) => b.name);
    if (order.length === browsers.length && order.every((n) => browsers.some((b) => b.name === n))) {
      browsers = order.map((n) => browsers.find((b) => b.name === n));
    }
  }
  const record = {
    measuredAt: lh.measuredAt,
    lighthouse: lh.lighthouse,
    validator: { htmlErrors: nu.errors, brokenLinks: await countBroken(links, recheckFn) },
    browsers,
  };
  try { validateRecord(record); } catch (e) { throw new Exit(1, e.message); }
  return { record, recordPath };
}

async function main(args) {
  const { record, recordPath } = await build(args);
  const json = JSON.stringify(record, null, 2) + '\n';
  const l = record.lighthouse;
  console.log(`record: lighthouse ${l.performance}/${l.accessibility}/${l.bestPractices}/${l.seo} (${l.form}), htmlErrors ${record.validator.htmlErrors}, brokenLinks ${record.validator.brokenLinks}, measuredAt ${record.measuredAt}`);
  if (args.includes('--dry-run')) { console.log(json); return 0; }
  writeFileSync(recordPath, json);
  return 0;
}

async function selfTest() {
  const { startStaticServer } = await import('./lib/static-server.mjs');
  const base = mkdtempSync(join(tmpdir(), 'record-meas-'));
  const dist = join(base, 'dist');
  const site = join(base, 'site');
  mkdirSync(dist, { recursive: true });
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, 'ok.html'), '<p>ok</p>');
  const server = await startStaticServer(site);
  const results = [];
  const t = (n, ok) => results.push([n, Boolean(ok)]);
  const lhRun = (p, a, b, s, form = 'mobile', t0 = '2026-11-16T15:30:00.000Z', crawl = 0) => ({
    fetchTime: t0, configSettings: { formFactor: form },
    categories: { performance: { score: p }, accessibility: { score: a }, 'best-practices': { score: b }, seo: { score: s } },
    audits: { 'is-crawlable': { score: crawl } },
  });
  const w = (name, obj) => { const f = join(dist, name); writeFileSync(f, JSON.stringify(obj)); return f; };
  const expectExit = async (fn) => { try { await fn(); return 0; } catch (e) { return e instanceof Exit ? e.code : -1; } };
  const lh = [w('a.json', lhRun(0.95, 1, 1, 1)), w('b.json', lhRun(0.97, 1, 1, 1)), w('c.json', lhRun(0.99, 0.9, 1, 1))];
  const nu = w('nu.json', { errors: 0, warnings: 1 });
  const links = w('links.json', { links: [
    { url: `${server.url}ok.html`, state: 'BROKEN' },
    { url: `${server.url}gone.html`, state: 'BROKEN' },
    { url: 'mailto:a@b.c', state: 'BROKEN' },
    { url: `${server.url}ok.html`, state: 'OK' },
  ] });
  const rec = join(dist, 'rec.json');
  const mk = (extra) => ['--record', rec, '--nu', nu, '--links', links, ...lh.flatMap((f) => ['--lighthouse', f]), ...extra];
  const quiet = (fn) => { const o = console.log; console.log = () => {}; return fn().finally(() => { console.log = o; }); };
  try {
    const { record } = await quiet(() => build(mk(['--browser', 'Chrome=157.0:headless', '--untested', 'iOS Safari:real-device']), { distRoot: dist }));
    t('median of 3 runs', record.lighthouse.performance === 97 && record.lighthouse.accessibility === 100);
    t('crawlableFailed true when all runs fail the audit', record.lighthouse.crawlableFailed === true);
    t('recheck: reachable not counted, 404 counted', record.validator.brokenLinks === 1);
    t('measuredAt uses Asia/Seoul date', record.measuredAt === '2026-11-17');
    t('mismatched formFactor exits 1', (await expectExit(() => build(['--nu', nu, '--links', links, '--lighthouse', lh[0], '--lighthouse', lh[1], '--lighthouse', w('d.json', lhRun(0.9, 1, 1, 1, 'desktop'))], { distRoot: dist }))) === 1);
    t('even run count exits 2', (await expectExit(() => build(['--nu', nu, '--links', links, '--lighthouse', lh[0], '--lighthouse', lh[1]], { distRoot: dist }))) === 2);
    t('duplicate browser exits 1', (await expectExit(() => quiet(() => build(mk(['--browser', 'Chrome=1:headless', '--untested', 'Chrome:headless']), { distRoot: dist })))) === 1);
    t('report outside dist exits 2', (await expectExit(() => build(['--nu', SELF, '--links', links, ...lh.flatMap((f) => ['--lighthouse', f])], { distRoot: dist }))) === 2);
    const r = spawnSync(process.execPath, [SELF, '--dry-run', '--record', rec, '--nu', 'x', '--links', 'y'], { encoding: 'utf8' });
    t('dry-run writes nothing', !existsSync(rec) && r.status !== 0);
  } finally {
    await server.close();
    rmSync(base, { recursive: true, force: true });
  }
  let failed = 0;
  for (const [n, ok] of results) { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`); if (!ok) failed++; }
  console.log(failed ? `record-measurements self-test: ${failed} failed` : `record-measurements self-test: ${results.length} passed`);
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  const args = process.argv.slice(2);
  const run = args.includes('--self-test') ? selfTest() : main(args);
  process.exit(await run.catch((e) => {
    console.log(e instanceof Exit ? `record: ${e.message}` : `record: error ${String(e && e.message).slice(0, 200)}`);
    return e instanceof Exit ? e.code : 1;
  }));
}
