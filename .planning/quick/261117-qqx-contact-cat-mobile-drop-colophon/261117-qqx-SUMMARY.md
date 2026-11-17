---
quick_id: 261117-qqx
type: quick
completed: 2026-11-17
commits: [8f00dcb, 5109c90]
---

# Quick 261117-qqx: mobile Contact cat below the heading, Colophon removed

## Result
1. **Contact cat (8f00dcb):** below 640px `.deco-cat-desk` is `display: block`, centred, with a small top margin, so it sits under "Contact.". At 640px and above nothing changed. The img is still decorative (`alt=""`) with its width/height, and the h2 name is still "Contact.". `check-ui` got a `contact-cat` scenario: at 375 the cat top is at or below the text line bottom (399.9 vs 390.7); at 1440 they share a line.
2. **Colophon removal (5109c90):** removed `section#colophon`, the footer "사이트 정보" link, all Colophon CSS (`.meta data` restored as a single selector), the print hide rule, README mentions, the `colophon`/`colophon:check` scripts and their place in the `check` chain, the pages.yml step, the Colophon check and source-gate exemptions in check-content, `"colophon"` in the content manifest, and the colophon assertions in check-ui. `git rm` on `tools/colophon-sync.mjs`, `tools/record-measurements.mjs`, `tools/measurements.json`. check-network and check-nu were kept. QUAL-06 is struck through in REQUIREMENTS.md with "사용자 요청으로 Colophon 섹션 삭제 (2026-11-17)" and the traceability row says Removed.

## Verification
- `grep -ri colophon index.html css/ package.json .github/ README.md tools/*.mjs tools/*.json`: no matches.
- `npm run check`, `check:ui`, `check:layout`, `check:source` (site 62 / excluded 18 / unmapped 0), `check:artifact` (280 files clean), `npm run pdf`: all exit 0, no flakes hit.
- PDF: 7 pages (limit 8), 593,607 bytes, phone gates and page plan PASS.
- Screenshots (inspected, in gitignored `dist/contact-cat/`): `contact-375.png` (cat below heading, centred), `contact-1440.png` (cat beside heading, unchanged), `page-bottom-375.png` (page ends at Contact then the copyright line, no Colophon).

## Deviations
None. ROADMAP.md and STATE.md were left untouched as instructed (they still mention Colophon in historical Phase 5 entries).
