---
quick_id: 261117-wrm
type: quick
autonomous: true
files_modified: [index.html, css/layout.css, css/components.css, css/print.css, tools/content-manifest.json, tools/check-content.mjs, tools/check-layout.mjs, tools/check-ui.mjs, tools/pdf-report.mjs]
---

# Quick 261117-wrm: drop the Career list, and the 04–07 company numbers

## Objective
The user asked for these changes on 2026-11-17 (in Korean): "In 03 Career & Work, take the table out entirely and show the 04 GI Data project card section right below it. In the GI Data through 07 Abbey Road area, drop 04, 05, 06 and 07 and just show the company name."

1. **Career list:** in `section#career`, delete the `<ol class="career">` list (the 4 company rows with summary and period).
   - Keep the "03 / Career" eyebrow and the "Career & Work." h2. They now act as the heading for the company sections that follow.
   - The GI Data company section (`#gi-data`) follows directly.
   - Tighten the spacing so the heading does not float alone with a big gap before GI Data. Check whether the career section's bottom padding plus the first company's top border and padding reads too wide at 375, 768 and 1440, and adjust it with CSS only.
   - The site-nav "Career" link still points to `#career`.
2. **Company numbers:** delete `<p class="eyebrow">04</p>` … `07` from `#gi-data`, `#kn-curation`, `#bistones` and `#abbey-road`. Each section then starts with its company-name h2, for example "지아이데이타.". Period lines, descriptions and cards stay unchanged.
3. **Contact renumbering:** with 04–07 gone, the Contact eyebrow "08 / Contact" would follow 03. Renumber it to "04 / Contact" in index.html and the manifest. This is the orchestrator's default; the user will be told.

## Tooling to update
- **tools/content-manifest.json:**
  - Remove each company's `number`. Change `hero`/contact eyebrow "08 / Contact" to "04 / Contact".
  - Keep the company `name`/`summary`/`from`/`to` data if other checks still use it; otherwise trim it.
- **tools/check-content.mjs:**
  - checkCareer: assert the section has the eyebrow and h2 and **no** `ol.career`/li rows.
  - companies: assert there is no `p.eyebrow` in company sections, and that the h2 matches.
  - If `--require-source` compares career summaries to the source text, keep the company-section checks meaningful without reading the source yourself; run `npm run check:source` to confirm.
- **tools/check-layout.mjs:** drop the `.career a[href=...]` anchor pairs and the `.career a` selector. If coverage for the company anchors is still wanted, keep a company section anchor case via another existing link, such as the keyword-list links.
- **tools/check-ui.mjs:** scroll-spy "company maps to career" should still pass; adjust it only if it breaks.
- **CSS:** remove the now-dead `.career`, `.career a`, `.career-summary` and `.career-period` rules in css/layout.css, css/components.css and css/print.css.
- **tools/pdf-report.mjs:** the page-plan assertion "skills and career together" may still hold; if the PDF page plan changes, update the assertion to the real plan and record the page count. The career heading must not be stranded alone at the bottom of a PDF page: either keep it with GI Data (`break-after: avoid` or put it inside the same page) or keep it on the skills page. Inspect the PDF page images.

## Task
<task type="auto">
  <name>Task 1: markup, CSS and checks</name>
  <read_first>index.html (#career, the 4 company sections, #contact), css/layout.css, css/components.css, css/print.css, tools/content-manifest.json, tools/check-content.mjs, tools/check-layout.mjs, tools/check-ui.mjs, tools/pdf-report.mjs, tools/build-pdf.mjs</read_first>
  <action>Implement the changes above in one commit (feat(career): ...). Save screenshots of #career through the first GI Data card row at 375, 768 and 1440 under dist/career-flat/, and look at them. Build the PDF and look at the page or pages holding the career heading.</action>
  <verify><automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf</automated></verify>
  <acceptance_criteria>
    - index.html has no `class="career"` and no eyebrow paragraph in the 4 company sections; Contact eyebrow reads "04 / Contact"
    - `grep -n "career-summary\|career-period\|\.career " css/*.css` returns nothing
    - every verify command exits 0; the PDF page count is reported
  </acceptance_criteria>
</task>

## Hard rules
- No push, no gh write calls, no --no-verify.
- Never kill processes by name; use node, not python.
- Never read private/, .planning/source/ or _screenshots/; never print a phone number.
- Stage by explicit path; leave .planning/config.json and .claude/ untouched.
- Known flakes: check:ui keyword-focus and the check:layout 320px anchor; re-run each once.
- Do not touch the cover animation, the skills slider or the Contact cat.
- When done, write `261117-wrm-SUMMARY.md` next to this plan and commit it with the plan (docs(quick-261117-wrm): ...). Do not edit STATE.md; the orchestrator does.
