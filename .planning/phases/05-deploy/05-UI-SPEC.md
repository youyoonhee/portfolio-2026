---
phase: 5
slug: deploy
status: approved
reviewed_at: 2026-11-16
shadcn_initialized: false
preset: none
created: 2026-11-16
---

# Phase 5 - UI Design Contract

> Phase 5: 검증과 배포. Covers the visual parts of QUAL-06 (Colophon), DEPL-03 (link preview, favicon) and the 404 page.
> This extends the approved Phase 2, 3 and 4 systems (`02-UI-SPEC.md`, `03-UI-SPEC.md`, `04-UI-SPEC.md`). Everything not restated here is inherited unchanged. No redesign.
> Source tags: [CONTEXT D-xx] = locked decision (05-CONTEXT.md). [P2]/[P3]/[P4] = inherited. [DISCRETION] = Claude's call within the CONTEXT discretion scope. [CODE] = read from the current css/html.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (plain HTML/CSS/JS, no build) [P2] |
| Preset | not applicable |
| Component library | none |
| Icon library | none. The favicon glyph is hand-drawn SVG strokes. No icon font, no emoji |
| Font | Pretendard 1.3.9 self-hosted [P2]. The 404 page and OG card are special cases (see their sections) |
| CSS layers | Unchanged: `reset, tokens, base, layout, components, utilities, print`. Colophon CSS goes in `layout` (placement) and `components` (dl), print rule in `print`. No new CSS file |
| JS | No new JS. `js/main.js` is not changed except the scroll-spy guard noted in Colophon |

Inherited tokens (not redefined): spacing 4/8/16/24/32/48/64, 4 font sizes (16, 14, heading clamp, display clamp), 2 weights (400, 600), all colors, radii 8/16/24, `--ease`, `--dur`.

---

## Spacing Scale

Inherited, all multiples of 4. No new token.

| Token | Value | Phase 5 usage |
|-------|-------|---------------|
| xs | 4px | Gap between a Colophon label and its value when stacked (below 480px) |
| sm | 8px | Gap between list items inside a Colophon value; dl row gap |
| md | 16px | 404 text stack gap; footer link gap |
| lg | 24px | 404 heading to body gap |
| xl | 32px | Colophon dl margin-top |
| 2xl | 48px | Colophon section padding-block (below 1024px); 404 page padding-block |
| 3xl | 64px | Colophon section padding-block (>= 1024px) |

Exceptions (dimensions, not spacing tokens):
- Colophon label column is `120px` (the P2 `.meta` column is 88px, too narrow for `반응형 구간`). Multiple of 4.
- Footer link and 404 link hit area: 44px minimum [P2].
- OG card and favicon use their own pixel grids (below). They are images, not page spacing.

---

## Typography

No new size, no new weight. Exactly 4 sizes and 2 weights on the page [P2]:

| Role | Size | Weight | Line Height | Phase 5 usage |
|------|------|--------|-------------|---------------|
| Body | 16px | 400 | 1.5 | Colophon values, 404 body text, 404 link (600) |
| Label | 14px | 600 | 1.4 | Colophon dt labels, 404 eyebrow, footer link (400) |
| Heading | clamp(24px, 2.4vw + 16px, 36px) | 600 | 1.25 | Colophon h2 `Colophon.`, 404 h1 |
| Display | clamp(48px, 6vw + 8px, 96px) | 600 | 1.05 | not used in Phase 5 |

The OG card is a raster image with its own sizes (32 / 48 / 160 px, weights 400/600). It is not page typography and is documented in its own section.

---

## Color

60/30/10 unchanged [P2]: dominant `#ffffff` (`--color-bg`), secondary `#f7f8f7` (`--color-surface`), accent `#0a7a3d` (`--color-accent`). Destructive: none.

Phase 5 adds no color token. Accent is reserved for (the P4 list plus these):
1-7: as before (eyebrow numbers, inline links, contribution chip, keyword text, focus ring, current-section nav, thumbnail ring).
8. Colophon measured-score chips (`data` elements, same accent-tint chip as the contribution chip [CODE `.meta data`]).
9. 404 return link.
10. Favicon ground (`#0a7a3d`) and the OG card wordmark `PORTFOLIO.`.

