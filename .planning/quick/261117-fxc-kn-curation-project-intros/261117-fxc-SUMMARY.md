---
phase: quick-261117-fxc
plan: 01
subsystem: content
tags: [content, kn-curation, gates]
requirements: [CONT-06]
key-files:
  modified:
    - index.html
    - tools/content-manifest.json
    - tools/check-content.mjs
    - tools/check-shots-pdf.mjs
    - tools/check-ui.mjs
    - tools/optimise-images.mjs
    - .planning/phases/01-foundation-content/01-CONTEXT.md
    - .planning/PROJECT.md
decisions:
  - "User-provided KN intro texts (2026-11-17) are exempted via uiAllowlist + reason 'user-provided 2026-11-17', enforced by a new descriptionNote check in check-content"
metrics:
  completed: 2026-11-17
---

# Quick 261117-fxc: KN curation project intros Summary

The 케이엔큐레이션 section now has 5 cards (puring, 위캔키즈클럽, FSD 코스메틱, 그린다, universe) with a `소개` row carrying the user-provided intro text. The 로드필 and 링크알바 cards are removed. The project count went from 13 to 11.

## What changed
- index.html: removed kn-roadpill and kn-linkalba. Set the `소개` row on all 5 KN cards using the exact texts, and removed the ChatGPT clause from universe. Updated the template comment (11 projects, 소개 label).
- content-manifest.json: 11 projects. KN projects have `metaLabel` and, for 4 of them, `descriptionNote`. The allowlist, reasons, forbiddenText (로드필, 링크알바, ChatGPT) and sourceCoverage entries are updated.
- check-content.mjs: honours `metaLabel` and enforces `descriptionNote` with the matching allowlist reason. No existing check was loosened.
- check-shots-pdf.mjs: the project count is derived from the manifest instead of a hard-coded 13.
- 01-CONTEXT.md and PROJECT.md: the 2026-11-17 revision is recorded and the superseded rows are marked.

## Deviations from Plan

**1. [Rule 3 - Blocking] Hard-coded empty-frame counts**
- **Found during:** Task 2 (`npm run check:ui` and `npm run check` failed)
- **Issue:** tools/check-ui.mjs (2 places) and tools/optimise-images.mjs (self-test regex `2 filled, 11 empty`) assumed 13 projects with 2 filled, so 11 empty.
- **Fix:** Changed the counts to 9 (11 projects, 2 filled).
- **Files:** tools/check-ui.mjs, tools/optimise-images.mjs

The two files were not listed in the plan, so the commit contains 8 files instead of 6.

## Verification
`npm run check`, `check:ui`, `check:layout`, `check:source`, `check:shots-pdf`, `check:pdfguard` and `pdf` all exit 0. `check:ui` passed without a keyword-focus flake. source-coverage reported site 62 / excluded 18 / unmapped 0.
PDF: 6 pages (A4 portrait), 126006 bytes (cap 8 pages). It has 11 cards and none are split across pages.

## Known Stubs
None. The empty screenshot slots are intentional and unchanged.

## Self-Check: PASSED
