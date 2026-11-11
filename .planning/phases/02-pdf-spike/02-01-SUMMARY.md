---
phase: 02-pdf-spike
plan: 01
subsystem: ui
tags: [css, pretendard, design-tokens, wcag, fixed-header, cover]
requires:
  - phase: 01-foundation-content
    provides: index.html content skeleton, check-content engine, repo guards
provides:
  - Self-hosted Pretendard 400/600 (dynamic subset woff2) plus print TTFs, reproducible via npm run fonts:copy
  - Eight-file @layer CSS architecture with hex design tokens (white + one green accent)
  - Fixed .site-header with no-JS nav and hamburger in markup, section#cover
  - tools/check-contrast.mjs (13 WCAG pairs) wired into npm run check
affects: [02-02, 02-03, 02-04, 03]
tech-stack:
  added: [pretendard@1.3.9 (devDependency, exact pin)]
  patterns: [one @layer per css file, hex-only color tokens, html.js gating for JS-only states]
key-files:
  created: [tools/copy-fonts.mjs, tools/check-contrast.mjs, css/layers.css, css/reset.css, css/tokens.css, css/base.css, css/layout.css, css/components.css, css/utilities.css, css/print.css, css/fonts.css, css/fonts-print.css, fonts/pretendard-ofl.txt]
  modified: [index.html, tools/check-content.mjs, tools/content-manifest.json, .gitattributes, package.json, package-lock.json]
key-decisions:
  - "Only new visible string is 메뉴 (visually hidden), logged in uiAllowlistReasons"
  - "No-JS mobile header height token is 112px (64px bar + 48px nav row)"
requirements-completed: [DSGN-01, QUAL-03]
duration: 35min
completed: 2026-11-11
---

# Phase 2 Plan 01: Fonts, tokens, header and cover Summary

Pretendard 400/600 is self-hosted, the page now has a green-on-white token system in eight layered CSS files, a fixed header with a working no-JS nav, a centered display-size cover, and a script that proves 13 contrast pairs.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 Font pipeline | b6e6961 | 184 woff2 + 2 TTF, css/fonts*.css, license file; legitimacy gate passed (repo orioncactus/pretendard, OFL-1.1, no install scripts) |
| 2 Header/cover split | 31cf232 | site-header, section#cover, new hero/nav/allowlist-reasons checks, LF normalization |
| 3 Tokens and CSS | d7e0c0a | 8 layer files, check-contrast, stylesheet links |

## RED evidence (Task 2)

Before the markup edit, `npm run check:source` printed:
`FAIL hero: header.site-header missing`, `FAIL nav: header.site-header missing`, `FAIL sections: section ids ["skills","career",...]`. After the edit all checks passed.

## Measurements

- Contrast: all 13 pairs PASS; accent on white is 5.43:1, lowest text pair is accent on tint at 4.90:1.
- No-JS header height at 375px: the token start value 112px was confirmed. After adding a 64px wordmark row the header measures 112px (the 768px run, which uses the same no-JS rule, measured exactly 112); no correction was needed. At 1440px the header is 72px.
- No horizontal overflow at 375, 768, 1440 (scrollWidth equals viewport). Cover h1 is 48px at 375 and 94.4px at 1440; computed font family starts with Pretendard.

## Deviations from Plan

**[Rule 1 - Bug] No-JS mobile header was 67.6px, not 112px.** Wordmark and nav row only reached 64px min bar height in total, so the cover started under the header edge. Fix: in the no-JS mobile rule the wordmark gets a 64px row (css/components.css). Included in the Task 3 commit.

No other deviations. Notes: the first 375px measurement after a cold server start intermittently returned a null element (server warm-up, not a page fault); re-runs were clean for the other widths.

## Known Stubs

None. `data-slot="phone"` stays empty by design (phone only in the PDF build, 02-04).

## Threat Flags

None. No external URLs in css/ and no phone-like strings written.

## Self-Check: PASSED

Files and commits b6e6961, 31cf232, d7e0c0a exist; `npm run check` exits 0; `npm run check:source` passes.
