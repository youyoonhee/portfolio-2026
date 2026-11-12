---
phase: 04-screenshots
plan: 03
subsystem: screenshot-frames
tags: [css, frames, check-ui, check-layout, sizes, print]
requires: ["04-02"]
provides:
  - "check-ui in-memory screenshot fixture (request interception) with shot-frame and shot-nojs scenarios"
  - "check-layout shot-sizes at 12 viewports"
  - "Web/app screenshot frame CSS, hover/focus scale, frame focus ring, print rules"
affects: [04-04]
tech-stack:
  added: []
  patterns: ["request-interception fixture, repo untouched", "frame-level focus ring via :has(.shot-link:focus-visible)"]
key-files:
  modified:
    - tools/check-ui.mjs
    - tools/check-layout.mjs
    - css/components.css
    - css/print.css
decisions:
  - "Fixture web source is 1920x4800 (not 1440) so the no-JS link ends in -1920.jpg as the plan asserts"
  - "Focus check uses page.focus + Shift prime (same as existing focus-ring scenario) instead of tabbing from the previous link"
  - "print.css card hover selectors also moved to :has(a, .shot-link) for parity"
metrics:
  tasks: 2
  completed: 2026-11-12
---

# Phase 4 Plan 03: Screenshot frames Summary

Cards with an image now show it in a web (16:10 cover, top-aligned) or app (centred 9:16 box, max 200px, no mockup) frame with a 1.02 hover/focus scale, an accent ring on the frame, and print support. A synthetic in-memory fixture verifies this without touching the repo.

## Tasks

| # | Task | Commit |
|---|------|--------|
| 1 | check-ui fixture, shot-frame (RED, 16 failures) and shot-nojs scenarios; check-layout shot-sizes at 12 widths | 63e03ec |
| 2 | Frame CSS, hover/focus, card lift parity, print rules (GREEN) | b113130 |

## Verification

- shot-frame RED confirmed (16 FAIL), shot-nojs passed before CSS; after CSS both pass.
- `npm run check:ui`, `check:layout` (12 shot-sizes PASS; 64 legacy PASS lines unchanged), `npm run check`, `npm run pdf` exit 0.
- `git status` clean for index.html and img (fixture in memory only).

## Deviations from Plan

**1. [Rule 1 - Bug in plan] Fixture web source width** - plan said 1440x4000 but asserts a `-1920.jpg` link; used 1920x4800. Files: tools/check-ui.mjs.

## Flake note

One full `npm run check:ui` run reported "1 check(s) FAILED" (failing line not captured); an immediate re-run passed fully. Consistent with the known historical flake; not reproduced.

## Known Stubs

None.

## Self-Check: PASSED