Not accent: Colophon labels (`--color-ink-3`), values (`--color-ink-2`), the pre-measurement text `측정 전` (`--color-ink-3`).

---

## 1. Colophon (QUAL-06) [CONTEXT discretion]

### Placement and nav decision

- Markup: a new `<section id="colophon" aria-labelledby="colophon-title">` inside `<main>`, after `#contact` and before `</main>`, so it sits between `#contact` and `<footer>` [CONTEXT].
- Nav decision: **footer link, not a nav item** [DISCRETION]. Reasons from the actual markup: `.site-nav` holds exactly four top-level content anchors (Keywords, Skills, Career, Contact); the no-JS mobile row is a single fixed-height row (`--header-h: 112px`) that already scrolls sideways; and the Colophon is site metadata, not content a recruiter navigates to. Adding a fifth item would grow the bar for a low-value target.
- Footer markup (inside the existing `<footer>`, after the copyright `<p>`): `<p><a href="#colophon">사이트 정보</a></p>`. The Colophon intro line starts with `사이트 정보:` (or the section carries `aria-describedby` to it) so the link text and the `Colophon.` heading are clearly the same place. Style: Label size, weight 400, `--color-ink-3` text, underline on hover/focus only is NOT used; keep a visible underline (text-decoration: underline) so it reads as a link. `display: inline-flex; align-items: center; min-block-size: 44px`. Focus ring is the global accent `:focus-visible` [P2]. The footer link is hidden in print.
- Scroll-spy guard [CODE main.js:116-134]: the observer watches every `main > section[id]` and looks up a nav link by id. `#colophon` has no nav link, so the executor must confirm the callback tolerates a missing link and clears `aria-current` (no exception, no stuck "Contact" highlight is acceptable but a thrown error is not). If it throws, add a one-line `links.get(key)` null guard.

### Layout

- Section wrap and rhythm: inherits `main > section` width and the `main > section:not(.cover, .keywords, .company, #contact)` padding rule (48px, 64px at >= 1024px) [CODE layout.css]. Add `#colophon` to nothing else. Ground is the page white; **no surface panel** (the Contact panel is the last emphasized block, the Colophon stays quiet), and a `border-block-start: 1px solid var(--color-line)` separates it, like `.company`.
- Order inside: `p.eyebrow` (`09 / Colophon`, with `.eyebrow-num` accent number, `lang="en"`), `h2#colophon-title` (`Colophon.`, `lang="en"`, `margin-block-start: var(--space-sm)`), one intro `p` (Body, `--color-ink-2`, `margin-block-start: var(--space-md)`), then `dl.colophon-list` (`margin-block-start: var(--space-xl)`).
- `dl.colophon-list`: `display: grid; gap: var(--space-sm); margin: 0`. Each row is `div` with `display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-sm)`; below 480px the row is one column with `gap: var(--space-xs)`. Row separators: `padding-block: var(--space-md)` and `border-block-end: 1px solid var(--color-line)` per row (same hairline as the career rows). `dt`: Label 14/600 `--color-ink-3` (copy of `.meta dt`). `dd`: `margin: 0`, Body, `--color-ink-2`, `overflow-wrap: anywhere`. At >= 1024px the dl is capped at `max-inline-size: 48rem` so lines stay readable; it does not span 1200px.
- Multi-value rows use `ul` inside `dd` with the same reset as `.skills ul` (`list-style: none; margin: 0; padding: 0`), items stacked with `gap: var(--space-xs)`.
- Score chips: `<data value="98">98</data>` styled by the existing `.meta data` rule. Move that rule to a shared selector (`.meta data, .colophon-list data`) rather than copying it. Numbers use `font-variant-numeric: tabular-nums`.
- No motion, no hover effect on the section. Nothing animates. Only the footer link and any link in the section use the global focus ring.

### Rows (fixed order, all `dt` in Korean)

