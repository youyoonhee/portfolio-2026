---
status: partial
phase: 04-screenshots
source: [04-VERIFICATION.md]
started: 2026-11-12T23:00:00+09:00
updated: 2026-11-12T23:00:00+09:00
---

## Current Test

[awaiting human testing — 사용자 스크린샷 대기]

## Tests

### 1. 실제 스크린샷 반영과 PDF 용량
Steps:
1. Put the screenshots in `_screenshots/<id>/`.
2. Redo the 04-06 review (mask, crop and alt approval).
3. Run `npm run images -- --only <id>`.
4. Run `npm run check`.
5. Run `npm run pdf`.

expected: Real images appear in the app and web frames. check-images passes. The PDF is at most 5MB, and under the 10MB hard limit.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
