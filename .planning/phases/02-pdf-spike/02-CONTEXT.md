# Phase 2: 디자인 시스템과 반응형 + PDF spike - Context

**Gathered:** 2026-11-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1에서 만든 `index.html`(스타일 없음)에 직접 작성한 CSS로 디자인을 입힌다. 채용 담당자가 375px·768px·1440px 어디서든 단정한 페이지를 읽고, 특정 회사의 담당 업무와 기여도를 10초 안에 찾을 수 있어야 한다. 함께 할 일:
- 사용자가 요청한 콘텐츠 수정 2건(D-12, D-13)
- 키워드 강조 섹션의 마크업과 정적 레이아웃(D-08~D-11)
- A4 PDF spike(D-18~D-20)

움직임(메뉴 숨김/표시, 키워드 스크롤 전환, 햄버거 메뉴 동작)은 이번 phase에서 구조와 JS 없는 기본 상태까지만 만든다. 실제 동작은 모션·키보드 접근성을 다루는 Phase 3에서 구현한다(D-16).

</domain>

<decisions>
## Implementation Decisions

### 색과 분위기
- **D-01:** 배경은 **흰색**이다. 처음 고른 웜화이트는 사용자가 흰색으로 바꿨다.
- **D-02:** 포인트 컬러는 **그린 계열 하나**다. 제목 번호(eyebrow), 링크, 기여도 강조, 키워드 강조, 포커스 표시처럼 꼭 필요한 곳에만 쓰고 나머지는 흑백·회색이다. 정확한 색값은 Claude가 정하되, 흰 배경 위 글자색으로 쓸 때 WCAG 2.2 AA 대비(4.5:1)를 넘겨야 한다(QUAL-03). oklch로 단계를 만들어도 된다.
- **D-03:** 분위기는 **프로덕트 UI**다: 둥근 카드, 아주 연한 그림자나 테두리, 앱 화면 같은 정돈감. 단정한 미니멀(넓은 여백, 또렷한 타이포)은 그대로 유지한다.
- **D-04:** 따로 참고할 사이트나 색 코드는 없다. Claude가 정하고 화면으로 보여 준다.

### 프로젝트 카드
- **D-05:** 13개 프로젝트는 **회사별 섹션 안에서 카드 격자**로 간단히 보여 준다(데스크톱 3열 / 태블릿 2열 / 모바일 1열 기준, 정확한 브레이크포인트는 Claude 재량, container query 사용 가능). 회사별 묶음과 경력→회사 앵커 이동(Phase 1)은 유지한다.
- **D-06:** 기여도는 게이지나 그래프 없이 **텍스트**로 쓴다(예: "퍼블 기여도 100%"). 포인트 컬러로 숫자를 살짝 강조하는 정도는 괜찮다.
- **D-07:** 카드 안 항목 순서는 Phase 1 그대로 두되 **'소속' 행은 뺀다**(D-12). 카드에는 스크린샷 자리(앱 세로·웹 가로 비율 프레임과 자리표시), 프로젝트명, 플랫폼, 담당 업무(원본에 있는 경우만), 기여도, 상태 배지(Phase 1 사용자 검토 기준: 운영 종료 / 운영 여부 확인 어려움 / 관련 기사, '운영 중'은 표시 안 함), 링크가 들어간다.

### 키워드 강조 섹션 (사용자 요청으로 새로 추가)
- **D-08:** 표지 바로 다음에 **키워드 강조 섹션**을 둔다. 페이지 순서는 표지 → 키워드 → 스킬 → 경력 → 회사별 프로젝트 → 연락처다. 섹션 번호(01 / Skills 등)는 이 순서에 맞게 다시 매긴다(Claude 재량).
- **D-09:** 키워드 3개와 해당 프로젝트는 사용자가 정했다:
  - **반응형 웹:** 위캔키즈클럽(kn-wecankids), FSD 코스메틱(kn-fsd), 그린다(kn-greenda)
  - **인터랙션:** 원데이보험 메인인트로(gi-oneday), EXAONE(kn-universe), FSD 코스메틱(kn-fsd)
  - **AI 활용:** 하나손해보험 보험상품산출기·상품소개페이지(gi-calculator), 원데이보험(gi-oneday), EXAONE(kn-universe)
  - 키워드 이름과 분류는 원본 PDF가 아니라 **사용자가 제공한 사실**이다. 콘텐츠 검사의 허용 목록에 "user-provided (2026-11-11)"로 표시해 넣는다.
