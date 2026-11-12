// Output audit for the public screenshots in img/projects/.
// Independent of tools/optimise-images.mjs: it re-verifies containers, names, approval and references.
// Usage: node tools/check-images.mjs [--fast] [--self-test] [--root <dir>] [--html <file>] [--manifest <file>]
//   --fast  zero dependencies (no sharp): used by the pre-commit hook.
// Failure output prints only the relative path and the rule, never file contents or manifest values.
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasPhone, hasPhoneAnywhere } from './check-repo.mjs';
import { jpegMeta, sniff, webpMeta } from './lib/image-meta.mjs';
import { articleIds, readArticle, replaceFigure } from './lib/shot-markup.mjs';

const SELF = fileURLToPath(import.meta.url);
const REPO = resolve(dirname(SELF), '..');

// RESEARCH Pitfall 6: keep the repository and the mobile payload small.
export const MAX_LARGEST_BYTES = 1_500_000;
export const MAX_OTHER_BYTES = 600_000;
export const MAX_TOTAL_BYTES = 20_000_000;

const FORBIDDEN_META = ['exif', 'icc', 'xmp', 'iptc'];
const REF_RE = /img\/projects\/[^\s"',()]+/g;

function walkEntries(dir) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
}

export async function audit({ root, htmlPath, manifestPath, fast }) {
  const errors = [];
  const bad = (rel, rule) => errors.push(`FAIL ${rel}: ${rule}`);
  const imgDir = join(root, 'img', 'projects');
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';
  const htmlDir = dirname(htmlPath);
  const ids = new Set(articleIds(html));

  let manifest = { projects: {} };
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      bad(relative(root, manifestPath) || 'manifest', 'manifest-unreadable');
    }
  }
  const entries = manifest.projects || {};
  // phone-like text in any manifest string field
  const strings = [];
  const collect = (v) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  collect(entries);
  if (strings.some((s) => hasPhone(s) || hasPhoneAnywhere(s))) bad('screenshots.json', 'phone-like-text');

  // collect files
  const projects = new Map(); // id -> [{ name, abs, rel, ext, w, size }]
  let total = 0;
  if (existsSync(imgDir)) {
    for (const e of walkEntries(imgDir)) {
      const relTop = `img/projects/${e.name}`;
      if (!e.isDirectory()) {
        if (e.name !== '.gitkeep') bad(relTop, 'file-outside-project-folder');
        continue;
      }
      if (!ids.has(e.name)) bad(relTop, 'unknown-project-folder');
      const list = [];
      for (const f of walkEntries(join(imgDir, e.name))) {
        const rel = `${relTop}/${f.name}`;
        if (f.isDirectory()) { bad(rel, 'nested-folder'); continue; }
        const m = new RegExp(`^${e.name.replace(/[^a-z0-9-]/gi, '')}-(\\d+)\\.(jpg|webp)$`).exec(f.name);
        if (!m) { bad(rel, 'bad-file-name'); continue; }
        const abs = join(imgDir, e.name, f.name);
        const buf = readFileSync(abs);
        const ext = m[2];
        const kind = sniff(buf);
        if (kind !== (ext === 'jpg' ? 'jpeg' : 'webp')) { bad(rel, 'format-differs-from-extension'); continue; }
        const meta = ext === 'jpg' ? jpegMeta(buf) : webpMeta(buf);
        if (meta.length) bad(rel, 'metadata-present');
        list.push({ name: f.name, abs, rel, ext, w: Number(m[1]), size: buf.length, buf });
        total += buf.length;
      }
      projects.set(e.name, list);

      const entry = entries[e.name];
      if (list.length && (!entry || entry.status !== 'approved')) bad(relTop, 'project-not-approved');

      const jw = list.filter((x) => x.ext === 'jpg').map((x) => x.w).sort((a, b) => a - b).join(',');
      const ww = list.filter((x) => x.ext === 'webp').map((x) => x.w).sort((a, b) => a - b).join(',');
      if (list.length && jw !== ww) bad(relTop, 'jpg-webp-widths-differ');

      // sizes
      const maxW = Math.max(0, ...list.map((x) => x.w));
      for (const x of list) {
        const limit = x.w === maxW ? MAX_LARGEST_BYTES : MAX_OTHER_BYTES;
        if (x.size > limit) bad(x.rel, 'file-too-large');
      }

      // references
      if (ids.has(e.name) && list.length) {
        let figure = '';
        try { figure = readArticle(html, e.name).figure; } catch { bad(relTop, 'article-figure-missing'); }
        const refs = new Set(figure.match(REF_RE) || []);
        for (const x of list) if (!refs.has(`img/projects/${e.name}/${x.name}`)) bad(x.rel, 'orphan-not-referenced');
      }
    }
  }
  if (total > MAX_TOTAL_BYTES) bad('img/projects', 'total-too-large');

  // dangling references anywhere in the html
  for (const ref of new Set(html.match(REF_RE) || [])) {
    if (!existsSync(resolve(htmlDir, ref))) bad(ref, 'dangling-reference');
  }

  // full mode: pixel dimensions and sharp metadata
  if (!fast && [...projects.values()].some((l) => l.length)) {
    const sharp = (await import('sharp')).default;
    const dims = new Map();
    for (const list of projects.values()) {
      for (const x of list) {
        let meta;
        try { meta = await sharp(x.buf).metadata(); } catch { bad(x.rel, 'unreadable-image'); continue; }
        if (meta.width !== x.w) bad(x.rel, 'width-differs-from-name');
        if (FORBIDDEN_META.some((k) => meta[k])) bad(x.rel, 'metadata-present');
        dims.set(x.rel, { w: meta.width, h: meta.height });
      }
    }
    for (const [id, list] of projects) {
      if (!list.length || !ids.has(id)) continue;
      let figure;
      try { figure = readArticle(html, id).figure; } catch { continue; }
      const img = /<img\b[^>]*>/.exec(figure)?.[0] || '';
      const attr = (k) => new RegExp(`\\s${k}="([^"]*)"`).exec(img)?.[1];
      const src = attr('src');
      const d = src && dims.get(src);
      if (!d) { bad(`img/projects/${id}`, 'img-src-not-found'); continue; }
      if (Number(attr('width')) !== d.w || Number(attr('height')) !== d.h) bad(src, 'html-size-differs-from-file');
    }
  }

  const fileCount = [...projects.values()].reduce((n, l) => n + l.length, 0);
  const projectCount = [...projects.values()].filter((l) => l.length).length;
  return { errors, projectCount, fileCount };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fast' || a === '--self-test') o[a.slice(2)] = true;
    else if (['--root', '--html', '--manifest'].includes(a)) o[a.slice(2)] = argv[++i];
    else return { error: `unknown argument ${a}` };
  }
  return { o };
}

