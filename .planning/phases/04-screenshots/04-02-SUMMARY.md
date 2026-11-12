---
phase: 04-screenshots
plan: 02
subsystem: image-audit
tags: [check-content, check-images, exif, pre-commit, approval-gate]
requires: ["04-01"]
provides:
  - "check-content shots check + relaxed slots check (empty+aria-hidden or a.shot-link), --html/--only flags"
  - "tools/check-images.mjs output audit (--fast zero-dependency mode for pre-commit)"
  - "npm run check includes check:images"
affects: [04-03]
tech-stack:
  added: []
  patterns: ["container-level JPEG/WebP metadata audit independent of the converter", "fresh-copy negative cases in a temp tree"]
key-files:
  created:
    - tools/check-images.mjs
  modified:
    - tools/check-content.mjs
    - tools/optimise-images.mjs
    - package.json
    - .gitattributes
    - .githooks/pre-commit
decisions:
  - "check-images imports sharp only via dynamic import in full mode, so the pre-commit --fast path has no dependencies"
  - "Failure output carries only the relative path and rule token, never manifest values"
metrics:
  tasks: 2
  completed: 2026-11-12
---

# Phase 4 Plan 02: Image audit and markup checks Summary

check-content now accepts exactly two figure shapes (empty with aria-hidden, or a.shot-link > picture > source+img) and verifies alt, size attributes, srcset files and the accessible name. The new check-images audits every public file under img/projects for metadata, approval, naming, references and size, and runs in `npm run check` and in pre-commit.

## Tasks

| # | Task | Commit |
|---|------|--------|
| 1 | check-content: shots check, slots relaxed, --html/--only; self-test group `content` | 8f88b79 |
| 2 | check-images.mjs, check:images script, pre-commit hook, gitattributes | 9ff2f1d |

## Verification

- `node tools/check-content.mjs`: `PASS shots (0 filled, 13 empty)`; `--require-source` still passes.
- `node tools/optimise-images.mjs --self-test`: PASS markup, parsers, pipeline, validation, content (4 broken copies exit 1).
- `node tools/check-images.mjs`: `0 projects, OK`; `--self-test`: 30 passed (metadata, draft/missing approval, orphan, unknown folder, bad names, PNG as .jpg, html size mismatch, oversize, phone-like manifest text, dangling ref; fast and full).
- `npm run check` exit 0.

## Deviations from Plan

None. One test fix: the uppercase-name case uses `GI-event-481.jpg` because Windows is case-insensitive and `GI-event-480.jpg` overwrote the clean file.

## Known Stubs

None.

## Self-Check: PASSED
