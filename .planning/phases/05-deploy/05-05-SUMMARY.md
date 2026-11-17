---
phase: 05-deploy
plan: 05
subsystem: release-gate
tags: [release-candidate, ci, d-04, screenshots-gate]
requires: [05-03, 05-04, 04-HUMAN-UAT test 1]
provides: [verified release candidate on real screenshots, green CI build with deploy skipped, 05-HUMAN-UAT checklist]
affects: [05-06]
key-files:
  created: [.planning/phases/05-deploy/05-HUMAN-UAT.md]
  modified: []
decisions:
  - "Local linkinator reports 2 expected 404s (canonical and og:image URLs on the not-yet-enabled Pages site); they resolve once Pages is on (05-06)"
metrics:
  tasks: 3
  completed: 2026-11-17
requirements: [QUAL-04, QUAL-05, DEPL-01]
---

# Phase 5 Plan 05: Release candidate gate Summary

Release candidate verified locally twice (before and after real screenshots) and in CI (build success, deploy skipped); Pages remains off.

## Tasks

| Task | Result | Commit |
|------|--------|--------|
| 1. Pre-screenshot gate + 05-HUMAN-UAT | done | b07df8b |
| 2. D-04 screenshot gate + push consent | resolved | 7677508 (screenshots), 4951633 (UAT passed) |
| 3. Re-run gate, push, confirm CI | done | push eee6496..4951633 |

## Task 2 checkpoint

- 04-HUMAN-UAT test 1 is `result: passed` (4951633); real screenshots published in 7677508 after the user approved the drafts in chat ("초안대로 승인").
- Push consent, verbatim from chat on 2026-11-17: "푸시 동의".
- Quick task 261117-fxc (KN intros, 로드필 and 링크알바 removed, 11 projects) landed between Task 2 and Task 3. In 7677508 the check-images and optimise-images self-tests, the check-ui fixture and the check-layout app measurement were adjusted for the real published shots.

## Task 3 gate results (on real screenshots)

- check (incl. check-artifact run inside): `check-repo: 257 file(s) clean`
- check:artifact: `check-artifact: 257 file(s) ok`; self-test 15 passed
- check:layout: PASS at 1024/1264/1440 shot-sizes (web max 252/332/332, app max 88.2/116.3/116.3)
- check:ui: all passed (keyword-focus flake did not occur)
- check:source: all passed (site 62 / excluded 18 / unmapped 0)
- check:links (linkinator, --check-css --check-fragments): scanned 260 links, 2 broken, both expected: `https://youyoonhee.github.io/portfolio-2026/` and `.../img/og-card.png` (404 until Pages is enabled)
- check-network: `network: 0 failing requests` (Chrome/157.0.8103.78)
- check-nu on 404.html: `nu: 0 error(s), 0 warning(s)`
- `dist/site/img/projects`: 52 files; `check-repo --dir dist/site`: 257 file(s) clean; `check-repo --history`: passed (also by pre-push hook)
- `npm run pdf`: 7 pages, 407,031 bytes (limit 5,000,000), phone present and tel link matches, outline and tags OK (contact file never opened)

## CI

- `git push origin main` (pre-push hook passed, no hook bypass, no force): eee6496..4951633
- Run id 44016313006, head SHA 4951633bfc41c7a219cd669a7e3bd66e456e0e67
- Job `build` = success; job `deploy` = skipped
- `gh api repos/youyoonhee/portfolio-2026/pages` still returns Not Found (Pages not enabled)

## Deviations from Plan

None in code. Note: the linkinator exit code is 1 only because of the two expected not-yet-published URLs above.

## Known Stubs

None added. 05-HUMAN-UAT items remain pending by design (iOS real device, Edge visual, og-card, final public check).

## Self-Check: PASSED
