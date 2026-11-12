---
phase: 03-pdf
verified: 2026-11-12T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
recommendations:
  - "WR-01 DEBUG=puppeteer:* guard in build-pdf.mjs"
  - "WR-03 delete OUT when pdf-report fails"
  - "WR-04 replace name-based kill in check-layout.mjs"
  - "WR-07 add js class only after main.js verifies its nodes"
  - "check:ui failed once in four runs (flaky); investigate"
---

# Phase 3: Interaction and submission PDF - Verification Report

**Goal:** A visitor can use all content with keyboard only, without motion or JS; the user gets a same-design submission PDF (with phone) from one command.
**Status:** passed. Mode: mvp (roadmap goal is not in User Story format; verified against the goal and the 5 success criteria).

## Commands run (this session)

| Command | Result |
|---|---|
| `npm run check` | exit 0 (html-validate, content, repo, selftest, server, history, contrast all pass) |
| `npm run check:source` | exit 0, 23 PASS, source-coverage unmapped 0 |
| `npm run check:layout` | exit 0, 0 FAIL |
| `npm run check:ui` | 3 of 4 runs exit 0 with 92 PASS / 0 FAIL; 1 run exit 1 ("1 check(s) FAILED", line not captured). Not reproducible in 3 reruns. |
| `npm run pdf` | exit 0, "phone injected: yes", 16 PASS in pdf-report |

`git status` stayed clean afterward (dist/, private/ ignored). No phone digits were printed or read.

## Success criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Skip link, full Tab reach, visible focus | VERIFIED | `index.html:36` skip-link to `#main`; check:ui skip 3, focus-ring 6, keyword-focus 12 pass; contrast check has focus-ring 5.43:1 |
| 2 | Motion only hero entrance and hover; reduced-motion off; no-JS shows everything | VERIFIED | check:ui reduced 5, nojs-all 4, print-state 3, keyword-media (switch off below 1024px) pass; `js` class only toggles hidden-state styles |
| 3 | One command builds PDF; phone injected from private file only | VERIFIED | `npm run pdf` works; build-pdf fails without contact file (code path read); public index.html has empty hidden slot (check:content `slots`, `phone` PASS); `tel:` absent from index.html |
| 4 | Cover / skills+career / companies / contact; no split cards; no blank page | VERIFIED | pdf-report: page plan 4 PASS (pages 1 / 2 / 3-5 / 6), no card split (13 cards), no blank page (min 123 chars) |
| 5 | Links clickable; Korean copy/search; TrueType; no header/footer paths | VERIFIED | pdf-report: links 5/5 external + mailto, Korean extraction 13/13, chrome hidden, fonts type3 0 / FontFile2 Pretendard |

### pdffonts equivalence (SC5)

Acceptable. pdffonts lists the font dictionary type and embedding. `pdf-report.mjs` reads the same PDF objects: Type3 count 0, FontFile2 (embedded TrueType) 2, BaseFont Pretendard-Regular/SemiBold, ToUnicode 2. That proves the same property (TrueType embedded, no Type3), and the Korean extraction check covers the practical result. Only the tool differs. Suggest wording the ROADMAP line as "pdffonts or pdf-report".

## Requirements

| ID | Status | Evidence |
|---|---|---|
| DSGN-03 | SATISFIED | SC2 evidence |
| DSGN-05 (transition behavior) | SATISFIED | check:ui keywords 12, keyword-focus 12, keyword-media 6; JS-off/reduced/mobile/print expand all |
| QUAL-02 | SATISFIED | SC1 evidence |
| PDF-01 | SATISFIED | `npm run pdf` from the same index.html + print.css |
| PDF-02 | SATISFIED | phone present in PDF and tel link matches; absent from public tree and history |
| PDF-03 | SATISFIED | SC4 evidence |
| PDF-04 | SATISFIED | SC5 evidence |

No orphaned requirements. PDF-05 belongs to Phase 4 (pending, current PDF is 132 KB).

## Code review warnings: any Phase 3 requirement unmet?

None. All seven are recommendations.

- WR-01 (DEBUG=puppeteer:* would print phone to stderr): opt-in env var; default build does not leak. Recommend guard. Closest to PDF-02 but the requirement (stored outside git, injected at build) holds.
- WR-03 (failed-report PDF stays): confirmed in `build-pdf.mjs:96-111` (`rmSync` runs only when `!ok`, not after pdf-report fails). Exit code is non-zero, so the one-command contract holds; recommend removing the file.
- WR-04 (name-based kill in check-layout): breaks the project's working rule but no requirement; recommend PID-only.
- WR-07 (exception in main.js leaves nav hidden below 900px): `main.js` does unguarded queries; `onerror` covers load failure only. DSGN-03 "JS off" is satisfied (verified); runtime-exception case is an edge. Recommend fix before Phase 5 cross-browser testing (Safari).
- WR-02, WR-05, WR-06: recommendations (placeholder label, temp profile leak, initial index ordering).

## Other notes

- Anti-patterns: no unreferenced TBD/FIXME/XXX flagged by check suite.
- Human verification: user approved 03-05 items 1-8 on 2026-11-12 (recorded in `03-CHECKS.md`), so no open human items. Safari/iOS items are deferred to Phase 5 (listed in CHECKS).
- Flaky check:ui: one failing run out of four, no repro. Worth capturing the failing line next time.

_Verified: 2026-11-12 - Verifier: Claude (gsd-verifier)_
