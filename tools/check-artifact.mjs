// Independent verifier for the Pages artifact (D-02). Re-walks the directory and checks it against its own
// allowlist (deliberately not shared with stage-pages.mjs), noindex (DEPL-02) and reference resolution.
// Usage: node tools/check-artifact.mjs <dir> | --self-test
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, posix } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ALLOW = [
  /^(index|404)\.html$/, /^robots\.txt$/, /^favicon\.svg$/, /^favicon-32\.png$/, /^apple-touch-icon\.png$/,
  /^css\/[a-z0-9-]+\.css$/, /^js\/[a-z0-9-]+\.js$/,
  /^fonts\/pretendard\/[a-z0-9.-]+\.woff2$/, /^fonts\/print\/[a-z0-9-]+\.ttf$/, /^fonts\/[a-z0-9-]+\.txt$/,
  /^img\/og-card\.png$/, /^img\/projects\/[a-z0-9-]+\/[a-z0-9-]+\.(avif|webp|jpg|png)$/,
];
const REQUIRED = ['index.html', '404.html', 'robots.txt', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'img/og-card.png'];
const BAD_EXT = /\.(pdf|json|md|mjs|map|yml|yaml|zip)$/i;
const NOINDEX = /<meta\s+name="robots"\s+content="noindex, nofollow"\s*>/i;
const BASE_PREFIX = '/portfolio-2026/';

function check(root) {
  const base = resolve(root);
  const problems = [];
  const files = [];
  if (!existsSync(base) || !lstatSync(base).isDirectory()) return { problems: ['FAIL missing directory'], files };
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const r = rel ? `${rel}/${name}` : name;
      const st = lstatSync(join(dir, name));
      if (name.startsWith('.')) { problems.push(`FAIL dotfile ${r}`); continue; }
      if (st.isSymbolicLink()) { problems.push(`FAIL symlink ${r}`); continue; }
      if (st.isDirectory()) { walk(join(dir, name), r); continue; }
      files.push(r);
      if (BAD_EXT.test(r) || !ALLOW.some((re) => re.test(r))) problems.push(`FAIL not-allowlisted ${r}`);
    }
  };
  walk(base, '');
  for (const f of REQUIRED) if (!files.includes(f)) problems.push(`FAIL missing ${f}`);
  const read = (f) => readFileSync(join(base, f), 'utf8');
  for (const f of ['index.html', '404.html']) {
    if (files.includes(f) && !NOINDEX.test(read(f))) problems.push(`FAIL noindex ${f}`);
    // the HTML spec (and W3C Nu) require the charset declaration inside the first 1024 bytes
    if (files.includes(f)) { const at = readFileSync(join(base, f)).indexOf('<meta charset='); if (at < 0 || at > 1024 - 24) problems.push(`FAIL charset-late ${f}`); }
  }

  // exact-case existence: compare each path segment with the real directory listing
  const exactExists = (target) => {
    let cur = base;
    for (const seg of target.split('/').filter(Boolean)) {
      if (!existsSync(cur) || !lstatSync(cur).isDirectory()) return 'missing';
      const names = readdirSync(cur);
      if (names.includes(seg)) { cur = join(cur, seg); continue; }
      return names.some((n) => n.toLowerCase() === seg.toLowerCase()) ? 'case' : 'missing';
    }
    return existsSync(cur) ? 'ok' : 'missing';
  };
  const checkRef = (ref, file) => {
    let v = ref.trim().replace(/^['"]|['"]$/g, '');
    if (!v || /^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(v)) return;
    v = v.replace(/[?#].*$/, '');
    if (!v) return;
    let target;
    if (v.startsWith(BASE_PREFIX)) target = v.slice(BASE_PREFIX.length) || 'index.html';
    else if (v.startsWith('/')) target = v.slice(1) || 'index.html';
    else target = posix.normalize(posix.join(posix.dirname(file), v));
    if (target.startsWith('..')) { problems.push(`FAIL ref-missing ${ref} in ${file}`); return; }
    if (target === '.' || target === '') target = 'index.html';
    if (target.endsWith('/')) target += 'index.html';
    const res = exactExists(target);
    if (res === 'case') problems.push(`FAIL ref-case ${ref} in ${file}`);
    else if (res === 'missing') problems.push(`FAIL ref-missing ${ref} in ${file}`);
  };
  for (const f of files.filter((x) => x.endsWith('.html'))) {
    const t = read(f);
    for (const m of t.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/gi)) checkRef(m[1], f);
    for (const m of t.matchAll(/\bsrcset\s*=\s*"([^"]*)"/gi)) {
      for (const cand of m[1].split(',')) { const u = cand.trim().split(/\s+/)[0]; if (u) checkRef(u, f); }
    }
  }
  for (const f of files.filter((x) => x.endsWith('.css'))) {
    for (const m of read(f).matchAll(/url\(\s*([^)]*?)\s*\)/gi)) checkRef(m[1], f);
  }
  return { problems, files };
}

