---
phase: 04-screenshots
fixed_at: 2026-11-12T00:00:00Z
review_path: .planning/phases/04-screenshots/04-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-11-12
**Source review:** .planning/phases/04-screenshots/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (WR-01 to WR-09; Info items out of scope)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### WR-01: `DEBUG` guard misses wildcard values

**Files modified:** `tools/build-pdf.mjs`, `tools/check-build-pdf.mjs`
**Commit:** 0c92aa6
**Applied fix:** `build-pdf` now refuses to run when `DEBUG` or `NODE_DEBUG` is set to any non-empty value, before the contact file is read. `npm run check:pdfguard` gained `DEBUG=*`, `DEBUG=pptr*` and `NODE_DEBUG=http` cases (fake phone only).

### WR-02: JPEG/WebP metadata audit fails open

**Files modified:** `tools/lib/image-meta.mjs`, `tools/check-images.mjs`, `tools/optimise-images.mjs`
**Commit:** 2b3ffcc
**Applied fix:** `jpegMeta` is allowlist based (APP0, DQT, DHT, DRI, SOF, SOS), walks the scans to EOI, flags COM and APP1 to APP15, and reports `MALFORMED` / `TRAILING` for bad lengths, a missing EOI or bytes after EOI. `webpMeta` reports `MALFORMED` for a chunk running past the file, a RIFF size mismatch or leftover bytes. Self-test cases added in check-images (COM, truncated, bytes after EOI, WebP chunk-length overflow hiding an EXIF chunk) and in the optimise-images parser group. Real sharp output still audits clean.

### WR-03: Approved project with `masks: []` publishes unmasked

**Files modified:** `tools/optimise-images.mjs`
**Commit:** 92b3cc2
**Applied fix:** New manifest key `noSensitive`. An approved entry with no masks and without `noSensitive: true` fails with `rule:no-masks`. `noSensitive` must be `true` and only with an empty mask list (`bad-mask` otherwise). Self-test cases for all three paths plus one positive case. The manifest holds no masked text.

### WR-04: `runAll` is not atomic across projects

**Files modified:** `tools/optimise-images.mjs`
**Commit:** 8ddc8e7
**Applied fix:** `runAll` renders every project and computes the new `index.html` in memory first (phase 1), then writes image files and `index.html` (phase 2). Self-test: project 1 valid, project 2 fails; asserts the html and output tree are unchanged.

### WR-05: Dialog fade timer can close a re-opened dialog

**Files modified:** `js/main.js`
**Commit:** d876b90
**Applied fix:** `open()` calls `cancelFade()` if pending and deletes `dlg.dataset.closing` before `showModal()`; `showModal()` is also guarded by `!dlg.open`. Logic change, requires human verification (check:ui passes).

### WR-06: Pre-commit checks the working tree, not staged content

**Files modified:** `.githooks/pre-commit`
**Commit:** 0669040
**Applied fix:** The hook exports the staged `img/projects`, `index.html` and `tools/screenshots.json` blobs with `git checkout-index --prefix` into a `mktemp -d` dir and runs `check-images --fast --root <tmp>`; a trap removes the temp dir. No `git stash`, the working tree is untouched. Verified by hand: a staged JPEG with a COM segment blocks the hook, then was unstaged and deleted. `status: approved` remains the human gate (noted in the hook comment).

### WR-07: `check-content` shots path check allows `..`

**Files modified:** `tools/check-content.mjs`, `tools/check-images.mjs`
**Commit:** 73af8ff
**Applied fix:** Paths with a `..` segment, or whose `path.relative` from `img/projects/<id>` escapes, are rejected ("image path must stay inside img/projects/ID/"). Self-test (in check-images, which already builds a filled tree): a traversal to an existing file in another project folder is rejected, the clean tree passes.

### WR-08: `--expect-images` satisfied by wrong images / false-fails on duplicates

**Files modified:** `tools/build-pdf.mjs`
**Commit:** 025dc51
**Applied fix:** The expected count passed to `pdf-report` is the number of distinct JPEG sources. `applyImages` returns the number of screenshot images with `naturalWidth === 0` after decode and `renderStep` throws if any (the build then fails and the PDF is removed). Logic change, requires human verification; the decode-failure branch is not exercised by an automated test (no failing-image fixture).

### WR-09: Scroll-region focusability decided once

**Files modified:** `js/main.js`, `tools/check-ui.mjs`
**Commit:** e49d26b
**Applied fix:** `syncScroll()` recomputes tabindex, role and label on the image `load` event and through a `ResizeObserver` on the scroll region and image (disconnected on close and on re-open). The label is now `${name} 스크롤 영역`; the check-ui assertion was updated to match. Logic change, requires human verification.

## Verification

`npm run check`, `npm run check:pdfguard`, `npm run check:ui`, `npm run check:layout`, `node tools/check-shots-pdf.mjs` and `npm run pdf` all exit 0 ("phone injected: yes" only). The Phase 3 `keyword-focus` flake did not occur. Note: the fixer ran in the main working tree, not a separate worktree, because `npm run pdf` needs the untracked `private/` and `node_modules`.

---

_Fixed: 2026-11-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
