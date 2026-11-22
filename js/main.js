// Minimal interaction layer: mobile menu, header hide/show, current section.
// Everything degrades to the static Phase 2 markup when this file does not run.
const root = document.documentElement;
root.classList.add('js');

// "the scroll has come to rest": scrollend where supported, otherwise a short quiet period after the last scroll event
const SETTLE_EVENT = 'onscrollend' in window ? 'scrollend' : 'scroll';
const SETTLE_MS = 120;
function debounce(fn, ms) {
  let t = 0;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

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

  /* keyword switch: sticky stage + scroll position drives data-state only (scroll is never intercepted).
     Quick 261122-tgl, calmer on touch: a boundary must be passed by KW_MARGIN of a step before the step changes
     (both directions, so momentum jitter around a boundary does not flip it), a switch holds for KW_DWELL ms
     unless the scroll has moved more than a whole step since, and when the scroll comes to rest the step is set
     straight from the position. The slot is measured at layout time (svh track, ResizeObserver), never per scroll,
     so the mobile address bar showing or hiding does not move the mapping. */
  const kw = document.querySelector('#keywords');
  const kwStage = kw.querySelector('.keywords-stage');
  const kwBlocks = [...kw.querySelectorAll('.keyword-block')];
  // every width (2026-11-22); short viewports and reduced motion keep the static, all-visible state
  const mqSwitch = matchMedia('screen and (min-height: 500px) and (prefers-reduced-motion: no-preference)');
  const KW_MARGIN = 0.15;
  const KW_DWELL = 350;

  let kwSlot = 0;
  const measure = () => {
    kwSlot = (kw.offsetHeight - kwStage.offsetHeight) / kwBlocks.length;
  };
  const clampStep = (i) => Math.min(Math.max(Number.isFinite(i) ? i : 0, 0), kwBlocks.length - 1);
  // progress through the track in steps (0 at the top of step 1, 4 at the end of step 4)
  const progress = () => (kwSlot > 0 ? -kw.getBoundingClientRect().top / kwSlot : 0);
  const scrollIndex = () => clampStep(Math.floor(progress()));
  // the step for progress p, given the step k shown now: crossing a boundary needs KW_MARGIN extra
  const stepFor = (p, k) => {
    const raw = clampStep(Math.floor(p));
    if (k < 0 || raw === k) return raw;
    return raw > k ? clampStep(Math.max(k, Math.floor(p - KW_MARGIN))) : clampStep(Math.min(k, Math.floor(p + KW_MARGIN)));
  };

  let kwIndex = -1;
  let switchedAt = -Infinity;
  let switchedP = 0;
  let dwellTimer = 0;
  function setActive(i) {
    if (i === kwIndex) return;
    kwIndex = i;
    switchedAt = performance.now();
    switchedP = progress();
    kw.dataset.active = String(i);
    kwBlocks.forEach((b, n) => {
      b.dataset.state = n < i ? 'past' : n > i ? 'next' : 'active';
    });
  }

  function onKwFrame() {
    kwTicking = false;
    const p = progress();
    const next = stepFor(p, kwIndex);
    if (next === kwIndex) return;
    const wait = KW_DWELL - (performance.now() - switchedAt);
    if (wait > 0 && Math.abs(p - switchedP) <= 1) {
      // too soon after the last switch: look again when the hold is over (or when the scroll settles)
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(onKwScroll, wait);
      return;
    }
    setActive(next);
  }

  let kwTicking = false;
  const onKwScroll = () => {
    if (kwTicking) return;
    kwTicking = true;
    requestAnimationFrame(onKwFrame);
  };
  // at rest the shown step always matches the position
  const onKwSettle = () => {
    clearTimeout(dwellTimer);
    setActive(scrollIndex());
  };
  const onKwSettleEvent = SETTLE_EVENT === 'scrollend' ? onKwSettle : debounce(onKwSettle, SETTLE_MS);

  /* a top-line link in a hidden step gets Tab focus; bring that step in (instant, whatever scroll-behavior says) */
  const onKwFocus = (e) => {
    const block = e.target.closest('.keyword-block');
    if (!block) return;
    const i = kwBlocks.indexOf(block);
    if (i !== scrollIndex()) {
      window.scrollTo({ top: window.scrollY + kw.getBoundingClientRect().top + (i + 0.5) * kwSlot, behavior: 'instant' });
    }
    setActive(i);
  };

  let kwObserver = null;
  let kwResize = null;
  function enableSwitch() {
    // the tall switch layout must exist before the first index is computed
    kw.dataset.switch = 'on';
    measure();
    kwIndex = -1;
    setActive(scrollIndex());
    window.addEventListener('scroll', onKwScroll, { passive: true });
    window.addEventListener(SETTLE_EVENT, onKwSettleEvent, { passive: true });
    kw.addEventListener('focusin', onKwFocus);
    kwObserver = new IntersectionObserver(onKwSettle);
    kwObserver.observe(kw);
    kwResize = new ResizeObserver(() => {
      measure();
      onKwSettle();
    });
    kwResize.observe(kw);
    kwResize.observe(kwStage);
  }

  function disableSwitch() {
    window.removeEventListener('scroll', onKwScroll);
    window.removeEventListener(SETTLE_EVENT, onKwSettleEvent);
    kw.removeEventListener('focusin', onKwFocus);
    if (kwObserver) kwObserver.disconnect();
    if (kwResize) kwResize.disconnect();
    kwObserver = null;
    kwResize = null;
    clearTimeout(dwellTimer);
    kwIndex = -1;
    delete kw.dataset.switch;
    delete kw.dataset.active;
    for (const b of kwBlocks) delete b.dataset.state;
  }

  mqSwitch.addEventListener('change', () => (mqSwitch.matches ? enableSwitch() : disableSwitch()));
  if (mqSwitch.matches) enableSwitch();

  initShots(mqReduce);
  initSkillsSlider(mqReduce);
}