// ---------- self test ----------
function selfTest() {
  const self = fileURLToPath(import.meta.url);
  const tmp = mkdtempSync(join(tmpdir(), 'check-artifact-'));
  let passed = 0;
  let fail = 0;
  const w = (dir, rel, body = 'x') => { const p = join(dir, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, body); };
  const html = '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="css/base.css"><img src="img/og-card.png" srcset="img/og-card.png 1x, img/og-card.png 2x"><a href="https://example.com/">x</a><a href="#top">t</a>';
  const html404 = html.replace('href="css/base.css"', 'href="/portfolio-2026/css/base.css"');
  const make = (name, mutate) => {
    const dir = join(tmp, name);
    w(dir, 'index.html', html); w(dir, '404.html', html404); w(dir, 'robots.txt', 'User-agent: *\nDisallow: /\n');
    w(dir, 'favicon.svg', '<svg/>'); w(dir, 'favicon-32.png'); w(dir, 'apple-touch-icon.png'); w(dir, 'img/og-card.png');
    w(dir, 'css/base.css', '@font-face{src:url("../fonts/print/pretendard-regular.ttf")}');
    w(dir, 'fonts/print/pretendard-regular.ttf');
    if (mutate) mutate(dir);
    return dir;
  };
  const run = (dir) => spawnSync(process.execPath, [self, dir], { encoding: 'utf8' });
  const pos = (name) => {
    const r = run(make(name));
    if (r.status === 0) passed++; else { fail++; console.error(`self-test: ${name} should pass\n${r.stderr}`); }
  };
  const neg = (name, mutate, expect) => {
    const r = run(make(name, mutate));
    if (r.status !== 0 && r.stderr.includes(expect)) passed++;
    else { fail++; console.error(`self-test: ${name} should fail with "${expect}"`); }
  };
  pos('clean');
  neg('stray-tool', (d) => w(d, 'tools/x.mjs'), 'FAIL not-allowlisted tools/x.mjs');
  neg('package-json', (d) => w(d, 'package.json', '{}'), 'FAIL not-allowlisted package.json');
  neg('pdf', (d) => w(d, 'a.pdf'), 'FAIL not-allowlisted a.pdf');
  neg('env', (d) => w(d, '.env'), 'FAIL dotfile .env');
  neg('nojekyll', (d) => w(d, '.nojekyll'), 'FAIL dotfile .nojekyll');
  neg('json-in-css-dir', (d) => w(d, 'css/data.json'), 'FAIL not-allowlisted css/data.json');
  neg('no-index', (d) => rmSync(join(d, 'index.html')), 'FAIL missing index.html');
  neg('no-404', (d) => rmSync(join(d, '404.html')), 'FAIL missing 404.html');
  neg('no-og', (d) => rmSync(join(d, 'img/og-card.png')), 'FAIL missing img/og-card.png');
  neg('charset-late', (d) => w(d, 'index.html', '<!doctype html><!--' + 'x'.repeat(1100) + '-->' + html.slice(15)), 'FAIL charset-late index.html');
  neg('no-noindex', (d) => w(d, 'index.html', html.replace('noindex, nofollow', 'index')), 'FAIL noindex index.html');
  neg('case-mismatch', (d) => w(d, 'css/base.css', '@font-face{src:url(../fonts/print/Pretendard-Regular.ttf)}'), 'FAIL ref-case');
  neg('missing-img', (d) => w(d, 'index.html', html + '<img src="img/nope.png">'), 'FAIL ref-missing img/nope.png');
  neg('missing-srcset', (d) => w(d, 'index.html', html + '<img srcset="img/gone.webp 480w">'), 'FAIL ref-missing img/gone.webp');
  neg('uppercase-file', (d) => w(d, 'css/Extra.css'), 'FAIL not-allowlisted css/Extra.css');
  const sl = make('symlink');
  let linked = true;
  try { symlinkSync(join(sl, 'index.html'), join(sl, 'link.html')); } catch (e) { if (e.code === 'EPERM' || e.code === 'EACCES') linked = false; else throw e; }
  if (!linked) console.log('self-test: symlink case SKIP (symlink not permitted)');
  else if (run(sl).status !== 0) passed++; else { fail++; console.error('self-test: symlink should fail'); }
  rmSync(tmp, { recursive: true, force: true });
  if (fail) { console.error(`check-artifact self-test: ${fail} failed`); process.exit(1); }
  console.log(`check-artifact self-test: ${passed} passed`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = process.argv[2];
  if (arg === '--self-test') selfTest();
  else if (!arg) { console.error('usage: check-artifact.mjs <dir> | --self-test'); process.exit(2); }
  else {
    const { problems, files } = check(arg);
    if (problems.length) { for (const p of problems) console.error(p); console.error(`check-artifact: ${problems.length} problem(s)`); process.exit(1); }
    console.log(`check-artifact: ${files.length} file(s) ok`);
  }
}
