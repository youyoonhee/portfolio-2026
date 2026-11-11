---
phase: 01-foundation-content
reviewed: 2026-11-11T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - index.html
  - tools/check-content.mjs
  - tools/check-repo.mjs
  - tools/content-manifest.json
  - .githooks/pre-commit
  - package.json
  - .htmlvalidate.json
  - .gitattributes
  - .gitignore
findings:
  critical: 2
  warning: 10
  info: 2
  total: 14
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-11-11
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

The review focused on the phone-leak defences and on false negatives in the content checks. index.html itself is clean: the phone slot is hidden and empty, there is no tel: link, and `format-detection` is set. The weak points are in the guard tooling.

- **PHONE_RE** only matches the strict shapes with one separator character. I confirmed by running it that common formats slip through. The scan also fails open in two places (UTF-16 files, silent `catch`).
- **Hook:** it is not executable in the index, and it is only installed by `npm install`.
- **History scan:** it does not cover commit messages.
- **Self-test:** it is not wired into `npm run check`.

No phone literal appears in this report. I generated test strings in a scratch script.

## Critical Issues

### CR-01: PHONE_RE misses plausible phone formats (verified by execution)

**File:** `tools/check-repo.mjs:9-12`
**Issue:** The separator class `S` allows at most one character, and only `- – — . whitespace`. I ran the regex against generated strings. Every one of these formats returned no match:
- parenthesised area code, such as `(010) xxxx-xxxx`
- space-dash-space, such as `010 - xxxx - xxxx`
- two or more spaces between groups
- `/`, `~`, `_` and `:` as separators
- full-width digits
- Hangul-spelled digits (`공일공-…`)
- a zero-width space inside the number
- HTML numeric entities, such as `&#48;10-…`

The source is a Korean PDF extraction, so spaced or parenthesised formats and Hangul digits are realistic. The guard exists to stop a phone-number leak, so these false negatives are blocking. The same gap defeats the "never echo" guard in `check-content.mjs:492-498`, because `PHONE_RE.test(t)` is what decides whether a line is hidden (see WR-06).
**Fix:** Normalise before matching. Apply NFKC, decode HTML entities, strip zero-width characters, then collapse every non-digit run (keeping a boundary) into a single separator. Then match on the digit stream. For example:
```js
const norm = (s) => s.normalize('NFKC').replace(/[​-‍﻿]/g, '');
const SEP = String.raw`[^\d\n]{0,3}`; // tolerate up to 3 non-digit chars, including ( ) / ~ _ :
// also add an allowance for Hangul digits: [공영]일[공영] etc.
```
Add the failing formats to `selfTest()` as positives. Run the test against a normalised copy of each line, and also against the whole file with tags removed so a phone split across tags is caught.

### CR-02: The staged and tree scans fail open

**File:** `tools/check-repo.mjs:74-75`
**Issue:**
- `catch { continue; }` skips any file for which `git show`/`readFileSync` throws, including an oversized `maxBuffer`. The privacy guard then passes silently.
- `if (txt.includes('\0')) continue;` treats every UTF-16 file as binary. Files written by Windows PowerShell `>` or Notepad "Unicode" are UTF-16 LE. A UTF-16 text file containing the number is committed unscanned, and the name check does not catch it (`notes.txt` passes `NAME_OK`).
- Reading the staged content with `encoding: 'utf8'` also mangles such files.

**Fix:**
```js
let buf;
try { buf = staged ? gitBuf(['show', `:${f}`]) : readFileSync(f); }
catch (e) { console.error(`cannot read ${f}: ${e.message}`); bad++; continue; }
let txt = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le')
        : buf.includes(0) ? buf.toString('latin1').replace(/\0/g, '') // scan anyway
        : buf.toString('utf8');
```
At minimum, fail on read errors. Also run the regex over the NUL-stripped text, or reject UTF-16 and unknown binary files outside an allowlist of image extensions.

## Warnings

### WR-01: The pre-commit hook is mode 100644 and is only installed by `npm install`

**File:** `.githooks/pre-commit` (index mode 100644), `package.json:18`
**Issue:**
- `git ls-files -s` shows mode 100644. On macOS and Linux clones git ignores a non-executable hook with only a warning.
- `core.hooksPath` is local config, so it is set only when someone runs `npm install` (`prepare`). A plain clone has no protection.
- `--no-verify` bypasses it.
- There is no pre-push hook and no CI backstop. History is never scanned automatically.

**Fix:** Run `git update-index --chmod=+x .githooks/pre-commit`. Add a `.githooks/pre-push` that runs `check-repo.mjs --history`. Add a GitHub Actions job that runs `npm run check:repo && npm run check:history`, since the repo is public and deployed from `main`.

### WR-02: `prepare` sets `core.ignorecase false` and swallows failures

**File:** `package.json:18`
**Issue:**
- On Windows and macOS, case-insensitive filesystems need `core.ignorecase true`. Forcing `false` makes git track case-only renames as separate paths and can create duplicate entries. It also contradicts the lowercase-name rule, which is meant to be enforced by the check and not by git config.
- The trailing `|| exit 0` hides a failed `core.hooksPath` setup, so the hook can be silently not installed.

**Fix:**
```json
"prepare": "git config core.hooksPath .githooks"
```
Do not touch `core.ignorecase`. Let a failure surface, or at least print a warning.

### WR-03: The history scan has blind spots

