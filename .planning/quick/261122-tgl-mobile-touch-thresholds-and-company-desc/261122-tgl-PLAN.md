---
quick_id: 261122-tgl
type: quick
autonomous: true
files_modified: [index.html, css/layout.css, css/components.css, js/main.js, tools/content-manifest.json, tools/check-content.mjs, tools/check-ui.mjs, tools/pdf-slides.css (only if needed)]
---

# Quick 261122-tgl: calmer touch behaviour on mobile, and company descriptions

## User request (2026-11-22, in Korean)
> "Checking on my phone, the slider and the scroll animation react too sensitively to touch. Can you add something like a threshold so they feel smoother? Also fix these on the web and in the PDF: …"

## Part 1: mobile touch sensitivity
There are two interactions.

### A. Tech stack slider (below 640px)
- **Current:** native scroll-snap (`scroll-snap-type: x mandatory`) with JS-built dots (`initSkillsSlider` in js/main.js).
- **Likely problems:**
  - one flick skips several cards;
  - tiny horizontal drift while scrolling the page vertically moves or snaps the slider;
  - the dots flip back and forth mid-swipe.
- **Fix, keeping native scrolling (no scroll hijacking, no swipe library):**
  - Add `scroll-snap-stop: always` on the slides, so one swipe moves at most one card.
  - Use `touch-action: pan-x pan-y` on the track (not `manipulation`-only). The browser then picks the dominant axis, so a vertical page scroll that starts on the slider stays vertical.
  - **Dots:** update the active dot only when a slide is clearly in view. Use an IntersectionObserver with `threshold` around 0.6 on each slide, or a settled `scrollend` (with a debounce fallback of about 120ms where `scrollend` is missing on iOS < 26), instead of updating on every scroll event.
  - **Dot taps:** keep scrolling to the slide.
- **Check:** at 375, a programmatic small horizontal drift (< 25% of the card width) followed by release snaps back to the same card, and the dot does not change. A full swipe moves exactly one card.

### B. Keywords dial switch on scroll (all widths, most noticeable on phones)
- **Current:** the scroll position inside the tall track maps directly to the step. Near a boundary, small touch scrolls and momentum make the step flip back and forth.
- **Fix:**
  - **Hysteresis:** on the way down, switch to step n+1 only when progress passes the boundary by a margin of about 12–15% of one step length. On the way up, switch back only after passing the boundary by the same margin in the other direction.
  - **Minimum dwell:** after a switch, ignore further switches for about 350ms, unless the user has scrolled more than one full step. Never trap the user; scrolling itself is never blocked.
  - **Track length on phones:** below 640px, give each step a little more track (e.g. 0.7 screen per step instead of 0.5), so a single flick doesn't pass two steps.
  - **Mobile address bar:** if the sticky stage uses `svh`/`dvh` and the address bar shows or hides, make sure the step mapping doesn't jump. Base it on stable values: `svh` in CSS, plus the `innerHeight` read at layout time rather than on every scroll.
  - **Settle:** when scrolling stops (`scrollend` or debounce), make sure the shown step matches the scroll position.
  - **Keep as is:** no scroll hijacking and no wheel/touch preventDefault; transform+opacity motion; the 700ms dial rotation; the Tab focus handler and the link pointer-events fix.
- **Check:** in check-ui at 375×812 with touch emulation:
  - stepping the scroll by small increments around each boundary (±5% of a step) does not toggle the step back and forth;
  - a scroll well past the boundary switches once;
  - after scrolling stops at any position, the counter "(n/4)" equals the step for that position.
  - Keep all existing keyword assertions passing.

## Part 2: content (web and PDF)
The company sections each have a description line under the period, like 케이엔큐레이션's `p.company-desc` "Angular 기반 앱, 반응형 웹 구축 및 유지 보수".

- **지아이데이타:** add `p.company-desc` "하나손해보험 웹/앱 유지보수" below the period.
- **비스톤스:** add `p.company-desc` "광고 플랫폼, 이커머스 프로모션 구축 및 유지보수".
- **애비로드:** add `p.company-desc` "교보생명 금융 앱 구축".
- **First 지아이데이타 project title:** "하나손해보험 보험상품 산출기, 상품소개 페이지" becomes "보험상품 산출기, 상품소개 페이지". Change it everywhere it appears: the h3, the shot-link aria-label, any keyword or other link text.

The screenshot alt text "하나손해보험 다이렉트 자동차보험 상품소개 화면" describes the image, so leave it.

### Tooling
- **tools/content-manifest.json:**
  - Add company `description` entries, or whatever the companies check reads.
  - Rename the project.
  - Add the new strings to uiAllowlist with reasons "user-provided 2026-11-22", and the renamed title too.
  - sourceCoverage: if any `site` entry's text has disappeared, mark it excluded with a reason. Check with check:source.
- **tools/check-content.mjs:** assert the three new company-desc lines.
- **PDF:** rebuild with `npm run pdf`. The company pages must still fit the plan, with no cut cards and no blank page.
  - The extra description line adds height. If a company page overflows, it may continue onto another page as the plan allows; report the new page count.
  - View the preview pages for 지아이데이타, 비스톤스 and 애비로드 using the helper scripts in dist/pdf-slides/ (build-preview.mjs, view-pages.mjs), which make a preview with a fake phone number.
  - Never open the real PDF's contact page.

## Task
<task type="auto">
  <name>Task 1: touch thresholds and company descriptions</name>
  <read_first>js/main.js (initSkillsSlider, keyword switch), css/layout.css (skills slider, keywords track), css/components.css, index.html (company sections, gi-calculator), tools/check-ui.mjs (skills-slider, keyword scenarios), tools/check-content.mjs, tools/content-manifest.json, dist/pdf-slides/*.mjs helpers</read_first>
  <action>Implement both parts. Make 2 commits, fix(mobile): ... and feat(content): .... Save screenshots of the 3 company headers at 375 and 1440 under dist/company-desc/, and inspect them. Build the PDF and inspect the company preview pages.</action>
  <verify><automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf</automated></verify>
  <acceptance_criteria>
    - The new check-ui touch assertions pass (slider drift and one-card swipe; keyword hysteresis and settle).
    - The three company-desc lines are present, and the project title is "보험상품 산출기, 상품소개 페이지" everywhere.
    - Every verify command exits 0. The PDF page count is reported.
  </acceptance_criteria>
</task>

## Hard rules
- No push, no gh write calls, no `--no-verify`.
- Stage by explicit path. Leave `.planning/config.json` and `.claude/` untouched. Never commit a PDF, `dist/` or `private/`.
- Never kill processes by name. Use node, not python.
- Never read `private/`, `.planning/source/` or `_screenshots/`, and never print a phone number (filter the PDF build output).
- Known flakes: check:ui keyword-focus and the check:layout 320px anchor. Re-run each once.
- Don't change the visual design beyond the description lines.
- When done, write `261122-tgl-SUMMARY.md` and commit it with the plan. Do not edit STATE.md.
