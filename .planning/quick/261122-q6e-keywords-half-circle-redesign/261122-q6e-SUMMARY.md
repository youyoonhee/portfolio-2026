---
quick_id: 261122-q6e
status: complete
completed: 2026-11-22
commits: [c791ae0]
---

# Quick 261122-q6e Summary: shorter cover intro, Keywords as a four-step sage half-circle dial

The cover intro now reads exactly "반응형 웹/앱 퍼블리셔 유윤희 입니다." (user revision 5; 1.125rem kept). `#keywords` is a sticky
one-screen stage over a 3-screen track: an eyebrow, a top line, and a deep sage half-circle (`--color-sage-deep:
#5f7353`, white on it 5.17:1). Scrolling steps through four steps; each step's counter "(n/4)", thin line and white
word turn together along the circle like a dial, and the top line fades and slides. Steps 2-4 top lines link to
their project cards. Without the switch (no JS, reduced motion, viewport under 500px tall, print) all four steps are
stacked inside the half-circle, nothing hidden.

## User revisions during execution (recorded in the PLAN)
1. **Four steps** instead of three keywords, with a top line per step (step 1 "화면 너머의 경험까지 섬세하게." plain text,
   steps 2-4 "FSD Cosmetic Website" -> `#kn-fsd`, "EXAONE AI Website" -> `#kn-universe`, "Oneday Insurance App" ->
   `#gi-oneday`) and circle words "Superior service" (lang="en"; renamed in revision 4), "반응형 웹", "인터랙션", "AI 활용". The h2 went back
   to a visually hidden "Keywords"; the circle is smaller, after the reference geometry.
2. **Dial turn** instead of the plain slide-and-fade: counter + line + word form one group rotating about the circle
   centre (leaving group to -32deg, incoming from +32deg; 700ms `--dur-dial`, `--ease`; the leaving group fades over the
   last 60% of the turn, the incoming one in the first half).
3. **Bug: project links not clickable.** Root cause: each inactive dial group is a full-width box (the counter strip
   plus the band) rotated by +/-32deg about a centre one radius below the arc. Rotated that far, the box's outer
   corners swing up by about 250px at 1440 and cover the top-line row. The groups were opacity 0 but still took
   pointer input, so they caught clicks on most of the link box (measured with `elementFromPoint`: 13 of 15 sample
   points at 1440 hit `div.keyword-dial`; 375 and 768 were not affected). Fix: `.keyword-dial` and the circle band
   (`.keywords-circle`, which also holds SCROLL DOWN) are `pointer-events: none` while switching, and the active top
   line is explicitly `pointer-events: auto` (inactive top lines stay `none`). No JS swallowed clicks. check-ui
   now samples 15 points across every link at 375, 768 and 1440, then clicks with `page.mouse.click` and asserts the
   hash and the card top below the header. With the fix reverted this scenario fails 4 checks.
4. **Step 1 word and pagination size:** the step 1 word is "Higher-Quality Service" (lang="en"). At 320 and 375 it
   wraps into two lines ("Higher-Quality / Service", 36px, 234px wide) and stays inside the circle (measured at
   320x568, 320x640, 375x812, switch and reduced); no clamp change needed. The pagination "(n/4)" is
   `--count-size: 1.125rem` (18px) at every width; the counter strip grew from 88px to 96px so the ink line still
   meets the arc. check-ui asserts 18px at 375 and 1440.
5. **Cover intro:** "반응형 웹/앱 퍼블리셔 유윤희 입니다." (uiAllowlist, user-provided 2026-11-22). The meta, og and
   twitter descriptions keep the full original sentence. check-preview: description / og:description non-empty,
   cover intro non-empty, and both contain "퍼블리셔 유윤희" (self-test: new negatives for a description without
   the name, a cover intro without the name and an empty og:description).

