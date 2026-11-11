# Phase 3: 인터랙션과 제출용 PDF - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-11
**Phase:** 3-인터랙션과 제출용 PDF
**Areas discussed:** 키워드 전환 느낌, 표지 진입과 햄버거 메뉴, 연락처와 PDF 파일 (PDF 쪽 구성은 선택하지 않아 Claude 재량)

---

## 키워드 전환 느낌

| Question | Options | Selected |
|----------|---------|----------|
| 전환 효과 | 아래에서 위로 스르륵 / 페이드만 / 강조색만 이동 | 아래에서 위로 스르륵 |
| 진행 표시 | 작은 번호 01/03 / 점·막대 / 표시 없음 | 표시 없음 |
| 클릭 전환 | 번호·점 클릭으로 이동 / 스크롤만 | 스크롤만 |
| 머무는 길이 | 키워드당 화면 반 / 키워드당 한 화면 | 키워드당 화면 반 |

## 표지 진입과 햄버거 메뉴

| Question | Options | Selected |
|----------|---------|----------|
| 표지 진입 | 줄마다 차례로 올라옴 / 한 번에 페이드인 / 효과 없음 | 줄마다 차례로 올라옴 |
| 햄버거 열림 | 헤더 아래 패널 / 전체 화면 / 오른쪽 사이드 패널 | 헤더 아래 패널 |
| 버튼 모양 | 세 줄 → X 아이콘 / '메뉴' 글자 | 세 줄 → X |

## 연락처와 PDF 파일

| Question | Options | Selected |
|----------|---------|----------|
| 파일 이름 | 퍼블리셔 유윤희-포트폴리오.pdf / 유윤희_포트폴리오_2026.pdf / youyoonhee-portfolio.pdf | 퍼블리셔 유윤희-포트폴리오.pdf |
| 전화 링크 | tel: 링크 / 글자만 | tel: 링크 (PDF에서만) |
| 번호 입력 | Claude가 원본에서 옮겨 private/contact.json 생성 / 사용자가 직접 | Claude가 원본에서 옮김 (번호는 어디에도 출력 금지) |

## Claude's Discretion

- PDF 쪽 구성(빈 스크린샷 자리, 회사별 쪽 나눔, 고아 푸터 쪽 제거, 키워드 펼침), 진입 세부·이징, 헤더 숨김 임계값, 숨겨진 키워드 리스트의 포커스 처리, smooth scroll 여부, Puppeteer 옵션

## Deferred Ideas

- 스크린샷·PDF 용량(Phase 4), 확대 보기(Phase 4), 퍼블리싱 포인트(사용자 제공 대기), 배포·메타(Phase 5)
