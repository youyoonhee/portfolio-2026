# Roadmap: 퍼블리셔 유윤희 포트폴리오 2026

## Overview

원본 PDF(8페이지)를 순수 HTML/CSS/JS 반응형 사이트로 옮기고, 같은 `index.html`에서 제출용 PDF를 뽑아 GitHub Pages에 비공개(noindex)로 배포한다. Vertical MVP 방식이라 Phase 1이 끝나면 실제 내용이 모두 담긴 페이지를 브라우저에서 바로 볼 수 있고, 이후 단계는 그 페이지에 디자인 → 인터랙션·PDF → 스크린샷 → 검증·배포를 차례로 얹는다. 범위는 Phase 1 결과물을 본 뒤 다시 조정할 수 있다.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: 기반과 실제 콘텐츠 페이지** - 개인정보 경계를 세우고, 원본 PDF의 모든 내용을 시맨틱 `index.html` 한 장으로 옮겨 브라우저에서 바로 본다
- [ ] **Phase 2: 디자인 시스템과 반응형 + PDF spike** - 직접 쓴 CSS로 단정한 미니멀 디자인을 입히고 375/768/1440에서 완성하며, 레이아웃이 굳기 전에 PDF 위험을 확인한다
- [ ] **Phase 3: 인터랙션과 제출용 PDF** - 키보드·모션·JS 없는 상태를 다듬고, 명령 하나로 전화번호가 들어간 제출용 PDF를 만든다
- [ ] **Phase 4: 스크린샷 통합** - 사용자가 준 스크린샷을 검수·최적화해 프레임에 넣고, 확대 보기와 PDF 용량까지 마무리한다
- [ ] **Phase 5: 검증과 배포** - 크로스브라우저·링크 검증을 끝내고 Colophon과 README를 갖춰 GitHub Pages에 noindex로 배포한다

## Phase Details

### Phase 1: 기반과 실제 콘텐츠 페이지

**Goal**: 사용자가 브라우저에서 원본 PDF의 모든 내용(소개, 스킬, 경력 4곳, 프로젝트 13개, 연락처)이 실제 문장 그대로 담긴 페이지를 볼 수 있고, 저장소에는 전화번호와 원본 자료가 새지 않는다
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: BASE-01, BASE-02, BASE-03, BASE-04, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, QUAL-01
**Success Criteria** (what must be TRUE):

  1. 로컬 서버(`npx serve`)로 `index.html`을 열면 lorem 없이 이름·직무·원본 소개 문구·이메일, 스킬(주력/경험 텍스트), 경력 4곳(최신순), 프로젝트 13개, 연락처가 모두 보인다 (스타일은 없거나 최소여도 된다)
  2. 프로젝트 13개가 모두 같은 항목 순서(프로젝트명 / 소속사·고객사 / 기간 / 플랫폼 / 담당 업무 / 기여도+맥락 / 스크린샷 자리 / 링크·운영 상태 배지)로 나오고, 경력 항목에서 해당 회사 프로젝트로 앵커 이동이 된다 (D-07: 프로젝트별 기간은 쓰지 않고, 경력 요약과 회사 섹션에 표시되는 회사 재직 기간으로 대신한다)
  3. 원본 대조표에서 누락 0건, 원본에 없는 수치 0건이 확인되고, 걸린 링크는 모두 실제로 열린다(죽은 서비스에는 링크 대신 상태 배지)
  4. 커밋 전 전화번호 패턴 검사가 돌고 공개 트리에서 0건이며, `_screenshots/`, `private/`, `dist/`, `*.pdf`가 git에 잡히지 않는다
  5. Node 22에서 html-validate(와 `tools/check-content.mjs`)가 오류 0건으로 통과하고, 제목 구조가 h1 → h2 → h3이며 파일명·경로가 소문자 kebab-case·상대경로다

