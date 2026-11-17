---
quick_id: 261117-pk2
completed: 2026-11-17
commits: [8c84e37, 318fc71]
---

# Quick 261117-pk2: mobile Tech stack slider Summary

Below 640px, `dl.skills` is a native scroll-snap slider (one card per screen) with JS-built 44px-hit-area dots; at 640px and wider the 2/3-column grid is unchanged.

## Commits
- 8c84e37: the orchestrator's pending cover-animation edits (tokens, components, layout, check-contrast, check-ui), committed first as their own commit.
- 318fc71: the slider (css/layout.css, css/components.css, js/main.js, tools/check-ui.mjs).

## What changed
- layout.css: `@media screen and (width < 640px)` makes the grid one column wide, scrolling horizontally with `scroll-snap-type: x mandatory`, hidden scrollbar and `scroll-snap-align: start` cards.
- main.js `initSkillsSlider`: on a `matchMedia('(width < 640px)')` change it sets or removes `tabindex=0`, `role=region` and the `aria-label` on the list, and builds or removes the dots. Dot clicks use `scrollTo`, smooth only without reduced motion. The current dot is synced with a rAF-throttled scroll handler. The catch-all fallback also undoes it.
- components.css: dots are 8px inside 44x44 buttons (`--color-line-strong`, current `--color-accent`), `display: none` in print.
- check-ui: new `skills-slider` scenario covering the 375/320/414 one-card checks, snap, region, dots, dot 3 click, labels, no overflow, 768/1440 grid, and reduced motion.
- Screenshots in `dist/skills-slider/` (ignored): inspected, card 1, card 3 (dot 3 current) and 1440 grid look right.

## Verification
`npm run check`, `check:ui`, `check:layout`, `check:source` and `pdf` exited 0. The PDF is 7 pages. Known flakes did not fire.

Cover checks: cover 3 stagger 3.5s,4s,4.5s PASS. cover-orbs contrast PASS at 320, 375, 768, 1024 and 1440, and reduced motion PASS.

## Deviations
None to the plan. check-ui screenshots use a viewport clip with `captureBeyondViewport: false`, because element screenshots reset the slider scroll.
No Known Stubs.
