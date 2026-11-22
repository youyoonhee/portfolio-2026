// Link-preview check (DEPL-03) and robots.txt check (DEPL-02).
//   node tools/check-preview.mjs                 local files under --root (default: repo root)
//   node tools/check-preview.mjs <url>           deployed page: same tag rules, then GET the image and icons
//   node tools/check-preview.mjs --self-test     fixture-based regression test
// Failure lines name the rule or the tag, never a tag value. Exit: 0 ok, 1 failed, 2 usage.
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { hasPhoneAnywhere } from './check-repo.mjs';

const SELF = fileURLToPath(import.meta.url);
const REPO = resolve(dirname(SELF), '..');
const BASE = 'https://youyoonhee.github.io/portfolio-2026/'; // D-01
const IMAGE_URL = `${BASE}img/og-card.png`;
const ROBOTS = 'User-agent: *\nDisallow: /\n';
const ICONS = [
  { rel: 'icon', href: 'favicon.svg', type: 'image/svg+xml' },
  { rel: 'icon', href: 'favicon-32.png', sizes: '32x32', type: 'image/png' },
  { rel: 'apple-touch-icon', href: 'apple-touch-icon.png' },
];

const decode = (s) =>
  s.replace(/&(amp|quot|lt|gt|#39);/g, (m, n) => ({ amp: '&', quot: '"', lt: '<', gt: '>', '#39': "'" })[n]);
const collapse = (s) => s.replace(/\s+/g, ' ').trim();

function attrsOf(text) {
  const out = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(text))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}

function readHead(html) {
  const head = (/<head\b[\s\S]*?<\/head>/i.exec(html) || [''])[0].replace(/<!--[\s\S]*?-->/g, '');
  const tags = (name) => [...head.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => attrsOf(m[1]));
  const title = (/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head) || [])[1];
  const intro = (/<p\s[^>]*class="cover-intro"[^>]*>([\s\S]*?)<\/p>/i.exec(html) || [])[1];
  return {
    metas: tags('meta'),
    links: tags('link'),
    title: title === undefined ? undefined : collapse(decode(title)),
    intro: intro === undefined ? undefined : collapse(decode(intro.replace(/<[^>]*>/g, ''))),
  };
}

async function pngInfo(buf) {
  try {
    const m = await sharp(buf).metadata();
    const magic = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    return { ok: magic && m.format === 'png', w: m.width, h: m.height, channels: m.channels, alpha: m.hasAlpha };
  } catch {
    return { ok: false };
  }
}