**File:** `tools/check-repo.mjs:46-52`
**Issue:**
- Only lines starting with `+` are tested. Commit messages are indented and so are skipped, and author names and emails are not tested.
- Added content lines beginning with `++` are skipped because they appear as `+++...` and are filtered out as diff headers. The `+++ b/path` header is also not checked for a number in the file name.
- Merge commits show no combined diff for clean merges.
- `--all` ignores stashes and the reflog.

**Fix:** Also scan commit metadata and path names (`git log --all --format='%H%n%an%n%ae%n%B'`, plus `git log --all --name-only`). Track the diff header state instead of using `startsWith('+++')`: the header is only valid directly after a `--- ` line. Use `-m` or `--cc`.

### WR-04: File names are never scanned for phone-like content

**File:** `tools/check-repo.mjs:67-71`
**Issue:** `NAME_OK` accepts digits and hyphens, so a file name carrying the number passes. Paths are only tested against `FORBIDDEN` and `NAME_OK`, not against `PHONE_RE`.
**Fix:** Run `PHONE_RE.test(f)` on every path and count it as a problem.

### WR-05: FORBIDDEN and .gitignore are missing paths named in CLAUDE.md

**File:** `tools/check-repo.mjs:14`, `.gitignore`
**Issue:** CLAUDE.md requires `out/` (the generated PDF with the phone number), `.private/` (the phone number source) and `.taste-skill/` to be ignored. None is in `.gitignore` or `FORBIDDEN`. The `FORBIDDEN` patterns are anchored with `^`, so a nested `foo/private/` is not caught, even though `.gitignore`'s `private/` matches at any depth. `git add -f` of such a path passes.
**Fix:** Add `out/`, `.private/` and `.taste-skill/` to `.gitignore`. Use `/(^|\/)(_screenshots|private|\.private|out|dist|\.taste-skill)\//` in `FORBIDDEN`, and add `^\.planning\/source\/`.

### WR-06: The coverage check can echo phone digits to the log

**File:** `tools/check-content.mjs:491-499`
**Issue:** The "never echoed" protection depends on `PHONE_RE`, which has gaps (CR-01). A source line with a Hangul label and an oddly formatted number is not skipped at line 492. If its label is unmapped, `line N: "<t>"` prints the digits to stdout and to any CI log. Normalisation keeps digits and `-`, so the number is intact.
**Fix:** Never print the normalised line text for source lines. Print only the line number plus the non-digit remainder (`t.replace(/\d/g, '#')`). Fix CR-01 as well.

### WR-07: The regex self-test is never run

**File:** `package.json:10-20`
**Issue:** There is no script for `--self-test`, and `npm run check` does not call it. The only regression guard for PHONE_RE never runs, and neither does `check:history`.
**Fix:** Add `"check:selftest": "node tools/check-repo.mjs --self-test"` and call it from `check`. Also put the self-test in the hook.

### WR-08: Source-dependent checks skip silently, so `npm run check` passes without verifying content

**File:** `tools/check-content.mjs:434-439`, `package.json:16`
**Issue:** `source-reverse`, `source-numbers` and `source-coverage` become `SKIP` (exit 0) when `.planning/source/portfolio-pdf.txt` is missing, which is always the case on CI and fresh clones. The "no invented facts" constraint is then not enforced anywhere except on one machine.
**Fix:** Make the skip loud, for example print a summary line with the skipped count. Document that `check:source` is the real gate before publishing.

### WR-09: The `source-reverse` check is a weak substring test

**File:** `tools/check-content.mjs:448-453`
**Issue:** Each visible text node is normalised (spaces and punctuation removed) and tested with `src.includes(n)` against the whole source. A short fragment such as a single word almost always occurs somewhere in the source, so a sentence that was invented or re-attached to the wrong project passes. `source-numbers` has the same weakness: numbers are checked against a global set, not per project. Phone digit groups in the source are also in `srcNums`, so site numbers that equal them are accepted.
**Fix:** Require a minimum length or whole-token match. Check numbers per project, such as the contribution `data` values, against the manifest. Remove phone-matching lines from `srcNums` before building it.

### WR-10: The phone check in check-content misses numbers split across tags and encoded characters

**File:** `tools/check-content.mjs:419-425`
**Issue:** `visibleTexts` holds one string per text node, so `<span>010</span>-xxxx-xxxx` is not matched. The raw-line pass does not decode entities or join across tags either. Hidden elements are only protected by the "hidden element has no text" check.
**Fix:** Also test `collapse(textIn(root))` (the whole body text, including hidden) and the entity-decoded raw HTML with tags stripped.

## Info

### IN-01: The `paths` check only tests the start of `srcset`

**File:** `tools/check-content.mjs:386-395`
**Issue:** `srcset="a.jpg 1x, /b.jpg 2x"` passes, because only the first characters are inspected. Protocol-relative `//host` URLs are accepted in `href`/`src` as well, and the `links` check ignores them since it matches only `^https?://`.
**Fix:** Split `srcset` on commas and test each URL. Treat `//` as external in `links`.

### IN-02: The leading comment block comes before `<html>` and is unrelated to the page

**File:** `index.html:2-12`
**Issue:** A 10-line authoring template sits between the doctype and `<html>`. It is valid HTML but ships to the public site and exposes internal planning terms ("D-07", "Phase 4"). The `doctype` check only reads line 1, so the arrangement works.
**Fix:** Move the template into `.planning/` or `tools/README`, or at least drop the internal references from the shipped HTML.

---

_Reviewed: 2026-11-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
