// UI behaviour checks (menu, header hide/show, keyboard, focus ring, current section, no-JS).
// Heavy (needs Chrome), so it is NOT part of `npm run check` or the git hooks. Run: npm run check:ui
// Usage: node tools/check-ui.mjs [--only menu|header|skip|focus-ring|spy|nojs|cover|keywords|keyword-focus|keyword-media|cover-orbs|reduced|nojs-all|print-state|shot-frame|shot-nojs|shot-dialog|shot-reduced|shot-fallback]
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { ladder, figureMarkup, readArticle, replaceFigure, articleIds, emptyFigure, emptyFigureLike } from './lib/shot-markup.mjs';
import { makeUiImage } from './lib/shot-fixtures.mjs';
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;
const ACCENT = 'rgb(10, 122, 61)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function report(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`);
}

const scrollToY = async (page, y) => {
  await page.evaluate(async (top) => {
    window.scrollTo({ top, behavior: 'instant' });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  await sleep(50);
};
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  return { tag: a.tagName.toLowerCase(), id: a.id, cls: a.className, href: a.getAttribute('href') || '' };
});
const tab = async (page, n = 1) => { for (let i = 0; i < n; i++) await page.keyboard.press('Tab'); };
const shiftTab = async (page) => {
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
};
const headerH = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')));
const attr = (page, sel, name) => page.evaluate((s, n) => document.querySelector(s)?.getAttribute(n) ?? null, sel, name);
const css = (page, sel, prop, pseudo) => page.evaluate((s, p, ps) => getComputedStyle(document.querySelector(s), ps || null)[p], sel, prop, pseudo);

// Screenshot fixture: synthetic figures for one web and one app card, served by request
// interception only. Nothing is written to the repo (index.html and img/ stay untouched).
let shotFixture = null;
async function buildShotFixture() {
  if (shotFixture) return shotFixture;
  const specs = [['gi-calculator', 'web', 1920, 4800], ['gi-oneday', 'app', 1080, 1920]];
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  // empty every real frame first so the fixture page always has exactly 2 filled and the rest empty
  for (const id of articleIds(html)) html = replaceFigure(html, id, emptyFigureLike(readArticle(html, id)));
  const assets = new Map();
  for (const [id, frame, width, height] of specs) {
    const src = await makeUiImage({ width, height, label: id, format: 'png' });
    const files = [];
    for (const w of ladder(frame, width)) {
      const h = Math.round((w * height) / width);
      const base = sharp(src).resize(w, h);
      assets.set(`/img/projects/__fixture__/${id}/${id}-${w}.jpg`, { body: await base.clone().jpeg({ quality: 70 }).toBuffer(), contentType: 'image/jpeg' });
      assets.set(`/img/projects/__fixture__/${id}/${id}-${w}.webp`, { body: await base.clone().webp({ quality: 70 }).toBuffer(), contentType: 'image/webp' });
      files.push({ w, h });
    }
    const { title } = readArticle(html, id);
    html = replaceFigure(html, id, figureMarkup({ id, frame, title, alt: '합성 테스트 화면', files, base: `img/projects/__fixture__/${id}/` }));
  }
  shotFixture = { html, assets };
  return shotFixture;
}

async function newPage(browser, url, vw, vh, opts = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  if (opts.shots) {
    const fx = await buildShotFixture();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const path = new URL(req.url()).pathname;
      if (req.resourceType() === 'document' && (path === '/' || path === '/index.html')) {
        req.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: fx.html });
      } else if (fx.assets.has(path)) {
        req.respond({ status: 200, ...fx.assets.get(path) });
      } else {
        req.continue();
      }
    });
  }
  if (opts.noJs) await page.setJavaScriptEnabled(false);
  if (opts.reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: vw, height: vh });
  await page.goto(url, { waitUntil: 'load' });
  await sleep(150);
  return { page, ctx };
}

async function scenario(name, browser, url, fn) {
  if (ONLY && ONLY !== name) return;
  try {
    await fn(browser, url);
  } catch (err) {
    report(`${name} (scenario error)`, false, String(err && err.message).slice(0, 160));
  }
}

async function withPage(browser, url, vw, vh, opts, fn) {
  const { page, ctx } = await newPage(browser, url, vw, vh, opts);
  try { await fn(page); } finally { await ctx.close().catch(() => {}); }
}

