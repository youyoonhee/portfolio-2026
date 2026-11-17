---
quick_id: 261117-nnn
type: quick
autonomous: true
files_modified: [index.html, css/tokens.css, css/layout.css, css/components.css, css/print.css, tools/check-ui.mjs, tools/check-contrast.mjs]
---

# Quick 261117-nnn: cover circle intro animation

## Objective
On 2026-11-17 the user asked for the top cover (`section#cover`) to get a circle intro, inspired by a stock image they linked. In that image, overlapping circles rise from the bottom edge. They run left to right, each one smaller and stronger in colour. The intro and colours are:
- **Circles:** they pop in one after another from left to right, quickly ("샤샤샥"), until the last circle.
- **Text:** the existing cover text entrance (`.cover-line` ×3, `.cover-intro`, `.cover-mail`) starts only after the last circle has appeared.
- **Colours:** the cover background becomes ivory, on the cover only. The rest of the page stays white (user choice). The circles use the user's secondary colour, champagne gold, and main colour, sage green. Sage and gold are used on the circles only, and the site accent `#0a7a3d` stays for text, links and chips (user choice).

This is an original composition. Do not trace the stock image: choose our own count, sizes and positions.

## Design decisions (fixed)
- **New tokens in `css/tokens.css`:**
  - `--color-cover-bg: #FAF7F0` (ivory)
  - `--color-gold: #E4D3AA` (champagne gold)
  - `--color-sage: #A9B89B` (sage green)
  - a deeper `--color-sage-strong: #8FA382` for the last circle, if a 4-step progression needs it

  The circles are decorative, non-text surfaces. Body text must not sit on them at low contrast.
- **Circles:** 4 decorative circles in one `<div class="cover-orbs" aria-hidden="true">` with 4 empty `<span>` children. They are placed absolutely behind the cover content (`z-index` below the text; the cover gets `position: relative; isolation: isolate; overflow: clip`).
  - They are anchored to the bottom edge and overlap like the reference: left largest, decreasing to the right.
  - Colour progression, left to right: gold → gold/sage → sage → sage-strong. Use solid fills, optionally with a soft 0.9 opacity.
  - Sizes are in vw/clamp. On phones they stay in the lower third so they never sit behind the h1 or the intro/mail text. Verify at 320, 375, 768, 1024 and 1440.
- **Motion:** each circle uses `transform: scale(0) → scale(1)` with `transform-origin: bottom center` plus opacity 0→1. The duration is about 380ms with the existing `--ease`, staggered about 110ms left to right. The last circle finishes at about 380 + 3×110 = 710ms.
  - Add a token `--cover-text-start: 760ms`.
  - Every existing cover text delay becomes `calc(var(--cover-text-start) + <old delay>)`.
  - Only transform and opacity are animated. It runs once on load, only under `html.js` inside `@media screen and (prefers-reduced-motion: no-preference)`, the same as the existing entrance.
- **Reduced motion, no JS, print:**
  - With reduced motion or no JS, the circles and text are shown in their final state immediately, with no delay. Nothing is ever left hidden.
  - Print: hide `.cover-orbs` and keep the cover background white in `css/print.css`, so the PDF stays unchanged at 7 pages.
- **Header:** unchanged and still white. The cover's ivory starts below the header.

## Tasks

<task type="auto">
  <name>Task 1: Tokens, markup, CSS and animation timing</name>
  <files>css/tokens.css, index.html, css/layout.css, css/components.css, css/print.css</files>
  <read_first>css/tokens.css, css/layout.css (.cover), css/components.css (cover block ~lines 240-310), css/print.css, index.html (section#cover)</read_first>
  <action>Implement the design decisions above. Insert the orbs div as the first child of section#cover. Keep all existing cover classes and element counts unchanged; check-ui "cover 2" expects exactly 5 .cover-line/.cover-intro/.cover-mail elements. Do not add any JS unless CSS cannot do it.</action>
  <verify><automated>npm run check && npm run check:contrast</automated></verify>
  <acceptance_criteria>
    - section#cover has a `.cover-orbs[aria-hidden="true"]` with 4 children; the cover background is ivory and the rest of the page is still white
    - in the motion CSS, every cover text animation-delay includes `--cover-text-start`
    - print.css hides `.cover-orbs`
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Checks, contrast and visual verification</name>
  <files>tools/check-ui.mjs, tools/check-contrast.mjs</files>
  <read_first>tools/check-ui.mjs (cover / reduced / print-state scenarios), tools/check-contrast.mjs</read_first>
  <action>
    - Add contrast pairs for cover text on `--color-cover-bg`: ink, ink-2 and ink-3, plus the accent link (cover-mail). All must be at least 4.5:1, or 3:1 where the existing rule is non-text.
    - Update check-ui:
      - Under motion, the last circle's animation must end before the first `.cover-line` animation starts. Read `getAnimations()` timings.
      - Under reduced motion, there are no running animations and all circles and text are at opacity 1.
      - The orbs never overlap the h1, .cover-intro or .cover-mail bounding boxes at 320, 375, 768, 1024 and 1440.
      - In print, `.cover-orbs` is display none.
    - Keep every existing assertion.
    - Save headless screenshots of the cover at 375 and 1440 in the final state, plus one mid-animation frame at 1440, under dist/cover-orbs/. Inspect them.
  </action>
  <verify><automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf</automated></verify>
  <acceptance_criteria>
    - every command exits 0; the PDF is 7 pages and ≤ 5,000,000 bytes
    - the screenshots show circles rising from the bottom, left to right, behind and below the text, with no overlap with any text
  </acceptance_criteria>
</task>

## Hard rules
- No push, no gh write calls, no --no-verify, no design-taste gate.mjs.
- No scroll-driven or fade-in-on-scroll animation (design-taste); this is a one-time hero entrance only.
- Never kill processes by name; use node, not python.
- Never read private/, .planning/source/ or _screenshots/; never print a phone number.
- Stage by explicit path; leave .planning/config.json, .claude/ and tools/measurements.json untouched.
- Known flake: the check:ui keyword-focus and check:layout 320px anchor tests can fail intermittently; re-run each once.
