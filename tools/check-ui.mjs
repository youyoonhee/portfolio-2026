// UI behaviour checks (menu, header hide/show, keyboard, focus ring, current section, no-JS).
// Heavy (needs Chrome), so it is NOT part of `npm run check` or the git hooks. Run: npm run check:ui
// Usage: node tools/check-ui.mjs [--only menu|header|skip|focus-ring|spy|nojs]
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
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

async function newPage(browser, url, vw, vh, opts = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
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
} finally {
  await closeBrowser(browser);
  await server.close();
}
console.log(failures ? `\n${failures} check(s) FAILED` : '\ncheck-ui: all passed');
process.exitCode = failures ? 1 : 0;
