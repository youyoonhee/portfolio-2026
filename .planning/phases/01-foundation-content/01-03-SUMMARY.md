---
phase: 01-foundation-content
plan: 03
subsystem: content-html
tags: [content, projects, status, html]
requires: [01-02]
provides:
  - 13 project articles inside the 4 company sections, uniform field order
  - Status badges and 5 live external links (new tab, noopener)
  - Hidden empty publishing-point slots and empty screenshot slots
  - checkProjects and extended slots check
affects: [01-04]
tech-stack:
  added: []
  patterns: [project article template documented in a prose HTML comment, manifest.projects drives checks]
key-files:
  modified:
    - tools/content-manifest.json
    - tools/check-content.mjs
    - index.html
key-decisions:
  - "No period row on projects (D-07); company tenure stands in"
  - "kn-linkalba is status pending: no badge, no link, no status-links element (D-14)"
requirements-completed: [CONT-04, CONT-05, CONT-06, CONT-08, QUAL-01]
duration: ~15min
completed: 2026-11-11
---

# Phase 1 Plan 03: Project Articles Summary

Thirteen project articles in a fixed order (title, meta list with affiliation/platform/optional duty/contribution, hidden point slot, empty screenshot slot, status and link), matched exactly against the CONTEXT project table in the manifest.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 RED: manifest projects/statusLabels/links + checkProjects, slots | 83af70b | check-content exit 1 (projects, links FAIL) |
| 2 GREEN: 13 articles + template comment | 61cd2cc | `npm run check` and `--require-source` pass |

## Deviations from Plan

None. Acceptance greps: 13 projects, 13 hidden point slots, 13 screenshot slots, 5 noopener, 5 target=_blank, 13 h3, 0 forbidden hrefs, 0 period rows, comment contains no literal markup.

## Known Stubs

Point slots (hidden, empty) and screenshot slots (empty) are intentional; content arrives from the user and Phase 4.

## Self-Check: PASSED
