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
import { hasPhone } from './check-repo.mjs';
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

// ---------------------------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------------------------

const MASK_COLOR = '#111827'; // opaque solid box; never blur or pixelate (D-10)
const FORMATS = ['webp', 'jpg']; // AVIF can be added here later (RESEARCH AVIF decision)
const KINDS = ['person-name', 'phone', 'email', 'internal-url', 'account', 'id-number', 'status-bar', 'other'];
const ENTRY_KEYS = ['source', 'crop', 'masks', 'alt', 'status', 'noSensitive'];
const SOURCE_RE = /^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp)$/;
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const HEIC_EXT = /\.hei[cf]$/i;
const ALT_MAX = 40;
const WEBP_MAX_SIDE = 16383;
const BIG_BYTES = 1500000;
const OTHER_BYTES = 600000;
const APP_ASPECT = 9 / 16;
const ASPECT_TOLERANCE = 0.15;
const GRID_STEP = 100;

// Errors name the project id and the rule token, never the field value (manifest content may be sensitive).
function fail(id, rule, text) {
  throw new Error(`${id ? `${id}: ` : ''}rule:${rule} (${text})`);
}

const isInt = (v) => Number.isInteger(v);
const onlyKeys = (obj, keys) => Object.keys(obj).every((k) => keys.includes(k));
const isRect = (r) => r && typeof r === 'object' && isInt(r.x) && isInt(r.y) && isInt(r.w) && isInt(r.h);

function loadManifest(file, html) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    fail('', 'manifest-unreadable', 'manifest is missing or not valid JSON');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('', 'unknown-key', 'manifest must be an object');
  if (!onlyKeys(data, ['version', 'projects'])) fail('', 'unknown-key', 'unknown top-level key');
  if (data.version !== 1) fail('', 'bad-version', 'version must be 1');
  if (!data.projects || typeof data.projects !== 'object' || Array.isArray(data.projects)) {
    fail('', 'bad-projects', 'projects must be an object');
  }
  const ids = articleIds(html);
  for (const [id, e] of Object.entries(data.projects)) {
    if (!ids.includes(id)) fail('', 'unknown-project', 'a manifest project id is not an article id in the html');
    if (hasPhone(id)) fail('', 'phone-like', 'a project id looks like a phone number');
    validateEntry(id, e);
  }
  return data;
}

function validateEntry(id, e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) fail(id, 'unknown-key', 'entry must be an object');
  if (!onlyKeys(e, ENTRY_KEYS)) fail(id, 'unknown-key', 'unknown entry key');
  if (e.source !== undefined) {
    const s = typeof e.source === 'string' ? e.source.normalize('NFC') : '';
    if (HEIC_EXT.test(s)) fail(id, 'heic-source', 'export the image as PNG or JPEG');
    if (!SOURCE_RE.test(s)) fail(id, 'bad-source-name', 'source must be an ASCII kebab file name without a folder');
    if (hasPhone(s)) fail(id, 'phone-like', 'source looks like a phone number');
  }
  if (e.crop !== null && e.crop !== undefined) {
    if (!isRect(e.crop) || !onlyKeys(e.crop, ['x', 'y', 'w', 'h']) || e.crop.w <= 0 || e.crop.h <= 0 || e.crop.x < 0 || e.crop.y < 0) {
      fail(id, 'bad-crop', 'crop must be integer x,y,w,h inside the image');
    }
  }
  if (!Array.isArray(e.masks)) fail(id, 'bad-mask', 'masks must be a list');
  for (const m of e.masks) {
    if (!isRect(m) || !onlyKeys(m, ['x', 'y', 'w', 'h', 'kind']) || m.w <= 0 || m.h <= 0) {
      fail(id, 'bad-mask', 'a mask needs integer x,y,w,h (w,h > 0) and kind');
    }
    if (!KINDS.includes(m.kind)) fail(id, 'unknown-kind', 'mask kind is not in the allowed list');
  }
  const alt = typeof e.alt === 'string' ? e.alt.trim() : '';
  if (!alt) fail(id, 'empty-alt', 'alt text is required');
  if (/^(스크린샷|이미지)/.test(alt)) fail(id, 'alt-prefix', 'alt must not start with a filler word');
  if ([...alt].length > ALT_MAX) fail(id, 'alt-too-long', `alt is longer than ${ALT_MAX} characters`);
  if (hasPhone(alt)) fail(id, 'alt-phone', 'alt looks like a phone number');
  if (e.status !== 'draft' && e.status !== 'approved') fail(id, 'bad-status', 'status must be draft or approved');
  // noSensitive is the explicit "I checked, nothing to mask" acknowledgement; it only makes sense with no masks
  if (e.noSensitive !== undefined && (e.noSensitive !== true || e.masks.length > 0)) {
    fail(id, 'bad-mask', 'noSensitive must be true and only used together with an empty masks list');
  }
  if (e.status === 'approved' && e.masks.length === 0 && e.noSensitive !== true) {
    fail(id, 'no-masks', 'an approved project needs at least one mask, or "noSensitive": true after checking the image');
  }
}

