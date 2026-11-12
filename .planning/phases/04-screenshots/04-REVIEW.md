---
phase: 04-screenshots
reviewed: 2026-11-12T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - .gitattributes
  - .githooks/pre-commit
  - css/components.css
  - css/print.css
  - css/tokens.css
  - js/main.js
  - package.json
  - tools/build-pdf.mjs
  - tools/check-build-pdf.mjs
  - tools/check-content.mjs
  - tools/check-images.mjs
  - tools/check-layout.mjs
  - tools/check-shots-pdf.mjs
  - tools/check-ui.mjs
  - tools/lib/image-meta.mjs
  - tools/lib/shot-fixtures.mjs
  - tools/lib/shot-markup.mjs
  - tools/optimise-images.mjs
  - tools/pdf-report.mjs
  - tools/screenshots.json
findings:
  critical: 0
  warning: 9
  info: 7
  total: 16
status: issues_found
---

# Phase 4: Code Review Report

**Depth:** standard (no structural findings provided). The reviewer was read-only: it ran nothing, launched no browser, and did not touch `private/` or `.planning/source/`.

## Summary

No outright blockers. The core safety properties hold:
- **Phone:** injected only at PDF build time and redacted in every `build-pdf` message. `PDF_OUT` is confined to `dist/` or outside the repo.
- **Masks:** opaque, drawn on a lossless PNG before crop and resize, and pixel-sampled in the self-test.
- **Metadata:** sharp strips it on output, and an independent container audit checks it.
- **Approval:** `check-images` rejects images for projects that are not `approved`.

Not inspected: `tools/lib/browser.mjs` and `static-server.mjs` (the temp profile and kill paths in the PDF build). `check-layout.mjs` kills only its own spawned PID and cleans its temp profile with retries.

Weak spots:
- Fail-open guards: the metadata parsers and the DEBUG guard.
- Pipeline consistency: a multi-project run is not atomic, and an approved project with no masks is accepted.
- One dialog race.

## Warnings

### WR-01: `DEBUG` guard misses wildcard values, so protocol logging could print the phone
**File:** `tools/build-pdf.mjs:84`

The guard only matches `/puppeteer/i`. `DEBUG=*` or `DEBUG=pptr*` also enables puppeteer-core `debug` logging, and that output includes the `Runtime.callFunctionOn` payload carrying the phone fields. `redact()` does not cover it.

**Fix:** Refuse to run when any `DEBUG` (and `NODE_DEBUG`) is set.

### WR-02: JPEG/WebP metadata audit fails open and covers only 3 markers
**File:** `tools/lib/image-meta.mjs:11-24`

`jpegMeta` flags only APP1, APP2 and APP13. It misses:
- COM (0xFE)
- APP3–APP12, APP14 and APP15
- data after EOI

A malformed marker stream breaks out of the loop and reports "clean". `webpMeta` has the same flaw: a bogus chunk length skips any later EXIF or XMP chunk. This is the only gate in the pre-commit `--fast` path.

**Fix:**
- Allowlist APP0 JFIF, DQT, SOF*, DHT, DRI and SOS.
- Flag COM and APP1–APP15.
- Treat any parse error as a failure (MALFORMED).

### WR-03: Approved project with `masks: []` publishes unmasked
**File:** `tools/optimise-images.mjs:124-130, 198`

An empty mask list is accepted for an approved project.

**Fix:** For approved entries with no masks, require an explicit acknowledgement field (for example `noSensitive: true`). Otherwise fail with `rule:no-masks`.

### WR-04: `runAll` is not atomic across projects
**File:** `tools/optimise-images.mjs:265-300`

Files are written per project, but `index.html` is written once at the end. If a project throws partway through, the earlier projects' files are left in `img/projects/` while the HTML is unchanged.

**Fix:** Render everything in memory first, then write it all. Alternatively, write to a temp dir and rename.

### WR-05: Dialog fade timer can close a re-opened dialog
**File:** `js/main.js:244-291`

If the dialog closes natively while `data-closing` is set, and the user reopens it within about 250ms, the stale `setTimeout(finish)` closes the new session. `open()` never clears `cancelFade` or `data-closing`.

**Fix:** At the start of `open()`, call `cancelFade()` if it is set and delete `dlg.dataset.closing`.

### WR-06: Pre-commit hook checks the working tree, not the staged content
**File:** `.githooks/pre-commit:4`

`check-images --fast` reads files from disk, so partial staging can slip a bad blob through.

**Fix:** Check the staged content (checkout-index into a temp dir). Document that `status: approved` is the human gate.

### WR-07: `check-content` shots path check allows `..` traversal
**File:** `tools/check-content.mjs:564-569`

A path like `img/projects/<id>/../../../_screenshots/x.png` passes both the prefix check and the `existsSync` check.

**Fix:** Reject `..`, or check containment with `relative()` against `img/projects/<id>`.

### WR-08: `--expect-images` can be satisfied by the wrong images, and false-fails on duplicates
**File:** `tools/pdf-report.mjs:93-96`, `tools/build-pdf.mjs:251`

- The check counts all images in the whole PDF, so unrelated images can satisfy it.
- Skia de-duplicates identical images, so legitimate duplicates give a lower count and fail the check.
- `decode().catch(() => {})` swallows decode failures.

**Fix:** Pass the number of distinct image URLs, and fail the build when `naturalWidth === 0`.

### WR-09: Scroll-region focusability is decided once, before layout is final
**File:** `js/main.js:282-290`

The overflow check runs once right after `showModal()`. If the image lays out later, or the viewport is resized, a tall screenshot can stay keyboard-unscrollable. The region's `aria-label` also duplicates the dialog title.

**Fix:**
- Recompute on the image `load` event and in a `ResizeObserver`.
- Give the region a distinct label, for example `${name} 스크롤 영역`.

## Info

- **IN-01** (`tools/optimise-images.mjs:355-377`): `annotate` uses manifest values without validation. Call `validateEntry`.
- **IN-02** (`tools/lib/shot-markup.mjs`, `tools/optimise-images.mjs:253`, `tools/check-images.mjs:72`): article id handling is inconsistent. Validate ids against `/^[a-z0-9-]+$/` once, in `articleIds`.
- **IN-03** (`tools/optimise-images.mjs:269-290`): switching an approved project back to draft leaves it published. Warn, or auto-clear.
- **IN-04** (`tools/build-pdf.mjs:54, 80, 94`): three edge cases.
  - `dial` keeps `+` anywhere in the number.
  - `rmSync` on a directory `PDF_OUT` throws `EISDIR` uncaught.
  - `warnIfTrackable` misreports when git is missing.
- **IN-05** (`tools/pdf-report.mjs:100`): unescaped dots in the local-link regex `127.0.0.1`.
- **IN-06** (`tools/check-shots-pdf.mjs:78`): the expected count is hard-coded as `13`. Derive it from `content-manifest.json`.
- **IN-07** (`tools/check-layout.mjs:51-69`): no overall watchdog timeout.

---

_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
