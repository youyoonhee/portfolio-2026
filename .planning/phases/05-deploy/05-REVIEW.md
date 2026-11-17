---
phase: 05-deploy
reviewed: 2026-11-17T00:00:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - .githooks/pre-push
  - .github/workflows/pages.yml
  - 404.html
  - README.md
  - css/components.css
  - css/layout.css
  - css/print.css
  - favicon.svg
  - index.html
  - package.json
  - robots.txt
  - tools/check-artifact.mjs
  - tools/check-content.mjs
  - tools/check-images.mjs
  - tools/check-layout.mjs
  - tools/check-network.mjs
  - tools/check-nu.mjs
  - tools/check-preview.mjs
  - tools/check-repo.mjs
  - tools/check-shots-pdf.mjs
  - tools/check-ui.mjs
  - tools/colophon-sync.mjs
  - tools/content-manifest.json
  - tools/make-deco.mjs
  - tools/make-og.mjs
  - tools/measurements.json
  - tools/og-card.html
  - tools/optimise-images.mjs
  - tools/record-measurements.mjs
  - tools/screenshots.json
  - tools/stage-pages.mjs
findings:
  critical: 0
  warning: 8
  info: 9
  total: 17
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-11-17
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Scope: Phase 5 changes since `cb88ae8`, plus quick tasks 261117-fxc and 261117-klf. That covers the Pages workflow, staging and the artifact verifier, the privacy scanners, the Colophon record pipeline, 404/OG/meta, the decorative images and the check tools.

What holds up:
- **Workflow.** Deploy runs only on `workflow_dispatch`. Permissions are least-privilege: `contents: read` at the top, and `pages: write` / `id-token: write` only on the deploy job. All five action SHA pins match their tags upstream (checked with read-only `git ls-remote`). The `github-pages` environment only accepts deploys from `main` (checked with a read-only `gh api` call).
- **Artifact gate.** It fails closed. Staging works from an allowlist, a separate verifier checks the result against its own allowlist, and the phone scan rejects symlinks, unreadable files and unknown binaries. I found no way past the phone or allowlist gates.
- **404 and meta.** 404 and OG/meta values are consistent with each other and with `check-preview`.
- **Decorative images.** They use `alt=""`, have no pointer events, and are hidden in print.

The weak spot is the Colophon pipeline. It is meant to guarantee there are no invented values, but several measurement inputs **fail open**:
- the HTML-validator count ignores some error types;
- the broken-link re-check forgives links whose fragment is broken;
- a failed Lighthouse run can disappear into the median;
- the "SEO lost points only because of noindex" note is never checked.

Separately, the content gate's exemption for the Colophon and the footer is wider than the rows it pins. No BLOCKER-level defect was proven in the shipped output, but these gaps could let wrong recruiter-facing figures ship without any check failing.

## Warnings

### WR-01: check-nu counts only `type === 'error'`, so validator failures are recorded as "0 errors"

**File:** `tools/check-nu.mjs:13-21, 75-77, 90`
**Issue:** The Nu JSON format also reports problems as `type: "non-document-error"`, for example when the service cannot read or decode the input. `countMessages` ignores that type. A response without a `messages` array (`data.messages` is undefined) also yields `{ errors: 0 }`. Either way the tool exits 0 and writes `errors: 0` to the `--out` report. `record-measurements.mjs:113` then copies that into `validator.htmlErrors`, and the Colophon publishes "HTML 검증 오류 0건" for a page that was never actually validated.
**Fix:**
```js
if (!Array.isArray(data.messages)) { console.log('nu: malformed response'); return 2; }
for (const m of messages) {
  if (m.type === 'error' || m.type === 'non-document-error') errors++;
  else if (m.subType === 'warning') warnings++;
}
```
Also store `nonDocument` separately and have `record-measurements` refuse a report where it is greater than 0.

### WR-02: The broken-link re-check forgives broken fragments and anything that answers once

**File:** `tools/record-measurements.mjs:54-70`
**Issue:** Linkinator runs with `--check-fragments` (package.json `check:links`). `countBroken` then re-fetches every link marked BROKEN with a plain GET and does not count it if the status is below 400. `fetch` never sends the fragment, so a link like `index.html#missing-id` that linkinator flagged comes back 200 and disappears. Transiently flaky links are forgiven in the same way. The Colophon's "깨진 링크 0건" can therefore understate the real result, and nothing in the record shows that links were forgiven.
**Fix:** Do not re-check links that contain `#`, or links whose linkinator failure was a fragment error; count them as broken. Record the number of forgiven URLs in the report, and make the README say that a re-check was applied.
```js
const broken = [...new Set(links.links.filter((l) => l.state === 'BROKEN' && !String(l.url).startsWith('mailto:')).map((l) => l.url))];
for (const u of broken) if (new URL(u).hash || !(await recheckFn(u))) n++;
```

### WR-03: Lighthouse summary can hide an errored run and accepts runs of different pages

