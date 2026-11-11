---
phase: 3
slug: pdf
status: approved
reviewed_at: 2026-11-11
shadcn_initialized: false
preset: none
created: 2026-11-11
---

# Phase 3 - UI Design Contract

> Phase 3: 인터랙션과 제출용 PDF. Covers DSGN-03, DSGN-05 (transition behavior), QUAL-02, PDF-01 to PDF-04 (visual and page contract).
> This is a motion, interaction and print contract on top of the approved Phase 2 visual system (`.planning/phases/02-pdf-spike/02-UI-SPEC.md`). Everything not restated here is inherited unchanged.
> Source tags: [CONTEXT D-xx] = locked user decision (03-CONTEXT.md). [P2] = inherited from the approved Phase 2 contract. [DISCRETION] = Claude's call within the discretion scope. [DEFAULT] = standard value.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (plain HTML/CSS/JS, no build, not React) [P2] |
| Preset | not applicable |
| Component library | none (hand-written CSS) [P2] |
| Icon library | none. The hamburger icon is three CSS bars drawn with `currentcolor` (no SVG, no emoji, no icon font) [P2] |
| Font | Pretendard 1.3.9 self-hosted. Web: dynamic subset woff2, 400 and 600. Print: static TTF as `"Pretendard Print"` [P2, CLAUDE.md] |
| Kit CSS | design-taste kit CSS and `system.js` are NOT imported. Rules only. `gate.mjs` is never run [P2] |
| CSS layers | Unchanged: `reset, tokens, base, layout, components, utilities, print`. New motion CSS goes in `components`; the keyword switch geometry goes in `layout`; print additions go in `print`. No new CSS file is required; `js/main.js` is the only new runtime file [CONTEXT Integration Points] |
| JS | `js/main.js` as `<script type="module">`, relative path, no library. Plus ONE inline classic script in `<head>` (before the stylesheets): `document.documentElement.classList.add('js')`. Reason: the `js` class must exist before first paint or the cover would flash visible, hide, then animate. The inline script is a single statement and has no logic. [DISCRETION] |

### Inherited tokens (do not redefine)

Spacing 4/8/16/24/32/48/64 (`--space-xs` to `--space-3xl`), 4 font sizes (Body 16, Label 14, Heading `clamp(24px, 2.4vw + 16px, 36px)`, Display `clamp(48px, 6vw + 8px, 96px)`), 2 weights (400, 600), colors (`--color-bg`, `--color-surface`, `--color-line`, `--color-line-strong`, `--color-ink`, `--color-ink-2`, `--color-ink-3`, `--color-accent`, `--color-accent-strong`, `--color-accent-tint`), radii (`--radius-sm` 8, `--radius-md` 16, `--radius-lg` 24), `--ease: cubic-bezier(0.2, 0, 0, 1)`, `--dur: 200ms`, `--header-h` (64px, 72px at >= 900px).

---

## Spacing Scale

Declared values (all multiples of 4), inherited from Phase 2 with no change:

| Token | Value | Phase 3 usage |
|-------|-------|---------------|
| xs | 4px | none new |
| sm | 8px | Hamburger panel entry offset (translateY from -8px) |
| md | 16px | Cover intro and email rise distance; panel inner padding-block |
| lg | 24px | Cover line rise distance |
| xl | 32px | Keyword switch travel distance (enter from +32px, leave to -32px) |
| 2xl | 48px | none new |
| 3xl | 64px | none new |

Spacing exceptions: none. No new spacing token is added.

Layout, hit-target and behavior dimensions (NOT spacing tokens; they size components or set thresholds):
- 44px minimum hit area (hamburger, `.cover-mail a`); panel link rows are 48px tall [P2].
- Hamburger icon geometry: bar 22px wide by 2px thick, outer bars offset 7px from the center bar. These are drawing dimensions of the icon, not gaps.
- Header hide threshold: 80px from the top of the page (equals `scroll-margin-top`) and a direction-change delta of 8px. These are scroll thresholds in JS, not spacing.
- Keyword track: slot length `50svh` per keyword, pin distance `150svh`, stage height `100svh`, min-height guard `560px`.
- Print dimensions in mm and pt exist only inside `@layer print` [P2].

### Breakpoints used by Phase 3 [DISCRETION, built on P2]

| Behavior | Condition | Notes |
|----------|-----------|-------|
| Hamburger and panel | `max-width: 899.98px` | Same as Phase 2. At >= 900px the inline nav is used and any open panel is closed on resize |
| Keyword scroll switch | `screen and (min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)` | Desktop only. 1024px is the Phase 2 "desktop" breakpoint where the keyword rows become two columns. The height guard keeps a short landscape window from pinning content taller than the viewport |
| Cover entrance | `screen and (prefers-reduced-motion: no-preference)` and `html.js` | Any width |
| Header hide and show | `html.js`, `prefers-reduced-motion: no-preference`, any width | Applies at mobile too |

