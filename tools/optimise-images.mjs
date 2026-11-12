// Screenshot conversion tool (Phase 4).
//
// Procedure (D-13), one project at a time:
//   1. Put ONE image in _screenshots/<id>/ (git-ignored). <id> is an article id in index.html.
//   2. node tools/optimise-images.mjs --info             list folders, rotated sizes, formats
//   3. node tools/optimise-images.mjs --annotate <id>    grid image with mask outlines in dist/shots-preview/
//   4. Write masks + alt in tools/screenshots.json with "status": "draft".
//   5. node tools/optimise-images.mjs --only <id>        preview lands in dist/shots-preview/<id>/ only.
//   6. Review the preview, set "status": "approved", run again: img/projects/<id>/ and index.html are written.
//   --clear <id> restores the empty frame and removes that project's published files.
//   --self-test runs the whole pipeline on synthetic images in the OS temp folder.
//
// Path overrides (used by the self-test): --src --out --html --manifest --preview.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  APP_WIDTHS, ladder, emptyFigure, figureMarkup, readArticle, articleIds, replaceFigure,
} from './lib/shot-markup.mjs';
import { jpegMeta, webpMeta } from './lib/image-meta.mjs';
import { makeUiImage, makeMetaPositive } from './lib/shot-fixtures.mjs';

const USAGE =
  'usage: node tools/optimise-images.mjs [--self-test] [--info] [--annotate <id>] [--only <id>] [--clear <id>] ' +
  '[--src <dir>] [--out <dir>] [--html <file>] [--manifest <file>] [--preview <dir>]';

const VALUE_FLAGS = new Set(['--only', '--clear', '--annotate', '--src', '--out', '--html', '--manifest', '--preview']);
const BOOL_FLAGS = new Set(['--self-test', '--info']);