**Plans**: 4 plans (4 waves, 순차 vertical slice)

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking skeleton: 전화번호 pre-commit 훅·금지 경로·파일명 검사, Node 22 도구, 콘텐츠 검사 엔진, 실제 표지·Contact가 담긴 index.html

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Skills(Tech stack.)·Career(Career & Work.) 최신순 + 회사 섹션 4개와 앵커 이동

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — 프로젝트 13개 article(같은 항목 순서, 상태 배지, 살아 있는 링크 5개, 빈 퍼블리싱 포인트 자리)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-04-PLAN.md — 원본 대조표(누락 0·새 수치 0), 링크 생존·개인정보 최종 확인, 사용자 브라우저 확인

**UI hint**: yes

### Phase 2: 디자인 시스템과 반응형 + PDF spike

**Goal**: 채용 담당자가 어떤 화면 폭에서든 단정한 미니멀 디자인의 페이지를 읽고, 특정 회사의 담당 업무와 기여도를 10초 안에 찾을 수 있다
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DSGN-01, DSGN-02, DSGN-04, QUAL-03
**Success Criteria** (what must be TRUE):

  1. 페이지가 Pretendard(self-host)·넓은 여백·포인트 컬러 하나로 보이고, CSS는 `@layer`로 직접 작성돼 있으며 design-taste-frontend 키트 CSS를 불러오지 않는다 (스킬 체커 스크립트 결과 기록, 충돌 규칙은 waiver로 남김)
  2. 375px·768px·1440px에서 가로 스크롤이 없고, 한글은 단어 단위로 줄바꿈되며 긴 URL·이메일이 넘치지 않는다. 스크린샷 자리에는 앱(세로)·웹(가로) 비율 프레임과 자리표시가 보인다
  3. 모든 텍스트 대비가 WCAG 2.2 AA를 만족한다 (측정값 기록)
  4. 처음 보는 사람이 "10초 테스트"(특정 회사의 담당 업무와 기여도 찾기)를 통과한다
  5. PDF spike: 현재 페이지로 2~3쪽 PDF를 headless Chrome으로 뽑아 판형(원본 페이지 크기), 한글 폰트 임베딩(TrueType), lazy 이미지·모션 문제, Chrome CLI 유지 또는 Puppeteer 승격 여부가 결정·기록돼 있다

**Plans**: TBD
**UI hint**: yes

### Phase 3: 인터랙션과 제출용 PDF

**Goal**: 방문자는 키보드만으로, 모션이나 JS 없이도 모든 내용을 다룰 수 있고, 사용자는 명령 하나로 웹과 같은 디자인의 제출용 PDF(전화번호 포함)를 얻는다
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DSGN-03, QUAL-02, PDF-01, PDF-02, PDF-03, PDF-04
**Success Criteria** (what must be TRUE):

  1. 본문 바로가기 링크가 있고, Tab만으로 모든 링크·버튼에 논리적 순서로 도달하며 포커스 표시가 항상 보인다
  2. 모션은 히어로 진입과 hover뿐이고 `prefers-reduced-motion`에서 꺼지며, JS를 끄고 열어도 모든 내용이 보인다
  3. 명령 하나(`node tools/build-pdf.mjs` 등)로 `dist/`에 제출용 PDF가 생기고, 전화번호는 `private/contact.json`에서 그때만 주입된다(파일이 없으면 실패, 공개 HTML에는 빈 슬롯만)
  4. PDF가 표지 / 스킬·경력 / 회사별 / 연락처 구성이고, 카드가 페이지 중간에서 잘리지 않으며 빈 페이지가 없다
  5. PDF 안의 링크가 클릭되고 한글이 복사·검색되며(`pdffonts`로 TrueType 확인), 머리글·바닥글에 파일 경로가 없다

**Plans**: TBD
**UI hint**: yes

### Phase 4: 스크린샷 통합

