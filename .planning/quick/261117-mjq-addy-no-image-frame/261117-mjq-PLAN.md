---
quick_id: 261117-mjq
type: quick
autonomous: true
files_modified: [index.html, css/components.css, css/print.css, tools/check-content.mjs, tools/content-manifest.json, tools/check-ui.mjs]
---

# Quick 261117-mjq: "No image" frame for CJ ADDY

## Objective
The user asked (2026-11-17) that CJ ADDY (`#bs-addy`), the only project without a screenshot, show a "No image" placeholder instead of the blank frame. They chose: a light photo icon plus the text `No image`, centred in the existing grey web frame. It must not be clickable and must not open the zoom dialog.

## Context
- All other 10 projects now have published screenshots (commit e3d24a9). `bs-addy` keeps `<figure class="shot" data-slot="screenshot" data-frame="web" aria-hidden="true"></figure>`.
- Empty-frame rules today: an empty frame is `aria-hidden`, unfocusable and `cursor: auto`, and it is hidden in print. `check-content` "shots" and "slots" plus `check-ui` "shot-frame"/"shot-nojs" encode this. Note that `check-ui` and the image self-tests empty every real frame before injecting their 2 fixtures.
- `tools/optimise-images.mjs` (`--clear`, `emptyFigure`) and `tools/lib/shot-markup.mjs` own the frame markup. Keep the "No image" state compatible: if a screenshot is later approved for bs-addy, the pipeline must still be able to replace the figure.

## Tasks

<task type="auto">
  <name>Task 1: No-image markup, CSS and checks</name>
  <files>index.html, css/components.css, css/print.css, tools/lib/shot-markup.mjs (if needed), tools/check-content.mjs, tools/content-manifest.json, tools/check-ui.mjs</files>
  <read_first>
    - index.html (#bs-addy, lines ~373-385; the other filled figures for comparison)
    - css/components.css (.shot rules, empty-frame placeholder ::before, tokens in use)
    - css/print.css (.shot print rules)
    - tools/lib/shot-markup.mjs (emptyFigure, replaceFigure, readArticle)
    - tools/check-content.mjs (shots / slots checks), tools/check-ui.mjs (shot-frame, shot-nojs counts)
  </read_first>
  <action>
    - Mark the bs-addy figure as a no-image state, for example `data-empty="no-image"` on the existing empty figure. Inside it, place an inline decorative SVG photo icon (paths only, `aria-hidden="true"`, `focusable="false"`, about 32px, stroke `--color-ink-3`) and a `<span lang="en">No image</span>` label (Label size, `--color-ink-3`).
    - Remove `aria-hidden` from the figure so that "No image" is read once. Alternatively, keep the figure hidden and add a visually-hidden "이미지 없음" text. Pick one and keep it consistent: screen readers must hear that there is no image, exactly once.
    - The frame is centred both ways (flex/grid), keeps the same aspect and box as other web frames, uses the existing frame surface colour, and has no hover or cursor change. It is not wrapped in a link or button, and JS `initShots()` must ignore it (no image means nothing to upgrade).
    - Print: show the no-image frame in the PDF the same way as screen, or hide it like empty frames used to be. Choose whichever keeps the PDF page count at 7 and looks intentional, and record the choice in the SUMMARY.
    - Make `emptyFigure`/`--clear` and the approval pipeline still able to replace this figure later. Either make `readArticle`/`replaceFigure` match the no-image figure, or document that `--clear bs-addy` restores the plain empty frame.
    - Update `check-content` (shots: N filled, plus the no-image count), the manifest, and `check-ui` assertions so that the real page is expected to have 10 filled + 1 no-image, while fixture pages keep working. Do not loosen any existing rule. Add an explicit assertion that `#bs-addy` contains `No image` and no `<img>`/`<a>`/`<button>`.
  </action>
  <verify>
    <automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf</automated>
  </verify>
  <acceptance_criteria>
    - index.html `#bs-addy` contains `No image` and an inline svg with aria-hidden="true", and no img, a or button element
    - every command in verify exits 0; PDF is 7 pages and <= 5,000,000 bytes
    - a headless screenshot of the #bs-addy card at 375 and 1440 is saved under dist/ (gitignored) and inspected
  </acceptance_criteria>
  <done>CJ ADDY shows a centred icon + "No image" in its frame; all checks pass.</done>
</task>

## Hard rules
No push, no gh write calls, no --no-verify, no killing processes by name, node not python. Never read private/, .planning/source/, _screenshots/; never print a phone number. Stage by explicit path; leave .planning/config.json and .claude/ untouched. Known flake: check:ui keyword-focus — re-run once.