---

## Typography

No change. Exactly 4 sizes and 2 weights [P2]:

| Role | Size | Weight | Line Height | Phase 3 note |
|------|------|--------|-------------|--------------|
| Body | 16px | 400 (600 for h3) | 1.6 body, 1.5 UI | Nav links, panel links, keyword rows, phone link |
| Label | 14px | 600 | 1.4 | Phone label (print only, if the private file supplies one) |
| Heading | `clamp(24px, 2.4vw + 16px, 36px)` | 600 | 1.25 | none new |
| Display | `clamp(48px, 6vw + 8px, 96px)` | 600 | 1.05 | Cover lines and the keyword in the switch stage (same shared token, no new size) |

Print uses the Phase 2 pt mapping: Body 10.5pt, Label 8.5pt, Heading 18pt, Display 36pt [P2]. The hamburger has no visible text, so no size is used there.

---

## Color

No new hue, no new text color. 60/30/10 is unchanged [P2]: dominant `#ffffff`, secondary `#f7f8f7`, accent `#0a7a3d`. Destructive: none (no destructive action in this phase).

One derived value is added, justified:

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Menu overlay | `--color-overlay` | `rgb(17 24 39 / 0.32)` | Only the dim layer behind the open hamburger panel. It is `--color-ink` (`#111827`) at 32% alpha, the same ink family that the shadow tokens already use. It is never behind text that must be measured against it: the panel and header sit above it in white, and the dimmed page content is inert while it is open. No contrast measurement is required. [DISCRETION: "살짝 어두운" per D-08] |

Accent reserved for (unchanged from Phase 2, restated with the Phase 3 states):
1. Eyebrow numbers
2. Inline links and the `사이트 보기` / `관련 기사 보기` / `기획전 보기` links, and the `tel:` and `mailto:` links in the PDF contact section (underlined)
3. Contribution `<data>` chip
4. The keyword text in the keyword section, active or not (all three are accent in the static state; in the switch state only the visible one is seen)
5. Focus-visible ring (2px solid accent, offset 2px) on every focusable element, including the hamburger button, panel links, keyword rows and the skip link
6. Current-section indicator in the header nav (`aria-current="true"`: accent text plus underline) and the hamburger focus state

Nothing else is accent. The open-state hamburger X is ink, not accent.

---

## Motion Contract (DSGN-03, DSGN-05)

### Tokens (added to `@layer tokens` in `css/tokens.css`) [DISCRETION]

| Token | Value | Used by |
|-------|-------|---------|
| `--ease` | `cubic-bezier(0.2, 0, 0, 1)` (existing) | Every Phase 3 transition and animation. No second easing |
| `--dur` | `200ms` (existing) | Hamburger morph, panel open and close, overlay fade, hover |
| `--dur-header` | `250ms` | Header hide and show |
| `--dur-switch` | `500ms` | Keyword switch (keyword and list) |
| `--dur-enter` | `600ms` | Cover line entrance |
| `--stagger-enter` | `150ms` | Delay between cover lines |
| `--stagger-switch` | `80ms` | Delay of the project list behind the keyword |
| `--color-overlay` | `rgb(17 24 39 / 0.32)` | Menu overlay |

Allowed range stays 150 to 600ms for UI motion. Nothing loops. No spring, no bounce, no second easing curve.

Animated properties: Phase 3 motion animates only `transform` and `opacity`. (Discrete `visibility` toggles with a delay are used only so closed elements leave the Tab order; `visibility` is never interpolated visually.) The Phase 2 hover transitions (`box-shadow` on cards, `background-color` on keyword rows, `background-size` on career links) stay as they are and remain hover-only; Phase 3 adds no new non-transform/opacity animation.

Allowed moments (design-taste "dealt moment" count): the keyword scroll switch is the one dealt moment. The cover entrance is the once-on-load hero entrance. Header hide/show and the hamburger are functional motion. Nothing else moves except hover. No scroll fade-in on sections, no parallax, no carousel, no scroll hijack, no progress indicator.

### 1. Cover entrance [CONTEXT D-06, D-07]

Pure CSS keyframes with `animation-fill-mode: both`, so the end state is reached even if `main.js` fails. Active only under `@media screen and (prefers-reduced-motion: no-preference)` and `html.js`. In every other state the cover is simply visible with no rule applied.