**File:** `tools/record-measurements.mjs:31, 34-51`
**Issue:**
- **Errored runs.** When a category score is missing or null, `cat()` maps it to `NaN`. Sorting with `(x, y) => x - y` and a `NaN` operand is inconsistent, so for `[NaN, 90, 95]` the "median" can come out as a real number. An errored run is then silently replaced by a plausible score; validation only catches the case where `NaN` itself lands in the middle.
- **Mixed pages.** Runs are never checked for the same `requestedUrl`/`finalUrl`, or for the deployed URL. Localhost runs, or runs of different pages, can be mixed into the published Colophon numbers.
- **Mixed sources.** The `--nu` and `--links` reports are not checked to refer to the same target (`nu.source`), and `measuredAt` comes from the Lighthouse runs alone.

**Fix:**
```js
for (const r of runs) for (const k of ['performance','accessibility','best-practices','seo'])
  if (typeof r.categories?.[k]?.score !== 'number') throw new Exit(1, `run missing ${k} score`);
const urls = new Set(runs.map((r) => r.finalDisplayedUrl ?? r.finalUrl));
if (urls.size !== 1) throw new Exit(1, 'lighthouse runs target different URLs');
```
Also require `nu.source` to equal that URL.

### WR-04: "SEO는 검색 비노출 설정(noindex)으로 감점" is printed without checking that noindex is the only failing audit

**File:** `tools/record-measurements.mjs:49`, `tools/colophon-sync.mjs:82`, `index.html:439`
**Issue:** `crawlableFailed` only checks that `is-crawlable` scored 0. The Colophon then states that the SEO score was lowered *because of* noindex. The recorded score is 63. The tool's own self-test uses 69 as the noindex-only example (`colophon-sync.mjs:198`), and 69 also matches Lighthouse's SEO weighting when only `is-crawlable` fails. That gap suggests at least one more SEO audit is failing or partly failing, so the published explanation is probably incomplete. The record cannot confirm or refute this. On a recruiting page, an unverified explanation is exactly what the "no invented facts" rule exists to prevent.
**Fix:** Record the IDs of the failing SEO audits: `Object.values(r.audits).filter(a => a.score !== null && a.score < 1 && seoRefs.includes(a.id))`. Emit the noindex note only when `is-crawlable` is the **only** failing SEO audit in every run. Otherwise, fix the other audit or change the wording.

### WR-05: The Colophon's "반응형 구간" row is derived from `layout.css` only and leaves out breakpoints the site uses

**File:** `tools/check-content.mjs:251-256`, `index.html:436`, `css/components.css:92,123,230,622,782`
**Issue:** The breakpoint list is built from `@media (min-width: Npx)` and `@container company (min-width: Npx)` in `css/layout.css` only. `components.css` also has a 480px step (`max-width: 479.98px`), which the Colophon list itself (`components.css:622`) and the meta rows use. It also has a 360px container step (`@container company (max-width: 359.98px)`, line 577). The published "640px · 900px · 1024px" is a factual claim about the site, and it is incomplete. The check enforces that incompleteness instead of catching it.
**Fix:** Scan every file under `css/` except `print.css`. Collect both `min-width: N` and `max-width: N.98` (normalised to N+0.02). Then either list all of them, or narrow the label to what is actually listed, for example "페이지 레이아웃 구간".

### WR-06: The content-gate exemption covers more than the rows it pins

**File:** `tools/check-content.mjs:119-133, 230-269, 507-515`
**Issue:** `underColophonOrFooterLink` removes **all** text under `section#colophon`, and **all** text inside any `<a>` in the footer, from `source-reverse`, `source-numbers` and `source-coverage`. Those three are the "no invented facts" gates. The `colophon` rule pins only the eyebrow, h2, the first non-eyebrow `<p>`, the dt list and the dd contents. Anything else added under `#colophon` would bypass every source check: a second `<p>`, an extra `<li>` outside the `dl`, a `<figure>` caption. The `footer` rule likewise counts only `href="#colophon"` anchors, so any other footer link text with invented content would also bypass them.
**Fix:**
- Make the `colophon` rule exhaustive: assert that `sec`'s element children are exactly `[p.eyebrow, h2, p, dl.colophon-list]`, and that `textIn(sec)` equals the concatenation of the pinned parts.
- In `footer`, require exactly one `<a>` in the footer, not just one `#colophon` anchor.
- Narrow the exemption to the pinned nodes only, for example by matching `dd[data-measured]` and the three static dd elements.

### WR-07: `stage-pages.mjs dist` deletes the whole `dist/` folder

**File:** `tools/stage-pages.mjs:10-15, 52`
**Issue:** The guard allows `rel === ''`, so `out === dist/` passes, and line 52 then runs `rmSync(out, { recursive: true, force: true })`. That wipes `dist/` entirely, including measurement reports that `record-measurements` requires to live in `dist/` and any generated PDF. The header comment explicitly says "out must be dist or inside dist", so this is a documented foot-gun.
**Fix:**
```js
if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) { console.error('stage-pages: output must be a sub-folder of dist/'); process.exit(2); }
```

### WR-08: check-artifact resolves root-absolute refs against the artifact root, which hides breakage on the project subpath

