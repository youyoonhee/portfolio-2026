# 퍼블리셔 유윤희 포트폴리오 2026

## What This Is

앱·반응형 웹 퍼블리셔 유윤희의 이직용 포트폴리오다. 지금은 코드 없이 PDF 한 개(`퍼블리셔 유윤희-포트폴리오.pdf`, 8페이지)로만 존재하는데, 이를 단정한 미니멀 디자인의 반응형 웹사이트(HTML/CSS/JS)로 새로 만들고, 같은 디자인에서 제출용 PDF도 뽑아낸다. 주 독자는 이직 시 포트폴리오를 검토하는 채용 담당자와 실무 면접관이다.

## Core Value

채용 담당자가 짧은 시간 안에 "어떤 회사에서, 어떤 화면을, 얼마나 직접 퍼블리싱했는지"를 실제 화면과 함께 바로 파악할 수 있어야 한다. 그리고 사이트 자체의 마크업·반응형·완성도가 퍼블리셔 실력의 증거가 되어야 한다.

## Requirements

### Validated

- ✓ 기존 PDF의 모든 내용(소개, 스킬, 경력 4곳, 프로젝트 13개, 연락처)을 원본 문장 그대로 웹으로 옮김 — Validated in Phase 1: 기반과 실제 콘텐츠 페이지
- ✓ 프로젝트마다 소속·플랫폼·담당 업무·퍼블 기여도·링크/운영 상태 표시 — Validated in Phase 1
- ✓ 단정한 미니멀 디자인(흰 배경·그린 강조색·Pretendard self-host·직접 작성한 @layer CSS)과 키워드 강조 섹션 — Validated in Phase 2: 디자인 시스템과 반응형
- ✓ 375px·768px·1440px 반응형, 가로 스크롤 없음, 텍스트 대비 WCAG AA — Validated in Phase 2
- ✓ 웹에는 연락처로 이메일만 공개, 저장소·사이트 전화번호 0건(커밋 전 자동 검사) — Validated in Phase 1

### Active

- [ ] 프로젝트마다 사용자가 제공하는 스크린샷을 보여준다
- [ ] 웹 접근성 기본기(시맨틱 마크업, 키보드 이동, 대체 텍스트, 충분한 대비)
- [ ] 같은 디자인의 제출용 PDF를 만들 수 있다 (PDF에는 전화번호 포함)
- [ ] GitHub 무료 플랜 공개 저장소에서 GitHub Pages로 배포하고, 검색엔진에는 노출하지 않는다

### Out of Scope

- 프레임워크(Vue, Angular, React) 사용 — 직접 마크업한 코드로 퍼블리셔 역량을 보여주는 게 목적이라서
- 백엔드, CMS, 관리자 페이지, 문의 폼 — 정적 포트폴리오에 필요 없고, 연락은 이메일로 충분해서
- 다국어(영문) 버전 — 국내 이직용이 우선이라 v1에서는 제외
- 웹에 전화번호 공개 — 공개 사이트라 개인정보 노출을 피하려고
- 블로그·글 섹션 — 이번 범위는 경력과 프로젝트 소개에 집중

## Context

- **원본 자료:** 바탕화면의 `퍼블리셔 유윤희-포트폴리오.pdf` (8페이지). 추출한 텍스트는 `.planning/source/portfolio-pdf.txt`에 있다(전화번호가 들어 있어 git에서 제외).
- **원본 PDF 구성:** 표지("화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.") → Skills → Career 요약 → 회사별 프로젝트 4페이지 → Contact.
- **스킬:** HTML5, CSS3, SCSS / JavaScript(ES6+), TypeScript(경험) / Angular, Vue(경험) / jQuery, Bootstrap / Git, VS Code, Eclipse.
- **경력과 프로젝트:**
  - 애비로드 (2021.08 ~ 2021.12) — 교보생명 금융 마이데이터 앱 '피치(Peach)' 초기 화면 설계, 기여도 30%, 운영 종료
  - 비스톤스 (2022.01 ~ 2023.07) — CJ 종합광고운영플랫폼 'ADDY' 반응형 웹(70%, 운영 종료·소개서 링크만), 삼성 E스토어 기획전 프로모션 구축·유지보수(50%, 2인 1팀)
  - 케이엔큐레이션 (2023.09 ~ 2024.03) — Angular 기반 앱·반응형 웹 구축/유지보수. puring 앱(APK 보유), 로드필(운영 종료), 위캔키즈클럽, 링크알바, FSD 코스메틱, 그린다, LG AI연구원 의뢰 생성형 AI 'EXAONE' 초기모델 universe(미국 학회 발표용, 관련 기사만 확인 가능). 기여도 50~100%
  - 지아이데이타 (2024.09 ~ 2026.09) — 하나손해보험: 보험상품 산출기·상품소개 페이지 유지보수, 관리자 연동 이벤트 페이지 등록, 원데이보험 앱 메인 인트로·상품소개 리뉴얼. 모두 기여도 100%
