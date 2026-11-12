---
phase: 03-pdf
plan: 04
subsystem: ui
tags: [cover-entrance, sticky-scroll-switch, keyboard-focus, reduced-motion, no-js-fallback]
requires: ["03-03"]
provides:
  - "Cover entrance: three cover-line spans rise in turn, intro and mail follow (once, gated)"
  - "Keyword scroll switch: sticky stage, data-state written by main.js, focus correction"
  - "check:ui: cover, keywords, keyword-focus, keyword-media, reduced, nojs-all, print-state scenarios"
affects: []
key-files:
  modified: [index.html, css/components.css, css/layout.css, js/main.js, tools/check-ui.mjs, tools/check-layout.mjs]
decisions:
  - "State styles sit on .keyword-title and .keyword-list, so the list can follow 80ms later without the block's opacity overriding it"
  - "check-ui dim count excludes the JS-created .nav-overlay (a closed dim layer, not content)"
metrics:
  completed: 2026-11-12
  tasks: 3
---

# Phase 3 Plan 04: Cover entrance and keyword scroll switch Summary

Opening the page lifts "Publishing, / beyond the / expected." line by line (about 1s) with the intro and email right after. On desktop the keyword section is a 2.5-screen track with a sticky one-screen stage, and scrolling swaps the three keywords one at a time. Everything is fully visible with no JS, with reduced motion, below 1024px or 560px height, and in print/PDF.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| fix | 58e513b | check-layout tries Chrome before Edge (BROWSER and CHROME_PATH overrides kept) |
| 1 RED | 128de0c | 7 new check-ui scenarios; cover, keywords, keyword-focus, keyword-media failed; reduced, nojs-all, print-state passed |
| 2 | 0a72ca7 | cover-line spans, cover-rise keyframes inside html.js + screen + no-preference |
| 3 | c7a3d6a | keywords-stage markup, sticky track CSS, state CSS, main.js switch and focusin correction |

## Verification

`npm run check`, `check:source`, `check:layout` (no env var), `check:ui` (all scenarios) and `npm run pdf` (page-plan asserts) all exit 0. No `animation-timeline`, `wheel` or `preventDefault` in the code. No `hidden`, `aria-hidden` or `inert` inside `#keywords`. Public index.html still has an empty phone slot and no `tel:`.

## Deviations from Plan

**1. [Rule 3 - Blocking] check-layout defaulted to Edge, which hangs here.** Candidate list now puts Chrome first (`BROWSER` and `CHROME_PATH` still override). Default `npm run check:layout` finishes and passes. Separate commit 58e513b.

**2. [Rule 1 - Test fix] check-ui assertions adjusted.** The final cover transform computes as an identity matrix after the fill-mode animation, so the check accepts `none` or the identity matrix. The reduced/nojs dim count skips `.nav-overlay`, which main.js creates with opacity 0 by design.

## Known Stubs

None.

## Threat Flags

None. T-03-16 to T-03-18 mitigations are in place: no hiding attributes on keyword blocks, instant focus scroll, opacity 0 only inside the gated query, no numeric-list literals.

## Self-Check: PASSED

Commits 58e513b, 128de0c, 0a72ca7, c7a3d6a exist; this file exists.
