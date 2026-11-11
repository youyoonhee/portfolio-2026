---
phase: 02-pdf-spike
verified: 2026-11-11T00:00:00Z
status: passed
score: 5/5 roadmap success criteria verified
overrides_applied: 0
re_verification: false
gaps: []
human_verification: []
---

# Phase 2: 디자인 시스템과 반응형 + PDF spike Verification Report

**Phase Goal:** 채용 담당자가 어떤 화면 폭에서든 단정한 미니멀 디자인의 페이지를 읽고, 특정 회사의 담당 업무와 기여도를 10초 안에 찾을 수 있다 (plus the PDF spike, SC5)
**Status:** passed
**Re-verification:** No, initial verification

## Commands run by the verifier

| Command | Result |
|---|---|
| `npm run check` | exit 0: validate, check-content, check-repo (261 files clean), selftest 80 passed, history clean (354 blobs), contrast all PASS |
| `npm run check:source` | exit 0: source-reverse, source-numbers, source-coverage (site 65 / excluded 14 / unmapped 0) PASS |
| `npm run check:layout` | exit 0: 48 PASS lines, 0 FAIL, at 375/768/1440 |
| `npm run pdf:spike` | exit 0: 9 pages, 142,639 bytes, Type3 0, FontFile2 2, 5 PASS lines |

`git status` was clean after the runs. Only `dist/` was written, and it is gitignored.

## Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Pretendard self-host, wide whitespace, one accent colour, `@layer` CSS, no kit CSS loaded | VERIFIED | check:layout `fonts: family Pretendard, check true, woff2 requests 23, third-party 0` at all three widths. `css/layers.css` declares the layer order. `@import` is absent from css/. Taste-checker result and waivers are recorded in 02-TASTE-REPORT.md. |
| 2 | 375/768/1440 have no horizontal scroll, Korean breaks by word, long URLs and emails do not overflow, and screenshot slots have portrait (app) and landscape (web) frames | VERIFIED | Overflow check scrollWidth equals the viewport at all three widths. Grid columns are 1/2/3. Equal-height cards, tap targets >= 44px, and the keyword section's 3 blocks all pass. |
| 3 | WCAG 2.2 AA text contrast, with measured values | VERIFIED | check:contrast 13 PASS. The lowest text ratio is 4.90:1 (accent on tint). Non-text is 3.18:1. |
| 4 | 10-second test | VERIFIED (user approval) | The user approved on 2026-11-11 and this is recorded in 02-CHECKS.md. Per-task seconds were not recorded, which the caller said to treat as accepted. check:layout supports it structurally: anchors from the company and keyword entries land 15-16px below the header, and the meta (role and contribution) is fully visible without hovering. |
| 5 | PDF spike: page size, TrueType embedding, lazy images and motion, decision recorded | VERIFIED | Reproduced: A4 portrait, 9 pages, Type3 0, CIDFontType2/FontFile2 only (Pretendard-Regular/SemiBold), ToUnicode 2, Korean extraction 13/13 projects and 3/3 keywords with U+FFFD 0, links 7 (mailto 2), no browser chrome, no card split across pages (13 cards), phone guard PASS. The decisions are in 02-PDF-SPIKE.md. The user accepted 9 pages. |

**Score:** 5/5

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| DSGN-01 | SATISFIED | SC1 evidence. REQUIREMENTS.md is marked Complete. |
| DSGN-02 | SATISFIED | SC2 evidence. Overflow, word-break and URL/email wrapping are checked at three widths. |
| DSGN-04 | SATISFIED | SC4. Based on user approval plus structural evidence. |
| DSGN-05 (layout/static only) | SATISFIED | 3 keyword blocks are visible at 375/768/1440, `check-content` keywords PASS, and the list-to-card anchors are checked. Scroll switching is Phase 3 and out of scope. |
| QUAL-03 | SATISFIED | check:contrast |
| DSGN-03 | Not in Phase 2 (Phase 3, Pending) | Not an orphan. REQUIREMENTS.md maps it to Phase 3. |

No orphaned requirement IDs. The REQUIREMENTS.md traceability table maps only these five to Phase 2.

## Code review (02-REVIEW.md) assessment

| ID | Does it make a Phase 2 requirement unmet today? | Notes |
|---|---|---|
| CR-02 (source-reverse skips Hangul-only text) | No. It hides no CONT-06 violation. | I ran a temporary copy of check-content.mjs with the skip line changed to `!/\p{L}/u.test(n)`, so Hangul-only strings are compared against the source text. `source-reverse`, `source-numbers` and `source-coverage` all still PASS, so every visible Hangul string sits in the source. The copy was deleted and the repo is unchanged. The tool weakness remains a Phase 1 tool defect. Recommend fixing the line. |
| CR-01 (backslash bypass in the static server) | No. | It affects only the local loopback tool used by check-layout. The deployed site is unaffected. Recommendation: apply the review fix, because the denylist guards `private/`. |
| WR-05 (no-JS header wrap) | No, within the claimed widths. | check:layout measures the live `.site-header` `getBoundingClientRect().bottom` and requires the anchor offset to be between -0.5 and 32.5px. It reports header 112.0 at 375 and 768 and 72.0 at 1440, with offsets of 15.5-16.5px for hash and link-click anchors. This proves the anchors land below the header at 375 and 768 at default font size. It does not cover 320px or enlarged browser fonts, where the nav can wrap. Treat that as a recommendation, to be handled together with the Phase 3 hamburger. |
| Other WR/IN items | No | Recommendations only. |

## Anti-patterns

No TBD/FIXME/XXX debt markers were found in the checked paths (check-repo is clean). No phone-like strings appear in the public tree (check-repo, history and the PDF guard all pass).

## Human verification

None remaining. The user approved the 375/768/1440 design, the 10-second test and the spike PDF on 2026-11-11.

## Recommendations (non-blocking)

1. Fix the `source-reverse` regex (CR-02) and the backslash handling in `tools/lib/static-server.mjs` (CR-01) before they are relied on in Phase 5.
2. Make the no-JS nav robust at 320px or with a larger font size (WR-05), together with the Phase 3 header work.
3. Phase 3: remove the footer-only final PDF page (noted in 02-CHECKS.md).
4. The 10-second test has no per-task timings. Record them if the test is repeated.

## Gaps Summary

None. The phase goal and the SC5 spike are met in the codebase, and the checks were reproduced independently.

---

_Verified: 2026-11-11_
_Verifier: Claude (gsd-verifier)_
