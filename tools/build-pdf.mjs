// Submission PDF builder: renders the same index.html + print CSS with installed Chrome.
// The phone number comes from the gitignored private/contact.json and is injected into the page DOM
// at build time only. It is never logged: every message that leaves this process goes through redact().
// Screenshots go in as JPEG (DCT passthrough, small). If the PDF is over SOFT bytes the JPEG quality is
// lowered, then the width (D-14). At HARD bytes or more the build fails and the file is removed.
// usage: npm run pdf
// env (tests and tooling): PDF_SITE_ROOT, PDF_OUT, PDF_CONTACT_FILE, PDF_SOFT_BYTES, PDF_HARD_BYTES, PDF_MAX_PAGES
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';
import { PRINT_MAX } from './lib/shot-markup.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = process.env.PDF_SITE_ROOT ? resolve(process.env.PDF_SITE_ROOT) : ROOT;
const OUT = process.env.PDF_OUT ? resolve(process.env.PDF_OUT) : join(DIST, '퍼블리셔 유윤희-포트폴리오.pdf');
const CONTACT = process.env.PDF_CONTACT_FILE ? resolve(process.env.PDF_CONTACT_FILE) : join(ROOT, 'private', 'contact.json');

const SOFT = Number(process.env.PDF_SOFT_BYTES || 5000000); // upload target (decimal MB)
const HARD = Number(process.env.PDF_HARD_BYTES || 10000000); // at or above this the build fails
// measured: 13 synthetic images, 04-05 (node tools/check-shots-pdf.mjs --measure)
const DEFAULT_MAX_PAGES = 8;
const MAX_PAGES = process.env.PDF_MAX_PAGES === undefined ? DEFAULT_MAX_PAGES : Number(process.env.PDF_MAX_PAGES);
// D-14: lower the quality first, then the width. quality null keeps the published JPEG files as they are.
const STEPS = [
  { web: PRINT_MAX.web, app: PRINT_MAX.app, quality: null },
  { web: PRINT_MAX.web, app: PRINT_MAX.app, quality: 70 },
  { web: 480, app: 540, quality: 70 },
];

const CONTACT_NAME = process.env.PDF_CONTACT_FILE ? `${basename(CONTACT)} (PDF_CONTACT_FILE)` : 'private/contact.json';
const redact = (s) => String(s).replace(/[0-9]/g, '#');
function die(msg) {
  console.error(`build-pdf: ${redact(msg)}`);
  process.exit(1);
}

