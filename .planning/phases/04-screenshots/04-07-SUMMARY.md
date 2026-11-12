---
phase: 04-screenshots
plan: 07
subsystem: verification-publish
tags: [pdf, verification, deferred, no-images]
requires: ["04-05", "04-06"]
provides:
  - "Full check suite and real PDF verified in the empty-screenshot state"
  - "User-approved ship with empty frames"
affects: []
key-files:
  created: []
  modified: []
decisions:
  - "Ship with empty screenshot frames; screenshots deferred until the user supplies them"
requirements-completed: []
duration: short
completed: 2026-11-12
---

# Phase 4 Plan 07: Publish and Final Verification Summary

**The full suite and real PDF pass with 13 empty screenshot frames; the user approved ("승인") shipping this state, and screenshots remain deferred until supplied.**

## Outcome

- Task 1 (publish approved shots, full suite, real PDF): there were no approved ids, so nothing was published and no commit was made (empty-state path).
- Task 2 (human-verify of final site and PDF): the user replied "승인" (approved).

## Measured results

- `npm run check`, `check:source` (PASS, 0 shots filled, 13 empty), `check:layout`, `check:ui` (first run, no flake), `check:shots-pdf`, `check:pdfguard`, `npm run pdf`: all exit 0.
- Real PDF `dist/퍼블리셔 유윤희-포트폴리오.pdf`: size ladder step 1, 132,180 bytes, 6 A4 portrait pages.
- Images: Image 0 / DCT 0 (no embedded images yet).
- Fonts: TrueType Pretendard only (Type3 0).
- Links: 5 external, 2 mailto, 1 tel. Phone number injected: yes.
- 13 cards, none split across pages.

## Re-run procedure when screenshots arrive

1. Place files in `_screenshots/<id>/`.
2. Redo the 04-06 review (manifest entry, masks, crops, alt text, approval).
3. `npm run images -- --only <id>`
4. `npm run check`
5. `npm run pdf`

## Requirements

SHOT-01, SHOT-02, SHOT-03, SHOT-04 and PDF-05 are not marked complete, since they depend on real screenshots. They stay open until screenshots are provided and the procedure above is run.

## Deviations from Plan

None. The plan was executed on its empty-state path; no screenshots, manifest entries or alt text were fabricated.

## Self-Check: PASSED
