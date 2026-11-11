---
phase: 02-pdf-spike
fixed_at: 2026-11-11T22:00:00Z
review_path: .planning/phases/02-pdf-spike/02-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-11-11
**Source review:** .planning/phases/02-pdf-spike/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (CR-01, CR-02, WR-01 to WR-07)
- Fixed: 9
- Skipped: 0

The fixes were applied in the main working tree, not in a separate worktree. `node_modules`, the gitignored source text and the dev server only exist there, and the caller asked for it.

## Fixed Issues

### CR-01: Static server denylist bypass via backslash (Windows)
**Files modified:** `tools/lib/static-server.mjs`, `package.json`, `tools/spike-pdf.mjs`
**Commit:** f06e905
**Applied fix:**
- Paths are split on both `/` and `\`.
- Segments are rejected if they start with `.`, end in `.` or a space, or contain NUL, `:` or other reserved characters.
- The denylist is now private, _screenshots, node_modules, dist, out, .planning, .git, .taste-skill and .private, matched case-insensitively.
- The resolved path and the `realpath` are both checked with `path.relative` against the root. The comparison is case-insensitive on Windows.
- `--self-test` has 17 browserless cases, including `%5C`, literal `\`, trailing dot and space, `%2e%2e`, ADS and NUL. It runs against a temp root outside the repo and is wired into `npm run check` as `check:server`.
- `startStaticServer(root, { allow })` re-permits denylisted segments. `spike-pdf` passes `allow: ['dist']` because the lazy-fixture is served from `dist/`.

### CR-02: source-reverse check skipped all Hangul-only text
**Files modified:** `tools/check-content.mjs`
**Commit:** e4dfc06
**Applied fix:** the skip test is now `!/\p{L}/u.test(n)`. `npm run check:source` still passes, with no allowlist changes.
**Status:** fixed, requires human verification (logic change in a check).

### WR-01: check-layout cleanup killed its own PowerShell
**Files modified:** `tools/check-layout.mjs`
**Commit:** dd0bac2
**Applied fix:**
- The cleanup runs `taskkill /T /F` on the launcher first.
- The PowerShell filter now requires `ProcessId -ne $PID`, an image name of `msedge.exe` or `chrome.exe`, and the profile tag in the command line.
- The profile removal retries 5 times and warns if it still fails.

### WR-02: spike-pdf cleanup unreliable on Windows
**Files modified:** `tools/spike-pdf.mjs`
**Commit:** 004a5b1
**Applied fix:**
- Windows uses `taskkill /T /F`. POSIX keeps the process-group kill.
- `error` and `exit` handlers were added. A non-zero exit or a spawn error stops the wait early. A zero exit does not, because the launcher may hand off to the real browser.
- `rmSync` failures are logged with `console.warn` and no longer crash.
- `--url` values starting with `-` are rejected.
- The lazy fixture is written only when `--url` is not given.
- A synchronous spawn throw, such as EFTYPE, still ends the run with a stack trace and exit code 1. The `finally` block cleans up the profile.

### WR-03: Static server Host header and methods
**Files modified:** `tools/lib/static-server.mjs`
**Commit:** f06e905 (same commit as CR-01)
**Applied fix:** only `Host: 127.0.0.1:<port>` or `localhost:<port>` is accepted (403 otherwise). Only GET and HEAD are allowed (405 otherwise). Both cases are in the self-test.

### WR-04: check-layout port collision and hard-coded fixtures
**Files modified:** `tools/check-layout.mjs`
**Commit:** 6429b56
**Applied fix:**
- The browser is launched with `--remote-debugging-port=0`. The port is read from `<profile>/DevToolsActivePort`.
- The company count, the card count and the keyword block count come from `content-manifest.json`.
- The fixed sleeps were replaced with polling: navigation and readyState, document height stability, and `scrollY` settling after an anchor jump.

### WR-05: no-JS header wraps
**Files modified:** `css/components.css`, `tools/check-layout.mjs`
**Commit:** 29863c3
**Applied fix:**
- The no-JS nav list is `nowrap` with `overflow-x: auto` and a hidden scrollbar. Links use `white-space: nowrap` and `flex: none`, so the header stays at its fixed 112px.
- check-layout now also runs a 320x812 viewport. All 320px assertions pass: the anchor offset is about 16px and the header measures 112.0.

### WR-06: copy-fonts deleted outputs before validating inputs
**Files modified:** `tools/copy-fonts.mjs`
**Commit:** df1072f
**Applied fix:**
- All sources are validated first: 92 subset files per weight, the CSS and TTF files, and the license file.
- `FONT_OUT` must resolve inside the repo or the OS temp dir.
- Output generated with `FONT_OUT=<temp>` is byte-identical to the committed `fonts/` and `css/fonts*.css`.
- `node tools/copy-fonts.mjs` against the repo root segfaults in this environment (Node 22.23.4, Windows). It crashes the same way on the original script, which I checked with a stash. It leaves the repo untouched. I did not investigate further.

### WR-07: img reset keeps no aspect ratio
**Files modified:** `css/reset.css`
**Commit:** e56f890
**Applied fix:** `img, video { block-size: auto }` in the reset layer. `max-inline-size: 100%` was already present. Later layers, such as `.shot img`, still override it.

## Skipped Issues

None. The four Info findings are out of scope for `fix_scope: critical_warning`.

## Verification

- `npm run check`: pass (includes the new `check:server`).
- `npm run check:source`: pass.
- `npm run check:layout`: pass at 320, 375, 768 and 1440.
- `npm run pdf:spike`: pass, writes only to `dist/`.
- `git status`: clean.
- No headless Edge processes remain, and no temp profiles are left (`layoutprof-*`, `spike-pdf-profile-*`).
- I deleted old orphaned profiles from before the fix.

---

_Fixed: 2026-11-11_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