| dt | dd content | Source of the value |
|----|-----------|--------------------|
| 구성 | `직접 작성한 HTML · CSS · JavaScript, 빌드 도구 없음` | Static fact [CONTEXT: stack] |
| 반응형 구간 | `640px · 900px · 1024px` plus a second line `카드 열 수는 섹션 너비 기준 (600px · 920px)` | Static, must equal the `@media` and `@container` values in the CSS. `check-content` compares them to the stylesheet (see below) |
| 접근성 목표 | `WCAG 2.2 AA 수준을 목표로 점검` | Static target. The word is `목표`, never a claim of conformance |
| 확인한 브라우저 | `ul` of items `{브라우저} {버전} · 확인함` or `{브라우저} · 실기기 확인 전` | Measurement record only |
| Lighthouse | four chips `Performance`, `Accessibility`, `Best Practices`, `SEO` each followed by a `data` score, then a note `측정 환경: {mobile|desktop}` | Measurement record only |
| 검증 | `HTML 검증 오류 {n}건 · 깨진 링크 {n}건` (html-validate and the deployed-URL linkinator run) | Measurement record only |
| 측정일 | `<time datetime="YYYY-MM-DD">YYYY.MM.DD</time>` | Measurement record only |

Intro paragraph (static): `이 사이트를 만든 방식과 직접 측정한 결과입니다.`

### Data flow and the empty (pre-measurement) state [CONTEXT: never typed by hand, never fake]

- Measurement record: `tools/measurements.json` (new, committed). Keys: `measuredAt` (YYYY-MM-DD or `null`), `lighthouse` (`{ form: "mobile"|"desktop", performance, accessibility, bestPractices, seo }`, each integer or `null`), `validator` (`{ htmlErrors, brokenLinks }`, integer or `null`), `browsers` (array of `{ name, version, tested: true|false, method: "headless"|"real-device" }`).
- A small repo tool (`tools/colophon-sync.mjs`, wired as an npm script) rewrites the measured `dd` values in `index.html` from this file. `check-content` fails if the HTML differs from the record or if any number appears that is not in the record. Nobody types a score into the HTML by hand.
- **Pre-measurement state** (record values are `null`): the measured rows keep their `dt`, and the `dd` is the plain text `측정 전` in `--color-ink-3`, with no chip, no number, no zero and no placeholder dash. `측정일` also shows `측정 전`. `확인한 브라우저` lists only the browsers the record marks, each as `{이름} · 확인 전`. A state with any `null` must never render a `data` chip.
- **Partial state**: each row renders independently. A row with a value shows it; a `null` row shows `측정 전`.
- **Never listed as tested**: a browser appears with `확인함` only when the record has `tested: true`. Chrome and Edge with `method: "headless"` read `{이름} {버전} · 확인함 (자동화 점검)`. iOS Safari is `확인함` only with `method: "real-device"`; until then the item reads `iOS Safari · 실기기 확인 전`. No Safari-engine claim may be inferred from a Chromium run.
- Release gate: the live public release (D-04) requires the record to be filled from the deployed URL; the pre-measurement copy is acceptable only in local and pre-deploy builds.

### Accessibility and semantics

- `dl` with `div` row groups, as in `.meta` and `.skills`. `lang="en"` on the English `dt`/heading words only. Score chips are `data` elements with `value`; the text is the number, so it reads naturally. `time` has a machine `datetime`.
- Touch: any link inside (none planned) keeps 44px. Contrast: all text is `--color-ink-2` or `--color-ink-3` on white (already passing `check-contrast`).

### Print [CONTEXT: excluded from the PDF]

In `print.css`: `#colophon, body > footer a { display: none !important }`. The copyright `<p>` stays. The PDF page count and `--page-plan` do not change; `pdf-report` should show the same page count as before this phase.

---

## 2. 404.html [CONTEXT discretion]

### Why it does not link the shared stylesheets [DISCRETION, important]

