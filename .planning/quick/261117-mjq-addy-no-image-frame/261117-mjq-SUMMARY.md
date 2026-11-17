---
quick_id: 261117-mjq
type: quick
completed: 2026-11-17
files_modified:
  - index.html
  - css/components.css
  - css/print.css
  - tools/check-content.mjs
  - tools/content-manifest.json
  - tools/check-ui.mjs
  - tools/check-images.mjs
  - tools/optimise-images.mjs
  - tools/lib/shot-markup.mjs
---

# Quick 261117-mjq: "No image" frame for CJ ADDY

CJ ADDY (`#bs-addy`), the only project without a screenshot, now shows a centred light photo icon plus the text `No image` inside its existing grey web frame. It is not a link or button and cannot open the zoom dialog.

## What changed

- **Markup:** the bs-addy figure is `data-empty="no-image"`, with no `aria-hidden`. It holds an inline 32px stroke SVG (`aria-hidden="true"`, `focusable="false"`) and `<span class="no-image-label" lang="en">No image</span>`. Screen readers hear "No image" exactly once, from the text (the icon is hidden).
- **CSS (`components.css`):** `.shot[data-empty="no-image"]` is a centred flex column. It keeps the same 16/10 box and surface colour, uses `--color-ink-3`, the `--text-label` size and `cursor: auto`, and has no hover effect.
- **Print choice:** the no-image frame is shown in the PDF, same as on screen (`print.css` hides only empty frames that lack `data-empty`). The PDF is still 7 pages, 589,222 bytes (limit 5,000,000).
- **JS:** `initShots()` only selects `a.shot-link`, so it ignores the frame with no change.
- **Pipeline compatibility:** `readArticle`/`replaceFigure` already match the figure, so an approved screenshot replaces it. Added `isNoImageFigure`/`emptyFigureLike` in `shot-markup.mjs`. Resets (`--clear`, the self-tests, and the check-ui/check-images fixtures) keep the no-image state instead of overwriting it with a blank frame. Consequence: `--clear bs-addy` keeps the No image frame (a later approval swaps it for the screenshot; clearing a filled bs-addy yields a plain empty frame).
- **Checks:**
  - `content-manifest.json`: bs-addy gets `"noImage": true`. `No image` is added to `uiAllowlist` and `uiAllowlistReasons`.
  - `check-content`: `slots` and `shots` validate the no-image frame. It needs `data-empty="no-image"`, no `aria-hidden`, one aria-hidden svg, text exactly `No image`, and no `a`/`img`/`picture`/`button`/`tabindex`. The real page reports `shots (10 filled, 1 no-image, 0 empty)`. Existing rules were not loosened.
  - `check-ui` (fixture pages: 2 filled, 1 no-image, 8 empty): new assertions for centring, same box, same surface colour, cursor, a click not opening the dialog, and print showing the frame. Empty counts changed 9 -> 8.
  - `optimise-images` self-test: expected shots line updated.

## Verification

`npm run check`, `check:ui` (passed first run, no flake), `check:layout`, `check:source`, `check:artifact` and `pdf` all exit 0. PDF has 7 pages, 10 embedded JPEGs.
Screenshots of the #bs-addy card at 375 and 1440 were saved to `dist/addy-no-image-375.png` and `dist/addy-no-image-1440.png` (gitignored) and viewed: icon and label are centred in the grey frame.

## Deviations from Plan

**1. [Rule 3 - Blocking] `check-content` projects rule rejected any link in a project without a status box.** It counted the `a.shot-link` added by the screenshots commit (gi-calculator). It now ignores `shot-link` anchors; other links are still rejected.

**2. [Rule 3 - Blocking] check-images fixtures and the optimise-images round-trip** expected every frame to reset to a blank frame. They now preserve the no-image figure (the `emptyFigureLike` helper).

Otherwise the plan was executed as written.

## Self-Check: PASSED
