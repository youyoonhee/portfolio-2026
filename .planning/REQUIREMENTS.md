# Requirements: 퍼블리셔 유윤희 포트폴리오 2026

**Defined:** 2026-11-11
**Core Value:** 채용 담당자가 짧은 시간 안에 "어떤 회사에서, 어떤 화면을, 얼마나 직접 퍼블리싱했는지"를 실제 화면과 함께 바로 파악할 수 있어야 하고, 사이트 자체의 마크업·반응형·완성도가 퍼블리셔 실력의 증거가 되어야 한다.

## v1 Requirements

### 기반과 개인정보 (BASE)

- [x] **BASE-01**: 공개 저장소와 배포된 사이트 어디에도 전화번호가 없다 (커밋 전 전화번호 패턴 검사로 확인)
- [x] **BASE-02**: 원본 스크린샷(`_screenshots/`), 비공개 연락처(`private/`), PDF 출력물(`dist/`, `*.pdf`)은 git에 올라가지 않는다
- [x] **BASE-03**: 파일명은 소문자 ASCII kebab-case, 경로는 모두 상대경로라서 GitHub Pages(프로젝트 사이트)에서 404가 나지 않는다
- [x] **BASE-04**: 로컬 검사 도구가 Node 22에서 돌아간다 (`package.json`에는 devDependencies만)

### 콘텐츠 (CONT)

- [x] **CONT-01**: 방문자는 첫 화면에서 이름, 직무(앱·반응형 웹 퍼블리셔), 원본 소개 문구("화면 너머의 경험까지 섬세하게."), 이메일을 볼 수 있다
- [x] **CONT-02**: 방문자는 스킬을 분야별(Markup & Style, Language, Framework, Library, Tools)로, 주력과 "경험" 구분이 원본 그대로인 텍스트로 볼 수 있다 (퍼센트 게이지 없음)
- [x] **CONT-03**: 방문자는 경력 4곳을 최신순(지아이데이타 → 케이엔큐레이션 → 비스톤스 → 애비로드)으로 회사명·재직 기간·대표 고객사와 함께 보고, 해당 회사의 프로젝트로 바로 이동할 수 있다
- [x] **CONT-04**: 방문자는 프로젝트 13개를 모두, 같은 순서의 항목(프로젝트명 / 소속사·고객사 / 기간 / 플랫폼 App·Web / 담당 업무 / 퍼블 기여도와 맥락 한 줄 / 스크린샷 / 링크·운영 상태)으로 볼 수 있다. 핵심 정보는 hover나 클릭 없이 항상 보인다 (D-07: 프로젝트별 기간은 쓰지 않고, 경력 요약과 회사 섹션에 표시되는 회사 재직 기간으로 대신한다)
- [x] **CONT-05**: 방문자는 프로젝트마다 운영 상태 배지(운영 중 / 운영 종료 / 소개서 / 관련 기사 / APK 보유 / 비공개)를 보고, 링크는 실제로 열리는 것만 걸려 있다
  - 사용자 검토 반영(2026-11-11): 운영 중 배지는 표시하지 않고, 운영 여부 확인 어려움 배지를 추가했다(링크알바는 운영 종료).
- [x] **CONT-06**: 사이트의 모든 문장과 숫자는 원본 PDF에 근거가 있다 (원본 대조표: 누락 0건, 새로 생긴 수치 0건)
- [x] **CONT-07**: 방문자는 연락처 섹션에서 이메일을 `mailto:` 링크로 열거나 텍스트로 복사할 수 있다 (웹에는 전화번호 없음)
- [x] **CONT-08**: 사용자가 내용을 제공한 프로젝트는 "퍼블리싱 포인트"(기술적으로 신경 쓴 점 한두 줄)를 보여준다. 내용이 없는 프로젝트는 비워 둔다

### 스크린샷 (SHOT)