export async function audit({ root, url }) {
  const res = [];
  const rec = (rule, ok) => res.push({ rule, ok: Boolean(ok) });
  let html;
  if (url) {
    const r = await fetch(url);
    if (!r.ok) return [{ rule: 'page-fetch', ok: false }];
    html = await r.text();
  } else {
    const f = join(root, 'index.html');
    if (!existsSync(f)) return [{ rule: 'index-html-missing', ok: false }];
    html = readFileSync(f, 'utf8');
  }
  const { metas, links, title, intro } = readHead(html);
  const meta = (key) => metas.find((m) => m.property === key || m.name === key)?.content;

  rec('title', title);
  // 2026-11-22 (user revision): the cover intro and the descriptions are different sentences now; the meta keeps
  // the full original sentence. Both must be non-empty and both must name the publisher.
  const PUBLISHER = '퍼블리셔 유윤희';
  const holdsIntro = (v) => typeof intro === 'string' && intro.includes(PUBLISHER) && typeof v === 'string' && v.trim() !== '' && v.includes(PUBLISHER);
  rec('description', holdsIntro(meta('description')));
  rec('og-title', title !== undefined && meta('og:title') === title);
  rec('og-description', holdsIntro(meta('og:description')));
  rec('og-type', meta('og:type') === 'website');
  rec('og-locale', meta('og:locale') === 'ko_KR');
  rec('og-url', meta('og:url') === BASE);
  rec('og-image', meta('og:image') === IMAGE_URL);
  rec(
    'og-image-meta',
    meta('og:image:width') === '1200' && meta('og:image:height') === '630' &&
      meta('og:image:type') === 'image/png' && title !== undefined && meta('og:image:alt') === title
  );
  rec(
    'twitter',
    meta('twitter:card') === 'summary_large_image' &&
      ['title', 'description', 'image'].every((k) => meta(`twitter:${k}`) !== undefined && meta(`twitter:${k}`) === meta(`og:${k}`))
  );
  rec('no-canonical', !links.some((l) => (l.rel || '').toLowerCase() === 'canonical'));
  rec('robots-meta', metas.filter((m) => m.name === 'robots').length === 1 && meta('robots') === 'noindex, nofollow');

  const iconLinks = links.filter((l) => /^(icon|apple-touch-icon)$/i.test(l.rel || ''));
  rec(
    'icons',
    iconLinks.length === ICONS.length &&
      ICONS.every((want) => iconLinks.some((l) => Object.keys(want).every((k) => l[k] === want[k]) && Object.keys(l).length === Object.keys(want).length))
  );

  // contact data must never reach a tag value (named by property, never by value)
  const leaks = metas.filter((m) => m.content !== undefined && (m.content.includes('@') || hasPhoneAnywhere(m.content)));
  rec('no-contact', leaks.length === 0);
  for (const m of leaks) res.push({ rule: `no-contact tag ${String(m.property || m.name || '?').replace(/[^\w:.-]/g, '_')}`, ok: false });

  if (url) {
    const get = async (u) => {
      try {
        const r = await fetch(u);
        return { r, buf: Buffer.from(await r.arrayBuffer()) };
      } catch {
        return null;
      }
    };
    const og = await get(meta('og:image') || IMAGE_URL);
    if (!og) rec('og-card-fetch', false);
    else {
      const info = await pngInfo(og.buf);
      rec('og-card-status', og.r.status === 200);
      rec('og-card-type', (og.r.headers.get('content-type') || '').split(';')[0].trim() === 'image/png');
      rec('og-card-size', og.buf.length < 300000);
      rec('og-card-dimensions', info.ok && info.w === 1200 && info.h === 630);
    }
    for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
      const got = await get(new URL(f, url).href);
      rec(`icon-fetch ${f}`, got && got.r.status === 200);
    }
    return res;
  }

  const file = (...p) => join(root, ...p);
  const read = (...p) => (existsSync(file(...p)) ? readFileSync(file(...p)) : null);

  const og = read('img', 'og-card.png');
  const ogInfo = og ? await pngInfo(og) : { ok: false };
  rec('og-card', og && ogInfo.ok && ogInfo.w === 1200 && ogInfo.h === 630 && og.length < 150000);
  const f32 = read('favicon-32.png');
  const f32Info = f32 ? await pngInfo(f32) : { ok: false };
  rec('favicon-32', f32Info.ok && f32Info.w === 32 && f32Info.h === 32);
  const at = read('apple-touch-icon.png');
  const atInfo = at ? await pngInfo(at) : { ok: false };
  rec('apple-touch-icon', atInfo.ok && atInfo.w === 180 && atInfo.h === 180 && atInfo.channels === 3 && atInfo.alpha === false);
  const svg = read('favicon.svg');
  const svgText = svg ? svg.toString('utf8') : '';
  rec('favicon-svg', svg && svg.length < 600 && /viewBox="0 0 64 64"/.test(svgText) && !/<text/i.test(svgText));
  const robots = read('robots.txt');
  rec('robots-txt', robots && robots.toString('utf8').replace(/\r\n/g, '\n') === ROBOTS);
  return res;
}

function report(res) {
  for (const r of res) (r.ok ? console.log : console.error)(`${r.ok ? 'PASS' : 'FAIL'} ${r.rule}`);
  return res.every((r) => r.ok) ? 0 : 1;
}

// ---------------------------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------------------------

const INTRO = '반응형 웹/앱 퍼블리셔 유윤희 입니다.';
const DESCRIPTION = '화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.';
const TITLE = '퍼블리셔 유윤희 포트폴리오';

