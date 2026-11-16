---
phase: 05-deploy
plan: 04
subsystem: tooling
tags: [network-check, nu-validator, measurements, readme]
requires: [05-02]
provides: [tools/check-network.mjs, tools/check-nu.mjs, tools/record-measurements.mjs, README.md]
affects: [05-06, 05-07]
key-files:
  created: [tools/check-network.mjs, tools/check-nu.mjs, tools/record-measurements.mjs, README.md]
  modified: []
requirements: [QUAL-04, QUAL-05, QUAL-06, DEPL-04]
decisions:
  - "Edge headless automation works on this machine (Edg/157.0.4341.60, exit 0), so Edge can be recorded as headless-tested in 05-06"
metrics:
  completed: 2026-11-16
---

# Phase 05 Plan 04: Measuring instruments and README Summary

Network 4xx/5xx checker, Nu checker client, report-only measurement writer and the Korean README.

## Commits
- 46f0871 check-network, check-nu
- f0a8494 record-measurements
- (README commit) docs(05-04): add Korean README

## Results
- check-network: self-test 2 passed; local run `browser: Chrome/157.0.8103.78`, `network: 0 failing requests`.
- Edge attempt (CHROME_PATH, 60 s timeout): exit 0, `browser: Edg/157.0.4341.60`, 0 failing requests. Edge can be headless-tested.
- check-nu: self-test 4 passed (offline).
- record-measurements: self-test 9 passed; tools/measurements.json unchanged.
- README: assertion passes, check-repo clean.

## Deviations / Issues
- `node tools/check-nu.mjs --file 404.html` was NOT run. The auto-mode permission classifier blocked it as an external send to validator.w3.org. The plan sanctioned it (404.html has no personal data), but it needs user permission; it should be run once in 05-06 together with the live checks. Acceptance item "nu: 0 error(s)" on 404.html is therefore pending.
- [Rule 1] The self-test clean fixture initially failed because headless Chrome requests /favicon.ico; fixtures now declare `<link rel="icon" href="data:,">`. The checker itself stays strict.

## Self-Check: PASSED