// Case-insensitive on Windows, where the filesystem is.
const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
function inside(root, target) {
  const rel = relative(norm(root), norm(target));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
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

// DEBUG / NODE_DEBUG logging (puppeteer's `debug` namespaces, wildcards like DEBUG=*, node internals) could echo
// the injected contact data to stderr, so any non-empty value is refused, not only ones that name puppeteer
if (['DEBUG', 'NODE_DEBUG'].some((k) => (process.env[k] || '').trim() !== '')) {
  die('unset DEBUG and NODE_DEBUG before building the PDF (protocol logging would print the contact data).');
}
// a PDF with a phone number must never land in the public tree (only gitignored dist/ is allowed there)
if (inside(ROOT, OUT) && !inside(DIST, OUT)) die('PDF_OUT must be outside the repo or inside dist/.');
if (!Number.isInteger(MAX_PAGES) || MAX_PAGES <= 0) die('PDF_MAX_PAGES must be a positive integer.');
if (!existsSync(join(SITE, 'index.html'))) die('PDF_SITE_ROOT has no index.html.');

// drop any previous PDF first so a failed build can never look like a success
mkdirSync(dirname(OUT), { recursive: true });
rmSync(OUT, { force: true });
const phone = loadPhone();

// Node side: read the picked JPEG from the site, cut it to the frame ratio (top part for long screens, as the
// web does with object-position: top) and re-encode only when needed. sharp output carries no metadata.
const JPEG_BASE_QUALITY = 82; // same as tools/optimise-images.mjs
async function jpegForFrame(pick, quality, baseUrl) {
  const pathname = decodeURIComponent(new URL(pick.url, baseUrl).pathname);
  const file = resolve(SITE, ...pathname.split('/').filter(Boolean));
  if (!inside(SITE, file)) throw new Error('image path outside the site');
  const buf = readFileSync(file);
  const meta = await sharp(buf).metadata();
  const want = pick.ratio > 0 ? pick.ratio : meta.height / meta.width; // frame height / width
  let region = null;
  if (meta.height / meta.width > want * 1.002) region = { left: 0, top: 0, width: meta.width, height: Math.max(1, Math.round(meta.width * want)) };
  else if (meta.height / meta.width < want / 1.002) {
    const width = Math.max(1, Math.round(meta.height / want));
    region = { left: Math.round((meta.width - width) / 2), top: 0, width, height: meta.height };
  }
  let out = buf;
  if (region || quality) {
    let img = sharp(buf);
    if (region) img = img.extract(region);
    out = await img.jpeg({ quality: quality || JPEG_BASE_QUALITY, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  }
  return { index: pick.index, uri: `data:image/jpeg;base64,${out.toString('base64')}` };
}

// runs in the page: pick one JPEG candidate per screenshot, drop webp sources, no local link targets
async function pickImages(limits) {
  document.querySelectorAll('[data-switch],[data-hidden]').forEach((el) => {
    el.removeAttribute('data-switch');
    el.removeAttribute('data-hidden');
  });
  const shotImgs = [...document.querySelectorAll('.shot img')];
  for (const [i, img] of shotImgs.entries()) {
    const limit = limits[img.closest('.shot').dataset.frame] || limits.web;
    const cands = (img.getAttribute('srcset') || '')
      .split(',')
      .map((c) => c.trim().split(/\s+/))
      .filter((c) => c[0] && /^\d+w$/.test(c[1] || ''))
      .map((c) => ({ url: c[0], w: parseInt(c[1], 10) }))
      .sort((x, y) => x.w - y.w);
    const fit = cands.filter((c) => c.w <= limit);
    const pick = fit.length ? fit[fit.length - 1] : cands[0];
    img.closest('picture')?.querySelectorAll('source').forEach((s) => s.remove()); // picture > source
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.removeAttribute('loading');
    if (pick) img.setAttribute('src', pick.url);
    img.dataset.pdfIndex = String(i);
  }
  // the zoom link targets a local URL; without href no link annotation reaches the PDF
  document.querySelectorAll('a.shot-link').forEach((a) => a.removeAttribute('href'));
  const imgs = [...document.images];
  imgs.forEach((img) => img.removeAttribute('loading'));
  await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
  return shotImgs.map((img, index) => {
    const r = img.getBoundingClientRect();
    return { index, url: img.getAttribute('src'), ratio: r.width > 0 ? r.height / r.width : 0 };
  });
}

// runs in the page: swap in the frame-fitted JPEG and wait for the decode (Pitfall 4: decode after the src change)
async function applyImages(sources) {
  const shotImgs = [...document.querySelectorAll('.shot img')];
  for (const s of sources) {
    const img = shotImgs[s.index];
    img.style.objectFit = 'fill'; // the file already has the frame ratio
    img.setAttribute('src', s.uri);
  }
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  await document.fonts.ready;
  // a decode failure is swallowed above on purpose (one bad image must not hang the page); count them here instead
  return shotImgs.filter((img) => img.naturalWidth === 0).length;
}

async function renderStep(browser, server, step) {
  const page = await browser.newPage();
  try {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(server.url, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const picks = await page.evaluate(pickImages, { web: step.web, app: step.app });
    // Skia only passes a JPEG through (DCTDecode) when it is drawn whole. A CSS-cropped image (object-fit: cover on a
    // long screen) would be re-encoded as Flate and blow up the size, so the crop is done here and the frame ratio fits.
    const sources = [];
    for (const p of picks) sources.push(await jpegForFrame(p, step.quality, server.url));
    const broken = await page.evaluate(applyImages, sources);
    if (broken > 0) throw new Error(`${broken} screenshot image(s) failed to decode`);
    // Skia stores identical images once, so the PDF holds one image per distinct JPEG, not one per card
    const shots = new Set(sources.map((s) => s.uri)).size;
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
    return { pdf, shots };
  } finally {
    await page.close();
  }
}

let browser;
let server;
let ok = false;
let imageCount = 0;
try {
  server = await startStaticServer(SITE);
  browser = await launchChrome();
  let kept = null;
  for (let k = 0; k < STEPS.length; k++) {
    const step = STEPS[k];
    kept = await renderStep(browser, server, step);
    console.log(`pdf step ${k + 1}: web ${step.web} app ${step.app} quality ${step.quality ?? 'source'}, ${kept.pdf.length} bytes`);
    if (kept.pdf.length <= SOFT) break;
  }
  if (kept.pdf.length >= HARD) {
    console.error('build-pdf: PDF is over the hard limit');
    throw new Error('hard size limit exceeded');
  }
  writeFileSync(OUT, kept.pdf);
  imageCount = kept.shots;
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
  const r = spawnSync(
    process.execPath,
    [
      'tools/pdf-report.mjs', OUT, '--text', '--expect-phone', '--min-page-chars', '80', '--page-plan',
      '--max-bytes', String(SOFT), '--hard-bytes', String(HARD), '--expect-images', String(imageCount), '--max-pages', String(MAX_PAGES),
    ],
    { stdio: 'inherit', cwd: ROOT }
  );
  process.exitCode = r.status ?? 1;
  if (process.exitCode !== 0) {
    // a PDF that failed verification must not sit at the submission filename
    rmSync(OUT, { force: true });
    console.error('build-pdf: verification failed, output PDF removed.');
  }
}
