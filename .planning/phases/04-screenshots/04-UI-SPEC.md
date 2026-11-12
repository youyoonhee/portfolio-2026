---
phase: 4
slug: screenshots
status: approved
reviewed_at: 2026-11-12
shadcn_initialized: false
preset: none
created: 2026-11-12
---

# Phase 4 - UI Design Contract

> Phase 4: 스크린샷 통합. Covers SHOT-01 to SHOT-04 and the visual part of PDF-05.
> This is an image-frame, zoom-dialog and print contract on top of the approved Phase 2 and Phase 3 systems (`02-UI-SPEC.md`, `03-UI-SPEC.md`). Everything not restated here is inherited unchanged.
> Source tags: [CONTEXT D-xx] = locked user decision (04-CONTEXT.md). [P2]/[P3] = inherited. [DISCRETION] = Claude's call within the discretion scope. [DEFAULT] = standard value.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (plain HTML/CSS/JS, no build) [P2] |
| Preset | not applicable |
| Component library | none. Native `<dialog>` and `<button>` [CONTEXT discretion] |
| Icon library | none. The close button is text (`닫기`), no SVG, no emoji, no icon font [P2, DISCRETION] |
| Font | Pretendard 1.3.9 self-hosted (web dynamic subset 400/600, print static TTF) [P2] |
| CSS layers | Unchanged: `reset, tokens, base, layout, components, utilities, print`. Frame and dialog CSS go in `components`; print additions go in `print`. No new CSS file |
| JS | `js/main.js` only. The init stays inside the existing try/catch, so a failure leaves the no-JS link state [P3] |

Inherited tokens (not redefined): spacing 4/8/16/24/32/48/64, 4 font sizes, 2 weights (400, 600), all colors, radii (`--radius-sm` 8, `--radius-md` 16, `--radius-lg` 24), `--ease`, `--dur` 200ms, `--color-overlay`.

---

## Spacing Scale

Inherited with no change (all multiples of 4):

| Token | Value | Phase 4 usage |
|-------|-------|---------------|
| xs | 4px | none new |
| sm | 8px | Gap between dialog caption and close button |
| md | 16px | Dialog inset on mobile; dialog header padding-block |
| lg | 24px | Dialog inset at >= 640px |
| xl | 32px | none new |
| 2xl | 48px | none new |
| 3xl | 64px | none new |

Exceptions (dimensions, not spacing tokens):
- Close button and thumbnail hit area: 44px minimum [P2].
- App frame image box keeps `max-inline-size: 200px` and aspect 9/16, the same as the Phase 2 placeholder [CONTEXT D-04].
- Hover scale `1.02` and lift `2px` are motion values, not spacing.

---

## Typography

No change. Exactly 4 sizes and 2 weights [P2]. Dialog uses only existing roles:

| Role | Size | Weight | Line Height | Phase 4 usage |
|------|------|--------|-------------|---------------|
| Body | 16px | 600 | 1.5 | Dialog caption (project name, one line, ellipsis on overflow) and close button label |
| Label | 14px | 600 | 1.4 | none new |
| Heading | clamp(24px, 2.4vw + 16px, 36px) | 600 | 1.25 | none new |
| Display | clamp(48px, 6vw + 8px, 96px) | 600 | 1.05 | none new |

---

## Color

60/30/10 unchanged [P2]: dominant `#ffffff`, secondary `#f7f8f7`, accent `#0a7a3d`. Destructive: none.

One derived token is added, justified [DISCRETION]:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-overlay-strong` | `rgb(17 24 39 / 0.88)` | Only `dialog::backdrop` of the zoom dialog. Same ink family as `--color-overlay`. The 0.32 menu overlay is too light to isolate a screenshot, and D-07 asks for a dark ground. White caption and close text sit on this layer: the lightest possible blend (white page under 88% ink) is about `#2d3544`-equivalent, which gives roughly 11:1 against white, above the 4.5:1 minimum. Added to `@layer tokens` as an rgb value (not a hex), so `check-contrast` is unaffected |

Text on the dialog: caption and close button are `#ffffff`. The close button has a 1px `rgb(255 255 255 / 0.5)` border and a `rgb(255 255 255 / 0.12)` fill on hover and focus-visible (see Zoom Dialog Contract). No new hue.