**File:** `tools/check-artifact.mjs:64-66`
**Issue:** A reference like `/css/x.css` or `url(/fonts/print/a.ttf)` is mapped to `css/x.css` inside the artifact and reported OK. On GitHub Pages the site is served under `/portfolio-2026/`, so those URLs resolve to the host root and return 404. The only other guard is the `paths` rule in `check-content.mjs:550-559`, and it has two gaps:
- it covers `index.html` attributes only, not CSS `url()`;
- it checks `srcset` with `startsWith('/')` on the whole attribute value, so an absolute second candidate (`a.jpg 1x, /b.jpg 2x`) is missed.

Separately, `exactExists` returns `ok` for a target that is a directory.
**Fix:** In `checkRef`, reject any `/`-prefixed value that does not start with `BASE_PREFIX`. Allow `BASE_PREFIX` only in `404.html`.
```js
if (v.startsWith('/') && !(file === '404.html' && v.startsWith(BASE_PREFIX))) { problems.push(`FAIL ref-absolute ${ref} in ${file}`); return; }
```
Also make `exactExists` require `lstatSync(cur).isFile()`.

## Info

### IN-01: robots.txt is never consulted for a project Pages site and contradicts noindex

**File:** `robots.txt:1-2`, `tools/check-preview.mjs:148-149`
**Issue:** Crawlers read `https://youyoonhee.github.io/robots.txt`, not `/portfolio-2026/robots.txt`. The README acknowledges this, but `check-preview` still enforces the exact content. If the site ever moves to a root or custom domain, `Disallow: /` would stop crawlers from fetching the page, so they would never see the `noindex` meta, and the URL could be indexed without a snippet.
**Fix:** Ship an empty-allow robots.txt (or none) and rely on `noindex`, or add a comment explaining why it is kept.

### IN-02: The phone scan skips image files entirely

**File:** `tools/check-repo.mjs:82-86, 105`
**Issue:** PNG/JPEG/WebP/AVIF/TTF/WOFF2 files that pass their signature check return 0 without scanning, so metadata chunks such as PNG `tEXt`/`iTXt`, EXIF and XMP are never inspected. Today sharp strips metadata on output, but nothing enforces that.
**Fix:** In `check-images`, assert that published files carry no EXIF, XMP or text chunks; or scan known metadata segments for the phone pattern.

### IN-03: Hard-coded empty-frame counts (9, 11) in check-ui and optimise-images

**File:** `tools/check-ui.mjs:562, 632`, `tools/optimise-images.mjs:627`
**Issue:** These counts break silently the next time a project is added or removed. `check-shots-pdf.mjs` already derives `EXPECTED` from the manifest; these checks should do the same (`projects.length - 2`).

### IN-04: An empty footer `<p>` remains in the PDF

**File:** `css/print.css:189-191`, `index.html:448`
**Issue:** `body > footer a { display: none }` leaves the wrapping `<p>` in place as an empty block. Hide the paragraph instead, for example `body > footer p:has(> a[href="#colophon"])`.

### IN-05: Stale public HTML comment

**File:** `index.html:12`
**Issue:** "스크린샷 슬롯은 Phase 4 전까지 비워 두고" no longer matches the page, which now has seven filled frames. The comment ships to the public page, where reviewers will read it as source code.

### IN-06: English token without `lang` in the Colophon

**File:** `tools/colophon-sync.mjs:81`, `index.html:439`
**Issue:** "측정 환경: mobile" puts an English word inside Korean text without `lang="en"`, so screen readers read it with Korean pronunciation. Wrap it as `<span lang="en">${l.form}</span>`, as is already done for the score labels.

### IN-07: The provenance of the decorative images is not documented

**File:** `README.md:13-17`, `img/deco/*.png`, `tools/make-deco.mjs:1-5`
**Issue:** The "가져온 것" section lists only Pretendard. The deco PNGs are made from outside pixel-art JPGs whose source and license are not recorded anywhere in the repo, and this is a public portfolio repo.
**Fix:** Add the source and license, or "직접 제작", to the README.

### IN-08: Checkout persists credentials; the workflow has no job timeouts

**File:** `.github/workflows/pages.yml:21-23`
**Issue:** `actions/checkout` keeps the `GITHUB_TOKEN` (read scope) in `.git/config` for the rest of the job. Nothing here needs it after checkout.
**Fix:** Add `persist-credentials: false`. Also add `timeout-minutes` to both jobs. Deploy protection currently depends on an environment branch policy outside the repo (it is set to `main`); an explicit `if: github.ref == 'refs/heads/main'` on `deploy` would also record that intent in code.

### IN-09: check-network double-counts a failing main document and flags aborted requests

**File:** `tools/check-network.mjs:37-43, 56-57`
**Issue:** A main document returning 400 or above is recorded twice: once by the `response` listener and once explicitly. `requestfailed` also fires for `net::ERR_ABORTED`, for example when navigation or scrolling cancels a lazy image, which can make the check flaky.
**Fix:** Ignore `errorText === 'net::ERR_ABORTED'`, and drop the explicit push when the listener already recorded it.

---

_Reviewed: 2026-11-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