GitHub Pages serves `404.html` at the URL that was requested, which can be any depth (`/portfolio-2026/a/b/c`). A relative `css/...` path would then resolve to `/portfolio-2026/a/b/css/...` and break. So the page is self-contained:
- One inline `<style>` using the same token values (hex copied from `css/tokens.css`: `#ffffff`, `#f7f8f7`, `#111827`, `#4b5563`, `#5b6370`, `#0a7a3d`) and the font stack `"Pretendard", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif` (Pretendard is not loaded here, so the system Korean font renders; this is accepted and not a regression).
- No external file, no script, no image.
- The one link uses the absolute project path `href="/portfolio-2026/"` because only an absolute path works from any depth. This is the single deliberate exception to the all-relative rule and must be commented in the file. (Locally, under `npm run serve`, this link goes to `/portfolio-2026/` and may 404; that is expected and the check should assert the string, not click it.)
- A check asserts the inline hex values **and the heading `clamp()` string** equal the ones in `tokens.css`, so neither color nor type size can drift.

### Head

`<html lang="ko">`, `<meta charset="utf-8">`, viewport, `<meta name="robots" content="noindex, nofollow">`, `<title>페이지를 찾을 수 없습니다 · 퍼블리셔 유윤희 포트폴리오</title>`, favicon links with absolute project paths (`/portfolio-2026/favicon.svg`, `/portfolio-2026/favicon-32.png`, `/portfolio-2026/apple-touch-icon.png`). No OG tags.

### Layout

- `body { margin: 0; min-block-size: 100svh; display: grid; place-content: center; padding: 48px 24px }`. Content column `max-inline-size: 32rem`, left-aligned text (not centered, matching the Contact desktop alignment), `display: grid; gap: var(--space-md)`.
- Order: `p.eyebrow` `404` (Label 14/600, `--color-ink-3`, `lang="en"`), `h1` (Heading, `--color-ink`, `text-wrap: balance`), body `p` (Body 16/400, `--color-ink-2`, `margin-block-start: var(--space-sm)`), then the link (`margin-block-start: var(--space-lg)`).
- Link: Body 16/600, `--color-accent`, `text-decoration: underline`, `min-block-size: 44px`, `display: inline-flex; align-items: center; gap: 8px`, with the same 8px CSS chevron as `.links a::after` (no icon, no emoji). Hover: `--color-accent-strong`. Focus-visible: `outline: 2px solid #0a7a3d; outline-offset: 2px`.
- Background: page white. No panel, no illustration, no animation, no JS. `prefers-reduced-motion` needs nothing because nothing moves.

### Copy

| Element | Copy |
|---------|------|
| Eyebrow | `404` |
| h1 | `페이지를 찾을 수 없습니다.` |
| Body | `주소가 바뀌었거나 없는 페이지입니다. 포트폴리오 첫 화면으로 돌아가 주세요.` |
| Link | `첫 화면으로 돌아가기` |

---

## 3. Link-preview metadata and OG card (DEPL-03) [CONTEXT discretion]

### Head tags for `index.html` (all absolute URLs use the D-01 base)

| Tag | Value |
|-----|-------|
| `<meta name="description">` | `화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.` |
| `og:title` | `퍼블리셔 유윤희 포트폴리오` |
| `og:description` | `화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.` |
| `og:type` | `website` |
| `og:locale` | `ko_KR` |
| `og:url` | `https://youyoonhee.github.io/portfolio-2026/` (no `<link rel="canonical">`: the page is noindex, so a canonical would send a mixed signal) |
| `og:image` | `https://youyoonhee.github.io/portfolio-2026/img/og-card.png` |
| `og:image:width` / `og:image:height` / `og:image:type` | `1200` / `630` / `image/png` |
| `og:image:alt` | `퍼블리셔 유윤희 포트폴리오` |
| `twitter:card` | `summary_large_image` |
| `twitter:title`, `twitter:description`, `twitter:image` | same values as the `og:` counterparts (explicit, so no fallback guesswork) |

Source strings (quote check): `og:title` and `<title>` = `<title>` in index.html line 22: `퍼블리셔 유윤희 포트폴리오`. `og:description` = `.cover-intro` in index.html line 57: `화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.` (character-for-character, including the space in `유윤희 입니다`). `check-content` should assert these equal the cover text so they cannot drift. No new claim, no number, no email, no phone anywhere in the tags.

### OG card: `img/og-card.png`, 1200 x 630