const server = await startStaticServer(ROOT);
let browser;
try {
  browser = await launchChrome();
  const url = server.url.endsWith('/') ? server.url : server.url + '/';

  await scenario('menu', browser, url, () => withPage(browser, url, 375, 812, {}, async (page) => {
    const P = 'menu';
    const expanded = () => attr(page, '.nav-toggle', 'aria-expanded');
    const isOpenAttrs = () => page.evaluate(() => ({
      nav: document.querySelector('.site-nav')?.dataset.open || '',
      ov: document.querySelector('.nav-overlay')?.dataset.open || '',
    }));
    report(`${P} 1 closed state`, (await expanded()) === 'false'
      && (await css(page, '.site-nav', 'visibility')) === 'hidden'
      && (await page.$$('.nav-overlay')).length === 1
      && (await attr(page, '.nav-overlay', 'aria-hidden')) === 'true');

    await tab(page);
    const a1 = await active(page);
    await tab(page);
    const a2 = await active(page);
    await tab(page);
    const a3 = await active(page);
    report(`${P} 2 tab order`, a1.cls.includes('skip-link') && a2.cls.includes('nav-toggle') && a3.href.startsWith('mailto:'), `${a1.cls}|${a2.cls}|${a3.tag}`);

    await page.focus('.nav-toggle');
    await page.keyboard.press('Enter');
    await sleep(350);
    let o = await isOpenAttrs();
    let act = await active(page);
    report(`${P} 3 Enter opens`, (await expanded()) === 'true' && o.nav === 'true' && o.ov === 'true' && act.cls.includes('nav-toggle'));
    const order = [];
    for (let i = 0; i < 4; i++) { await tab(page); order.push((await active(page)).href); }
    report(`${P} 3 tab order inside`, order.join() === '#keywords,#skills,#career,#contact', order.join());
    await page.focus('.site-nav a[href="#keywords"]');
    await shiftTab(page);
    report(`${P} 3 shift+tab to toggle`, (await active(page)).cls.includes('nav-toggle'));

    await page.focus('.nav-toggle');
    const bars = await page.evaluate(() => ({
      op: getComputedStyle(document.querySelector('.nav-bars')).opacity,
      tf: getComputedStyle(document.querySelector('.nav-toggle'), '::before').transform,
    }));
    report(`${P} 4 X icon when open`, bars.op === '0' && bars.tf !== 'none', `${bars.op} ${bars.tf}`);

    await page.keyboard.press('Escape');
    await sleep(350);
    const barsClosed = await css(page, '.nav-toggle', 'transform', '::before');
    report(`${P} 5 Esc closes, focus on toggle`, (await expanded()) === 'false' && (await active(page)).cls.includes('nav-toggle'));
    report(`${P} 4b closed icon has no transform`, barsClosed === 'none', barsClosed);

    await page.keyboard.press('Space');
    await sleep(350);
    const spaceOpen = (await expanded()) === 'true';
    await page.keyboard.press('Space');
    await sleep(350);
    report(`${P} 6 Space toggles`, spaceOpen && (await expanded()) === 'false');

    await page.focus('.nav-toggle');
    await page.keyboard.press('Enter');
    await sleep(350);
    await page.mouse.click(20, 700);
    await sleep(350);
    report(`${P} 7 overlay click closes`, (await expanded()) === 'false');

    await page.focus('.nav-toggle');
    await page.keyboard.press('Enter');
    await sleep(350);
    await page.click('.site-nav a[href="#career"]');
    await sleep(900);
    const nav = await page.evaluate(() => ({
      top: document.querySelector('#career').getBoundingClientRect().top,
      hd: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')),
    }));
    const delta = nav.top - nav.hd;
    report(`${P} 8 link click closes and navigates`, (await expanded()) === 'false' && delta >= -0.5 && delta <= 32.5, `delta ${delta.toFixed(1)}`);

    await scrollToY(page, 0);
    await page.focus('.nav-toggle');
    await page.keyboard.press('Enter');
    await sleep(350);
    await page.focus('.site-nav a[href="#contact"]');
    await tab(page);
    await sleep(350);
    report(`${P} 9 tab out closes`, (await expanded()) === 'false' && !(await active(page)).cls.includes('nav-toggle'));

    await scrollToY(page, 0);
    await page.focus('.nav-toggle');
    await page.keyboard.press('Enter');
    await sleep(350);
    await page.setViewport({ width: 1024, height: 812 });
    await sleep(350);
    o = await isOpenAttrs();
    report(`${P} 10 widening closes`, (await expanded()) === 'false' && o.nav === '' && o.ov === '');
  }));

  await scenario('header', browser, url, async () => {
    for (const [vw, vh, firstSel] of [[1440, 900, '.site-nav a[href="#keywords"]'], [375, 812, '.nav-toggle']]) {
      const P = `header ${vw}`;
      await withPage(browser, url, vw, vh, {}, async (page) => {
        const hidden = () => attr(page, '.site-header', 'data-hidden');
        const bottom = () => page.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().bottom);
        await scrollToY(page, 60);
        report(`${P} 3 no hide near top`, (await hidden()) === null);
        await scrollToY(page, 300);
        await sleep(300);
        report(`${P} 1 hides on scroll down`, (await hidden()) === 'true' && (await bottom()) <= 0);
        await scrollToY(page, 295);
        report(`${P} 2a small up keeps hidden`, (await hidden()) === 'true');
        await scrollToY(page, 275);
        report(`${P} 2b up reveals`, (await hidden()) === null);
        await scrollToY(page, 600);
        await sleep(300);
        const wasHidden = (await hidden()) === 'true';
        await page.focus(firstSel);
        await sleep(350);
        const hh = await headerH(page);
        const b = await bottom();
        report(`${P} 4 focus reveals`, wasHidden && (await hidden()) === null && Math.abs(b - hh) <= 1, `bottom ${b.toFixed(1)} vs ${hh}`);
      });
    }
    await withPage(browser, url, 375, 812, {}, async (page) => {
      await scrollToY(page, 0);
      await page.focus('.nav-toggle');
      await page.keyboard.press('Enter');
      await sleep(350);
      await scrollToY(page, 360);
      await sleep(300);
      report('header 5 open menu keeps header', (await attr(page, '.site-header', 'data-hidden')) === null);
    });
    await withPage(browser, url, 1440, 900, { reduce: true }, async (page) => {
      await scrollToY(page, 300);
      await sleep(300);
      report('header 6 reduced-motion never hides', (await attr(page, '.site-header', 'data-hidden')) === null);
    });
  });

  await scenario('skip', browser, url, () => withPage(browser, url, 1440, 900, {}, async (page) => {
    await tab(page);
    const a = await active(page);
    const r = await page.evaluate(() => { const b = document.activeElement.getBoundingClientRect(); return { t: b.top, l: b.left, w: b.width, h: b.height }; });
    report('skip 1 first tab is skip link, on screen', a.cls.includes('skip-link') && r.t >= 0 && r.l >= 0 && r.w > 0 && r.h > 0);
    await page.keyboard.press('Enter');
    await sleep(300);
    const m = await active(page);
    report('skip 2 Enter focuses main', m.tag === 'main' && m.id === 'main');
    await tab(page);
    const n = await active(page);
    report('skip 3 next tab is first link in main', n.href.startsWith('mailto:'), n.tag);
  }));

  await scenario('focus-ring', browser, url, async () => {
    for (const [vw, vh, ringSel] of [[375, 812, '.nav-toggle'], [1440, 900, '.site-nav a[href="#keywords"]']]) {
      await withPage(browser, url, vw, vh, {}, async (page) => {
        const targets = ['.skip-link', ringSel, '.cover-mail a'];
        for (const sel of targets) {
          await page.focus(sel);
          // page.focus is not keyboard modality; prime it with a key press on a neutral step
          await page.keyboard.press('Shift');
          const s = await page.evaluate((q) => { const c = getComputedStyle(document.querySelector(q)); return { st: c.outlineStyle, w: c.outlineWidth, c: c.outlineColor, vis: document.querySelector(q).matches(':focus-visible') }; }, sel);
          report(`focus-ring ${vw} ${sel}`, s.st === 'solid' && s.w === '2px' && s.c === ACCENT, `${s.st} ${s.w} ${s.c} fv=${s.vis}`);
        }
      });
    }
  });

  await scenario('spy', browser, url, () => withPage(browser, url, 1440, 900, {}, async (page) => {
    const cur = () => page.evaluate(() => [...document.querySelectorAll('.site-nav a[aria-current="true"]')].map((a) => a.getAttribute('href')));
    const goTo = async (sel) => {
      const y = await page.evaluate((s) => Math.max(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 100), sel);
      await scrollToY(page, y);
      await sleep(300);
    };
    await goTo('#skills');
    report('spy skills', (await cur()).join() === '#skills', (await cur()).join());
    await goTo('#bistones');
    report('spy company maps to career', (await cur()).join() === '#career', (await cur()).join());
    await scrollToY(page, 0);
    await sleep(300);
    report('spy none at top', (await cur()).length === 0);
    await goTo('#colophon');
    report('spy colophon clears', (await cur()).length === 0, (await cur()).join());
  }));

  await scenario('colophon', browser, url, () => withPage(browser, url, 375, 812, {}, async (page) => {
    const r = await page.evaluate(() => ({
      h: document.querySelector('body > footer a[href="#colophon"]')?.getBoundingClientRect().height ?? 0,
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));
    report('colophon footer link height', r.h >= 44, String(r.h));
    report('colophon no horizontal overflow', r.sw <= r.iw, `${r.sw}/${r.iw}`);
  }));

  await scenario('nojs', browser, url, async () => {
    for (const [vw, vh, exp] of [[375, 812, 112], [1440, 900, 72]]) {
      await withPage(browser, url, vw, vh, { noJs: true }, async (page) => {
        const P = `nojs ${vw}`;
        const st = await page.evaluate(() => ({
          js: document.documentElement.classList.contains('js'),
          td: getComputedStyle(document.querySelector('.nav-toggle')).display,
          nv: getComputedStyle(document.querySelector('.site-nav')).visibility,
          dim: [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).opacity !== '1').length,
        }));
        const hh = await headerH(page);
        report(`${P} html has no js class`, !st.js);
        report(`${P} toggle hidden, nav visible`, st.td === 'none' && st.nv === 'visible');
        report(`${P} header height ${exp}`, hh === exp, String(hh));
        report(`${P} no element below full opacity`, st.dim === 0, String(st.dim));
      });
    }
  });

  /* ---- Plan 03-04: cover entrance, keyword switch, fallback states ---- */
  const cs = (page, sel, prop) => page.evaluate((s, p) => getComputedStyle(document.querySelector(s))[p], sel, prop);
  // the JS-created .nav-overlay is a closed dim layer, not content