Markup change [DISCRETION, no new text]: replace the `<br>` line breaks in the `h1` with three block-level spans so each line can be animated:
`<h1 id="cover-title" lang="en"><span class="cover-line">Publishing,</span> <span class="cover-line">beyond the</span> <span class="cover-line">expected.</span></h1>`
`.cover-line { display: block }`. The text content (whitespace-normalized) stays identical to today, so `check-content` is unaffected. The h1 stays the only h1.

Keyframe `cover-rise`: `from { opacity: 0; transform: translateY(var(--space-lg)) }` to `to { opacity: 1; transform: none }`.

| Element | Delay | Duration | Distance | Notes |
|---------|-------|----------|----------|-------|
| `.cover-sub` (Selected work / Career 2026) | none | none | none | Visible from the first frame. It is a small label and anchors the layout [DISCRETION] |
| Line 1 `Publishing,` | 0ms | `--dur-enter` 600ms | 24px up | |
| Line 2 `beyond the` | 150ms (`--stagger-enter`) | 600ms | 24px up | |
| Line 3 `expected.` | 300ms | 600ms | 24px up | Lines finish at 900ms, about 1s total [CONTEXT D-06] |
| `.cover-intro` | 450ms | 500ms (`--dur-switch`) | 16px up (`--space-md`) | Same keyframe language with a smaller distance |
| `.cover-mail` | 600ms | 500ms | 16px up | Finishes at 1.1s. It stays focusable and clickable during the animation (it is not `inert`, not `visibility: hidden`) |

Delays are set with a `--i` index custom property (`animation-delay: calc(var(--i) * var(--stagger-enter))`) on the three lines. The animation runs once and does not repeat on resize or bfcache restore.

### 2. Header hide and show [CONTEXT D-11, 02 D-15]

- Element: `.site-header` (fixed). State attribute `data-hidden="true"` set by `main.js`; the existing inert rule `translateY(-100%)` becomes active. Transition: `transform var(--dur-header) var(--ease)`, both directions (same curve and duration, so show is not abrupt).
- Scroll listener: passive, throttled with `requestAnimationFrame`, reads `window.scrollY` once per frame.
- Hide: when scrolling down, `scrollY > 80` and the cumulative downward travel since the last direction change is at least 8px.
- Show: when scrolling up and the cumulative upward travel since the last direction change is at least 8px, or `scrollY <= 80`.
- Ignore overscroll values (`scrollY < 0` or beyond the document end) so iOS rubber-banding does not flicker the header.
- The header never hides while any of these is true: the hamburger panel is open, focus is inside the header, `prefers-reduced-motion: reduce`, `html:not(.js)`.
- CSS safety net (works without JS state changes): `.site-header[data-hidden="true"]:not(:focus-within) { transform: translateY(-100%); }`. So `:focus-within` always reveals the header even if the JS listener has not fired yet. Additionally `main.js` listens to `focusin` on the header and removes `data-hidden` immediately [CONTEXT D-11].
- Anchor jumps: `scroll-margin-top` and `scroll-padding-top` stay 80px [P2]. When the header is hidden the gap above a jump target is intentional.
- Current section indicator [P2 item 6, DISCRETION]: an `IntersectionObserver` with `rootMargin: "-40% 0px -55% 0px"` sets `aria-current="true"` on exactly one nav link at a time (`#keywords`, `#skills`, `#career`, `#contact`); the four company sections map to the Career link; the cover maps to none. The existing CSS (accent text, underline scaleX) renders it. In the keyword switch state the whole tall track counts as Keywords.

### 3. Hamburger and panel (below 900px) [CONTEXT D-08 to D-11]

State attributes:

| Attribute | Element | Values |
|-----------|---------|--------|
| `aria-expanded` | `.nav-toggle` | `"false"` (default) / `"true"` |
| `data-open` | `.site-nav` | absent / `"true"` (existing hook) |
| `data-open` | `.nav-overlay` | absent / `"true"` |

The accessible name stays `메뉴` for both states (it comes from the visually hidden span). `aria-expanded` carries open/closed, so no separate "close" label exists and none is added.

Markup changes [DISCRETION, no new text]:
- Inside `.nav-toggle`, after the visually hidden label, add `<span class="nav-bars" aria-hidden="true"></span>`. The span is the middle bar; its `::before` and `::after` are the top and bottom bars. This replaces the Phase 2 `box-shadow` trick because the middle bar must be an element of its own to fade out. The `.nav-toggle::before/::after` bars from Phase 2 are removed.
- `main.js` appends `<div class="nav-overlay" aria-hidden="true"></div>` to `body` (created by JS so the no-JS markup is unchanged). It is not focusable.