function listImages(dir) {
  return fs.readdirSync(dir).filter((n) => IMAGE_EXT.test(n)).sort();
}

// returns the absolute path of the one source image, or null when the folder does not exist
function resolveSource(o, id, entry) {
  const dir = path.join(o.src, id);
  if (!fs.existsSync(dir)) return null;
  const names = fs.readdirSync(dir);
  if (entry.source === undefined && names.some((n) => HEIC_EXT.test(n))) {
    fail(id, 'heic-source', 'HEIC/HEIF cannot be read: export the image as PNG or JPEG');
  }
  const images = listImages(dir);
  if (entry.source !== undefined) {
    const want = entry.source.normalize('NFC');
    const hit = images.find((n) => n.normalize('NFC') === want);
    if (!hit) fail(id, 'source-missing', 'the source file named in the manifest is not in the folder');
    return path.join(dir, hit);
  }
  if (images.length === 0) fail(id, 'source-missing', 'no image in the folder');
  if (images.length > 1) fail(id, 'multiple-images', `${images.length} images found, set "source" in the manifest (one image per project)`);
  return path.join(dir, images[0]);
}

const rectInside = (r, w, h) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h;
const rectsIntersect = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function flattenRotated(srcPath) {
  return sharp(srcPath)
    .rotate() // apply EXIF orientation; coordinates in the manifest are in this rotated space
    .flatten({ background: '#ffffff' })
    .toColourspace('srgb')
    .png()
    .toBuffer({ resolveWithObject: true });
}

function warnAspect(id, frame, w, h) {
  if (frame === 'app' && Math.abs(w / h - APP_ASPECT) / APP_ASPECT > ASPECT_TOLERANCE) {
    console.warn(`${id}: warning: app image is not close to 9:16 (${w}x${h}), the card frame will crop it`);
  }
}

async function render(id, srcPath, entry, frame) {
  const { data: flat, info } = await flattenRotated(srcPath);
  const W = info.width;
  const H = info.height;
  warnAspect(id, frame, W, H);
  const crop = entry.crop || null;
  if (crop && !rectInside(crop, W, H)) fail(id, 'crop-outside-image', 'crop is not inside the image');
  for (const m of entry.masks) {
    if (!rectInside(m, W, H)) fail(id, 'mask-outside-image', 'a mask is not inside the image');
    if (crop && rectsIntersect(m, crop) && !rectInside(m, crop.x + crop.w, crop.y + crop.h)) {
      fail(id, 'mask-crop-partial', 'a mask is only partly inside the crop');
    }
    if (crop && rectsIntersect(m, crop) && (m.x < crop.x || m.y < crop.y)) {
      fail(id, 'mask-crop-partial', 'a mask is only partly inside the crop');
    }
  }
  let base = flat;
  if (entry.masks.length) {
    base = await sharp(flat)
      .composite(
        entry.masks.map((m) => ({
          input: { create: { width: m.w, height: m.h, channels: 3, background: MASK_COLOR } },
          left: m.x,
          top: m.y,
        }))
      )
      .png()
      .toBuffer();
  }
  if (crop) {
    base = await sharp(base).extract({ left: crop.x, top: crop.y, width: crop.w, height: crop.h }).png().toBuffer();
  }
  const srcW = crop ? crop.w : W;
  const srcH = crop ? crop.h : H;
  const widths = ladder(frame, srcW);
  const biggest = widths[widths.length - 1];
  if (Math.round((biggest * srcH) / srcW) > WEBP_MAX_SIDE) {
    fail(id, 'crop-needed', `output would be taller than ${WEBP_MAX_SIDE}px, set a crop`);
  }
  const files = [];
  for (const w of widths) {
    const r = sharp(base).resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' });
    const webp = await r.clone().webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer();
    const jpg = await r.clone().jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
    const h = (await sharp(jpg).metadata()).height;
    files.push({ w, h, bufs: { webp, jpg } });
  }
  for (const f of files) {
    for (const ext of FORMATS) {
      const limit = f.w === biggest ? BIG_BYTES : OTHER_BYTES;
      if (f.bufs[ext].length > limit) {
        console.warn(`${id}: warning: ${id}-${f.w}.${ext} is ${f.bufs[ext].length} bytes (limit ${limit}), consider a crop`);
      }
    }
  }
  return files;
}