Accent reserved for (unchanged list plus one item):
1-6: as in Phase 3 (eyebrow numbers, inline links, contribution chip, keyword text, focus ring, current-section nav).
7. Focus-visible ring on the thumbnail control and on the dialog close button (2px solid accent, offset 2px). On the dark backdrop the close button ring uses `#ffffff` instead (accent `#0a7a3d` on `#2d3544`-like ground is only about 2.2:1, below the 3:1 non-text minimum). This is the one place the ring is not accent.

Thumbnail frames use neutral lines only: `--color-line` (web), `--color-line-strong` (app) [P2].

---

## Frame Contract (SHOT-01, D-03 to D-06)

**Visual hierarchy:** 이미지가 있는 카드에서는 스크린샷 프레임이 시각적 중심이다(CSS `order: -1`로 맨 위에 보임). 읽기 순서는 프로젝트명(h3)이 먼저다(DOM 순서 유지). 확대 창에서는 이미지 영역이 중심이고, 캡션 바는 보조 요소다.

Markup of `figure.shot` by state (written by `tools/optimise-images.mjs` or by hand from the manifest) [DISCRETION]:

| State | Markup |
|-------|--------|
| Empty (no image) | Unchanged: `<figure class="shot" data-slot="screenshot" data-frame="app|web" aria-hidden="true"></figure>`. No text, not interactive, hidden in print [D-03] |
| With image, no JS | `<figure class="shot" data-slot="screenshot" data-frame="..."><a class="shot-link" href="img/projects/{id}/{id}-1920.jpg" aria-label="{프로젝트명} 화면 크게 보기"><picture>...<img alt="..." width height loading="lazy" decoding="async"></picture></a></figure>`. `aria-hidden` is removed. The link opens the large JPEG in the same tab (browser back returns) [CONTEXT code_context no-JS] |
| With image, JS ready | `main.js` replaces each `a.shot-link` with `<button type="button" class="shot-link" aria-label="{same}" aria-haspopup="dialog">` holding the same `<picture>`. Reason: a control that opens a dialog is a button, not a link. Keep the `shot-link` class so one CSS rule styles both |

Rules (both frames):
- Frame box stays `aspect-ratio: 16 / 10`, `overflow: hidden`, `border: 1px solid var(--color-line)`, `border-radius: var(--radius-md)`, surface background [P2, D-05].
- `.shot-link` is `display: block; inline-size: 100%; block-size: 100%; padding: 0; border: 0; background: none; cursor: zoom-in; color: inherit`.
- `img`: `inline-size: 100%; block-size: 100%; object-fit: cover; object-position: top` [D-06]. Long web captures therefore show their first screen only. `width`/`height` attributes carry the intrinsic ratio of the converted image so layout does not shift (CLS 0).
- Only the first card image may be eager; all others `loading="lazy" decoding="async"`. No `fetchpriority` on cards (none is above the fold) [CLAUDE.md].

Web frame (`data-frame="web"`) [D-05]: border only. The image fills the whole 16/10 frame. No browser bar, no dots, no shadow.

App frame (`data-frame="app"`) [D-04]:
- The frame (16/10, surface ground, 1px `--color-line`) stays, and the image is centered in it, the same position and size as the Phase 2 placeholder.
- Image box: `.shot[data-frame="app"] .shot-link { inline-size: auto; block-size: 100%; aspect-ratio: 9 / 16; max-inline-size: 200px; margin-inline: auto; border: 1px solid var(--color-line-strong); border-radius: var(--radius-md); overflow: hidden; }` The image inside keeps `object-fit: cover; object-position: top`. No bezel, no notch, no phone shape.
- The `::before` placeholder is suppressed when an image exists: `.shot[data-frame="app"]:has(.shot-link)::before { content: none }`.
- If the supplied app capture is not 9:16, `cover` crops the bottom; this is acceptable and recorded as a review checkpoint item.

Empty-frame state stays exactly as Phase 2 [D-03]: the grey frame and, for app, the portrait placeholder. Nothing is interactive and nothing is announced.

---

## Thumbnail Interaction (SHOT-04, quiet)

