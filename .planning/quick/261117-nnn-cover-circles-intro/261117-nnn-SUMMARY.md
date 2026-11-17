---
quick_id: 261117-nnn
type: quick
completed: 2026-11-17
commits: [ba18380, cee6f10]
---

# Quick 261117-nnn: cover circle intro Summary

Ivory cover panel with four decorative circles (gold to sage-strong, left to right, smaller and stronger) that pop in from the bottom edge in about 710ms, after which the existing cover text entrance starts at 760ms.

## What changed
- `css/tokens.css`: `--color-cover-bg #faf7f0`, `--color-gold`, `--color-sage`, `--color-sage-strong`, `--orb-dur 380ms`, `--orb-stagger 110ms`, `--cover-text-start 760ms`.
- `index.html`: `.cover-orbs[aria-hidden="true"]` with 4 empty spans as the first child of `section#cover`.
- `css/layout.css`: `.cover` gets `position: relative; isolation: isolate`, and bottom padding reserves the visible half of the largest circle (`--orb-d: min(30vw, 380px)`).
- `css/components.css`: the orbs panel (ivory, one gutter past the wrap like the keywords panel, clipped with rounded corners), the `cover-orb` keyframes (scale 0 to 1 plus opacity), and every cover text delay is now `calc(var(--cover-text-start) + old)`. Motion runs only under `html.js` and `@media screen and (prefers-reduced-motion: no-preference)`.
- `css/print.css`: `.cover-orbs` is `display: none`, so the PDF cover stays white.
- `tools/check-contrast.mjs`: ink, ink-2, ink-3 and accent on the cover ivory (5.08:1 to 16.58:1, all at least 4.5).
- `tools/check-ui.mjs`: updated cover stagger test (0.76/0.91/1.06s, with a settle time of 2.1s); new cover 6 (the last circle ends at 710ms, before the first text at 760ms); new `cover-orbs` scenario (4 circles, no circle-to-text overlap for h1, intro and mail at 320, 375, 768, 1024 and 1440, reduced motion has no animations and opacity 1, screenshots); print-state 4 (orbs hidden).

## Verification
`npm run check`, `check:ui`, `check:layout`, `check:source` and `pdf` all exit 0. The PDF is 593,590 bytes and the page plan still passes (companies on pages 3, 4, 6, 7; contact last on 7). The screenshots in `dist/cover-orbs/` (375, 1440, and a mid-animation 1440 frame) were inspected: the circles sit on the bottom edge, below all text, with no overlap.

## Deviations
- `transform-origin` is `50% 50%` rather than "bottom center". Each circle's centre sits on the panel's bottom edge, so the circle grows out of that edge. Bottom-centre would have been below the visible edge.
- The ivory colour lives on the `.cover-orbs` panel, not on the section itself, so it matches the existing keywords panel (one gutter past the wrap). The header and the rest of the page stay white.
- No JS was added.

## Known stubs
None.
