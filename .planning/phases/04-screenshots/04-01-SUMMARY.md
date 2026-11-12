---
phase: 04-screenshots
plan: 01
subsystem: image-pipeline
tags: [sharp, webp, jpeg, masking, exif, manifest]
requires: []
provides:
  - "npm run images: masked, metadata-free multi-width WebP/JPEG + figure.shot markup"
  - "tools/lib/shot-markup.mjs, image-meta.mjs, shot-fixtures.mjs"
  - "tools/screenshots.json (empty public-safe manifest)"
affects: [04-02, 04-03]
tech-stack:
  added: ["sharp 0.35.5 (devDependency, exact pin)"]
  patterns: ["status gate draft/approved", "opaque #111827 mask at rotated source coordinates", "synthetic self-test in OS temp"]
key-files:
  created:
    - tools/optimise-images.mjs
    - tools/lib/shot-markup.mjs
    - tools/lib/image-meta.mjs
    - tools/lib/shot-fixtures.mjs
    - tools/screenshots.json
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Validation errors carry a rule:<token> and the project id only, never field values"
  - "Approved project with no source folder is skipped (published output kept); draft with no folder fails"
  - "HEIC in a folder fails only when no explicit source is set"
metrics:
  tasks: 4
  completed: 2026-11-12
---

# Phase 4 Plan 01: Image conversion pipeline Summary

One command (`npm run images`) turns a screenshot in `_screenshots/<id>/` into opaque-masked, metadata-free WebP and JPEG sets and fills the matching `figure.shot`, but only for `approved` manifest entries. Drafts land in `dist/shots-preview/`.

## Tasks

| # | Task | Commit |
|---|------|--------|
| 1 | sharp 0.35.5 legitimacy checkpoint: approved by the user in chat before install | (no commit) |
| 2 | sharp install, shared libs, empty manifest, CLI shell | bffc682 |
| 3 | Failing self-test (RED): markup/parsers PASS, pipeline/validation FAIL | 0460b8d |
| 4 | Pipeline, approval gate, --only/--clear/--info/--annotate (GREEN) | 3090c47 |

## Verification

- `node tools/optimise-images.mjs --self-test`: PASS markup, parsers, pipeline, validation (exit 0).
- Real repo: `node tools/optimise-images.mjs` prints `0 projects`; `index.html` unchanged; `img/projects` absent.
- `npm run check` exit 0. No `withMetadata`/`keepMetadata` outside the fixtures file; no blur/pixelate.

## TDD Gate Compliance

test(04-01) commit 0460b8d precedes feat(04-01) commit 3090c47. RED confirmed (pipeline and validation failed, markup and parsers passed).

## Deviations from Plan

None. Task 1 was resolved by the orchestrator (user approval in chat), so execution started at Task 2.

## Known Stubs

None. The empty manifest and absent `img/projects` are intended (no screenshots yet, D-03).

## Notes for next plans

- Self-test uses the real `index.html` read-only; paths are overridden via `--src --out --html --manifest --preview`.
- Size warnings (1.5MB largest, 600KB others) are printed; enforcement belongs to 04-02 check-images.

## Self-Check: PASSED

Files and commits bffc682, 0460b8d, 3090c47 verified present.