async function runAudit(o) {
  const root = resolve(o.root || REPO);
  const htmlPath = resolve(o.html || join(root, 'index.html'));
  let manifestPath = resolve(o.manifest || join(root, 'tools', 'screenshots.json'));
  if (!o.manifest && !existsSync(manifestPath)) manifestPath = join(REPO, 'tools', 'screenshots.json');
  const r = await audit({ root, htmlPath, manifestPath, fast: Boolean(o.fast) });
  if (r.errors.length) {
    for (const line of r.errors) console.error(line);
    console.error(`check-images: ${r.errors.length} failed`);
    return 1;
  }
  console.log(
    r.fileCount === 0 ? 'check-images: 0 projects, OK' : `check-images: ${r.projectCount} projects, ${r.fileCount} files, OK`
  );
  return 0;
}

// ---------------------------------------------------------------------------------------------
// Self-test (synthetic files in the OS temp folder)
// ---------------------------------------------------------------------------------------------

function run(root, extra = []) {
  const r = spawnSync(process.execPath, [SELF, '--root', root, ...extra], { encoding: 'utf8' });
  return { code: r.status, all: `${r.stdout || ''}${r.stderr || ''}` };
}

async function selfTest() {
  const { makeUiImage, makeMetaPositive } = await import('./lib/shot-fixtures.mjs');
  const base = mkdtempSync(join(tmpdir(), 'check-images-'));
  const results = [];
  const t = (name, ok) => results.push([name, Boolean(ok)]);
  try {
    // 1) build clean outputs through the real conversion tool
    const html = readFileSync(join(REPO, 'index.html'), 'utf8');
    const good = join(base, 'good');
    const src = join(base, 'src');
    mkdirSync(join(good, 'tools'), { recursive: true });
    writeFileSync(join(good, 'index.html'), html);
    const projects = {
      'gi-event': { source: 'a.png', crop: null, masks: [{ x: 10, y: 10, w: 100, h: 40, kind: 'other' }], alt: '이벤트 등록 화면', status: 'approved' },
      'gi-oneday': { source: 'b.png', crop: null, masks: [{ x: 10, y: 10, w: 100, h: 40, kind: 'other' }], alt: '앱 첫 화면', status: 'approved' },
    };
    mkdirSync(join(src, 'gi-event'), { recursive: true });
    mkdirSync(join(src, 'gi-oneday'), { recursive: true });
    writeFileSync(join(src, 'gi-event', 'a.png'), await makeUiImage({ width: 1440, height: 2000, format: 'png' }));
    writeFileSync(join(src, 'gi-oneday', 'b.png'), await makeUiImage({ width: 1080, height: 2340, format: 'png' }));
    const manifestFile = join(good, 'tools', 'screenshots.json');
    writeFileSync(manifestFile, `${JSON.stringify({ version: 1, projects }, null, 2)}\n`);
    const conv = spawnSync(
      process.execPath,
      [
        join(REPO, 'tools', 'optimise-images.mjs'),
        '--src', src, '--out', join(good, 'img', 'projects'), '--html', join(good, 'index.html'),
        '--manifest', manifestFile, '--preview', join(base, 'preview'),
      ],
      { encoding: 'utf8' }
    );
    t('setup: conversion ran', conv.status === 0);

    const empty = join(base, 'empty');
    mkdirSync(empty, { recursive: true });
    writeFileSync(join(empty, 'index.html'), html);
    t('zero images pass', run(empty).code === 0 && run(empty).all.includes('0 projects, OK'));
    t('clean full', run(good).code === 0);
    t('clean fast', run(good, ['--fast']).code === 0);

    // each negative gets a fresh copy of the clean tree
    let n = 0;
    const neg = (name, mutate, { fastToo = true, rule } = {}) => {
      const dir = join(base, `neg-${n++}`);
      cpSync(good, dir, { recursive: true });
      const note = mutate(dir);
      const full = run(dir);
      t(`${name} (full)`, full.code === 1 && (!rule || full.all.includes(rule)));
      if (fastToo) t(`${name} (fast)`, run(dir, ['--fast']).code === 1);
      return note;
    };
    const imgs = (dir, id = 'gi-event') => join(dir, 'img', 'projects', id);
    const setManifest = (dir, fn) => {
      const f = join(dir, 'tools', 'screenshots.json');
      const m = JSON.parse(readFileSync(f, 'utf8'));
      fn(m);
      writeFileSync(f, `${JSON.stringify(m, null, 2)}\n`);
    };

    const jpegMetaBuf = await makeMetaPositive('jpeg');
    const webpMetaBuf = await makeMetaPositive('webp');
    neg('jpeg metadata', (d) => writeFileSync(join(imgs(d), 'gi-event-480.jpg'), jpegMetaBuf), { rule: 'metadata-present' });
    neg('webp metadata', (d) => writeFileSync(join(imgs(d), 'gi-event-480.webp'), webpMetaBuf), { rule: 'metadata-present' });
    // allowlist / fail-closed parser cases: COM segment, truncated stream, bytes after EOI, WebP chunk length overflow
    const goodJpg = readFileSync(join(imgs(good), 'gi-event-480.jpg'));
    const goodWebp = readFileSync(join(imgs(good), 'gi-event-480.webp'));
    const comJpg = Buffer.concat([goodJpg.subarray(0, 2), Buffer.from([0xff, 0xfe, 0x00, 0x06, 0x61, 0x62, 0x63, 0x64]), goodJpg.subarray(2)]);
    neg('jpeg COM segment', (d) => writeFileSync(join(imgs(d), 'gi-event-480.jpg'), comJpg), { rule: 'metadata-present' });
    neg('jpeg truncated stream', (d) => writeFileSync(join(imgs(d), 'gi-event-480.jpg'), goodJpg.subarray(0, goodJpg.length - 40)), { rule: 'metadata-present' });
    neg('jpeg bytes after EOI', (d) => writeFileSync(join(imgs(d), 'gi-event-480.jpg'), Buffer.concat([goodJpg, Buffer.from('ExifPayload')])), { rule: 'metadata-present' });
    const hidden = Buffer.concat([goodWebp, Buffer.from('JUNK', 'latin1'), Buffer.from([0xff, 0xff, 0xff, 0x7f]), Buffer.from('EXIF', 'latin1'), Buffer.alloc(4)]);
    hidden.writeUInt32LE(hidden.length - 8, 4); // keep the RIFF size consistent so only the chunk length is wrong
    neg('webp chunk length overflow', (d) => writeFileSync(join(imgs(d), 'gi-event-480.webp'), hidden), { rule: 'metadata-present' });
    neg('draft project', (d) => setManifest(d, (m) => { m.projects['gi-event'].status = 'draft'; }), { rule: 'project-not-approved' });
    neg('missing manifest entry', (d) => setManifest(d, (m) => { delete m.projects['gi-event']; }), { rule: 'project-not-approved' });
    neg('orphan file', (d) => copyFileSync(join(imgs(d), 'gi-event-480.jpg'), join(imgs(d), 'gi-event-777.jpg')), { rule: 'orphan-not-referenced' });
    neg('unknown folder', (d) => {
      mkdirSync(join(d, 'img', 'projects', 'zz-none'), { recursive: true });
      copyFileSync(join(imgs(d), 'gi-event-480.jpg'), join(d, 'img', 'projects', 'zz-none', 'zz-none-480.jpg'));
    }, { rule: 'unknown-project-folder' });
    neg('misnamed main.jpg', (d) => copyFileSync(join(imgs(d), 'gi-event-480.jpg'), join(imgs(d), 'main.jpg')), { rule: 'bad-file-name' });
    neg('uppercase name', (d) => copyFileSync(join(imgs(d), 'gi-event-480.jpg'), join(imgs(d), 'GI-event-481.jpg')), { rule: 'bad-file-name' });
    neg('wrong id in name', (d) => copyFileSync(join(imgs(d), 'gi-event-480.jpg'), join(imgs(d), 'gi-oneday-480.jpg')), { rule: 'bad-file-name' });
    const pngBytes = await makeUiImage({ width: 480, height: 600, format: 'png' });
    neg('png renamed jpg', (d) => writeFileSync(join(imgs(d), 'gi-event-480.jpg'), pngBytes), { rule: 'format-differs-from-extension' });
    neg('html size differs', (d) => {
      const f = join(d, 'index.html');
      const h = readFileSync(f, 'utf8');
      const fig = readArticle(h, 'gi-event').figure;
      writeFileSync(f, replaceFigure(h, 'gi-event', fig.replace(/(<img\b[^>]*?\swidth=")\d+"/, '$17"')));
    }, { fastToo: false, rule: 'html-size-differs-from-file' });
    neg('oversize file', (d) => {
      const f = join(imgs(d), 'gi-event-480.jpg');
      writeFileSync(f, Buffer.concat([readFileSync(f), Buffer.alloc(MAX_OTHER_BYTES)]));
    }, { rule: 'file-too-large' });
    // runtime-assembled so no phone-like literal sits in this file
    const phone = `${'0' + 1 + 0}-${'1234'}-${'5678'}`;
    {
      const dir = join(base, 'neg-phone');
      cpSync(good, dir, { recursive: true });
      setManifest(dir, (m) => { m.projects['gi-event'].alt = `연락처 ${phone}`; });
      const r = run(dir, ['--fast']);
      t('phone-like manifest text', r.code === 1 && r.all.includes('phone-like-text') && !r.all.includes(phone));
    }
    neg('dangling reference', (d) => rmSync(join(imgs(d), 'gi-event-960.webp')), { rule: 'dangling-reference' });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  let failed = 0;
  for (const [name, ok] of results) {
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  }
  console.log(`check-images self-test: ${results.length - failed} passed${failed ? `, ${failed} FAILED` : ''}`);
  return failed ? 1 : 0;
}

const parsed = parseArgs(process.argv.slice(2));
if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  if (parsed.error) {
    console.error(`check-images: ${parsed.error}`);
    process.exitCode = 2;
  } else if (parsed.o.fast && parsed.o['self-test']) {
    console.error('check-images: --fast cannot combine with --self-test');
    process.exitCode = 2;
  } else {
    process.exitCode = parsed.o['self-test'] ? await selfTest() : await runAudit(parsed.o);
  }
}
