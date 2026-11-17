---
quick_id: 261117-qqx
type: quick
autonomous: true
files_modified: [index.html, css/components.css, css/layout.css, css/print.css, package.json, .github/workflows/pages.yml, README.md, tools/check-content.mjs, tools/check-ui.mjs, tools/content-manifest.json, tools/colophon-sync.mjs, tools/record-measurements.mjs, tools/measurements.json, .planning/REQUIREMENTS.md]
---

# Quick 261117-qqx: mobile Contact cat below the heading, and remove the Colophon

## Objective
The user asked for two changes on 2026-11-17.
1. **Mobile Contact cat:** on mobile, the pixel cat image (`img/deco/cat-desk.png`, currently inline inside `h2#contact-title` "Contact.") should sit **below** the "Contact." text instead of beside it. Tablet and desktop stay as they are now.
2. **Colophon removal:** remove the "09 / Colophon." section entirely, on PC and mobile. This is the user's explicit decision and it supersedes QUAL-06.

## Part 1: Contact cat
- **Mobile layout:** below 640px, the cat image inside `h2#contact-title` becomes a block below the text, using the same CSS-only pattern as other breakpoints.
  - **Keep:** the img stays decorative (`alt=""`), keeps its explicit width/height, and keeps its current size or the clamp size. If it reads better, it can be centred to match the centred Contact text on mobile; check the current alignment.
  - **Don't break:** the h2's accessible name must stay "Contact." and the sticky-header anchor offset still has to work.
  - **Wider screens:** ≥ 640px unchanged.

## Part 2: remove the Colophon
- **index.html:**
  - Delete `section#colophon` entirely.
  - Delete the footer link `<p><a href="#colophon">사이트 정보</a></p>`; keep the copyright paragraph.
  - Make sure no other `#colophon` reference remains.
- **CSS:** delete the Colophon rules (`.colophon-list`, `.colophon-pending`, the footer link styles, the print hides for them). If `.meta data, .colophon-list data` was a shared selector, restore it to `.meta data` only.
- **Tooling:**
  - Remove `colophon:check` / `colophon` scripts from package.json and from the `check` chain.
  - Remove the Colophon check, the footer-link expectation and the `#colophon` source-gate exemptions from tools/check-content.mjs, and drop `"colophon"` from the content-manifest `sections`. The footer check then compares the copyright paragraph only.
  - Remove the `spy colophon clears` and any Colophon assertions from tools/check-ui.mjs.
  - Remove any colophon-sync step from .github/workflows/pages.yml.
  - Delete tools/colophon-sync.mjs, tools/record-measurements.mjs and tools/measurements.json; they exist only to feed the Colophon. Use `git rm`.
  - Keep tools/check-network.mjs and tools/check-nu.mjs; they are still useful live checks.
- **README.md:** remove Colophon / measurement-record mentions and keep everything else.
- **.planning/REQUIREMENTS.md:** mark QUAL-06 as removed by user decision on 2026-11-17 (strike it through or move it to Out of Scope with the reason "사용자 요청으로 Colophon 섹션 삭제"), and update its traceability row.
- **Phone gates:** confirm that check-repo, the artifact allowlist and the phone gates still work.

## Task
<task type="auto">
  <name>Task 1: both changes plus checks</name>
  <read_first>index.html (section#contact h2, section#colophon, footer), css/components.css, css/layout.css, css/print.css, package.json, .github/workflows/pages.yml, README.md, tools/check-content.mjs, tools/check-ui.mjs, tools/content-manifest.json</read_first>
  <action>Implement both parts. Commit Part 1 and Part 2 separately. Add a check-ui assertion: at 375, the contact cat's top is at or below the bottom of the "Contact." text line; at 1440 they share a line. Save screenshots of #contact at 375 and 1440, and of the page bottom at 375 (no Colophon) under dist/contact-cat/, and inspect them.</action>
  <verify><automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf</automated></verify>
  <acceptance_criteria>
    - `grep -ri colophon index.html css/ package.json .github/ README.md tools/*.mjs tools/*.json` returns nothing
    - every verify command exits 0; the PDF page count is reported (it may drop if the Colophon affected it; record the number)
    - at 375 the cat is below "Contact."; at ≥ 640 it is unchanged
  </acceptance_criteria>
</task>

## Hard rules
- No push, no gh write calls, no --no-verify.
- Never kill processes by name; use node, not python.
- Never read private/, .planning/source/ or _screenshots/; never print a phone number.
- Stage by explicit path; leave .planning/config.json and .claude/ untouched.
- Known flakes: check:ui keyword-focus and the check:layout 320px anchor; re-run each once.
- Do not touch the cover animation.
