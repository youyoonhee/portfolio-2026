---
phase: 02-pdf-spike
plan: 02
subsystem: ui
tags: [keywords, content-check, css, anchors, tdd]
requires:
  - phase: 02-pdf-spike
    provides: tokens, layered CSS, fixed header, cover (02-01)
provides:
  - section#keywords after the cover (3 blocks, user-provided mapping, all expanded without JS)
  - keywords check in check-content, eyebrow-num aware eyebrow checks
  - D-12 (no 소속 rows) and D-13 (gi-calculator renamed), sections numbered 01-08, Keywords in nav
affects: [02-03, 02-04, 03]
tech-stack:
  added: []
  patterns: [manifest-driven keyword list, user-provided allowlist reason string]
key-files:
  created: []
  modified: [tools/content-manifest.json, tools/check-content.mjs, index.html, css/layout.css, css/components.css]
key-decisions:
  - "Keyword list link text equals the card title (projects[].name), confirmed by the user 2026-11-11"
  - "Keywords structural label and keyword names logged in uiAllowlistReasons"
requirements-completed: [DSGN-05, DSGN-01]
duration: 25min
completed: 2026-11-11
---

# Phase 2 Plan 02: Keyword section Summary

Keyword section (반응형 웹, 인터랙션, AI 활용) now follows the cover, each keyword large on the left with card-title links to the project cards on the right, fully visible without JS; 소속 rows are gone, gi-calculator is renamed, numbering runs 01-08.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 RED manifest and checks | 31f68bf | keywords/eyebrow/projects checks written, check:source fails |
| 2 GREEN markup and content | 084c124 | section#keywords, renumbering, D-12, D-13, nav item |
| 3 CSS | 31e8599 | panel, 1/2-column grid at 640 and 1024, 48px rows, CSS chevron |

## RED evidence (Task 1)

```
FAIL nav: nav links differ
FAIL sections: section ids ["cover","skills","career","gi-data",...]
FAIL skills: eyebrow is "01 / Skills", expected "02 / Skills"
FAIL career: eyebrow is "02 / Career", expected "03 / Career"
FAIL companies: eyebrow mismatch for gi-data
FAIL projects: gi-calculator: h3 differs
FAIL keywords: section#keywords missing
FAIL contact: eyebrow is "07 / Contact", expected "08 / Contact"
```

## GREEN evidence (Task 2)

`PASS nav, sections, skills, career, companies, projects, keywords, contact, anchors, source-reverse, source-numbers, headings`, `PASS source-coverage (site 65 / excluded 14 / unmapped 0)`. `npm run validate`, `npm run check` and `npm run check:source` exit 0.

## Deviations from Plan

None in scope. Note: a first draft of the check script lost a regex backslash through shell templating; fixed before the RED run.

## Not verified

Visual check at 375 and 1440 was not completed: the headless Edge screenshot attempt produced no image, so layout was verified by CSS review and the static checks only. The automated width check arrives in 02-03.

## Known Stubs

None. `data-slot` placeholders unchanged from Phase 1.

## Threat Flags

None. No phone-like strings written; check-repo ran on every commit.

## Self-Check: PASSED

Commits 31f68bf, 084c124, 31e8599 exist; check and check:source pass.