- **이미지:** 사용자가 프로젝트 스크린샷을 가지고 있으며 프로젝트 폴더에 넣어줄 예정이다.
- **디자인 도구:** 전역 설치된 `design-taste-frontend` 스킬(그리고 `taste-design`)의 기준을 따른다. 둘의 규칙이 겹치므로 `design-taste-frontend`를 기준으로 삼는다.
- **이전 시도:** 2023년에 만든 `C:\Users\user\portfolio`(main.html + SCSS)가 있지만, 이번 프로젝트는 새로 시작한다.

## Constraints

- **기술 스택:** 순수 HTML/CSS/JS(빌드 도구 없음) — 퍼블리셔 역량을 코드 그대로 보여주고, 정적 호스팅에 바로 올리기 위해
- **개인정보:** 웹에는 이메일만, 전화번호는 제출용 PDF에만 — 공개 사이트 노출 최소화
- **콘텐츠 정확성:** 원본 PDF에 없는 수치나 성과를 지어내지 않는다 — 채용 문서라서 사실만 담아야 함
- **반응형:** 모바일·태블릿·데스크톱 모두 지원 — 앱·반응형 웹 퍼블리셔라는 정체성과 직결
- **호환성:** 최신 Chrome, Safari(iOS 포함), Edge — 채용 담당자가 주로 쓰는 환경

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PDF 대신 웹사이트 + 같은 디자인의 PDF | 웹은 링크로 공유하고 퍼블리싱 실력을 직접 보여줄 수 있고, PDF는 제출용으로 계속 필요해서 | — Pending |
| 순수 HTML/CSS/JS | 직접 마크업 역량을 보여주고 GitHub Pages에 바로 배포 가능 | — Pending |
| 단정한 미니멀 분위기 | 채용 담당자가 내용을 빨리 읽는 게 가장 중요해서 | — Pending |
| 웹에는 이메일만 공개 | 공개 사이트에서 전화번호 노출을 피하려고 | — Pending |
| 별도 git 저장소 | 홈 폴더 전체가 git 저장소라, 이 프로젝트만 따로 관리하려고 | ✓ Good |
| CSS는 직접 작성, design-taste 키트 CSS는 불러오지 않음 | 직접 쓴 코드가 실력 증거이고, 키트의 화면 높이 규칙이 PDF와 충돌해서 | — Pending |
| 경력·프로젝트는 최신순 | 채용 담당자가 최근 경력을 먼저 보게 | — Pending |
| PDF는 제출본만(전화번호 포함, 사이트 다운로드 없음) | 사용자 선택. 공개본은 v2에서 다시 검토 | — Pending |
| GitHub 무료 플랜 공개 저장소 + Pages, 검색엔진 비노출(noindex) | 무료 배포, 이름 검색에 사이트가 나오지 않게 | — Pending |
| 로컬 도구는 Node 22 (nvm) | 검사 도구와 스킬 스크립트가 Node 22 이상 필요 | ✓ Good |
| v1 범위는 결과물을 본 뒤 조정 | 사용자 요청 | — Pending |
| 운영 상태 배지는 운영 종료·운영 여부 확인 어려움·관련 기사만 표시, 운영 중은 표시 안 함 | Phase 1 화면 검토 때 사용자 요청 (링크알바=운영 종료, puring=확인 어려움) | ✓ Good |
| 제출용 PDF는 A4 세로(원본 16:9 슬라이드 대신), 9쪽 허용 | Phase 2 사용자 결정·검토 | ✓ Good |
| 키워드 강조 섹션(반응형 웹/인터랙션/AI 활용) 추가, 분류는 사용자 제공 | Phase 2 사용자 요청 | ✓ Good |
| 프로젝트별 기간 대신 회사 재직 기간 | 원본에 프로젝트별 기간이 없어 지어내지 않으려고 (D-07) | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-11 after Phase 2 completion*
