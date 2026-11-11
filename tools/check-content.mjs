// Content check engine: compares index.html with tools/content-manifest.json
// and (when present, local only) the extracted source text.
// Flags: --require-source  fail instead of skipping when the source text is missing.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasPhone, hasPhoneAnywhere } from './check-repo.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HTML_PATH = resolve(ROOT, 'index.html');
const MANIFEST_PATH = resolve(ROOT, 'tools', 'content-manifest.json');
const SOURCE_PATH = resolve(ROOT, '.planning', 'source', 'portfolio-pdf.txt');
const REQUIRE_SOURCE = process.argv.includes('--require-source');

const results = [];
const pass = (name) => results.push({ ok: true, line: `PASS ${name}` });
const fail = (name, detail) => results.push({ ok: false, line: `FAIL ${name}: ${detail}` });
const skip = (name, why) => results.push({ ok: true, line: `SKIP ${name}: ${why}` });

function finish() {
  for (const r of results) (r.ok ? console.log : console.error)(r.line);
  const failed = results.filter((r) => !r.ok).length;
  if (failed) { console.error(`check-content: ${failed} failed`); process.exit(1); }
  const skipped = results.filter((r) => r.line.startsWith('SKIP')).length;
  if (skipped) {
    console.warn(`WARNING: ${skipped} source-dependent check(s) SKIPPED, so site text and numbers were NOT verified against the source.`);
    console.warn('         Run `npm run check:source` on a machine that has .planning/source/portfolio-pdf.txt before publishing.');
  }
  console.log('check-content: all passed');
  process.exit(0);
}

