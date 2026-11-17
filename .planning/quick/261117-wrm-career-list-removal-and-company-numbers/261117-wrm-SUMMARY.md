---
quick_id: 261117-wrm
status: complete
completed: 2026-11-17
commits: [cb3f89c]
---

# Quick 261117-wrm Summary: Career list and 04–07 company numbers removed

The `ol.career` list is gone. "03 / Career" and "Career & Work." now lead straight into 지아이데이타. The four company sections open with their name h2 and no number eyebrow. Contact is renumbered to "04 / Contact".

## Changes (commit cb3f89c)
- **index.html:** removed the `ol.career` list and the `<p class="eyebrow">04…07</p>` lines. Contact eyebrow is now `04`.
- **css/layout.css:**
  - Removed the career row rules.
  - `main > section#career` has no bottom padding.
  - `#career + .company` has no top divider and a `--space-xl` lead-in (`--space-2xl` at 1024px and up).
  - The heading-to-company-h2 gap is 32px at 375 and 768, and 48px at 1440. Before, it was a 73–97px gap with a divider line.
- **css/components.css:** removed `.career a`, `.career-summary` and `.career-period`.
- **css/print.css:**
  - Removed the career rules.
  - `break-before: page` moved from `#gi-data` to `#career`, which also gets `break-after: avoid`.
  - `#career` has no padding in print, and `#career + .company` has a 5mm top padding.
- **tools/content-manifest.json:**
  - Contact eyebrow is now "04 / Contact".
  - Company `number` and `summary` are removed, along with the 4 summaries in `sourceStrings`.
  - The 4 summaries are now `excluded` in `sourceCoverage`, with the reason "career list removed by user request (2026-11-17)".
- **tools/check-content.mjs:**
  - career: checks the eyebrow and h2, that there is no ol/li/.career, and that `#gi-data` is the next sibling section.
  - companies: checks that there is no `.eyebrow` and that the h2 is the first child and matches the name.
- **tools/check-layout.mjs:** `#abbey-road` is now tested with a hash jump (`null` selector). `.career a` is removed from the tap-target selector.
- **tools/pdf-report.mjs:** the page-plan assertion is now "skills on page 2, career heading with the first company" (skills 2, career 3, GI Data 3).

## Verification
| Command | Result |
|---|---|
| `npm run check` | exit 0, run twice (the second run was after the last print.css change) |
| `npm run check:ui` | exit 0, all passed, no flake retry needed |
| `npm run check:layout` | exit 0, all PASS. `#abbey-road` hash anchor passes at every width |
| `npm run check:source` | exit 0, source-coverage site 58 / excluded 22 / unmapped 0 |
| `npm run check:artifact` | exit 0, 280 files |
| `npm run pdf` | exit 0, **7 pages**, 586,191 bytes. Cards per page: 0,0,3,2,3,2,1 |

The first `npm run pdf` failed with "no blank or footer-only page (pages 3)". Page 3 held only the two headings, and the GI Data grid was pushed to page 4. Removing the print top padding on `#career` and shortening the GI Data lead-in to 5mm fixed it. Page 3 now holds the career heading, GI Data and all 3 of its cards. This was checked visually on a phone-free preview PDF rendered with the same print CSS.

Screenshots: `dist/career-flat/career-flat-375.png`, `career-flat-768.png`, `career-flat-1440.png` (dist/ is not committed).

## Decisions left open by the plan
- The first company has no divider. On screen, the heading-to-GI Data gap went down to 32px (48px on desktop), so GI Data reads as the first entry under "Career & Work.".
- In the PDF, the heading moves to the GI Data page, so skills sit alone on page 2.
- The removed summaries are marked excluded in source coverage rather than dropped from the table.

## Deviations
None beyond the PDF spacing fix above.