Icon morph (three lines to X) [CONTEXT D-09]:
- Closed: bars at y = -7px, 0, +7px around the center of the 44x44 button; each 22px by 2px, `background: currentcolor`, `transform-origin: center`.
- Open: the center bar `opacity: 0` and `transform: scaleX(0)`; the top bar `transform: translateY(7px) rotate(45deg)`; the bottom bar `transform: translateY(-7px) rotate(-45deg)`.
- Transition: `transform var(--dur) var(--ease), opacity var(--dur) var(--ease)` on all three bars.
- Button hit area stays 44x44, radius `--radius-sm`, transparent. Focus ring per Phase 2. `[aria-expanded="true"]` has no fill change (ink only).

Panel (`.site-nav`) [CONTEXT D-08]:
- Position: `position: absolute; inset-inline: 0; inset-block-start: 100%` inside the fixed `.site-header`, so it opens directly under the 64px bar and moves with the header. White background, 1px `--color-line` top edge, `--shadow-header` bottom edge, padding `--space-md` block and `--gutter` inline. Links stack in one column, each 48px tall, Body 16px/400, ink-2; the current-section style still applies.
- Closed: `opacity: 0; transform: translateY(calc(-1 * var(--space-sm))); visibility: hidden; pointer-events: none;`. The `visibility` flip is delayed by `--dur` on close (`transition: visibility 0s linear var(--dur)`), so the links leave the Tab order only after the fade.
- Open: `opacity: 1; transform: none; visibility: visible;` with `transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease)`.
- This replaces the Phase 2 `display: none` / `display: block` pair under `html.js` in `css/components.css`, because `display` cannot transition. The no-JS state is untouched: `html:not(.js)` keeps the always-visible one-row nav and `.nav-toggle { display: none }`.
- The panel exists only below 900px. At >= 900px the inline nav is used and `.nav-toggle`, `.nav-overlay` are `display: none`.

Overlay (`.nav-overlay`) [CONTEXT D-08, D-10]:
- `position: fixed; inset: 0; z-index: 40;` (below the header at 50, above page content). Background `--color-overlay`. Closed: `opacity: 0; visibility: hidden; pointer-events: none`. Open: `opacity: 1`, `visibility: visible`, `pointer-events: auto`, transition `opacity var(--dur) var(--ease)`.
- A click or tap on the overlay closes the panel. Focus returns to the toggle only if focus was inside the header; otherwise focus stays where it is.
- Page scroll is not locked (no layout shift from a scrollbar change). The panel and overlay stay while the user scrolls; scrolling does not close the panel.

Keyboard and focus [CONTEXT D-10, D-11]:
- The panel is a disclosure, not a modal: no focus trap, no `aria-modal`, no `role="dialog"`.
- Opening with Enter or Space moves no focus; focus stays on the button. Tab then enters the first panel link (Keywords).
- Tab order while open: skip link, `.nav-toggle`, Keywords, Skills, Career, Contact, then on into `main` (`.cover-mail a` and the rest).
- Shift+Tab from Keywords returns to the toggle.
- `Esc` while open: close the panel, set `aria-expanded="false"`, move focus to `.nav-toggle`.
- Choosing a panel link: close the panel (focus is not moved to the toggle) and let the browser perform the anchor jump.
- Tabbing out of the header while the panel is open (focus lands outside `.site-header`) closes the panel without moving focus, so a closed panel never leaves its hidden links as focus stops. [DISCRETION]
- Crossing to >= 900px (`matchMedia` change) closes the panel and resets `aria-expanded` to `"false"`.
- The header does not hide while the panel is open [CONTEXT D-11].

### 4. Keyword scroll switch (the dealt moment) [CONTEXT D-01 to D-05]

Applies only when `main.js` sets `data-switch="on"` on `.keywords`. `main.js` sets it only if `matchMedia("(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)").matches`, and re-evaluates on its `change` events (turning the attribute off restores the static state). All switch CSS is wrapped in `@media screen and (min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)` and selected by `.keywords[data-switch="on"]`, so a build that fails to run JS, and every print render, never see it.

Markup change [DISCRETION, no new text]: wrap the eyebrow, the hidden h2 and the three `.keyword-block` elements in `<div class="keywords-stage">`. In the static state this wrapper has no visual effect (`display: block`).

