---
phase: 05-deploy
plan: 02
subsystem: deploy
tags: [colophon, measurements, qual-06]
requires: [05-01]
provides:
  - section#colophon (web only) in its honest 측정 전 state
  - tools/measurements.json record and tools/colophon-sync.mjs single writer
affects: [05-07]
tech-stack:
  added: []
  patterns: [record file -> sync tool -> HTML -> check equality, in-process self-test]
key-files:
  created:
    - tools/measurements.json
    - tools/colophon-sync.mjs
  modified:
    - index.html
    - css/components.css
    - css/layout.css
    - css/print.css
    - tools/check-content.mjs
    - tools/content-manifest.json
    - tools/check-ui.mjs
    - package.json
decisions:
  - "colophon-sync self-test calls main() in-process (no child_process) so the node:[a-z/]+ import whitelist holds"
  - "Colophon text and the footer link are exempt from source-* checks via sourceTexts; forbidden and phone checks keep full visibleTexts"
requirements-completed: [QUAL-06]
metrics:
  tasks: 3
  completed: 2026-11-16
---

# Phase 5 Plan 02: Colophon Summary

Web-only Colophon section whose measured rows (browsers, Lighthouse, validator, date) are written only by colophon-sync from tools/measurements.json and currently read 측정 전 / 확인 전.

## Tasks

| Task | Commit | Notes |
|------|--------|-------|
| 1 record and sync tool | 2eaebae | validateRecord, renderMeasured, sync, --check, 26-case self-test |
| 2 RED checks | 7117fbf | check-content `colophon`, footer link rule, `sourceTexts` exemption |
| 3 GREEN | 57b0a15 | markup, CSS, print exclusion, check-ui assertions, `colophon:check` in `check` |

## Verification

`npm run check`, `npm run check:ui` (incl. `spy colophon clears`, footer link 44px, no overflow at 375), `npm run check:layout`, `npm run check:source` all pass. PDF page count: 6 before, 6 after. No data chips and no digits in the null state; iOS Safari reads `iOS Safari · 실기기 확인 전`. Measured values remain null; nothing invented.

## Deviations from Plan

**1. [Rule 3 - Blocking] colophon-sync self-test runs in-process** rather than spawning itself, to keep imports within `node:[a-z/]+` plus check-repo. Same cases as specified.

## Known Stubs

Measured rows show 측정 전 by design; 05-07 fills them via the record.

## Threat Flags

None.

## Self-Check: PASSED
