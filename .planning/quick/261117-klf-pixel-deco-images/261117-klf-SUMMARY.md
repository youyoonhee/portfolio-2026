---
phase: quick-261117-klf
plan: 01
subsystem: site-decoration
tags: [pixel-art, png, sharp, print-css, artifact-allowlist]
requires: []
provides:
  - tools/make-deco.mjs (JPG to transparent trimmed PNG)
  - img/deco/{cat-run,cursor,cat-desk}.png
affects: [index.html, css/components.css, css/print.css, tools/stage-pages.mjs, tools/check-artifact.mjs]
key-files:
  created: [tools/make-deco.mjs, img/deco/cat-run.png, img/deco/cursor.png, img/deco/cat-desk.png]
  modified: [index.html, css/components.css, css/print.css, tools/stage-pages.mjs, tools/check-artifact.mjs]
decisions:
  - "Decorations are plain img with empty alt, outside .shot, so content checks are unaffected"
  - "Hidden in print via .deco display none; PDF stays 7 pages"
metrics:
  completed: 2026-11-17
---

# Quick 261117-klf: Pixel decoration images Summary

Three user-supplied pixel-art JPGs converted to small transparent palette PNGs (flood fill from the border, nearest-neighbour resize) and placed as decorative images: running cat beside the PORTFOLIO. wordmark, cursor after "expected." in the cover h1, cat-at-desk beside the Contact. heading.

## Commits
- a1db60e: make-deco tool and three PNGs
- 172c67e: markup, CSS, print hiding, allowlists (see git log)

## Results
- cat-run.png 78x64 (3,174 B), cursor.png 96x136 (4,970 B), cat-desk.png 358x224 (24,427 B); transparent corners, no EXIF/ICC.
- cat-run: white body stayed opaque (enclosed by outline). cursor: the pink strip on the left is part of the source art.
- cat-desk: border median was rgb(253,253,253) and the white sticker outline is within about 2 of it, so they are not separable by colour. tol 24 was used; the white outline survived because it is bordered by a faint grey edge, and it renders cleanly on the grey Contact panel (no white box, no fringe seen).
- Header height unchanged (64px at 320/375, 72px at 1440); no horizontal overflow at 320/375/1440.
- Checks: npm run check, check:ui, check:layout, check:source, check:artifact, pdf all exit 0 (keyword-focus flake did not occur). PDF: 7 pages, 407,031 bytes, 7 JPEG images only (no deco), Type3 0.
- Screenshots: dist/deco-shots/{320,375,1440}-{cover,contact}.png (gitignored).

## Deviations from Plan
None. Added a `--probe` flag to make-deco.mjs (the plan allowed it). Added `white-space: nowrap` to `.wordmark` (plan-allowed) to keep text and cat on one line.

## Notes
- The Colophon Lighthouse/Nu values were measured on 2026-11-17 before this change; re-measurement and redeploy are pending user approval. tools/measurements.json was not touched; nothing was deployed or pushed.
- Source JPGs stay outside the repo and were not committed.

## Self-Check: PASSED