Geometry (switch state):
- Track: `.keywords[data-switch="on"]` has `block-size: calc(100svh + 3 * 50svh)` and `padding-block: 0`. The pin distance is 150svh, about 1.5 screens in total for three keywords [CONTEXT D-04], 0.5 screen per keyword. The Phase 2 surface panel (`::before`, radius-lg) stays on the track.
- Stage: `.keywords-stage { position: sticky; inset-block-start: 0; block-size: 100svh; display: grid; grid-template-rows: auto 1fr; }`. The eyebrow sits in row 1; all three blocks occupy row 2, column 1 (`grid-area: 2 / 1`) and overlap, centered vertically (`align-content: center`).
- Each block keeps its Phase 2 desktop two-column layout (`9fr / 11fr`), with `padding-block: 0` and no top divider. The stage must not set `overflow: hidden` or `overflow: clip`, and no ancestor up to `body` may set `overflow` other than `visible`, or `position: sticky` breaks and focus rings get clipped.
- Header interaction: when the header is shown it overlays the top of the stage in white. The keyword content is vertically centered and is never under the 72px bar.

State machine (per block, attribute `data-state`):

| `data-state` | Meaning | Style |
|--------------|---------|-------|
| `next` | Not reached yet | `opacity: 0; transform: translateY(var(--space-xl))` (waiting below) |
| `active` | Current | `opacity: 1; transform: none; pointer-events: auto` |
| `past` | Already left | `opacity: 0; transform: translateY(calc(-1 * var(--space-xl)))` (left upward) |

- Transition on every block: `opacity var(--dur-switch) var(--ease), transform var(--dur-switch) var(--ease)`. The `.keyword-list` has the same transition with `transition-delay: var(--stagger-switch)` on entering (`active`), 0 on leaving, so the list follows the keyword by 80ms in the same direction [CONTEXT D-01].
- Going forward: the old keyword leaves upward, the new one rises from below. Scrolling back reverses naturally (the active block falls to `next`, the previous one returns from `past`).
- `will-change: transform, opacity` only on `.keyword-block` while `data-switch="on"`.
- Non-active blocks keep `pointer-events: none` but are NOT `display: none`, `visibility: hidden`, `inert` or `aria-hidden`. They stay in the accessibility tree and the Tab order [CONTEXT D-03].

Which block is active (JS) [CONTEXT D-05]:
- `main.js` measures once per rAF-throttled passive scroll event (only while the track intersects the viewport, gated by an `IntersectionObserver` on `.keywords`): `p = -track.getBoundingClientRect().top`, `slot = (track.offsetHeight - stage.offsetHeight) / 3`, `index = clamp(floor(p / slot), 0, 2)`. Before the pin begins `index = 0`; after release `index = 2`. It writes `data-state` on the three blocks and `data-active` on `.keywords` only when `index` changes. No scroll-linked per-frame style writes, no `animation-timeline`.
- Set the initial states first, then `data-switch="on"`, in the same task, so the first paint has no transition.

Keyboard rule [CONTEXT D-03]:
- On `focusin` inside any `.keyword-block`, `main.js` makes that block active and, if its index differs from the scroll-derived index, scrolls the window with `window.scrollTo({ top: trackTop + (index + 0.5) * slot, behavior: "instant" })` so the next scroll event keeps the same block (it does not flip back). Tab and Shift+Tab through all nine keyword links therefore walk the three keywords in order.
- Tab order inside the section is DOM order: 3 links in block 1, 3 in block 2, 3 in block 3 (`#kn-fsd` and `#kn-universe` and `#gi-oneday` appear twice by design).
- Tab out of block 3 goes to the first Skills-section focus stop and scrolls normally.

No progress indicator, no dots, no numbers, no click tabs, no arrows [CONTEXT D-02, D-03].

### 5. Smooth scroll [DISCRETION, CONTEXT leaves it open]

Used: `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }`. It is off for `prefers-reduced-motion: reduce` and for print. The focus-driven keyword correction above uses `behavior: "instant"` explicitly.

---

## Fallback States (all content visible)

| State | How it is reached | Cover | Header | Menu | Keywords |
|-------|-------------------|-------|--------|------|----------|
| No JS | `html` has no `js` class (inline script or `main.js` did not run) | Static, fully visible, no hidden-by-default state anywhere | Fixed, always visible, never hides | Phase 2 no-JS: one-row nav under the bar (`--header-h: 112px` below 900px), no toggle | Three blocks expanded, two columns at >= 640px |
| `prefers-reduced-motion: reduce` | Media query | Static, `animation: none`, no `opacity: 0` | Always visible, no hide, no transition | Panel opens and closes instantly (transitions 0.01ms from the existing global rule), icon swaps without animation, `aria-expanded` and Esc work the same | All three expanded; `data-switch` is not set. Smooth scroll off. Card lift off (P2) |
| Mobile and tablet | `< 1024px` (or height < 560px) | Entrance runs (it is not width-gated) | Hides on scroll down, shows on scroll up | Hamburger below 900px, inline nav at 900 to 1023px | Three blocks expanded (P2 stacked or two-column), no pin, no track |
| Print and PDF | `@media print` | `animation: none !important`, fully visible | `display: none` | `display: none` (header, toggle, panel, overlay, skip link) | Three blocks expanded, no stage, no sticky, no track |