// ---------- helpers ----------
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', copy: '©' };
const decode = (s) =>
  s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, d, h, n) => {
    if (d) return String.fromCodePoint(Number(d));
    if (h) return String.fromCodePoint(parseInt(h, 16));
    return ENTITIES[n.toLowerCase()] ?? m;
  });
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
// remove whitespace, quote marks and separator punctuation for comparison
const normalize = (s) => s.replace(/[\s'‘’"“”·•.,/:]/g, '');

const VOID = new Set(['br', 'meta', 'link', 'img', 'input', 'hr', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'track']);

function parse(html) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const re = /<!\s*[^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>|([^<]+)/g;
  const root = { tag: '#root', attrs: {}, kids: [], parent: null };
  const all = [];
  const texts = [];
  let cur = root;
  let m;
  while ((m = re.exec(cleaned))) {
    if (m[1]) {
      const t = m[1].toLowerCase();
      let n = cur;
      while (n && n.tag !== t) n = n.parent;
      if (n && n.parent) cur = n.parent;
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const attrs = {};
      const ar = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
      let a;
      while ((a = ar.exec(m[3] || ''))) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
      const el = { tag, attrs, kids: [], parent: cur };
      cur.kids.push(el);
      all.push(el);
      if (!VOID.has(tag)) cur = el;
    } else if (m[4] !== undefined) {
      const node = { text: decode(m[4]), parent: cur };
      cur.kids.push(node);
      texts.push(node);
    }
  }
  return { root, all, texts };
}

const isEl = (n) => n.tag !== undefined;
const hasHiddenAncestor = (n) => {
  for (let e = n.parent; e; e = e.parent) {
    if (e.attrs && ('hidden' in e.attrs || e.attrs['aria-hidden'] === 'true')) return true;
  }
  return false;
};
const descendants = (el) => {
  const out = [];
  const walk = (e) => { for (const k of e.kids) { out.push(k); if (isEl(k)) walk(k); } };
  walk(el);
  return out;
};
const textNodesIn = (el) =>
  descendants(el).filter((n) => !isEl(n)).map((n) => collapse(n.text)).filter(Boolean);
const textIn = (el) => collapse(textNodesIn(el).join(' '));
const hasClass = (el, c) => (el.attrs.class || '').split(/\s+/).includes(c);

// ---------- load ----------
if (!existsSync(HTML_PATH)) {
  console.error('FAIL load: index.html not found');
  process.exit(1);
}
const html = readFileSync(HTML_PATH, 'utf8');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const { root, all, texts } = parse(html);
const visibleTexts = texts.filter((n) => !hasHiddenAncestor(n)).map((n) => collapse(n.text)).filter(Boolean);
const byTag = (t) => all.filter((e) => e.tag === t);
const withText = (arr, pred) => arr.find(pred);
const source = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH, 'utf8') : null;

// ---------- checks ----------
const checks = [];
const register = (name, fn) => checks.push([name, fn]);

register('load', () => pass('load'));

register('doctype', () => {
  const first = html.split(/\r?\n/, 1)[0].trim();
  const lang = byTag('html')[0]?.attrs.lang;
  if (first !== '<!DOCTYPE html>') return fail('doctype', 'first line must be <!DOCTYPE html>');
  if (lang !== 'ko') return fail('doctype', 'html lang must be "ko"');
  pass('doctype');
});

register('headings', () => {
  const hs = all.filter((e) => /^h[1-6]$/.test(e.tag));
  const h1 = hs.filter((e) => e.tag === 'h1').length;
  if (h1 !== 1) return fail('headings', `expected exactly one h1, found ${h1}`);
  let prev = 0;
  for (const h of hs) {
    const lvl = Number(h.tag[1]);
    if (lvl > prev + 1) return fail('headings', `heading level jumps from h${prev} to h${lvl}`);
    prev = lvl;
  }
  pass('headings');
});

register('hero', () => {
  const m = manifest.hero;
  if (!m) return skip('hero', 'not in manifest');
  const header = byTag('header')[0];
  if (!header) return fail('hero', 'header missing');
  const h1 = header.kids.length ? descendants(header).find((e) => isEl(e) && e.tag === 'h1') : null;
  if (!h1) return fail('hero', 'h1 not inside header');
  const lines = textNodesIn(h1);
  if (JSON.stringify(lines) !== JSON.stringify(m.lines)) return fail('hero', `h1 lines mismatch: ${JSON.stringify(lines)}`);
  const own = textNodesIn(header);
  for (const key of ['eyebrow', 'subline', 'intro']) {
    if (!own.includes(m[key])) return fail('hero', `${key} text missing`);
  }
  const mail = descendants(header).find((e) => isEl(e) && e.tag === 'a' && e.attrs.href === `mailto:${m.email}`);
  if (!mail || textIn(mail) !== m.email) return fail('hero', 'mailto link missing or link text differs from address');
  pass('hero');
});

register('nav', () => {
  if (!manifest.nav) return skip('nav', 'not in manifest');
  const header = byTag('header')[0];
  const navs = header ? descendants(header).filter((e) => isEl(e) && e.tag === 'nav') : [];
  const nav = navs.find((n) => n.attrs['aria-label']);
  if (!nav) return fail('nav', 'nav[aria-label] missing in header');
  const links = descendants(nav).filter((e) => isEl(e) && e.tag === 'a').map((a) => ({ href: a.attrs.href, text: textIn(a) }));
  if (JSON.stringify(links) !== JSON.stringify(manifest.nav)) return fail('nav', `nav links differ: ${JSON.stringify(links)}`);
  pass('nav');
});

register('sections', () => {
  if (!manifest.sections) return skip('sections', 'not in manifest');
  const main = byTag('main')[0];
  if (!main) return fail('sections', 'main missing');
  const ids = main.kids.filter((k) => isEl(k) && k.tag === 'section').map((s) => s.attrs.id);
  if (JSON.stringify(ids) !== JSON.stringify(manifest.sections)) return fail('sections', `section ids ${JSON.stringify(ids)}`);
  pass('sections');
});

const elsIn = (el, tag) => descendants(el).filter((e) => isEl(e) && e.tag === tag);
const sectionById = (id) => all.find((e) => e.tag === 'section' && e.attrs.id === id);
const timesOf = (el) => elsIn(el, 'time').map((t) => t.attrs.datetime);

function checkSkills() {
  if (!manifest.skills) return skip('skills', 'not in manifest');
  const sec = sectionById('skills');
  if (!sec) return fail('skills', 'section#skills missing');
  const sm = manifest.skillsSection;
  if (sm) {
    const own = textNodesIn(sec);
    if (!own.includes(sm.eyebrow)) return fail('skills', 'eyebrow text missing');
    const h2 = elsIn(sec, 'h2')[0];
    if (!h2 || textIn(h2) !== sm.title) return fail('skills', 'h2 title mismatch');
  }
  const dl = elsIn(sec, 'dl')[0];
  if (!dl) return fail('skills', 'dl missing');
  const groups = dl.kids.filter(isEl).flatMap((k) => (k.tag === 'div' ? k.kids.filter(isEl) : [k]));
  const dts = groups.filter((g) => g.tag === 'dt').map(textIn);
  if (JSON.stringify(dts) !== JSON.stringify(manifest.skills.map((s) => s.category))) {
    return fail('skills', `categories differ: ${JSON.stringify(dts)}`);
  }
  const dds = groups.filter((g) => g.tag === 'dd');
  if (dds.length !== manifest.skills.length) return fail('skills', 'dd count differs');
  for (let i = 0; i < dds.length; i++) {
    const items = elsIn(dds[i], 'li').map(textIn);
    if (JSON.stringify(items) !== JSON.stringify(manifest.skills[i].items)) {
      return fail('skills', `items differ in ${manifest.skills[i].category}: ${JSON.stringify(items)}`);
    }
  }
  if (textIn(sec).includes('%') || elsIn(sec, 'meter').length || elsIn(sec, 'progress').length) {
    return fail('skills', 'percent or gauge element present');
  }
  pass('skills');
}
register('skills', checkSkills);

function checkCareer() {
  if (!manifest.companies) return skip('career', 'not in manifest');
  const sec = sectionById('career');
  if (!sec) return fail('career', 'section#career missing');
  const cm = manifest.careerSection;
  if (cm) {
    if (!textNodesIn(sec).includes(cm.eyebrow)) return fail('career', 'eyebrow text missing');
    const h2 = elsIn(sec, 'h2')[0];
    if (!h2 || textIn(h2) !== cm.title) return fail('career', 'h2 title mismatch');
  }
  const ol = elsIn(sec, 'ol')[0];
  const lis = ol ? ol.kids.filter((k) => isEl(k) && k.tag === 'li') : [];
  if (lis.length !== manifest.companies.length) return fail('career', `expected ${manifest.companies.length} items, found ${lis.length}`);
  for (let i = 0; i < lis.length; i++) {
    const c = manifest.companies[i];
    const a = elsIn(lis[i], 'a')[0];
    if (!a || a.attrs.href !== `#${c.id}` || textIn(a) !== c.name) return fail('career', `link mismatch for ${c.id}`);
    if (!textIn(lis[i]).includes(c.summary)) return fail('career', `summary missing for ${c.id}`);
    if (JSON.stringify(timesOf(lis[i])) !== JSON.stringify([c.from, c.to])) return fail('career', `period mismatch for ${c.id}`);
  }
  pass('career');
}
register('career', checkCareer);

function checkCompanies() {
  if (!manifest.companies) return skip('companies', 'not in manifest');
  for (const c of manifest.companies) {
    const sec = sectionById(c.id);
    if (!sec) return fail('companies', `section#${c.id} missing`);
    const eyebrow = elsIn(sec, 'p').find((p) => hasClass(p, 'eyebrow'));
    if (!eyebrow || textIn(eyebrow) !== c.number) return fail('companies', `eyebrow mismatch for ${c.id}`);
    const h2 = elsIn(sec, 'h2')[0];
    if (!h2 || textIn(h2) !== `${c.name}.`) return fail('companies', `h2 mismatch for ${c.id}`);
    const period = elsIn(sec, 'p').find((p) => hasClass(p, 'period'));
    if (!period || JSON.stringify(timesOf(period)) !== JSON.stringify([c.from, c.to])) return fail('companies', `period mismatch for ${c.id}`);
    const own = textNodesIn(sec);
    for (const other of manifest.companies) {
      if (!other.description) continue;
      const has = own.includes(other.description);
      if (other.id === c.id && !has) return fail('companies', `description missing for ${c.id}`);
      if (other.id !== c.id && has) return fail('companies', `description of ${other.id} appears in ${c.id}`);
    }
  }
  pass('companies');
}
register('companies', checkCompanies);

function checkProjects() {
  if (!manifest.projects) return skip('projects', 'not in manifest');
  const arts = all.filter((e) => e.tag === 'article' && hasClass(e, 'project'));
  if (arts.length !== manifest.projects.length) return fail('projects', `expected ${manifest.projects.length} articles, found ${arts.length}`);
  const labels = manifest.statusLabels || {};
  const companyName = (id) => manifest.companies.find((c) => c.id === id).name;
  const seenPerCompany = {};
  for (const pm of manifest.projects) {
    const f = (msg) => fail('projects', `${pm.id}: ${msg}`);
    const art = arts.find((a) => a.attrs.id === pm.id);
    if (!art) return f('article missing');
    let sec = art.parent;
    while (sec && sec.tag !== 'section') sec = sec.parent;
    if (!sec || sec.attrs.id !== pm.company) return f(`not inside section#${pm.company}`);
    const order = (seenPerCompany[pm.company] ||= []);
    order.push(pm.id);
    const inSec = arts.filter((a) => { let n = a.parent; while (n && n.tag !== 'section') n = n.parent; return n === sec; }).map((a) => a.attrs.id);
    if (JSON.stringify(inSec.slice(0, order.length)) !== JSON.stringify(order)) return f('order inside company differs from manifest');
    if (art.attrs['data-platform'] !== pm.platform) return f('data-platform differs');
    if (art.attrs['data-status'] !== pm.status || !(pm.status in labels)) return f('data-status differs or unknown');
    if (art.attrs['aria-labelledby'] !== `${pm.id}-title`) return f('aria-labelledby differs');
    const kids = art.kids.filter(isEl);
    // live: no badge, status-links only when there is a link. Other statuses always have a badge.
    const hasStatusBox = pm.status !== 'live' || Boolean(pm.link);
    const wantTags = ['h3', 'dl', 'div', 'figure'].concat(hasStatusBox ? ['div'] : []);
    if (JSON.stringify(kids.map((k) => k.tag)) !== JSON.stringify(wantTags)) return f(`child order is ${kids.map((k) => k.tag).join(',')}`);
    const [h3, dl, point, fig, status] = kids;
    if (h3.attrs.id !== `${pm.id}-title` || normalize(textIn(h3)) !== normalize(pm.name)) return f('h3 differs');
    if (!hasClass(dl, 'meta')) return f('dl.meta missing');
    if (!hasClass(point, 'point')) return f('div.point missing');
    if (!hasClass(fig, 'shot') || fig.attrs['data-frame'] !== pm.platform) return f('figure.shot or data-frame differs');
    const rows = dl.kids.filter(isEl).filter((d) => d.tag === 'div');
    const dts = rows.map((r) => textIn(elsIn(r, 'dt')[0]));
    const want = ['소속', '플랫폼'].concat(pm.description ? ['담당 업무'] : [], ['퍼블 기여도']);
    if (JSON.stringify(dts) !== JSON.stringify(want)) return f(`dt order is ${JSON.stringify(dts)}`);
    const dd = (i) => elsIn(rows[i], 'dd')[0];
    if (textIn(dd(0)) !== companyName(pm.company)) return f('affiliation differs');
    if (textIn(dd(1)) !== (pm.platform === 'app' ? 'App' : 'Web')) return f('platform text differs');
    if (pm.description && normalize(textIn(dd(2))) !== normalize(pm.description)) return f('description differs');
    const cd = dd(rows.length - 1);
    const data = elsIn(cd, 'data')[0];
    if (!data || data.attrs.value !== String(pm.contribution) || textIn(data) !== `${pm.contribution}%`) return f('contribution differs');
    const rest = collapse(textNodesIn(cd).join(' ')).replace(`${pm.contribution}%`, '').trim();
    const wantRest = pm.contributionContext ? `· ${pm.contributionContext}` : '';
    if (rest !== wantRest) return f(`contribution context differs: "${rest}"`);
    if (!hasStatusBox) {
      if (elsIn(art, 'a').length) return f('project without status box must have no link');
      if (elsIn(art, 'p').some((q) => hasClass(q, 'status'))) return f('live project must not show a status badge');
      continue;
    }
    const badge = elsIn(status, 'p').find((q) => hasClass(q, 'status'));
    if (!hasClass(status, 'status-links')) return f('status-links wrapper missing');
    if (pm.status === 'live') {
      if (badge) return f('live project must not show a status badge');
    } else if (!badge || textIn(badge) !== labels[pm.status]) {
      return f('status badge differs');
    }
    const links = elsIn(status, 'a');
    if (!pm.link) {
      if (links.length) return f('unexpected link');
    } else {
      if (links.length !== 1 || links[0].attrs.href !== pm.link.href) return f('link href differs');
      const label = collapse(textNodesIn(links[0]).filter((t) => t !== '(새 탭)').join(' '));
      if (label !== pm.link.label) return f('link text differs');
    }
  }
  pass('projects');
}
register('projects', checkProjects);

register('contact', () => {
  const m = manifest.contact;
  if (!m) return skip('contact', 'not in manifest');
  const sec = all.find((e) => e.tag === 'section' && e.attrs.id === 'contact');
  if (!sec) return fail('contact', 'section#contact missing');
  const own = textNodesIn(sec);
  for (const key of ['eyebrow', 'title', 'message', 'emailLabel']) {
    if (!own.includes(m[key])) return fail('contact', `${key} text missing`);
  }
  const h2 = descendants(sec).find((e) => isEl(e) && e.tag === 'h2');
  if (!h2 || textIn(h2) !== m.title) return fail('contact', 'h2 title mismatch');
  const mail = descendants(sec).find((e) => isEl(e) && e.tag === 'a' && e.attrs.href === `mailto:${m.email}`);
  if (!mail || textIn(mail) !== m.email) return fail('contact', 'mailto link missing or link text differs from address');
  pass('contact');
});

register('footer', () => {
  if (!manifest.footer) return skip('footer', 'not in manifest');
  const f = byTag('footer')[0];
  if (!f) return fail('footer', 'footer missing');
  if (textIn(f) !== manifest.footer) return fail('footer', 'footer text differs');
  const count = visibleTexts.filter((t) => t.includes(manifest.footer)).length;
  if (count !== 1) return fail('footer', `copyright appears ${count} times (expected 1)`);
  pass('footer');
});

register('links', () => {
  const anchors = byTag('a').filter((a) => a.attrs.href !== undefined);
  const allowed = new Set(manifest.links || []);
  const seen = new Set();
  for (const a of anchors) {
    const href = a.attrs.href;
    for (const bad of manifest.forbiddenHrefs || []) {
      if (href.includes(bad)) return fail('links', `forbidden href fragment "${bad}"`);
    }
    if (/^https?:\/\//i.test(href)) {
      seen.add(href);
      if (a.attrs.target !== '_blank' || !(a.attrs.rel || '').split(/\s+/).includes('noopener')) {
        return fail('links', `external link needs target=_blank and rel=noopener: ${href}`);
      }
    }
  }
  const same = seen.size === allowed.size && [...seen].every((u) => allowed.has(u));
  if (!same) return fail('links', `external links differ from manifest (found ${seen.size}, allowed ${allowed.size})`);
  pass('links');
});

register('anchors', () => {
  const ids = all.filter((e) => e.attrs.id !== undefined).map((e) => e.attrs.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) return fail('anchors', `duplicate id "${dup}"`);
  for (const a of byTag('a')) {
    const h = a.attrs.href;
    if (h && h.startsWith('#') && h.length > 1 && !ids.includes(h.slice(1))) return fail('anchors', `no element for ${h}`);
  }
  pass('anchors');
});

register('paths', () => {
  for (const el of all) {
    for (const key of ['src', 'href', 'srcset', 'poster']) {
      const v = el.attrs[key];
      if (v === undefined) continue;
      if ((v.startsWith('/') && !v.startsWith('//')) || v.includes('\\')) return fail('paths', `${key} must be a relative path: ${v}`);
    }
  }
  pass('paths');
});

register('slots', () => {
  const phone = all.filter((e) => e.attrs['data-slot'] === 'phone');
  if (phone.length !== 1) return fail('slots', `expected one data-slot="phone", found ${phone.length}`);
  if (!('hidden' in phone[0].attrs)) return fail('slots', 'phone slot must have hidden');
  if (textIn(phone[0]) !== '' || descendants(phone[0]).some(isEl)) return fail('slots', 'phone slot must be empty');
  for (const pm of manifest.projects || []) {
    const art = all.find((e) => e.tag === 'article' && e.attrs.id === pm.id);
    if (!art) continue;
    const pt = descendants(art).find((e) => isEl(e) && e.attrs['data-slot'] === 'point');
    if (!pt) return fail('slots', `${pm.id}: point slot missing`);
    if (pm.point === null && (!('hidden' in pt.attrs) || textIn(pt) !== '' || descendants(pt).some(isEl))) {
      return fail('slots', `${pm.id}: empty point slot must be hidden and empty`);
    }
    const shot = descendants(art).find((e) => isEl(e) && e.attrs['data-slot'] === 'screenshot');
    if (!shot || descendants(shot).length) return fail('slots', `${pm.id}: screenshot slot missing or not empty`);
  }
  for (const el of all) {
    if ('hidden' in el.attrs && textIn(el) !== '') return fail('slots', `hidden <${el.tag}> contains text`);
  }
  pass('slots');
});

register('phone', () => {
  if (byTag('a').some((a) => (a.attrs.href || '').toLowerCase().startsWith('tel:'))) return fail('phone', 'tel: link present');
  // per text node, per raw line (attributes/comments), and on whole-document text so a number
  // split across tags, lines or encoded as entities is still caught (hidden elements included)
  if (
    visibleTexts.some((t) => hasPhone(t)) ||
    html.split(/\r?\n/).some((l) => hasPhone(l)) ||
    hasPhone(textIn(root)) ||
    hasPhoneAnywhere(html)
  ) {
    return fail('phone', 'phone-like pattern in index.html');
  }
  pass('phone');
});

register('forbidden', () => {
  for (const bad of manifest.forbiddenText || []) {
    if (visibleTexts.some((t) => t.includes(bad))) return fail('forbidden', `forbidden text "${bad}"`);
  }
  pass('forbidden');
});

const sourceGate = (name) => {
  if (source !== null) return true;
  if (REQUIRE_SOURCE) fail(name, 'source text required but not found');
  else skip(name, 'source text not found (local-only check)');
  return false;
};

register('source-reverse', () => {
  if (!sourceGate('source-reverse')) return;
  const src = normalize(source);
  const allow = new Set((manifest.uiAllowlist || []).map(normalize));
  for (const s of manifest.sourceStrings || []) {
    if (!src.includes(normalize(s))) return fail('source-reverse', `sourceStrings entry not in source: "${s}"`);
  }
  // segment level: a site text must sit inside one source line or a window of up to 3
  // consecutive lines (wrapped paragraphs), not anywhere in the whole source
  const lines = source.split(/\r?\n/).map(normalize);
  const windows = new Set();
  for (let i = 0; i < lines.length; i++) {
    for (let w = 1; w <= 3 && i + w <= lines.length; w++) windows.add(lines.slice(i, i + w).join(''));
  }
  const inSource = (n) => [...windows].some((w) => w.includes(n));
  for (const t of visibleTexts) {
    const n = normalize(t);
    if (n === '' || /^[\d\W_]*$/u.test(n)) continue;
    if (inSource(n) || allow.has(n)) continue;
    return fail('source-reverse', `text not in source or allowlist: "${t}"`);
  }
  pass('source-reverse');
});

register('source-numbers', () => {
  if (!sourceGate('source-numbers')) return;
  const NUM = /\d+(?:\.\d+)*%?/g;
  const srcNums = new Set(
    source
      .split(/\r?\n/)
      .filter((l) => !hasPhone(l)) // phone digit groups must not whitelist site numbers
      .join('\n')
      .replace(/(\d)\.\s+(\d)/g, '$1.$2')
      .match(NUM) || []
  );
  for (const t of visibleTexts) {
    for (const n of t.match(NUM) || []) {
      if (!srcNums.has(n)) return fail('source-numbers', `number "${n}" not in source`);
    }
  }
  pass('source-numbers');
});

register('source-coverage', () => {
  if (!sourceGate('source-coverage')) return;
  const cov = manifest.sourceCoverage;
  if (!cov) return fail('source-coverage', 'sourceCoverage missing in manifest');
  const src = normalize(source);
  const siteText = visibleTexts.map(normalize).join('');
  let siteN = 0;
  let excludedN = 0;
  for (const c of cov) {
    const n = normalize(c.text);
    if (!src.includes(n)) return fail('source-coverage', `table entry not in source: "${c.text}"`);
    if (c.status === 'site') {
      siteN++;
      if (!siteText.includes(n)) return fail('source-coverage', `missing ${c.text}`);
    } else if (c.status === 'excluded') {
      excludedN++;
      if (!c.reason) return fail('source-coverage', `excluded entry without reason: "${c.text}"`);
    } else return fail('source-coverage', `bad status for "${c.text}"`);
  }
  const frags = cov.map((c) => normalize(c.text)).filter(Boolean).sort((a, b) => b.length - a.length);
  const pats = (manifest.excludedPatterns || []).map((e) => new RegExp(e.pattern, 'g'));
  const unmapped = [];
  source.split(/\r?\n/).forEach((line, i) => {
    if (hasPhone(line)) return; // never echoed
    let t = line;
    for (const re of pats) t = t.replace(re, ' ');
    t = normalize(t);
    for (const f of frags) t = t.split(f).join('');
    if (t.replace(/[\d\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e…]/g, '') !== '') {
      // never echo digits from the source: hide phone-like lines, redact every digit elsewhere
      unmapped.push(
        hasPhone(t) || hasPhoneAnywhere(t) ? `line ${i + 1} (content hidden)` : `line ${i + 1}: "${t.replace(/\d/g, '#')}"`
      );
    }
  });
  if (unmapped.length) return fail('source-coverage', `unmapped source text on ${unmapped.join('; ')}`);
  pass(`source-coverage (site ${siteN} / excluded ${excludedN} / unmapped 0)`);
});

for (const [name, fn] of checks) {
  try { fn(); } catch (e) { fail(name, `exception: ${e.message}`); }
}
finish();
