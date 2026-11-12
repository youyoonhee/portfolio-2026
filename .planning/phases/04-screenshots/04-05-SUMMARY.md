---
phase: 04-screenshots
plan: 05
subsystem: submission-pdf-screenshots
tags: [pdf, jpeg, puppeteer, size-ladder, synthetic-e2e]
requires: ["04-04"]
provides:
  - "build-pdf: PDF_SITE_ROOT, PDF_OUT, PDF_SOFT_BYTES, PDF_HARD_BYTES, PDF_MAX_PAGES; frame-fitted JPEG per screenshot; quality then width ladder"
  - "pdf-report: --max-bytes, --hard-bytes, --expect-images, --max-pages, DCT count, local URI guard, `pages <n>` line"
  - "check-shots-pdf: synthetic 13-image end-to-end run (normal, ladder, hard) with --measure and --keep"
  - "check:pdfguard case: PDF_OUT inside the public tree is refused"
affects: ["04-07"]
tech-stack:
  added: []
  patterns: ["Node-side crop to the frame ratio so Skia embeds the JPEG as DCTDecode", "data: URI swap + decode after src change"]
key-files:
  created:
    - tools/check-shots-pdf.mjs
  modified:
    - tools/build-pdf.mjs
    - tools/pdf-report.mjs
    - tools/check-build-pdf.mjs
    - package.json
decisions:
  - "DEFAULT_MAX_PAGES = 8, measured with 13 synthetic images (real repo without images: 6 pages)"
  - "Long web screens are cropped to the frame ratio in Node (top part) before they reach Chrome, not by CSS object-fit"
metrics:
  tasks: 2
  completed: 2026-11-12
---

# Phase 4 Plan 05: PDF with screenshots Summary

`npm run pdf` now embeds every filled screenshot as a JPEG in the same frame as the web, steps down JPEG quality and then width if the PDF is over 5,000,000 bytes, fails and deletes the file at 10,000,000 bytes or more, and keeps 127.0.0.1/localhost/file: out of the link annotations.

## Tasks

| # | Task | Commit |
|---|------|--------|
| 1 | pdf-report flags, check-shots-pdf, PDF_OUT guard case (RED confirmed: `PASS setup`, `normal: builder exit 0`, `FAIL normal: PDF_OUT honoured`; pdfguard had exactly one FAIL) | 5c67cd5 |
| 2 | Builder image prep, ladder, path/limit overrides, measured page cap (GREEN) | fc290fa |

## Measurements

- Real repo (zero images): 6 pages, 132,180 bytes, `pdf step 1`, `PASS JPEG images embedded (expected 0 ...)`.
- Synthetic 13 images (web 1440x3000, app 1080x1920): 8 pages, 309,484 bytes at step 1. `DEFAULT_MAX_PAGES = 8` (from `--measure`). The synthetic images are simple, so these byte sizes are far below what real screenshots will give; 04-07 records the real values.
- Ladder run (soft limit forced to 1,000): step 1 309,484 / step 2 (quality 70) 288,373 / step 3 (web 480, app 540, quality 70) 229,356 bytes, `WARN size over target`, exit 0.
- Hard run (hard limit forced to 1,000): exit 1, PDF removed.

## Deviations from Plan

**1. [Rule 1 - Bug] CSS-cropped long web screens were embedded as Flate, not JPEG**
- **Found during:** Task 2 first synthetic run (`images 13, dct 3`).
- **Issue:** The web frame crops tall screens with `object-fit: cover; object-position: top`. Skia re-encodes a cropped image as Flate (only whole images pass through as DCT), which would blow past 5MB with real screenshots.
- **Fix:** The builder reads the picked JPEG, cuts the top part to the measured frame ratio with sharp (centered horizontally if the image is too wide), re-encodes (quality 82 for crops, 70 on ladder steps 2-3, no metadata), and swaps it in as a `data:` URI with `object-fit: fill` and a decode. Uncropped images (app screens, step 1) keep their original bytes.
- **Consequence:** `setRequestInterception` from the plan is not used; the Node-side swap replaces it (same quality ladder, no network interception needed).
- **Files:** tools/build-pdf.mjs. **Commit:** fc290fa

**2. [Rule 1 - Bug] Synthetic images deduplicated by the PDF writer**
- **Issue:** Equal pixels after cropping collapse to one image object, so `--expect-images 13` could not hold.
- **Fix:** check-shots-pdf adds a distinct marker block near the top of each synthetic image.
- **Files:** tools/check-shots-pdf.mjs. **Commit:** fc290fa

**3. [Rule 3 - Blocking] Node `cpSync` recursive crashed (segmentation fault) on this machine**
- **Fix:** check-shots-pdf copies the site folders with a small recursive `copyFileSync` helper.

**4. Test hygiene:** the test prints only builder status lines (`pdf step`, `FAIL`, `WARN`, `build-pdf`), never extracted text, and cleans its temp folder in `finally` (also in `--measure`).

## Verification

- `npm run check:pdfguard` exit 0 (5 PASS including the PDF_OUT refusal and no file created).
- `node tools/check-shots-pdf.mjs` exit 0 (setup, normal, ladder, hard).
- `npm run pdf` exit 0 on the real repo; `npm run check` exit 0.
- `grep -cE "keepMetadata|withMetadata" tools/build-pdf.mjs` is 0.
- `npm run check:ui` exit 0 (no FAIL lines, no flake this run).

## Known Stubs

None.

## Threat Flags

None. PDF_OUT inside the repo (outside dist/) is refused before Chrome starts; temp PDFs go to the OS temp folder.
