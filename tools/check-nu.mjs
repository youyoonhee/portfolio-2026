// W3C Nu checker client. Sends the HTML to validator.w3.org and reports counts only.
// Console output never includes the message `extract` (the page text). Do not point --url at
// pages containing personal data unless publication is approved.
// Usage: node tools/check-nu.mjs --file <path> | --url <url> [--expect-status N] [--out <file>]
//        node tools/check-nu.mjs --self-test
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, isAbsolute } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NU = 'https://validator.w3.org/nu/?out=json';

export function countMessages(messages) {
  let errors = 0;
  let warnings = 0;
  for (const m of messages || []) {
    if (m.type === 'error') errors++;
    else if (m.subType === 'warning') warnings++;
  }
  return { errors, warnings };
}

// Remove page text before anything is printed or written.
export const stripExtract = (messages) =>
  (messages || []).map(({ extract, ...rest }) => rest); // eslint-disable-line no-unused-vars

function selfTest() {
  const results = [];
  const t = (n, ok) => results.push([n, Boolean(ok)]);
  const msgs = [
    { type: 'error', message: 'a', lastLine: 3, extract: 'SECRET' },
    { type: 'error', message: 'b', lastLine: 4 },
    { type: 'info', subType: 'warning', message: 'c' },
    { type: 'info', message: 'd' },
  ];
  const c = countMessages(msgs);
  t('counts errors', c.errors === 2);
  t('counts warnings', c.warnings === 1);
  t('empty input', countMessages([]).errors === 0 && countMessages(undefined).warnings === 0);
  t('extract removed', !JSON.stringify(stripExtract(msgs)).includes('SECRET'));
  let failed = 0;
  for (const [n, ok] of results) { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`); if (!ok) failed++; }
  console.log(failed ? `check-nu self-test: ${failed} failed` : `check-nu self-test: ${results.length} passed`);
  return failed ? 1 : 0;
}

async function main() {
  const args = process.argv.slice(2);
  const val = (n) => (args.indexOf(n) > -1 ? args[args.indexOf(n) + 1] : null);
  if (args.includes('--self-test')) return selfTest();
  const file = val('--file');
  const url = val('--url');
  const expect = Number(val('--expect-status') ?? 200);
  const out = val('--out');
  if (!file && !url) { console.log('usage: --file <path> | --url <url>'); return 2; }

  let html;
  let status = 200;
  let source;
  if (file) {
    html = readFileSync(resolve(file), 'utf8');
    source = file;
  } else {
    const res = await fetch(url, { headers: { 'user-agent': 'portfolio-check/1.0' } });
    status = res.status;
    html = await res.text();
    source = url;
  }
  const res = await fetch(NU, {
    method: 'POST',
    headers: { 'content-type': 'text/html; charset=utf-8', 'user-agent': 'portfolio-check/1.0' },
    body: html,
  });
  if (!res.ok) { console.log(`nu: service responded ${res.status}`); return 2; }
  const data = await res.json();
  const messages = stripExtract(data.messages);
  const { errors, warnings } = countMessages(messages);
  for (const m of messages) {
    if (m.type === 'error' || m.subType === 'warning') console.log(`${m.type}${m.subType ? '/' + m.subType : ''} line ${m.lastLine ?? '?'}: ${m.message}`);
  }
  console.log(`nu: ${errors} error(s), ${warnings} warning(s)`);
  if (url && status !== expect) console.log(`nu: fetched status ${status}, expected ${expect}`);
  if (out) {
    const target = resolve(out);
    const rel = relative(join(ROOT, 'dist'), target);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) { console.log('--out must be inside dist/'); return 2; }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify({ source, status, errors, warnings, messages }, null, 2) + '\n');
  }
  return errors > 0 || (url && status !== expect) ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main().catch((e) => { console.log(`nu: error ${String(e && e.message).slice(0, 200)}`); return 2; }));
}
