// colophon-sync: the only writer of the measured rows in section#colophon.
//
// Usage: node tools/colophon-sync.mjs [--record <file>] [--html <file>] [--check] [--self-test]
//   (no flag)   rewrite the dd[data-measured] targets in index.html from tools/measurements.json
//   --check     exit 1 if index.html differs from what the record would produce
//   --self-test run built-in cases in a temp folder
//
// Imports are limited to node:* and ./check-repo.mjs so CI can run it without `npm ci`.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hasPhoneAnywhere } from './check-repo.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const KEYS = ['browsers', 'lighthouse', 'validator', 'date'];

const isInt = (v, min, max = Infinity) => Number.isInteger(v) && v >= min && v <= max;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sameKeys = (obj, allowed) => Object.keys(obj).every((k) => allowed.includes(k));

export function validateRecord(r) {
  const bad = (m) => {
    throw new Error(`invalid record: ${m}`);
  };
  if (!r || typeof r !== 'object' || Array.isArray(r)) bad('not an object');
  if (!sameKeys(r, ['measuredAt', 'lighthouse', 'validator', 'browsers'])) bad('unknown top-level key');
  if (r.measuredAt !== null && !(typeof r.measuredAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.measuredAt))) bad('measuredAt');
  const l = r.lighthouse;
  if (!l || typeof l !== 'object') bad('lighthouse');
  if (!sameKeys(l, ['form', 'performance', 'accessibility', 'bestPractices', 'seo', 'crawlableFailed'])) bad('unknown lighthouse key');
  if (l.form !== null && l.form !== 'mobile' && l.form !== 'desktop') bad('lighthouse.form');
  for (const k of ['performance', 'accessibility', 'bestPractices', 'seo']) {
    if (l[k] !== null && !isInt(l[k], 0, 100)) bad(`lighthouse.${k}`);
  }
  if (l.crawlableFailed !== null && typeof l.crawlableFailed !== 'boolean') bad('lighthouse.crawlableFailed');
  const v = r.validator;
  if (!v || typeof v !== 'object') bad('validator');
  if (!sameKeys(v, ['htmlErrors', 'brokenLinks'])) bad('unknown validator key');
  for (const k of ['htmlErrors', 'brokenLinks']) {
    if (v[k] !== null && !isInt(v[k], 0)) bad(`validator.${k}`);
  }
  if (!Array.isArray(r.browsers)) bad('browsers');
  for (const b of r.browsers) {
    if (!b || typeof b.name !== 'string' || !b.name) bad('browser name');
    if (!sameKeys(b, ['name', 'version', 'tested', 'method'])) bad('unknown browser key');
    if (typeof b.tested !== 'boolean') bad('browser tested');
    if (b.method !== 'headless' && b.method !== 'real-device') bad('browser method');
    if (b.version !== null && typeof b.version !== 'string') bad('browser version');
    if (b.tested && (b.version === null || b.version === '')) bad('tested browser without version');
  }
  return r;
}

export function renderMeasured(record) {
  validateRecord(record);
  const browsers = `<ul>${record.browsers
    .map((b) => {
      const n = esc(b.name);
      if (b.tested) {
        const head = `${n} ${esc(b.version)} · 확인함`;
        return `<li>${b.method === 'headless' ? `${head} (자동화 점검)` : head}</li>`;
      }
      const pend = b.method === 'real-device' ? `${n} · 실기기 확인 전` : `${n} · 확인 전`;
      return `<li><span class="colophon-pending">${pend}</span></li>`;
    })
    .join('')}</ul>`;

  const pending = '<span class="colophon-pending">측정 전</span>';
  const l = record.lighthouse;
  const scores = [
    ['Performance', l.performance],
    ['Accessibility', l.accessibility],
    ['Best Practices', l.bestPractices],
    ['SEO', l.seo],
  ];
  let lighthouse = pending;
  if (l.form !== null && scores.every(([, s]) => s !== null)) {
    const items = scores.map(([n, s]) => `<li><span lang="en">${n}</span> <data value="${s}">${s}</data></li>`);
    items.push(`<li>측정 환경: ${l.form}</li>`);
    if (l.crawlableFailed === true) items.push('<li>SEO는 검색 비노출 설정(noindex)으로 감점</li>');
    lighthouse = `<ul>${items.join('')}</ul>`;
  }

  const v = record.validator;
  const validator =
    v.htmlErrors === null || v.brokenLinks === null
      ? pending
      : `HTML 검증 오류 <data value="${v.htmlErrors}">${v.htmlErrors}</data>건 · 깨진 링크 <data value="${v.brokenLinks}">${v.brokenLinks}</data>건`;

  const date = record.measuredAt === null ? pending : `<time datetime="${record.measuredAt}">${record.measuredAt.replace(/-/g, '.')}</time>`;

  const out = { browsers, lighthouse, validator, date };
  const all = Object.values(out).join('\n');
  if (all.includes('@') || hasPhoneAnywhere(all)) throw new Error('colophon output would contain contact-like data');
  return out;
}

