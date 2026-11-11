// Zero-dependency PDF inspector for the Phase 2 spike. Reads a Skia/Chrome PDF as latin1,
// reports fonts, pages, links and (with --text) extracts Korean text through ToUnicode CMaps.
// usage: node tools/pdf-report.mjs <file.pdf> [--text] [--json <dist/out.json>] [--fixture]
// Extracted text is never printed. The phone guard prints only a generic message.
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { resolve, sep, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasPhone, hasPhoneAnywhere } from './check-repo.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--json');
if (!file) { console.error('usage: pdf-report.mjs <file.pdf> [--text] [--json <dist/out.json>] [--fixture]'); process.exit(2); }
const jsonOut = opt('--json') ? resolve(opt('--json')) : null;
if (jsonOut && !jsonOut.startsWith(join(root, 'dist') + sep)) { console.error('refusing: --json must be inside dist/'); process.exit(2); }

const buf = readFileSync(file);
const raw = buf.toString('latin1');
const manifest = JSON.parse(readFileSync(join(root, 'tools/content-manifest.json'), 'utf8'));
const count = (re) => (raw.match(re) || []).length;

// ---- object table -------------------------------------------------------
const objs = new Map();
for (const m of raw.matchAll(/(?:^|\n)(\d+) 0 obj\r?\n/g)) {
  const num = Number(m[1]);
  const start = m.index + m[0].length;
  const end = raw.indexOf('endobj', start);
  const body = raw.slice(start, end);
  const s = body.indexOf('stream');
  let dict = body; let stream = null;
  if (s >= 0 && /^[\s\S]*>>\s*stream/.test(body.slice(0, s + 6))) {
    dict = body.slice(0, s);
    const dataStart = start + s + 6 + (raw[start + s + 6] === '\r' ? 2 : 1);
    const lenM = /\/Length (\d+)(?! \d+ R)/.exec(dict);
    const dataEnd = lenM ? dataStart + Number(lenM[1]) : raw.indexOf('endstream', dataStart);
    stream = buf.subarray(dataStart, dataEnd);
  }
  objs.set(num, { dict, stream });
}
const streamText = (num) => {
  const o = objs.get(num);
  if (!o || !o.stream) return '';
  try { return /FlateDecode/.test(o.dict) ? inflateSync(o.stream).toString('latin1') : o.stream.toString('latin1'); }
  catch { return ''; }
};

// ---- measurements -------------------------------------------------------
const pageObjs = [...objs.entries()].filter(([, o]) => /\/Type \/Page(?![s\w])/.test(o.dict));
const mediaBoxes = [...new Set((raw.match(/\/MediaBox \[[^\]]+\]/g) || []).map((s) => s.replace('/MediaBox ', '')))];
const baseFonts = [...new Set((raw.match(/\/BaseFont \/[^\s/>\]]+/g) || []).map((s) => s.slice(11).replace(/^[A-Z]{6}\+/, '')))];
const uris = [...raw.matchAll(/\/URI \(((?:\\.|[^)])*)\)/g)].map((m) => m[1].replace(/\\(.)/g, '$1'));
const m = {
  bytes: buf.length,
  pages: pageObjs.length,
  mediaBoxes,
  type3: count(/\/Subtype \/Type3/g),
  cidFontType2: count(/\/Subtype \/CIDFontType2/g),
  fontFile2: count(/\/FontFile2/g),
  toUnicode: count(/\/ToUnicode/g),
  images: count(/\/Subtype \/Image/g),
  uriCount: uris.length,
  mailtoCount: uris.filter((u) => u.startsWith('mailto:')).length,
  outlines: /\/Outlines/.test(raw),
  structTreeRoot: /\/StructTreeRoot/.test(raw),
  baseFonts,
};

let failed = 0;
const assert = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

console.log(`bytes ${m.bytes}, pages ${m.pages}, MediaBox ${mediaBoxes.join(' | ')}`);
console.log(`Type3 ${m.type3}, CIDFontType2 ${m.cidFontType2}, FontFile2 ${m.fontFile2}, ToUnicode ${m.toUnicode}, Image ${m.images}`);
console.log(`BaseFont ${baseFonts.join(', ')}`);
console.log(`links ${m.uriCount} (mailto ${m.mailtoCount}); Outlines ${m.outlines}; StructTreeRoot ${m.structTreeRoot}`);

const fixture = flag('--fixture');
if (fixture) {
  assert('lazy image printed', m.images >= 1, `images ${m.images}`);
} else {
  assert('fonts: TrueType Pretendard only',
    m.type3 === 0 && m.fontFile2 > 0 && baseFonts.length > 0 && baseFonts.every((f) => f.startsWith('Pretendard')),
    `type3 ${m.type3}, FontFile2 ${m.fontFile2}`);
  const boxOk = mediaBoxes.length > 0 && mediaBoxes.every((b) => {
    const [, , w, h] = b.replace(/[\[\]]/g, '').trim().split(/\s+/).map(Number);
    return w >= 594 && w <= 596 && h >= 841 && h <= 843;
  });
  assert('page size A4 portrait', boxOk, mediaBoxes.join(' | '));
  const missing = manifest.links.filter((l) => !uris.includes(l));
  assert('links clickable', missing.length === 0 && m.mailtoCount >= 1,
    `${manifest.links.length - missing.length}/${manifest.links.length} external, mailto ${m.mailtoCount}`);
}