| State | Style |
|-------|-------|
| Rest | As above |
| Hover (`@media (hover: hover)`) | `img` transitions to `transform: scale(1.02)` over `--dur` with `--ease`. The frame clips the scale (`overflow: hidden`), so nothing shifts. The card lift already provided by `.project:has(a):hover` (translateY -2px) is inherited and is not doubled; the thumbnail itself never lifts |
| Focus-visible | The ring is drawn on the frame, not on the clipped inner control: `.shot:has(.shot-link:focus-visible) { outline: 2px solid var(--color-accent); outline-offset: 2px }`; `.shot-link:focus-visible { outline: none }` is allowed here because the visible ring is provided by the parent frame (no focus indicator is lost). The same scale as hover applies (hover parity [P2]) |
| Active | No extra style |
| Reduced motion | `img` stays unscaled; no transition [P3 global rule + explicit `transform: none`] |

Animated properties: `transform` only. Nothing loops.

Note on the card lift: `.project:has(a):hover` matches because cards contain links. A card whose only interactive element is the button does not lift via `:has(a)`; extend the selector to `:has(a, .shot-link)` so lift parity is consistent across all 13 cards [DISCRETION].

---

## Zoom Dialog Contract (SHOT-04, D-07 to D-09)

### Structure [DISCRETION]

One shared dialog, created by `main.js` and appended to `body` (the no-JS markup stays unchanged):

```
<dialog class="shot-dialog" aria-labelledby="shot-dialog-title">
  <div class="shot-dialog-bar">
    <p class="shot-dialog-title" id="shot-dialog-title"></p>
    <button type="button" class="shot-dialog-close">닫기</button>
  </div>
  <div class="shot-dialog-scroll"><img alt="" ...></div>
</dialog>
```

- Open with `showModal()`; close with `close()`. The browser provides inert background, top layer, Esc and the focus trap. No `aria-modal` attribute, no custom trap.
- `aria-labelledby` points at the caption, so the accessible name is the project name. The caption is the only text besides the close button [D-08].
- The dialog image takes its `alt` from the thumbnail `img` (copied on open).
- Source: the 1920w (web) or 1080w (app) AVIF/WebP/JPEG set through `srcset` with `sizes="100vw"`; the dialog `img` is created on open, never preloaded.

### Layout

- Dialog box: `position: fixed; inset: var(--space-md)` below 640px, `inset: var(--space-lg)` at >= 640px; `inline-size: auto; block-size: auto; max-inline-size: none; max-block-size: none; margin: 0; padding: 0; border: 0; background: transparent; color: #fff; overflow: hidden`. Near full screen, same on mobile [D-07].
- `::backdrop { background: var(--color-overlay-strong) }`.
- Layout: `display: grid; grid-template-rows: auto minmax(0, 1fr)` (bar, then image area).
- Bar: flex row, `align-items: center; justify-content: space-between; gap: var(--space-sm); padding-block-end: var(--space-sm)`. Caption: Body 16/600, white, `min-inline-size: 0`, single line with `text-overflow: ellipsis`. Close button: `min-block-size: 44px; min-inline-size: 44px; padding-inline: var(--space-md); background: transparent; color: #fff; border: 1px solid rgb(255 255 255 / 0.5); border-radius: var(--radius-sm); font: inherit (Body 16/600)`; hover/focus-visible: `background: rgb(255 255 255 / 0.12)`. Focus ring: 2px solid `#ffffff`, offset 2px.
- Scroll area `.shot-dialog-scroll`: `overflow-y: auto; overscroll-behavior: contain; border-radius: var(--radius-md); background: var(--color-surface); display: grid; place-items: start center`.
  - Web (landscape or long): `img { inline-size: 100%; max-inline-size: 1920px; block-size: auto }`. The image is as wide as the area allows. When taller than the area, the area scrolls vertically inside the dialog, never horizontally.
  - App (portrait): `img { block-size: auto; max-block-size: none; inline-size: min(100%, 480px) }`; taller than the area scrolls. If the full image fits (typical 9:16 on desktop), it is shown whole: use `max-block-size: 100%` only when the aspect is portrait and width-limited, so it never upscales past its 1080w source.
  - The scroll area is focusable (`tabindex="0"`, `role="region"`, `aria-label` = project name) only when it overflows, so keyboard users can scroll it with arrow keys; JS sets this by comparing `scrollHeight > clientHeight` on open.