## Changes (commit c791ae0)
- **index.html:** cover intro "반응형 웹/앱 퍼블리셔 유윤희 입니다."; `#keywords` rebuilt: eyebrow, `h2.visually-hidden` "Keywords", `div.keywords-circle`
  (aria-hidden `span.keywords-disc` and `p.keywords-scroll` "SCROLL DOWN"), then four `div.keyword-block`, each
  `p.keyword-lead` (text or one in-page link) + `div.keyword-dial` (aria-hidden `p.keyword-count` "(n/4)", aria-hidden
  `span.keyword-line`, `h3.keyword-title`). `ul.keyword-list` and its nine links are gone. Template comment updated.
- **css/tokens.css:** `--color-sage-deep: #5f7353` (hue of `--color-sage-strong`, deeper); `--dur-dial: 700ms`;
  unused `--stagger-switch` removed.
- **css/layout.css:** the `.keywords::before` surface panel is gone (plain page background; `#contact` keeps its
  panel). Static grid: the full-bleed band (`overflow: clip`, `container-type: size`) sits behind the four stacked
  steps; disc `max(94vw, 160cqh)`. Switch (`screen and (min-height: 500px) and (prefers-reduced-motion:
  no-preference)`, every width now): track `100svh + 4 x 50svh`; the sticky stage is full-bleed with `overflow: clip`
  (no scroll container, sticky intact) and rows eyebrow / top line / 88px counter strip / band
  `max(min(48svh, 28vw), 260px, 40svh)`; disc `max(94vw, 3 x band)`; dial `transform-origin` at the circle centre.
- **css/components.css:** dial and top-line switch states (transform and opacity only); `.keyword-lead` type (white,
  small in the static state; large ink line while switching, underlined links); `.keyword-title` white,
  `clamp(36px, 4vw + 20px, 64px)`; `.keyword-list` styles removed.
- **css/print.css:** static half-circle on page 1 with the four steps two by two; counters, lines and SCROLL DOWN
  hidden; `.keyword-lead` and `.keyword-dial` added to the opacity guard.
- **js/main.js:** media query widened to every width (500px min height); focus handler kept for the top-line links
  (a Tab into a hidden step brings it in, instant scroll); no click handling.
