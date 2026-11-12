---
phase: 03-pdf
plan: 02
subsystem: pdf
tags: [print-css, page-plan, pdf-report]
requires: ["03-01"]
provides:
  - "pdf-report --min-page-chars and --page-plan assertions, wired into npm run pdf"
  - "A4 print page plan: cover+keywords / skills+career / companies / contact+footer (6 pages)"
affects: [03-03, 03-04]
key-files:
  modified: [tools/pdf-report.mjs, tools/build-pdf.mjs, css/print.css]
decisions:
  - "Companies flow (no forced page per company); only #skills and #gi-data force a break. Per-company pages deferred to Phase 4"
metrics:
  completed: 2026-11-12
  tasks: 2
---

# Phase 3 Plan 02: A4 page plan Summary

`npm run pdf` now yields a 6-page A4 PDF (132180 bytes): page 1 cover and three keyword blocks, page 2 Skills and Career, pages 3-5 the four companies in original order, page 6 Contact and footer. The checker now fails the build on blank or footer-only pages, a wrong page plan, or split cards.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 RED | 6d806bf | New assertions fail the 9-page PDF (pages 4 and 9 sparse, contact not last) |
| 2 GREEN | 789b529 | print.css page plan; all assertions pass |

## Measurements (numbers only)

- Pages 6, bytes 132180.
- Text chars per page: 210, 307, 286, 207, 239, 123 (min 123, threshold 80).
- Cards per page (platform/contribution pairs): 0, 0, 5, 5, 3, 0 = 13 cards, none split.
- Company first pages: 3, 3, 5, 5 (two companies share each of pages 3 and 5).

## Verification

`npm run pdf` exit 0 with all assertions PASS; `npm run check` and `npm run check:source` pass. `npm run pdf:spike` (Edge) was not run because it is known to hang; the Chrome-based builder was used instead. Only css/print.css changed among CSS files.

## Deviations from Plan

None. The first CSS pass already met the 6-page target, so no padding tuning was needed.

## Known Stubs

None. Empty `.shot` frames are hidden in print and reappear automatically when a picture is added in Phase 4.

## Threat Flags

None. New assertion details print only page numbers and counts.

## Self-Check: PASSED