Rules that guarantee this:
- `opacity: 0` and any offset transform appear ONLY inside the cover keyframes (applied under `html.js` + `screen` + `no-preference`) and inside `.keywords[data-switch="on"]` (applied under the desktop + `no-preference` + `screen` query). There is no other initial hidden state.
- `@media (prefers-reduced-motion: reduce)` keeps the Phase 2 global rule (`*, *::before, *::after { transition-duration: 0.01ms !important; animation: none !important; }`) as a second layer on top of the gating above.
- `@layer print` keeps `*, *::before, *::after { animation: none !important; transition: none !important; transform: none !important; }` and adds `.keyword-block, .cover-line, .cover-intro, .cover-mail { opacity: 1 !important; visibility: visible !important; }` [DISCRETION, defense in depth].
- The PDF builder additionally calls `page.emulateMediaType('print')` before navigation and `emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])`, and removes `data-switch` and `data-hidden` after load as a last resort.

---

## Keyboard and Focus Contract (QUAL-02)

| Rule | Contract |
|------|----------|
| Skip link | First focusable element. `본문 바로가기` (existing copy) targets `#main`. `<main id="main" tabindex="-1">` so focus really moves in Safari and Chrome. `main:focus { outline: none; }` is the one allowed exception to "never remove outline": `main` is a non-interactive, programmatic-only target (`tabindex="-1"` is not in the Tab order), so a page-sized ring would be noise; focus then continues to the first real control. The skip link shows at top-left above the fixed header (z-index 100, accent fill, white text 5.43:1) [P2] |
| Focus ring | `outline: 2px solid var(--color-accent); outline-offset: 2px` on every `:focus-visible` target [P2]. No `outline: none` elsewhere. 5.43:1 on white, 5.10:1 on surface. The hamburger, panel links, keyword rows (inside the surface panel), cards, career links, mail and `tel:` links all inherit it |
| Ring is never clipped | No `overflow: hidden` ancestor around keyword rows or the toggle; the nav panel does not clip its links; `.shot` keeps its own overflow only for the image |
| Ring is never hidden under the header | `scroll-padding-top: 80px` [P2]; plus `:focus-within` reveals a hidden header |
| Tab order (DOM order, no positive `tabindex`) | skip link, hamburger (below 900px) or the four inline nav links (>= 900px), cover email, 9 keyword links, 4 career links, project links in page order (`사이트 보기` etc.), contact email |
| Header reveal | `focusin` on any header element removes `data-hidden`; CSS `:focus-within` also reveals it [CONTEXT D-11] |
| Hidden keyword blocks | Reachable by Tab; focus makes that keyword active (see Motion 4) [CONTEXT D-03] |
| Esc | Closes the open hamburger panel and returns focus to the toggle. No other Esc behavior in this phase |
| Hover parity | Everything that has a hover style also has the same style on `:focus-visible` (nav underline, keyword row fill and arrow shift, card lift via `:focus-within`) [P2] |
| Targets | 44px minimum for header links, toggle, `.links a`, `.cover-mail a`, career links; 48px for panel rows and keyword rows [P2] |
| Forced colors / zoom | The 3-bar icon uses `currentcolor`; text reflows at 200% zoom without horizontal scroll (inherits the P2 guards) |

---

## Print and PDF Page Contract (PDF-01 to PDF-04) [DISCRETION, per CONTEXT]

Source of truth is the same `index.html` plus `css/print.css`. Everything below is expressed in `@layer print` inside `@media print` unless noted. Phase 2 values stay: `@page { size: A4 portrait; margin: 14mm 12mm 16mm; }`, Pretendard Print TTF, the 4 roles in pt, `print-color-adjust: exact`, 2 cards per row, `.project { break-inside: avoid; box-shadow: none }`, headings `break-after: avoid`, hidden header/toggle/skip link/nav, arrow glyphs hidden.

### Page plan

| Page | Content | Forced breaks |
|------|---------|---------------|
| 1 | Cover (`.cover`, compact, about 40% of the page) followed by the keyword section with the three blocks expanded and two columns | none (starts the document) |
| 2 | Skills and Career together | `#skills { break-before: page; }`; `#career` follows without a forced break |
| 3 onward | Company sections in page order: `#gi-data`, `#kn-curation`, `#bistones`, `#abbey-road`, 2 cards per row | `#gi-data { break-before: page; }`. Later companies flow on after the previous one, with no forced break |
| Last | Contact (`#contact`), then the footer on the same page | none |

