---
phase: 03-pdf
reviewed: 2026-11-12T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - index.html
  - js/main.js
  - css/base.css
  - css/components.css
  - css/layout.css
  - css/print.css
  - css/tokens.css
  - tools/build-pdf.mjs
  - tools/lib/browser.mjs
  - tools/pdf-report.mjs
  - tools/check-ui.mjs
  - tools/check-layout.mjs
  - tools/contact.example.json
  - package.json
findings:
  critical: 0
  warning: 7
  info: 5
  total: 12
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-11-12
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

No BLOCKER found. Phone handling in `build-pdf.mjs` is mostly sound. The number is read only after the early checks, and it goes into the page DOM through `page.evaluate`. It is never written to a temp file, and the page console is not forwarded. The `die()` and `catch` paths redact every digit. `pdf-report.mjs` prints only yes/no and counts. The output (`dist/`, `*.pdf`) and `private/` are gitignored, and the static server denies `private`, `dist` and dot folders.

Process cleanup in `tools/lib/browser.mjs` kills by PID only, as required. Two gaps remain:
- `tools/check-layout.mjs` does kill by image name.
- The forced-kill path leaks the temp profile.

`main.js` is logically correct, apart from one ordering glitch and one fragility in the no-JS fallback. The CSS (sticky, z-index, print) holds up.

Phone-related findings below refer to the number only abstractly.

## Warnings

### WR-01: Puppeteer `DEBUG` protocol logging would print the phone number to stderr

**File:** `tools/build-pdf.mjs:70-86`
**Issue:** The number is passed as an argument to `page.evaluate(fn, phone)`, so it travels in a CDP `Runtime.callFunctionOn` message. If the caller's shell has `DEBUG=puppeteer:*` (or `puppeteer:protocol:*`), puppeteer logs every sent protocol message to stderr, arguments included. `redact()` only covers messages this script writes, not third-party logging. This breaks the "never reaches stdout/stderr" guarantee in an opt-in but easy-to-hit way.
**Fix:** Refuse to run when debug logging is on, or scrub it before launching.
```js
if (/puppeteer/i.test(process.env.DEBUG || '')) die('unset DEBUG before building the PDF (protocol logging would print the contact data).');
```
Place this at the top, before `loadPhone()`. Alternatively `delete process.env.DEBUG` before `launchChrome()`.

### WR-02: A placeholder `phone.label` is not rejected and would be printed in the submission PDF

**File:** `tools/build-pdf.mjs:39-42` (placeholder in `tools/contact.example.json:4`)
**Issue:** Only `display` is checked for a leading `<`. The example file ships `label` as `"<label printed before ...>"`. If the user fills in `display` but forgets `label`, the build succeeds and the placeholder sentence is injected into the contact section. The `--expect-phone` report does not catch it.
**Fix:**
```js
if (p.label !== undefined && (typeof p.label !== 'string' || p.label.trim().startsWith('<'))) {
  die('phone.label must be a string and not a placeholder (value not shown).');
}
```

### WR-03: A PDF that fails verification stays on disk under the final submission name

**File:** `tools/build-pdf.mjs:96-111` (claim at line 45)
**Issue:** The comment says a failed build can never look like a success. But `writeFileSync(OUT, pdf)` runs first, then `pdf-report` runs. If the report fails (exit 1), `dist/퍼블리셔 유윤희-포트폴리오.pdf` remains, containing the phone number and failing checks. Only the exit code distinguishes it, and the filename invites uploading it.
**Fix:** After the `spawnSync`, `if (r.status !== 0) rmSync(OUT, { force: true });`. Or write to `OUT + '.tmp'`, verify, then `renameSync`.

### WR-04: `check-layout.mjs` kills browsers by image name

**File:** `tools/check-layout.mjs:228-232`
**Issue:** The finally block runs a PowerShell `Get-CimInstance ... Name -match '^(msedge|chrome)\.exe$' ... Stop-Process`. It is narrowed by a command-line tag, but it still selects processes by image name and command line. That contradicts the project rule ("never kill by process name"), and the PID-only teardown in `browser.mjs`. The `taskkill /PID /T /F` on line 227 already kills the tree for the spawned PID. The PowerShell sweep also spawns a second shell on every run.
**Fix:** Drop the name-based sweep. Rely on `taskkill /PID <pid> /T /F`. Or migrate this script to `launchChrome`/`closeBrowser` like `check-ui.mjs`.

### WR-05: Forced-kill fallback leaks the Chrome temp profile