- Page scroll lock while open: `html:has(dialog.shot-dialog[open]) { overflow: hidden }` (scrollbar-gutter stays stable via `scrollbar-gutter: stable` on `html` when supported, to avoid layout shift). Header hide logic ignores scroll while the dialog is open.
- Click or tap on the backdrop (outside the bar and the scroll area) closes the dialog. Clicking the image does not close it.

### Motion (D-09) [DISCRETION values]

| Moment | Dialog / backdrop | Image area |
|--------|-------------------|------------|
| Open | `opacity 0 -> 1`, `--dur` (200ms), `--ease` | `transform: scale(0.98) -> none`, `--dur`, `--ease` |
| Close | `opacity 1 -> 0`, `--dur` | `scale(1) -> scale(0.98)` |

- Implementation: `@starting-style` for entry; for exit `main.js` sets `data-closing="true"`, waits for `transitionend` (fallback timer of `--dur` + 50ms), then calls `close()` and returns focus. `transition-behavior: allow-discrete` on `display` and `overlay` is used where supported (Chrome 117+, Safari 17.4+); without support the dialog simply appears and disappears (acceptable, progressive enhancement).
- Only `opacity` and `transform` animate. The backdrop fades by animating the dialog's `opacity` together with `::backdrop` opacity; it is not blurred (`backdrop-filter` is not used, it is not a transform/opacity property) [DISCRETION, resolves "배경은 흐려지고" as dim-in].
- `prefers-reduced-motion: reduce`: `transition: none`, `animation: none`; the dialog appears and disappears instantly, no `data-closing` wait.

### Keyboard and focus (SHOT-04)

| Rule | Contract |
|------|----------|
| Open | Enter or Space on the thumbnail button (native). Click or tap also opens |
| Initial focus | The close button (`autofocus` on it), so Esc and Enter close immediately and the first Tab stop is predictable |
| Tab / Shift+Tab | Cycle inside the dialog only: close button, then the scroll region if focusable, then back (browser top-layer inertness) |
| Esc | Closes (native `cancel` -> `close`). Runs the exit transition unless reduced motion |
| Focus return | On `close`, focus returns to the exact thumbnail button that opened it (stored reference), without scrolling the page |
| Arrow / PgUp / PgDn / Space | Scroll the focused scroll region |
| Targets | Close button 44px minimum |
| Failure | If `showModal` is unavailable or init throws, buttons are never created and the thumbnail remains the no-JS link to the large JPEG |

### Mobile (375 x 812 and 768 x 1024)

- Same structure and behavior; inset 16px; bar on top, image area below; touch scroll inside the area; `overscroll-behavior: contain` so reaching the end does not scroll the page.
- Use `100dvh`-safe sizing: the dialog uses `inset`, not `vh`, so the mobile browser bar does not hide the close button.
- No pinch-zoom blocking (`touch-action` is not restricted).
- Thumbnail hover styles are wrapped in `@media (hover: hover)` so touch devices have no sticky hover.

---

## Print and PDF Contract (PDF-05, D-14) [DISCRETION]

- Cards with an image show a small frame in print: the web frame is 16/10 with the 1px line; the app frame shows the portrait image box centered in the 16/10 frame. Same top-cropped `object-fit: cover; object-position: top` [D-14, P2].
- D-14의 "웹과 같은 프레임"은 화면 종류별로 웹 사이트와 같은 프레임을 쓴다는 뜻이다. 그래서 앱 카드는 PDF에서도 세로 이미지 박스를 유지한다(D-04, P2와 일치). 의도한 동작이다.
- Empty frames remain hidden: `.shot:not(:has(picture, img)) { display: none }` [P3, unchanged].
- No interactive affordance in print: `.shot-link { cursor: auto }`; no focus ring; `.shot-dialog { display: none !important }`; `img { transform: none !important }` (covered by the P3 print rule). No hint text such as "크게 보기" exists in visible DOM, so nothing else needs hiding.
- Print frame size: in the 2-column card grid a thumbnail is about 85mm wide and 53mm high (16/10). A card with a screenshot therefore adds about 53mm plus the 4mm gap; the existing `.project { break-inside: avoid }` keeps cards whole. Page count may grow beyond 6 [D-14]; `--page-plan` and `pdf-report` are updated to the measured count.
- The builder removes `<source>` elements so the JPEG `src` is used, removes `loading="lazy"`, and awaits `img.decode()` [CLAUDE.md, P3]. Print JPEG width: 960w for web frames and 720w for app frames, quality 78 as the starting point; if the PDF exceeds 5MB the builder or the tool lowers to 720w / 480w and quality 70. 10MB or more fails the build [D-14].
- `print-color-adjust: exact` stays so the frame ground and lines print.