Order requirement (PDF-03): cover, then skills and career, then companies, then contact. The keyword section is part of the cover spread (page 1) as the user's own cover-next section; it is not a fifth part.

Why flow instead of one forced break per company [DISCRETION]: with empty screenshot frames hidden, `#bistones` (2 cards) and `#abbey-road` (1 card) are each far shorter than a page, and one page per company would produce mostly empty pages, which conflicts with "no blank page". If Phase 4 screenshots make every company close to a page, a forced `break-before: page` on each `.company` can be added by changing one rule; no markup change is needed.

Required rules:
- Cover compaction: `.cover { min-block-size: 0; padding-block: 10mm; gap: 4mm; }` (Phase 2 used 12mm; reduce so page 1 holds the cover and all keywords). `.keyword-block { padding-block: 4mm; }`. If a measured render still pushes the third keyword block to page 2, the executor reduces these paddings before allowing a page 1 split. Blocks never split (`break-inside: avoid`).
- No orphan heading: `.company > .eyebrow, .company > h2, .company > .period, .company > .company-desc { break-after: avoid; }` and `.company > .project-grid { break-before: avoid; }`; `section h2 + *` never starts alone at a page bottom.
- Card integrity: `.project { break-inside: avoid; }` [P2]. Cards never split across pages.
- No blank page and no footer-only page: `#contact { break-inside: avoid; break-after: avoid; margin-block: 8mm 0; padding-block: 8mm; }`, `body > footer { break-before: avoid; padding-block: 6mm 0; }`, and the document ends with no trailing margin or empty block. Acceptance: every page extracts more than 80 characters, and no page's text equals the footer line alone (the Phase 2 spike found the 9th page with 37 characters).
- Empty screenshot frames: `.shot:not(:has(picture, img)) { display: none; }` in print only. After Phase 4 inserts a `<picture>`, the frame appears automatically with the Phase 2 aspect ratios and `object-fit: cover; object-position: top`. The app frame's `::before` stage disappears with the frame.
- Cards without a screenshot keep Phase 2 content order (title, meta, status/links). No placeholder text is added.
- Keyword blocks: expanded, `grid-template-columns: 2fr 3fr`, 1px line between blocks, white ground (panel `::before` hidden) [P2].
- Skills in print: 3 columns, `gap: 4mm`, tiles keep the surface tint (`print-color-adjust: exact`) so the 5 groups remain readable; if they do not fit page 2 with the career list, the tiles fall back to a white ground with a 1px line border (executor choice, measure first).
- Links: every `<a href>` stays a link annotation (external, `mailto:`, `tel:`, internal anchors). Accent color and underline are kept [P2].
- Header/footer: none printed by the browser (`displayHeaderFooter: false`); no path or URL may appear in the page margins (PDF-04). The page's own `<footer>` content (`© Publisher Youyoonhee ALL RIGHTS RESERVED`) stays as the last line of the last page.
- Lazy images: the builder removes `loading="lazy"` from all images and waits for `img.decode()` before printing [02-PDF-SPIKE recommendation].

### Phone line (PDF-02, CONTEXT D-13 to D-15)

- Slot: the existing `<div class="contact-phone" data-slot="phone" hidden></div>`, placed after `dl.contact-list` inside `#contact`. The public HTML keeps it empty and `hidden`, with no `tel:` and no digits.
- Injection: `tools/build-pdf.mjs` fills it inside the page (via `page.evaluate`) with `private/contact.json` values and removes `hidden`. Injected structure mirrors the Email row (`dt` above `dd` rhythm): an optional label span, then one `<a href="tel:…">` containing the display text. The `tel:` href uses the dial-ready form derived by the builder; the display text copies the contact-line format of the source PDF exactly as stored in `private/contact.json` (display string and optional label string). Neither the label text nor the number is written in this spec, in committed files, in logs or in chat. Wherever this spec needs to name it, it is written "(전화번호)".
- Styling (print, injected state): label = Label role (8.5pt/600, `--color-ink-3`) like `.contact-list dt`; link = Body role (10.5pt/400), accent color, underlined (accent rule 2); `margin-block-start: 2mm`; `overflow-wrap: anywhere`. Printed as live text, not an image, so it can be copied and clicked.
- If `private/contact.json` is missing the build fails (exit non-zero), before writing any PDF [PDF-02]. The build log may only say `phone injected: yes`.
- Web behavior: unchanged. The slot stays `hidden` and empty, so the web has no phone, no `tel:`.
- Allowlist note: the label (if any) comes from the private file and is never committed, so it does not need a manifest `uiAllowlist` entry; the committed `contact.example.json` holds descriptive placeholder strings only.