// ---- text extraction ----------------------------------------------------
let pageTexts = [];
if (flag('--text') && !fixture) {
  const parseCMap = (src) => {
    const map = new Map();
    const hex = (h) => String.fromCharCode(...(h.match(/.{4}/g) || []).map((x) => parseInt(x, 16)));
    for (const sec of src.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const p of sec[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) map.set(parseInt(p[1], 16), hex(p[2]));
    }
    for (const sec of src.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const p of sec[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(?:<([0-9a-fA-F]+)>|\[([^\]]*)\])/g)) {
        const lo = parseInt(p[1], 16); const hi = parseInt(p[2], 16);
        if (p[3]) { const base = parseInt(p[3], 16); for (let c = lo; c <= hi; c++) map.set(c, String.fromCharCode(base + c - lo)); }
        else { const list = [...p[4].matchAll(/<([0-9a-fA-F]+)>/g)].map((x) => hex(x[1])); list.forEach((s, i) => map.set(lo + i, s)); }
      }
    }
    return map;
  };
  for (const [, page] of pageObjs.sort((a, b) => a[0] - b[0])) {
    const fontRes = {};
    const fm = /\/Font <<([^>]*(?:>(?!>)[^>]*)*)>>/.exec(page.dict);
    if (fm) for (const r of fm[1].matchAll(/\/(\w+) (\d+) 0 R/g)) fontRes[r[1]] = Number(r[2]);
    const cmaps = {};
    for (const [name, num] of Object.entries(fontRes)) {
      const tu = /\/ToUnicode (\d+) 0 R/.exec(objs.get(num)?.dict || '');
      cmaps[name] = tu ? parseCMap(streamText(Number(tu[1]))) : new Map();
    }
    const contents = [...(page.dict.match(/\/Contents (\[[^\]]*\]|\d+ 0 R)/)?.[1].matchAll(/(\d+) 0 R/g) || [])].map((x) => Number(x[1]));
    let text = ''; let cur = null;
    for (const c of contents) {
      for (const line of streamText(c).split(/\r?\n/)) {
        const f = /^\/(\w+) [\d.]+ Tf/.exec(line);
        if (f) cur = cmaps[f[1]] || null;
        if (/ Tm$/.test(line) || /^T\*/.test(line)) text += '\n';
        for (const h of line.matchAll(/<([0-9a-fA-F]+)>/g)) {
          for (let i = 0; i + 4 <= h[1].length; i += 4) {
            const code = parseInt(h[1].slice(i, i + 4), 16);
            text += cur?.get(code) ?? '�';
          }
        }
      }
    }
    pageTexts.push(text);
  }
  const full = pageTexts.join('\n');
  const strip = (s) => s.replace(/\s+/g, '');
  const sFull = strip(full);
  const projectNames = manifest.projects.map((p) => p.name || p.title || p);
  const missingNames = projectNames.filter((n) => !sFull.includes(strip(n)));
  const kwTitles = manifest.keywords.map((k) => k.title);
  const missingKw = kwTitles.filter((t) => !sFull.includes(strip(t)));
  const noFffd = !full.includes('�');
  assert('Korean extraction', missingNames.length === 0 && missingKw.length === 0 && sFull.includes('퍼블기여도') && noFffd,
    `projects ${projectNames.length - missingNames.length}/${projectNames.length}, keywords ${kwTitles.length - missingKw.length}/${kwTitles.length}, U+FFFD ${noFffd ? 0 : 'present'}`);
  const leaks = ['PORTFOLIO.', '메뉴', 'localhost', '127.0.0.1', 'file:'].filter((s) => sFull.includes(strip(s)));
  assert('chrome hidden (no header, nav, browser footer)', leaks.length === 0, leaks.length ? `found ${leaks.length}` : 'none found');
  const perPage = pageTexts.map((t) => {
    // count dt labels only: a whole text run equal to the label (the word also occurs inside titles)
    const runs = t.split('\n').map(strip);
    return { platform: runs.filter((r) => r === '플랫폼').length, contribution: runs.filter((r) => r === '퍼블기여도').length };
  });
  const splitOk = perPage.every((p) => p.platform === p.contribution);
  console.log(`cards per page (platform/contribution): ${perPage.map((p) => `${p.platform}/${p.contribution}`).join(' ')}`);
  assert('no card split across pages', splitOk, `${perPage.reduce((a, p) => a + p.platform, 0)} cards`);
  const phoneBad = hasPhone(full) || hasPhoneAnywhere(full);
  if (phoneBad) console.log('phone-like pattern found');
  assert('phone guard', !phoneBad);
  m.cardsPerPage = perPage;
  m.textPages = pageTexts.map((t) => strip(t).length);
}

if (jsonOut) writeFileSync(jsonOut, JSON.stringify(m, null, 2));
process.exit(failed ? 1 : 0);