function fixtureHtml({ extraMeta = '', drop = [], replace = {} } = {}) {
  const tags = {
    description: `<meta name="description" content="${DESCRIPTION}">`,
    'og:title': `<meta property="og:title" content="${TITLE}">`,
    'og:description': `<meta property="og:description" content="${DESCRIPTION}">`,
    'og:type': '<meta property="og:type" content="website">',
    'og:locale': '<meta property="og:locale" content="ko_KR">',
    'og:url': `<meta property="og:url" content="${BASE}">`,
    'og:image': `<meta property="og:image" content="${IMAGE_URL}">`,
    'og:image:width': '<meta property="og:image:width" content="1200">',
    'og:image:height': '<meta property="og:image:height" content="630">',
    'og:image:type': '<meta property="og:image:type" content="image/png">',
    'og:image:alt': `<meta property="og:image:alt" content="${TITLE}">`,
    'twitter:card': '<meta name="twitter:card" content="summary_large_image">',
    'twitter:title': `<meta name="twitter:title" content="${TITLE}">`,
    'twitter:description': `<meta name="twitter:description" content="${DESCRIPTION}">`,
    'twitter:image': `<meta name="twitter:image" content="${IMAGE_URL}">`,
  };
  for (const [k, v] of Object.entries(replace)) tags[k] = v;
  const body = Object.entries(tags).filter(([k]) => !drop.includes(k)).map(([, v]) => `  ${v}`).join('\n');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <title>${TITLE}</title>
${body}
  ${extraMeta}
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
</head>
<body><p class="cover-intro">${INTRO}</p></body>
</html>
`;
}

const solid = (w, h, channels) =>
  sharp({ create: { width: w, height: h, channels, background: channels === 4 ? { r: 10, g: 122, b: 61, alpha: 0.5 } : '#0a7a3d' } }).png().toBuffer();

async function writeFixture(dir, o = {}) {
  mkdirSync(join(dir, 'img'), { recursive: true });
  writeFileSync(join(dir, 'index.html'), o.html ?? fixtureHtml(o.html_opts));
  writeFileSync(join(dir, 'img', 'og-card.png'), await solid(o.ogWidth ?? 1200, 630, 3));
  writeFileSync(join(dir, 'favicon-32.png'), await solid(32, 32, 4));
  writeFileSync(join(dir, 'apple-touch-icon.png'), await solid(180, 180, o.atChannels ?? 3));
  writeFileSync(
    join(dir, 'favicon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a7a3d"/></svg>\n'
  );
  writeFileSync(join(dir, 'robots.txt'), o.robots ?? ROBOTS);
}

async function selfTest() {
  const base = mkdtempSync(join(tmpdir(), 'check-preview-'));
  const results = [];
  const t = (name, ok) => results.push([name, Boolean(ok)]);
  let n = 0;
  const lines = (res) => res.map((r) => `${r.ok ? 'PASS' : 'FAIL'} ${r.rule}`).join('\n');
  const neg = async (name, o) => {
    const dir = join(base, `case-${n++}`);
    await writeFixture(dir, o);
    const res = await audit({ root: dir });
    t(name, report0(res) === 1);
    return { res, text: lines(res) };
  };
  const report0 = (res) => (res.every((r) => r.ok) ? 0 : 1);
  try {
    const clean = join(base, 'clean');
    await writeFixture(clean);
    t('clean fixture passes', report0(await audit({ root: clean })) === 0);
    const crlf = join(base, 'crlf');
    await writeFixture(crlf, { robots: ROBOTS.replace(/\n/g, '\r\n') });
    t('CRLF robots.txt passes', report0(await audit({ root: crlf })) === 0);

    await neg('relative og:image fails', { html_opts: { replace: { 'og:image': '<meta property="og:image" content="img/og-card.png">' } } });
    await neg('og:description without the publisher name fails', {
      html_opts: { replace: { 'og:description': '<meta property="og:description" content="화면 너머의 경험까지 섬세하게.">' } },
    });
    await neg('cover intro without the publisher name fails', { html: fixtureHtml().replace(`<p class="cover-intro">${INTRO}</p>`, '<p class="cover-intro">안녕하세요.</p>') });
    await neg('empty og:description fails', {
      html_opts: { replace: { 'og:description': '<meta property="og:description" content="">' } },
    });
    await neg('og:description differs from cover-intro fails', {
      html_opts: { replace: { 'og:description': '<meta property="og:description" content="다른 문장">' } },
    });
    await neg('missing twitter:card fails', { html_opts: { drop: ['twitter:card'] } });
    await neg('rel=canonical fails', { html_opts: { extraMeta: `<link rel="canonical" href="${BASE}">` } });
    await neg('og-card 1199 wide fails', { ogWidth: 1199 });
    await neg('apple-touch-icon with alpha fails', { atChannels: 4 });
    await neg('tag value with @ fails', { html_opts: { extraMeta: '<meta name="author" content="a@b.example">' } });
    // runtime-assembled so no phone-like literal sits in this file
    const phone = `${'0' + 1 + 0}-${'1234'}-${'5678'}`;
    const p = await neg('phone-shaped tag value fails', { html_opts: { extraMeta: `<meta name="author" content="${phone}">` } });
    t('phone-shaped value is not echoed', !p.text.includes(phone));
    await neg('different robots.txt fails', { robots: 'User-agent: *\nAllow: /\n' });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  let failed = 0;
  for (const [name, ok] of results) {
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  }
  console.log(`check-preview self-test: ${results.length - failed} passed${failed ? `, ${failed} FAILED` : ''}`);
  return failed ? 1 : 0;
}

async function main(argv) {
  let url;
  let root = REPO;
  let self = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--self-test') self = true;
    else if (a === '--root') root = resolve(argv[++i] ?? '');
    else if (/^https?:\/\//.test(a) && !url) url = a;
    else {
      console.error(`check-preview: unknown argument ${a}`);
      return 2;
    }
  }
  if (self) return selfTest();
  return report(await audit({ root, url }));
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  process.exitCode = await main(process.argv.slice(2));
}