### Build behaviors the visual contract depends on (for `tools/build-pdf.mjs`)

Emulate print media before navigation; serve via the existing 127.0.0.1 static server; wait for fonts (`waitForFonts`) and all images; set `preferCSSPageSize: true`, `printBackground: true`, `tagged: true`, `outline: true`; `displayHeaderFooter: false`; output `dist/퍼블리셔 유윤희-포트폴리오.pdf` (the filename is not visible copy). Then run `tools/pdf-report.mjs` in the "phone must be present, digits never printed" mode [CONTEXT D-12, code_context].

---

## Responsive Verification Matrix (Phase 3 additions)

| Width x height | Must verify |
|----------------|-------------|
| 375 x 812 | Hamburger opens a panel under the 64px bar; overlay dims content; icon becomes X; `aria-expanded` flips; Esc closes and focuses the toggle; overlay click closes; a panel link closes the panel and jumps; header hides on scroll down and shows on scroll up; keyword blocks are all visible with no pin; cover lines rise in order |
| 768 x 1024 | Same as above (hamburger below 900px); keywords static two-column |
| 1023 x 768 | Inline nav; keywords static (no track); header hide still works |
| 1024 x 768 and 1440 x 900 | `.keywords[data-switch="on"]`; track height about 250svh; the active keyword changes at about 0.5 screen intervals; forward scroll leaves upward, new one rises from below; project list follows; no progress indicator; Tab into block 2 and 3 links makes that keyword visible; no horizontal scroll; left and right content edges equal |
| 1440 x 500 | Height under 560px: static state (no pin) |
| any, reduced motion | No cover animation, no header hide, no switch, all content visible |
| any, JS disabled | All content visible, nav usable, no `opacity: 0` computed style on any element |
| print (A4) | The page plan above; zero blank pages; no footer-only page; no clipped card; phone present only in the PDF |

---

## Copywriting Contract

No new visible copy is authored in this phase. There is no CTA, form, empty state, error state or destructive action.

| Element | Copy |
|---------|------|
| Primary CTA | none. Existing links keep their labels (`사이트 보기`, `관련 기사 보기`, `기획전 보기`, the email address) |
| Empty state | not applicable. Hidden screenshot frames in print carry no text |
| Error state | not applicable for the web. Build failure messages are developer console output, not page copy |
| Destructive confirmation | not applicable |
| Hamburger accessible name | `메뉴` (existing, visually hidden). Same in open and closed state; `aria-expanded` conveys the state |
| Close label | none needed. Chosen deliberately to avoid new copy; if a reviewer later insists, the minimal candidate is `닫기` and it would need a `uiAllowlist` entry, but it is NOT part of this contract |
| Overlay | `aria-hidden="true"`, no text, not focusable |
| PDF filename | `퍼블리셔 유윤희-포트폴리오.pdf` (output file name, not visible copy) |
| Phone line | `(전화번호)` stands for the private value; label and display text live in `private/contact.json` only |

New markup that carries no text and needs no allowlist entry: `.cover-line` spans, `.keywords-stage` wrapper, `.nav-bars` span, JS-created `.nav-overlay`.
`uiAllowlist` additions: none.

---

## Design-Taste Waivers (Phase 3 delta)

| ID | Rule | Disposition |
|----|------|-------------|
| W-4 (revisit) | Rule 5: hero enters once on load; one dealt moment per page | Complied with: cover entrance is the hero entrance, keyword switch is the single dealt moment. W-4 from Phase 2 is closed |
| W-11 | Scroll-linked motion only as a dealt moment, and scroll hijacking is forbidden | Complied: the keyword switch uses native scroll with a sticky stage and a state class. Scrolling speed and position are never altered. The one programmatic scroll is the instant correction when keyboard focus enters a hidden keyword |
| W-12 | No carousel, no tabs | Complied: no click tabs, no dots, no counter |
| W-13 | Rule 8 mobile full-screen menu | Still waived as in W-8: the panel is a full-width drop panel under the header |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (not applicable, not a React project) | not applicable |
| Third-party registries | none | not applicable. No third-party library, CDN or runtime dependency is added. Puppeteer 25 is a local dev dependency for the PDF build only and is not loaded by the site |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-11-11 (gsd-ui-checker, first pass; Dimension 5 flags addressed or accepted as icon geometry)
