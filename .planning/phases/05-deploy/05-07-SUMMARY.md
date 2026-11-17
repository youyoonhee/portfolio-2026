---
phase: 05-deploy
plan: 07
subsystem: deploy
tags: [colophon, measurements, deploy-2, deploy-3, deploy-4, release, uat]
requires: [05-06]
provides: [filled measurements record, Colophon synced to record, final live site, user release]
affects: []
key-files:
  created: []
  modified: [tools/measurements.json, index.html, tools/colophon-sync.mjs, .planning/phases/05-deploy/05-HUMAN-UAT.md]
decisions:
  - "Lighthouse is reported from the deploy-3 page (ace58d9); deploy 4 changed only the Colophon rows"
  - "iOS Safari stays `iOS Safari · 실기기 확인 전` (no device); Chrome and Edge recorded as headless"
metrics:
  tasks: 4
  completed: 2026-11-17
requirements: [QUAL-04, QUAL-05, QUAL-06, DEPL-01]
---

# Phase 5 Plan 07: Release Summary

Colophon filled by record-measurements from live reports and synced to the deployed site (deploys 2 to 4), final live checks and four phone scans clean, and the user released the site.

## Approvals and user replies (verbatim)

- Task 2: "approved: deploy 2" (push b995282..f38d19b and dispatch).
- After quick task 261117-klf: "approved: deploy 3 and 4" (deploy 3 push f38d19b..ace58d9, deploy 4 push ace58d9..39dc5c5).
- Task 4: "released" (chat, 2026-11-17), given after the final-check list, which included the og-card item. Test 1 (og-card) is therefore passed on that basis; Claude also inspected the image.

## Deploy runs

| Deploy | Run | Head | Result |
|--------|-----|------|--------|
| 2 | 44025774302 | f38d19b | build and deploy success |
| 3 | 44029631610 | ace58d9 | build and deploy success |
| 4 | 44031222808 | 39dc5c5 | build and deploy success (push run 44031165140 build success) |

Quick tasks 261117-fxc and 261117-klf landed during the phase (klf: three decorative pixel PNGs in header, cover and contact, which is why deploy 3 re-measured).

## Final measurements

- Lighthouse 13.6.0 mobile, median of 3 runs, measured on the deploy-3 page (ace58d9): performance 90 (92/90/90), accessibility 100, best-practices 100, SEO 63. SEO is 63 because `is-crawlable` fails (expected, noindex), so the Colophon SEO note applies. Lighthouse was not re-run on deploy 4: it differs from deploy 3 only in the Colophon rows.
- Nu: index 0 errors (equals recorded htmlErrors 0), nested 404 0 errors.
- linkinator: 262 links, 0 non-OK; broken links 0.
- Browsers: Chrome/157.0.8103.78 and Edge Edg/157.0.4341.60, headless, 0 failing requests, probe-404 OK; iOS Safari untested.
- measurements.json refilled by record-measurements, measuredAt 2026-11-17 (commit 39dc5c5); live Colophon equals the record (`colophon-sync --check` passes on deploys 2 and 4).

## Phone scans (counts only, all clean)

| Scan | Deploy 2 | Deploy 4 |
|------|----------|----------|
| tree | 408 files | 414 files |
| history | 694 blobs | 709 blobs |
| staged artifact | 257 files | 260 files |
| live HTML | 4 files | 5 files |

Preview PASS, noindex 1 on live index.

## Deviations from Plan

**1. [Rule 1 - Bug] colophon-sync self-test null record**
- **Found during:** deploy 2 preparation
- **Issue:** the colophon-sync self-test failed when the measurements record was null/unfilled.
- **Fix:** self-test handles a null record (tools/colophon-sync.mjs), shipped in deploy 2.

**2. Extra deploys:** plan expected one deploy; the pixel-decoration quick task forced deploy 3 (re-measure) and deploy 4 (Colophon sync), each with fresh approval.

## Gaps (recorded in 05-HUMAN-UAT.md, status partial)

- iOS Safari real device (test 3): no device, items 1-10 untested. Colophon shows `iOS Safari · 실기기 확인 전`.
- Messenger link preview (KakaoTalk scrape, OG preview): untested.
- Edge visual check (test 2): skipped, headless automation only.

UAT: total 4, passed 2 (tests 1 and 4), skipped 1, gaps 1.

## Known Stubs

None.
