---
phase: 03-pdf
plan: 03
subsystem: ui
tags: [hamburger, header-hide, keyboard, a11y, puppeteer-core, no-js-fallback]
requires: ["03-01", "03-02"]
provides:
  - "js/main.js: mobile menu with overlay, header hide/show, focusin reveal, current-section spy"
  - "npm run check:ui: Puppeteer keyboard, motion and no-JS checks (not in npm run check or hooks)"
affects: [03-04]
key-files:
  created: [js/main.js, tools/check-ui.mjs]
  modified: [index.html, css/tokens.css, css/base.css, css/components.css, css/layout.css, tools/check-layout.mjs, package.json]
decisions:
  - "Hamburger bars use ::before, ::after and a .nav-bars span (RESEARCH Pattern 5), not the UI-SPEC pseudo-only method"
  - "check-layout anchor check measures against nominal --header-h, not the live header rect"
metrics:
  completed: 2026-11-12
  tasks: 3
---

# Phase 3 Plan 03: Menu, header and keyboard Summary

Below 900px the hamburger opens a panel under the header with a dim overlay and an X icon. The header hides on scroll down and returns on scroll up, on focus, or while the menu is open. With JS off or main.js failing, the Phase 2 static nav stays.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 RED | eb50748 | check-ui: 16 failures, nojs scenarios already PASS |
| 2 | 9b0de15 | Markup (inline js class, module script with onerror, nav-bars, main tabindex), tokens, CSS, main.js |
| 3 | e6fdb22 | Header hide transform, check-layout nominal header height |

## Verification

`npm run check:ui` all pass (menu, header at 1440 and 375, skip, focus-ring, spy, nojs). `npm run check`, `check:source`, `check:repo` and `npm run pdf` exit 0. `npm run check:layout` exit 0 when run with `BROWSER` pointing at Chrome. index.html has 0 `tel:`, phone slot untouched.

## Deviations from Plan

**[Rule 3 - Blocking] check:layout run on Chrome.** Default check-layout picks Edge first, which hangs on this machine (known). Ran with `BROWSER` set to Chrome's exe; no code change to the launcher.

**Task split note.** The header hide logic and the section spy were written into js/main.js together with the menu in the Task 2 commit, since they share one small file. Task 3 commit holds the layout.css transform and check-layout change.

## Known Stubs

None.

## Threat Flags

None. Mitigations in place: phone slot unchanged, no numeric-list literals in main.js, onerror removes the js class, check-ui closes its browser in finally.

## Self-Check: PASSED

js/main.js, tools/check-ui.mjs exist; commits eb50748, 9b0de15, e6fdb22 exist.