Composition (left-aligned, inherits the site's quiet look, no screenshot, no gradient, no shadow):

| Layer | Spec |
|-------|------|
| Ground | `#ffffff` full canvas (60%) |
| Panel | Inset 40px on all sides: rect `x=40 y=40 w=1120 h=550`, fill `#f7f8f7` (30%), corner radius 24 (same as `--radius-lg` panels) |
| Wordmark | `PORTFOLIO.` at x=104, baseline so its cap top sits at y=104. 32px, weight 600, letter-spacing 0.04em (same as `.wordmark`), color `#0a7a3d` (accent) |
| Name | `유윤희`, 160px, weight 600, line-height 1.05, letter-spacing -0.03em (same tracking as `.cover h1`), color `#111827`. Left edge x=104, baseline at y=400 |
| Role | `앱, 반응형 웹 퍼블리셔`, 48px, weight 400, line-height 1.3, color `#4b5563`. Left edge x=104, baseline at y=490 (gap of about 56px below the name) |
| Safe area | All text stays inside x 104 to 1096 and y 104 to 526 (centered crops by some apps cut about 10 percent from the edges); the longest line is the role at about 560px wide, far inside |

Rules:
- Content is exactly three text items: `PORTFOLIO.`, `유윤희`, `앱, 반응형 웹 퍼블리셔`. No email, no phone, no years, no company names, no scores, no slogan. The role string is the cover-intro phrase `앱, 반응형 웹 퍼블리셔`.
- Colors are site tokens only. Contrast: ink on surface about 16:1, ink-2 on surface about 7:1, accent on surface about 4.9:1 (32px semibold counts as large text, passes 3:1 and 4.5:1).
- Font: Pretendard static TTF (the `fonts-print.css` family), weights 600 and 400. **Render in headless Chrome** from a small local HTML file (for example `tools/og-card.html`, not shipped in the Pages allowlist) at exactly 1200x630, device scale factor 1, waiting for fonts. Do not rasterize SVG text with sharp, because librsvg does not load the project `@font-face` and would substitute a system font. sharp (already installed) is used only afterwards to verify dimensions and optimize the PNG.
- Output: PNG, 1200x630, target under 150KB (flat colors compress well; palette quantization allowed if text edges stay clean). Visually verify the file once before release; this is the only item in this spec that needs a human look.

---

## 4. Favicon set (DEPL-03) [CONTEXT discretion]

Glyph: a geometric **Y** (initial of Youyoonhee), drawn as stroked paths, not text, so it needs no font and renders identically everywhere.

`favicon.svg` (viewBox `0 0 64 64`):
- Shape: rounded square `rect x=0 y=0 width=64 height=64 rx=14`, fill `#0a7a3d`.
- Glyph: white `#ffffff` stroke, width 8, `stroke-linecap="round"`, `stroke-linejoin="round"`, no fill. Path: `M19 17 L32 35 L45 17 M32 35 V50`. (Arms meet at the point 32,35; stem runs down to y=50; the glyph is optically centered and leaves at least 11 units of margin.)
- White on `#0a7a3d` is about 5.4:1 contrast.
- No gradient, no shadow, no text element, no transparency in the glyph. Under 600 bytes.

PNG fallbacks (rendered from the same SVG by `tools/optimise-images.mjs` or a sibling script using sharp, no new dependency):

| File | Size | Notes |
|------|------|-------|
| `favicon-32.png` | 32x32 | Same rounded square and glyph, transparent corners |
| `apple-touch-icon.png` | 180x180 | **Full-bleed square, no rounded corners, no transparency** (iOS applies its own mask and fills transparency with black). Same `#0a7a3d` ground and white Y, glyph scaled to the same proportions (stroke 22.5px of 180) |

`index.html` and `404.html` head links:
```
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
```
(`404.html` uses the `/portfolio-2026/` absolute form of the same three paths.) Files live at the site root so they sit next to `index.html`. `site.webmanifest` is **skipped** [DISCRETION]: the site is not an installable app and it would add a file with no visible effect. Add `<meta name="theme-color" content="#ffffff">` only if it costs nothing; it is optional and not required by this contract.

---

## Copywriting Contract

All new visible copy is Korean, matching the site's plain, polite tone.

| Element | Copy |
|---------|------|
| Primary CTA | none in Colophon. 404 return link: `첫 화면으로 돌아가기` |
| Colophon eyebrow / heading | `09 / Colophon` / `Colophon.` (English, same convention as `Contact.`) |
| Colophon intro | `이 사이트를 만든 방식과 직접 측정한 결과입니다.` |
| Footer link | `사이트 정보` |
| Empty (pre-measurement) state heading | none; the section stays, each measured row shows `측정 전` |
| Empty state body | `측정 전` (row value). No number, no dash, no zero. Next step is to run the checks on the deployed URL and fill `tools/measurements.json` |
| Untested browser | `{브라우저} · 실기기 확인 전` or `{브라우저} · 확인 전` |
| Tested browser | `{브라우저} {버전} · 확인함` (automation: `· 확인함 (자동화 점검)`) |
| Error state | 404 heading `페이지를 찾을 수 없습니다.` and body `주소가 바뀌었거나 없는 페이지입니다. 포트폴리오 첫 화면으로 돌아가 주세요.` The site has no form or runtime error UI |
| Destructive confirmation | not applicable (no destructive action in this phase) |
| `og:title` / `og:description` | `퍼블리셔 유윤희 포트폴리오` / `화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.` (quoted from index.html) |

Every new visible string needs a `uiAllowlist` entry in the content manifest if `check-content` covers it. Facts-only: no metric appears unless it is in `tools/measurements.json`; "WCAG 2.2 AA" is phrased as a target.

---

## Responsive Verification Matrix (Phase 5 additions)

| Width x height | Must verify |
|----------------|-------------|
| 375 x 812 | Colophon rows stack (label above value, 4px gap); no horizontal scroll; chips wrap; footer link 44px tall; 404 text fits with 24px side padding, link 44px |
| 768 x 1024 | Colophon rows use 120px label column; dl full width of wrap |
| 1024 x 768, 1440 x 900 | Colophon dl capped at 48rem; section padding 64px; 404 content column stays 32rem |
| any, JS disabled | Colophon and footer link work (plain anchor, no JS dependency); scroll-spy absence changes nothing |
| any, pre-measurement record | Only `측정 전` and `확인 전` text; zero `data` chips; no digits in the **measured** rows (Lighthouse, 검증, 측정일). Static rows (반응형 구간 values, `WCAG 2.2 AA`, the `09` eyebrow) may contain digits, so the check scopes the digit assertion to the measured rows only |
| any, record filled | HTML equals record (`colophon-sync` is idempotent); untested browsers still read `확인 전` |
| print (A4) | `#colophon` and the footer link absent; page count and page plan identical to the last PDF build; no phone number besides the existing injected contact line |
| Link-preview | `og:image` URL returns 200 as `image/png` 1200x630 on the deployed site; tags quote the cover strings exactly; no phone or email in any tag or in the image |
| 404 | A nested missing path (for example `/portfolio-2026/x/y`) renders styled with no broken asset request; link target `/portfolio-2026/` |
| Favicon | SVG shows in Chrome and Edge tabs; PNG 32 and 180 files exist with exact dimensions; 180 has no alpha |

---

## Design-Taste Waivers (Phase 5 delta)

| ID | Rule | Disposition |
|----|------|-------------|
| W-18 | Pretendard everywhere | Exception: `404.html` falls back to the system Korean font because it must be self-contained at any URL depth (see section 2) |
| W-19 | All paths relative | Exception: one absolute link `/portfolio-2026/` and absolute favicon paths in `404.html`, and absolute `og:` URLs (required by crawlers) |
| W-20 | No scroll fade-ins, no new motion | Complied: the Colophon and 404 have no motion at all |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (not a React project) | not applicable |
| Third-party registries | none | not applicable. No runtime library is added. Headless Chrome (use whichever Chrome automation the repo already has for check-ui, or the installed Chrome/Edge CLI) renders the OG PNG and `sharp` converts the favicon PNGs, both local dev tools that the site does not load |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