function writeFiles(dir, id, files) {
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set();
  for (const f of files) {
    for (const ext of FORMATS) {
      const name = `${id}-${f.w}.${ext}`;
      keep.add(name);
      fs.writeFileSync(path.join(dir, name), f.bufs[ext]);
    }
  }
  removeStale(dir, id, keep);
}

function removeStale(dir, id, keep) {
  const re = new RegExp(`^${id}-\\d+\\.(webp|jpg)$`);
  for (const n of fs.readdirSync(dir)) if (re.test(n) && !keep.has(n)) fs.rmSync(path.join(dir, n));
}

async function runAll(o, only) {
  let html = fs.readFileSync(o.html, 'utf8');
  const original = html;
  const manifest = loadManifest(o.manifest, html);
  const ids = Object.keys(manifest.projects);
  if (only && !ids.includes(only)) fail('', 'unknown-project', 'the id given to --only is not in the manifest');
  const todo = only ? [only] : ids;
  // Phase 1: render and validate every project in memory. Nothing is written until all of them succeeded,
  // so an error in project N can never leave projects 1..N-1 half published.
  const jobs = [];
  for (const id of todo) {
    const entry = manifest.projects[id];
    const srcPath = resolveSource(o, id, entry);
    if (srcPath === null) {
      if (entry.status === 'approved') {
        jobs.push({ id, keep: true });
        continue;
      }
      fail(id, 'source-missing', 'no folder for this project in the source directory');
    }
    const art = readArticle(html, id);
    const files = await render(id, srcPath, entry, art.frame);
    jobs.push({ id, entry, art, files });
    if (entry.status === 'approved') {
      html = replaceFigure(
        html,
        id,
        figureMarkup({ id, frame: art.frame, title: art.title, alt: entry.alt.trim(), files: files.map(({ w, h }) => ({ w, h })) })
      );
    }
  }
  // Phase 2: write the image files, then index.html last.
  let count = 0;
  for (const job of jobs) {
    count++;
    if (job.keep) {
      console.log(`${job.id}: source missing, keeping committed output`);
      continue;
    }
    const widths = job.files.map((f) => f.w).join(',');
    if (job.entry.status === 'approved') {
      writeFiles(path.join(o.out, job.id), job.id, job.files);
      console.log(`${job.id}: approved, widths ${widths}`);
    } else {
      writeFiles(path.join(o.preview, job.id), job.id, job.files);
      console.log(`${job.id}: draft -> preview`);
    }
  }
  if (!only && fs.existsSync(o.src)) {
    for (const d of fs.readdirSync(o.src, { withFileTypes: true })) {
      if (d.isDirectory() && !ids.includes(d.name)) {
        console.log(`${d.name}: ${listImages(path.join(o.src, d.name)).length} image(s), not in manifest, skipped`);
      }
    }
  }
  if (html !== original) fs.writeFileSync(o.html, html);
  console.log(`${count} projects`);
  return 0;
}

