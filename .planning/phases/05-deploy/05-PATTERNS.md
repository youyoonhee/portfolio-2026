# Phase 5: 검증과 배포 - Pattern Map

**Mapped:** 2026-11-16
**Files analyzed:** 27 (new or modified)
**Analogs found:** 25 / 27 (2 have no in-repo analog: the workflow YAML and the OG HTML card; RESEARCH.md Pattern 1 / Pattern 5 supply those)

Privacy note: no phone-like literal, digest or private value appears below. The phone detection in `tools/check-repo.mjs` is referenced by function name only (`hasPhone`, `hasPhoneAnywhere`, `scanBuffer`, `normalizeForPhone`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tools/check-repo.mjs` (add `--dir <path>`) | utility (privacy gate) | batch (file walk) | itself, `scanTree()` | exact |
| `tools/stage-pages.mjs` | utility (build script) | file-I/O (allowlist copy) | `tools/copy-fonts.mjs` | role-match |
| `tools/check-artifact.mjs` (+ `--self-test`) | test/check | batch (dir walk), RED/GREEN | `tools/check-images.mjs` | exact (self-test shape) |
| `tools/check-network.mjs` | test/check | event-driven (puppeteer response events) | `tools/check-ui.mjs` + `tools/lib/browser.mjs` | role-match |
| `tools/check-preview.mjs` | test/check | request-response (fetch + sharp) | `tools/check-images.mjs` + `check-content.mjs` helpers | role-match |
| `tools/colophon-sync.mjs` | utility | transform (JSON to HTML) | `tools/optimise-images.mjs` (HTML rewrite) | role-match |
| `tools/measurements.json` | config (record) | CRUD (hand/tool written) | `tools/screenshots.json`, `tools/content-manifest.json` | role-match |
| `tools/make-og.mjs` (or extend `optimise-images.mjs`) | utility | file-I/O + render | `tools/build-pdf.mjs` (Chrome render) + `optimise-images.mjs` (sharp) | role-match |
| `tools/og-card.html` | component (render source, not shipped) | static | none in repo | no analog |
| `tools/check-content.mjs` (modify) | test/check | batch | itself (`footer`, `sections`, `source-*`) | exact |
| `tools/content-manifest.json` (modify) | config | static | itself | exact |
| `index.html` (head meta, `#colophon`, footer link) | component/markup | static | itself (`#contact`, `.meta`, `<footer>`) | exact |
| `404.html` | component/markup | static | `index.html` head + `tokens.css` values | role-match |
| `css/components.css` (colophon dl) | component CSS | static | `.meta`, `.skills ul`, `.contact-list dt` | exact |
| `css/layout.css` (colophon section, footer link) | layout CSS | static | `#contact`, `body > footer` | exact |
| `css/print.css` (hide colophon) | config CSS | static | `body > footer` rule (line 184) | exact |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | asset | file-I/O | none (sharp raster via `optimise-images.mjs` pattern) | partial |
| `img/og-card.png` | asset | file-I/O | none (generated) | partial |
| `robots.txt` | config | static | none | no analog (2 lines) |
| `.github/workflows/pages.yml` | config (CI) | event-driven | `.githooks/pre-push` (same gate order) | partial |
| `README.md` | doc | static | `tools/contact.example.json` + CLAUDE.md prose | partial |
| `package.json` (scripts) | config | static | itself | exact |
| `.githooks/pre-push` (optional extend) | hook | batch | itself | exact |
| `.planning/phases/05-deploy/05-HUMAN-UAT.md` | doc | static | `04-HUMAN-UAT.md` (not read, per planner) | role-match |

## Pattern Assignments

### `tools/check-repo.mjs` -- add `--dir <path>` (utility, batch)

**Analog:** the same file, `scanTree()` (lines 240-261) and the CLI dispatch (lines 263-267).

**Core loop to mirror** (lines 246-260). The new `scanDir(root)` must keep the same properties: label-only output, fail closed, counts only.
```js
let bad = 0;
for (const f of files) {
  if (FORBIDDEN.test(f)) { console.error(`forbidden path: ${f}`); bad++; continue; }
  if (hasPhone(f)) { console.error('file name: phone-like pattern'); bad++; }
  ...
  let buf;
  try { buf = staged ? gitBuf(['show', `:${f}`]) : readFileSync(f); }
  catch (e) { console.error(`cannot read ${f}: ${e.code || 'error'} (scan fails closed)`); bad++; continue; }
  bad += scanBuffer(f, f, buf);
}
if (bad) { console.error(`BLOCKED: ${bad} problem(s)`); process.exit(1); }
console.log(`check-repo: ${files.length} file(s) clean`);
```

**Dispatch to extend** (lines 263-267):
```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) selfTest();
  else if (process.argv.includes('--history')) scanHistory();
  else scanTree(process.argv.includes('--staged'));
}
```
Add `else if (i = argv.indexOf('--dir')) scanDir(argv[i+1])`. Differences from `scanTree`: list files by recursive `readdirSync`/`lstatSync` (include dotfiles; any symlink is an error) instead of `git ls-files`; do NOT apply `NAME_OK` (artifact has no kebab rule needs; keep optional); keep `FORBIDDEN` and `.pdf` rejection. Report the path with the relative label, never the matched text. Add a self-test case that builds a temp dir with a phone-shaped string assembled at runtime (see `d(...)` helper at lines 126-130) and expects non-zero exit.

**Constraint:** the file's only imports are `node:*` (lines 7-9), so CI needs no `npm ci` (confirms RESEARCH A7).

---

### `tools/check-artifact.mjs` (test/check, batch, RED/GREEN self-test)

**Analog:** `tools/check-images.mjs`. Same CLI shape: `run(root, extra)` spawns itself with `--root`, then `selfTest()` builds a clean fixture in `mkdtempSync(join(tmpdir(), ...))`, and a `neg(name, mutate, { rule })` helper asserts each mutation fails with a named rule.

**Self-test harness to copy** (check-images.mjs lines 179-189):
```js
function run(root, extra = []) {
  const r = spawnSync(process.execPath, [SELF, '--root', root, ...extra], { encoding: 'utf8' });
  return { code: r.status, all: `${r.stdout || ''}${r.stderr || ''}` };
}
async function selfTest() {
  const base = mkdtempSync(join(tmpdir(), 'check-images-'));
  const results = [];
  const t = (name, ok) => results.push([name, Boolean(ok)]);
  try { ... } finally { rmSync(base, { recursive: true, force: true }); }
```
**Runtime-assembled phone positive** (lines 279-286): never write a literal; assert `!r.all.includes(phone)` so the tool proves it does not echo the value:
```js
const phone = `${'0' + 1 + 0}-${'1234'}-${'5678'}`;   // pattern only; do not copy digits into docs
...
t('phone-like manifest text', r.code === 1 && r.all.includes('phone-like-text') && !r.all.includes(phone));
```
**Entry point + exit codes** (lines 318-329): `process.exitCode = parsed.o['self-test'] ? await selfTest() : await runAudit(parsed.o);` with exit 2 for usage errors, 1 for failures.

**Output convention:** `PASS name` / `FAIL name` lines and a final `check-artifact self-test: N passed` count.

**Negatives to include (from RESEARCH Pattern 3):** stray `tools/x.mjs`, `package.json`, `a.pdf`, `.env`, symlink, a missing `index.html`/`404.html`/`img/og-card.png`, a path with different case than its CSS `url()` reference. Walk the OUTPUT directory, not the source list.

---

### `tools/stage-pages.mjs` (utility, file-I/O)

**Analog:** `tools/copy-fonts.mjs` (58 lines, copies a fixed file set into the repo; reuse its argv/dir handling style). Allowlist per RESEARCH Pattern 3: root `index.html 404.html robots.txt favicon.svg favicon-32.png apple-touch-icon.png`; `css/*.css`; `js/*.js`; `fonts/**` (`.woff2 .ttf .txt`); `img/**` (`.avif .webp .jpg .png`). Output default `dist/site` (`dist/` is gitignored and in `FORBIDDEN`, so it can never be committed). Use an explicit extension map; copy nothing by directory wildcard alone. Fail if `dist/site` argument resolves outside `dist/` (copy the guard idea from `check-layout.mjs` lines 23-31, `--shots must be inside dist`).

**Guard to copy** (check-layout.mjs lines 23-31):
```js
const dir = resolve(shots);
const dist = join(ROOT, 'dist');
if (dir !== dist && !dir.startsWith(dist + sep)) {
  console.error(`--shots must be inside ${dist}`);
  process.exit(2);
}
```
**ROOT derivation** (check-layout.mjs line 12): `const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');`

---

### `tools/check-network.mjs` (test/check, event-driven)

**Analog:** `tools/check-ui.mjs` (launch/teardown/page-context skeleton, lines 105-115) and `tools/lib/browser.mjs`. Existing tools do not record responses (only `page.on('request')`, check-ui lines 77/778), and both start their own server, so this takes a URL argument.

**Imports** (check-ui.mjs lines 10-11):
```js
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';
```
**Per-context page helper** (check-ui.mjs lines 96-108): use `browser.createBrowserContext()` so each viewport has an empty cache (no 304s hiding 404s):
```js
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
...
try { await fn(page); } finally { await ctx.close().catch(() => {}); }
```
**Teardown** (check-ui.mjs 110-115, 797-802): `let browser; try { browser = await launchChrome(); ... } finally { await closeBrowser(browser); } process.exitCode = failures ? 1 : 0;`

**Core capture:** copy the `response`/`requestfailed` listener block from RESEARCH.md "Network 404 capture" (status >= 400, `r.failure()?.errorText`); scroll the whole page so unicode-range font subsets and lazy images load. Exclude the intentional nested-path 404 probe. Local mode (no URL arg) can start `startStaticServer(ROOT)` like check-ui line 110.

**Edge:** `launchChrome` honours `CHROME_PATH` (browser.mjs lines 13-15), so the Edge attempt is `CHROME_PATH=<msedge.exe> node tools/check-network.mjs` with an external timeout. The file header (line 1) documents that Edge hangs; record `method:"headless"` only for runs that actually ran.

---

### `tools/check-preview.mjs` (test/check, request-response)

**Analog:** `tools/check-images.mjs` for sharp metadata assertions and rule-named failures; `tools/check-content.mjs` for `hasPhone`/`hasPhoneAnywhere` reuse.

**Cross-tool import of the phone matcher** (check-content.mjs line 10, optimise-images.mjs line 22):
```js
import { hasPhone, hasPhoneAnywhere } from './check-repo.mjs';
```
`check-repo.mjs` guards its CLI with `import.meta.url === pathToFileURL(process.argv[1]).href` (line 263), so importing it has no side effects.

**sharp usage** (optimise-images.mjs line 21, 520): `import sharp from 'sharp'; const outW = (await sharp(buf).metadata()).width;`

Two modes: local file mode (read `index.html`, `img/og-card.png`) and URL mode (fetch + HEAD). Assertions: og strings equal cover strings, `og:image` absolute and under the D-01 base, PNG 1200x630, size under 150KB local (300KB served), 180px icon `hasAlpha === false`, no `@` or phone-like text in any tag value (use `hasPhoneAnywhere`, print only the tag name).

---

### `tools/colophon-sync.mjs` + `tools/measurements.json` (utility, transform)

**Analog for the JSON record:** `tools/screenshots.json` / `tools/content-manifest.json` (committed JSON next to the tools, read with `JSON.parse(readFileSync(join(ROOT,'tools','...'),'utf8'))`, e.g. check-layout.mjs line 42). Schema is fixed by UI-SPEC (`measuredAt`, `lighthouse{form,performance,accessibility,bestPractices,seo}`, `validator{htmlErrors,brokenLinks}`, `browsers[{name,version,tested,method}]`), all measured values `null` before measurement.

**Analog for rewriting HTML in place:** `tools/optimise-images.mjs` (`--html <file>` rewrite of the `figure` slots, exercised by check-images lines 206-211 and `replaceFigure`/`readArticle` imported from `tools/lib/shot-markup.mjs`). Follow its shape: a pure function (record, html) -> html, a `--check` mode that fails if output differs from the file (idempotence), and a write mode. Replace only the measured `dd` cells, found by a stable attribute (for example `data-measured="lighthouse"`), never by free-text search. Write and read with `\n` endings and no BOM.

Pre-measurement state must render only `측정 전` / `확인 전` with no `data` element (UI-SPEC "empty state").

---

### `tools/make-og.mjs` (utility, file-I/O + render)

**Analog:** `tools/build-pdf.mjs` (static server + `launchChrome` + font wait + sharp post-step; imports at lines 8-15):
```js
import sharp from 'sharp';
import { startStaticServer } from './lib/static-server.mjs';
import { launchChrome, closeBrowser } from './lib/browser.mjs';
```
Serve `ROOT` with `startStaticServer(ROOT)`, open `/tools/og-card.html` (static-server permits `tools/`; it denies only dot-segments and `private`, `_screenshots`, `node_modules`, `dist`, `out`, `.planning`, `.git`, `.taste-skill`, `.private`, lines 24-26). Note: `MIME` lacks `.txt/.json/.ico/.webmanifest` (lines 11-23); `.svg` and `.png` are present. Use the screenshot recipe in RESEARCH Pattern 5, then `sharp(buf).png({palette:true,...}).toFile('img/og-card.png')` and assert 1200x630.

Favicon PNGs: `sharp(Buffer.from(svg), { density: 384 }).resize(32, 32).png()`; the 180px icon built from a second SVG string without `rx`, then `.removeAlpha()`.

---

### `tools/og-card.html` (render source) -- no analog

Use the font stack from `css/fonts-print.css` (family `"Pretendard Print"`, weights 400 and 600, `url(../fonts/print/pretendard-regular.ttf)`), which is the family that already survives headless Chrome rendering:
```css
@font-face { font-family: "Pretendard Print"; font-weight: 600;
  src: url(../fonts/print/pretendard-semibold.ttf) format("truetype"); }
```
Link `../css/fonts-print.css` and `../css/tokens.css` from the file. Exactly three text items per UI-SPEC section 3. This file is excluded from the Pages allowlist (it lives in `tools/`).

---

### `tools/check-content.mjs` + `tools/content-manifest.json` (modify)

**Analog:** itself. Registration pattern (line 124): `register(name, fn)`; result helpers (lines 24-26): `pass`, `fail`, `skip`.

**Three breakage points the Colophon will cause:**

1. `footer` check (lines 441-449) compares whole footer text, so adding `<p><a href="#colophon">사이트 정보</a></p>` fails it:
```js
if (textIn(f) !== manifest.footer) return fail('footer', 'footer text differs');
const count = visibleTexts.filter((t) => t.includes(manifest.footer)).length;
if (count !== 1) return fail('footer', `copyright appears ${count} times (expected 1)`);
```
Change to compare only the copyright `<p>` text, then assert exactly one `a[href="#colophon"]` in the footer.

2. `sections` check (lines 205-211) compares an exact id list against `manifest.sections`; add `"colophon"` after `"contact"` in the manifest:
```js
if (JSON.stringify(ids) !== JSON.stringify(manifest.sections)) return fail('sections', `section ids ${JSON.stringify(ids)}`);
```

3. Source gates (`source-reverse` line 627, `source-numbers` line 647, `source-coverage` line 660) iterate `visibleTexts`. Colophon strings and numbers (`640px`, `WCAG 2.2`, scores) are not in the source and will fail on any machine that has the local source text. Add a `sourceTexts` array = `visibleTexts` minus nodes under `section#colophon` and `footer a`, and use it ONLY in those three checks. Keep `forbidden` (line 600) and the phone checks on `visibleTexts`.

**New checks to register** (same `register` + `pass/fail` shape): `colophon` (structure, row order, static rows equal the CSS breakpoint values, measured rows equal `tools/measurements.json`, zero `data` when any value is null, digit assertion scoped to measured rows only), `meta` (noindex on index and 404, OG strings equal `.cover-intro` and `<title>`), and a `404` token-equality check (hex values and heading `clamp()` string equal `css/tokens.css`). Use `--only <name>` filtering already supported (line 695) so `check-images` can invoke single checks.

**Allowlist mechanism for new visible Korean strings** (lines 195-199, 399-400): `manifest.uiAllowlist` plus `uiAllowlistReasons`; reason strings are validated against allowlist keys.

---

### `index.html` (modify: head, `#colophon`, footer link)

**Analog:** itself.

**Head insertion point** (lines 17-22): after `<meta name="robots" ...>` and `<title>`:
```html
  <meta name="format-detection" content="telephone=no">
  <meta name="robots" content="noindex, nofollow">
  <script>document.documentElement.classList.add('js')</script>
  <title>퍼블리셔 유윤희 포트폴리오</title>
```
Add `description`, `og:*`, `twitter:*`, and the three icon `<link>` tags from UI-SPEC section 3/4 (relative hrefs for icons, absolute D-01 URLs for `og:` only). Do not add `rel=canonical`.

**Section skeleton to copy** (lines 376-387, `#contact`): eyebrow with `lang="en"` and `.eyebrow-num`, `h2` with `lang="en"`, intro `p`, then a `dl` of `div` rows:
```html
    <section id="contact" aria-labelledby="contact-title">
      <p class="eyebrow" lang="en"><span class="eyebrow-num">08</span> / Contact</p>
      <h2 id="contact-title" lang="en">Contact.</h2>
      <p>더 궁금한 점이 있으시다면 편하게 연락 부탁 드립니다.</p>
      <dl class="contact-list">
        <div>
          <dt lang="en">Email</dt>
          <dd>...</dd>
        </div>
      </dl>
```
Insert `<section id="colophon" aria-labelledby="colophon-title">` after line 387 and before `</main>` (line 388), eyebrow `09 / Colophon`.

**Chip markup** (line 343): `<dd><data value="50">50%</data> · ...</dd>`; Colophon scores use `<data value="98">98</data>` only when the record is non-null.

**Footer** (lines 390-392): add `<p><a href="#colophon">사이트 정보</a></p>` after the copyright `<p><small>...</small></p>`.

**Email only on the web:** the existing `mailto:` anchors (lines 58, 383) are the only contact data; do not add the address to any new meta tag value or the OG image.

---

### `css/components.css` -- colophon dl (component CSS)

**Analog:** `.meta` block (lines 535-574). Reuse the chip rule through a shared selector instead of copying it, as UI-SPEC says: change `data {` inside `.meta` into a top-level `.meta data, .colophon-list data {` (CSS nesting is native here, written with `&`).

**Row grid to adapt** (lines 540-549):
```css
    & > div {
      display: grid;
      grid-template-columns: 88px minmax(0, 1fr);
      gap: var(--space-sm);
      @container company (max-width: 359.98px) { grid-template-columns: minmax(0, 1fr); gap: 0; }
    }
    dt { font-size: var(--text-label); font-weight: var(--weight-semibold); line-height: 1.6; color: var(--color-ink-3); }
    dd { margin: 0; color: var(--color-ink-2); overflow-wrap: anywhere; }
```
For `.colophon-list`: column `120px`, one-column below 480px via `@media (max-width: 479.98px)` (there is no `company` container here, so do not use `@container company`), per-row `padding-block: var(--space-md); border-block-end: 1px solid var(--color-line)`.

**List reset** (`.skills ul`, lines 661-666): `list-style: none; margin: 0; padding: 0; color: var(--color-ink-2);`

**Link style for footer link** (`.contact-list a`, lines 674-679): `display: inline-flex; align-items: center; min-block-size: 44px; overflow-wrap: anywhere;` plus visible `text-decoration: underline`.

All new rules live inside the existing `@layer components { ... }` block (the file wraps everything in that layer; indentation is two spaces inside it).

---

### `css/layout.css` -- colophon section and footer link (layout CSS)

**Analog:** `#contact` and `body > footer` (lines 241-281). Sections ride the existing `main > section:not(.cover, .keywords, .company, #contact)` padding rule, so `#colophon` needs only the top border and the dl width cap:
```css
  body > footer {
    padding-block: var(--space-2xl);
    border-block-start: 1px solid var(--color-line);
    text-align: start;
    small { font-size: var(--text-label); color: var(--color-ink-3); }
  }
```
Add a `#colophon { border-block-start: 1px solid var(--color-line); }` and a `@media (min-width: 1024px) { .colophon-list { max-inline-size: 48rem; } }` using the same `@media (min-width: 1024px)` nesting form as `#contact` (lines 247-251). Footer link styling goes inside the `body > footer { ... }` block as `a { ... }` (Label size, weight 400, `--color-ink-3`).

---

### `css/print.css` -- exclude colophon from the PDF

**Analog:** the existing `body > footer` rule (lines 184-187) inside `@layer print`:
```css
    body > footer {
      break-before: avoid;
      padding-block: 6mm 0;
    }
```
Add next to it: `#colophon, body > footer a { display: none !important; }`. Also check the neighbouring `main > section:not(.cover, .keywords, .company, #contact)` rule (line 189): `#colophon` matches it, but `display: none` removes it from layout, so page count must stay unchanged (verify with `pdf-report` / `check:shots-pdf`).

---

### `404.html` (markup, static, self-contained)

**Analog:** `index.html` head (lines 15-22) for doctype, `lang`, charset, viewport, robots; token values from `css/tokens.css` (hex values and heading `clamp()` string must be copied exactly, and a check asserts equality). It must NOT link `css/*` (depth problem, UI-SPEC section 2). The one deliberate absolute link `href="/portfolio-2026/"` needs an explanatory HTML comment, in the same Korean-comment style as the top-of-file comment in `index.html` (lines 2-13). Chevron: reuse the `.links a::after` construction from components.css lines 610-618:
```css
&::after { content: ""; flex: none; inline-size: 8px; block-size: 8px;
  border-inline-end: 2px solid currentcolor; border-block-start: 2px solid currentcolor; transform: rotate(45deg); }
```
Add `404.html` to the `validate` script and to the html-validate run.

---

### `package.json` (modify scripts)

**Analog:** itself (lines 10-32). Conventions: kebab-case `check:*` names, `node tools/<x>.mjs [--self-test]`, the aggregate `check` chain on line 18.
```json
"validate": "html-validate index.html",
"check:links": "linkinator http://127.0.0.1:3000 --recurse",
"check:images": "node tools/check-images.mjs && node tools/check-images.mjs --self-test && node tools/optimise-images.mjs --self-test",
```
Add: `validate` -> `html-validate index.html 404.html`; `check:links` -> append `--check-css --check-fragments`; `check:artifact` -> `node tools/stage-pages.mjs dist/site && node tools/check-artifact.mjs dist/site && node tools/check-artifact.mjs --self-test && node tools/check-repo.mjs --dir dist/site`; `check:preview`, `check:network`, `colophon` / `colophon:check`, `og`. Append `check:artifact` (and `colophon:check`) to the `check` chain. `engines.node` is `>=22.22.0`; use `node-version: 24` in CI per RESEARCH.

---

### `.github/workflows/pages.yml` (CI config) -- no in-repo analog

Use RESEARCH.md Pattern 1 verbatim (two jobs, `workflow_dispatch`-gated upload and deploy, top-level `permissions: contents: read`, Pages permissions only on the deploy job, first-party `actions/*@v5..v7`). The step order intentionally mirrors `.githooks/pre-push` so local and CI gates are identical:

**Analog** (`.githooks/pre-push` lines 4-6):
```sh
node tools/check-repo.mjs --self-test || exit 1
node tools/check-repo.mjs || exit 1
node tools/check-repo.mjs --history || exit 1
```
`check-content --require-source` is NOT run in CI (source text is gitignored; pre-push lines 8-12 show the same conditional). `fetch-depth: 0` is required for `--history`.

---

### `.githooks/pre-push` (optional extend)

**Analog:** itself. If the artifact gate should also run locally, add after line 6 (same `|| exit 1` idiom): `node tools/stage-pages.mjs dist/site && node tools/check-artifact.mjs dist/site && node tools/check-repo.mjs --dir dist/site || exit 1`. Keep POSIX `sh`; never use `--no-verify`.

---

### `README.md` (doc)

No close analog; constraints from the repo: `check-repo` `NAME_EXCEPT` already allows `README.md` (line 63) and the file is scanned by `scanBuffer` so it must contain no phone-like text, even in examples. Reference `tools/contact.example.json` for the PDF section (it is the committed placeholder for `private/contact.json`; do not paste a realistic number). Commands to document come straight from `package.json` scripts (`serve`, `check`, `check:ui`, `check:layout`, `images`, `pdf`). State that `robots.txt` is a hint only and `noindex` is the control (RESEARCH Pitfall 2). Korean, concise.

---

### `robots.txt`, `favicon.svg`, icon PNGs, `img/og-card.png`

No analogs (two-line text file; generated assets). Specs are fully in UI-SPEC sections 3 and 4. File names are kebab-case lowercase, satisfying `NAME_OK` (`/^[a-z0-9._-]+.../`, check-repo line 62). PNGs are accepted by `isKnownBinary` (magic bytes, check-repo lines 66-83); the `.svg` is scanned as text, so keep it free of any digit run resembling a phone number (path data like `M19 17 L32 35` is safe because the matcher needs a 01x prefix plus 7-8 digits). `ico` is also known-binary if ever added. `img/` is currently empty/untracked.

## Shared Patterns

### Self-test (RED/GREEN) convention for every new check
**Source:** `tools/check-repo.mjs` lines 124-192 (matcher self-test, runtime-assembled positives) and `tools/check-images.mjs` lines 179-316 (fixture + `neg()` mutation harness), `tools/lib/static-server.mjs` lines 81-128 (`expect(name, path, status)` PASS/FAIL printing).
**Apply to:** `check-artifact`, `check-preview`, `colophon-sync --check`, `check-repo --dir`.
```js
console.log(`${good ? 'PASS' : 'FAIL'} static-server ${name}: ${r.status} (want ${status})`);
...
process.exit(failed ? 1 : 0);
```

### Never print matched private data
**Source:** `tools/check-repo.mjs` lines 5, 101-118 (`scanBuffer` prints `label:line: phone-like pattern`, never the text); `tools/check-content.mjs` lines 683-688 (redacts digits in unmapped lines).
**Apply to:** every new tool that scans text: print file/tag name and counts only.

### Phone matcher reuse (no second matcher)
**Source:** `export const hasPhone`, `export const hasPhoneAnywhere`, `export function normalizeForPhone` in `tools/check-repo.mjs` (lines 44-56). Importers: `check-content.mjs` line 10, `optimise-images.mjs` line 22.
**Apply to:** `check-preview`, `check-artifact` (if it scans content), `colophon-sync` (assert the rendered HTML has none).

### Chrome launch and teardown
**Source:** `tools/lib/browser.mjs` (`launchChrome`, `closeBrowser`) with `finally` teardown as in `check-ui.mjs` lines 110-115 and 797-802. `CHROME_PATH` env override.
**Apply to:** `check-network`, `make-og`.

### Local static server for checks
**Source:** `tools/lib/static-server.mjs` `startStaticServer(root)` returning `{ url, close }`; Host-header guard means a Chrome pointed at it must use `127.0.0.1:<port>` or `localhost:<port>`.
**Apply to:** `make-og`, any local-mode run of `check-network` / `check-preview`. For artifact checks point it at `dist/site`, but NOTE `dist` is in `DENIED_SEGMENTS` (line 25) so serving `dist/site` as ROOT works (the segment is outside the request path), while requesting `/dist/...` under the repo root would 404.

### Path-safety / dist confinement
**Source:** `tools/check-layout.mjs` lines 23-31; `tools/build-pdf.mjs` line 88-89 (`PDF_OUT must be outside the repo or inside dist/`).
**Apply to:** `stage-pages`, `make-og` (outputs inside repo only at the intended `img/` path), measurement dumps (`dist/lh-*.json`, `dist/linkinator.json`).

### CSS layering and tokens
**Source:** `css/layers.css` order `reset, tokens, base, layout, components, utilities, print`; `components.css` wraps all rules in `@layer components`; spacing/typography via `var(--space-*)`, `--text-label`, `--weight-semibold`, `--color-ink-2/3`, `--color-line`, `--color-accent-tint`, `--radius-sm`.
**Apply to:** all Colophon CSS. No new tokens, no new CSS file.

### Content-check registration
**Source:** `tools/check-content.mjs` line 124 `register(name, fn)` + `pass/fail/skip` (lines 24-26) + `uiAllowlist`/`uiAllowlistReasons` in `tools/content-manifest.json` (lines 195-199).
**Apply to:** Colophon, meta/OG, 404 token equality, README checks.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.github/workflows/pages.yml` | CI config | event-driven | No workflow exists; use RESEARCH Pattern 1, step order mirrors `.githooks/pre-push` |
| `tools/og-card.html` | render source | static | No standalone render page exists; reuse `fonts-print.css` family and `tokens.css` |
| `robots.txt` | config | static | Two fixed lines from CONTEXT |
| favicon / OG PNG / SVG assets | asset | generated | Specs fully in UI-SPEC; generation via sharp (already a dependency) |
| `05-HUMAN-UAT.md` | UAT doc | manual | Model on `04-HUMAN-UAT.md` (excluded from this scan); content from RESEARCH "iOS Safari real-device checklist" |

## Constraints the Planner Must Carry

- Absolute URLs are allowed only in `og:*`/`twitter:*` meta and in `404.html` (UI-SPEC W-19); everything else stays relative.
- `js/main.js` needs no change: RESEARCH verified `setCurrent(links.has(key) ? key : null)`; add a `check-ui` assertion (scroll to `#colophon`, zero `aria-current`, no page error) using the `withPage(browser, url, vw, vh, opts, fn)` and `scenario(name, ...)` helpers (check-ui.mjs lines 96-108).
- The public deploy (enable Pages, live linkinator, live network check, Lighthouse, Nu, iOS UAT, Colophon fill, second dispatch) is a single human-gated checkpoint blocked on 04-HUMAN-UAT test 1 (D-04).
- No `tools/check-repo.mjs` output, test fixture or doc may include a phone literal; assemble positives at runtime as the existing self-tests do.

## Metadata

**Analog search scope:** `tools/*.mjs`, `tools/lib/*.mjs`, `css/*.css`, `index.html`, `js/main.js` (via RESEARCH-verified lines only), `.githooks/*`, `package.json`.
**Files read:** check-repo.mjs, lib/browser.mjs, lib/static-server.mjs, package.json, pre-push, index.html (head and tail), components.css (535-694), layout.css (225-282), print.css (170-209), check-content.mjs (excerpts), check-images.mjs (170-329), check-layout.mjs (1-60), check-ui.mjs (60-120), fonts-print.css; grep-only for build-pdf.mjs and optimise-images.mjs.
**Not read by instruction:** `private/`, `.planning/source/`, `_screenshots/`, `dist/`.
**Pattern extraction date:** 2026-11-16
