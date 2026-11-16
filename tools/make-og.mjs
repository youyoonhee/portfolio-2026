// Renders img/og-card.png (1200x630) from tools/og-card.html in headless Chrome, and the two favicon PNGs from favicon.svg.
// Usage: npm run og
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OG_MAX = 150000;

function die(msg) {
  console.error(`make-og: ${msg}`);
  process.exit(1);
}

const server = await startStaticServer(ROOT);
let browser;
try {
  browser = await launchChrome();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(new URL('tools/og-card.html', server.url).href, { waitUntil: 'networkidle0' });
  const fonts = ['600 160px "Pretendard Print"', '400 48px "Pretendard Print"', '600 32px "Pretendard Print"'];
  const ok = await page.evaluate(async (list) => {
    for (const f of list) await document.fonts.load(f);
    await document.fonts.ready;
    return list.every((f) => document.fonts.check(f));
  }, fonts);
  if (!ok) die('Pretendard Print did not load; nothing written');
  const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  const png = await sharp(shot).png({ palette: true, quality: 90, effort: 10 }).toBuffer();
  const meta = await sharp(png).metadata();
  if (meta.width !== 1200 || meta.height !== 630) die(`unexpected size ${meta.width}x${meta.height}`);
  if (png.length >= OG_MAX) die(`og-card is ${png.length} bytes, limit ${OG_MAX}`);
  mkdirSync(join(ROOT, 'img'), { recursive: true });
  writeFileSync(join(ROOT, 'img', 'og-card.png'), png);
  console.log(`og: img/og-card.png ${png.length} bytes 1200x630`);

  const svg = readFileSync(join(ROOT, 'favicon.svg'), 'utf8');
  const f32 = await sharp(Buffer.from(svg), { density: 384 }).resize(32, 32).png().toBuffer();
  writeFileSync(join(ROOT, 'favicon-32.png'), f32);
  console.log(`og: favicon-32.png ${f32.length} bytes 32x32`);

  const square = svg.replace(' rx="14"', '');
  const apple = await sharp(Buffer.from(square), { density: 384 })
    .resize(180, 180)
    .flatten({ background: '#0a7a3d' })
    .removeAlpha()
    .png()
    .toBuffer();
  const am = await sharp(apple).metadata();
  if (am.width !== 180 || am.height !== 180 || am.channels !== 3 || am.hasAlpha) die('apple-touch-icon must be 180x180 without alpha');
  writeFileSync(join(ROOT, 'apple-touch-icon.png'), apple);
  console.log(`og: apple-touch-icon.png ${apple.length} bytes 180x180`);
} finally {
  await closeBrowser(browser);
  await server.close();
}
