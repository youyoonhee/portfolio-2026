---
phase: 03-pdf
fixed_at: 2026-11-12T00:00:00Z
review_path: .planning/phases/03-pdf/03-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-11-12
**Source review:** .planning/phases/03-pdf/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### WR-01: Puppeteer DEBUG logging would print the phone number

**Files modified:** `tools/build-pdf.mjs`, `tools/check-build-pdf.mjs` (new), `package.json`
**Commit:** c1ae38e
**Applied fix:** `build-pdf` refuses to run when `DEBUG` matches `/puppeteer/i`, before the contact file is read. Added `npm run check:pdfguard`, which uses a fake contact built at runtime in the OS temp dir.

### WR-02: Placeholder `phone.label` accepted

**Files modified:** `tools/build-pdf.mjs`, `tools/check-build-pdf.mjs`
**Applied fix:** `label` must be a string and must not start with `<`. Test case added.

### WR-03: Failed-verification PDF stays at the submission filename

**Files modified:** `tools/build-pdf.mjs`
**Applied fix:** If `pdf-report` exits non-zero, the output PDF is removed before exit.

### WR-04: Image-name process sweep in check-layout

**Files modified:** `tools/check-layout.mjs`
**Applied fix:** Removed the PowerShell sweep. Only `taskkill /PID <pid> /T /F` and the temp-profile removal remain.

### WR-05: Forced-kill leaks Chrome temp profile

**Files modified:** `tools/lib/browser.mjs`
**Applied fix:** `launchChrome` creates `userDataDir` with `mkdtemp` under the OS temp dir. `closeBrowser` removes it in `finally`, after a forced kill too. A failed launch also removes it.

### WR-06: Keyword switch index computed before tall layout

**Files modified:** `js/main.js`
**Applied fix:** `enableSwitch` sets `data-switch="on"` and forces layout before the first `setActive(scrollIndex())`. Logic change, requires human verification (check:ui passes).

### WR-07: Runtime error in main.js leaves `html.js` set

**Files modified:** `js/main.js`
**Applied fix:** The body of `main.js` is now wrapped in `init()` inside try/catch. On any exception it removes the `js` class from `<html>`, removes the overlay, and clears the switch and header state, so the no-JS fallback applies. The inline head script is unchanged. Logic change, requires human verification.

## Info fixed (optional)

### IN-01: Error text and override path

**Files modified:** `tools/build-pdf.mjs`
**Applied fix:** Messages name the real contact file (basename plus "PDF_CONTACT_FILE" when overridden). A warning is printed when the override is inside the repo and not gitignored (`git check-ignore`).

Other Info items (IN-02 to IN-05) were out of scope.

---

_Fixed: 2026-11-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