- [ ] **SHOT-01**: 방문자는 프로젝트마다 사용자가 제공한 스크린샷을 앱(세로)·웹(가로) 비율에 맞는 프레임으로 볼 수 있다
- [ ] **SHOT-02**: 공개되는 스크린샷에는 고객 개인정보, 내부·스테이징 URL, 관리자 계정이 보이지 않는다 (검수 체크리스트 통과, 단색 박스 마스킹, EXIF 제거)
- [ ] **SHOT-03**: 스크린샷은 WebP/JPEG 여러 폭으로 최적화돼 있고 `width`·`height`·`srcset`·의미 있는 대체 텍스트를 가진다
- [ ] **SHOT-04**: 방문자는 스크린샷을 크게 볼 수 있고, 확대 창은 키보드(Tab, Esc)로 다룰 수 있으며 닫으면 원래 위치로 포커스가 돌아온다

### 디자인과 반응형 (DSGN)

- [ ] **DSGN-01**: 단정한 미니멀 디자인이다: 넓은 여백, Pretendard self-host, 포인트 컬러 하나, design-taste-frontend 규칙을 따르되 CSS는 직접 작성한다 (스킬의 키트 CSS는 불러오지 않음)
- [ ] **DSGN-02**: 375px·768px·1440px 모두에서 레이아웃이 깨지지 않고 가로 스크롤이 생기지 않는다 (한글 `keep-all` + 긴 URL·이메일 줄바꿈 처리 포함)
- [ ] **DSGN-03**: 모션은 히어로 진입과 hover 정도로 절제되고, `prefers-reduced-motion`을 켜면 꺼진다. JS가 꺼져 있어도 모든 내용이 보인다
- [ ] **DSGN-04**: "10초 테스트"를 통과한다: 처음 보는 사람이 특정 회사의 담당 업무와 기여도를 10초 안에 찾는다

### 접근성과 품질 (QUAL)

- [x] **QUAL-01**: 시맨틱 마크업으로 HTML 검사기 오류가 0건이다 (제목 구조 h1 → h2 → h3)
- [ ] **QUAL-02**: 키보드만으로 모든 링크와 버튼에 접근할 수 있다 (본문 바로가기, 보이는 포커스 표시, 논리적 Tab 순서)
- [ ] **QUAL-03**: 텍스트 대비가 WCAG 2.2 AA를 만족한다
- [ ] **QUAL-04**: 최신 Chrome, Edge, iOS Safari(실기기)에서 같은 모습으로 보인다
- [ ] **QUAL-05**: 깨진 링크가 0개이고 배포 후 브라우저 네트워크 탭에 404가 없다
- [ ] **QUAL-06**: 방문자는 "이 사이트는 이렇게 만들었습니다"(Colophon) 섹션에서 사용 기술, 반응형·접근성 기준, 테스트 브라우저, 실제로 측정한 Lighthouse·검사기 결과와 측정일을 볼 수 있다

### 제출용 PDF (PDF)

- [ ] **PDF-01**: 사용자는 명령 하나로 웹과 같은 디자인의 제출용 PDF를 만들 수 있다 (같은 `index.html` + 인쇄용 CSS + headless Chrome)
- [ ] **PDF-02**: 제출용 PDF에는 전화번호가 들어가고, 전화번호는 git 밖의 `private/contact.json`에서 PDF를 만들 때만 주입된다
- [ ] **PDF-03**: PDF는 원본과 비슷한 페이지 구성(표지 / 스킬·경력 / 회사별 / 연락처)이고, 카드가 페이지 중간에서 잘리지 않으며 빈 페이지가 없다
- [ ] **PDF-04**: PDF 안의 링크는 클릭되고, 한글은 복사·검색되며(TrueType 폰트 임베딩), 머리글·바닥글에 파일 경로가 찍히지 않는다
- [ ] **PDF-05**: PDF 용량은 5MB 이하를 목표로 하고 10MB를 넘지 않는다

### 배포 (DEPL)