**Goal**: 방문자는 프로젝트마다 실제 작업 화면을 비율에 맞는 프레임으로 보고 크게 확대해 볼 수 있으며, 공개 이미지에는 민감 정보가 없다
**Mode:** mvp
**Depends on**: Phase 3 (그리고 사용자가 `_screenshots/`에 원본을 넣어 주는 것)
**Requirements**: SHOT-01, SHOT-02, SHOT-03, SHOT-04, PDF-05
**Success Criteria** (what must be TRUE):

  1. 스크린샷을 받은 프로젝트는 자리표시 대신 실제 화면이 앱(세로)·웹(가로) 프레임에 보이고, 아직 없는 프로젝트는 자리표시가 깨지지 않고 남는다
  2. 공개되는 모든 스크린샷이 검수 체크리스트(고객 개인정보·내부/스테이징 URL·관리자 계정 없음, 단색 박스 마스킹, EXIF 제거)를 통과했다
  3. 이미지가 `img/projects/<id>/`에 WebP/JPEG 여러 폭으로 최적화돼 있고 `width`·`height`·`srcset`·의미 있는 alt를 가져 레이아웃이 밀리지 않는다
  4. 스크린샷을 눌러 확대 창을 열고 Tab·Esc로 다룰 수 있으며, 닫으면 포커스가 원래 썸네일로 돌아온다
  5. 스크린샷이 들어간 제출용 PDF가 5MB 이하(최대 10MB 미만)다

**Plans**: TBD
**UI hint**: yes

### Phase 5: 검증과 배포

**Goal**: 링크를 받은 채용 담당자가 어느 주요 브라우저에서든 깨짐·404 없는 사이트를 보고, 사이트가 어떻게 만들어졌는지 실측 근거와 함께 확인할 수 있다. 검색엔진에는 나오지 않는다
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: QUAL-04, QUAL-05, QUAL-06, DEPL-01, DEPL-02, DEPL-03, DEPL-04
**Success Criteria** (what must be TRUE):

  1. GitHub 무료 플랜 공개 저장소의 GitHub Pages 주소로 사이트가 열리고, `noindex` 메타와 `robots.txt`가 적용돼 있다
  2. 배포 사이트에서 linkinator 깨진 링크 0개, 브라우저 네트워크 탭 404 0건이며, 최신 Chrome·Edge·iOS Safari 실기기에서 같은 모습으로 보인다
  3. 링크를 메신저·메일에 붙이면 제목·설명·대표 이미지 미리보기가 뜨고 favicon이 보인다
  4. Colophon 섹션에서 사용 기술, 반응형·접근성 기준, 테스트 브라우저, 실제 측정한 Lighthouse·검사기 결과와 측정일을 볼 수 있다
  5. README에 직접 작성한 코드 범위, PDF 만드는 법, 스크린샷 추가 규칙이 적혀 있고, 배포 직전 전화번호 검사가 다시 0건이다

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 기반과 실제 콘텐츠 페이지 | 1/4 | In Progress|  |
| 2. 디자인 시스템과 반응형 + PDF spike | 0/TBD | Not started | - |
| 3. 인터랙션과 제출용 PDF | 0/TBD | Not started | - |
| 4. 스크린샷 통합 | 0/TBD | Not started | - |
| 5. 검증과 배포 | 0/TBD | Not started | - |

## Notes

- **스크린샷은 크리티컬 패스 밖:** Phase 2에서 비율 프레임과 자리표시를 먼저 만들고, Phase 1~3은 스크린샷 없이 끝낼 수 있다. Phase 4만 사용자 스크린샷을 기다린다. 늦어지면 Phase 4 앞부분(파이프라인·확대 창)을 먼저 하고 받은 순서대로 넣는다.
- **PDF spike는 Phase 2 안에:** 요구사항 ID가 없는 위험 확인 작업이라 Phase 2 성공 기준 5번으로 둔다. 결과는 Phase 3의 `print.css`·`build-pdf.mjs` 설계 입력이 된다.
- **Research flags:** Phase 2(PDF spike, 스킬 규칙과 프로젝트 13개 밀도 충돌), Phase 3(판형 재현·break-inside), Phase 4(PDF 용량)는 plan 전에 리서치를 권장한다.
- **사용자 입력 필요:** 링크 생존 확인(Q6)·퍼블리싱 포인트 내용(Q11)은 Phase 1, 스크린샷 공개 범위(Q7)는 Phase 4.
