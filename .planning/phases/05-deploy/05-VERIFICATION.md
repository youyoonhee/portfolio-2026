---
phase: 05-deploy
verified: 2026-11-17T00:00:00Z
status: human_needed
score: 6/7 must-haves verified (QUAL-04 partial)
overrides_applied: 0
human_verification:
  - test: "iOS Safari real device (HUMAN-UAT test 3, items 1-10)"
    expected: "Pretendard renders, iOS >= 17.2, card tap, menu, zoom dialog, anchors, links, rotation/pinch, no horizontal scroll at 375px, KakaoTalk/iMessage preview shows title/description/image"
    why_human: "No iOS device was available (gap recorded). Cannot be verified by automation. Colophon correctly says 'iOS Safari · 실기기 확인 전'."
  - test: "Edge desktop visual check (HUMAN-UAT test 2, optional)"
    expected: "No layout break at full and narrow width; menu, zoom dialog, links work"
    why_human: "Only headless automation (Edg/157.0.4341.60, 0 failing requests) was run. The user skipped the visual check."
gaps: []
---

# Phase 5: Deploy Verification Report

**Phase Goal:** A recruiter who gets the link sees a site with no breakage or 404 in any major browser, can check how it was built with measured evidence, and it does not appear in search engines.
**Status:** human_needed. Everything automatable is verified. The iOS Safari real-device part of QUAL-04 was NOT tested.
**Re-verification:** No (initial).

## Observable Truths

| # | Truth (requirement) | Status | Evidence |
|---|---|---|---|
| 1 | Site is deployed on GitHub Pages from a free public repo (DEPL-01) | VERIFIED | `gh api` shows visibility=public. Live URL returns 200. Run 44031222808 conclusion=success, headSha 39dc5c52b060... (matches the claimed head 39dc5c5). |
| 2 | Not indexed by search engines (DEPL-02) | VERIFIED | Live index has `<meta name="robots" content="noindex, nofollow">`. Live robots.txt returns 200 with `User-agent: *` and `Disallow: /`. UAT live checks: noindex on index and 404. |
| 3 | Link preview metadata and favicon (DEPL-03) | VERIFIED (messenger render untested) | Live HTML has og:title/description/type/locale/url/image (1200x630, png, alt). `img/og-card.png` returns 200. User passed the og-card inspection. Actual KakaoTalk/iMessage scrape not tested (UAT gap). |
| 4 | README documents code scope, PDF build, screenshot rules (DEPL-04) | VERIFIED | README.md has sections "직접 작성한 범위", "제출용 PDF", "스크린샷 추가 규칙", plus "가져온 것", "검사", "배포". |
| 5 | Colophon shows tech, tested browsers and measured Lighthouse/validator results with date (QUAL-06) | VERIFIED | Live index lines 433-441: browsers, Lighthouse 90/100/100/63 (mobile), measured date 2026.11.17. The iOS line is honestly marked "실기기 확인 전". Orchestrator confirmed against dist/live reports that is-crawlable is the only failing weighted SEO audit and the Nu reports have 0 messages, so the review's WR-01 and WR-04 do not affect the published values. |
| 6 | Zero broken links, no 404 in the browser network after deploy (QUAL-05) | VERIFIED | UAT: linkinator 262 links 0 non-OK. Chrome/157 and Edge/157 network 0 failing. probe-404 OK. Nu index 0 and nested 404 0. Live deploy-4 re-checks pass. Both CI-recorded and live-final checks are consistent. |
| 7 | Looks the same in latest Chrome, Edge, iOS Safari (real device) (QUAL-04) | PARTIAL / UNCERTAIN | Chrome: headless automation only. Edge: headless automation only; visual check skipped. iOS Safari real device: NOT tested (no device, "기기없음"). REQUIREMENTS.md shows QUAL-04 as `[x]` Complete, which overstates the evidence. |

**Score:** 6/7 verified. The seventh is a documented human gap, not an implementation failure. The Colophon states it honestly.

## Requirements Coverage

All 7 IDs appear in PLAN frontmatter and in REQUIREMENTS.md. No orphans.

| Requirement | Plans | Status |
|---|---|---|
| QUAL-04 | 05-04, 05-05, 05-06, 05-07 | NEEDS HUMAN (iOS real device untested; Chrome/Edge automated only) |
| QUAL-05 | 05-04, 05-05, 05-06, 05-07 | SATISFIED |
| QUAL-06 | 05-02, 05-04, 05-07 | SATISFIED |
| DEPL-01 | 05-03, 05-05, 05-06, 05-07 | SATISFIED |
| DEPL-02 | 05-01, 05-03, 05-06 | SATISFIED |
| DEPL-03 | 05-01, 05-06 | SATISFIED (og meta and image live; messenger scrape untested) |
| DEPL-04 | 05-04 | SATISFIED |

## Review Notes (05-REVIEW.md, 8 warnings, advisory)

These are tool-robustness issues such as check-nu ignoring non-document-error (WR-01), the link re-check forgiving fragments (WR-02), and noindex attribution (WR-04). The orchestrator's check of dist/live reports shows the published Colophon values are accurate, so none is a blocker for the goal. Worth a follow-up hardening pass.

## Anti-Patterns

No debt-marker scan was performed on the full tree. The review reported warnings only, with no blockers.

## Human Verification Required

1. **iOS Safari on a real device.** Run UAT test 3 items 1-10, including the KakaoTalk/iMessage preview. Until this is done, keep the Colophon wording "iOS Safari · 실기기 확인 전".
2. **Edge visual check (optional).** Open the live URL in Edge at full and narrow width.

## Recommendation

Phase 5's goal is met for the delivered site: it is live, noindexed, 404-free and has a measured Colophon. The user has released the link. Treat QUAL-04 as partially satisfied. Consider changing its REQUIREMENTS.md mark to partial or pending until the iOS check is done, or accept the gap explicitly with an override.

---
_Verified: 2026-11-17_
_Verifier: Claude (gsd-verifier)_
