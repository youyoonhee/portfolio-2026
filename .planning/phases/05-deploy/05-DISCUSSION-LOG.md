# Phase 5: 검증과 배포 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-16
**Phase:** 5-검증과 배포
**Areas discussed:** 배포 주소

Offered and not chosen (left to Claude): 링크 미리보기 모양, Colophon 위치·분량, 실기기 테스트·README.
The first selection prompt came back empty and was asked again.

---

## 배포 주소

| Question | Options | Selected |
|----------|---------|----------|
| 주소 | 지금 주소 그대로 (youyoonhee.github.io/portfolio-2026/) / 저장소 이름 바꾸기 / 개인 도메인 | 지금 주소 그대로 ✓ |
| 공개 범위 | 사이트 파일만 공개 (Actions) / 저장소 전체 공개 | 사이트 파일만 공개 ✓ |
| 배포 시점 | 검사 통과 후 Claude가 켜기 / 사용자가 직접 켜기 | 검사 통과 후 Claude가 켜기 ✓ |
| 스크린샷 | 빈 프레임으로 먼저 배포 / 스크린샷 넣고 배포 | 스크린샷 넣고 배포 ✓ |

**Notes:** The user picked the recommended option for the first three questions. For the last one they chose to wait for screenshots, against the recommendation.

## Claude's Discretion

- Link preview: OG card, description and favicon.
- Colophon: placement and depth.
- Real-device testing: method and checklist.
- README: depth.
- 404 page and robots.txt.

The user answered "제가 정해도 돼요".

## Deferred Ideas

- Repo rename or a custom domain.
- Lighthouse CI.
- The Phase 4 follow-ups: the flake and the info items.
