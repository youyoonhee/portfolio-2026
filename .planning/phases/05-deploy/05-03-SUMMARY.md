---
phase: 05-deploy
plan: 03
subsystem: deploy
tags: [pages, ci, artifact-allowlist, privacy]
requires: [05-02]
provides:
  - tools/stage-pages.mjs allowlist copy to dist/site
  - tools/check-artifact.mjs independent verifier with --self-test
  - check-repo --dir mode
  - .github/workflows/pages.yml (verify on push, deploy on dispatch only)
affects: [05-04, 05-06]
tech-stack:
  added: []
  patterns: [allowlist staging + independent re-walk verifier, SHA-pinned first-party actions]
key-files:
  created:
    - tools/stage-pages.mjs
    - tools/check-artifact.mjs
    - .github/workflows/pages.yml
  modified:
    - tools/check-repo.mjs
    - .githooks/pre-push
    - package.json
decisions:
  - "Workflow runs check-content and colophon-sync --check in CI: their imports are node:* or local modules that import only node:*"
  - "Artifact reference check maps /portfolio-2026/ to the artifact root and compares path segments against readdir names for exact case"
requirements-completed: [DEPL-01, DEPL-02]
metrics:
  tasks: 2
  completed: 2026-11-16
---

# Phase 5 Plan 03: Pages Workflow and Artifact Gate Summary

Only allowlisted site files are staged into dist/site, independently re-verified (allowlist, noindex, exact-case references), phone-scanned, and published solely by manual workflow_dispatch.

## Tasks

| Task | Commit | Notes |
|------|--------|-------|
| 1 stage-pages, check-artifact, check-repo --dir | d627178 | 205 files staged, 15 artifact self-tests, 80 check-repo self-tests incl. --dir cases |
| 2 workflow and pre-push | 53b8021 | actions pinned to full SHAs; deploy job alone has pages/id-token write |

## Action pins (read-only gh GET)

checkout v7.0.1 3d3c42e5, setup-node v7.1.0 949feb24, configure-pages v6.0.0 45bfe019, upload-pages-artifact v5.0.0 fc324d35, deploy-pages v5.0.1 368f8252.

## Verification

- `npm run check` exit 0 (includes check:artifact: stage-pages 205 files, check-artifact 205 ok, self-test 15 passed, check-repo --dir 205 clean).
- `node tools/stage-pages.mjs tools/out` exits 2.
- Workflow assertion prints `workflow ok`.
- CI simulation in a fresh local clone (no node_modules, no push), all exit 0: check-repo --self-test (80 passed), check-repo (344 files clean), --history (596 blobs clean), check-content (all passed), colophon-sync --check (matches), stage-pages (205), check-artifact (205 ok), check-artifact --self-test (15 passed), check-repo --dir dist/site (205 clean). Clone deleted.

## Deviations from Plan

**1. [Rule 1 - Bug] Self-test fixture on case-insensitive FS:** the `uppercase-file` negative wrote `css/Base.css`, which overwrote `css/base.css` on NTFS and never failed. Changed to `css/Extra.css`. Case-mismatch coverage remains via the `ref-case` negative (lowercase-only fixture file referenced in uppercase).

## Notes

The symlink cases report SKIP on this machine (symlink creation not permitted); they run on systems that allow it. No pushes or state-changing gh calls were made. Pages stays disabled until 05-06.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED
