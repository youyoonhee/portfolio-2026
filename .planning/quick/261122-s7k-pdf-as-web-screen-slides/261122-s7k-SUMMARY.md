---
quick_id: 261122-s7k
status: complete
completed: 2026-11-22
commits: [ba604a8]
---

# Quick 261122-s7k Summary: submission PDF as 16:9 slides of the desktop screen design

`npm run pdf` now prints the **desktop screen design** instead of the A4 print layout. Puppeteer opens the page at
1440x810 with screen media and reduced motion, adds `html.pdf-slides`, injects `tools/pdf-slides.css` (build time only,
never linked from index.html, not in the Pages allowlist), and prints 1440px x 810px pages (16:9). Text stays vector:
selectable, searchable, links clickable. TrueType Pretendard only (no Type3).

## Result (fake contact preview and the real build give the same layout)
- Pages: 12, MediaBox `[0 0 1080 607.91998]` (Chrome rounds 810px up by 0.56px; the check allows +/-1pt)
- Size: about 1.07MB (step 1, published JPEGs as they are), well under 5MB
- Page plan:
  1. Cover (ivory band, four circles, title, intro)
  2. Keywords step 1: "화면 너머의 경험까지 섬세하게." (1/4) Higher-Quality Service
  3. Step 2: FSD Cosmetic Website (2/4) 반응형 웹
  4. Step 3: EXAONE AI Website (3/4) 인터랙션
  5. Step 4: Oneday Insurance App (4/4) AI 활용
  6. Skills (3-column tiles)
  7. Career heading + 지아이데이타 (3 cards)
  8. 케이엔큐레이션, cards 1-3
  9. 케이엔큐레이션, cards 4-5 (continuation, 56px top room)
  10. 비스톤스 (2 cards)
  11. 애비로드 (1 card)
  12. Contact panel (email, phone injected at build) + footer
- Cards per page: 3,3,2,2,1 (11 cards, none split)

## What changed
- `tools/pdf-slides.css` (new): chrome and motion off, final states forced; cover exactly one slide; each keyword step
  is its own 810px slide built with CSS from the screen switch's values at 1440x810 (band 388.8px, line 93.312px, disc
  1353.6px, stage top 96px): top line, "(n/4)", the ink-to-white line and the white word at 0deg on the sage disc;
  steps 2-4 repeat "01 / Keywords" as generated text where the sticky stage shows it; SCROLL DOWN hidden. Skills,
  career heading with the first company, one company per slide, cards `break-inside: avoid`, 56px top/bottom room on
  every page piece of a company (`box-decoration-break: clone`); contact last with the footer. Font family switched to
  "Pretendard Print" (TTF faces from fonts-print.css).
- `tools/build-pdf.mjs`: viewport 1440x810, `emulateMediaType('screen')`, class + CSS injection, eager images, TTF
  faces loaded before measuring, paper `1440px x 810px` with `preferCSSPageSize`, `scale: 1`; default max pages 16;
  `--min-page-chars` 20 (a keyword slide holds about 35 characters). Phone injection, redaction, JPEG framing and size
  steps unchanged.
- `tools/pdf-report.mjs`: page size check is now 16:9 (1080 x 607.5pt +/-1); page plan: cover page 1, step n on page
  n+1 (word, top line and "(n/4)" checked on that page, W/L/C flags on failure), skills next, career heading with the
  first company, companies in order on their own pages, contact last; prints a one-line page plan.
- `README.md`: the submission PDF section says it is built from the screen design via `npm run pdf`; print.css stays
  for a browser's own Ctrl+P.
- Unchanged: index.html, all css/ and js/ (live site look and behaviour), css/print.css, tools/check-build-pdf.mjs
  (it has no A4 assumption).

## Problems found while inspecting the previews (and fixed)
1. **Circles squashed / squared off in the PDF.** Uncontained, Chrome fragments the oversized circles at the page
   edge while printing: the cover circles came out shifted and flat-sided, the keyword disc as a flat-topped ellipse.
   Fix: `contain: strict` on `.cover-orbs` and on `.keyword-dial` (which draws the disc).
2. **Layout at Letter width.** With only `@page size`, Chrome evaluated media queries and `vw` against the default
   paper (skills fell to 2 columns, the stage narrowed). Fix: pass `width`/`height` to `page.pdf()` as well.
3. **"(n/4)" extracted as "(/)".** The tabular-nums digit glyphs are written without a Unicode mapping. Fix: no
   `tabular-nums` on the PDF counter (one static number, no visible change).
4. Keyword stage not full bleed and the step blocks shrink-wrapped (block-level `justify-self` from the stage's
   `justify-items: center`). Fix: stage 100vw with negative margins, blocks `justify-self: stretch`.
5. Footer rule touched the contact panel: restored the 64px bottom margin.

## Verification
- `npm run check`: exit 0
- `npm run check:ui`: exit 0 (278 PASS, no FAIL)
- `npm run check:layout`: exit 0 (76 PASS, no FAIL)
- `npm run check:artifact`: exit 0 (280 files staged, no tools/ in dist/site) (stage-pages copies only allowlisted dirs; tools/ is not published)
- `npm run pdf` (real contact): exit 0, all report checks PASS, 12 pages, 1,069,293 bytes, phone present + 1 matching tel link
- Previews: `dist/pdf-slides/page-01.png` ... `page-12.png`, rendered from a fake-contact preview PDF
  (`dist/pdf-slides/preview.pdf`) through Chrome's built-in PDF viewer (headless), so they show the real PDF pages,
  not a screen approximation. All 12 inspected: no header, no opacity-0 leftovers, no cut card, no empty page, no text
  over the cover circles other than as on the web.

## Decisions left open by the plan
- CSS injected at build time (`tools/pdf-slides.css` via `addStyleTag`), not linked from index.html.
- Previews rendered from the PDF itself (Chrome PDF viewer) instead of a screen scroll by 810px, because the career
  pages break by content and a screen scroll would not match.
- Keyword pages keep the web stage's vertical rhythm (label at 96px, as under the 72px header on screen) and repeat
  "01 / Keywords" on steps 2-4 as generated text.
- Continuation room: 56px top and bottom on every company page piece.
- Images: kept the existing 960 (web) / 720 (app) JPEG pick; at 1440 a card image is about 330 CSS px wide, so they
  are about 2.9x and not soft. No larger candidate needed.
- Max pages 16, min page chars 20.
- `npm run pdf:spike` (old A4 spike, not in any verify chain) still runs pdf-report without `--fixture`, so its page
  size line now reports the 16:9 expectation; left as is.

## Notes
- `npm run check:pdfguard` (not in this verify chain) passes, but it deletes `dist/퍼블리셔 유윤희-포트폴리오.pdf`: build-pdf
  removes the previous output before validating the contact file, and the guard runs it against the default output
  path. Existing behaviour, not changed here; run `npm run pdf` again after the guard (done for this task).
- Preview helpers (gitignored, not committed): `dist/pdf-slides/build-preview.mjs` (builder copy that keeps a failed
  PDF), `dist/pdf-slides/view-pages.mjs` (Chrome PDF viewer -> PNG), `dist/pdf-slides/dump.mjs` (page text dump).

## Self-Check: PASSED
- tools/pdf-slides.css, tools/build-pdf.mjs, tools/pdf-report.mjs, README.md in ba604a8
- dist/pdf-slides/page-01.png ... page-12.png present