export function sync(html, record) {
  const rendered = renderMeasured(record);
  for (const key of KEYS) {
    const n = (html.match(new RegExp(`<dd data-measured="${key}"`, 'g')) || []).length;
    if (n !== 1) throw new Error(`expected exactly one dd[data-measured="${key}"], found ${n}`);
  }
  return html.replace(/(<dd data-measured="(browsers|lighthouse|validator|date)"[^>]*>)([\s\S]*?)(<\/dd>)/g, (_m, open, key, _inner, close) => `${open}${rendered[key]}${close}`);
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check' || a === '--self-test') o[a.slice(2)] = true;
    else if (a === '--record' || a === '--html') o[a.slice(2)] = argv[++i];
    else return { error: `unknown argument ${a}` };
  }
  return { o };
}

function main(argv) {
  const { o, error } = parseArgs(argv);
  if (error) {
    console.error(`colophon-sync: ${error}`);
    return 2;
  }
  if (o['self-test']) return selfTest();
  const recordPath = resolve(o.record || join(REPO, 'tools', 'measurements.json'));
  const htmlPath = resolve(o.html || join(REPO, 'index.html'));
  try {
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    const html = readFileSync(htmlPath, 'utf8');
    const next = sync(html, record);
    if (o.check) {
      if (next !== html) {
        console.error('colophon-sync: index.html differs from record');
        return 1;
      }
      console.log('colophon-sync: index.html matches record');
      return 0;
    }
    if (next === html) {
      console.log('colophon-sync: unchanged');
    } else {
      writeFileSync(htmlPath, next, 'utf8');
      console.log('colophon-sync: index.html updated');
    }
    return 0;
  } catch (e) {
    console.error(`colophon-sync: ${e.message}`);
    return 1;
  }
}

