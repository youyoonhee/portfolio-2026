// Minimal interaction layer: mobile menu, header hide/show, current section.
// Everything degrades to the static Phase 2 markup when this file does not run.
const root = document.documentElement;
root.classList.add('js');

function init() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  const mqWide = matchMedia('(min-width: 900px)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

  const HIDE_AFTER = 80;
  const DELTA = 8;

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);

  /* header hide / show */
  let lastY = window.scrollY;
  let dir = 0;
  let acc = 0;
  let ticking = false;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const showHeader = () => header.removeAttribute('data-hidden');
  const hideHeader = () => {
    if (isOpen() || mqReduce.matches || header.matches(':focus-within')) return;
    header.setAttribute('data-hidden', 'true');
  };

  /* menu */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    for (const el of [nav, overlay]) {
      if (open) el.setAttribute('data-open', 'true');
      else el.removeAttribute('data-open');
    }
    if (open) showHeader();
  }

  toggle.addEventListener('click', () => setMenu(!isOpen()));

  overlay.addEventListener('click', () => {
    const hadFocus = header.contains(document.activeElement);
    setMenu(false);
    if (hadFocus) toggle.focus();
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setMenu(false);
      toggle.focus();
    }
  });

  document.addEventListener('focusin', (e) => {
    if (isOpen() && !header.contains(e.target)) setMenu(false);
  });

  mqWide.addEventListener('change', () => {
    if (mqWide.matches) setMenu(false);
  });

  /* scroll handling */
  function onScrollFrame() {
    ticking = false;
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    if (y < 0 || y > max) {
      lastY = Math.min(Math.max(y, 0), Math.max(max, 0));
      return;
    }
    if (y <= HIDE_AFTER) {
      showHeader();
      acc = 0;
      dir = 0;
      lastY = y;
      return;
    }
    const d = y - lastY;
    lastY = y;
    if (d === 0) return;
    const nd = d > 0 ? 1 : -1;
    if (nd !== dir) {
      dir = nd;
      acc = 0;
    }
    acc += Math.abs(d);
    if (acc >= DELTA) {
      if (dir > 0) hideHeader();
      else showHeader();
    }
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScrollFrame);
  }, { passive: true });

  header.addEventListener('focusin', showHeader);
  mqReduce.addEventListener('change', () => {
    if (mqReduce.matches) showHeader();
  });

  /* current section: company sections count as Career */
  const COMPANY_IDS = ['gi-data', 'kn-curation', 'bistones', 'abbey-road'];
  const links = new Map();
  for (const a of nav.querySelectorAll('a[href^="#"]')) links.set(a.getAttribute('href').slice(1), a);

  const setCurrent = (key) => {
    for (const [k, a] of links) {
      if (k === key) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id;
      const key = COMPANY_IDS.includes(id) ? 'career' : id;
      setCurrent(links.has(key) ? key : null);
    }
  }, { rootMargin: '-40% 0px -55% 0px' });

  for (const s of document.querySelectorAll('main > section[id]')) observer.observe(s);

  /* keyword switch: sticky stage + scroll position drives data-state only (scroll is never intercepted) */
  const kw = document.querySelector('#keywords');
  const kwStage = kw.querySelector('.keywords-stage');
  const kwBlocks = [...kw.querySelectorAll('.keyword-block')];
  const mqSwitch = matchMedia('(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');

  const slotSize = () => (kw.offsetHeight - kwStage.offsetHeight) / kwBlocks.length;
  const scrollIndex = () => {
    const i = Math.floor(-kw.getBoundingClientRect().top / slotSize());
    return Math.min(Math.max(Number.isFinite(i) ? i : 0, 0), kwBlocks.length - 1);
  };

  let kwIndex = -1;
  function setActive(i) {
    if (i === kwIndex) return;
    kwIndex = i;
    kw.dataset.active = String(i);
    kwBlocks.forEach((b, n) => {
      b.dataset.state = n < i ? 'past' : n > i ? 'next' : 'active';
    });
  }

  let kwTicking = false;
  const onKwScroll = () => {
    if (kwTicking) return;
    kwTicking = true;
    requestAnimationFrame(() => {
      kwTicking = false;
      setActive(scrollIndex());
    });
  };

  /* a link in a hidden keyword gets Tab focus; bring that keyword in (instant, whatever scroll-behavior says) */
  const onKwFocus = (e) => {
    const block = e.target.closest('.keyword-block');
    if (!block) return;
    const i = kwBlocks.indexOf(block);
    if (i !== scrollIndex()) {
      window.scrollTo({ top: window.scrollY + kw.getBoundingClientRect().top + (i + 0.5) * slotSize(), behavior: 'instant' });
    }
    setActive(i);
  };

  let kwObserver = null;
  function enableSwitch() {
    // the tall switch layout must exist before the first index is computed
    kw.dataset.switch = 'on';
    void kw.offsetHeight;
    kwIndex = -1;
    setActive(scrollIndex());
    window.addEventListener('scroll', onKwScroll, { passive: true });
    kw.addEventListener('focusin', onKwFocus);
    kwObserver = new IntersectionObserver(() => setActive(scrollIndex()));
    kwObserver.observe(kw);
  }

  function disableSwitch() {
    window.removeEventListener('scroll', onKwScroll);
    kw.removeEventListener('focusin', onKwFocus);
    if (kwObserver) kwObserver.disconnect();
    kwObserver = null;
    kwIndex = -1;
    delete kw.dataset.switch;
    delete kw.dataset.active;
    for (const b of kwBlocks) delete b.dataset.state;
  }

  mqSwitch.addEventListener('change', () => (mqSwitch.matches ? enableSwitch() : disableSwitch()));
  if (mqSwitch.matches) enableSwitch();
}

/* if anything throws, fall back to the static markup: drop html.js and undo what init touched */
try {
  init();
} catch (err) {
  root.classList.remove('js');
  document.querySelector('.nav-overlay')?.remove();
  document.querySelector('.site-header')?.removeAttribute('data-hidden');
  const kwEl = document.querySelector('#keywords');
  if (kwEl) {
    delete kwEl.dataset.switch;
    delete kwEl.dataset.active;
    kwEl.querySelectorAll('.keyword-block').forEach((b) => delete b.dataset.state);
  }
  console.error(err);
}
