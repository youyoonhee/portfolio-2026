// figure.shot markup helpers shared by tools/optimise-images.mjs (and later checks).
// Pure string functions: no sharp import, no file access.

export const WEB_WIDTHS = [480, 960, 1440, 1920];
export const APP_WIDTHS = [360, 540, 720, 1080];
export const SRC_WIDTH = { web: 960, app: 540 };
export const PRINT_MAX = { web: 960, app: 720 };
export const WEB_SIZES =
  '(min-width: 1264px) 334px, (min-width: 984px) calc((100vw - 112px) / 3 - 50px), (min-width: 664px) calc(50vw - 94px), calc(90vw - 34px)';
export const APP_SIZES = '200px';

const DEFAULT_BASE = (id) => `img/projects/${id}/`;

export function ladder(frame, srcWidth) {
  const steps = frame === 'app' ? APP_WIDTHS : WEB_WIDTHS;
  return [...new Set(steps.map((w) => Math.min(w, srcWidth)))].sort((a, b) => a - b);
}

export function emptyFigure(frame) {
  return `<figure class="shot" data-slot="screenshot" data-frame="${frame}" aria-hidden="true"></figure>`;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export function articleIds(html) {
  return [...html.matchAll(/<article\s+class="project"\s+id="([^"]+)"/g)].map((m) => m[1]);
}

function articleRange(html, id) {
  const re = new RegExp(`<article\\s+class="project"\\s+id="${id.replace(/[^a-z0-9-]/gi, '')}"`);
  const m = re.exec(html);
  if (!m) throw new Error(`article "${id}" not found`);
  const end = html.indexOf('</article>', m.index);
  if (end < 0) throw new Error(`article "${id}" is not closed`);
  return { start: m.index, end: end + '</article>'.length };
}

const FIGURE_RE = /<figure class="shot"[^>]*>[\s\S]*?<\/figure>/g;

export function readArticle(html, id) {
  const range = articleRange(html, id);
  const body = html.slice(range.start, range.end);
  const figs = [...body.matchAll(FIGURE_RE)];
  if (figs.length !== 1) throw new Error(`article "${id}": expected exactly one figure.shot, found ${figs.length}`);
  const fm = /data-frame="(web|app)"/.exec(figs[0][0]);
  if (!fm) throw new Error(`article "${id}": figure has no data-frame`);
  const t = new RegExp(`<h3 id="${id}-title">([\\s\\S]*?)</h3>`).exec(body);
  if (!t) throw new Error(`article "${id}": h3 title not found`);
  const figStart = range.start + figs[0].index;
  return {
    frame: fm[1],
    title: unesc(t[1].replace(/<[^>]*>/g, '').trim()),
    figure: figs[0][0],
    start: figStart,
    end: figStart + figs[0][0].length,
  };
}

export function figureMarkup({ id, frame, title, alt, files, base }) {
  const dir = base || DEFAULT_BASE(id);
  const sorted = [...files].sort((a, b) => a.w - b.w);
  const big = sorted[sorted.length - 1];
  const fit = sorted.filter((f) => f.w <= SRC_WIDTH[frame]);
  const src = fit.length ? fit[fit.length - 1] : sorted[0];
  const set = (ext) => sorted.map((f) => `${dir}${id}-${f.w}.${ext} ${f.w}w`).join(', ');
  const sizes = frame === 'app' ? APP_SIZES : WEB_SIZES;
  const i = (n) => ' '.repeat(10 + n * 2);
  return [
    `<figure class="shot" data-slot="screenshot" data-frame="${frame}">`,
    `${i(1)}<a class="shot-link" href="${esc(`${dir}${id}-${big.w}.jpg`)}" aria-label="${esc(`${title} 화면 크게 보기`)}">`,
    `${i(2)}<picture>`,
    `${i(3)}<source type="image/webp" srcset="${esc(set('webp'))}" sizes="${esc(sizes)}">`,
    `${i(3)}<img src="${esc(`${dir}${id}-${src.w}.jpg`)}" srcset="${esc(set('jpg'))}" sizes="${esc(sizes)}" alt="${esc(alt)}" width="${src.w}" height="${src.h}" loading="lazy" decoding="async">`,
    `${i(2)}</picture>`,
    `${i(1)}</a>`,
    `${i(0)}</figure>`,
  ].join('\n');
}

export function replaceFigure(html, id, markup) {
  const { start, end } = readArticle(html, id);
  return html.slice(0, start) + markup + html.slice(end);
}
