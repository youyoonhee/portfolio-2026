// Copies ONLY allowlisted site files into dist/site (the GitHub Pages artifact, D-02).
// Usage: node tools/stage-pages.mjs [out]   (out must be dist or inside dist; default dist/site)
// Anything not matched by the table below is skipped and counted, never copied.
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const out = resolve(ROOT, process.argv[2] ?? 'dist/site');
const rel = relative(DIST, out);
if (rel.startsWith('..') || isAbsolute(rel)) {
  console.error('stage-pages: output must be inside dist/');
  process.exit(2);
}

const ROOT_FILES = ['index.html', '404.html', 'robots.txt', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'];
const REQUIRED_EXTRA = ['img/og-card.png'];
const DIRS = [
  ['css', /^[a-z0-9-]+\.css$/],
  ['js', /^[a-z0-9-]+\.js$/],
  ['fonts/pretendard', /^[a-z0-9.-]+\.woff2$/],
  ['fonts/print', /^[a-z0-9-]+\.ttf$/],
  ['fonts', /^[a-z0-9-]+\.txt$/],
];
const PROJECT_IMG = /^[a-z0-9-]+\.(avif|webp|jpg|png)$/;
// sub-directories of fonts/ that are handled by their own DIRS entry
const HANDLED_SUBDIRS = new Set(['pretendard', 'print']);

let copied = 0;
let skipped = 0;
let failed = false;
const fail = (m) => { console.error(`stage-pages: ${m}`); failed = true; };

const put = (relPath) => {
  const dst = join(out, relPath);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(join(ROOT, relPath), dst);
  copied++;
};
const listDir = (relDir) => {
  const abs = join(ROOT, relDir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).map((name) => {
    const st = lstatSync(join(abs, name));
    if (st.isSymbolicLink()) { fail(`symlink in source: ${relDir}/${name}`); return null; }
    return { name, isFile: st.isFile() };
  }).filter(Boolean);
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const f of [...ROOT_FILES, ...REQUIRED_EXTRA]) {
  if (!existsSync(join(ROOT, f)) || lstatSync(join(ROOT, f)).isSymbolicLink()) fail(`missing required file ${f}`);
  else put(f);
}
for (const [dir, re] of DIRS) {
  for (const e of listDir(dir)) {
    if (e.isFile && re.test(e.name)) put(`${dir}/${e.name}`);
    else if (dir === 'fonts' && !e.isFile && HANDLED_SUBDIRS.has(e.name)) continue;
    else skipped++;
  }
}
for (const p of listDir('img/projects')) {
  if (p.isFile || !/^[a-z0-9-]+$/.test(p.name)) { skipped++; continue; }
  for (const e of listDir(`img/projects/${p.name}`)) {
    if (e.isFile && PROJECT_IMG.test(e.name)) put(`img/projects/${p.name}/${e.name}`); else skipped++;
  }
}

if (failed) process.exit(1);
console.log(`stage-pages: ${copied} file(s) -> ${relative(ROOT, out).replace(/\\/g, '/')} (skipped ${skipped})`);
