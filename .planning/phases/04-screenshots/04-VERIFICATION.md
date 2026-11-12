---
phase: 04-screenshots
verified: 2026-11-12T00:00:00Z
status: human_needed
score: 5/5 mechanism criteria verified; 3 criteria have content-dependent parts pending real screenshots
re_verification: false
human_verification:
  - test: "Provide real screenshots in _screenshots/<id>/, run the 04-06 review, then `npm run images -- --only <id>`, `npm run check`, `npm run pdf`"
    expected: "Real images appear in app/web frames, check-images passes, PDF stays at or under 5MB (hard limit below 10MB)"
    why_human: "No user screenshots exist yet (deferred by D-03/D-13, user approved shipping empty at 04-07). Real-image PDF size, real mask quality, and real alt text cannot be verified."
---

# Phase 4: Screenshots Verification Report

**Goal:** Visitors see real work screens in ratio-correct frames and can enlarge them; public images contain no sensitive info.
**Status:** human_needed (mechanism delivered and verified; content pending)

## Context
User has no screenshots yet and approved ("승인") shipping with all 13 frames empty at 04-07 (D-03/D-13). `img/projects/` does not exist and `tools/screenshots.json` is `{"version":1,"projects":{}}`. Judged as mechanism delivery plus synthetic-fixture verification.

## Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Received projects show real screen in app/web frames; missing ones keep intact placeholder | Mechanism VERIFIED; real content PENDING | 13 `.shot` figures in index.html remain empty/aria-hidden; check-content (in `npm run check`) passes; check:layout passes incl. shot-sizes at 984-1440px; synthetic fixtures cover filled frames (check-layout / shot-fixtures) |
| 2 | All public screenshots pass review checklist (no PII/internal URL/admin, solid-box masks, EXIF stripped) | Mechanism VERIFIED; vacuously true now (0 images) | `check-images` "0 projects, OK"; self-test 30/30 pass (JPEG/WebP metadata rejection, unapproved/draft project rejected, orphan, misnamed, oversize); optimise-images self-test passes (opaque mask, no metadata) |
| 3 | WebP/JPEG multi-width in `img/projects/<id>/` with width/height/srcset/meaningful alt | Mechanism VERIFIED; no output yet | optimise-images pipeline self-test PASS; check-content markup self-test enforces alt/width/height/srcset/sizes/aria-label and file existence |
| 4 | Click opens zoom dialog, Tab/Esc work, focus returns to thumbnail | VERIFIED (synthetic) | js/main.js native `<dialog>` + `showModal` (line ~281); check:ui PASS: scroll lock, fade-in, reduced-motion instant open/close, focus returns to `.shot-link`, no-dialog fallback keeps links |
| 5 | PDF with screenshots at or under 5MB (max under 10MB) | Mechanism VERIFIED; real-image size PENDING | check-shots-pdf PASS (exit 0): size ladder steps 1-3, over-target warning, hard-limit failure removes PDF. Real PDF now 132,180 bytes, 0 images (per 04-07 SUMMARY) |

## Requirements Coverage

| ID | Plans | Status | Note |
|----|-------|--------|------|
| SHOT-01 | 04-03, 04-06, 04-07 | Mechanism satisfied; real content pending | Frames + empty-state verified |
| SHOT-02 | 04-01, 04-02, 04-06, 04-07 | Mechanism satisfied | check-images guards enforced |
| SHOT-03 | 04-01, 04-02, 04-03, 04-07 | Mechanism satisfied | pipeline + markup validator |
| SHOT-04 | 04-04, 04-07 | Satisfied | check:ui dialog tests |
| PDF-05 | 04-05, 04-07 | Mechanism satisfied; real size pending | ladder + guards verified |

No orphaned requirement IDs (all five appear in plans and REQUIREMENTS.md).

## Commands Run
- `npm run check` exit 0 (includes check:images, both self-tests, content)
- `npm run check:layout` exit 0
- `npm run check:ui` exit 0 on first run (no keyword-focus flake)
- `node tools/check-shots-pdf.mjs` exit 0

## Anti-Patterns / Review
04-REVIEW.md: 0 critical, 9 warnings (advisory), e.g. WR-01 DEBUG guard misses wildcard values (`DEBUG=*` could log phone payload in PDF build), fail-open metadata parsers, non-atomic multi-project run, approved project with no masks accepted, one dialog race. None block the mechanism goal, but WR-01 and the no-mask-approval gap bear on SHOT-02 and privacy and should be addressed before real images are published.

## Discrepancy (WARNING)
REQUIREMENTS.md marks SHOT-01..04 and PDF-05 as `[x]`/Complete, while 04-07-SUMMARY states they are "not marked complete" until real screenshots exist. Traceability is inconsistent; the checkbox reflects mechanism completion only. Recommend noting "mechanism complete; content pending" or keeping the status as-is by decision.

## Gaps
None blocking. No FAILED truths. Pending items are user content, explicitly deferred and approved.

## Human Verification Required
1. Supply screenshots, perform 04-06 review/approval, run `npm run images -- --only <id>`, `npm run check`, `npm run pdf`. Expected: frames filled, checks pass, PDF at or under 5MB. Why human: real content and masking judgement.

_Verifier: Claude (gsd-verifier)_