- **D-10:** 레이아웃은 왼쪽에 키워드를 크게, 오른쪽에 해당 프로젝트 리스트를 둔다. 리스트 항목을 누르면 해당 프로젝트 카드로 앵커 이동한다.
- **D-11:** 움직임은 **"스크롤하면 하나씩 전환"** 방식이다. 섹션이 화면에 머무는 동안 스크롤하면 반응형 웹 → 인터랙션 → AI 활용 순서로 키워드와 오른쪽 리스트가 바뀐다. 이 섹션이 design-taste의 "dealt moment" 1개다.
  - **JS 없음 / reduced-motion / 모바일 / PDF:** 세 덩어리(키워드 + 리스트)를 차례로 모두 보여 준다. 이것이 기본 마크업 상태이고 Phase 2에서 만든다.
  - **전환 동작:** Phase 3에서 구현한다(D-16).

### 콘텐츠 수정 (사용자 요청, Phase 1 결과물 수정)
- **D-12:** 모든 프로젝트 카드에서 **'소속' 행을 뺀다**. 회사는 섹션 제목으로 이미 드러난다.
- **D-13:** gi-calculator의 프로젝트명을 **"하나손해보험 보험상품산출기, 상품소개페이지"**로 바꾼다. 원본의 "보험상품산출기·상품소개페이지"에 고객사명을 붙인 형태이고, 사용자가 준 표기다. 매니페스트와 검사 규칙(필드 순서, 허용 목록)도 함께 고친다.

### 첫 화면과 상단 메뉴
- **D-14:** 첫 화면은 표지 문구 "Publishing, / beyond the / expected."를 **가운데에 크게** 둔다. PORTFOLIO., Selected work / Career 2026, 한글 소개, 이메일은 그 주변에 절제해서 배치한다(Claude 재량).
- **D-15:** 상단 메뉴는 **fixed**다. 스크롤을 내리면 사라지고, 올리면 다시 스르륵 나타난다. 모바일 메뉴는 전형적인 **햄버거 메뉴**다. 메뉴 항목에 키워드 섹션을 넣을지는 Claude 재량이다.
- **D-16:** Phase 2에서 만드는 것: fixed 헤더 스타일, 메뉴 항목에 맞춘 `scroll-margin-top`, 햄버거 버튼 마크업, JS 없이도 메뉴가 쓸 수 있는 상태. **숨김/표시 동작, 햄버거 열고 닫기(키보드·Esc·포커스), 키워드 스크롤 전환**은 Phase 3(DSGN-03, QUAL-02)에서 구현한다. 모든 움직임은 `prefers-reduced-motion`에서 꺼지고 print에서도 꺼진다.

### PDF 판형
- **D-17:** 원본 PDF는 16:9 가로 슬라이드(960×540pt)지만, 제출용 PDF는 **A4 세로 문서**로 만든다(사용자 결정). `@page { size: A4 }`를 쓴다.
- **D-18:** PDF spike는 현재 페이지에서 2~3쪽짜리 A4 PDF를 headless Chrome(Edge/Chrome CLI)으로 뽑아 아래를 확인하고 기록한다.
  - 한글 폰트가 TrueType으로 임베딩되는지(복사·검색 가능 여부)
  - fixed 헤더와 모션이 인쇄에 섞이지 않는지
  - lazy 이미지 문제
  - 카드가 페이지 중간에서 잘리는지
  - Chrome CLI를 계속 쓸지, Puppeteer로 바꿀지
- **D-19:** PDF에서는 fixed 헤더와 햄버거를 숨기고, 키워드 섹션은 세 덩어리를 모두 펼친다. 연락처 쪽에 전화번호 자리(`data-slot="phone"`)를 둔다. 실제 번호 주입은 Phase 3(PDF-02)에서 한다. Spike 출력물은 `dist/`(gitignore)에만 둔다.

