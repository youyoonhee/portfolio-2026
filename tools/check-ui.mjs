// UI behaviour checks (menu, header hide/show, keyboard, focus ring, current section, no-JS).
// Heavy (needs Chrome), so it is NOT part of `npm run check` or the git hooks. Run: npm run check:ui
// Usage: node tools/check-ui.mjs [--only menu|header|skip|focus-ring|spy|nojs|cover|keywords|keyword-focus|keyword-media|reduced|nojs-all|print-state]
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
      await sleep(1500);
      const end = await page.evaluate(() => [...document.querySelectorAll('.cover-line, .cover-intro, .cover-mail')].map((e) => {
        const c = getComputedStyle(e);
        return [c.opacity, c.transform];
      }));
      report('cover 2 final state visible', end.length === 5 && end.every(([o, t]) => o === '1' && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')), JSON.stringify(end));
      const delays = await page.evaluate(() => [...document.querySelectorAll('.cover-line')].map((e) => getComputedStyle(e).animationDelay));
      report('cover 3 stagger 0, 150, 300ms', delays.join() === '0s,0.15s,0.3s', delays.join());
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
        if (c.overflowX !== 'visible' || c.overflowY !== 'visible') bad.push(e.tagName);
      }
      return bad;
    });
    report(`${P} 4 ancestors overflow visible`, ov.length === 0, ov.join());
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
  }));
} finally {
  await closeBrowser(browser);
  await server.close();
}
console.log(failures ? `\n${failures} check(s) FAILED` : '\ncheck-ui: all passed');
process.exitCode = failures ? 1 : 0;
