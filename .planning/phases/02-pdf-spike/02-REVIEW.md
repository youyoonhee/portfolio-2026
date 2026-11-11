---
phase: 02-pdf-spike
reviewed: 2026-11-11T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - index.html
  - css/layers.css
  - css/reset.css
  - css/tokens.css
  - css/fonts.css
  - css/fonts-print.css
  - css/base.css
  - css/layout.css
  - css/components.css
  - css/utilities.css
  - css/print.css
  - tools/copy-fonts.mjs
  - tools/check-contrast.mjs
  - tools/check-layout.mjs
  - tools/lib/static-server.mjs
  - tools/spike-pdf.mjs
  - tools/pdf-report.mjs
  - tools/check-content.mjs
  - tools/content-manifest.json
  - package.json
  - .gitattributes
findings:
  critical: 2
  warning: 7
  info: 4
  total: 13
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-11-11
**Depth:** standard
**Files Reviewed:** 21 (the config listed 22 paths including a glob; `.gitattributes` and `package.json` included)
**Status:** issues_found

## Summary

The CSS is in good shape. The layer order is declared first, `@font-face` URLs resolve correctly from `css/`, the container-query grid logic is sound, and print overrides win through layer order. The markup is semantic and has no accessibility defects that need blocking.

The two real defects are both in the tooling. Each is a control whose purpose fails silently:

1. The static server's dot-segment and denylist protection can be bypassed with a backslash on Windows. I reproduced this.
2. The content check's reverse "no invented content" test skips every Korean-only string, because of a regex bug. I reproduced this.

No phone number or phone-like digit string appears in this report. The `fonts/print/*.ttf` raw-regex hits are the known binary false positive and were not counted.

## Critical Issues

### CR-01: Static server denylist bypass via backslash (Windows)