- [ ] **DEPL-01**: 사이트는 GitHub 무료 플랜 공개 저장소에서 GitHub Pages로 배포된다
- [ ] **DEPL-02**: 검색엔진에 노출되지 않는다 (`noindex` 메타 + `robots.txt`). 링크를 받은 사람만 본다
- [ ] **DEPL-03**: 링크를 메신저나 메일에 붙였을 때 제목·설명·대표 이미지 미리보기가 뜬다 (OG 메타, favicon)
- [ ] **DEPL-04**: 저장소 README에 직접 작성한 코드 범위, PDF 만드는 법, 스크린샷 추가 규칙이 적혀 있다

## v2 Requirements

결과물을 본 뒤 다시 정한다.

### 확장

- **EXT-01**: 다크 모드
- **EXT-02**: 플랫폼/회사 필터
- **EXT-03**: 영문 버전
- **EXT-04**: 사이트에서 내려받는 공개용 PDF(전화번호 없음)
- **EXT-05**: 사이트에 GitHub 소스 링크 노출
- **EXT-06**: 프로젝트별 상세 페이지, 데스크톱+모바일 쌍 스크린샷

## Out of Scope

| Feature | Reason |
|---------|--------|
| 프레임워크(Vue, Angular, React)·빌드 도구 | 직접 마크업한 코드가 실력 증거, 정적 호스팅에 그대로 배포 |
| design-taste 키트 CSS 불러오기 | 직접 쓴 코드를 보여주기 위해. 규칙만 따르고 스킬 검사 도구로 확인 |
| 백엔드, CMS, 문의 폼 | 정적 포트폴리오에 불필요, 연락은 이메일로 충분 |
| 웹에 전화번호 공개 | 공개 사이트 개인정보 노출 방지 |
| 스킬 퍼센트 게이지 | 근거 없는 수치처럼 보이고 채용 담당자에게 신뢰를 잃음 |
| 섹션마다 스크롤 페이드인, 패럴랙스, 커스텀 커서, 스크롤 하이재킹, 캐러셀, 인트로 로딩 | 읽기 속도를 늦추고 PDF 인쇄를 망가뜨림 |
| 원본에 없는 성과 수치 | 채용 문서라 사실만 담아야 함 |
| 운영 종료 서비스의 원래 URL 링크 | 죽은 링크는 링크가 없는 것보다 나쁨 |
| 웹접근성 인증마크 주장 | 인증받지 않았음 |
| 검색엔진 노출 | 사용자 요청: 이름 검색에 이 사이트가 나오지 않게 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BASE-01 | Phase 1 | Complete |
| BASE-02 | Phase 1 | Complete |
| BASE-03 | Phase 1 | Complete |
| BASE-04 | Phase 1 | Complete |
| CONT-01 | Phase 1 | Complete |
| CONT-02 | Phase 1 | Complete |
| CONT-03 | Phase 1 | Complete |
| CONT-04 | Phase 1 | Complete |
| CONT-05 | Phase 1 | Complete |
| CONT-06 | Phase 1 | Complete |
| CONT-07 | Phase 1 | Complete |
| CONT-08 | Phase 1 | Complete |
| SHOT-01 | Phase 4 | Pending |
| SHOT-02 | Phase 4 | Pending |
| SHOT-03 | Phase 4 | Pending |
| SHOT-04 | Phase 4 | Pending |
| DSGN-01 | Phase 2 | Pending |
| DSGN-02 | Phase 2 | Pending |
| DSGN-03 | Phase 3 | Pending |
| DSGN-04 | Phase 2 | Pending |
| QUAL-01 | Phase 1 | Complete |
| QUAL-02 | Phase 3 | Pending |
| QUAL-03 | Phase 2 | Pending |
| QUAL-04 | Phase 5 | Pending |
| QUAL-05 | Phase 5 | Pending |
| QUAL-06 | Phase 5 | Pending |
| PDF-01 | Phase 3 | Pending |
| PDF-02 | Phase 3 | Pending |
| PDF-03 | Phase 3 | Pending |
| PDF-04 | Phase 3 | Pending |
| PDF-05 | Phase 4 | Pending |
| DEPL-01 | Phase 5 | Pending |
| DEPL-02 | Phase 5 | Pending |
| DEPL-03 | Phase 5 | Pending |
| DEPL-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-11*
*Last updated: 2026-11-11 after roadmap creation*