- **tools/content-manifest.json:** hero intro (with its uiAllowlist entry); `keywords` = four `{lead, href, title, lang?, note}`;
  `keywordsSection.scrollLabel`; uiAllowlist + reasons "user-provided 2026-11-22" for "Higher-Quality Service",
  "FSD Cosmetic Website", "EXAONE AI Website", "Oneday Insurance App", "화면 너머의 경험까지 섬세하게.", "SCROLL DOWN",
  "(1/4)" ... "(4/4)", "반응형 웹/앱 퍼블리셔 유윤희 입니다.". sourceCoverage: the full original sentence is now
  `excluded` (reason: 2026-11-22 사용자 개정: the first half is the step 1 top line, the cover intro was replaced by
  the user's sentence), with a `site` entry for "화면 너머의 경험까지 섬세하게.".
  The project names are unchanged (still on the cards).
- **tools/check-content.mjs:** keywords check rewritten for the step structure (hidden h2, SCROLL DOWN, per-step
  counter text, line, h3, link target is a project card, allowlist reasons, no `ul.keyword-list`).
- **tools/check-preview.mjs:** description / og:description and the cover intro must be non-empty and both name
  "퍼블리셔 유윤희"; INTRO and fixture updated (meta keeps the full original sentence); three new negative cases.
- **tools/check-ui.mjs:** `keywords` (track 3 viewports, 4 steps, counter per step, 0deg, structure, decoration-only
  aria-hidden), new `keyword-steps` (375/768/1440: each step alone, counter (n/4), dial at 0deg and opacity 1, others
  turned +/-32deg at opacity 0 with nothing focusable, word and SCROLL DOWN inside the circle at 4.5:1+, centred,
  counter above the circle, circle top in the lower half, bottom off screen, no x overflow), new `keyword-links`
  (above), `keyword-focus` (Tab through the three links brings each step in), `keyword-media` (on at every width,
  off at 1440x480 and 812x375), `reduced` (1440 and 375: four steps visible, no counter, line or SCROLL DOWN),
  `nojs-all`, `print-state`.
- **tools/check-layout.mjs:** `.keyword-list` selectors and link-click anchor pairs removed (project anchors by hash);
  keyword visibility measures the top line and word (blocks are `display: contents` while switching).
- **tools/check-contrast.mjs:** `color-bg` on `color-sage-deep` >= 4.5.
- **tools/pdf-report.mjs:** page plan asserts the cover, all four top lines and words on page 1.

## Verification
Final run on the committed state (each command once, no reruns needed):
- `npm run check` exit 0 (143 PASS, 0 FAIL; contrast: `color-bg #ffffff on color-sage-deep #5f7353 5.17:1`)
- `npm run check:ui` exit 0 (278 PASS, 0 FAIL), including keyword-steps, keyword-links (real mouse clicks at
  375/768/1440), keyword-focus, keyword-media, reduced, nojs-all, print-state, cover, cover-orbs
- `npm run check:layout` exit 0 (76 PASS; overflow none at 320-1440)
- `npm run check:source` exit 0 (source-coverage, source-reverse, source-numbers PASS)
- `npm run check:artifact` exit 0
- `npm run pdf` exit 0: **7 pages** (limit 8), A4 portrait, 584,928 bytes, all pdf-report checks PASS including
  "page plan: cover and the four keyword steps on page 1"
- Extra probes: no horizontal overflow and sticky intact at 320x568, 360x740, 1024x600, 1280x720, 1920x1080,
  2560x1300; "Higher-Quality Service" inside the circle at 320 and 375 (two lines, 36px); link hit test 0 misses
  across 15 points per link at 375/768/1440; with the pointer-events fix reverted, keyword-links fails 4 checks.

## Screenshots (dist/keywords-circle/, gitignored)
cover-375.png, cover-768.png, cover-1440.png; keywords-375-1..4.png, keywords-768-1..4.png, keywords-1440-1..4.png;
keywords-1440-mid-1to2.png (mid-turn); keywords-375-reduced.png; keywords-320x568-1.png, keywords-320x640-1.png,
keywords-320x640-reduced-1.png (fit of "Higher-Quality Service"). Print preview checked separately (page 1).

## Decisions left open by the plan
- Sage token `#5f7353` (5.17:1 with white; hue 97deg vs 96deg for `--color-sage-strong`).
- Panel background: dropped for `#keywords`; the half-circle sits on the plain page background.
- Eyebrow centred in this section (the whole composition is centred).
- Switch guard height: 500px; the switch runs from 320px wide.
- Circle: band `max(min(48svh, 28vw), 260px, 40svh)`, disc `max(94vw, 3 x band)`; at 1440x900 the arc top sits at
  55% of the height and the arc meets the bottom about 100px in from each side; phones get a relatively wider circle.
- Turn angle 32deg, 700ms; top line slides 24px.
- Counter strip 96px for the 18px pagination; the ink part of the line runs from under the counter to the arc.
- Counter and line belong to each dial group (so they turn with it), not one shared counter.
- Static state: top lines are small white text above each word inside the circle; print sets the steps two by two.
- Lead size while switching: `clamp(28px, 2.6vw + 16px, 52px)`; the Korean step 1 line wraps at 11em into two lines,
  project names may stay on one line.

## Deviations
- [Rule 1] check-layout keyword visibility measured the block box, which is 0 with `display: contents`; it now
  measures the top line and the word.
- [Rule 1] reduced 375 checked page-wide opacity; the closed mobile nav is opacity 0 by design, so that assertion is
  scoped to `#keywords`.

## Self-Check: PASSED
- commit c791ae0 present; all listed screenshots present; every verify command exit 0.
