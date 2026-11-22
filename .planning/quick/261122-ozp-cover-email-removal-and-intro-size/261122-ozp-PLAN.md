---
quick_id: 261122-ozp
type: quick
autonomous: true
files_modified: [index.html, css/components.css, css/print.css, tools/check-content.mjs, tools/check-ui.mjs, tools/check-layout.mjs, tools/check-contrast.mjs, tools/content-manifest.json]
---

# Quick 261122-ozp: remove the cover email, set the cover intro to 18px

## Objective
The user asked for two changes on 2026-11-22 (in Korean): "On the first screen, remove my email. Make '화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.' 18px, in rem."

1. **Cover email:** delete `<p class="cover-mail">…</p>` from `section#cover` in index.html.
   - The email stays in the Contact section (`#contact` mailto link) and everywhere else it is now. Only the cover copy goes.
2. **Cover intro size:** set `.cover-intro` to `font-size: 1.125rem` (18px at the 16px root) in css/components.css.
   - Do not add a token unless one already fits.
   - Keep max-inline-size, colour and centring. Check that it wraps well at 320, 375, 768 and 1440 (28em is relative, so the line length grows with it; adjust only if it looks wrong).

## Cleanup
- **CSS:** remove the dead `.cover-mail` rules: the `html.js .cover-mail` animation selectors in components.css (keep `.cover-intro`'s animation and delay unchanged), the `.cover-mail a` block, and `.cover-mail` in the print.css selector list.
- **tools/check-content.mjs:** the hero check requires a mailto link in the cover (line ~172). Invert it: the cover must contain **no** mailto link. Keep the Contact mailto check. If `hero.email` in tools/content-manifest.json is then unused, remove it. Keep `contact.email`.
- **tools/check-ui.mjs:** every scenario that uses `.cover-mail` / `.cover-mail a` (around lines 267, 379, 390, 401, 424, 455, 511) must be updated so the checks stay meaningful:
  - Focus-ring targets: use another focusable element that already exists, or drop the target.
  - Cover timing: last text item = `.cover-intro`.
  - Contrast over circles: drop the `.cover-mail a` entry.
  - The cover-mail visibility/focus tests: remove them, or retarget them if what they assert still applies to another element.
  - Do not loosen the cover timing assertions on the h1 lines.
- **tools/check-layout.mjs:** drop `.cover-mail a` from the selector list at line ~200.
- **tools/check-contrast.mjs:** the accent-strong-on-circle pairs existed only for the cover email link. Remove them if nothing else uses accent-strong over the cover; keep ink-2 pairs.
- **README.md / .planning docs:** leave them alone except this quick task's files.

## Task
<task type="auto">
  <name>Task 1: markup, CSS and checks</name>
  <read_first>index.html (#cover), css/components.css (cover block), css/print.css, tools/check-content.mjs (hero), tools/check-ui.mjs (all cover-mail uses), tools/check-layout.mjs, tools/check-contrast.mjs, tools/content-manifest.json (hero)</read_first>
  <action>Implement both changes in one commit (feat(cover): ...). Save screenshots of #cover after the animation finishes (wait ~6s, or use reduced motion) at 375 and 1440 under dist/cover-noemail/, and look at them. Build the PDF and confirm the page count.</action>
  <verify><automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf</automated></verify>
  <acceptance_criteria>
    - `grep -rn "cover-mail" index.html css js tools` returns nothing
    - section#cover has no mailto link; #contact still has it
    - computed font-size of .cover-intro is 18px at 375 and 1440
    - every verify command exits 0; the PDF page count is reported
  </acceptance_criteria>
</task>

## Hard rules
- No push, no gh write calls, no --no-verify.
- Never kill processes by name; use node, not python.
- Never read private/, .planning/source/ or _screenshots/; never print a phone number.
- Stage by explicit path; leave .planning/config.json and .claude/ untouched.
- Known flakes: check:ui keyword-focus and the check:layout 320px anchor; re-run each once.
- Do not change the circle animation timing, the skills slider, the Contact cat or project text.
- When done, write `261122-ozp-SUMMARY.md` next to this plan and commit it with the plan (docs(quick-261122-ozp): ...). Do not edit STATE.md; the orchestrator does.