const dimCount = (page) => page.evaluate(() => [...document.querySelectorAll('body *:not(.nav-overlay)')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  const kwState = (page) => page.evaluate(() => {
    const kw = document.querySelector('#keywords');
    return {
      sw: kw.dataset.switch || '',
      act: kw.dataset.active ?? '',
      st: [...kw.querySelectorAll('.keyword-block')].map((b) => b.dataset.state || ''),
      op: [...kw.querySelectorAll('.keyword-block')].map((b) => [getComputedStyle(b.querySelector('.keyword-title')).opacity, getComputedStyle(b.querySelector('.keyword-list')).opacity]),
    };
  });
  const trackInfo = (page) => page.evaluate(() => {
    const kw = document.querySelector('#keywords');
    const stage = kw.querySelector('.keywords-stage');
    const top = kw.getBoundingClientRect().top + scrollY;
    return { top, h: kw.offsetHeight, stageH: stage ? stage.offsetHeight : 0, vh: innerHeight };
  });

  await scenario('cover', browser, url, async () => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    try {
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const first = await page.evaluate(() => {
        const l = document.querySelectorAll('.cover-line');
        return { n: l.length, op3: l.length === 3 ? parseFloat(getComputedStyle(l[2]).opacity) : 1 };
      });
      report('cover 1 three lines, entrance started', first.n === 3 && first.op3 < 1, `${first.n} ${first.op3}`);
      await sleep(9000);
      const end = await page.evaluate(() => [...document.querySelectorAll('.cover-line, .cover-intro, .cover-mail')].map((e) => {
        const c = getComputedStyle(e);
        return [c.opacity, c.transform];
      }));
      report('cover 2 final state visible', end.length === 5 && end.every(([o, t]) => o === '1' && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')), JSON.stringify(end));
      const delays = await page.evaluate(() => [...document.querySelectorAll('.cover-line')].map((e) => getComputedStyle(e).animationDelay));
      report('cover 3 stagger 3.5, 4, 4.5s (right after the last circle)', delays.join() === '3.5s,4s,4.5s', delays.join());
      const orbEnd = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.cover-orbs span')]
        .map((e) => { const t = e.getAnimations()[0]?.effect.getComputedTiming(); return t ? t.delay + t.duration : Infinity; })));
      const textStart = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.cover-line, .cover-intro, .cover-mail')]
        .map((e) => e.getAnimations()[0]?.effect.getComputedTiming().delay ?? 0)));
      report('cover 6 last circle ends before the first text starts', orbEnd <= textStart && orbEnd > 0, `${orbEnd} <= ${textStart}`);
      report('cover 4 sub has no animation', (await cs(page, '.cover-sub', 'animationName')) === 'none');
    } finally { await ctx.close().catch(() => {}); }
    const ctx2 = await browser.createBrowserContext();
    const page2 = await ctx2.newPage();
    try {
      await page2.setViewport({ width: 1440, height: 900 });
      await page2.goto(url, { waitUntil: 'domcontentloaded' });
      const vis = await cs(page2, '.cover-mail a', 'visibility');
      report('cover 5 mail link visible during entrance', vis === 'visible', vis);
    } finally { await ctx2.close().catch(() => {}); }
  });

  await scenario('cover-orbs', browser, url, async () => {
    const OUT = join(ROOT, 'dist', 'cover-orbs');
    mkdirSync(OUT, { recursive: true });
    for (const [w, h] of [[320, 640], [375, 812], [768, 1024], [1024, 768], [1440, 900]]) {
      await withPage(browser, url, w, h, {}, async (page) => {
        await sleep(9000);
        // circles may pass behind the centred cover text (user choice); every text line that a circle
        // reaches must keep WCAG contrast against that circle: 4.5:1, or 3:1 for the large heading
        const r = await page.evaluate(() => {
          const rgb = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
          const lum = (c) => { const v = c.map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
          const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
          const orbs = [...document.querySelectorAll('.cover-orbs span')].map((e) => {
            const b = e.getBoundingClientRect();
            return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, r: b.width / 2, bg: rgb(getComputedStyle(e).backgroundColor) };
          });
          const bad = [];
          let hits = 0;
          for (const sel of ['.cover-sub', '.cover h1', '.cover-intro', '.cover-mail a']) {
            const el = document.querySelector(sel);
            const fg = rgb(getComputedStyle(el).color);
            const min = sel === '.cover h1' ? 3 : 4.5;
            const range = document.createRange();
            range.selectNodeContents(el);
            for (const b of range.getClientRects()) {
              orbs.forEach((o, i) => {
                const nx = Math.max(b.left, Math.min(o.cx, b.right));
                const ny = Math.max(b.top, Math.min(o.cy, b.bottom));
                if (Math.hypot(o.cx - nx, o.cy - ny) >= o.r) return;
                hits++;
                const c = ratio(fg, o.bg);
                if (c < min) bad.push(`${sel}#${i + 1}=${c.toFixed(2)}`);
              });
            }
          }
          const op = [...document.querySelectorAll('.cover-orbs span')].map((e) => getComputedStyle(e).opacity);
          return { n: orbs.length, hits, bad, op };
        });
        report(`cover-orbs ${w} four circles, text over circles keeps contrast (${r.hits} overlaps)`, r.n === 4 && r.bad.length === 0 && r.op.every((o) => o === '1'), r.bad.join() || r.op.join());
        if (w === 375 || w === 1440) await page.screenshot({ path: join(OUT, `cover-${w}.png`) });
      });
    }
    const { page, ctx } = await newPage(browser, url, 1440, 900, {});
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await sleep(1400);
      await page.screenshot({ path: join(OUT, 'cover-1440-mid.png') });
    } finally { await ctx.close().catch(() => {}); }
    await withPage(browser, url, 1440, 900, { reduce: true }, async (page) => {
      const st = await page.evaluate(() => [...document.querySelectorAll('.cover-orbs span, .cover-line, .cover-intro, .cover-mail')]
        .map((e) => [getComputedStyle(e).opacity, e.getAnimations().length]));
      report('cover-orbs reduced: no animation, all opacity 1', st.length === 9 && st.every(([o, a]) => o === '1' && a === 0), JSON.stringify(st));
    });
  });

  await scenario('keywords', browser, url, () => withPage(browser, url, 1440, 900, {}, async (page) => {
    const P = 'keywords';
    const t = await trackInfo(page);
    const s0 = await kwState(page);
    report(`${P} 1 switch on, blocks have state`, s0.sw === 'on' && s0.st.length === 3 && s0.st.every(Boolean), JSON.stringify(s0.st));
    report(`${P} 2 track height 2.5 viewports`, Math.abs(t.h - t.vh * 2.5) <= 2, `${t.h} vs ${t.vh * 2.5}`);
    report(`${P} 3 stage sticky`, (await cs(page, '.keywords-stage', 'position').catch(() => '')) === 'sticky');
    const ov = await page.evaluate(() => {
      const bad = [];
      for (let e = document.querySelector('.keywords-stage'); e; e = e.parentElement) {
        const c = getComputedStyle(e);
        // sticky needs no scroll container in the chain: visible or clip (clip does not create one)
        const ok = (v) => v === 'visible' || v === 'clip';
        if (!ok(c.overflowX) || !ok(c.overflowY)) bad.push(e.tagName);
      }
      return bad;
    });
    report(`${P} 4 ancestors create no scroll container (overflow visible or clip)`, ov.length === 0, ov.join());
    const slot = (t.h - t.stageH) / 3;
    const marks = [[t.top - t.vh, 0], [t.top + 10, 0], [t.top + slot + 10, 1], [t.top + 2 * slot + 10, 2], [t.top + t.h + 50, 2]];
    for (const [y, exp] of marks) {
      await scrollToY(page, Math.max(0, y));
      await sleep(700);
      const s = await kwState(page);
      const okAct = s.act === String(exp);
      const okOp = s.op.every((pair, i) => pair.every((o) => o === (i === exp ? '1' : '0')));
      report(`${P} 5 y ${Math.round(y)} -> ${exp}`, okAct && okOp, `${s.act} ${JSON.stringify(s.op)}`);
    }
    await scrollToY(page, t.top + slot + 10);
    await sleep(700);
    const mid = await kwState(page);
    report(`${P} 6 past, active, next`, mid.st.join() === 'past,active,next', mid.st.join());
    const dom = await page.evaluate(() => {
      const kw = document.querySelector('#keywords');
      const bad = [...kw.querySelectorAll('*')].filter((e) => e.hasAttribute('aria-hidden') || e.hasAttribute('inert') || e.hasAttribute('hidden') || getComputedStyle(e).visibility === 'hidden');
      const stage = kw.querySelector(':scope > .keywords-stage');
      return {
        bad: bad.length,
        direct: kw.children.length,
        kids: stage ? [...stage.children].map((c) => c.tagName + '.' + c.className).join() : '',
      };
    });
    report(`${P} 7 nothing hidden by attribute or visibility`, dom.bad === 0, String(dom.bad));
    report(`${P} 8 structure unchanged`, dom.direct === 1 && dom.kids === 'P.eyebrow,H2.visually-hidden,DIV.keyword-block,DIV.keyword-block,DIV.keyword-block', `${dom.direct} ${dom.kids}`);
  }));

  await scenario('keyword-focus', browser, url, () => withPage(browser, url, 1440, 900, {}, async (page) => {
    const P = 'keyword-focus';
    const hh = await headerH(page);
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('#keywords .keyword-list a')].map((a) => a.getAttribute('href')));
    await page.focus('.cover-mail a');
    for (let i = 0; i < 9; i++) {
      await tab(page);
      await sleep(150);
      const r = await page.evaluate(() => {
        const a = document.activeElement;
        const b = a.closest('.keyword-block');
        const blocks = [...document.querySelectorAll('#keywords .keyword-block')];
        const rc = a.getBoundingClientRect();
        return { href: a.getAttribute('href'), idx: blocks.indexOf(b), st: b ? b.dataset.state : '', act: document.querySelector('#keywords').dataset.active, top: rc.top, bottom: rc.bottom, vh: innerHeight };
      });
      await sleep(700);
      const op = await page.evaluate(() => getComputedStyle(document.activeElement.closest('.keyword-list') || document.body).opacity);
      const ok = r.href === hrefs[i] && r.idx === Math.floor(i / 3) && r.st === 'active' && r.act === String(r.idx) && op === '1' && r.top >= hh && r.bottom <= r.vh;
      report(`${P} tab ${i + 1}`, ok, `${r.href} idx ${r.idx} ${r.st} act ${r.act} op ${op} top ${Math.round(r.top)}`);
    }
    await tab(page);
    await sleep(300);
    const out = await page.evaluate(() => !document.activeElement.closest('#keywords'));
    report(`${P} 10th tab leaves keywords`, out);
    await shiftTab(page);
    await sleep(800);
    report(`${P} shift+tab back to block 3`, (await kwState(page)).act === '2');
    for (let i = 0; i < 3; i++) { await shiftTab(page); await sleep(300); }
    await sleep(800);
    report(`${P} shift+tab x3 more to block 2`, (await kwState(page)).act === '1');
  }));

  await scenario('keyword-media', browser, url, async () => {
    for (const [vw, vh, on] of [[1023, 768, false], [1440, 500, false], [375, 812, false], [1024, 768, true], [1440, 900, true]]) {
      await withPage(browser, url, vw, vh, {}, async (page) => {
        const s = await kwState(page);
        const lists = s.op.map((p) => p[1]);
        const ok = on
          ? s.sw === 'on'
          : s.sw === '' && s.st.every((x) => x === '') && lists.every((o) => o === '1');
        report(`keyword-media ${vw}x${vh} ${on ? 'on' : 'off'}`, ok, JSON.stringify({ sw: s.sw, st: s.st, lists }));
      });
    }
    await withPage(browser, url, 1440, 900, {}, async (page) => {
      const seq = [];
      for (const [w, h] of [[1440, 900], [1023, 768], [1440, 900]]) {
        await page.setViewport({ width: w, height: h });
        await sleep(300);
        seq.push((await kwState(page)).sw || 'off');
      }
      report('keyword-media live toggle on, off, on', seq.join() === 'on,off,on', seq.join());
    });
  });

  await scenario('reduced', browser, url, () => withPage(browser, url, 1440, 900, { reduce: true }, async (page) => {
    const s = await kwState(page);
    report('reduced 1 no data-switch', s.sw === '');
    report('reduced 2 cover-line has no animation', (await cs(page, '.cover-line', 'animationName').catch(() => 'none')) === 'none');
    report('reduced 3 no element below full opacity', (await dimCount(page)) === 0);
    report('reduced 4 scroll-behavior auto', (await cs(page, 'html', 'scrollBehavior')) === 'auto');
    await scrollToY(page, 300);
    await sleep(300);
    report('reduced 5 header never hides', (await attr(page, '.site-header', 'data-hidden')) === null);
  }));

  await scenario('nojs-all', browser, url, async () => {
    for (const [vw, vh] of [[1440, 900], [375, 812]]) {
      await withPage(browser, url, vw, vh, { noJs: true }, async (page) => {
        const P = `nojs-all ${vw}`;
        const read = () => page.evaluate(() => ({
          js: document.documentElement.classList.contains('js'),
          sw: document.querySelector('#keywords').dataset.switch || '',
          h: [...document.querySelectorAll('#keywords .keyword-block')].map((b) => b.offsetHeight),
        }));
        const dim = await dimCount(page);
        const a = await read();
        await sleep(1500);
        const b = await read();
        report(`${P} no js class, no switch`, !a.js && a.sw === '');
        report(`${P} dim 0, blocks have height`, dim === 0 && a.h.length === 3 && a.h.every((x) => x > 0) && (await dimCount(page)) === 0 && b.h.every((x) => x > 0));
      });
    }
  });

  await scenario('print-state', browser, url, () => withPage(browser, url, 1440, 900, {}, async (page) => {
    await page.emulateMediaType('print');
    await sleep(300);
    const hd = await cs(page, '.site-header', 'display');
    const ov = await page.evaluate(() => { const o = document.querySelector('.nav-overlay'); return o ? getComputedStyle(o).display : 'none'; });
    report('print-state 1 header and overlay hidden', hd === 'none' && ov === 'none', `${hd} ${ov}`);
    const ops = await page.evaluate(() => [...document.querySelectorAll('.cover-line, .keyword-block, .keyword-title, .keyword-list')].map((e) => getComputedStyle(e).opacity));
    report('print-state 2 all opacity 1', ops.length > 0 && ops.every((o) => o === '1'), ops.join());
    const pos = await page.evaluate(() => { const e = document.querySelector('.keywords-stage'); return e ? getComputedStyle(e).position : 'static'; });
    report('print-state 3 stage not sticky', pos !== 'sticky', pos);
    report('print-state 4 cover circles hidden', (await cs(page, '.cover-orbs', 'display')) === 'none');
  }));

  /* ---- Plan 04-03: screenshot frames (fixture figures, repo untouched) ---- */
  const loaded = (page) => page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('.shot img')];
    imgs.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
    return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
  });
  const matrixScale = (t) => { const m = /^matrix\(([^,]+),/.exec(t); return m ? parseFloat(m[1]) : NaN; };
  const near = (a, b) => Math.abs(a - b) <= 1;

  await scenario('shot-frame', browser, url, async () => {
    for (const [vw, vh] of [[1440, 900], [375, 812]]) {
      await withPage(browser, url, vw, vh, { shots: true }, async (page) => {
        const P = `shot-frame ${vw}`;
        report(`${P} images loaded`, await loaded(page));
        const g = await page.evaluate(() => {
          const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
          const box = (f) => { const r = f.getBoundingClientRect(); const cs = getComputedStyle(f); return { x: r.x + parseFloat(cs.borderLeftWidth), y: r.y + parseFloat(cs.borderTopWidth), w: f.clientWidth, h: f.clientHeight }; };
          const web = document.querySelector('#gi-calculator .shot');
          const app = document.querySelector('#gi-oneday .shot');
          const wi = web.querySelector('img');
          const al = app.querySelector('.shot-link');
          const wc = getComputedStyle(wi);
          const ac = getComputedStyle(al);
          return {
            pic: getComputedStyle(web.querySelector('picture')).display,
            wb: box(web), wr: rect(wi), fit: wc.objectFit, pos: wc.objectPosition,
            ab: box(app), ar: rect(al), rad: ac.borderTopLeftRadius, bw: ac.borderTopWidth,
            filledBefore: getComputedStyle(app, '::before').content,
            emptyBefore: getComputedStyle(document.querySelector('#kn-puring .shot'), '::before').content,
            linkCursor: ac.cursor,
          };
        });
        report(`${P} picture is block`, g.pic === 'block', g.pic);
        report(`${P} web img fills frame`, near(g.wr.x, g.wb.x) && near(g.wr.y, g.wb.y) && near(g.wr.w, g.wb.w) && near(g.wr.h, g.wb.h), JSON.stringify([g.wr, g.wb]));
        report(`${P} web img cover, top`, g.fit === 'cover' && g.pos === '50% 0%', `${g.fit} ${g.pos}`);
        report(`${P} app box <=200 and 9/16`, g.ar.w <= 200.5 && near(g.ar.w, (g.ar.h * 9) / 16), JSON.stringify(g.ar));
        report(`${P} app box centred`, near(g.ar.x + g.ar.w / 2, g.ab.x + g.ab.w / 2), JSON.stringify([g.ar.x, g.ar.w, g.ab.x, g.ab.w]));
        report(`${P} app radius 16px, border 1px`, g.rad === '16px' && g.bw === '1px', `${g.rad} ${g.bw}`);
        report(`${P} filled app has no placeholder, empty keeps it`, g.filledBefore === 'none' && g.emptyBefore !== 'none', `${g.filledBefore} | ${g.emptyBefore}`);
        report(`${P} link cursor zoom-in`, g.linkCursor === 'zoom-in', g.linkCursor);
        const empty = await page.evaluate(() => {
          const e = [...document.querySelectorAll('.shot')].filter((f) => !f.querySelector('picture, img') && !f.hasAttribute('data-empty'));
          return { n: e.length, bad: e.filter((f) => f.getAttribute('aria-hidden') !== 'true' || f.querySelector('a, button, [tabindex]') || getComputedStyle(f).cursor !== 'auto').length };
        });
        report(`${P} empty frames aria-hidden, unfocusable, cursor auto`, empty.n === 8 && empty.bad === 0, JSON.stringify(empty));
        // CJ ADDY: the only project without a screenshot shows a centred icon + "No image"
        const ni = await page.evaluate(() => {
          const f = document.querySelector('#bs-addy .shot');
          const cs = getComputedStyle(f);
          const fr = f.getBoundingClientRect();
          const ic = f.querySelector('svg').getBoundingClientRect();
          const lb = f.querySelector('span').getBoundingClientRect();
          const webEl = document.querySelector('#gi-calculator .shot');
          const web = webEl.getBoundingClientRect();
          return {
            state: f.dataset.empty,
            hiddenAttr: f.hasAttribute('aria-hidden'),
            text: f.textContent.replace(/\s+/g, ' ').trim(),
            svgHidden: f.querySelector('svg').getAttribute('aria-hidden'),
            controls: f.querySelectorAll('a, button, img, picture, [tabindex]').length,
            cursor: cs.cursor,
            dx: Math.abs((ic.x + ic.width / 2) - (fr.x + fr.width / 2)),
            lx: Math.abs((lb.x + lb.width / 2) - (fr.x + fr.width / 2)),
            dy: Math.abs(((ic.y + lb.bottom) / 2) - (fr.y + fr.height / 2)),
            sameBox: Math.abs(fr.width - web.width) < 1 && Math.abs(fr.height - web.height) < 1,
            bg: cs.backgroundColor === getComputedStyle(webEl).backgroundColor,
          };
        });
        const niOk = ni.state === 'no-image' && !ni.hiddenAttr && ni.text === 'No image' && ni.svgHidden === 'true' && ni.controls === 0
          && ni.cursor === 'auto' && ni.dx < 1.5 && ni.lx < 1.5 && ni.dy < 3 && ni.sameBox && ni.bg;
        report(`${P} no-image frame: icon + "No image", read once, no control, centred, same box`, niOk, JSON.stringify(ni));
        await page.click('#bs-addy .shot');
        await sleep(200);
        report(`${P} no-image frame does not open the zoom dialog`, await page.evaluate(() => !document.querySelector('dialog.shot-dialog[open]')));

        if (vw === 1440) {
          await page.hover('#gi-calculator .shot-link');
          await sleep(400);
          const hv = await page.evaluate(() => ({
            t: getComputedStyle(document.querySelector('#gi-calculator .shot-link img')).transform,
            card: getComputedStyle(document.querySelector('#gi-calculator')).transform,
          }));
          report(`${P} hover scale 1.02`, Math.abs(matrixScale(hv.t) - 1.02) < 0.005, hv.t);
          report(`${P} hover lifts card -2px`, /^matrix\(1, 0, 0, 1, 0, -2\)$/.test(hv.card), hv.card);
          await page.mouse.move(0, 0);
          await page.focus('#gi-calculator .shot-link');
          await page.keyboard.press('Shift');
          await sleep(400);
          const fo = await page.evaluate(() => {
            const l = document.querySelector('#gi-calculator .shot-link');
            const f = getComputedStyle(l.closest('.shot'));
            return { focused: document.activeElement === l, st: f.outlineStyle, w: f.outlineWidth, c: f.outlineColor, own: getComputedStyle(l).outlineStyle, t: getComputedStyle(l.querySelector('img')).transform };
          });
          report(`${P} focus ring on frame, accent 2px, none on link`, fo.focused && fo.st === 'solid' && fo.w === '2px' && fo.c === ACCENT && fo.own === 'none', JSON.stringify(fo));
          report(`${P} focus scale 1.02`, Math.abs(matrixScale(fo.t) - 1.02) < 0.005, fo.t);
          await page.emulateMediaType('print');
          await sleep(200);
          const pr = await page.evaluate(() => {
            const fr = [...document.querySelectorAll('.shot')];
            const filled = fr.filter((f) => f.querySelector('picture, img'));
            const emptyF = fr.filter((f) => !f.querySelector('picture, img') && !f.hasAttribute('data-empty'));
            return {
              filled: filled.map((f) => getComputedStyle(f).display),
              empty: emptyF.every((f) => getComputedStyle(f).display === 'none'),
              noImage: getComputedStyle(document.querySelector('#bs-addy .shot')).display !== 'none',
              cursor: getComputedStyle(document.querySelector('.shot-link')).cursor,
              tf: getComputedStyle(document.querySelector('#gi-calculator .shot-link img')).transform,
            };
          });
          report(`${P} print: filled and no-image shown, empty hidden, no cursor, no transform`, pr.filled.length === 2 && pr.filled.every((d) => d !== 'none') && pr.empty && pr.noImage && pr.cursor === 'auto' && pr.tf === 'none', JSON.stringify(pr));
        }
      });
    }
    await withPage(browser, url, 1440, 900, { shots: true, reduce: true }, async (page) => {
      await loaded(page);
      await page.hover('#gi-calculator .shot-link');
      await sleep(400);
      const t = await css(page, '#gi-calculator .shot-link img', 'transform');
      report('shot-frame reduced-motion: no scale', t === 'none', t);
    });
  });

  await scenario('shot-nojs', browser, url, async () => {
    for (const [vw, vh] of [[1440, 900], [375, 812]]) {
      await withPage(browser, url, vw, vh, { noJs: true, shots: true }, async (page) => {
        const P = `shot-nojs ${vw}`;
        const r = await page.evaluate(async () => {
          const links = [...document.querySelectorAll('a.shot-link')];
          const res = [];
          for (const a of links) {
            const x = await fetch(a.getAttribute('href'));
            res.push({ href: a.getAttribute('href'), status: x.status, type: x.headers.get('content-type') });
          }
          return {
            a: links.length,
            b: document.querySelectorAll('button.shot-link').length,
            res,
            dim: [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).opacity !== '1').length,
            hidden: [...document.querySelectorAll('.shot')].filter((f) => !f.querySelector('picture, img') && f.getAttribute('aria-hidden') === 'true' && !f.hasAttribute('data-empty')).length,
          };
        });
        report(`${P} two links, no buttons`, r.a === 2 && r.b === 0, `${r.a} ${r.b}`);
        const okHref = r.res.length === 2 && r.res[0].href.endsWith('-1920.jpg') && r.res[1].href.endsWith('-1080.jpg') && r.res.every((x) => x.status === 200 && x.type === 'image/jpeg');
        report(`${P} big JPEG targets`, okHref, JSON.stringify(r.res));
        report(`${P} opacity 1, 8 empty frames aria-hidden`, r.dim === 0 && r.hidden === 8, `${r.dim} ${r.hidden}`);
      });
    }
  });

  const dlgState = (page) => page.evaluate(() => {
    const d = document.querySelector('dialog.shot-dialog');
    const a = document.activeElement;
    return { open: !!d && d.open, closing: !!d && d.hasAttribute('data-closing'), inDlg: !!d && d.contains(a), tag: a.tagName, cls: String(a.className), op: d ? parseFloat(getComputedStyle(d).opacity) : NaN };
  });
  const sy = (page) => page.evaluate(() => window.scrollY);
  const waitOpen = async (page, want, ms = 400) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if ((await dlgState(page)).open === want) return true;
      await sleep(20);
    }
    return (await dlgState(page)).open === want;
  };
  const focusBtn = async (page, id) => {
    await page.evaluate((i) => { const b = document.querySelector(`#${i} button.shot-link`); b.scrollIntoView({ block: 'center', behavior: 'instant' }); b.focus(); }, id);
    await sleep(100);
  };
  const isBtn = (page, id) => page.evaluate((i) => document.activeElement === document.querySelector(`#${i} button.shot-link`), id);

  await scenario('shot-dialog', browser, url, async () => {
    for (const [vw, vh] of [[375, 812], [768, 1024], [1440, 900]]) {
      await withPage(browser, url, vw, vh, { shots: true }, async (page) => {
        const P = `shot-dialog ${vw}`;
        await loaded(page);
        const init = await page.evaluate(() => {
          const bs = [...document.querySelectorAll('button.shot-link')];
          const d = document.querySelectorAll('body > dialog.shot-dialog');
          return {
            n: bs.length,
            ok: bs.every((b) => b.type === 'button' && b.getAttribute('aria-haspopup') === 'dialog' && b.getAttribute('aria-label') === b.closest('article').querySelector('h3').textContent + ' 화면 크게 보기'),
            links: document.querySelectorAll('a.shot-link').length,
            d: d.length, lab: d[0]?.getAttribute('aria-labelledby'), disp: d[0] ? getComputedStyle(d[0]).display : '',
          };
        });
        report(`${P} 1 two buttons, one closed dialog`, init.n === 2 && init.ok && init.links === 0 && init.d === 1 && init.lab === 'shot-dialog-title' && init.disp === 'none', JSON.stringify(init));

        await focusBtn(page, 'gi-calculator');
        const y0 = await sy(page);
        await page.keyboard.press('Enter');
        report(`${P} 2 Enter opens`, await waitOpen(page, true));
        await sleep(350);
        const o = await page.evaluate(() => {
          const d = document.querySelector('dialog.shot-dialog');
          const c = d.querySelector('.shot-dialog-close');
          const title = d.querySelector('.shot-dialog-title').textContent;
          const rest = d.innerText.replace(title, '').replace('닫기', '').trim();
          const r = d.getBoundingClientRect();
          const img = d.querySelector('img');
          const thumb = document.querySelector('#gi-calculator .shot-link img');
          return {
            act: document.activeElement === c, txt: c.textContent.trim(), h: c.getBoundingClientRect().height,
            title, h3: document.querySelector('#gi-calculator h3').textContent, rest,
            alt: img.alt === thumb.alt && img.alt !== '', sizes: img.getAttribute('sizes') === '100vw',
            bd: getComputedStyle(d, '::backdrop').backgroundColor, l: r.left, t: r.top,
          };
        });
        const inset = vw === 375 ? 16 : 24;
        report(`${P} 2 focus on close, title only`, o.act && o.txt === '닫기' && o.h >= 44 && o.title === o.h3 && o.rest === '', JSON.stringify([o.act, o.txt, o.h, o.title, o.rest]));
        report(`${P} 2 alt, sizes, backdrop, inset`, o.alt && o.sizes && o.bd === 'rgba(17, 24, 39, 0.88)' && Math.abs(o.l - inset) <= 1 && Math.abs(o.t - inset) <= 1, JSON.stringify([o.alt, o.sizes, o.bd, o.l, o.t]));

        const sc = await page.evaluate(() => {
          const s = document.querySelector('.shot-dialog-scroll');
          const cs = getComputedStyle(s);
          return { over: s.scrollHeight > s.clientHeight, ti: s.getAttribute('tabindex'), role: s.getAttribute('role'), lab: s.getAttribute('aria-label'), name: document.querySelector('#gi-calculator h3').textContent, ox: cs.overflowX, sw: s.scrollWidth, cw: s.clientWidth, dw: document.documentElement.scrollWidth, iw: innerWidth };
        });
        report(`${P} 3 vertical scroll region, no horizontal`, sc.over && sc.ti === '0' && sc.role === 'region' && sc.lab === `${sc.name} 스크롤 영역` && sc.sw <= sc.cw + 1 && sc.dw <= sc.iw, JSON.stringify(sc));

        const bad = [];
        for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); const s = await dlgState(page); if (!(s.inDlg || s.tag === 'BODY') || /shot-link/.test(s.cls)) bad.push(['tab', i, s.tag, s.cls]); }
        for (let i = 0; i < 3; i++) { await shiftTab(page); const s = await dlgState(page); if (!(s.inDlg || s.tag === 'BODY') || /shot-link/.test(s.cls)) bad.push(['stab', i, s.tag, s.cls]); }
        report(`${P} 4 Tab never leaves dialog`, bad.length === 0, JSON.stringify(bad));

        await page.evaluate(() => { window.__closeN = 0; document.querySelector('dialog.shot-dialog').addEventListener('close', () => { window.__closeN++; }); });
        await page.keyboard.press('Escape');
        report(`${P} 5 Esc closes`, await waitOpen(page, false));
        await sleep(100);
        report(`${P} 5 focus back, scroll kept`, (await isBtn(page, 'gi-calculator')) && Math.abs((await sy(page)) - y0) <= 1, `${await sy(page)} vs ${y0}`);
        await page.keyboard.press('Enter');
        await waitOpen(page, true);
        await sleep(300);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await waitOpen(page, false);
        await sleep(300);
        const cn = await page.evaluate(() => window.__closeN);
        report(`${P} 5 double Esc fires close once`, cn === 2, `total ${cn}`);

        await focusBtn(page, 'gi-oneday');
        await page.keyboard.press('Space');
        report(`${P} 6 Space opens app card`, await waitOpen(page, true));
        await sleep(300);
        await page.mouse.click(5, 5);
        report(`${P} 6 corner click closes`, await waitOpen(page, false));
        await sleep(100);
        report(`${P} 6 focus back to app button`, await isBtn(page, 'gi-oneday'));
        await page.keyboard.press('Enter');
        await waitOpen(page, true);
        await sleep(300);
        const ib = await page.evaluate(() => { const r = document.querySelector('dialog.shot-dialog img').getBoundingClientRect(); return [r.x + r.width / 2, r.y + Math.min(r.height, 200) / 2]; });
        await page.mouse.click(ib[0], ib[1]);
        await sleep(350);
        report(`${P} 6 image click keeps open`, (await dlgState(page)).open);
        await page.click('.shot-dialog-close');
        report(`${P} 6 close button closes`, await waitOpen(page, false));
        await sleep(100);

        await focusBtn(page, 'gi-calculator');
        const y1 = await sy(page);
        await page.keyboard.press('Enter');
        await waitOpen(page, true);
        await sleep(300);
        await page.mouse.move(vw - 3, vh / 2);
        await page.mouse.wheel({ deltaY: 600 });
        await sleep(200);
        report(`${P} 7 page scroll locked`, Math.abs((await sy(page)) - y1) <= 1, `${await sy(page)} vs ${y1}`);
        await page.keyboard.press('Escape');
        await waitOpen(page, false);
        await sleep(100);

        await page.keyboard.press('Enter');
        await sleep(30);
        const op30 = (await dlgState(page)).op;
        await sleep(300);
        const op300 = (await dlgState(page)).op;
        report(`${P} 8 fade-in`, op30 < 1 && op300 === 1, `${op30} -> ${op300}`);
      });
    }
  });

  await scenario('shot-reduced', browser, url, () => withPage(browser, url, 1440, 900, { shots: true, reduce: true }, async (page) => {
    const P = 'shot-reduced';
    await loaded(page);
    await focusBtn(page, 'gi-calculator');
    await page.evaluate(() => {
      window.__sawClosing = false;
      new MutationObserver(() => { if (document.querySelector('dialog.shot-dialog[data-closing]')) window.__sawClosing = true; }).observe(document.querySelector('dialog.shot-dialog'), { attributes: true });
    });
    await page.keyboard.press('Enter');
    const s = await dlgState(page);
    report(`${P} opens instantly at opacity 1`, s.open && s.op === 1, JSON.stringify(s));
    await page.keyboard.press('Escape');
    const c = await dlgState(page);
    report(`${P} closes instantly`, !c.open, JSON.stringify(c));
    await sleep(300);
    const saw = await page.evaluate(() => window.__sawClosing);
    report(`${P} no data-closing, focus back`, !saw && (await isBtn(page, 'gi-calculator')), `closing=${saw}`);
  }));

  await scenario('shot-fallback', browser, url, async () => {
    const ctx = await browser.createBrowserContext();
    try {
      const page = await ctx.newPage();
      const fx = await buildShotFixture();
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const path = new URL(req.url()).pathname;
        if (req.resourceType() === 'document' && (path === '/' || path === '/index.html')) req.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: fx.html });
        else if (fx.assets.has(path)) req.respond({ status: 200, ...fx.assets.get(path) });
        else req.continue();
      });
      await page.evaluateOnNewDocument(() => { delete HTMLDialogElement.prototype.showModal; });
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(url, { waitUntil: 'load' });
      await sleep(150);
      const r = await page.evaluate(() => ({
        a: [...document.querySelectorAll('a.shot-link')].filter((x) => x.getAttribute('href')).length,
        b: document.querySelectorAll('button.shot-link').length,
        d: document.querySelectorAll('dialog.shot-dialog').length,
        js: document.documentElement.classList.contains('js'),
      }));
      report('shot-fallback links stay, no dialog, html.js kept', r.a === 2 && r.b === 0 && r.d === 0 && r.js, JSON.stringify(r));
    } finally { await ctx.close().catch(() => {}); }
  });
} finally {
  await closeBrowser(browser);
  await server.close();
}
console.log(failures ? `\n${failures} check(s) FAILED` : '\ncheck-ui: all passed');
process.exitCode = failures ? 1 : 0;
