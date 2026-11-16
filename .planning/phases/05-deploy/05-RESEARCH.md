# Phase 5: 검증과 배포 - Research

**Researched:** 2026-11-16
**Domain:** GitHub Pages (Actions) deploy of a no-build static site, link-preview metadata, measurement/verification tooling, repo privacy gates
**Confidence:** HIGH for deploy mechanics and existing-code integration, MEDIUM for messenger preview behavior (vendor docs are thin)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Keep the current repo, `youyoonhee/portfolio-2026`, without renaming. The URL is `https://youyoonhee.github.io/portfolio-2026/`. All paths stay relative. Absolute URLs (`og:image`, `og:url`, canonical) use this base.
- **D-02:** Publish **only the site files**, through GitHub Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`). Do not deploy the branch root. The artifact is built from an explicit allowlist: `index.html`, `404.html`, `robots.txt`, `css/`, `js/`, `fonts/`, `img/`, plus favicon and OG files. `tools/`, `.planning/`, `package*.json`, `node_modules/` and `_screenshots/` must not be reachable at the Pages URL. The workflow must fail if the artifact contains anything outside the allowlist, or if the phone scan finds a match.
- **D-03:** Claude turns Pages on with `gh`. This happens only after every check passes, the phone scan finds 0 matches, and the user approves in chat. It covers the Pages source set to "GitHub Actions" and the first deploy. Afterwards, run linkinator and a network-404 check against the **deployed** URL. Claude never handles tokens. It relies on the user's existing `gh` login.
- **D-04:** **The public deploy waits for real screenshots.** The user chose "스크린샷 넣고 배포". Everything else (OG, favicon, Colophon, README, 404 page, Actions workflow, local and pre-deploy checks) can be built and verified before the screenshots arrive. The final steps, turning Pages on and running the checks against the live URL, are blocked on 04-HUMAN-UAT test 1: screenshots added, reviewed, published, and the PDF at most 5MB. The plan must model this as a human checkpoint, not skip it.

Already done (do not redo): `<meta name="robots" content="noindex, nofollow">` is in `index.html`. The 링크알바 status is settled as `운영 종료` with no link (01-CONTEXT D-14 revision) and is not rechecked.

### Claude's Discretion
- **Link preview (DEPL-03):** `og:image` is a 1200x630 card generated from the site's own tokens and Pretendard (name and role only, no new claims, no screenshot). `og:title`/`og:description` reuse existing cover copy. Add `og:url`, `og:type=website`, `og:locale=ko_KR`, `twitter:card=summary_large_image`. Favicon set: SVG monogram in accent color; PNG fallbacks (32px, 180px `apple-touch-icon`); optional `site.webmanifest` only if it costs nothing. Nothing in the preview contains the phone number or email.
- **Colophon (QUAL-06):** compact `#colophon` after `#contact`, before the footer, using existing `dl`/meta patterns. Stack, responsive breakpoints, accessibility target (WCAG 2.2 AA level, matching what checks enforce), browsers tested, Lighthouse scores and validator results with the measurement date. Every number measured on the deployed site; values filled from a measurement record file, not typed by hand. A browser not tested on a real device is not listed as tested. Web-only, excluded from the PDF (`print.css`). Added to nav only if the pattern fits, otherwise linked from the footer.
- **Real-device testing (QUAL-04):** Claude checks Chrome and Edge with existing headless/automation tools at several widths. iOS Safari on a real device is done by the user from a short checklist Claude writes (scroll, menu, zoom dialog, link opening, the font actually rendering); result recorded as UAT. No device = recorded gap; never claim iOS was tested.
- **README (DEPL-04):** Korean, concise: hand-written vs other sources (Pretendard, design-taste kit if used); local run (`npm run serve`); check commands; PDF build (`private/contact.json` required and gitignored, phone never committed); screenshot rules (`_screenshots/<id>/` -> `tools/screenshots.json` -> `npm run images`). Never contains the phone number.
- **404.html:** minimal page in the site's style, link back home, `noindex`.
- **robots.txt:** `User-agent: *` / `Disallow: /`. Only a hint on a project subpath. `noindex` is the real guard.
- **Pre-deploy phone scan:** re-run `check:repo`, `check:history`, add a scan of the built Pages artifact, all expecting 0 matches. Never prints the number; only match counts and file names.

### Deferred Ideas (OUT OF SCOPE)
- Renaming the repo to `youyoonhee.github.io` or a custom domain.
- Lighthouse CI (`@lhci/cli`) in Actions. A one-off manual measurement is enough for v1.
- Phase 4 follow-ups: the `keyword-focus` check:ui flake and 04-REVIEW items IN-01..07 (unless they block a check).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-04 | Same look in latest Chrome, Edge, iOS Safari (real device) | Chrome via `launchChrome`; Edge installed (157) but `browser.mjs` documents it hangs, so try via `CHROME_PATH` with timeout or ask user to eyeball; iOS checklist (Section "iOS Safari checklist"); Colophon never claims untested browsers |
| QUAL-05 | 0 broken links, no 404 in network tab after deploy | linkinator 8.1.0 needs `--check-css --check-fragments`; new `tools/check-network.mjs` with puppeteer `response`/`requestfailed` against the deployed URL |
| QUAL-06 | Colophon with measured Lighthouse/validator results and date | `tools/measurements.json` + `tools/colophon-sync.mjs`; `npx lighthouse@13.6.0`; Nu checker JSON; SEO-score pitfall caused by noindex |
| DEPL-01 | GitHub Pages on free public repo | Actions workflow + `POST /repos/{o}/{r}/pages` `build_type=workflow`; repo is public, Pages currently not enabled (API 404) |
| DEPL-02 | Not search-indexed (`noindex` + `robots.txt`) | noindex already present; robots.txt in subpath is ignored by crawlers (host-level file governs); do NOT create a host-level Disallow |
| DEPL-03 | Link preview (OG, favicon) | Tag set, PNG 1200x630, absolute URL, per-messenger notes; headless-Chrome render of the card |
| DEPL-04 | README with hand-written scope, PDF build, screenshot rules | README content map; `check-repo` NAME_EXCEPT already allows `README.md` |
</phase_requirements>

## Summary

