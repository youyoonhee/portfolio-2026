---
phase: 01-foundation-content
fixed_at: 2026-11-11T00:00:00Z
review_path: .planning/phases/01-foundation-content/01-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 12
skipped: 0
status: all_fixed
---

# Phase 1: Code Review Fix Report

**Source review:** `.planning/phases/01-foundation-content/01-REVIEW.md`
**Iteration:** 1
**Scope:** critical_warning (IN-01, IN-02 out of scope)

**Summary:** 12 in scope, 12 fixed, 0 skipped. Several findings share one file, so they were committed together where the edits were inseparable (see commits). Work was done in the main working tree rather than a separate git worktree, because the gitignored source text and `node_modules` that the checks need do not exist in a fresh worktree.

## Fixed Issues

### CR-01: PHONE_RE misses plausible phone formats
**Files:** `tools/check-repo.mjs` | **Commit:** 5fde59b
Replaced `PHONE_RE` with `hasPhone()` / `hasPhoneAnywhere()`. Input is normalised first (HTML entities decoded in two passes, NFKC, zero-width and invisible characters stripped). Strict-context Hangul digits (a Hangul mobile prefix such as the spelled-out 010 followed by 7 to 8 more Hangul digits) are mapped to digits. The matcher then takes an optional +82/82 prefix (with an optional 0) or a leading 0, then 01[016789], then 7 to 8 digits separated by any run of 0 to 4 non-alphanumerics. Whole-document variants (lines joined, tags removed with and without a space) are also scanned. `--self-test` now has 80 cases built at runtime (string pieces, `String.fromCodePoint` full-width digits, entity codes, zero-width spaces, Hangul digits, UTF-16 buffers) plus negatives (dates, 50:50, ranges, ordinary Korean words). The matcher flags the phone line in the real source file and 0 lines in the site. Requires human verification (logic).
Known limitation: a prefix with mixed Arabic and Hangul digits (for example "010-" followed by Hangul digits) and digit-lookalike letters (O, l) are not detected. Mixing was left out to avoid false positives.

### CR-02: Scans fail open
**Files:** `tools/check-repo.mjs` | **Commit:** 5fde59b
Unreadable files now count as errors. Files are read as buffers and decoded as UTF-8, UTF-16 LE/BE (with BOM, or without a BOM by NUL-position heuristic). NUL-containing files that are not UTF-16 are errors unless the extension is allowlisted (png, jpg, jpeg, gif, webp, avif, ico, woff, woff2, ttf, otf) AND the magic bytes match; otherwise they fail closed.

### WR-01: Hook not executable, no pre-push
**Files:** `.githooks/pre-commit`, `.githooks/pre-push` | **Commit:** d918eeb
Both hooks are mode 100755 in the index. The new pre-push runs the self-test, the full-tree scan, the history scan and, when the source exists locally, `check-content --require-source` (with a visible warning when it does not). The pre-commit also runs the self-test. CI backstop is **deferred to Phase 5** (deployment) as instructed.

### WR-02: prepare script
**Files:** `package.json`, `tools/install-hooks.mjs` (new) | **Commit:** 4569e51
`prepare` now runs `tools/install-hooks.mjs`: it sets `core.hooksPath`, prints a WARNING if that fails (git missing or not a checkout) and never fails `npm install`. `core.ignorecase false` was removed from the script, and the local `core.ignorecase` setting that the old script had written was unset.

### WR-03: History blind spots
**Files:** `tools/check-repo.mjs` | **Commit:** 5fde59b
`--history` now scans commit messages, author and committer names and emails (the configured `user.email` is exempt), ref names and tag annotations, every reachable object path, and every reachable blob (via `rev-list --objects --all`, decoded like the tree scan). Scanning blobs instead of diff lines removes the `++` header problem and covers merge commits, renames and UTF-16 files.

### WR-04: File names not scanned
**Files:** `tools/check-repo.mjs` | **Commit:** 5fde59b
Tracked/staged paths are tested with `hasPhone`; history paths too.

### WR-05: FORBIDDEN and .gitignore paths
**Files:** `tools/check-repo.mjs`, `.gitignore` | **Commits:** 5fde59b, 4d247d0
`FORBIDDEN` matches `_screenshots`, `private`, `.private`, `out`, `dist` and `.taste-skill` at any depth, plus `.planning/source/`. `out/`, `.private/` and `.taste-skill/` were added to `.gitignore`.

### WR-06: Coverage check could echo digits
**Files:** `tools/check-content.mjs` | **Commit:** 925279e
Unmapped-source output hides phone-like lines and replaces every digit with `#` in any printed snippet.

### WR-07: Self-test and history not routine
**Files:** `package.json` | **Commit:** 4569e51
Added `check:selftest`; `npm run check` now runs validate, content, repo, selftest and history.

### WR-08: Silent source skips
**Files:** `tools/check-content.mjs`, `.githooks/pre-push` | **Commit:** 925279e, d918eeb
A prominent WARNING (count of skipped checks and the `check:source` hint) is printed when source checks are skipped; exit stays 0 on normal clones. `check:source` (`--require-source`) already existed and is run by pre-push when the source exists locally.

### WR-09: Weak source checks (cheapest real improvement)
**Files:** `tools/check-content.mjs` | **Commit:** 925279e
`source-reverse` now matches each site text against a single source line or a window of up to 3 consecutive lines instead of the whole source. `source-numbers` builds its allowed set from source lines that are not phone-like. The current site still passes.
Not done (documented): per-project numeric checks against the manifest, and a minimum-length or whole-token rule for very short texts.

### WR-10: Phone check on split/encoded text
**Files:** `tools/check-content.mjs` | **Commit:** 5fde59b
The `phone` check also tests the whole-document text (including hidden elements) and the tag-stripped, entity-decoded, line-joined HTML.

## Verification
- `npm run check` (validate, content, repo, selftest, history): pass.
- `node tools/check-content.mjs --require-source`: pass (source-coverage unmapped 0). Exits 1 if the source is absent.
- `git grep` for phone patterns: no matches.
- Hook proof: a temporary file with a runtime-built phone string was staged; `git commit` was rejected by the hook (exit 1, "phone-like pattern", no digits printed). The file was then unstaged and deleted; the tree is clean.

## Skipped Issues
None.

---

_Fixed: 2026-11-11_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
