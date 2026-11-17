---
phase: 05-deploy
plan: 06
subsystem: deploy
tags: [github-pages, deploy-1, live-checks, lighthouse, uat]
requires: [05-05]
provides: [live Pages site (deploy 1 + re-deploy), dist/live reports, 05-HUMAN-UAT results]
affects: [05-07]
key-files:
  created: []
  modified: [.planning/phases/05-deploy/05-HUMAN-UAT.md, index.html]
decisions:
  - "iOS Safari recorded as gap (기기 없음); Colophon keeps `iOS Safari · 실기기 확인 전`"
  - "Edge recorded as skipped (자동화 점검 완료): Edg/157.0.4341.60, 0 failing requests"
metrics:
  tasks: 3
  completed: 2026-11-17
requirements: [DEPL-01, DEPL-02, DEPL-03, QUAL-04, QUAL-05]
---

# Phase 5 Plan 06: Live deploy and measurement Summary

Pages enabled with source GitHub Actions, deploy 1 and one corrective re-deploy are live at https://youyoonhee.github.io/portfolio-2026/ and measured with check-preview, check-network (Chrome and Edge), linkinator, Nu and Lighthouse 13.6.0; iOS Safari is recorded as a gap.

## Approvals and user replies (verbatim)

- Task 1: "approved: enable pages" (enable Pages + deploy 1).
- Re-deploy: "approved: redeploy" (fresh chat approval after the Nu defect fix).
- Task 3: "기기없음" (no iOS device) -> test 3 `gap (기기 없음)`; item 10 messenger preview also untested.
- Test 1 (og-card) stays `[pending]`: the user has not given their own verdict.

## Deploy 1

- Pages enabled (build_type workflow); dispatch run 44017488503, build and deploy success; live 200.
- Live checks: preview PASS, Chrome/157 network 0 failing, Edge Edg/157.0.4341.60 0 failing, linkinator 259 links 0 non-OK, Nu 404 0 errors, robots 2 lines, noindex 1 on index and 404, forbidden paths 404 x4, live phone scan clean.
- Nu on index: 1 error (see deviation). Lighthouse was not run on deploy 1.

## Re-deploy

- Run 44019615286 on head b995282, build and deploy success; live 200.
- Preview URL mode PASS; Chrome/157.0.8103.78 0 failing + probe-404 OK; Edge Edg/157.0.4341.60 0 failing; linkinator 259 links 0 non-OK; Nu index 0 errors; Nu nested 404 0 errors; robots 2 lines; noindex 1 on index and 404; forbidden paths 404 x4; live phone scan clean (2 files).
- Lighthouse 13.6.0 mobile x3: performance 83/73/84 (median 83), accessibility 100, best-practices 100, SEO 63 (median 63). `is-crawlable` score 0 in all three runs (expected: noindex), so the Colophon SEO note applies.

## Deviations from Plan

**1. [Rule 1 - Bug] Deploy-1 Nu charset error**
- **Found during:** Task 2 live checks
- **Issue:** Nu reported 1 error on index: meta charset beyond the first 1024 bytes, because a long template comment preceded `<head>`.
- **Fix:** moved the comment below `<meta charset>`; added a check-artifact `charset-late` rule.
- **Commit:** b995282; re-deployed as run 44019615286 after "approved: redeploy"; Nu index 0 errors.

## Task 3 outcome

- Test 2 Edge: `result: skipped (자동화 점검 완료)`.
- Test 3 iOS: `result: gap (기기 없음)`, items 1-10 not tested.
- UAT Summary: total 4, pending 2 (tests 1 and 4), skipped 1, gaps 1.
- Gaps: iOS real device, messenger preview (KakaoTalk scrape and OG preview unconfirmed), Edge visual check.
- Task 3 node verify exits 0.

The link must not be shared before deploy 2 and final check (test 4).

## Known Stubs

None.