---

## Copywriting Contract

New visible and accessible copy (Korean). Only these strings are added; each needs a `uiAllowlist` entry in the manifest if `check-content` covers it.

| Element | Copy |
|---------|------|
| Primary CTA | none (the thumbnail is the control; there is no visible label on it) |
| Thumbnail button / link accessible name | `{프로젝트명} 화면 크게 보기`, where `{프로젝트명}` is the exact text of the card `h3` (e.g. `원데이보험앱화면리뉴얼 화면 크게 보기`). Set as `aria-label` on both the no-JS link and the JS button |
| Dialog accessible name | The project name (`aria-labelledby` -> caption) |
| Dialog caption | Project name only, one line, equal to the card `h3` text. No platform, contribution, period or other info [D-08] |
| Close button label | `닫기` (visible text; it is also its accessible name) |
| Scroll region accessible name | The project name (only when the region overflows) |
| Image alt (card and dialog) | Short, factual, visible content only, no achievement or evaluation words, no numbers not on screen. Pattern: `{서비스/프로젝트 약칭} {화면 종류}` such as `위캔키즈클럽 메인 화면`, `원데이보험 앱 홈 화면`. Drafted by Claude, confirmed at the review checkpoint [D-12]. Never empty for a shown image. Not duplicated into the caption or the aria-label |
| Empty state | none. The empty frame carries no text and `aria-hidden="true"` [D-03] |
| Error state | not applicable (no form). If an image fails to load the frame keeps its grey ground; no message |
| Destructive confirmation | not applicable |

Alt text rules: describe what is visible (screen type and main visible element), max about 40 Korean characters, no "스크린샷" or "이미지" prefix, no quotes of long on-screen text, no personal data from the screen (those regions are masked anyway) [D-10, D-12].

---

## Responsive Verification Matrix (Phase 4 additions)

| Width x height | Must verify |
|----------------|-------------|
| 375 x 812 | Single-column cards; thumbnail fills the frame; app image is centered, <= 200px wide; tap opens the dialog with 16px inset; close button 44px and always visible; long web image scrolls inside the dialog; background page does not scroll; Esc (with keyboard) closes and returns focus |
| 768 x 1024 and 1023 x 768 | Cards 1 or 2 columns; dialog inset 24px; same behavior |
| 1024 x 768 and 1440 x 900 | Hover scale only with a pointer; focus ring on the frame; dialog image is as wide as the area; vertical scroll inside only; no horizontal scroll |
| any, reduced motion | No hover scale, dialog opens and closes instantly |
| any, JS disabled | Thumbnail is a link to the large JPEG; empty frames unchanged; no `opacity: 0` state |
| any, empty frame | Not focusable, not announced, no cursor change |
| print (A4) | Every card with an image shows its small frame, top-cropped; empty frames hidden; no dialog; PDF under 5MB (hard fail at 10MB); zero blank pages; page plan updated |

---

## Design-Taste Waivers (Phase 4 delta)

| ID | Rule | Disposition |
|----|------|-------------|
| W-14 | Hover motion limited to 2px lift / 1.02 scale, transform and opacity only | Complied: scale 1.02 on the image only |
| W-15 | No carousel / gallery | Complied: one image per project, no next/previous |
| W-16 | Modal motion short and opt-out for reduced motion | Complied: 200ms fade and 0.98 to 1 scale, instant under reduced motion |
| W-17 | Focus ring is accent on every focusable | Exception: white ring on the dark dialog backdrop for contrast; `.shot-link` outline is drawn by the parent frame because the inner overflow clips it |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (not applicable, not a React project) | not applicable |
| Third-party registries | none | not applicable. No third-party runtime library is added. `sharp` is a pinned local devDependency for image conversion only and is not loaded by the site |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS (FLAG resolved: visual hierarchy line added)
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-11-12 (gsd-ui-checker)
