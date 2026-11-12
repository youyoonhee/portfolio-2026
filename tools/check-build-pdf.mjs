// Guard tests for tools/build-pdf.mjs. They never launch Chrome and use fake contact data
// written to the OS temp dir at runtime (outside the repo). Output is pass/fail lines only.
// usage: npm run check:pdfguard
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'pdfguard-'));
let failed = 0;

function run(env, contact) {
  const file = join(dir, 'contact.json');
  if (contact) writeFileSync(file, JSON.stringify(contact));
  const e = { ...process.env, PDF_CONTACT_FILE: file, ...env };
  for (const k of ['DEBUG', 'NODE_DEBUG']) if (!(k in env)) delete e[k];
  return spawnSync(process.execPath, ['tools/build-pdf.mjs'], { cwd: ROOT, env: e, encoding: 'utf8' });
}
function expectRefusal(name, r, pattern) {
  const out = `${r.stdout}${r.stderr}`;
  const ok = r.status === 1 && pattern.test(out) && !/\d{4}/.test(out);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

try {
  // fake number assembled at runtime, never stored in the repo
  const fake = ['0', '1', '0'].join('') + '-' + '1'.repeat(4) + '-' + '2'.repeat(4);
  const good = { phone: { label: 'x', display: fake } };

  expectRefusal('DEBUG=puppeteer:* is refused', run({ DEBUG: 'puppeteer:*' }, good), /unset DEBUG/);
  expectRefusal('DEBUG=* is refused', run({ DEBUG: '*' }, good), /unset DEBUG/);
  expectRefusal('DEBUG=pptr* is refused', run({ DEBUG: 'pptr*' }, good), /unset DEBUG/);
  expectRefusal('NODE_DEBUG=http is refused', run({ NODE_DEBUG: 'http' }, good), /unset DEBUG/);
  expectRefusal('placeholder phone.label is refused', run({}, { phone: { label: '<label>', display: fake } }), /phone.label/);
  expectRefusal('placeholder phone.display is refused', run({}, { phone: { display: '<number>' } }), /phone\.display/);
  const leak = join(ROOT, 'out-test.pdf');
  expectRefusal('PDF_OUT inside the public tree is refused', run({ PDF_OUT: leak }, good), /PDF_OUT/);
  const leaked = existsSync(leak);
  if (leaked) { failed++; rmSync(leak, { force: true }); }
  console.log(`${leaked ? 'FAIL' : 'PASS'} refused PDF_OUT file was not created`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
