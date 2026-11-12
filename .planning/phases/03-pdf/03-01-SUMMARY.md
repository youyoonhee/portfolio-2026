---
phase: 03-pdf
plan: 01
subsystem: pdf
tags: [puppeteer-core, chrome, pdf, print-css, privacy]
requires: []
provides:
  - "npm run pdf: submission PDF in dist/ with the phone injected as a tel link"
  - "tools/lib/browser.mjs: launchChrome, closeBrowser (reused by check-ui in 03-03)"
  - "pdf-report --expect-phone submission mode"
affects: [03-02, 03-03]
tech-stack:
  added: ["puppeteer-core 25.17.0 (exact pin)"]
  patterns: ["phone passed only as page.evaluate argument", "all console output through redact()", "pid-scoped browser teardown"]
key-files:
  created: [tools/build-pdf.mjs, tools/lib/browser.mjs, tools/contact.example.json]
  modified: [package.json, package-lock.json, tools/pdf-report.mjs]
decisions:
  - "Stale dist PDF is removed before contact validation, so any failed build leaves no PDF"
  - "private/contact.json label is the generic word Phone; the source line had no label"
  - "serve and check:links bound to 127.0.0.1 (T-03-05)"
metrics:
  completed: 2026-11-12
  tasks: 3
---

# Phase 3 Plan 01: Submission PDF builder Summary

`npm run pdf` renders the same index.html with its print CSS in installed Chrome (puppeteer-core 25.17.0), injects the phone number from gitignored `private/contact.json` into the empty hidden slot as a `tel:` link, and writes `dist/퍼블리셔 유윤희-포트폴리오.pdf`. The log only says `phone injected: yes`.

## Package gate (Task 1)

Approved by the user ("Approve install") after `npm view puppeteer-core@25.17.0`: repository github.com/puppeteer/puppeteer, engines node >=22.12.0, license Apache-2.0, no preinstall/install/postinstall scripts, unpacked size 6.3MB.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 2 | a737bc5 | puppeteer-core exact pin, Chrome launcher, example contact file, local private/contact.json |
| 3 RED | 99f38c9 | pdf-report `--expect-phone` fails on a PDF without a phone |
| 3 GREEN | 10012da | build-pdf.mjs, `npm run pdf` exit 0 |

## Verification

- `npm run pdf` exit 0; all 9 report assertions PASS (Type3 0, A4, links, Korean text, no chrome leak, submission phone present, tel link matches, outline and tags). Current output is still 9 pages with a footer-only last page; 03-02 fixes the page plan.
- Missing file, broken JSON and placeholder contact: exit 1, zero digits in output, no PDF left in dist/.
- Success log leak check: `leak: no`.
- private/contact.json: exactly one candidate line, 11 digits, label from source: none (generic "Phone" set). `git check-ignore` confirms ignored; `npm run check` and `check:repo` pass; index.html unchanged.

## Deviations from Plan

**[Rule 2 - Safety] Stale PDF removal moved before contact validation.** The plan removes the old PDF after `loadPhone()`, so a contact failure would leave a previous PDF in dist/ (acceptance requires no PDF). Moved `rmSync` before `loadPhone()`. File: tools/build-pdf.mjs, commit 10012da.

**[Rule 3] RED baseline used `dist/spike-chrome.pdf`.** `npm run pdf:spike` uses Edge and timed out (known Pitfall 10), so the Chrome-made spike PDF served as the phone-less input.

## Notes for the user

- The :3000 dev server you already run is still bound to all interfaces. Restart it with `npm run serve` to pick up the 127.0.0.1 binding (T-03-05).

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Files tools/build-pdf.mjs, tools/lib/browser.mjs, tools/contact.example.json exist; commits a737bc5, 99f38c9, 10012da exist.