### Claude's Discretion
- 정확한 그린 색값과 회색 단계, 그림자·테두리·둥근 모서리 크기, 타이포 스케일(clamp), 여백 체계
- 브레이크포인트와 container query 사용 여부, 카드 내부 배치
- 표지 보조 문구 배치, 메뉴에 키워드 항목 포함 여부, 섹션 번호 재배열
- design-taste-frontend 규칙 중 이 프로젝트와 충돌하는 항목(예: 100svh 섹션, 실사 사진)은 waiver로 기록한다

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 프로젝트 기준
- `.planning/PROJECT.md`: 핵심 가치, 제약(순수 HTML/CSS/JS, 이메일만 공개, 원본에 없는 사실 금지)
- `.planning/REQUIREMENTS.md`: DSGN-01, DSGN-02, DSGN-04, QUAL-03 (이번 phase), DSGN-03·QUAL-02 (Phase 3), PDF-01~05
- `.planning/ROADMAP.md`: Phase 2 success criteria 1~5
- `./CLAUDE.md`: 스택, 폰트(Pretendard dynamic subset 웹용 / static TTF는 print 전용), 모던 CSS 허용 표, 모션·print 규칙, PDF 생성 방식

### Phase 1 결과물
- `.planning/phases/01-foundation-content/01-CONTEXT.md`: 콘텐츠 결정 D-01~D-18과 2026-11-11 사용자 검토 개정(배지 규칙)
- `.planning/phases/01-foundation-content/SKELETON.md`: id, 상태 값, 섹션 번호, article 템플릿, 폴더 구조
- `.planning/phases/01-foundation-content/01-VERIFICATION.md`, `01-REVIEW-FIX.md`: 검사 도구 현황
- `index.html`, `tools/content-manifest.json`, `tools/check-content.mjs`, `tools/check-repo.mjs`

### 리서치
- `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md`: 폰트 subset, print CSS, PDF 함정

### 디자인 규칙
- `~/.claude/skills/design-taste-frontend/SKILL.md`: 디자인 기준. 키트 CSS는 불러오지 않고 규칙만 따른다. 스킬 체커 결과를 기록하고, 충돌 규칙은 waiver로 남긴다.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html`: 시맨틱 구조가 완성돼 있다(header/nav/main/section/article, dl 메타, figure 스크린샷 자리, `data-platform`, `data-status`, `data-frame="app|web"`). CSS 클래스는 `.company`, `.project`, `.meta`, `.shot`, `.point`, `.eyebrow`, `.career`, `.skills`, `.skip-link`다.
- `npm run check`: html-validate, check-content(매니페스트 기반), check-repo(전화번호·경로·파일명)를 돌린다. 새 섹션과 문구는 매니페스트에 키를 넣어야 검사가 켜진다.

### Established Patterns
- 지금은 `<link>`나 `<script>`가 없고 스타일이 전혀 없다. CSS는 `css/`, JS는 `js/`에 상대경로로 추가한다. 파일명은 소문자 kebab-case다.
- 원본에 없는 문구는 `uiAllowlist`에 근거와 함께 넣어야 `source-reverse` 검사를 통과한다.
- 커밋 전·푸시 전 훅이 전화번호를 검사한다. `--no-verify`는 쓰지 않는다.

### Integration Points
- CSS `@layer` 순서: reset, tokens, base, layout, components, utilities, print
- Pretendard 1.3.9 self-host. 웹은 dynamic subset 400/600/700(`fonts/`), print는 static TTF 전용 `font-family`를 쓴다.
- 키워드 섹션 리스트는 기존 프로젝트 id(kn-wecankids 등)로 앵커를 건다.

</code_context>

<specifics>
## Specific Ideas

- 키워드 섹션은 "한 화면에 키워드 하나를 딱 강조"하는 느낌이다. 왼쪽에 크게 강조된 키워드, 오른쪽에 해당 프로젝트 목록이 온다.
- 헤더는 스크롤 방향에 따라 "스르륵" 숨었다 나타난다. 부드럽지만 짧은 transition이다.
- 기여도는 텍스트로 쓰고, 숫자만 포인트 컬러로 강조할 수 있다.

</specifics>

<deferred>
## Deferred Ideas

- 메뉴 숨김/표시 동작, 햄버거 열고 닫기, 키워드 스크롤 전환 동작: Phase 3(모션·키보드 접근성)
- 실제 스크린샷 넣기: Phase 4
- 다크 모드: v2 (EXT-01)
- 퍼블리싱 포인트 문구: 사용자가 나중에 제공

</deferred>

---

*Phase: 02-디자인 시스템과 반응형 + PDF spike*
*Context gathered: 2026-11-11*