async function clear(o, id) {
  let html = fs.readFileSync(o.html, 'utf8');
  if (!articleIds(html).includes(id)) fail('', 'unknown-project', 'the id given to --clear is not an article id');
  const art = readArticle(html, id);
  const next = replaceFigure(html, id, emptyFigure(art.frame));
  if (next !== html) fs.writeFileSync(o.html, next);
  const dir = path.join(o.out, id);
  if (fs.existsSync(dir)) {
    removeStale(dir, id, new Set());
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }
  console.log(`${id}: cleared, empty frame restored`);
  try {
    const m = JSON.parse(fs.readFileSync(o.manifest, 'utf8'));
    if (m.projects?.[id]?.status === 'approved') {
      console.log('note: the manifest entry is still approved, the next run regenerates it (set draft or remove it to keep it empty)');
    }
  } catch {
    // no manifest, nothing to remind about
  }
  return 0;
}

async function info(o) {
  const html = fs.readFileSync(o.html, 'utf8');
  const ids = articleIds(html);
  if (!fs.existsSync(o.src)) {
    console.log('no source folder');
    return 0;
  }
  for (const d of fs.readdirSync(o.src, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const known = ids.includes(d.name);
    const frame = known ? readArticle(html, d.name).frame : '-';
    const dir = path.join(o.src, d.name);
    const images = listImages(dir);
    console.log(`${d.name}: article=${known ? 'yes' : 'no'} frame=${frame} images=${images.length}`);
    for (const n of images) {
      const { info: i } = await flattenRotated(path.join(dir, n));
      const fmt = (await sharp(path.join(dir, n)).metadata()).format;
      console.log(`  ${n.normalize('NFC')}: ${i.width}x${i.height} ${fmt}`);
      if (known) warnAspect(d.name, frame, i.width, i.height);
    }
  }
  return 0;
}

async function annotate(o, id) {
  const html = fs.readFileSync(o.html, 'utf8');
  if (!articleIds(html).includes(id)) fail('', 'unknown-project', 'the id given to --annotate is not an article id');
  let entry = { masks: [] };
  try {
    entry = JSON.parse(fs.readFileSync(o.manifest, 'utf8')).projects?.[id] || entry;
  } catch {
    // no manifest yet: grid only
  }
  const srcPath = resolveSource(o, id, entry);
  if (srcPath === null) fail(id, 'source-missing', 'no folder for this project in the source directory');
  const { data, info: i } = await flattenRotated(srcPath);
  const parts = [];
  for (let x = 0; x < i.width; x += GRID_STEP) {
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${i.height}" stroke="#0ea5e9" stroke-opacity="0.45"/>`);
    parts.push(`<text x="${x + 2}" y="12" font-size="12" font-family="sans-serif" fill="#0369a1">${x}</text>`);
  }
  for (let y = 0; y < i.height; y += GRID_STEP) {
    parts.push(`<line x1="0" y1="${y}" x2="${i.width}" y2="${y}" stroke="#0ea5e9" stroke-opacity="0.45"/>`);
    parts.push(`<text x="2" y="${y + 12}" font-size="12" font-family="sans-serif" fill="#0369a1">${y}</text>`);
  }
  (entry.masks || []).forEach((m, n) => {
    parts.push(`<rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" fill="none" stroke="#dc2626" stroke-width="3"/>`);
    parts.push(`<text x="${m.x + 4}" y="${m.y + 18}" font-size="18" font-family="sans-serif" fill="#dc2626">${n + 1}</text>`);
  });
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${i.width}" height="${i.height}">${parts.join('')}</svg>`);
  fs.mkdirSync(o.preview, { recursive: true });
  const outFile = path.join(o.preview, `${id}-grid.png`);
  await sharp(data).composite([{ input: svg, left: 0, top: 0 }]).png().toFile(outFile);
  console.log(outFile);
  return 0;
}
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
  const comJ = Buffer.concat([plainJ.subarray(0, 2), Buffer.from([0xff, 0xfe, 0x00, 0x04, 0x61, 0x62]), plainJ.subarray(2)]);
  check('jpeg COM flagged', jpegMeta(comJ).includes('COM'));
  check('jpeg truncated is MALFORMED', jpegMeta(plainJ.subarray(0, plainJ.length - 30)).includes('MALFORMED'));
  check('webp overflow chunk is MALFORMED', webpMeta(Buffer.concat([plainW, Buffer.from('JUNK', 'latin1'), Buffer.from([0xff, 0xff, 0xff, 0x7f])])).includes('MALFORMED'));
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

async function groupContent(origHtml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-content-'));
  try {
    const p = paths(root);
    p.out = path.join(root, 'img', 'projects');
    fs.writeFileSync(p.html, origHtml);
    await seedSources(p);
    writeManifest(p, pipelineManifest());
    const r = cli(flags(p));
    check(`content run exit (${r.err.trim().slice(0, 80)})`, r.code === 0);
    const run = (file) =>
      spawnSync(process.execPath, [path.join(path.dirname(SELF), 'check-content.mjs'), '--html', file, '--only', 'shots,slots'], { encoding: 'utf8' });
    const good = run(p.html);
    check(`filled html passes (${(good.stderr || '').trim().slice(0, 100)})`, good.status === 0 && /PASS shots \(2 filled, 11 empty\)/.test(good.stdout));
    const filled = fs.readFileSync(p.html, 'utf8');
    const id = PH.web.id;
    const broken = {
      'empty alt': () => filled.replace(`alt="${ALT[id]}"`, 'alt=""'),
      'aria-hidden kept': () => filled.replace(`<figure class="shot" data-slot="screenshot" data-frame="web">`, `<figure class="shot" data-slot="screenshot" data-frame="web" aria-hidden="true">`),
      'wrong aria-label': () => filled.replace(/(<a class="shot-link"[^>]*aria-label=")([^"]*)"/, '$1다른 이름"'),
      'deleted file': () => {
        fs.rmSync(path.join(p.out, id, `${id}-960.webp`));
        return filled;
      },
    };
    for (const [name, make] of Object.entries(broken)) {
      const html = make();
      check(`${name}: mutation applied`, name === 'deleted file' || html !== filled);
      const file = path.join(root, `broken-${name.replace(/ /g, '-')}.html`);
      fs.writeFileSync(file, html);
      const res = run(file);
      check(`${name}: exits 1`, res.status === 1);
    }
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
      ['no-masks', { ...good, masks: [], status: 'approved' }],
      ['bad-mask', { ...good, masks: [], noSensitive: false }],
      ['bad-mask', { ...good, noSensitive: true }],
    ];
    for (const [rule, entry] of cases) {
      writeManifest(p, entry === null ? { 'zz-unknown-id': good } : { [id]: entry });
      const r = cli(flags(p));
      check(`${rule}: exits non-zero`, r.code !== 0 && r.code !== null);
      check(`${rule}: names the rule`, r.all.includes(`rule:${rule}`));
      check(`${rule}: no field echo`, !r.all.includes(SENT) && !r.all.includes(phone) && !r.all.includes('zzkind') && !r.all.includes('zz-unknown-id'));
    }
    // explicit acknowledgement lets an approved project without masks through
    writeManifest(p, { [id]: { ...good, masks: [], noSensitive: true, status: 'approved' } });
    check('noSensitive acknowledgement accepted', cli(flags(p)).code === 0);
    // all-or-nothing: project 2 fails while rendering, project 1 (alt changed) must not be published
    {
      const html0 = fs.readFileSync(p.html, 'utf8');
      const outBefore = fs.existsSync(p.out) ? JSON.stringify(fs.readdirSync(p.out, { recursive: true }).sort()) : '';
      fs.mkdirSync(path.join(p.src, 'gi-oneday'), { recursive: true });
      fs.writeFileSync(path.join(p.src, 'gi-oneday', 'main.png'), await makeUiImage({ width: 1000, height: 500, format: 'png' }));
      writeManifest(p, {
        [id]: { ...good, masks: [], noSensitive: true, status: 'approved', alt: '다른 설명 문구' },
        'gi-oneday': { ...good, masks: [{ x: 900, y: 10, w: 200, h: 40, kind: 'other' }], status: 'approved' },
      });
      const ra = cli(flags(p));
      const outAfter = fs.existsSync(p.out) ? JSON.stringify(fs.readdirSync(p.out, { recursive: true }).sort()) : '';
      check('atomic run: fails', ra.code !== 0 && ra.all.includes('rule:mask-outside-image'));
      check('atomic run: html unchanged', fs.readFileSync(p.html, 'utf8') === html0);
      check('atomic run: no files written', outAfter === outBefore);
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
    ['content', () => groupContent(origHtml)],
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

process.exitCode = await main();
