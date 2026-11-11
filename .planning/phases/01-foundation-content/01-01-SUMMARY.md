---
phase: 01-foundation-content
plan: 01
subsystem: tooling-privacy-html
tags: [walking-skeleton, privacy, tooling, html]
requires: []
provides:
  - pre-commit phone-number guard (check-repo, PHONE_RE export)
  - manifest-driven content check engine (check-content)
  - index.html skeleton with real cover, Contact, footer
affects: [01-02, 01-03, 01-04]
tech-stack:
  added: [html-validate 11.21.0, serve 14.2.7, linkinator 8.1.0]
  patterns: [node built-ins only for tools, manifest as source-of-truth table, hand-parsed HTML tokenizer]
key-files:
  created:
    - package.json
    - package-lock.json
    - .gitattributes
    - .htmlvalidate.json
    - .githooks/pre-commit
    - tools/check-repo.mjs
    - tools/check-content.mjs
    - tools/content-manifest.json
    - index.html
  modified: []
key-decisions:
  - "Hook via core.hooksPath set by npm prepare; no husky"
  - "Check failures never print matched phone-like strings"
  - "Missing manifest keys SKIP the check so later plans enable it by adding keys"
requirements-completed: [BASE-01, BASE-02, BASE-03, BASE-04, CONT-01, CONT-07, QUAL-01]
duration: ~20min
completed: 2026-11-11
---

# Phase 1 Plan 01: Walking Skeleton Summary

Phone-number pre-commit guard, manifest-driven content checker and a real cover/Contact/footer `index.html` that passes `npm run check` on Node 22.23.4.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 privacy boundary + tooling | 9e0840f | self-test 25 passed, history clean, 5 ignore paths OK, hook blocks a runtime-built phone-like string (exit 1) |
| 2 check engine + manifest (RED) | f0b886b | `FAIL load: index.html not found`, exit 1 |
| 3 index.html (GREEN) | 8ed8aa9 | `npm run check` and `check-content --require-source` pass (16 checks incl. source-reverse/numbers); local server response contains hero and email |

## Deviations from Plan

None. Package repositories were verified with `npm view` before install (gitlab html-validate, vercel/serve, JustinBeckwith/linkinator). npm reformatted package.json (indentation) after install; content unchanged.

## Known Stubs

Empty hidden `data-slot="phone"` is intentional (filled by the Phase 3 PDF build only).

## Notes

- npm reported audit warnings for dev dependencies; devDependencies are not deployed. Not addressed.
- Git warns about LF to CRLF on Windows; `.gitattributes` forces LF for hook and .mjs files.

## Self-Check: PASSED