/* Tech stack slider (below 640px): CSS scroll-snap does the swiping, this adds the dots and the focusable region */
function initSkillsSlider(mqReduce) {
  const list = document.querySelector('dl.skills');
  if (!list) return;
  const cards = [...list.children];
  const mq = matchMedia('(width < 640px)');
  // a dot changes only once its card is clearly in view (60%): mid-swipe the old dot stays until the new card
  // has mostly arrived, and a small drift that snaps back never touches it (quick 261122-tgl)
  const IN_VIEW = 0.6;
  let dots = null;
  let io = null;
  let shown = -1;
  let target = -1; // set by a dot tap: cards passed on the way there do not light their dots
  let targetTimer = 0;

  const current = () => {
    const x = list.scrollLeft;
    let best = 0;
    cards.forEach((c, i) => {
      if (Math.abs(c.offsetLeft - list.offsetLeft - x) < Math.abs(cards[best].offsetLeft - list.offsetLeft - x)) best = i;
    });
    return best;
  };
  const show = (cur) => {
    if (!dots || cur === shown) return;
    shown = cur;
    dots.querySelectorAll('button').forEach((b, i) => {
      if (i === cur) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  };
  const clearTarget = () => {
    target = -1;
    clearTimeout(targetTimer);
  };
  const onSeen = (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || e.intersectionRatio < IN_VIEW) continue;
      const i = cards.indexOf(e.target);
      if (target > -1 && i !== target) continue;
      if (i === target) clearTarget();
      show(i);
    }
  };
  // settled: whatever the observer saw, the dot matches the card the scroll came to rest on
  const onSettle = () => {
    clearTarget();
    show(current());
  };

  // scrollend where it exists; elsewhere (iOS Safari before 26) a scroll that has been quiet for SETTLE_MS
  const onSettleEvent = SETTLE_EVENT === 'scrollend' ? onSettle : debounce(onSettle, SETTLE_MS);

  const enable = () => {
    if (dots) return;
    list.setAttribute('tabindex', '0');
    list.setAttribute('role', 'region');
    list.setAttribute('aria-label', 'Tech stack 목록, 좌우로 넘겨 보기');
    dots = document.createElement('div');
    dots.className = 'skills-dots';
    cards.forEach((card, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${card.querySelector('dt').textContent} 보기`);
      b.addEventListener('click', () => {
        clearTarget();
        target = i;
        // safety net if no scrollend arrives (already there, or an interrupted smooth scroll)
        targetTimer = setTimeout(onSettle, 1200);
        show(i);
        list.scrollTo({ left: card.offsetLeft - list.offsetLeft, behavior: mqReduce.matches ? 'auto' : 'smooth' });
      });
      dots.append(b);
    });
    list.after(dots);
    shown = -1;
    show(current());
    io = new IntersectionObserver(onSeen, { root: list, threshold: IN_VIEW });
    for (const c of cards) io.observe(c);
    list.addEventListener(SETTLE_EVENT, onSettleEvent, { passive: true });
  };
  const disable = () => {
    if (!dots) return;
    clearTarget();
    if (io) io.disconnect();
    io = null;
    list.removeEventListener(SETTLE_EVENT, onSettleEvent);
    list.removeAttribute('tabindex');
    list.removeAttribute('role');
    list.removeAttribute('aria-label');
    dots.remove();
    dots = null;
  };
  mq.addEventListener('change', () => (mq.matches ? enable() : disable()));
  if (mq.matches) enable();
}

/* screenshot zoom: promote the thumbnail links to buttons that open one shared native <dialog> */
function buildShotDialog() {
  const dlg = document.createElement('dialog');
  dlg.className = 'shot-dialog';
  dlg.setAttribute('aria-labelledby', 'shot-dialog-title');
  const bar = document.createElement('div');
  bar.className = 'shot-dialog-bar';
  const title = document.createElement('p');
  title.className = 'shot-dialog-title';
  title.id = 'shot-dialog-title';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'shot-dialog-close';
  close.setAttribute('autofocus', '');
  close.textContent = '닫기';
  bar.append(title, close);
  const scroll = document.createElement('div');
  scroll.className = 'shot-dialog-scroll';
  dlg.append(bar, scroll);
  document.body.append(dlg);
  return dlg;
}

function initShots(mqReduce) {
  if (!(window.HTMLDialogElement && 'showModal' in HTMLDialogElement.prototype)) return;
  const links = [...document.querySelectorAll('a.shot-link')];
  if (!links.length) return;

  const dlg = buildShotDialog();
  const titleEl = dlg.querySelector('.shot-dialog-title');
  const scrollEl = dlg.querySelector('.shot-dialog-scroll');
  let opener = null;

  let cancelFade = null;
  let scrollLabel = '';
  let scrollObserver = null;

  function finish() {
    if (cancelFade) cancelFade();
    delete dlg.dataset.closing;
    scrollObserver?.disconnect();
    if (dlg.open) dlg.close();
    opener?.focus({ preventScroll: true });
  }

  function closeIt() {
    if (!dlg.open || dlg.dataset.closing) return;
    if (mqReduce.matches) {
      finish();
      return;
    }
    dlg.dataset.closing = 'true';
    const dur = parseFloat(getComputedStyle(root).getPropertyValue('--dur')) || 200;
    const timer = setTimeout(finish, dur + 50);
    const onEnd = (e) => {
      if (e.target === dlg && e.propertyName === 'opacity') finish();
    };
    dlg.addEventListener('transitionend', onEnd);
    /* a finished fade must not leave a listener behind: it would close the next opening */
    cancelFade = () => {
      clearTimeout(timer);
      dlg.removeEventListener('transitionend', onEnd);
      cancelFade = null;
    };
  }

  function open(btn) {
    /* a close that was still fading (native close, Esc-less paths) must not close this new session */
    if (cancelFade) cancelFade();
    delete dlg.dataset.closing;
    opener = btn;
    const pic = btn.querySelector('picture').cloneNode(true);
    for (const el of pic.querySelectorAll('source, img')) el.setAttribute('sizes', '100vw');
    pic.querySelector('img').removeAttribute('loading');
    const name = btn.closest('article').querySelector('h3').textContent;
    titleEl.textContent = name;
    dlg.dataset.frame = btn.closest('.shot').dataset.frame || 'web';
    scrollEl.replaceChildren(pic);
    if (!dlg.open) dlg.showModal();
    scrollLabel = `${name} 스크롤 영역`;
    syncScroll();
    /* the layout is not final yet: the image may still be loading and the viewport can change while it is open */
    pic.querySelector('img').addEventListener('load', syncScroll);
    scrollObserver?.disconnect();
    if ('ResizeObserver' in window) {
      scrollObserver = new ResizeObserver(syncScroll);
      scrollObserver.observe(scrollEl);
      scrollObserver.observe(pic.querySelector('img'));
    }
  }

  /* keyboard users can only scroll a region that is focusable, so decide it from the live layout */
  function syncScroll() {
    if (scrollEl.scrollHeight > scrollEl.clientHeight) {
      scrollEl.tabIndex = 0;
      scrollEl.setAttribute('role', 'region');
      scrollEl.setAttribute('aria-label', scrollLabel);
    } else {
      scrollEl.removeAttribute('tabindex');
      scrollEl.removeAttribute('role');
      scrollEl.removeAttribute('aria-label');
    }
  }

  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeIt();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) closeIt();
  });
  dlg.querySelector('.shot-dialog-close').addEventListener('click', closeIt);

  /* promote last: if anything above threw, the links are still links */
  for (const a of links) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = a.className;
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-label', a.getAttribute('aria-label'));
    b.append(...a.childNodes);
    b.addEventListener('click', () => open(b));
    a.replaceWith(b);
  }
}

/* if anything throws, fall back to the static markup: drop html.js and undo what init touched */
try {
  init();
} catch (err) {
  root.classList.remove('js');
  document.querySelector('.nav-overlay')?.remove();
  document.querySelector('dialog.shot-dialog')?.remove();
  document.querySelector('.skills-dots')?.remove();
  document.querySelector('dl.skills')?.removeAttribute('tabindex');
  document.querySelector('dl.skills')?.removeAttribute('role');
  document.querySelector('dl.skills')?.removeAttribute('aria-label');
  document.querySelector('.site-header')?.removeAttribute('data-hidden');
  const kwEl = document.querySelector('#keywords');
  if (kwEl) {
    delete kwEl.dataset.switch;
    delete kwEl.dataset.active;
    kwEl.querySelectorAll('.keyword-block').forEach((b) => delete b.dataset.state);
  }
  console.error(err);
}