// ---------------------------------------------------------------------------------------------
function selfTest() {
  const base = mkdtempSync(join(tmpdir(), 'colophon-sync-'));
  const results = [];
  const t = (name, ok) => results.push([name, Boolean(ok)]);
  const nullRec = () => JSON.parse(readFileSync(join(REPO, 'tools', 'measurements.json'), 'utf8'));
  const dd = (k) => `<dd data-measured="${k}">old</dd>`;
  const fixture = `<main>\n<dl>\n<div><dt>a</dt>${dd('browsers')}</div>\n<div><dt>b</dt>${dd('lighthouse')}</div>\n<div><dt>c</dt>${dd('validator')}</div>\n<div><dt>d</dt>${dd('date')}</div>\n</dl>\n<p>keep 123</p>\n</main>\n`;
  let n = 0;
  const run = (rec, html, extra = []) => {
    n++;
    const rp = join(base, `r${n}.json`);
    const hp = join(base, `h${n}.html`);
    writeFileSync(rp, typeof rec === 'string' ? rec : JSON.stringify(rec));
    writeFileSync(hp, html);
    const { log, error } = console;
    console.log = () => {};
    console.error = () => {};
    let code;
    try {
      code = main(['--record', rp, '--html', hp, ...extra]);
    } finally {
      console.log = log;
      console.error = error;
    }
    return { code, out: readFileSync(hp, 'utf8') };
  };
  const inner = (html, k) => (html.match(new RegExp(`<dd data-measured="${k}">([\\s\\S]*?)</dd>`)) || [])[1] || '';
  try {
    // null record
    const a = run(nullRec(), fixture);
    t('null record exits 0', a.code === 0);
    t('null: no <data', !/<data/.test(a.out));
    t('null: no digit in lighthouse/validator/date', !/\d/.test(inner(a.out, 'lighthouse') + inner(a.out, 'validator') + inner(a.out, 'date')));
    t('null: 측정 전 x3', (a.out.match(/측정 전/g) || []).length === 3);
    t('null: iOS pending text', a.out.includes('iOS Safari · 실기기 확인 전'));
    t('null: rest byte-identical', a.out.replace(/<dd data-measured="\w+">[\s\S]*?<\/dd>/g, '') === fixture.replace(/<dd data-measured="\w+">[\s\S]*?<\/dd>/g, ''));
    // idempotent
    const a2 = run(nullRec(), a.out);
    t('idempotent', a2.out === a.out);

    // filled
    const f = nullRec();
    f.measuredAt = '2026-11-20';
    f.lighthouse = { form: 'mobile', performance: 97, accessibility: 100, bestPractices: 100, seo: 69, crawlableFailed: true };
    f.validator = { htmlErrors: 0, brokenLinks: 0 };
    f.browsers[0] = { name: 'Chrome', version: '131', tested: true, method: 'headless' };
    f.browsers[2] = { name: 'iOS Safari', version: '18', tested: true, method: 'real-device' };
    const b = run(f, fixture);
    t('filled exits 0', b.code === 0);
    t('filled: chips value equals text', [...b.out.matchAll(/<data value="(\d+)">(\d+)<\/data>/g)].every((m) => m[1] === m[2]) && /<data/.test(b.out));
    t('filled: seo note present', b.out.includes('noindex'));
    t('filled: date', b.out.includes('<time datetime="2026-11-20">2026.11.20</time>'));
    t('filled: browser labels', b.out.includes('Chrome 131 · 확인함 (자동화 점검)') && b.out.includes('iOS Safari 18 · 확인함<'));
    const f2 = JSON.parse(JSON.stringify(f));
    f2.lighthouse.crawlableFailed = false;
    t('seo note absent when not failed', !run(f2, fixture).out.includes('noindex'));

    // partial
    const p = nullRec();
    p.validator = { htmlErrors: 1, brokenLinks: 2 };
    const pr = run(p, fixture);
    t('partial: validator filled, lighthouse pending', inner(pr.out, 'validator').includes('<data value="1">1</data>') && inner(pr.out, 'lighthouse').includes('측정 전'));

    // invalid
    const mut = (fn) => {
      const r = nullRec();
      fn(r);
      return r;
    };
    const invalid = {
      'score 101': mut((r) => (r.lighthouse.seo = 101)),
      'score float': mut((r) => (r.lighthouse.seo = 9.5)),
      'negative count': mut((r) => (r.validator.htmlErrors = -1)),
      'bad date': mut((r) => (r.measuredAt = '2026/11/20')),
      'bad form': mut((r) => (r.lighthouse.form = 'tablet')),
      'tested without version': mut((r) => (r.browsers[0].tested = true)),
      'bad method': mut((r) => (r.browsers[0].method = 'manual')),
      'unknown key': mut((r) => (r.extra = 1)),
    };
    for (const [name, rec] of Object.entries(invalid)) t(`invalid rejected: ${name}`, run(rec, fixture).code === 1);

    t('missing target rejected', run(nullRec(), fixture.replace(dd('date'), '')).code === 1);
    t('duplicated target rejected', run(nullRec(), fixture + dd('date')).code === 1);
    t('--check on stale file fails', run(nullRec(), fixture, ['--check']).code === 1);
    t('--check on synced file passes', run(nullRec(), a.out, ['--check']).code === 0);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  let failed = 0;
  for (const [name, ok] of results) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (!ok) failed++;
  }
  if (failed) {
    console.error(`colophon-sync self-test: ${failed} failed`);
    return 1;
  }
  console.log(`colophon-sync self-test: ${results.length} passed`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