The deploy path is small and fully scriptable. A two-job workflow (`build` stages an allowlist directory, verifies it and scans it for phone-like patterns; `deploy` runs only on manual dispatch) satisfies D-02 and D-04 together: pushes to `main` are verified by CI but never publish. The phone scan works in CI because `tools/check-repo.mjs` is **pattern-based** (a phone-shaped regex plus Hangul-digit normalization and a split-across-tags variant); it contains no secret and needs no `private/` file, so it runs unchanged on a clean checkout. It only needs a new `--dir <path>` mode to scan a staged directory instead of `git ls-files`.

The three biggest planning risks are not in the deploy mechanics. (1) The Lighthouse SEO category will score roughly 69, not ~100, because `noindex` makes the `is-crawlable` audit fail (weight 4.04 of ~13.04). The Colophon must show the real number with a static explanation, and the UI-SPEC needs a small note field. (2) The existing `tools/check-content.mjs` will fail the Colophon in three places: the `footer` check compares whole footer text, the `sections` check compares an exact id list, and the pre-push `source-reverse`/`source-numbers` checks (which run whenever the local source text exists) will reject Colophon numbers (640, 900, 2.2, scores) and new Korean strings. (3) `robots.txt` placed at `/portfolio-2026/robots.txt` is ignored by Google; the only robots.txt crawlers read is the host-level `youyoonhee.github.io/robots.txt`, which does not exist today (the user-site repo returns 404). That absence is what lets `noindex` be seen and what keeps link previews working. Keep it that way.

**Primary recommendation:** Build `tools/stage-pages.mjs` (allowlist copy to `dist/site`), `tools/check-artifact.mjs` (independent allowlist verifier with RED self-tests) and `check-repo.mjs --dir` first; wire them into a `verify`+`deploy` workflow triggered by `workflow_dispatch` for deploy; make every Colophon value flow from `tools/measurements.json`; put the live-URL work (enable Pages, linkinator, network, Lighthouse, Nu, iOS UAT) behind one explicit human checkpoint.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Serving static files, 404 page | CDN / Static (GitHub Pages) | - | No server code; `404.html` served by Pages for any unknown path |
| Artifact allowlist + phone gate | Build/CI (Actions job) | Local pre-push hook | Gate must run where publishing happens, not only on the dev machine |
| Link-preview tags | Browser/Client (static `<head>`) | CDN (image hosting) | Crawlers read static HTML; image must be an absolute URL on the same Pages host |
| OG card / favicon generation | Local dev tooling (headless Chrome + sharp) | - | Generated once, committed as static assets; not built in CI |
| Colophon values | Local tooling (`colophon-sync`) | Static HTML | Measured outside the page, written into HTML; no runtime fetch |
| Measurement (Lighthouse, Nu, linkinator, network) | Local tooling against deployed URL | - | Must measure the live site, not localhost |
| Noindex | Browser/Client (`<meta>`) | CDN (robots.txt hint, ignored on subpath) | Pages cannot set `X-Robots-Tag`; meta is the only reliable control |

## Standard Stack

### Core (all already in the repo; nothing new to install for the site)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| puppeteer-core | 25.17.0 (installed; `npm view` latest = 25.17.0) | Render OG card, network/404 capture, Chrome checks | Already used by `tools/lib/browser.mjs`; note the repo has **puppeteer-core, not puppeteer** (no bundled Chrome; uses installed Chrome 157 via `channel: 'chrome'` or `CHROME_PATH`) [VERIFIED: package.json, npm view] |
| sharp | 0.35.5 (installed; latest 0.35.5) | Favicon PNGs from SVG, PNG optimize/verify dimensions | Already a devDependency; librsvg renders plain-path SVG fine [VERIFIED: npm view] |
| linkinator | 8.1.0 (installed; latest 8.1.0) | Deployed-URL link check | Already wired as `check:links` [VERIFIED: npm view, `--help`] |
| html-validate | 11.21.0 | Local HTML lint incl. a11y | Extend `validate` to `index.html 404.html` [VERIFIED: package.json] |
| serve | 14.2.7 | Local preview | Existing `npm run serve` |