export function parseArgs(argv) {
  const opts = {
    src: '_screenshots',
    out: 'img/projects',
    html: 'index.html',
    manifest: 'tools/screenshots.json',
    preview: 'dist/shots-preview',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (BOOL_FLAGS.has(a)) {
      opts[a.slice(2)] = true;
    } else if (VALUE_FLAGS.has(a)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value` };
      opts[a.slice(2)] = v;
      i++;
    } else {
      return { error: `unknown flag ${a}` };
    }
  }
  return { opts };
}

async function render() { throw new Error('not implemented'); }
async function runAll() { throw new Error('not implemented'); }
async function clear() { throw new Error('not implemented'); }
async function info() { throw new Error('not implemented'); }
async function annotate() { throw new Error('not implemented'); }
// ---------------------------------------------------------------------------------------------
// Self-test: synthetic images in the OS temp folder, the repo's own files are never touched.
// ---------------------------------------------------------------------------------------------

const SELF = fileURLToPath(import.meta.url);
const REPO_HTML = path.join(path.dirname(SELF), '..', 'index.html');

function check(name, cond) {
  if (!cond) throw new Error(name);
}

function cli(args) {
  const r = spawnSync(process.execPath, [SELF, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '', all: `${r.stdout || ''}${r.stderr || ''}` };
}

function hashDir(dir) {
  const map = {};
  if (!fs.existsSync(dir)) return map;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else map[path.relative(dir, p)] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
    }
  };
  walk(dir);
  return map;
}

async function pixelAt(buf, x, y) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
}

function paths(root) {
  return {
    src: path.join(root, 'src'),
    out: path.join(root, 'out'),
    html: path.join(root, 'index.html'),
    manifest: path.join(root, 'screenshots.json'),
    preview: path.join(root, 'preview'),
  };
}

function flags(p, extra = []) {
  return ['--src', p.src, '--out', p.out, '--html', p.html, '--manifest', p.manifest, '--preview', p.preview, ...extra];
}

async function groupMarkup(origHtml) {
  for (const id of articleIds(origHtml)) {
    const { frame } = readArticle(origHtml, id);
    check(`round-trip ${id}`, replaceFigure(origHtml, id, emptyFigure(frame)) === origHtml);
  }
  check('ladder web 400', JSON.stringify(ladder('web', 400)) === '[400]');
  check('ladder app 2000', JSON.stringify(ladder('app', 2000)) === JSON.stringify(APP_WIDTHS));
}

async function groupParsers() {
  const j = jpegMeta(await makeMetaPositive('jpeg'));
  check('jpeg positive has APP1', j.includes('APP1'));
  check('jpeg positive has APP2', j.includes('APP2'));
  const w = webpMeta(await makeMetaPositive('webp'));
  check('webp positive has EXIF', w.includes('EXIF'));
  check('webp positive has ICCP', w.includes('ICCP'));
  const plainJ = await sharp(await makeUiImage({ width: 64, height: 48, format: 'png' })).jpeg().toBuffer();
  const plainW = await sharp(await makeUiImage({ width: 64, height: 48, format: 'png' })).webp().toBuffer();
  check('plain jpeg clean', jpegMeta(plainJ).length === 0);
  check('plain webp clean', webpMeta(plainW).length === 0);
}

const PH = {
  web: { id: 'gi-event', file: 'main.jpg', w: 1440, h: 3000, widths: [480, 960, 1440] },
  app: { id: 'gi-oneday', file: 'home.png', w: 1080, h: 2340, widths: [360, 540, 720, 1080] },
  small: { id: 'kn-wecankids', file: 'top.png', w: 400, h: 600, widths: [400] },
};
const MASKS = {
  'gi-event': [
    { x: 100, y: 60, w: 480, h: 80, kind: 'internal-url' },
    { x: 900, y: 1200, w: 300, h: 120, kind: 'account' },
  ],
  'gi-oneday': [{ x: 60, y: 80, w: 400, h: 120, kind: 'status-bar' }],
  'kn-wecankids': [{ x: 40, y: 40, w: 200, h: 80, kind: 'person-name' }],
};
const ALT = { 'gi-event': '이벤트 등록 화면', 'gi-oneday': '앱 첫 화면', 'kn-wecankids': '메인 화면' };
const STATUS = { 'gi-event': 'approved', 'gi-oneday': 'approved', 'kn-wecankids': 'draft' };

async function seedSources(p) {
  for (const k of Object.keys(PH)) fs.mkdirSync(path.join(p.src, PH[k].id), { recursive: true });
  // stored 3000x1440 with EXIF orientation 6 -> displayed 1440x3000
  fs.writeFileSync(
    path.join(p.src, PH.web.id, PH.web.file),
    await makeUiImage({ width: 3000, height: 1440, format: 'jpeg', orientation: 6, withMeta: true })
  );
  fs.writeFileSync(path.join(p.src, PH.app.id, PH.app.file), await makeUiImage({ width: 1080, height: 2340, format: 'png' }));
  fs.writeFileSync(path.join(p.src, PH.small.id, PH.small.file), await makeUiImage({ width: 400, height: 600, format: 'png' }));
}

function writeManifest(p, projects) {
  fs.writeFileSync(p.manifest, `${JSON.stringify({ version: 1, projects }, null, 2)}\n`);
}

function pipelineManifest() {
  const projects = {};
  for (const k of Object.keys(PH)) {
    const { id, file } = PH[k];
    projects[id] = { source: file, crop: null, masks: MASKS[id], alt: ALT[id], status: STATUS[id] };
  }
  return projects;
}

async function checkMasks(buf, id, srcW) {
  const outW = (await sharp(buf).metadata()).width;
  const scale = outW / srcW;
  const pts = [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
  const want = [17, 24, 40];
  for (const m of MASKS[id]) {
    for (const [fx, fy] of pts) {
      const x = Math.round((m.x + m.w * fx) * scale);
      const y = Math.round((m.y + m.h * fy) * scale);
      const px = await pixelAt(buf, x, y);
      check(`mask pixel ${id}`, px.every((v, i) => Math.abs(v - want[i]) <= 6));
    }
  }
}

async function groupPipeline(origHtml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-pipe-'));
  try {
    const p = paths(root);
    fs.writeFileSync(p.html, origHtml);
    await seedSources(p);
    writeManifest(p, pipelineManifest());

    let r = cli(flags(p));
    check(`first run exit (${r.err.trim().slice(0, 80)})`, r.code === 0);

    for (const k of ['web', 'app']) {
      const { id, widths, w: srcW } = PH[k];
      const dir = path.join(p.out, id);
      const names = fs.readdirSync(dir).sort();
      const expect = widths.flatMap((w) => [`${id}-${w}.jpg`, `${id}-${w}.webp`]).sort();
      check(`file names ${id}`, JSON.stringify(names) === JSON.stringify(expect));
      for (const w of widths) {
        for (const ext of ['jpg', 'webp']) {
          const buf = fs.readFileSync(path.join(dir, `${id}-${w}.${ext}`));
          const meta = await sharp(buf).metadata();
          check(`no exif ${id}`, !meta.exif && !meta.icc && !meta.xmp && !meta.iptc);
          check(`srgb ${id}`, meta.space === 'srgb');
          check(`width ${id}`, meta.width === w && meta.width <= srcW);
          check(`container clean ${id}`, (ext === 'jpg' ? jpegMeta(buf) : webpMeta(buf)).length === 0);
        }
      }
      const big = widths[widths.length - 1];
      await checkMasks(fs.readFileSync(path.join(dir, `${id}-${big}.jpg`)), id, srcW);
      await checkMasks(fs.readFileSync(path.join(dir, `${id}-${big}.webp`)), id, srcW);
    }

    // small source: single width, preview only
    const sm = PH.small;
    const prevNames = fs.readdirSync(path.join(p.preview, sm.id)).sort();
    check('draft preview files', JSON.stringify(prevNames) === JSON.stringify([`${sm.id}-400.jpg`, `${sm.id}-400.webp`]));
    check('draft not in out', !fs.existsSync(path.join(p.out, sm.id)));

    // html: approved ids are filled with the exact markup, the draft stays empty
    let html = fs.readFileSync(p.html, 'utf8');
    for (const k of ['web', 'app']) {
      const { id, widths } = PH[k];
      const art = readArticle(origHtml, id);
      const files = [];
      for (const w of widths) {
        const m = await sharp(path.join(p.out, id, `${id}-${w}.jpg`)).metadata();
        files.push({ w, h: m.height });
      }
      const want = figureMarkup({ id, frame: art.frame, title: art.title, alt: ALT[id], files });
      check(`figure markup ${id}`, readArticle(html, id).figure === want);
      check(`aria-label ${id}`, want.includes(`aria-label="${art.title} 화면 크게 보기"`));
    }
    check('draft figure empty', readArticle(html, sm.id).figure === emptyFigure(readArticle(origHtml, sm.id).frame));

    // determinism
    const before = { out: hashDir(p.out), html };
    r = cli(flags(p));
    check('second run exit', r.code === 0);
    check('files identical on rerun', JSON.stringify(hashDir(p.out)) === JSON.stringify(before.out));
    check('html identical on rerun', fs.readFileSync(p.html, 'utf8') === before.html);

    // --clear restores the original markup byte for byte
    for (const k of ['web', 'app']) {
      r = cli(flags(p, ['--clear', PH[k].id]));
      check(`clear exit ${PH[k].id}`, r.code === 0);
    }
    check('clear restores html', fs.readFileSync(p.html, 'utf8') === origHtml);
    check('clear removes files', !fs.existsSync(path.join(p.out, PH.web.id)) && !fs.existsSync(path.join(p.out, PH.app.id)));

    // --only touches one project
    r = cli(flags(p, ['--only', PH.app.id]));
    check('only exit', r.code === 0);
    html = fs.readFileSync(p.html, 'utf8');
    check('only changes one figure', replaceFigure(html, PH.app.id, emptyFigure('app')) === origHtml);
    check('only leaves others', !fs.existsSync(path.join(p.out, PH.web.id)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function groupValidation(origHtml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-val-'));
  try {
    const p = paths(root);
    fs.writeFileSync(p.html, origHtml);
    const id = 'gi-event';
    fs.mkdirSync(path.join(p.src, id), { recursive: true });
    fs.writeFileSync(path.join(p.src, id, 'main.png'), await makeUiImage({ width: 1000, height: 500, format: 'png' }));
    const good = { source: 'main.png', crop: null, masks: [{ x: 10, y: 10, w: 100, h: 40, kind: 'other' }], alt: '이벤트 등록 화면', status: 'draft' };
    const SENT = 'ZZsentinel';
    // assembled at runtime so no phone-like literal sits in this file
    const phone = `${'0' + 1 + 0}-${'1234'}-${'5678'}`;
    const cases = [
      ['mask-outside-image', { ...good, masks: [{ x: 900, y: 10, w: 200, h: 40, kind: 'other' }] }],
      ['mask-crop-partial', { ...good, crop: { x: 0, y: 0, w: 500, h: 250 }, masks: [{ x: 450, y: 100, w: 100, h: 50, kind: 'other' }] }],
      ['unknown-kind', { ...good, masks: [{ x: 10, y: 10, w: 100, h: 40, kind: 'zzkind' }] }],
      ['bad-source-name', { ...good, source: `한글${SENT}.png` }],
      ['bad-source-name', { ...good, source: `a/${SENT}.png` }],
      ['unknown-key', { ...good, zzkey: SENT }],
      ['unknown-project', null],
      ['empty-alt', { ...good, alt: '' }],
      ['alt-prefix', { ...good, alt: `스크린샷 ${SENT}` }],
      ['alt-prefix', { ...good, alt: `이미지 ${SENT}` }],
      ['alt-too-long', { ...good, alt: `${SENT}${'가'.repeat(40)}` }],
      ['alt-phone', { ...good, alt: `연락처 ${phone}` }],
    ];
    for (const [rule, entry] of cases) {
      writeManifest(p, entry === null ? { 'zz-unknown-id': good } : { [id]: entry });
      const r = cli(flags(p));
      check(`${rule}: exits non-zero`, r.code !== 0 && r.code !== null);
      check(`${rule}: names the rule`, r.all.includes(`rule:${rule}`));
      check(`${rule}: no field echo`, !r.all.includes(SENT) && !r.all.includes(phone) && !r.all.includes('zzkind') && !r.all.includes('zz-unknown-id'));
    }
    // top-level unknown key
    fs.writeFileSync(p.manifest, `${JSON.stringify({ version: 1, projects: {}, zzkey: 1 })}\n`);
    let r = cli(flags(p));
    check('top-level unknown key', r.code !== 0 && r.all.includes('rule:unknown-key'));

    // two images and no source (count only)
    fs.writeFileSync(path.join(p.src, id, 'second.png'), await makeUiImage({ width: 300, height: 200, format: 'png' }));
    const noSource = { ...good };
    delete noSource.source;
    writeManifest(p, { [id]: noSource });
    r = cli(flags(p));
    check('multiple-images rule', r.code !== 0 && r.all.includes('rule:multiple-images') && r.all.includes('2'));
    fs.rmSync(path.join(p.src, id, 'second.png'));

    // heic source
    fs.writeFileSync(path.join(p.src, id, 'phone.heic'), Buffer.from('not-an-image'));
    r = cli(flags(p));
    check('heic rule', r.code !== 0 && r.all.includes('rule:heic-source') && /PNG or JPEG/.test(r.all));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function selfTest() {
  const origHtml = fs.readFileSync(REPO_HTML, 'utf8');
  const groups = [
    ['markup', () => groupMarkup(origHtml)],
    ['parsers', () => groupParsers()],
    ['pipeline', () => groupPipeline(origHtml)],
    ['validation', () => groupValidation(origHtml)],
  ];
  let failed = 0;
  for (const [name, fn] of groups) {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${name}: ${err.message}`);
    }
  }
  return failed ? 1 : 0;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.error) {
    console.error(`optimise-images: ${parsed.error}\n${USAGE}`);
    return 2;
  }
  const o = parsed.opts;
  try {
    if (o['self-test']) return await selfTest();
    if (o.info) return await info(o);
    if (o.annotate) return await annotate(o, o.annotate);
    if (o.clear) return await clear(o, o.clear);
    return await runAll(o, o.only);
  } catch (err) {
    console.error(`optimise-images: ${err.message}`);
    return 1;
  }
}

void render;
process.exitCode = await main();