**File:** `tools/lib/static-server.mjs:30-35`
**Issue:** Segments are split only on `/` (`/[\/]+/`), but `join`/`resolve` on Windows also treat `\` as a separator. A request such as `/css%5C..%5Cprivate%5Cfile.html` becomes the single segment `css\..\private\file.html`. That segment does not start with `.` and is not in `DENIED_SEGMENTS`. After `resolve` it lands in `<root>/private/file.html`, which passes the `startsWith(base + sep)` check.

I confirmed this by serving a probe file in `private/`. `/private/x.html` returned 404, but the `%5C` variant returned 200. The same trick reaches `.planning/*.html`, `.git/*`, `node_modules/` and `_screenshots/` for any allowlisted extension. Windows also strips trailing dots and spaces, so `private./x` is a second candidate bypass. The server is loopback-only on an ephemeral port, which limits exposure. But the denylist, whose stated purpose is to protect private material, does not work on the target platform.
**Fix:**
```js
const segments = pathname.split(/[\/\\]+/).filter(Boolean);
if (segments.some((s) => /[:<>"|?*]/.test(s) || /[. ]$/.test(s) || s.startsWith('.') || DENIED_SEGMENTS.has(s.toLowerCase()))) return deny();
// defense in depth: validate the real path, not the request path
const real = await realpath(file);
const rel = relative(base, real).split(sep);
if (rel[0] === '..' || isAbsolute(relative(base, real)) || rel.some((s) => s.startsWith('.') || DENIED_SEGMENTS.has(s.toLowerCase()))) return deny();
```
Also reject any `pathname` containing `\`.

### CR-02: `source-reverse` check silently skips all Hangul-only text

**File:** `tools/check-content.mjs:~594` (in `register('source-reverse', ...)`, the line `if (n === '' || /^[\d\W_]*$/u.test(n)) continue;`)
**Issue:** In JavaScript, `\W` is ASCII-based even with the `u` flag. Every Hangul character is therefore `\W`. I verified `/^[\d\W_]*$/u.test('반응형웹')` returns `true`. Every visible string made only of Korean (plus digits and punctuation) is skipped as "no letters", so it is never compared against the source text. The intro, the project descriptions, the status labels and the section copy fall into this category. This undermines the project's core constraint, "do not invent content not in the source PDF". `npm run check:source` reports PASS while verifying only strings that contain Latin letters.
**Fix:** Test for the absence of any letter rather than for `\W`:
```js
if (n === '' || !/\p{L}/u.test(n)) continue;   // digits/punctuation-only strings are covered by source-numbers
```
After the fix, run `check:source` locally and update `uiAllowlist` for any legitimately new UI strings that now surface.

## Warnings

### WR-01: `check-layout` cleanup kills its own PowerShell

**File:** `tools/check-layout.mjs:231-234`
**Issue:** The PowerShell command line contains the profile tag (`'*${tag}*'`). The `Where-Object { $_.CommandLine -like ... }` filter therefore also matches the powershell process running it. It calls `Stop-Process` on itself, possibly before it reaches the browser child processes still holding the profile. The result is orphaned `msedge` processes and a profile directory that cannot be deleted (the `rmSync` failure is swallowed). The tag is random, so unrelated processes are not hit, which is good.
**Fix:** Exclude the current process: `... -and $_.ProcessId -ne $PID`. Also use `taskkill /T /F /PID ${proc.pid}` first.

### WR-02: `spike-pdf` child and profile cleanup is unreliable on Windows

**File:** `tools/spike-pdf.mjs:73-100`
**Issue:**
- `process.kill(-child.pid)` throws on Windows (negative PIDs are unsupported). It is swallowed, so only the launcher PID is killed and Edge's renderer and GPU children survive.
- On the timeout path (and on any exception) the browser keeps running and holds locks on the profile. The two `rmSync` retries fail silently, which leaks `spike-pdf-profile-*` under the temp directory.
- `spawn` has no `'error'` listener. An ENOENT or EACCES is emitted as an unhandled `error` event, which crashes the process without running the `finally`.
- The loop waits the full 30 s even if the browser exited early without writing a PDF.
- `--lazy-fixture` together with `--url` writes fixture files that are never used.

Argument injection through spawn is not possible, since an argv array is used with no shell. Output is correctly confined to `dist/`. `--url` and the `BROWSER` env var are operator-supplied; consider rejecting `--url` values starting with `-` so the URL cannot be read as a browser flag.
**Fix:** Add `child.on('error', ...)` and `child.on('exit', ...)` to stop waiting early. On win32 kill with `spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'])`. Make the final `rmSync` failure visible with `console.warn`.

### WR-03: Static server does not validate the Host header

**File:** `tools/lib/static-server.mjs:24-41`
**Issue:** The server binds to 127.0.0.1, but it does not check `req.headers.host`. A DNS-rebinding page can read responses from the ephemeral port while a check runs. This is low risk with only allowlisted extensions, but it compounds CR-01. It also serves any HTTP method.
**Fix:** `if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host ?? '')) return deny();` and allow only GET and HEAD.

### WR-04: `check-layout` debugging port collision and hard-coded fixtures

**File:** `tools/check-layout.mjs:79-93, 137, 147`
**Issue:**
- The CDP port is random in 9400-9499, and nothing verifies that the process answering `/json/list` is the browser just spawned. If the port is taken by another debuggable browser, the check drives the wrong one.
- The check hard-codes `g.length === 4` and `eq.cards === 7`. Adding or removing a company or project breaks the check even when the layout is correct. The fixed 800 ms plus 300 ms sleeps are also a flakiness source.
**Fix:** Use `--remote-debugging-port=0` and read `DevToolsActivePort` from the profile directory. Derive the expected counts from `content-manifest.json`.

### WR-05: Fixed header height cannot absorb wrapped nav (no-JS state)

**File:** `css/tokens.css:50-54`, `css/components.css:60-75`
**Issue:** Below 900 px without JS, `--header-h` is fixed at 112px (a 64px wordmark row plus a 48px nav row). The nav `ul` is allowed to `flex-wrap`. At 320 px, or with a larger browser font size, the four links wrap to a second line. The header then grows beyond 112px and covers the top of `body` content and anchor targets (`scroll-padding-top` is also 112px). The same applies if the hamburger menu is opened in Phase 3.
**Fix:** Keep the nav on one line (reduce `gap`, or use a `scroll-snap` row). Or measure the header height in JS and write it to `--header-h`.

### WR-06: `copy-fonts` deletes outputs before verifying inputs

**File:** `tools/copy-fonts.mjs:15-22`
**Issue:** `rmSync` of `fonts/pretendard` and `fonts/print` runs before any source file is confirmed to exist. If `node_modules/pretendard` is partial or its layout differs (the version check passes), the committed fonts are destroyed and then `readdirSync` or `readFileSync` throws, leaving the repo half-generated. The `FONT_OUT` override is also unvalidated, so a bad value deletes directories at an arbitrary location.
**Fix:** Read and validate all sources first (for example, assert that each weight yields 92 subset files). Write to a temp directory and rename. Restrict `FONT_OUT` to be inside the repo or the temp directory.

### WR-07: `img` reset caps width but does not keep the aspect ratio

**File:** `css/reset.css:25-30`
**Issue:** `img, picture, svg, video { max-inline-size: 100% }` has no `block-size: auto`. CLAUDE.md requires `width` and `height` attributes on images (CLS). When the container is narrower than the attribute width, the image will be squeezed horizontally and distorted. This is latent until Phase 4 adds screenshots.
**Fix:** Add `block-size: auto` for `img` (and `video`), leaving the `.shot img { block-size: 100% }` override as is.

## Info

### IN-01: `noindex, nofollow` on a public portfolio

**File:** `index.html:20`
**Issue:** The page will not appear in search results. This is fine for a staging phase, but easy to forget at launch. Add a note or checklist item for the release phase. There is also no `<meta name="description">`.

### IN-02: `paths` check allows protocol-relative URLs

**File:** `tools/check-content.mjs:~525`
**Issue:** `v.startsWith('/') && !v.startsWith('//')` explicitly lets `//cdn.example` through. That would be an external resource, contrary to the self-host policy. Reject `//` too, and scan `src`/`href` on `link`, `script` and `img` for `http(s):` (only `a` is checked for external hosts).

### IN-03: Duplicated and loosely-scoped rules

**File:** `css/layout.css:234-237`, `css/print.css:132-137`; `css/utilities.css:2-9`; `tools/check-contrast.mjs:4`
**Issue:**
- `.contact-phone:not([hidden])` is defined twice with the same declarations. Because `[hidden]` in reset already forces `display: none !important`, the `:not([hidden])` guard is redundant.
- `.visually-hidden` omits `margin: -1px` and `padding: 0; border: 0`. Standard practice includes them. It also has no `clip` fallback, which is harmless with `clip-path`.
- `check-contrast.mjs` defaults to the path `css/tokens.css` relative to cwd, so it breaks when run from another directory. Resolve it against the script location. Its sRGB linearization threshold uses 0.03928 (WCAG 2.0) rather than 0.04045; the effect is negligible.

### IN-04: Placeholder eyebrow numbers are read as bare digits

**File:** `index.html:170, 211, 315, 351`
**Issue:** Company sections use `<p class="eyebrow">04</p>`. Screen readers announce "04" with no context, unlike the other sections, which read "01 / Keywords". Consider a visually-hidden "Company" prefix, or `aria-hidden="true"` on the number, since the h2 already names the section.

---

_Reviewed: 2026-11-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
