// Submission PDF builder: renders the same index.html + print CSS with installed Chrome.
// The phone number comes from the gitignored private/contact.json and is injected into the page DOM
// at build time only. It is never logged: every message that leaves this process goes through redact().
// usage: npm run pdf
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(DIST, '퍼블리셔 유윤희-포트폴리오.pdf');
const CONTACT = process.env.PDF_CONTACT_FILE ? resolve(process.env.PDF_CONTACT_FILE) : join(ROOT, 'private', 'contact.json');

const CONTACT_NAME = process.env.PDF_CONTACT_FILE ? `${basename(CONTACT)} (PDF_CONTACT_FILE)` : 'private/contact.json';
const redact = (s) => String(s).replace(/[0-9]/g, '#');
function die(msg) {
  console.error(`build-pdf: ${redact(msg)}`);
  process.exit(1);
}

// a contact override inside the repo must be gitignored, or the number could be committed by accident
function warnIfTrackable() {
  if (!process.env.PDF_CONTACT_FILE) return;
  const rel = relative(ROOT, CONTACT);
  if (rel.startsWith('..') || isAbsolute(rel)) return; // outside the repo
  const r = spawnSync('git', ['check-ignore', '-q', rel], { cwd: ROOT });
  if (r.status !== 0) {
    console.error(`build-pdf: warning: ${basename(CONTACT)} is inside the repo and not gitignored. Keep it outside the repo or in private/.`);
  }
}

function loadPhone() {
  warnIfTrackable();
  if (!existsSync(CONTACT)) {
    die(`${CONTACT_NAME} is missing. Copy tools/contact.example.json there and fill it in.`);
  }
  let data;
  try {
    data = JSON.parse(readFileSync(CONTACT, 'utf8'));
  } catch {
    die(`${CONTACT_NAME} is not valid JSON (content not shown).`);
  }
  const p = data && data.phone;
  const display = p && p.display;
  const digits = typeof display === 'string' ? display.replace(/\D/g, '').length : 0;
  if (typeof display !== 'string' || display.trim().startsWith('<') || digits < 9 || digits > 13) {
    die('phone.display is empty, still a placeholder, or not phone-like (value not shown).');
  }
  if (p.label !== undefined && (typeof p.label !== 'string' || p.label.trim().startsWith('<'))) {
    die('phone.label must be a string and not a placeholder (value not shown).');
  }
  return { label: (p.label || '').trim(), display: display.trim(), dial: display.replace(/[^\d+]/g, '') };
}

// puppeteer's DEBUG protocol logging would echo the injected contact data to stderr
if (/puppeteer/i.test(process.env.DEBUG || '')) {
  die('unset DEBUG before building the PDF (protocol logging would print the contact data).');
}

// drop any previous PDF first so a failed build can never look like a success
mkdirSync(DIST, { recursive: true });
rmSync(OUT, { force: true });
const phone = loadPhone();

let browser;
let server;
let ok = false;
try {
  server = await startStaticServer(ROOT);
  browser = await launchChrome();
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(server.url, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');
  await page.evaluate(async () => {
    document.querySelectorAll('[data-switch],[data-hidden]').forEach((el) => {
      el.removeAttribute('data-switch');
      el.removeAttribute('data-hidden');
    });
    const imgs = [...document.images];
    imgs.forEach((img) => img.removeAttribute('loading'));
    await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
    await document.fonts.ready;
  });
  const injected = await page.evaluate((p) => {
    const slot = document.querySelector('[data-slot="phone"]');
    if (!slot) return false;
    slot.replaceChildren();
    if (p.label) {
      const lab = document.createElement('span');
      lab.className = 'contact-phone-label';
      lab.textContent = p.label;
      slot.append(lab, ' ');
    }
    const a = document.createElement('a');
    a.href = `tel:${p.dial}`;
    a.textContent = p.display;
    slot.append(a);
    slot.hidden = false;
    return true;
  }, phone);
  if (!injected) throw new Error('data-slot="phone" not found in index.html');
  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
    waitForFonts: true,
    displayHeaderFooter: false,
  });
  writeFileSync(OUT, pdf);
  console.log('phone injected: yes');
  ok = true;
} catch (err) {
  console.error(`build-pdf: failed (${redact(err && err.message ? err.message : err)})`);
} finally {
  await closeBrowser(browser);
  if (server) await server.close();
}

if (!ok) {
  rmSync(OUT, { force: true });
  process.exitCode = 1;
} else {
  const r = spawnSync(process.execPath, ['tools/pdf-report.mjs', OUT, '--text', '--expect-phone', '--min-page-chars', '80', '--page-plan'], { stdio: 'inherit', cwd: ROOT });
  process.exitCode = r.status ?? 1;
  if (process.exitCode !== 0) {
    // a PDF that failed verification must not sit at the submission filename
    rmSync(OUT, { force: true });
    console.error('build-pdf: verification failed, output PDF removed.');
  }
}
