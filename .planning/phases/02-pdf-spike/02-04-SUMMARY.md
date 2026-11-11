---
phase: 02-pdf-spike
plan: 04
subsystem: pdf
tags: [print-css, headless-edge, pdf-inspection]
requires:
  - phase: 02-pdf-spike
    provides: finished page, static server, check-repo matchers (02-03, 02-05)
provides:
  - css/print.css A4 portrait stylesheet
  - npm run pdf:spike (Edge CLI runner plus zero-dependency PDF inspector)
  - 02-PDF-SPIKE.md with measured values and Phase 3 recommendation
affects: [03]
key-files:
  created: [tools/spike-pdf.mjs, tools/pdf-report.mjs, .planning/phases/02-pdf-spike/02-PDF-SPIKE.md]
  modified: [css/print.css, package.json]
key-decisions:
  - "Measured 9 A4 pages (Edge and Chrome identical); the D-18 2-3 pages was an example, not a target"
  - "Recommend Puppeteer 25 for Phase 3; keep the CLI runner as a preview"
  - "Card-split check counts label-only text runs, because the word appears inside titles"
requirements-completed: [DSGN-01, DSGN-05]
duration: 40min
completed: 2026-11-11
---

# Phase 2 Plan 04: PDF spike Summary

An A4 portrait PDF of the current page is produced by `npm run pdf:spike` into gitignored `dist/`, and the inspector passes: TrueType Pretendard only (Type3 0), 9 pages, 13 whole cards, 5 external links plus mailto, no header chrome, Korean text extractable, phone guard clean.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 Print CSS | 47eb2eb | `@page` A4 portrait, Pretendard Print, hidden chrome, pt type roles, whole cards and keyword blocks |
| 2 Runner and inspector | 5400c56 | spike-pdf.mjs, pdf-report.mjs, `pdf:spike` script; out-of-dist guard exits 2 |
| 3 Measure and record | 20da75f | 02-PDF-SPIKE.md (Edge and Chrome, lazy fixture) |

## Measured

9 pages (last page holds only the footer), MediaBox 594.96x841.92, FontFile2 2, 142,639 bytes (Edge) vs 142,625 (Chrome), lazy fixture image printed, Outlines absent with the CLI.

## Deviations from Plan

**[Rule 1 - Bug] Card-split check over-counted:** matching the substring "플랫폼" also hit company titles ("CJ 광고 플랫폼"), giving a false FAIL. Fixed in pdf-report.mjs to count only whole text runs equal to the label. Same commit as task 2.

Otherwise the plan ran as written. No Edge or temp-profile processes remain.

## Not verified

Human copy/paste and search of Korean in the PDF, and eyeballing the printed pages, are left to the 02-06 checkpoint. The "empty .shot frames cause most pages" claim is inferred from RESEARCH, not re-measured here.

## Known Stubs

None new. The phone slot stays hidden and empty by design (Phase 3).

## Threat Flags

None. PDFs and fixtures live only in `dist/`; `git ls-files` lists no PDF; no phone-like string was written anywhere.
