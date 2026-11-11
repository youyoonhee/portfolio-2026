---
phase: 02-pdf-spike
plan: 03
subsystem: ui
tags: [css, container-queries, layout-check, cdp, responsive]
requires:
  - phase: 02-pdf-spike
    provides: keyword section, tokens, header (02-01, 02-02)
provides:
  - tools/check-layout.mjs (zero-dependency CDP check at 375/768/1440), npm run check:layout
  - tools/lib/static-server.mjs (127.0.0.1-only allowlist server, reusable by 02-04)
  - div.project-grid in 4 company sections, 1/2/3 columns by container query
  - project card, skills, career, contact and footer CSS
affects: [02-04, 03]
key-files:
  created: [tools/check-layout.mjs, tools/lib/static-server.mjs]
  modified: [index.html, tools/check-content.mjs, css/layout.css, css/components.css, package.json]
key-decisions:
  - "check:layout is not part of npm run check (needs a browser)"
  - "Layout check kills the headless browser by temp-profile name, since the Edge launcher leaves child processes"
requirements-completed: [DSGN-02, DSGN-04, DSGN-01]
duration: 40min
completed: 2026-11-11
---

# Phase 2 Plan 03: Card grid and 10-second path Summary

Project cards sit in a container-query grid (1/2/3 columns at 375/768/1440), and a rendered layout check now proves no overflow, anchors below the fixed header, visible card meta, 44px tap targets and the keyword section at all three widths.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 RED check + server | bf5817b | check-layout fails on grid and equal heights |
| 2 GREEN grid + cards | ea79fd0 | project-grid wrapper, check-content rule, card CSS |
| 3 Skills/Career/Contact/footer | ab3391b | all assertions pass |
| fix | 502a929 | kill leftover headless Edge processes |

## RED evidence (Task 1)

At every width: `FAIL grid columns: want N, got []`, `FAIL equal heights in kn-curation: 0 cards`. It also showed `FAIL anchor #abbey-road` and `#ab-peach` (page too short to scroll them to the top) and `FAIL tap targets` (career links 19px). Overflow, keywords and fonts already passed.

## GREEN evidence

Final `npm run check:layout`, all PASS (exit 0), at each of 375/768/1440: overflow (scrollWidth equals viewport), grid columns 1/2/3 in all 4 company sections, 7 kn-curation cards with 0 uneven rows, keyword section with 3 visible blocks, anchors for #career, #keywords, #abbey-road, #kn-fsd, #gi-oneday, #ab-peach (via real link clicks where the link is visible) land 15.6-16.4px below the header, meta of #kn-fsd, #gi-oneday, #abbey-road and #ab-peach visible without hover, tap targets all >= 44px (keywords >= 48px), fonts: Pretendard, 23 woff2 requests, 0 third-party. `npm run check`, `npm run check:source`, `npm run validate` exit 0.

## Deviations from Plan

**[Rule 3 - Blocking] Headless Edge children survived `proc.kill()`.** The launcher hands off to child processes, leaving debug ports listening. Fix: kill by temp-profile name via PowerShell on win32 (502a929). Verified no 94xx listeners remain.

**Extension:** anchors are also tested by clicking the real nav, career and keyword links, not only by setting the hash, so the keyword-link jump requirement is covered directly.

No visible text added; the only markup change is the wrapper div.

## Not verified

No visual review beyond one full-page screenshot at 768px (dist/shots, gitignored). Safari/iOS not tested. The no-JS header height token needed no correction.

## Known Stubs

None new. `.shot` frames and `data-slot` placeholders are intentionally empty until Phase 4.

## Threat Flags

None. Server binds 127.0.0.1, serves an extension allowlist, denies dot-segments, node_modules, private, _screenshots and traversal (fetch test passed); `--shots` outside dist/ exits 2. No phone-like strings written.

## Self-Check: PASSED

Commits bf5817b, ea79fd0, ab3391b, 502a929 exist; check, check:source, check:layout pass.