### Supporting (one-off, not a dependency)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| lighthouse (via `npx lighthouse@13.6.0`) | 13.6.0, `engines.node >=22.19`, modified 2026-11-13 | Scripted Lighthouse run producing JSON scores | Post-deploy measurement. Local Node is v22.23.4 so it runs. Pin the exact version; do not add to package.json (CLAUDE.md says DevTools Lighthouse is fine; CLI is the scriptable equivalent) [VERIFIED: npm view; CITED: github.com/GoogleChrome/lighthouse "requires Node 22 (LTS) or later"] |
| W3C Nu checker | server `26.11.14` | HTML validity on deployed page | `curl`/`fetch` POST of HTML or `?doc=` GET; no install [VERIFIED: ran a POST of a synthetic head-only document, returned `"messages":[]`] |
| GitHub Actions | checkout v7.0.1, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1 | CI deploy | Latest releases as of 2026-11-16 [VERIFIED: `gh api repos/actions/*/releases/latest`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `workflow_dispatch`-only deploy | `push` to main deploy | Push-deploy would publish unreviewed state as soon as Pages is enabled, violating D-04. Use dispatch (can add `push` later) |
| Lighthouse CLI | DevTools Lighthouse panel | DevTools needs manual copy of four numbers; CLI JSON feeds `measurements.json` directly. Both acceptable; CLI is reproducible |
| Edge via automation | User opens site in Edge desktop | `tools/lib/browser.mjs` header says "Edge hangs or fails to start on the dev machine". Edge 157 is installed (same Chromium major as Chrome 157) |

**Installation:** no site dependency changes. One-off: `npx lighthouse@13.6.0 <url> ...` (downloads on use).

**Version verification:** `npm view` on 2026-11-16: linkinator 8.1.0, sharp 0.35.5, puppeteer-core 25.17.0, lighthouse 13.6.0 (repo `github.com/GoogleChrome/lighthouse`, no postinstall script).

## Package Legitimacy Audit

slopcheck could not be installed (the `pip install` attempt was denied by the environment's permission classifier), so legitimacy was checked by `npm view` only.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| puppeteer-core, sharp, linkinator, html-validate, serve, pretendard | npm | pre-existing in package.json / lockfile | - | existing | not run | Already installed in earlier phases; no new install |
| lighthouse (npx, one-off) | npm | multi-year, official Google Chrome project | - | github.com/GoogleChrome/lighthouse (per `npm view repository.url`) | not run | [ASSUMED] legit (very well-known). Tag the first `npx` run as `checkpoint:human-verify` per protocol, or pin `@13.6.0` and accept |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck not run)
**Packages flagged [SUS]:** none. GitHub Actions are first-party `actions/*` orgs.

## Architecture Patterns

### System Architecture Diagram

```
 developer push (main)                    user clicks "Run workflow" (workflow_dispatch)
        |                                              |
        v                                              v
 +---------------- job: build (every push + dispatch) ----------------+
 | checkout (fetch-depth 0) -> setup-node                             |
 |  -> node tools/check-repo.mjs --self-test                          |
 |  -> node tools/check-repo.mjs            (tree, pattern based)     |
 |  -> node tools/check-repo.mjs --history  (all blobs/commits)       |
 |  -> node tools/stage-pages.mjs dist/site (copy allowlist only)     |
 |  -> node tools/check-artifact.mjs dist/site  (fail on any extra)   |
 |  -> node tools/check-repo.mjs --dir dist/site (phone scan, counts) |
 |  -> [dispatch only] configure-pages -> upload-pages-artifact(path) |
 +--------------------------------------------------------------------+
        | (dispatch only, needs: build)
        v
 +--------- job: deploy (environment github-pages) ---------+
 | permissions pages: write, id-token: write                |
 | actions/deploy-pages -> https://youyoonhee.github.io/portfolio-2026/ |
 +----------------------------------------------------------+
        |
        v  (after human approval, post-deploy, local machine)
 linkinator + check-network + preview check + lighthouse + Nu
        -> tools/measurements.json -> colophon-sync -> index.html -> commit -> re-dispatch
```

### Recommended Project Structure (new/changed files only)
```
.github/workflows/pages.yml    # verify + deploy
404.html  robots.txt  favicon.svg  favicon-32.png  apple-touch-icon.png   # site root
img/og-card.png                # per UI-SPEC (img/ is currently empty and untracked)
tools/og-card.html             # Chrome render source (NOT in allowlist)
tools/make-og.mjs              # render OG PNG + favicon PNGs (or extend optimise-images.mjs)
tools/stage-pages.mjs          # allowlist copy -> dist/site
tools/check-artifact.mjs       # independent allowlist verifier + self-test
tools/check-network.mjs        # response 4xx/5xx + requestfailed capture, URL argument
tools/check-preview.mjs        # fetch URL, parse og tags, HEAD image, sharp dimensions
tools/colophon-sync.mjs        # measurements.json -> index.html
tools/measurements.json        # measurement record (committed)
tools/ios-checklist.md or .planning/phases/05-deploy/05-HUMAN-UAT.md
README.md
```
`dist/` is already gitignored and listed in `FORBIDDEN` in check-repo, so the staging directory `dist/site` can never be committed; the CI runner creates it fresh. [VERIFIED: `.gitignore`, `check-repo.mjs` FORBIDDEN]

### Pattern 1: Pages workflow (build + gated deploy)
**What:** One verification job on every push; deploy only on manual dispatch.
**When to use:** D-02 + D-04.
```yaml
# Source: actions/starter-workflows pages/static.yml (structure), versions per gh releases 2026-11-16
name: Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with: { fetch-depth: 0 }          # history scan needs all commits
      - uses: actions/setup-node@v7
        with: { node-version: 24 }
      - run: node tools/check-repo.mjs --self-test
      - run: node tools/check-repo.mjs
      - run: node tools/check-repo.mjs --history
      - run: node tools/stage-pages.mjs dist/site
      - run: node tools/check-artifact.mjs dist/site
      - run: node tools/check-repo.mjs --dir dist/site
      - if: github.event_name == 'workflow_dispatch'
        uses: actions/configure-pages@v6
      - if: github.event_name == 'workflow_dispatch'
        uses: actions/upload-pages-artifact@v5
        with: { path: dist/site }
  deploy:
    if: github.event_name == 'workflow_dispatch'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```
Notes: no `npm ci` is needed (the three tools import only Node built-ins; `npm ci` would also trigger the `prepare` hook installer). Verify before relying on it that `tools/check-repo.mjs` imports nothing outside `node:*` (it imports `node:` modules and defines its own helpers; confirm in the plan task). `upload-pages-artifact` **excludes hidden files by default** (and always `.git`/`.github`) and rejects symlinks/hardlinks; tar must be <10GB, recommended <1GB (site is ~8MB fonts + small) [CITED: github.com/actions/upload-pages-artifact]. `.nojekyll` is not needed with Actions deploys (no Jekyll build) and would be dropped as hidden anyway. If `check-content` is also wanted in CI, it works without the source text (source checks SKIP with a warning), but add it only after confirming its imports are dependency-free.

### Pattern 2: Phone scan on a directory without the number existing anywhere
**What:** `check-repo.mjs` decides "phone-like" by regex (separator-tolerant digit groups, Hangul-digit words normalized via `normalizeForPhone`, `hasPhoneAnywhere` also joins lines and strips tags with and without a separator). `scanBuffer(label, path, buf)` skips only known binaries whose extension AND magic bytes match, decodes UTF-8/UTF-16, and **fails closed** on unknown binaries. Output is `label:line: phone-like pattern`, never the match. So CI needs no secret. [VERIFIED: read tools/check-repo.mjs]
**Add:** a `--dir <path>` branch next to `--history`/`--staged`: recursively list files (including dotfiles and symlink detection), run the same `FORBIDDEN`/`hasPhone(path)`/`scanBuffer` loop, print `check-repo: N file(s) clean`. Export nothing new; keep digits out of all output. Reuse in `check-artifact`.
**Limit to document:** a regex gate cannot catch a number written in a format the matcher doesn't model (e.g. words in another language). The gate is pattern-based; the guarantee also relies on `PROJECT` rule that the number only lives in `private/`. A cheap extra, local-only check (not in CI): the existing PDF build already knows the number, so after staging, `build-pdf` flow could assert the exact digits are absent from `dist/site` using `private/contact.json` read at runtime. Optional; do not print.

### Pattern 3: Allowlist staging and independent verification
`stage-pages.mjs` copies: root `index.html 404.html robots.txt favicon.svg favicon-32.png apple-touch-icon.png`; `css/*.css`; `js/*.js`; `fonts/**` with extensions `.woff2 .ttf .txt` (the OFL licence `fonts/pretendard-ofl.txt` is shipped and should stay); `img/**` with `.avif .webp .jpg .png`. `check-artifact.mjs` re-walks the **output dir** (not the source list) and fails on: any path not matching the allowlist regex set, any dotfile, any symlink, any `.pdf/.json/.md/.mjs/.map`, `package*.json`, `tools/`, `.planning/`, and any required file missing (`index.html`, `404.html`, `img/og-card.png`). Self-test (RED/GREEN, like check-repo): build temp dirs with a stray `tools/x.mjs`, `package.json`, `a.pdf`, `.env`, a phone-shaped string assembled at runtime (never a literal), a symlink; each must exit non-zero; the clean fixture must pass. Wire into `npm run check`.

### Pattern 4: Enabling Pages from the CLI (only after approval)
Pages is currently **not enabled** (`GET /repos/youyoonhee/portfolio-2026/pages` -> 404; repo is public; the logged-in `gh` account has admin) [VERIFIED: gh api GET].
```bash
# Source: docs.github.com/en/rest/pages/pages
gh api -X POST repos/youyoonhee/portfolio-2026/pages -f build_type=workflow     # 201 when no site exists yet
# if a site already exists in legacy mode:
gh api -X PUT  repos/youyoonhee/portfolio-2026/pages -f build_type=workflow     # 204
# then trigger and watch
gh workflow run pages.yml --ref main && gh run watch
```
Do not use `actions/configure-pages` `enablement: true` (needs a token with admin rights the default `GITHUB_TOKEN` lacks; it would also violate D-03's "Claude turns it on" sequencing). Because the workflow file lands on `main` before Pages is enabled, the `build` job (verification only) will pass on pushes, while `configure-pages`/`deploy` only run on dispatch, so no failed red runs appear.

### Pattern 5: OG card render in headless Chrome
Serve the repo root with `startStaticServer` (it permits `tools/` and `.html/.css/.ttf/.png`), open `/tools/og-card.html`, which links `../css/fonts-print.css` and `../css/tokens.css`. Then:
```js
// Source: pptr.dev (Page.setViewport, Page.screenshot); repo tools/lib/browser.mjs
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate(() => Promise.all([
  document.fonts.load('600 160px "Pretendard Print"'),
  document.fonts.load('400 48px "Pretendard Print"'),
  document.fonts.load('600 32px "Pretendard Print"'),
]).then(() => document.fonts.ready));
const ok = await page.evaluate(() => document.fonts.check('600 160px "Pretendard Print"'));  // assert true
const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
```
Then `sharp(buf).png({ palette: true, quality: 90, effort: 10 }).toFile('img/og-card.png')` and assert `metadata()` is 1200x630 and size under 150KB. `{ palette: true }` is lossy quantization; compare visually once (UI-SPEC already calls this the only human look). Do not use sharp to rasterize text (librsvg ignores project `@font-face`).
**Favicons:** `sharp(Buffer.from(svg), { density: 384 }).resize(32, 32).png()` for `favicon-32.png` (keep rounded corners, transparent). For `apple-touch-icon.png` render a second SVG string **without `rx`** at 180x180 and `.flatten({ background: '#0a7a3d' })` / `.removeAlpha()`; assert metadata `channels === 3` / `hasAlpha === false`. Use stroke width 22.5 of 180 as in the UI-SPEC (equals 8/64 scaled). [ASSUMED: sharp `density` option behaviour for crisp SVG raster; verify visually]

### Anti-Patterns to Avoid
- **Deploy on `push`:** publishes every doc commit once Pages is on; contradicts D-04.
- **Uploading `.` (starter template default):** ships `tools/`, `.planning/`, `package.json`. The starter workflow uploads the whole repo; do not copy that part.
- **Typing scores into `index.html`:** breaks the "never typed by hand" rule; use `colophon-sync` and a check that HTML equals the record.
- **A phone-number literal anywhere (tests, CI env, secrets):** self-test positives must be assembled at runtime as `check-repo` already does.
- **Relying on `robots.txt` for anything:** see Pitfall 2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone/PII detection | A second matcher | `hasPhone`/`hasPhoneAnywhere`/`scanBuffer` from `tools/check-repo.mjs` (add `--dir`) | Already handles Hangul digits, UTF-16, split-across-tags, fail-closed binaries, RED self-tests |
| Static server for checks | New http server | `tools/lib/static-server.mjs` (`startStaticServer(root)`) | Has host-header, traversal and denylist guards. NOTE its `MIME` map has no `.txt/.json/.xml/.ico/.webmanifest`, so those return 404 locally; fine because pages never request them |
| Chrome launch/teardown | `puppeteer.launch` direct | `launchChrome`/`closeBrowser` | Kills only its own pid, removes the temp profile, handles the Windows hang |
| Link crawling | Custom crawler | `linkinator` with `--check-css --check-fragments` | `--check-css` is **off by default**: without it, fonts and images referenced from CSS are never checked, and `--check-fragments` validates `#anchors` |
| HTML validity | Home-made rules | html-validate (local) + Nu checker (deployed) | Nu validated the intended head tags with zero messages (see Sources) |
| Score extraction | Scraping Lighthouse HTML | `--output=json`, read `categories.<id>.score` x 100 | Stable schema |
| Colophon numbers | Manual edit | `tools/colophon-sync.mjs` + equality check | Repeatable, no invented numbers |

**Key insight:** every gate in this phase already has a local analogue (RED/GREEN self-tests, fail-closed scans). Reuse those shapes; the new work is wiring and a `--dir` mode, not new detection logic.

## Runtime State Inventory

Not a rename/refactor phase. Not applicable. (One adjacent note: after deploy, runtime state exists in GitHub Pages config (Pages source = Actions) and in messenger caches, covered in the Pitfalls below.)

## Common Pitfalls

### Pitfall 1: Lighthouse SEO score is dragged down by noindex
**What goes wrong:** Lighthouse's `is-crawlable` audit fails on `<meta name="robots" content="noindex, nofollow">`. In the default SEO category it has weight 93/23 (about 4.04) against nine other audits of weight 1 each (document-title, meta-description, http-status-code, link-text, crawlable-anchors, robots-txt, image-alt, hreflang, canonical; some may be not-applicable and drop out), so SEO lands around 69 (about 4.04 of about 13.04 lost). [CITED: raw.githubusercontent.com/GoogleChrome/lighthouse/main/core/config/default-config.js; the ~69 figure is derived, confirm by measuring]
**Why it matters:** The Colophon shows a "SEO" chip. A bare 69 beside 100s reads as a defect to a hiring reviewer.
**How to avoid:** Show the measured number plus a static note: for example `검색 비노출 설정(noindex)으로 해당 항목 감점`. Static text with no digits. This needs a one-line UI-SPEC amendment and a `uiAllowlist` entry; the check must still prove the number equals the record. Do not strip noindex to measure and do not report a number from a non-deployed variant.
**Warning signs:** `is-crawlable` in the JSON `audits` with `score: 0`.

### Pitfall 2: robots.txt in a project subpath does nothing, and a host-level Disallow would hurt
**What goes wrong:** Crawlers fetch only `https://youyoonhee.github.io/robots.txt` (host root). "Crawlers don't check for robots.txt files in subdirectories" [CITED: developers.google.com robots_txt]. The host root file belongs to a user-site repo `youyoonhee/youyoonhee.github.io`, which **does not exist** (API 404) [VERIFIED: gh api GET]. So today there are no host rules.
**Consequence for previews:** with no host-level Disallow, preview crawlers are unaffected. Slack: "We do not currently honor robots.txt" [CITED: api.slack.com/robots]. Facebook (`facebookexternalhit`, which Kakao's scraper UA also contains: `facebookexternalhit/1.1; kakaotalk-scrap/1.0` [CITED: devtalk.kakao.com/t/scrap-url/116202]) "generally honors robots.txt but might bypass it" [CITED: developers.facebook.com web-crawlers]. Kakao documents no robots.txt or noindex rule at all [LOW: absence of evidence]. Apple Messages and LINE: no source found [LOW]. None of the sources say `noindex` meta blocks preview fetching.
**And for search engines:** if a host-level `Disallow: /` ever existed, Google could not fetch the page to see `noindex` and could list the bare URL without snippet [CITED: Google docs]. So the correct posture is: keep `noindex` as the control, keep the subpath `robots.txt` as a harmless courtesy (locked decision), never create the user-site repo with a Disallow.
**How to avoid:** README and Colophon must not claim robots.txt blocks crawlers. State in README: "`robots.txt` is a hint only; `noindex` is the control." Do not put the Pages URL in the repo's "Website" field or README link to limit discovery (obscurity only; a public repo name makes the URL guessable).

### Pitfall 3: check-content breaks in three places when the Colophon and footer link land
1. `footer` check: `textIn(footer) !== manifest.footer` and "copyright appears exactly once". Adding `<p><a>사이트 정보</a></p>` changes the footer text. Fix: compare only the copyright `<p>`/`<small>`, then assert separately that exactly one `a[href="#colophon"]` exists. [VERIFIED: check-content.mjs lines 441-448]
2. `sections` check requires an exact id list; add `"colophon"` after `"contact"` in `tools/content-manifest.json`. [VERIFIED: lines 117-127, 205-212]
3. **Pre-push source gates** (`source-reverse`, `source-numbers`, `source-coverage`) run whenever `.planning/source/portfolio-pdf.txt` exists locally, and they test **every** visible text and number against the source. Colophon strings (`측정 전`, `Colophon.`, "WCAG 2.2", `640px`, scores) will fail them. Fix: compute a second array `sourceTexts = visibleTexts` minus anything under `section#colophon` and `footer a` and use it only in the three source checks; add a dedicated `colophon` check (structure, row order, static rows equal the CSS breakpoints, measured rows equal `measurements.json`, null state shows only `측정 전`/`확인 전`, zero `data` chips if any null). Also add `사이트 정보`/`Colophon.` to `uiAllowlist` only if the exclusion approach is not used. Keep `forbidden` and phone checks on all text.
**Warning signs:** pre-push fails on a machine with the source text but CI/other machines pass (source checks SKIP there).

### Pitfall 4: Windows case-insensitivity hides broken URLs
The dev machine is case-insensitive; GitHub Pages (Linux) is case-sensitive. A CSS `url(../fonts/Pretendard/...)` or an image `src` with different case works locally and 404s live. The deployed-URL linkinator/network run catches it; also have `check-artifact` compare every `href/src/url()` reference in staged HTML/CSS against exact-case file names.

### Pitfall 5: 404.html and depth
`404.html` is served for any missing path under the project (status 404) and relative CSS would break at depth; the UI-SPEC already makes it self-contained with absolute `/portfolio-2026/...` links. GitHub's doc only says place `404.html` in the publishing source root [CITED: docs.github.com custom 404] and says nothing about project-site subpaths, so verify live: request `/portfolio-2026/x/y` and assert status 404, body contains the heading, no sub-request fails. Also note requests under `youyoonhee.github.io/` (not `/portfolio-2026/`) never reach this 404 page (no user site). Network-404 checks must exclude this intentional probe.

### Pitfall 6: Messenger caches
Kakao caches metadata and, separately, the thumbnail; the share debugger clears metadata only, so a changed image under the same URL can persist; cache-bust by changing the image URL (e.g. `og-card.png?v=2`, or a new file name) and treat trailing-slash vs no-slash URLs as separate cache entries [CITED: devtalk.kakao.com threads via search results]. LINE caches aggressively with no official purge [LOW: blog sources]. **Finalize `og-card.png` before the link is first sent to anyone**, then never change it in place.

### Pitfall 7: Second deploy after measurement
The Colophon can only be filled after the first live deploy (you measure the live site). Plan two deploys: deploy 1 with `측정 전`, run all live checks and the iOS UAT, fill `measurements.json`, run `colophon-sync`, re-run local checks, commit, dispatch deploy 2. Deploy 2 should be re-measured only if the HTML changed in ways that matter (Colophon text change is negligible, but state this in the Colophon via the date). The user must not send the link to recruiters between deploy 1 and 2 (D-04 release gate). Record this in the checkpoint text.

### Pitfall 8: `link` icon requests and Safari
Chrome with an explicit `<link rel="icon">` does not request `/favicon.ico`. Safari/iOS may request `/apple-touch-icon*.png` at the host root, which is `youyoonhee.github.io/apple-touch-icon.png` (404, outside this site). The explicit `<link rel="apple-touch-icon" href="apple-touch-icon.png">` makes iOS use the declared one. Headless Puppeteer never fetches favicons, so the network check cannot see this; the 404 criterion in QUAL-05 is about the page's own requests. [ASSUMED: Safari host-root icon probing behaviour]

## Code Examples

### Network 404 capture against any URL
```js
// Source: pptr.dev Page events 'response' / 'requestfailed'; repo tools/lib/browser.mjs
import { launchChrome, closeBrowser } from './lib/browser.mjs';
const target = process.argv[2];                       // deployed URL
const browser = await launchChrome();
const bad = [];
try {
  const page = await browser.newPage();
  for (const [w, h] of [[375, 812], [768, 1024], [1440, 900]]) {
    await page.setViewport({ width: w, height: h });
    page.removeAllListeners('response'); page.removeAllListeners('requestfailed');
    page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
    page.on('requestfailed', (r) => bad.push(`FAILED ${r.url()} ${r.failure()?.errorText}`));
    await page.goto(target, { waitUntil: 'networkidle0' });
    // scroll through so lazy images and dynamic font subsets load
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  }
} finally { await closeBrowser(browser); }
console.log(bad.length ? bad.join('\n') : 'network: 0 failing requests');
process.exit(bad.length ? 1 : 0);
```
Existing tools do **not** capture responses: `check-ui.mjs` only has `page.on('request')` (external-request guard, lines 77 and 778) and `check-layout.mjs` has none, and both start their own local server, so neither can target a deployed URL. A new small tool is required. Use a fresh context or disable cache so cached 304s do not hide 404s. Pretendard is `unicode-range` split, so scroll the whole page so every needed subset requests.

### linkinator against the deployed URL
```bash
# Source: `npx linkinator --help` (8.1.0), run locally
npx linkinator https://youyoonhee.github.io/portfolio-2026/ --recurse --check-css --check-fragments \
  --retry --retry-errors --retry-errors-count 2 --timeout 15000 --format json > dist/linkinator.json
```
External sites (samsungebiz, lg.co.kr, wecankids, fsdcosmetic, green-da) can answer 403/429 to bots. Do not silently `--skip` them: report each as a finding, check manually in a browser, and record only genuine breaks in `brokenLinks`. Update `npm run check:links` to add `--check-css --check-fragments` for the local run as well.

### Preview check
Fetch deployed HTML, assert each of: title/description equal the cover strings, `og:image` absolute and on the project base, `HEAD` returns 200 with `content-type: image/png`, content-length below 300KB, `sharp(buffer).metadata()` equals 1200x630, no `@` or phone-pattern in any tag value (`hasPhoneAnywhere`). No email in the image is guaranteed by construction (three text items).

### Lighthouse
```bash
# Source: github.com/GoogleChrome/lighthouse README
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
npx lighthouse@13.6.0 https://youyoonhee.github.io/portfolio-2026/ \
  --output=json --output-path=dist/lh-mobile.json \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new"
# scores: Math.round(json.categories.performance.score * 100) etc.
```
Default is mobile emulation with simulated slow-4G/4x CPU throttling; desktop is `--preset=desktop` [CITED: README]. The record schema has a single `form`, so record **mobile** (stricter), 3 runs and report the median, or one run, but record what was actually done. Windows may print a harmless temp-dir cleanup `EPERM` after the run [ASSUMED]. Note `robots-txt` audit reads the host root `/robots.txt` (404 there), which Lighthouse treats as valid [ASSUMED].

### Nu checker on the deployed page
```js
// Source: ran this shape against validator.w3.org/nu on 2026-11-16 with a synthetic head-only doc (returned {"messages":[]})
const html = await (await fetch(url)).text();
const res = await fetch('https://validator.w3.org/nu/?out=json', {
  method: 'POST',
  headers: { 'content-type': 'text/html; charset=utf-8', 'user-agent': 'portfolio-check/1.0' },
  body: html,
});
const errors = (await res.json()).messages.filter((m) => m.type === 'error').length;
```
Validates fetched source exactly as served, so also run it on the 404 page content. Do not send `index.html` before the user has approved publication (the content is going public, but it contains the email address). The synthetic test confirmed `format-detection`, `robots`, `theme-color`, `description`, `og:*` (`property=`), `twitter:card`, the two `rel=icon` forms and `apple-touch-icon` all produce no Nu messages.

### Footer link and print hiding
`print.css` already has a `body > footer` rule near line 184; add `#colophon, body > footer a { display: none !important }` inside `@layer print` per UI-SPEC, then re-run `check:shots-pdf`/`pdf-report` and assert page count is unchanged.

### Scroll-spy with a section that has no nav link
**RESOLVED: no guard needed.** In `js/main.js` the observer does `setCurrent(links.has(key) ? key : null)`, and `setCurrent(null)` clears `aria-current` on every link without throwing. `#colophon` (an observed `main > section[id]`) therefore clears the highlight rather than throwing or sticking on Contact. Keep the UI-SPEC's conditional guard out of the plan; instead add one `check-ui` assertion (scroll to `#colophon`, expect zero links with `aria-current` and no page error). [VERIFIED: js/main.js lines 116-134]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Deploy a branch (`gh-pages`/root) | Actions artifact + `deploy-pages` with `build_type=workflow` | Actions-based Pages is the default path | Allowlist staging is possible, `.nojekyll` unnecessary |
| `upload-pages-artifact` v3 tar of all files | v5 excludes hidden files by default | v4+ | Dotfiles never ship; matches D-02 |
| Squoosh/jsPDF etc. | Already settled in CLAUDE.md | - | not relevant here |

**Deprecated/outdated:** `actions/*` v3/v4 majors shown in older docs; use the latest majors listed above. `check:links` without `--check-css` silently skips fonts.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lighthouse SEO will be about 69 with noindex | Pitfall 1 | Colophon note text/expectation off; low, measurement decides |
| A2 | Safari/iOS probes host-root apple-touch-icon | Pitfall 8 | None practical; explicit link already declared |
| A3 | sharp SVG `density` gives crisp 32/180 PNGs | Pattern 5 | Blurry icon; caught by visual check |
| A4 | Windows Lighthouse prints harmless EPERM on cleanup | Code Examples | Might look like a failure; read the JSON file |
| A5 | Kakao, LINE, Apple Messages ignore robots/noindex for previews (no vendor statement found) | Pitfall 2 | If one honors robots, subpath file is still ignored, so no effect either way |
| A6 | `lighthouse` npm package is legitimate (slopcheck not runnable) | Package Legitimacy | Add a human-verify checkpoint before first `npx` |
| A7 | `check-repo.mjs` needs no non-builtin imports so CI needs no `npm ci` | Pattern 1 | CI fails fast on first run; add `npm ci --ignore-scripts` |
| A8 | Kakao sharing debugger exists at developers.kakao.com (login required) for metadata cache reset | Pitfall 6 | Use `?v=` cache bust instead |

## Open Questions

1. **How should the SEO chip be shown given noindex?** (RESOLVED, needs user confirmation as a UI-SPEC note)
   - Recommendation: show the measured number plus a static annotation (Pitfall 1). Planner should ask the user once at the checkpoint.
2. **Which validator fills `htmlErrors`: html-validate or W3C Nu?** (RESOLVED)
   - UI-SPEC says "html-validate and the deployed-URL linkinator run"; CLAUDE.md prescribes Nu on the deployed URL as the final check.
   - Recommendation: html-validate must be 0 locally as a gate; record the **Nu error count from the deployed URL** in `validator.htmlErrors`, because it is independent and measured on the live page. Label in Colophon stays `HTML 검증 오류 {n}건`.
3. **Edge testing method.** (RESOLVED with fallback)
   - `launchChrome` is Chrome-only by design. Try once: `CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` with a hard 60s timeout on the preview-screenshot check. If it hangs or fails, ask the user to open the live URL in Edge desktop and record via UAT. Record `method: "headless"` only for runs that actually executed; Colophon lists Edge only if tested.
4. **Does a `404.html` at the artifact root serve for nested project paths?** (OPEN until live)
   - GitHub docs are silent on subpaths. Verify live with `/portfolio-2026/x/y` (status 404 + styled body). Fallback: none needed; unstyled default GitHub 404 would just fail the check and be fixable.
5. **Does `site.webmanifest` cost nothing?** (RESOLVED: skip)
   - UI-SPEC already skips it. The static server has no MIME for it and Nu/Lighthouse add no value.
6. **Is `img/` going to exist in the artifact before screenshots?** (RESOLVED)
   - `img/` is empty and untracked today. The only required file is `img/og-card.png`; `check-artifact` must tolerate missing `img/projects/` but require `og-card.png`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all tools, Lighthouse CLI | yes | v22.23.4 (engines >=22.22 ok; lighthouse needs >=22.19) | - |
| Google Chrome | OG render, checks, Lighthouse | yes | 157.0.8103.78 | `CHROME_PATH` |
| Microsoft Edge | QUAL-04 | yes (installed) | 157.0.4341.x | headless is documented to hang; user checks manually |
| gh CLI | enable Pages, dispatch, watch | yes | logged in as repo owner, admin permission | - |
| GitHub repo | DEPL-01 | yes | public, default branch `main`, Pages not enabled | - |
| iOS device | QUAL-04 iOS | unknown (user) | - | record as gap; never claim tested |
| Internet to validator.w3.org | Nu check | yes (tested) | server 26.11.14 | html-validate only (then say so) |
| slopcheck | package audit | no (install denied) | - | all new npx packages flagged `[ASSUMED]` |

**Missing dependencies with no fallback:** none for the buildable work. The live phase is blocked on screenshots (D-04) and the user's iOS device.
**Missing dependencies with fallback:** Edge automation, slopcheck.

## Validation Architecture

(`workflow.nyquist_validation` is `false` in `.planning/config.json`; included because the orchestrator requested it.)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Plain Node scripts with RED/GREEN self-tests (no jest/vitest) |
| Config file | none; `package.json` scripts |
| Quick run command | `npm run check:content && npm run check:repo && node tools/check-artifact.mjs --self-test` |
| Full suite command | `npm run check` (+ `check:layout`, `check:ui`, new `check:artifact`) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPL-01 | Workflow stages, verifies, deploys | static + live | `node tools/stage-pages.mjs dist/site && node tools/check-artifact.mjs dist/site`; live `gh run watch` | Wave 0 |
| DEPL-02 | noindex on index and 404, robots.txt content | unit | extend `check-content`/new `check-meta` asserting both heads | Wave 0 |
| DEPL-03 | OG tags equal cover strings, image 1200x630 PNG under 150KB, favicon files exact sizes, 180 has no alpha | unit | `node tools/check-preview.mjs` (local file mode) then URL mode live | Wave 0 |
| DEPL-04 | README exists, no phone pattern, mentions commands | unit | `check:repo` (scans README) + grep assertions in `check-content` | Wave 0 |
| QUAL-04 | Chrome widths 375/768/1024/1440 same layout; iOS UAT | automated + manual | `npm run check:layout && npm run check:ui`; UAT file for iOS/Edge | partial |
| QUAL-05 | 0 broken links, 0 failing requests live | live | linkinator command above; `node tools/check-network.mjs <url>` | Wave 0 |
| QUAL-06 | Colophon equals record; null state; print hidden; page count unchanged | unit | extended `check-content` colophon check; `colophon-sync --check`; `pdf-report` | Wave 0 |

### Sampling Rate
- **Per task commit:** the relevant single tool plus `npm run check:repo`
- **Per wave merge:** `npm run check` plus `check:layout`, `check:ui`
- **Phase gate:** full suite green, artifact verify clean, phone scans 0, then the human checkpoint, then live checks

### Wave 0 Gaps
- [ ] `tools/check-artifact.mjs` (+ self-test), `tools/stage-pages.mjs`, `check-repo.mjs --dir`
- [ ] `tools/check-network.mjs`, `tools/check-preview.mjs`, `tools/colophon-sync.mjs`, `tools/measurements.json`
- [ ] check-content changes (footer, sections, source-array exemption, colophon check, 404 token equality, OG strings equality)
- [ ] `validate` script extended to `404.html`; `check:links` flags; `.gitignore` already covers `dist/`

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | static site; `gh` uses the user's existing login, Claude never handles tokens (D-03) |
| V3 Session Management | no | none |
| V4 Access Control | partial | Actions `permissions` least-privilege; `pages: write`/`id-token: write` only on the deploy job |
| V5 Input Validation | partial | artifact allowlist is the control; Nu/html-validate for markup |
| V6 Cryptography | no | HTTPS provided by Pages; no custom crypto |
| V8 Data Protection / privacy | yes | phone only in gitignored `private/`; pattern scans on tree, history and artifact |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| PII (phone) published via artifact or git history | Information Disclosure | `check-repo` tree + history + new `--dir` scan; `.pdf`/`private/`/`dist/` forbidden; allowlist staging |
| Over-broad artifact (`tools/`, `.planning/`, `package.json`) | Information Disclosure | stage by allowlist, independent verifier, fail the job |
| Compromised third-party action | Tampering | first-party `actions/*` only; consider pinning to full commit SHA after choosing the versions [ASSUMED best practice] |
| Excessive token permissions | Elevation | top-level `contents: read`, per-job Pages permissions |
| Reviewer sees unreviewed screenshots | Information Disclosure | dispatch-only deploy plus human checkpoint (D-04) |
| Link preview leaks email/phone | Information Disclosure | OG text limited to three strings; `check-preview` pattern scan of tags |

## iOS Safari real-device checklist (for the UAT file)

Features specific to this site that Safari can break, with the exact thing to look at (user runs on the deployed URL; iOS version recorded):
1. **Font actually rendering:** body and headings look like Pretendard (not San Francisco/Apple SD Gothic Neo): check the heavier headline weight and the Hangul letterforms; scroll to confirm text does not flash/swap late. (Dynamic `unicode-range` subsets; a failed subset falls back silently.)
2. **CSS nesting:** needs iOS 17.2+. If the device is on 17.0/17.1, the layout will be unstyled and that is a known unsupported range; record the iOS version.
3. **`:has()` states:** project card hover/focus states cannot be tested with hover on touch; tap a card thumbnail and confirm the focus/tap response (screens in Phase 4).
4. **Menu:** at portrait phone width the header shows the toggle; open, scrolling is locked behind the overlay, close via the button and via tapping a section link; check the header hide/show on scroll and that the notch/URL-bar collapse does not leave a gap.
5. **Zoom dialog (`<dialog>` + `showModal()`):** open a screenshot, pan the long screenshot inside, scroll does not leak to the page behind (`overscroll-behavior: contain`), close button and swipe-back/Escape-equivalent work, focus returns to the thumbnail.
6. **Anchor navigation:** Keywords/Skills/Career/Contact links land below the sticky header (`scroll-margin-top`), and the new footer `사이트 정보` link goes to `#colophon`.
7. **Links open:** external links open in a new tab (labelled `(새 탭)`), `mailto:` opens Mail, and phone-number auto-linking is absent (`format-detection=telephone=no`).
8. **Rotation and zoom:** rotate to landscape and back; pinch zoom works (no `user-scalable=no`); no horizontal scroll at 375px.
9. **Favicon / home screen:** optional: Add to Home Screen shows the green Y icon without black corners (the 180px icon has no alpha).
10. **Link preview in a real messenger:** paste the live URL into KakaoTalk (and iMessage if available) and note whether title, description, and image appear. (This is also where Kakao scrap success is confirmed.)
Record: device model, iOS version, pass/fail per item, date. If the device is unavailable, write the gap into 05-HUMAN-UAT; Colophon prints `iOS Safari · 실기기 확인 전`.

## Sources

### Primary (HIGH confidence)
- Local files read: `tools/check-repo.mjs`, `tools/lib/browser.mjs`, `tools/lib/static-server.mjs`, `tools/check-content.mjs`, `tools/content-manifest.json`, `tools/check-ui.mjs` (grep), `js/main.js`, `css/*.css` (grep), `package.json`, `.gitignore`, `.githooks/pre-push`, `.planning/config.json`
- `gh api repos/actions/{checkout,configure-pages,upload-pages-artifact,deploy-pages,setup-node}/releases/latest` (versions and dates above)
- `gh api` GETs: repo public/default branch/admin; `/pages` 404 (not enabled); `youyoonhee/youyoonhee.github.io` 404
- https://docs.github.com/en/rest/pages/pages (POST/PUT `build_type=workflow`)
- https://github.com/actions/upload-pages-artifact (inputs, hidden files, symlinks, size)
- https://github.com/GoogleChrome/lighthouse (CLI flags, Node 22)
- https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/core/config/default-config.js (SEO audit weights)
- https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt (root-only, subdirectory files not honored)
- `npx linkinator --help` (8.1.0): `--check-css` and `--check-fragments` default off
- W3C Nu POST test with synthetic doc: zero messages (server 26.11.14)
- `npm view` for linkinator, sharp, puppeteer-core, lighthouse

### Secondary (MEDIUM confidence)
- https://api.slack.com/robots ("We do not currently honor robots.txt" per search summary)
- https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/ (generally honors robots.txt; may bypass; OG within first 1MB)
- https://devtalk.kakao.com/t/scrap-url/116202 and related threads (scrap UA, JPG/PNG only, 800x400 2:1 optimum, og:url matching, cache behaviour)
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site

### Tertiary (LOW confidence)
- Third-party notes on LINE/WhatsApp image limits and caching; Apple Messages preview requirements could not be retrieved from the Apple page that was fetched (content mismatch), so Apple behavior is `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, all tools already installed and version-checked
- Architecture: HIGH, workflow/API shapes confirmed from official docs and release data
- Pitfalls: MEDIUM-HIGH, Lighthouse score figure is derived, messenger behavior partly undocumented
- Existing-code integration: HIGH, read directly from source

**Research date:** 2026-11-16
**Valid until:** 2026-12-16 (Actions majors move; recheck `gh api .../releases/latest` before writing the workflow)