**File:** `tools/lib/browser.mjs:25-33`
**Issue:** If `browser.close()` does not finish within 5 s, the fallback only runs `taskkill`/`SIGKILL`. Puppeteer's own removal of its temp `userDataDir` is part of the `close()` that never completed, so the profile directory stays under the OS temp dir. Repeated hangs accumulate profiles. This profile holds the rendered page state of a build that handled the phone number.
**Fix:** Create the profile yourself and own its cleanup.
```js
// launchChrome: const userDataDir = mkdtempSync(join(tmpdir(), 'pw-chrome-')); pass { userDataDir }, return it with the browser
// closeBrowser finally: rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
```

### WR-06: Keyword switch computes its initial index before the tall layout exists

**File:** `js/main.js:179-183`
**Issue:** `enableSwitch()` calls `setActive(scrollIndex())` before `kw.dataset.switch = 'on'`. At that moment `.keywords` still has its natural height, so `slotSize()` is small and `scrollIndex()` is wrong. This is visible on a resize crossing 1024px, or on a reload that restores scroll inside the section. The wrong `data-state` is then applied together with the switch attribute and animates (500 ms) to the correct state once the IntersectionObserver's first callback corrects it.
**Fix:** Set `kw.dataset.switch = 'on'` first (read `offsetHeight` afterwards to force layout), then `kwIndex = -1; setActive(scrollIndex());`.

### WR-07: A runtime error in `main.js` leaves `html.js` set and the mobile nav unreachable

**File:** `index.html:21,33`; `js/main.js:6-8,136-138`
**Issue:** The inline script adds `js` immediately, and the `onerror` rollback only fires for a failed load, not for an exception during evaluation. `main.js` does unguarded `querySelector`s and `.addEventListener` on the results (`toggle`, `nav`, `header`, `kw`). If any returns null, or an API is missing, the module throws after `html.js` is active. Below 900px the nav is `visibility:hidden` and the hamburger has no handler, so the navigation is unusable. The no-JS fallback the project promises is lost.
**Fix:** Do not add `js` in the inline script. Add it from `main.js` only after the required nodes are verified. For example: `if (!header || !toggle || !nav || !kw) throw/return;` before `root.classList.add('js')`, with the remainder in a try/catch that removes the class on failure.

## Info

### IN-01: Error text names the default path even when `PDF_CONTACT_FILE` is used

**File:** `tools/build-pdf.mjs:15,25,31,37`
**Issue:** Messages always say `private/contact.json`, which misleads when the override is active. The override accepts any path and is not checked against being inside the repo and untracked/ignored. A contact file placed in a tracked or non-ignored folder could be committed by accident.
**Fix:** Print the basename of `CONTACT`, and warn (or `git check-ignore -q`) when the file is inside `ROOT` but not ignored.

### IN-02: Stale comment and duplicated rules in `print.css`

**File:** `css/print.css:131-137,223-225,120-125,153-158,242-244`
**Issue:** The comment at 131 says the phone slot "stays hidden and empty here", which is no longer true. `.contact-phone:not([hidden])` is declared twice here and once in `layout.css`. The `break-after: avoid` rules for the company headings are declared twice. `.cover-line { display: block }` repeats `components.css`.
**Fix:** Merge into one block and update the comment.

### IN-03: `aria-current="true"` on in-page section links

**File:** `js/main.js:119`
**Issue:** For a link that points to the current part of the same page, `aria-current="location"` describes it more precisely. The CSS selector and `check-ui.mjs` use `"true"`, so a change must touch both.
**Fix:** Optional. Switch to `location` and update `components.css:45,49` and the checks.

### IN-04: Outdated header and usage text in `pdf-report.mjs`

**File:** `tools/pdf-report.mjs:1,3,16`
**Issue:** The header still calls it a "Phase 2 spike". The usage error on line 16 omits `--expect-phone`, `--min-page-chars`, and `--page-plan`.
**Fix:** Reuse the usage line from the header comment.

### IN-05: `dial` keeps `+` anywhere in the string

**File:** `tools/build-pdf.mjs:42`
**Issue:** `display.replace(/[^\d+]/g, '')` keeps a `+` in any position, so a display like `(+82) ...` gives `tel:` text that is not a valid dial string. `pdf-report`'s consistency check then reports a mismatch.
**Fix:** `display.trim().replace(/(?!^\+)[^\d]/g, '')` so only a leading `+` survives.

---

_Reviewed: 2026-11-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
