# Phase 4: 스크린샷 통합 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-12
**Phase:** 4-스크린샷 통합
**Areas discussed:** 스크린샷 출처·장수, 프레임 모양, 확대 보기, 검수·PDF 이미지 (+ 진행 시점, 대체 텍스트)

참고: 논의 시점에 `_screenshots/`는 비어 있었다.

---

## 스크린샷 출처·장수

| Question | Options | Selected |
|----------|---------|----------|
| 출처 | 직접 넣기 / 원본 PDF에서 꺼내기 / 둘 다 | 직접 넣기 ✓ |
| 장수 | 최대 3장 / 딱 1장 / 제한 없음 | 딱 1장 ✓ |
| 없을 때 | 빈 프레임 유지 / 프레임 숨김 / 문구 넣기 | 빈 프레임 유지 ✓ |

## 프레임 모양

| Question | Options | Selected |
|----------|---------|----------|
| 앱 프레임 | 둥근 모서리만 / 폰 목업 | 둥근 모서리만 ✓ |
| 웹 프레임 | 테두리만 / 브라우저 바 | 테두리만 ✓ |
| 긴 화면 | 윗부분만 / 전체 축소 / 직접 자르기 | 윗부분만 ✓ |

## 확대 보기

| Question | Options | Selected |
|----------|---------|----------|
| 형태 | 거의 전체 화면 / 가운데 창 | 거의 전체 화면 ✓ |
| 캡션 | 프로젝트명만 / 이미지만 / 명+플랫폼+기여도 | 프로젝트명만 ✓ |
| 움직임 | 짧게 페이드 / 움직임 없음 | 짧게 페이드 ✓ |

## 검수·PDF 이미지

| Question | Options | Selected |
|----------|---------|----------|
| 마스킹 | Claude가 찾고 칠하기 / 직접 가려서 넣기 | Claude가 찾고 칠하기 ✓ |
| 공개 범위 | 공개됐던 화면만 / 가리면 내부 화면도 | 공개됐던 화면만 ✓ |
| PDF 이미지 | 모든 카드에 작게 / 이미지 없이 | 모든 카드에 작게 ✓ |

## 진행 시점·대체 텍스트

| Question | Options | Selected |
|----------|---------|----------|
| 진행 시점 | 방식 먼저 만들기 / 다 넣고 시작 | 방식 먼저 만들기 ✓ |
| alt | Claude가 초안 / 직접 쓰기 | Claude가 초안 ✓ |

## Claude's Discretion

- 포맷 구성(AVIF 추가 여부), 폭 단계, 품질값
- 변환 도구와 매니페스트 구조, sharp 설치(승인 필요)
- `<dialog>` 구현 세부, 검사 도구 확장

## Deferred Ideas

- 여러 장·갤러리, OG 이미지(Phase 5), 원본 PDF 이미지 추출(사용 안 함)
