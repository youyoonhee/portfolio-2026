---
quick_id: 261122-tgl
type: quick
completed: 2026-11-22
commits: [005db72, e53a828]
key-files:
  modified: [index.html, tools/content-manifest.json, tools/check-content.mjs, js/main.js, css/layout.css, tools/check-ui.mjs]
---

# Quick 261122-tgl: calmer touch behaviour on mobile, and company descriptions — Summary

The tech stack slider now moves one card per swipe, ignores small sideways drift and changes its dot only once a card is 60% in view. The keyword dial now uses a 15% hysteresis margin and a 350ms dwell, and settles to the scroll position when the scroll stops. Phones get 0.7 of a screen per keyword step. 지아이데이타, 비스톤스 and 애비로드 now have their company description lines, and the first 지아이데이타 project is now titled "보험상품 산출기, 상품소개 페이지".

## Commits
- `005db72` feat(content): company description lines for 지아이데이타, 비스톤스, 애비로드
- `e53a828` fix(mobile): calmer touch on the tech stack slider and the keyword dial

## Part 1: touch thresholds (values chosen)

### Tech stack slider (below 640px)
- **CSS:** `scroll-snap-stop: always` on the cards and `touch-action: pan-x pan-y` on the track. Native scroll-snap is kept, with no hijacking and no preventDefault.
- **Dots:**
  - An IntersectionObserver on each card (`root` is the track, `threshold` 0.6) lights a dot only when its card is at least 60% visible.
  - A drift under 25% leaves the old card at 75% or more and the next card under 60%, so the dot cannot change.
  - When the scroll comes to rest (`scrollend`, or a 120ms debounce after the last scroll event where `scrollend` is missing, e.g. iOS < 26), the dot is set from the nearest card.
  - A dot tap still scrolls to its card. The tapped dot lights at once, and cards passed on the way are ignored until the target card arrives or the scroll settles (1.2s safety timeout).

### Keyword dial
- **Hysteresis margin:** 0.15 of a step, the top of the 12–15% range. With ±5% rocking the step never reaches the margin. The extra 3% over 12% absorbs momentum overshoot on phones, where one step is about 570px, so 15% is about 85px.
  - Going down from step k, the step changes only when progress ≥ boundary + 0.15.
  - Going up, it changes only when progress < boundary − 0.15.
  - After crossing, the new step is `floor(p ∓ 0.15)`.
- **Dwell:** 350ms after a switch, unless the scroll has moved more than one full step since that switch. A suppressed switch is re-checked when the dwell ends, so the user is never trapped, and scrolling itself is never blocked.
- **Settle:** on `scrollend` (or the same 120ms debounce fallback), the step is set straight from the position with `floor(progress)`. At rest, the "(n/4)" counter always matches the position.
- **Track per step on phones:** 0.7 screen below 640px, so the track is `calc(100svh + 4 * 70svh)`. Wider screens keep 0.5.
- **Address bar:** the track and stage stay in `svh`. The slot length is measured at layout time (on enable, and from a ResizeObserver on the track and stage), never per scroll event. Only the track's `getBoundingClientRect().top` is read per frame.
- **Kept unchanged:** the 700ms dial rotation, transform+opacity motion, the Tab focus handler and the link pointer-events fix.

### New check-ui scenarios (real touch drags, `hasTouch`/`isMobile` viewport)
- **`skills-touch`:**
  - snap-stop and touch-action are present;
  - a 20% drift held and then released, in both directions, snaps back to the same card with the dot unchanged throughout;
  - 5 full flick swipes each move exactly one card, and the dot follows;
  - a mostly vertical drag on the slider scrolls the page and leaves the card where it was.
- **`keyword-touch`:**
  - one step is 0.7 screen at 375×812;
  - rocking the finger ±5% of a step around boundaries 1, 2 and 3, from both sides, produces 0 `data-active` changes;
  - a drag well past each boundary produces exactly 1 change;
  - for 6 rest positions inside the margin zone (1.07, 0.94, 2.06, 1.95, 3.08, 2.93), the counter after release equals the step for that position, while the held step was still the old one.

## Part 2: content
- Each company section now has a `p.company-desc` under the period:
  - 지아이데이타: "하나손해보험 웹/앱 유지보수"
  - 비스톤스: "광고 플랫폼, 이커머스 프로모션 구축 및 유지보수"
  - 애비로드: "교보생명 금융 앱 구축"
- The gi-calculator title is now "보험상품 산출기, 상품소개 페이지" in both places it appeared: the h3 and the shot-link aria-label. No keyword link used it. The image alt is unchanged.
- **Manifest:**
  - Company `description` and `descriptionNote` entries are added.
  - The project is renamed, and its `nameNote` is now "user-provided 2026-11-22 (…)".
  - The four new strings are in uiAllowlist with the reason "user-provided 2026-11-22".
- **sourceCoverage:** unchanged. `보험상품산출기·상품소개페이지` is still covered by the shorter title, and check:source passes with site 56 / excluded 25 / unmapped 0.
- **check-content:**
  - `p.company-desc` must be the element right after the period and must match the manifest text.
  - User-provided lines need a uiAllowlist entry with a matching reason.
  - No company-desc may appear where none is expected.
  - The renamed-title reason is now read from `nameNote` and is no longer fixed to 2026-11-11.
  - Negative tests: a missing line and changed text both fail.

## Verification
| Command | Result |
|---------|--------|
| `npm run check` | exit 0 |
| `npm run check:ui` | exit 0, 306 PASS (all, including the new scenarios) |
| `npm run check:layout` | exit 0, 76 PASS |
| `npm run check:source` | exit 0 |
| `npm run check:artifact` | exit 0 (280 files) |
| `npm run pdf` | exit 0: **12 pages**, 1,071,637 bytes; page plan unchanged (companies on 7, 8, 10, 11); no card split; no blank page |

- **Screenshots:** `dist/company-desc/{gi-data,kn-curation,bistones,abbey-road}-{375,1440}.png`. The description is one line at both widths, with no overflow.
- **PDF preview:** fake phone number, `dist/pdf-slides/preview.pdf`. Pages 7, 10 and 11 were viewed (`dist/company-desc/pdf/preview-07..11.png`). All three company slides fit, and the description sits under the period.

## Deviations from Plan
1. **[Rule 1 - Bug] check-ui `menu 8`:** the test used a fixed 900ms wait after the nav link click.
   - **Cause:** the taller phone keyword track (0.7 screen per step) makes the smooth scroll to #career about 1.2s, so the test failed with a delta of 45–52px.
   - **Fix:** the test now waits until scrollY has been still for 600ms. A shorter 150ms stability window was not enough, because a frame gap of up to about 400ms occurs mid-scroll; that gap was confirmed to exist before this change too. Committed in e53a828.
2. **Note on test strength:** in headless Chrome, touch flicks rarely skip a card even without `scroll-snap-stop` (1 skip in 8 flicks without it, 0 in 8 with it). The one-card swipe assertion is therefore backed by the computed-style assertion (`scroll-snap-stop: always`), not by the swipe alone.

## Decisions the plan left open
- The margin of 0.15 within the 12–15% range, and the 1.2s dot-tap safety timeout.
- Settle snaps straight to `floor(progress)`, even inside the margin zone.
- The keyword enter/leave IntersectionObserver and the ResizeObserver also run the settle.
- The `nameNote` reason check in check-content was generalised.

## Self-Check: PASSED
- Commits 005db72 and e53a828 exist on main. The screenshots and preview pages exist under dist/ (not committed).
