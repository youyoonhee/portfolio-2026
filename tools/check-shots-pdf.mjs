// End-to-end synthetic test for the submission PDF with screenshots (Phase 4, D-13/D-14).
// Builds a temp copy of the site with one synthetic image per project article, runs tools/build-pdf.mjs against it and checks
// size, JPEG embedding, local links and page count. The repo is never touched; output is PASS/FAIL lines only.
// usage: node tools/check-shots-pdf.mjs [--measure]
//   --measure  run only the normal case with the page cap lifted and print `measured pages <n>`
import { copyFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { articleIds } from './lib/shot-markup.mjs';
import { makeUiImage } from './lib/shot-fixtures.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED = JSON.parse(readFileSync(join(ROOT, 'tools', 'content-manifest.json'), 'utf8')).projects.length;
const MEASURE = process.argv.includes('--measure');
const KEEP = process.argv.includes('--keep'); // keep the temp folder for debugging (prints its path)
const SOFT_TARGET = 5000000;
const MEASURE_CAP = '1000';
const LADDER_SOFT = '1000';
const HARD_TINY = '1000';
const WEB_SIZE = { width: 1440, height: 3000 };
const APP_SIZE = { width: 1080, height: 1920 };

let failed = 0;
const say = (ok, name) => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  return ok;
};

// node's recursive cpSync crashes on this Windows setup, so copy by hand
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const e of readdirSync(from, { withFileTypes: true })) {
    if (e.isDirectory()) copyTree(join(from, e.name), join(to, e.name));
    else copyFileSync(join(from, e.name), join(to, e.name));
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'shotspdf-'));
try {
  const site = join(tmp, 'site');
  mkdirSync(site, { recursive: true });
  for (const n of ['index.html', 'css', 'js', 'fonts']) {
    const from = join(ROOT, n);
    if (!existsSync(from)) continue;
    if (n.endsWith('.html')) copyFileSync(from, join(site, n));
    else copyTree(from, join(site, n));
  }
  const html0 = readFileSync(join(site, 'index.html'), 'utf8');
  const ids = articleIds(html0);
  const projects = {};
  for (const [n, id] of ids.entries()) {
    const frame = new RegExp(`id="${id}"[\\s\\S]*?data-frame="(web|app)"`).exec(html0)[1];
    const dir = join(tmp, 'src', id);
    mkdirSync(dir, { recursive: true });
    const size = frame === 'app' ? APP_SIZE : WEB_SIZE;
    // a distinct block near the top so every image differs even where the frame crops a long screen (PDF dedupes equal images)
    const base = await makeUiImage({ ...size, label: 'Synthetic', format: 'png' });
    const marker = { create: { width: 60, height: 60, channels: 3, background: { r: 20 + n * 18, g: 200 - n * 10, b: 40 + n * 15 } } };
    writeFileSync(join(dir, 'main.png'), await sharp(base).composite([{ input: marker, left: 300 + n * 40, top: 200 }]).png().toBuffer());
    projects[id] = {
      source: 'main.png',
      crop: null,
      masks: [{ x: 40, y: 40, w: 200, h: 60, kind: 'other' }],
      alt: '합성 테스트 화면',
      status: 'approved',
    };
  }
  writeFileSync(join(tmp, 'screenshots.json'), JSON.stringify({ version: 1, projects }));
  const opt = spawnSync(process.execPath, [
    join(ROOT, 'tools', 'optimise-images.mjs'),
    '--src', join(tmp, 'src'), '--out', join(site, 'img', 'projects'), '--html', join(site, 'index.html'),
    '--manifest', join(tmp, 'screenshots.json'), '--preview', join(tmp, 'preview'),
  ], { encoding: 'utf8' });
  const filled = (readFileSync(join(site, 'index.html'), 'utf8').match(/<picture>/g) || []).length;
  if (!(opt.status === 0 && ids.length === EXPECTED && filled === EXPECTED)) {
    say(false, `setup (exit ${opt.status}, articles ${ids.length}, filled ${filled})`);
    throw new Error('setup failed');
  }
  say(true, 'setup');

  // fake number assembled at runtime, never stored in the repo
  const fake = ['0', '1', '0'].join('') + '-' + '1'.repeat(4) + '-' + '2'.repeat(4);
  const contact = join(tmp, 'contact.json');
  writeFileSync(contact, JSON.stringify({ phone: { label: 'x', display: fake } }));
  const out = join(tmp, 'out.pdf');

  const build = (extra) => {
    rmSync(out, { force: true });
    const env = { ...process.env, PDF_SITE_ROOT: site, PDF_OUT: out, PDF_CONTACT_FILE: contact, ...extra };
    delete env.DEBUG;
    const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'build-pdf.mjs')], { cwd: ROOT, env, encoding: 'utf8', timeout: 600000 });
    const stdout = r.stdout || '';
    // only status lines are echoed, never extracted text
    for (const l of `${stdout}\n${r.stderr || ''}`.split(/\r?\n/)) {
      if (/^(FAIL|WARN|pdf step|build-pdf)/.test(l)) console.log(`  | ${l}`);
    }
    return { code: r.status, stdout };
  };
  const pagesOf = (s) => Number((/^pages (\d+)$/m.exec(s) || [])[1] || 0);

  const normal = build(MEASURE ? { PDF_MAX_PAGES: MEASURE_CAP } : {});
  console.log(`normal: builder exit ${normal.code}`);
  const outExists = existsSync(out);
  say(outExists, 'normal: PDF_OUT honoured');
  if (outExists) console.log(`normal: bytes ${statSync(out).size}`);
  say(outExists && statSync(out).size < SOFT_TARGET, 'normal: size under target');
  say(/PASS JPEG images embedded/.test(normal.stdout), 'normal: JPEG images embedded');
  say(/PASS no local link targets/.test(normal.stdout), 'normal: no local link targets');
  say(/PASS page count within limit/.test(normal.stdout), 'normal: page count within limit');
  console.log(`normal: pages ${pagesOf(normal.stdout)}`);
  if (MEASURE) {
    console.log(`measured pages ${pagesOf(normal.stdout)}`);
  } else {
    const ladder = build({ PDF_SOFT_BYTES: LADDER_SOFT });
    say(ladder.code === 0, 'ladder: builder exit 0');
    say(/pdf step 3/.test(ladder.stdout), 'ladder: all steps used');
    say(/WARN size over target/.test(ladder.stdout), 'ladder: size warning shown');

    const hard = build({ PDF_HARD_BYTES: HARD_TINY });
    say(hard.code === 1, 'hard: builder exit 1');
    say(!existsSync(out), 'hard: PDF removed');
  }
} catch (err) {
  say(false, `unexpected error (${String(err && err.message).slice(0, 80)})`);
} finally {
  if (KEEP) console.log(`kept ${tmp}`);
  else rmSync(tmp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
