---
phase: 04-screenshots
plan: 04
subsystem: screenshot-zoom-dialog
tags: [dialog, a11y, focus, motion, check-ui]
requires: ["04-03"]
provides:
  - "initShots(): a.shot-link promoted to button, one shared native dialog, fade via data-closing, focus return"
  - "check-ui scenarios shot-dialog (3 viewports), shot-reduced, shot-fallback"
  - "--color-overlay-strong token, dialog CSS, print hides dialog"
affects: []
tech-stack:
  added: []
  patterns: ["native showModal inertness instead of custom focus trap", "cancelFade cleanup so a finished fade leaves no transitionend listener"]
key-files:
  modified:
    - tools/check-ui.mjs
    - js/main.js
    - css/components.css
    - css/tokens.css
    - css/print.css
decisions:
  - "Fade teardown uses a single cancelFade() that clears the timer and removes the transitionend listener"
  - "Dialog display is set only on .shot-dialog[open]"
metrics:
  tasks: 2
  completed: 2026-11-12
---

# Phase 4 Plan 04: Zoom dialog Summary

Any thumbnail now opens a near full-screen native dialog (project name plus a close button only), with a 200ms fade and 0.98 scale, instant under reduced motion, Esc/backdrop/button close, and focus returning to the thumbnail. If showModal is missing or init throws, the thumbnails stay big-JPEG links.

## Tasks

| # | Task | Commit |
|---|------|--------|
| 1 | shot-dialog, shot-reduced, shot-fallback scenarios (RED: dialog and reduced failed, fallback and earlier passed) | f89d3e6 |
| 2 | initShots, dialog CSS, overlay token, print hide (GREEN) | c83ecc7 |

## Deviations from Plan

**1. [Rule 1 - Bug] Stale transitionend listener closed the next opening**
- **Found during:** Task 2 (shot-dialog failed intermittently: dialog closed about 35ms after opening)
- **Issue:** The RESEARCH sketch left its `transitionend` listener attached when the 250ms timer finished first. The next open's opacity transition then fired it and closed the dialog.
- **Fix:** `cancelFade()` clears the timer and removes the listener inside `finish()`.
- **Files:** js/main.js. **Commit:** c83ecc7

## Verification

- RED confirmed: shot-dialog 1, shot-reduced 1, shot-fallback 0, shot-frame 0, shot-nojs 0.
- Final: `npm run check:ui` exit 0 (passed on the run after the final fix), `check:layout`, `check` (includes check:repo), `pdf` exit 0.
- Grep gate: no closedby, requestClose, aria-modal, innerHTML in js/main.js.

## Flake note

One full `check:ui` run failed with `FAIL keyword-focus tab 1: #kn-wecankids idx 0 active act 0 op 1 top 886` (Phase 3 scenario, unrelated to the dialog); the immediate re-run passed fully. Earlier intermittent shot-dialog failures were the real stale-listener bug above, not the flake.

## Known Stubs

None.

## Self-Check: PASSED
