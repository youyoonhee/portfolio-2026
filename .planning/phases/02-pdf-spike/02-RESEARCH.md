# Phase 2: 디자인 시스템과 반응형 + PDF spike - Research

**Researched:** 2026-11-11
**Domain:** 순수 HTML/CSS(@layer, container query, print CSS), Pretendard self-host, headless Edge/Chrome A4 PDF spike, design-taste 체커, 콘텐츠 검사 갱신
**Confidence:** HIGH (대부분 이 머신에서 직접 실행해 확인함. 확인 못 한 항목은 본문에 `[ASSUMED]`로 표시)
**Mode:** mvp

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**색과 분위기**
- **D-01:** 배경은 **흰색**이다. 처음 고른 웜화이트는 사용자가 흰색으로 바꿨다.
- **D-02:** 포인트 컬러는 **그린 계열 하나**다. 제목 번호(eyebrow), 링크, 기여도 강조, 키워드 강조, 포커스 표시처럼 꼭 필요한 곳에만 쓰고 나머지는 흑백·회색이다. 정확한 색값은 Claude가 정하되, 흰 배경 위 글자색으로 쓸 때 WCAG 2.2 AA 대비(4.5:1)를 넘겨야 한다(QUAL-03). oklch로 단계를 만들어도 된다.
- **D-03:** 분위기는 **프로덕트 UI**다: 둥근 카드, 아주 연한 그림자나 테두리, 앱 화면 같은 정돈감. 단정한 미니멀(넓은 여백, 또렷한 타이포)은 그대로 유지한다.
- **D-04:** 따로 참고할 사이트나 색 코드는 없다. Claude가 정하고 화면으로 보여 준다.

**프로젝트 카드**
- **D-05:** 13개 프로젝트는 **회사별 섹션 안에서 카드 격자**로 간단히 보여 준다(데스크톱 3열 / 태블릿 2열 / 모바일 1열 기준, 정확한 브레이크포인트는 Claude 재량, container query 사용 가능). 회사별 묶음과 경력→회사 앵커 이동(Phase 1)은 유지한다.
- **D-06:** 기여도는 게이지나 그래프 없이 **텍스트**로 쓴다(예: "퍼블 기여도 100%"). 포인트 컬러로 숫자를 살짝 강조하는 정도는 괜찮다.
- **D-07:** 카드 안 항목 순서는 Phase 1 그대로 두되 **'소속' 행은 뺀다**(D-12). 카드에는 스크린샷 자리(앱 세로·웹 가로 비율 프레임과 자리표시), 프로젝트명, 플랫폼, 담당 업무(원본에 있는 경우만), 기여도, 상태 배지(Phase 1 사용자 검토 기준: 운영 종료 / 운영 여부 확인 어려움 / 관련 기사, '운영 중'은 표시 안 함), 링크가 들어간다.

**키워드 강조 섹션 (사용자 요청으로 새로 추가)**
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

**콘텐츠 수정 (사용자 요청, Phase 1 결과물 수정)**
- **D-12:** 모든 프로젝트 카드에서 **'소속' 행을 뺀다**. 회사는 섹션 제목으로 이미 드러난다.
- **D-13:** gi-calculator의 프로젝트명을 **"하나손해보험 보험상품산출기, 상품소개페이지"**로 바꾼다. 원본의 "보험상품산출기·상품소개페이지"에 고객사명을 붙인 형태이고, 사용자가 준 표기다. 매니페스트와 검사 규칙(필드 순서, 허용 목록)도 함께 고친다.

**첫 화면과 상단 메뉴**
- **D-14:** 첫 화면은 표지 문구 "Publishing, / beyond the / expected."를 **가운데에 크게** 둔다. PORTFOLIO., Selected work / Career 2026, 한글 소개, 이메일은 그 주변에 절제해서 배치한다(Claude 재량).
- **D-15:** 상단 메뉴는 **fixed**다. 스크롤을 내리면 사라지고, 올리면 다시 스르륵 나타난다. 모바일 메뉴는 전형적인 **햄버거 메뉴**다. 메뉴 항목에 키워드 섹션을 넣을지는 Claude 재량이다.
- **D-16:** Phase 2에서 만드는 것: fixed 헤더 스타일, 메뉴 항목에 맞춘 `scroll-margin-top`, 햄버거 버튼 마크업, JS 없이도 메뉴가 쓸 수 있는 상태. **숨김/표시 동작, 햄버거 열고 닫기(키보드·Esc·포커스), 키워드 스크롤 전환**은 Phase 3(DSGN-03, QUAL-02)에서 구현한다. 모든 움직임은 `prefers-reduced-motion`에서 꺼지고 print에서도 꺼진다.

**PDF 판형**
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

### Deferred Ideas (OUT OF SCOPE)
- 메뉴 숨김/표시 동작, 햄버거 열고 닫기, 키워드 스크롤 전환 동작: Phase 3(모션·키보드 접근성)
- 실제 스크린샷 넣기: Phase 4
- 다크 모드: v2 (EXT-01)
- 퍼블리싱 포인트 문구: 사용자가 나중에 제공
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | 단정한 미니멀 디자인, Pretendard self-host, 포인트 컬러 하나, design-taste 규칙을 따르되 CSS는 직접 작성 | 섹션 "Pretendard 재현 가능한 복사", "CSS 아키텍처", "design-taste 체커 실행 결과" |
| DSGN-02 | 375/768/1440에서 깨지지 않고 가로 스크롤 없음 (keep-all, 긴 URL/이메일 처리) | "container query는 래퍼가 필요하다", "가로 스크롤 검사 스크립트(CDP)" |
| DSGN-04 | 10초 테스트 | "10초 테스트 체크포인트" |
| DSGN-05 | 키워드 섹션 정적 레이아웃 (전환 동작은 Phase 3) | "콘텐츠 검사 변경 목록", 키워드 마크업 프로토타입 |
| QUAL-03 | 텍스트 대비 WCAG 2.2 AA | "대비 측정 스크립트" (UI-SPEC 수치를 그대로 재현 확인함) |
</phase_requirements>

## Summary

이 phase의 위험은 기술 선택이 아니라 **UI-SPEC과 현재 도구 사이의 불일치 4건**이다. 전부 이 머신에서 재현해 확인했다. (1) UI-SPEC의 `.company`가 container이면서 동시에 자기 자신의 grid 열 수를 `@container`로 바꾸는 방식은 **동작하지 않는다**(768px에서도 1열 유지). 카드를 감싸는 `.project-grid` 래퍼가 필요하다. (2) `tools/check-repo.mjs`가 파일명을 소문자 kebab-case로 강제하는데 Pretendard 원본 파일명은 대문자(`Pretendard-Regular.subset.0.woff2`)라서 그대로 복사하면 188건이 실패한다. 복사 스크립트가 소문자로 바꿔야 한다. (3) design-taste `gate.mjs`는 waiver를 "finding 하나당 1개, 총 5개 초과 시 그 자체가 FAIL"로 제한하는데, 초안 페이지의 체커 결과가 FAIL 68건이다. 따라서 UI-SPEC의 "W-1..W-10을 `.taste-skill/waivers.json`에 기록" 방식은 기계적으로 통과시킬 수 없다. 체커는 **자문(advisory) 보고서**로 돌리고 분류별 판단을 검증 문서에 글로 남긴다. (4) CLAUDE.md의 "woff2는 PDF에서 Type3로 변환된다"는 Edge/Chrome 157에서 **재현되지 않았다**. 동적 subset woff2도 TrueType(CIDFontType2 + FontFile2 + ToUnicode)으로 임베딩되고 한글 복사·검색이 된다. 다만 23개 폰트 객체가 생겨 PDF가 약 13% 커지므로 print 전용 정적 TTF(폰트 객체 2개)는 여전히 쓸 만하다.

A4 PDF spike는 Edge 157 CLI만으로 이미 동작한다. `@page { size }`는 `@layer`와 `@media print` 안에 넣어도 적용되고(A5 landscape로 바꿔 MediaBox 변화를 확인함), 고정 헤더는 숨기지 않으면 **모든 쪽에 반복**되며, 카드는 `break-inside: avoid`로 잘리지 않았고(13개 모두 온전), lazy 이미지는 인쇄 시 로드됐다. 단 Windows에서 `msedge.exe`는 **PDF가 쓰이기 전에 프로세스가 종료**하므로 파일이 생길 때까지 폴링해야 한다. "2~3쪽"은 현재 콘텐츠로는 비현실적이다(거친 print CSS로 스크린샷 자리표시를 숨겨도 6쪽, 숨기지 않으면 8쪽). 쪽수는 목표가 아니라 **기록할 측정값**으로 다루는 것을 권한다.

**Primary recommendation:** UI-SPEC을 그대로 따르되 위 4건을 계획에 반영한다. `.project-grid` 래퍼 추가, `tools/copy-fonts.mjs`(소문자 이름 변환 포함), taste 체커는 `--page service`로 자문 실행, PDF spike는 Node 스크립트(폴링)로 Edge CLI를 쓰고 Phase 3에서 Puppeteer 25로 승격한다.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 레이아웃·반응형·타이포 | Browser / Client (CSS) | — | 빌드 도구 없음. 전부 정적 CSS |
| 카드 열 수 결정 | Browser (container query) | — | `.company`가 container, 자손 `.project-grid`가 grid |
| 폰트 제공 | CDN / Static (GitHub Pages `fonts/`) | Browser (unicode-range로 필요한 조각만 요청) | self-host, 외부 요청 없음 |
| 폰트 파일 준비 | 로컬 Node 도구 (`tools/copy-fonts.mjs`) | — | npm 패키지 → 저장소 복사, 배포 산출물에는 영향 없음 |
| 키워드 섹션 정적 상태 | Browser (HTML+CSS) | — | JS 없이 3블록 전부 표시. 전환은 Phase 3 |
| 메뉴 no-JS 상태 | Browser (CSS, `html:not(.js)`) | — | JS는 Phase 3에서 `html.js`를 붙임 |
| 콘텐츠 정확성 검사 | 로컬 Node 도구 (`check-content.mjs`) | git hook | 매니페스트 기반 |
| PDF 생성 (spike) | 로컬 headless Edge/Chrome | Node 폴링 스크립트 | 출력은 `dist/`(gitignore) |
| 대비·가로 스크롤 검증 | 로컬 Node 스크립트 | headless Edge (CDP) | 의존성 0 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pretendard | **1.3.9** (exact pin, `npm i -D -E`) | 서체 원본 공급 (devDependency, 사이트가 직접 로드하지 않음) | OFL-1.1, 공식 패키지, 마지막 발행 2023-11-05. `[VERIFIED: npm registry]` 저장소 `github.com/orioncactus/pretendard`, 주간 다운로드 623,408, postinstall 없음 |
| Node.js | 22.23.4 (설치됨) | 모든 도구 | `engines >=22.22.0` 충족. 전역 `WebSocket`이 있어 CDP 스크립트가 의존성 없이 가능 `[VERIFIED: node -e]` |
| Edge | 157.0.4341.42 | PDF spike, 가로 스크롤 검사 | 설치됨 `[VERIFIED: 파일 버전 정보]` |
| Chrome | 157.0.8103.27 | 교차 확인 | 설치됨. Edge와 같은 PDF 결과 |

### Supporting (이 phase에서 새로 설치하지 않음)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| html-validate | 11.21.0 (설치됨) | 마크업 검사 | 분리된 header/cover/keywords 마크업이 오류 0건인지 확인 (프로토타입으로 통과 확인) |
| serve | 14.2.7 (설치됨) | 로컬 서버 | 포트 3000은 사용 중일 수 있으니 실험은 3100 등 |
| puppeteer | 25.17.0 (engines node>=22.12.0) | Phase 3 PDF 빌드 | **Phase 2에서는 설치하지 않는다.** CDP 직접 스크립트로 충분 `[VERIFIED: npm view]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 직접 짠 CDP 스크립트 | puppeteer 지금 설치 | 170MB 브라우저 다운로드 + 의존성. Phase 3에서 어차피 도입하므로 그때 `check-layout.mjs`를 Puppeteer로 옮겨도 됨 |
| 직접 짠 PDF 텍스트 추출 스크립트 | `pdfjs-dist` | 이번 세션에서 설치 시도가 권한 분류기에 막혀 확인하지 못함. 직접 만든 스크립트가 한글 추출을 확인함 |
| print 전용 정적 TTF | 웹용 woff2 subset을 print에도 사용 | 둘 다 TrueType 임베딩. woff2는 폰트 객체 23개/354KB, TTF는 2개/312KB |
| subset-font으로 TTF 줄이기 | — | **불필요.** Chrome이 PDF에 쓰인 글리프만 subset 임베딩한다(TTF PDF 전체가 312KB). 저장소의 TTF 2개는 합 5.4MB지만 배포 부담 없음 |

**Installation:**
```bash
npm i -D -E pretendard@1.3.9
```

**Version verification:** `npm view pretendard version` = 1.3.9 (2026-11-11). `npm view puppeteer@25.17.0 engines` = node >=22.12.0.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| pretendard | npm | 약 5년 (2021-11 생성) | 623k/주 | github.com/orioncactus/pretendard | 실행 못 함 (`pip install slopcheck`가 이 세션에서 권한 분류기에 거부됨) | `[ASSUMED]` 표시. 단 CLAUDE.md STACK이 이미 지정했고 npm 메타데이터(저장소, 관리자, 다운로드, postinstall 없음)는 정상 |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck 미실행)
**Packages flagged as suspicious [SUS]:** none. 단 slopcheck를 못 돌렸으므로 규칙상 `[ASSUMED]`다. 계획자는 설치 task 앞에 `checkpoint:human-verify`를 둘지 판단한다(이미 Phase 0 리서치에서 사용자가 STACK.md로 승인한 패키지이므로 가벼운 확인이면 충분하다고 본다).

## Architecture Patterns

### System Architecture Diagram

```
node_modules/pretendard (devDep, exact 1.3.9)
        │  node tools/copy-fonts.mjs   (소문자 파일명으로 변환)
        ▼
  fonts/pretendard/*.woff2 (184)  ──►  css/fonts.css        (@font-face 400/600, unicode-range)
  fonts/print/*.ttf (2)           ──►  css/fonts-print.css  ("Pretendard Print", truetype)
        │
        ▼
index.html ── <link> x N (layers → fonts → fonts-print → reset → tokens → base → layout → components → utilities → print)
        │
        ├─ screen ─► header.site-header(fixed) / section#cover / #keywords(3 blocks) / #skills / #career
        │             / section.company(container) ─ .project-grid(grid) ─ article.project x N / #contact
        │
        └─ print  ─► @media print in @layer print ─ @page A4 ─ header/nav hidden, motion off, "Pretendard Print"
                          │
                          ▼
              tools/spike-pdf.mjs (spawn msedge --headless=new, poll file) ─► dist/spike.pdf (gitignored)
                          │
                          ▼
              tools/pdf-report.mjs (font types, page count, 쪽별 카드 분할, 텍스트 추출) ─► 02-VERIFICATION 기록

검증: check-contrast.mjs (tokens.css) · check-layout.mjs (CDP 375/768/1440) · npm run check · taste consistency(자문)
```

### Recommended Project Structure
```
css/
  layers.css        # @layer reset, tokens, base, layout, components, utilities, print;  (이것만)
  fonts.css         # 생성물 (copy-fonts.mjs). @layer 밖 (@font-face는 layer 대상이 아님)
  fonts-print.css   # 생성물. "Pretendard Print"
  reset.css tokens.css base.css layout.css components.css utilities.css print.css
fonts/
  pretendard/       # woff2 184개 (소문자 이름)
  print/            # pretendard-regular.ttf, pretendard-semibold.ttf
  pretendard-ofl.txt
tools/
  copy-fonts.mjs  check-contrast.mjs  check-layout.mjs  spike-pdf.mjs  pdf-report.mjs
dist/               # gitignore. spike 출력
```
`<link>` 순서는 `layers.css`가 **가장 먼저**여야 한다(레이어 순서는 첫 선언이 결정). `fonts*.css`는 어디든 상관없다. 모든 경로는 상대경로다.

### Pattern 1: container query는 container의 "자손"에만 적용된다
**What:** `.company { container-type: inline-size; container-name: company }`는 `.company` 자신의 스타일을 바꿀 수 없다. 카드 grid는 한 단계 안쪽 래퍼가 가져야 한다.
**Evidence:** 초안 페이지에서 `.company`가 container이자 grid일 때 375/768/1440 모두 `grid-template-columns` 1열이었다(컨테이너 폭 343/736/1168px). 래퍼 `.project-grid`로 옮기자 375→1열, 768→2열(736px), 1024→3열(992px), 1440→3열(1168px)이 됐다. `[VERIFIED: CDP computed style, Edge 157]`
**Markup 변경:** 각 `.company` 안에서 header류 요소(eyebrow/h2/period/company-desc) 뒤에 `<div class="project-grid">…articles…</div>`로 감싼다. `check-content.mjs`는 article의 조상 `section`을 찾아 올라가므로 이 변경에 영향 없다 `[VERIFIED: 코드 읽기]`.
```css
@layer layout {
  .company { container: company / inline-size; }
  .project-grid { display: grid; gap: var(--space-md); align-items: stretch; }
  .project-grid > * { min-inline-size: 0; }
  @container company (min-width: 600px) { .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-lg); } }
  @container company (min-width: 920px) { .project-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
}
```
인쇄 시에는 컨테이너 폭이 A4 본문 폭(약 703 CSS px)이라 자동으로 2열이 된다. UI-SPEC의 "print에서 2열 고정"은 별도 규칙 없이 충족되지만 명시해 두는 편이 안전하다.

### Pattern 2: no-JS 메뉴는 `html:not(.js)` 규칙 (권장)
**What:** Phase 2에는 JS가 없으므로 `html`에 `js` 클래스가 영원히 없다. `html:not(.js) .nav-toggle { display: none }`이고 `.site-nav`는 항상 보인다. Phase 3이 `<head>`에 `document.documentElement.classList.add('js')` 한 줄을 넣으면 그때부터 토글이 보이고 목록이 접힌다.
**Why not alternatives:** `<details>`는 데스크톱 inline nav와 구조가 달라져 마크업이 갈라진다. `:target`/체크박스 해킹은 앵커 점프와 충돌하거나 접근성이 나쁘다.
**Validation:** 아래 프로토타입 마크업이 `html-validate`(recommended + a11y) 오류 0건 `[VERIFIED: 실행]`.
```html
<header class="site-header">
  <p class="wordmark">PORTFOLIO.</p>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="visually-hidden">메뉴</span></button>
  <nav id="site-nav" class="site-nav" aria-label="주요 섹션">
    <ul>
      <li><a href="#keywords">Keywords</a></li><li><a href="#skills">Skills</a></li>
      <li><a href="#career">Career</a></li><li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</header>
<main id="main">
  <section id="cover" class="cover" aria-labelledby="cover-title"> … h1#cover-title … </section>
  <section id="keywords" class="keywords" aria-labelledby="keywords-title">
    <p class="eyebrow" lang="en">01 / Keywords</p>
    <h2 id="keywords-title" class="visually-hidden" lang="en">Keywords</h2>
    <div class="keyword-block"><h3 class="keyword-title">반응형 웹</h3><ul class="keyword-list"><li><a href="#kn-wecankids">위캔키즈클럽</a></li> … </ul></div>
    …
  </section>
```
**중요(헤더 높이):** no-JS 상태의 모바일(<900px) 헤더는 64px 바 + nav 행이라 **80px 보다 높아진다**. `scroll-margin-top: 80px`을 하드코딩하면 앵커 대상이 헤더에 가려진다. `--header-h`를 토큰으로 두고(데스크톱 72px, 모바일 64px, `html:not(.js)` 모바일은 nav 행만큼 더한 값) `scroll-margin-top`/`scroll-padding-top`을 `calc(var(--header-h) + var(--space-md))`로 쓴다. 측정은 `check-layout`의 확장(앵커 점프 후 `getBoundingClientRect().top >= header.bottom`)으로 한다.

### Pattern 3: 한글 줄바꿈과 긴 문자열
`body { word-break: keep-all; overflow-wrap: break-word }`만으로는 grid/flex 자식의 **min-content**가 줄지 않는다(`break-word`는 intrinsic size에 반영되지 않음). 이메일과 `.links a`에는 `overflow-wrap: anywhere`를 쓰고, grid 자식에 `min-inline-size: 0`을 준다(UI-SPEC 그대로). 초안 페이지(이메일, kn-universe의 긴 담당 업무, 긴 프로젝트명 포함)에서 375/768/1440 모두 `scrollWidth == viewport`였다 `[VERIFIED]`.

### Pattern 4: print CSS 골격 (측정된 동작)
```css
@layer print { @media print {
  @page { size: A4 portrait; margin: 14mm 12mm 16mm; }          /* @layer+@media 안에서도 적용됨 (A5 landscape로 바꿔 MediaBox 595x420 확인) */
  *, *::before, *::after { animation: none !important; transition: none !important; transform: none !important; }
  .site-header, .nav-toggle, .skip-link, .site-nav { display: none !important; } /* 숨기지 않으면 6쪽 모두에 헤더 텍스트가 반복됨 */
  body { font-family: "Pretendard Print", sans-serif; print-color-adjust: exact; }
  .shot { display: none; }   /* Phase 4 전까지 빈 자리표시 상자는 인쇄할 이유가 없음. 쪽수 8 → 6 */
  .project { break-inside: avoid; box-shadow: none; }
  h2, h3 { break-after: avoid; }
}}
```

### Anti-Patterns to Avoid
- **`.company`가 container이면서 자기 grid를 `@container`로 바꾸기:** 동작하지 않음(위 Pattern 1).
- **`gate.mjs --start`로 빌드를 "무장"하기:** `.taste-skill/build.json`이 생기고 Stop 훅이 FAIL이 남아 있는 한 종료를 막는다. 이 프로젝트에서는 통과 불가능한 게이트다.
- **Pretendard 파일을 원본 대문자 이름으로 커밋하기:** `check-repo`가 파일명 규칙으로 차단한다.
- **`msedge.exe` 종료를 PDF 완성으로 간주하기:** 아래 Pitfall 1.
- **헤더 높이를 80px로 하드코딩:** no-JS 모바일 상태에서 앵커가 가려진다.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 한글 subset 서체 | 직접 subset | pretendard dynamic subset woff2 (공식 `unicode-range` CSS) | 이미 92조각/굵기. 이 페이지는 2굵기에서 **23개 조각, 인코딩 합계 266KB**만 요청함 `[VERIFIED: Resource Timing]` |
| 대화형 PDF 텍스트 검사 | poppler/pdffonts 설치 | `tools/pdf-report.mjs` (아래 코드, 의존성 0) | poppler 미설치. Skia PDF는 폰트 객체가 평문이라 정규식으로 충분 |
| 가로 스크롤 검사 | 브라우저 수동 확인 | `tools/check-layout.mjs` (CDP, 의존성 0) | 재현 가능, Phase 3/5에서 재사용 |
| 햄버거 열고 닫기 | Phase 2에서 JS 구현 | 구조만 (D-16) | Phase 3 범위 |
| 색 대비 | 눈대중 | `tools/check-contrast.mjs` | UI-SPEC 수치와 일치함을 확인 |

**Key insight:** 이 phase의 검증 도구들은 모두 Node 내장 모듈과 설치된 Edge로 의존성 없이 만들 수 있다. 새 npm 패키지는 `pretendard` 하나뿐이다.

## Runtime State Inventory

해당 없음 (rename/migration phase 아님). 단 D-12/D-13은 **콘텐츠 변경**이므로 "매니페스트와 검사 규칙 동시 수정"이 필요하다(아래 "콘텐츠 검사 변경 목록").

## Common Pitfalls

### Pitfall 1: Windows에서 `msedge.exe --print-to-pdf`는 PDF가 쓰이기 전에 반환한다
**What goes wrong:** Git Bash, Node `spawnSync`, `Start-Process`(-Wait 없이) 어디서든 명령이 0.1~0.3초에 끝나고 `dist/x.pdf`는 아직 없다. 2~6초 뒤에야 생긴다. 스크립트가 바로 다음 단계로 가면 파일 없음으로 실패한다.
**How to avoid:** `spawn(... , { detached: true, stdio: 'ignore' }).unref()` 후 **파일 크기가 두 번 연속 같아질 때까지 폴링**(300ms 간격, 30초 제한). 매번 새 `--user-data-dir`(임시 폴더)를 준다. 그러면 사용자가 켜 둔 Edge와 충돌하지 않는다. PowerShell `Start-Process -Wait`는 자식까지 기다려서 동작하지만(4.3초), Node 스크립트가 이식성이 좋다. `[VERIFIED]`
**Warning signs:** `ENOENT ... .pdf`, 또는 이전 실행의 오래된 PDF를 새 결과로 착각 (스크립트가 시작 전에 출력 파일을 지운다).

### Pitfall 2: 고정 헤더가 모든 쪽에 반복된다
`position: fixed` 요소는 인쇄 시 쪽마다 반복된다. 초안에서 6쪽 모두에 헤더 텍스트가 찍혔다(텍스트 추출로 6회 확인). `@media print`에서 `display: none`이어야 한다. `[VERIFIED]`

### Pitfall 3: Pretendard 대문자 파일명이 `check-repo`를 막는다
원본 파일을 그대로 복사하면 `file name must be lowercase ascii kebab-case` 오류가 188건 난다(pre-commit/pre-push가 막음). `LICENSE.txt`도 예외 목록(루트 `LICENSE`만 허용)에 걸린다. 복사 스크립트가 파일명을 소문자로 바꾸고 CSS의 `url()`도 같은 규칙으로 바꾼다. 라이선스는 `fonts/pretendard-ofl.txt`로 둔다. woff2/ttf 바이너리는 허용 목록과 매직 바이트 검사를 통과한다(TTF 시그니처 `00 01 00 00` 확인). 변환 후 `check-repo`는 190개 파일 clean이었다. `[VERIFIED]`

### Pitfall 4: "woff2는 PDF에서 Type3" 가정은 이 환경에서 재현되지 않는다
Edge 157과 Chrome 157 모두 동적 subset woff2 페이지도 `CIDFontType2`+`FontFile2`+`ToUnicode`로 임베딩하고 `Type3`은 0개였다. 한글 복사 가능, `?` 깨짐 0. 차이는 **폰트 객체 수**(woff2 23개/354,484B vs TTF 2개/311,791B)뿐이다. 결론: print 전용 TTF는 "필수"가 아니라 "깔끔하고 약간 작다" 수준이다. CLAUDE.md의 규칙(print는 정적 TTF)을 유지해도 손해가 없으므로 유지를 권한다. 다만 `pdf-report`가 `type3Fonts == 0`과 BaseFont 이름이 전부 `Pretendard`로 시작하는지를 매번 단언하게 해, TTF 경로가 깨져 시스템 폰트로 대체되는 일(경고 없이 일어남)을 잡는다. Windows 폰트 폴백은 `Malgun Gothic`이다.
**Source caveat:** 이 결과는 Chrome/Edge 157 한정이다. Skia 동작이 바뀌면 다시 측정한다.

### Pitfall 5: "2~3쪽" 목표는 현재 콘텐츠로 맞지 않는다
13개 카드·경력·스킬·키워드는 A4 세로에서 거친 CSS로도 6쪽(스크린샷 자리표시 숨김), 8쪽(숨기지 않음)이었다. 마지막 쪽에 연락처만 남는 고아 쪽도 생겼다. 계획자는 이 spike의 완료 조건을 "쪽수 2~3"이 아니라 "쪽수·분할·고아 쪽을 측정해 기록"으로 잡는다. 최종 구성은 Phase 3(PDF-03)이다.

### Pitfall 6: 헤더 헤드룸·focus 가림 (체커가 실제로 잡은 것)
taste 체커의 `focus-hidden`은 "본문 바로가기"가 고정 헤더 아래 가려진다고 FAIL을 냈다. UI-SPEC의 `.skip-link { z-index: 100 }`(헤더 50 위, 포커스 시 좌상단)가 이 FAIL의 해결책이다. 반드시 구현 후 체커로 재확인한다.

### Pitfall 7: index.html의 줄바꿈이 CRLF/LF 혼재
`file index.html` = "with CRLF, LF line terminators". 문자열 치환 도구/스크립트가 `\n` 앵커 매칭에 실패해 조용히 아무것도 바꾸지 않는다(이번 리서치에서 실제로 겪음). 편집은 Edit 도구나 `\r?\n` 정규식으로 하고, 변경 후 `npm run check`로 확인한다. `.gitattributes`는 `* text=auto`.

### Pitfall 8: 스크롤바가 측정 폭을 바꾼다
데스크톱 에뮬레이션에서 768을 요청해도 `clientWidth`가 753(스크롤바 15px)이 된다. CDP `Emulation.setScrollbarsHidden`을 켜야 375/768/1440이 정확하다. `[VERIFIED]`

### Pitfall 9: 콘텐츠 검사의 "먼저 깨지는" 순서
아래 표 참조. 특히 `sections`는 `id` 없는 `<section class="cover">`를 `null`로 읽어 실패하므로 표지에 `id="cover"`를 준다.

### Pitfall 10: `.taste-skill/`에 체커 산출물이 쌓인다
`consistency.mjs`는 현재 작업 폴더 아래 `.taste-skill/consistency-<파일명>/`에 크롭 JPEG와 `report.json`을 쓴다. 저장소 루트에서 돌려도 `.gitignore`와 `check-repo` FORBIDDEN 패턴이 이를 제외한다. 그래도 `--profile`은 OS 임시 폴더나 `.taste-skill/` 안으로 지정한다(밖은 경고 후 대체됨).

## Code Examples

### 1. `tools/copy-fonts.mjs` (검증됨: 184 woff2 + 2 ttf, check-repo clean)
```js
// Copies Pretendard 400/600 dynamic-subset woff2 + print TTFs from node_modules into fonts/ (lowercase names,
// because tools/check-repo.mjs enforces lowercase kebab-case) and generates css/fonts.css + css/fonts-print.css.
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.FONT_OUT ? resolve(process.env.FONT_OUT) : ROOT;   // 테스트용
const PKG = join(ROOT, 'node_modules', 'pretendard');
const WEIGHTS = { 400: 'Regular', 600: 'SemiBold' };
const webDir = join(PKG, 'dist/web/static');
const dst = join(OUT, 'fonts/pretendard');
const dstPrint = join(OUT, 'fonts/print');

const { version } = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8'));
if (version !== '1.3.9') throw new Error(`pretendard ${version} installed, expected exact 1.3.9`);

rmSync(dst, { recursive: true, force: true });
rmSync(dstPrint, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });
mkdirSync(dstPrint, { recursive: true });
mkdirSync(join(OUT, 'css'), { recursive: true });

let css = `/* generated by tools/copy-fonts.mjs from pretendard@${version} (SIL OFL 1.1, see fonts/pretendard-ofl.txt). Do not edit. */\n`;
let printCss = `/* generated by tools/copy-fonts.mjs. Static TrueType for PDF only. */\n`;
let n = 0;
for (const [w, name] of Object.entries(WEIGHTS)) {
  const src = join(webDir, 'woff2-dynamic-subset');
  for (const f of readdirSync(src).filter((f) => f.startsWith(`Pretendard-${name}.subset.`))) {
    cpSync(join(src, f), join(dst, f.toLowerCase())); n++;
  }
  css += readFileSync(join(webDir, `Pretendard-${name}.css`), 'utf8')          // 굵기별 CSS가 이미 있음 (92 @font-face)
    .replace(/^\/\*[\s\S]*?\*\/\s*/, '')                                            // 라이선스 헤더 제거
    .replace(/,\s*url\(\.\/woff-dynamic-subset\/[^)]+\)\s*format\('woff'\)/g, '')   // woff 폴백 제거 (복사하지 않음)
    .replace(/url\(\.\/woff2-dynamic-subset\/(Pretendard-[^)]+)\)/g, (_, f) => `url(../fonts/pretendard/${f.toLowerCase()})`);
  cpSync(join(PKG, 'dist/public/static/alternative', `Pretendard-${name}.ttf`), join(dstPrint, `pretendard-${name.toLowerCase()}.ttf`));
  printCss += `@font-face {\n  font-family: "Pretendard Print";\n  font-style: normal;\n  font-weight: ${w};\n  src: url(../fonts/print/pretendard-${name.toLowerCase()}.ttf) format("truetype");\n}\n`;
}
writeFileSync(join(OUT, 'css/fonts.css'), css);
writeFileSync(join(OUT, 'css/fonts-print.css'), printCss);
cpSync(join(PKG, 'dist/LICENSE.txt'), join(OUT, 'fonts/pretendard-ofl.txt'));
console.log(`copied ${n} woff2 + 2 ttf`);
```
**패키지 경로 사실** `[VERIFIED: 설치 후 ls]`: 웹 CSS와 woff2는 `node_modules/pretendard/dist/web/static/` (`Pretendard-Regular.css`, `Pretendard-SemiBold.css`, `pretendard-dynamic-subset.css`, `woff2-dynamic-subset/Pretendard-<Weight>.subset.<0..91>.woff2`). 굵기별 CSS가 있어서 전체 CSS를 자를 필요가 없다. print TTF는 `dist/public/static/alternative/Pretendard-<Weight>.ttf`(Regular 2.73MB, SemiBold 2.67MB). 같은 폴더에 CFF 기반 `.otf`도 있지만 사용하지 않는다. woff2는 굵기당 92개 → 총 184개 약 2.3MB(저장소 크기), 페이지는 그중 23개(약 266KB)만 요청한다.
**CSS 경로:** `css/fonts.css`에서 `url(../fonts/pretendard/…)`(css/ 기준 상대경로). 생성 CSS에는 `font-display: swap`이 이미 들어 있다. 계획: `package.json`에 `"fonts:copy": "node tools/copy-fonts.mjs"`를 추가하고 `pretendard`는 `-E`로 고정, 생성물은 커밋한다.

### 2. `tools/check-contrast.mjs` (검증됨: UI-SPEC의 13개 수치를 소수 둘째 자리까지 재현)
```js
// Reads --color-* hex tokens from css/tokens.css and checks WCAG 2.2 contrast pairs. Exit 1 on failure.
import { readFileSync } from 'node:fs';
const css = readFileSync(process.argv[2] ?? 'css/tokens.css', 'utf8');
const t = Object.fromEntries([...css.matchAll(/--(color-[\w-]+)\s*:\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRS = [ // [fg, bg, min, why]
  ['color-accent', 'color-bg', 4.5], ['color-accent', 'color-surface', 4.5], ['color-accent', 'color-accent-tint', 4.5],
  ['color-bg', 'color-accent', 4.5], ['color-accent-strong', 'color-bg', 4.5],
  ['color-ink', 'color-bg', 4.5], ['color-ink-2', 'color-bg', 4.5], ['color-ink-2', 'color-surface', 4.5],
  ['color-ink-3', 'color-bg', 4.5], ['color-ink-3', 'color-surface', 4.5], ['color-ink-3', 'color-accent-tint', 4.5],
  ['color-accent', 'color-bg', 3, 'focus ring'], ['color-line-strong', 'color-bg', 3, 'non-text'],
];
let bad = 0;
for (const [f, b, min, why = 'text'] of PAIRS) {
  if (!t[f] || !t[b]) { console.log(`MISSING token ${f} or ${b}`); bad++; continue; }
  const r = ratio(t[f], t[b]); const ok = r >= min; if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${f} ${t[f]} on ${b} ${t[b]}  ${r.toFixed(2)}:1 (min ${min}, ${why})`);
}
process.exit(bad ? 1 : 0);
```
토큰 파일에는 hex만 둔다(oklch 파생색을 쓰면 이 스크립트가 못 읽으므로, 쓸 거면 hex로 환산해 같은 표에 추가). 측정 출력(위 PAIRS 13줄)을 `02-VERIFICATION.md`에 그대로 붙인다. 참고로 taste 체커의 `text-contrast`는 본문 7:1을 요구한다(ink-2 7.56은 통과, 포인트 컬러 링크 5.43은 걸릴 수 있음. 초안 실행에서는 PASS였으나 실제 디자인에서 재확인).

### 3. `tools/check-layout.mjs` (검증됨: 초안 페이지에서 375/768/1440 PASS, 스크린샷 출력 가능)
```js
// Zero-dependency CDP check: no horizontal overflow at 375/768/1440; optional screenshots.
// Usage: node tools/check-layout.mjs http://localhost:3100/ [--shots dist/shots]
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:3000/';
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const EXE = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9400 + Math.floor(Math.random() * 100);
const prof = mkdtempSync(join(tmpdir(), 'layoutprof-'));
const proc = spawn(EXE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(ver.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
let failed = 0;
try {
  await send('Page.enable'); await send('Emulation.setScrollbarsHidden', { hidden: true });   // 스크롤바 15px가 폭을 바꾸는 것을 막는다
  if (shots) mkdirSync(shots, { recursive: true });
  for (const [w, h] of [[375, 812], [768, 1024], [1440, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url }); await sleep(1500);
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
    const { result } = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 0.5 || r.left < -0.5) && getComputedStyle(e).position !== 'fixed'; })
        .slice(0, 5).map(e => e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '') + (e.id ? '#' + e.id : ''));
      return { vw, scrollW: de.scrollWidth, bodyScrollW: document.body.scrollWidth, wide };
    })()` });
    const v = result.value; const ok = v.scrollW <= v.vw && v.bodyScrollW <= v.vw;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${w}px: viewport ${v.vw}, scrollWidth ${v.scrollW}${ok ? '' : ' offenders ' + JSON.stringify(v.wide)}`);
    if (shots) { const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(shots, `w${w}.png`), Buffer.from(s.data, 'base64')); }
  }
} finally { ws.close(); proc.kill(); await sleep(500); try { rmSync(prof, { recursive: true, force: true }); } catch {} }
process.exit(failed ? 1 : 0);
```
**확장 권장(같은 스크립트에 추가):** (a) 폰트 로딩 후 `scrollWidth`, (b) `#kn-fsd` 등 해시로 이동한 뒤 카드 `.meta`의 상단이 헤더 하단 이상이고 하단이 뷰포트 안인지(10초 테스트 보조 지표, 아래 참조), (c) `getComputedStyle('.project-grid').gridTemplateColumns` 열 수(375→1, 768→2, 1440→3)와 같은 행 카드 높이 동일 여부. 이 확장은 최종 CSS가 없어 미검증이다.
**가장 가벼운 방법인 이유:** `--dump-dom`/`--screenshot --window-size`는 폭이 500px 안팎 아래로 내려가지 않거나(새 headless 창 최소 폭) 스크립트 실행 결과를 돌려주지 못한다. CDP의 `setDeviceMetricsOverride`는 375px를 정확히 에뮬레이트한다. Puppeteer는 같은 일을 하지만 170MB를 받는다.

### 4. PDF spike 실행기 `tools/spike-pdf.mjs` (검증됨)
```js
import { spawn } from 'node:child_process';
import { existsSync, statSync, rmSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
const [,, url, outArg, browser = 'edge'] = process.argv;
const out = resolve(outArg); mkdirSync(dirname(out), { recursive: true });
const exe = browser === 'chrome' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
rmSync(out, { force: true });
const prof = mkdtempSync(join(tmpdir(), 'pdfprof-'));
const t0 = Date.now();
spawn(exe, ['--headless=new', '--disable-gpu', `--user-data-dir=${prof}`, '--no-pdf-header-footer', `--print-to-pdf=${out}`, url], { stdio: 'ignore', detached: true }).unref();
let last = -1;
while (Date.now() - t0 < 30000) {            // msedge.exe는 PDF를 쓰기 전에 반환한다. 크기가 안정될 때까지 폴링
  await new Promise((r) => setTimeout(r, 300));
  if (existsSync(out)) { const sz = statSync(out).size; if (sz > 0 && sz === last) break; last = sz; }
}
console.log(existsSync(out) ? `ok ${statSync(out).size} bytes in ${Date.now() - t0} ms` : 'TIMEOUT');
process.exit(existsSync(out) ? 0 : 1);
```
- 명령 한 줄(수동): `msedge.exe --headless=new --disable-gpu --user-data-dir=<임시폴더> --no-pdf-header-footer --print-to-pdf=<절대경로>.pdf http://localhost:3100/` (플래그 철자 `--no-pdf-header-footer` 정상 동작. 출력에 `localhost`/파일 경로 텍스트 0건 확인)
- 경로: Edge `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe`. Node에서는 **슬래시 경로**를 쓴다(역슬래시 이스케이프가 도구 경로에서 깨졌음).
- 소요: 3~6초. `--virtual-time-budget`는 필요 없었다.
- `file://` 대신 http 서버를 쓴다(module script/폰트, 프로젝트 규칙).

### 5. PDF 검사 `tools/pdf-report.mjs` (폰트·쪽수·링크는 검증됨. 의존성 0)
Skia PDF는 객체 사전이 평문이라 정규식으로 센다.
```js
import { readFileSync } from 'node:fs';
const s = readFileSync(process.argv[2]).toString('latin1');
const count = (re) => (s.match(re) || []).length;
const r = {
  bytes: s.length, pages: count(/\/Type\s*\/Page[^s]/g), type3: count(/\/Subtype\s*\/Type3/g),
  cidFontType2: count(/\/Subtype\s*\/CIDFontType2/g), fontFile2: count(/\/FontFile2/g), toUnicode: count(/\/ToUnicode/g),
  uriLinks: count(/\/URI\s*\(/g), mediaBox: [...new Set([...s.matchAll(/\/MediaBox\s*\[([^\]]*)\]/g)].map((m) => m[1].trim()))],
  baseFonts: [...new Set([...s.matchAll(/\/BaseFont\s*\/([^\s/\]>]+)/g)].map((m) => m[1].replace(/^[A-Z]{6}\+/, '')))],
};
const ok = r.type3 === 0 && r.fontFile2 > 0 && r.baseFonts.every((f) => f.startsWith('Pretendard'));
console.log(JSON.stringify(r, null, 1), ok ? '\nPASS fonts: TrueType embedded, no Type3, all Pretendard' : '\nFAIL fonts');
process.exit(ok ? 0 : 1);
```
**측정 결과(초안 페이지, 8쪽 기준)** `[VERIFIED]`:

| 변형 | 크기 | 폰트 객체 | Type3 | FontFile2 | ToUnicode |
|------|------|-----------|-------|-----------|-----------|
| 웹 woff2 subset 그대로 인쇄 | 354,484 B | 23 | 0 | 23 | 23 |
| "Pretendard Print" 정적 TTF | 311,791 B | 2 | 0 | 2 | 2 |
Chrome 157에서도 바이트 단위로 거의 같음(354,470 / 311,777).

텍스트 추출(복사·검색 검증): ToUnicode CMap을 읽어 `Tj/TJ` 헥스 글리프를 변환하는 약 50줄 스크립트를 만들어 한글 2,064자를 `?` 0개로 추출했다(예: "삼성E스토어기획전프로모션", "교보생명 금융 마이데이터 서비스 앱 ‘피치(Peach)’"). 실행기는 구현 시 `tools/pdf-report.mjs`에 `--text` 옵션으로 포함하되, 최종 확인은 **사람이 PDF를 열어 한글을 드래그 복사·Ctrl+F 검색**하는 체크포인트로 한 번 한다. 링크 주석(`/URI`)이 5개 외부 링크 + mailto로 보존된다. `StructTreeRoot` 존재(태그됨), `/Outlines`는 CLI에서 없음(Puppeteer `outline` 옵션 필요).
**쪽 분할 검사:** 텍스트 추출 결과를 쪽별로 나눠 "플랫폼 dt 개수 == 퍼블 기여도 dt 개수"를 쪽마다 비교 → 13개 카드 모두 분할 없음(`break-inside: avoid`). 카드 13 = 2+1+4+2+1+2+1.

### 6. 키워드 목록 → 매니페스트 데이터 구조 (제안)
```json
"keywords": [
  { "title": "반응형 웹", "ids": ["kn-wecankids", "kn-fsd", "kn-greenda"] },
  { "title": "인터랙션",  "ids": ["gi-oneday", "kn-universe", "kn-fsd"] },
  { "title": "AI 활용",   "ids": ["gi-calculator", "gi-oneday", "kn-universe"] }
]
```
링크 텍스트는 매니페스트의 `projects[].name`과 normalize 비교(카드 제목과 같은 문자열, UI-SPEC "Keyword project link text equals the project title").

## 콘텐츠 검사 변경 목록 (Q5)

프로토타입 변환(D-12, D-13, 헤더/표지 분리, 키워드 섹션, 새 번호)을 `index.html` 사본에 적용하고 **원본 PDF 추출본이 있는 상태에서** `check-content.mjs`를 돌렸다. 기준선은 전부 PASS였다(site 68/excluded 11/unmapped 0).

**RED가 된 검사 (변환 후, 매니페스트/검사 수정 전):**

| 검사 | 실패 이유 | 필요한 수정 |
|------|-----------|-------------|
| `hero` | `h1`을 `<header>`에서만 찾음. 헤더가 nav 전용으로 바뀜 | 표지 요소를 `section.cover`에서 찾도록 변경. `eyebrow`("PORTFOLIO.")는 이제 header의 `.wordmark`에 있으므로 별도 단언 추가 |
| `nav` | 항목 3개 → 4개(`#keywords` Keywords 추가) | 매니페스트 `nav` 갱신. 현재 코드는 `byTag('header')[0]` 사용 → `header.site-header`가 첫 header이면 그대로 동작 |
| `sections` | `<section class="cover">`에 id가 없어 `null`로 읽음 | 표지에 `id="cover"`. 매니페스트 `sections`를 `cover, keywords, skills, career, gi-data, kn-curation, bistones, abbey-road, contact`로 |
| `skills`/`career`/`contact` | eyebrow 텍스트 `01 / Skills`→`02 / Skills`, `02 / Career`→`03 / Career`, `07 / Contact`→`08 / Contact` | `skillsSection.eyebrow`, `careerSection.eyebrow`, `contact.eyebrow` |
| `companies` | 번호 03~06 → 04~07 | `companies[].number` |
| `projects` | 1) gi-calculator 제목 불일치 2) 숨은 실패: dt 순서 `['소속','플랫폼',…]`, 소속 dd 비교(`companyName`), dd 인덱스가 하나씩 밀림 | `want`에서 `'소속'` 제거, `dd(0)` 소속 비교 삭제, `dd(1)`→플랫폼, `dd(2)`→담당 업무로 인덱스 조정(맨 앞 dt가 플랫폼이므로 `dd(0)`=플랫폼). 이 2번 항목들은 1)을 고치기 전엔 먼저 반환돼서 보이지 않음 |
| `source-reverse` | 새 보이는 문구가 원본에 없음: `Keywords`, `01 / Keywords`, `02 / Skills`, `03 / Career`, `08 / Contact`, `메뉴`(visually-hidden이라도 텍스트로 계산됨), `반응형 웹`, `인터랙션`, `AI 활용`, `하나손해보험 보험상품산출기, 상품소개페이지` | `uiAllowlist`에 추가. 근거는 JSON에 주석을 쓸 수 없으므로 같은 항목을 가리키는 별도 키(예: `uiAllowlistReasons: { "<문구>": "user-provided (2026-11-11)" }`)를 두거나, 기존 형식을 유지하고 근거를 `02-VERIFICATION.md`/커밋 메시지에 남긴다. 카드/키워드 목록의 기존 프로젝트명은 원본에 있으므로 불필요 |
| `source-coverage` | 원본의 `01 / Skills`, `02 / Career`, `07 / Contact` 항목이 `status: "site"`인데 사이트에서 번호가 바뀌어 없음 | 3개 항목을 `status: "excluded"` + `reason: "renumbered for new section order (D-08)"`로 변경(변경 후 통과 확인) |
| `anchors` | 키워드 링크 9개의 대상 id가 모두 존재해야 함 | 문제 없음(기존 id 사용) |
| `source-numbers` | 변경 후에도 통과(숫자 02/03/08은 원본 숫자 집합에 있음) | 없음. 단 새 숫자가 늘면 재확인 |
| `headings` | 표지 분리 후 h1이 1개 유지되면 통과. h1→h2(키워드, visually-hidden)→h3 순서 | 없음 |

**수정 후 전부 통과함을 프로토타입으로 확인했다**(manifest + check-content.mjs 최소 패치로 `check-content: all passed`).

**새 검사 추가 제안:** `keywords` 검사 하나. (1) `section#keywords` 안에 `keyword-block` 3개, 제목이 매니페스트 순서·텍스트와 같음 (2) 각 `li > a[href="#id"]`가 `keywords[].ids`와 같은 순서 (3) 링크 텍스트가 `projects[].name`과 normalize 동등 (4) 사용자 제공 분류가 바뀌지 않았는지(매니페스트 자체가 근거). `slots`, `projects`는 `.project-grid` 래퍼와 무관하게 동작한다.

**`@layer`/`.project-grid` 변경에 영향 없는 검사:** `links`, `paths`(CSS/폰트는 `<link>`가 아닌 `href`/`src` 검사 대상이지만 모두 상대경로면 통과), `phone`, `forbidden`, `footer`.
**주의:** `<link rel="stylesheet" href="css/…">`는 `paths` 검사를 받는다. 절대경로(`/css/…`)는 즉시 실패.

## design-taste 체커 (Q2)

**무엇이 있나:** `~/.claude/skills/design-taste-frontend/scripts/`에 `consistency.mjs`(본 체커, 11,485줄), `copy-lint.mjs`, `gate.mjs`(종료 게이트), `perf.mjs`, `shoot.mjs`, `start.mjs`(팔레트/레이아웃 deal), `moments.mjs`, `photos.mjs`, `icons.mjs`, `effects.mjs`. 요구: Node 22+와 Chrome/Edge. `[VERIFIED: 이 머신에서 실행]`

**Windows에서 실제로 동작함** (Edge 157 자동 탐지, 로컬 파일을 5200대 포트로 자체 서빙, 자체 headless 프로필):
```bash
cd <스크래치가 아닌 저장소 루트>   # 산출물이 ./.taste-skill/ 아래에 생김 (gitignore + check-repo 제외됨)
node ~/.claude/skills/design-taste-frontend/scripts/consistency.mjs index.html \
  --quick --widths 1440,390 --page service --profile "$TMP/tasteprof"
```
- **소요 약 2.5분**(2개 폭, `--quick`). 도구 기본 타임아웃(120초)을 넘으므로 백그라운드로 돌리거나 `timeout`을 600초로 준다.
- 기록할 출력: 폭별 `N screens, X FAIL, Y WARN`, 마지막 `total X FAIL Y WARN`, 검사별 PASS/WARN/FAIL 표, 크롭과 `report.json` 위치. 종료 코드는 문서상 FAIL이 있으면 1, 페이지를 못 열면 2.
- `--page service`로 종류를 주면 HTML 메타(`data-type` 등)가 없어도 된다(없으면 `page-meta`/`share-meta` WARN만). **UI-SPEC W-1("service 선언")은 이 플래그로 충족**한다. HTML에 메타를 넣을 필요 없음.
- 권장 전체 실행은 `--widths 1440,1024,820,768,390` (느림). Phase 2에서는 `--quick --widths 1440,390`을 기록하고 최종에서 한 번 전체 폭을 돌린다.

**초안 페이지(거친 CSS, 스크린샷 없음) 결과: 1440에서 45 FAIL/12 WARN, 390에서 20 FAIL/8 WARN, 합계 68 FAIL/24 WARN.** 분류별(건수) 요약:

| 분류 | 건수 | 판단 |
|------|------|------|
| no-visual(13), card-visual(4), text-only(2) | 19 | Phase 4 스크린샷 전까지 구조적으로 남음 → W-2 (waiver 사유) |
| section-height(8), one-section(3), one-heading(2), hero-screen(2), hero-fill(2), section-tile(3), empty-area(3), container-edges(9) | 32 | "섹션은 1~2화면" 규칙. 카드 7개짜리 회사 섹션·짧은 스킬/경력과 충돌 → W-3. 단 `container-edges`(콘텐츠 좌우 가장자리)는 **실제 레이아웃 오류일 수 있어 고쳐야 함**(초안은 `.wrap`이 없었음) |
| cta(5+2) | 7 | W-6 (히어로 버튼 없음, 이메일 링크만) |
| nav(8), nav-covers/nav-current/nav-labels | 약 11 | 초안 헤더가 `.wrap` 없이 만들어져 생긴 것일 수 있음. **UI-SPEC 헤더 구현 후 재측정하고 남으면 수정** |
| focus-hidden(2) | 2 | **실제 문제**: skip-link가 고정 헤더에 가림. skip-link `z-index:100` 필수 |
| tap-size(5 FAIL+6 WARN), collide(2) | 13 | **실제 문제 후보**: 44px 히트 영역 규칙. UI-SPEC가 이미 44/48px를 지정 |
| moment-none, hero-enter 등 | — | W-4 (Phase 3) |

**waiver의 기계적 한계 (UI-SPEC과의 불일치):** `gate.mjs`는 waiver를 `{check, target, reason}` 배열로 받고 **하나의 finding만** 덮으며 **5개를 넘으면 그 자체가 FAIL**이다. 68건을 waiver로 덮을 수 없다. 또 `gate.mjs --start`는 빌드를 무장(`.taste-skill/build.json`)하고 Stop 훅이 남은 FAIL을 이유로 종료를 막는다. 따라서 계획은 다음과 같이 잡는다.
1. **`gate.mjs --start`를 실행하지 않는다.** `consistency.mjs`를 자문 도구로만 돌린다.
2. 결과를 `02-VERIFICATION.md`(또는 `02-TASTE-REPORT.md`)에 **분류별 판단표**로 기록: "고침 / UI-SPEC W-n으로 의도적 불채택(사유) / Phase 3·4로 이월". ROADMAP 성공 기준 1의 "스킬 체커 스크립트 결과 기록"은 이 표로 충족한다.
3. `.taste-skill/waivers.json`은 만들지 않는다(또는 의미 있는 5개 이하만). UI-SPEC의 "record in waivers.json if the gate is run"은 "gate를 돌리지 않으므로 해당 없음"이 된다.
4. `copy-lint.mjs`는 한글 원문 콘텐츠를 영어 규칙으로 판단하므로 `--kind service`로 돌려 WARN/FAIL을 참고만 한다(`[ASSUMED]` 한글 면제는 이 세션에서 실행해 확인하지 않음).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 외부 CDN 폰트 | self-host dynamic subset | — | 캐시 분할 후 CDN 이점 없음. 이 페이지는 23개 조각 266KB만 로드 |
| Paged.js | Chrome 131+ 네이티브 `@page` + CLI/Puppeteer | Chrome 131 | 이 프로젝트는 margin box가 필요 없음 (`@page` size/margin만 사용) |
| woff2 폰트는 PDF에서 Type3 (CLAUDE.md 가정) | Chrome/Edge 157에서는 TrueType 임베딩 | 확인됨 2026-11-11 | print 전용 TTF는 선택 사항(권장 유지) |
| `file://` 미리보기 | http 서버 + CDP | — | |

**Deprecated/outdated:** `--headless`(old)와 `--headless=new`: 이 환경은 `--headless=new`로 동작 확인.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pretendard` 패키지는 안전함 (slopcheck 미실행, npm 메타데이터와 공식 저장소 일치로 판단) | Package Legitimacy | 낮음. 이미 STACK.md에서 승인됨 |
| A2 | `copy-lint.mjs`가 한글 콘텐츠를 어떻게 판정하는지 이 세션에서 실행 안 함 | design-taste | 낮음. 자문 용도 |
| A3 | `pdfjs-dist`로 PDF 텍스트 검사하는 대안은 설치가 막혀 시험 못 함 | Alternatives | 없음. 직접 스크립트가 검증됨 |
| A4 | 최종 CSS에서 `check-layout`의 앵커 점프 확장(헤더 가림, 카드 `.meta` 가시성)이 동작할지 | check-layout 확장 | 중간. 확장은 미검증. 구현 시 한 번 실행해 본다 |
| A5 | `lazy` 이미지가 인쇄 시 로드되는 동작은 작은 로컬 PNG 1개로만 확인함. 큰 AVIF나 느린 네트워크에서는 미확인 | PDF spike | 중간. Phase 3/4에서 PDF 빌드 스크립트가 `loading="lazy"`를 제거하는 보험을 둔다 |
| A6 | AVIF `<picture>`가 PDF에서 어떻게 임베딩되는지(재인코딩, 용량)는 이미지가 없어 이번에 측정 불가 | PDF spike | 중간. Phase 4 PDF-05에서 측정 |

## Open Questions

1. **"2~3쪽" 목표를 완료 기준으로 둘지?**
   - 알려진 것: 현재 콘텐츠와 간단한 print CSS로 6쪽(자리표시 숨김).
   - 불명확: 사용자가 A4 2~3쪽을 실제 요구로 보는지, 느슨한 예시인지.
   - 권고: spike 완료 기준을 "쪽수·분할·고아 쪽 측정 기록"으로 정하고 최종 쪽수는 Phase 3에서 결정. 사용자에게 spike 결과 확인 때 물어본다.
2. **no-JS 모바일 헤더 높이**
   - `--header-h`를 어떻게 정할지 구현 때 실측 필요(권고는 Pattern 2).
3. **`uiAllowlist` 근거 표기 방식**
   - JSON에 주석 불가. `uiAllowlistReasons` 별도 객체 vs 검증 문서 기록. 권고: 검사는 기존 배열을 그대로 읽게 두고 근거 객체를 추가(check-content가 존재 여부만 확인하도록 한 줄).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 모든 도구 | ✓ | 22.23.4 | — |
| Edge (headless) | PDF spike, check-layout, taste 체커 | ✓ | 157.0.4341.42 | Chrome |
| Chrome | 교차 확인 | ✓ | 157.0.8103.27 | — |
| npm | pretendard 설치 | ✓ | 설치됨 | — |
| html-validate, serve, linkinator | 기존 | ✓ | 11.21.0 / 14.2.7 / 8.1.0 | — |
| poppler(`pdffonts`, `pdftotext`) | PDF 폰트 검사 | ✗ | — | `pdf-report.mjs` 직접 스크립트 |
| puppeteer | Phase 3 | ✗(미설치) | 25.17.0 가능 | Phase 2에서는 불필요 |
| slopcheck / pip 설치 | 패키지 검증 | ✗ (이 세션에서 거부됨) | — | `[ASSUMED]` 표시 |
| 포트 3000 | 사용자의 dev server가 사용 중 | 사용 중 | — | 실험은 3100 |

**Missing dependencies with no fallback:** 없음.
**Missing dependencies with fallback:** poppler → 직접 스크립트.

## Validation Architecture

(nyquist 비활성이지만 실행 가능한 검증 명령 목록으로 유용해 간단히 기록)

| 요구 | 검증 | 명령 | 기존/신규 |
|------|------|------|-----------|
| DSGN-01 | 레이어 순서·키트 CSS 미사용·폰트 로드 | `grep -R "@import\|system.css" css index.html` 없음, `check-layout`의 폰트 요청 수 | 신규 |
| DSGN-02 | 가로 스크롤 없음 375/768/1440 | `node tools/check-layout.mjs http://localhost:3100/` | 신규 |
| DSGN-02 | 카드 열 수 1/2/3 | 확장: `.project-grid` computed columns | 신규(확장) |
| DSGN-04 | 10초 테스트 | 사람 체크포인트 + 보조 CDP 지표 | 신규 |
| DSGN-05 | 키워드 마크업·앵커 | `npm run check:content` (새 `keywords` 검사) | 변경 |
| QUAL-01 | HTML 오류 0 | `npm run validate` | 기존 |
| QUAL-03 | 대비 | `node tools/check-contrast.mjs` | 신규 |
| PDF spike | A4, 폰트, 분할 | `node tools/spike-pdf.mjs … && node tools/pdf-report.mjs dist/spike.pdf` | 신규 |
| 전체 | `npm run check` (유효성+콘텐츠+개인정보) | `npm run check` | 기존 |
**주의:** 이 목록의 `npm run check`에 `check:contrast`/`check:layout` 추가 여부는 계획자가 정한다(`check:layout`은 서버와 Edge가 필요하므로 `check`에 넣지 않는 편이 안전하다).

## 10초 테스트 체크포인트 (Q7)

`checkpoint:human-verify`로 만든다. 사용자(또는 사이트를 처음 보는 사람 1명)가 수행하고 결과를 `02-VERIFICATION.md`에 기록한다.

**준비:** `npx serve . -l 3100`(또는 기존 3000 서버)로 페이지를 열고, 휴대폰 또는 DevTools 375px와 데스크톱 1440px 두 곳에서 한다. 이전에 사이트를 보지 않은 사람이 이상적이다(사용자 본인이면 "처음 보는 척" 대신 가족/동료 1명 권장).
**진행자 대사:** "이 포트폴리오에서 *케이엔큐레이션*에서 맡은 *FSD 코스메틱*의 담당 업무와 퍼블 기여도를 찾아 소리 내어 읽어 주세요. 시작하면 초시계를 누릅니다."
**과제 3개(회사/프로젝트를 바꿔 반복):**
1. 케이엔큐레이션 → FSD 코스메틱 (담당 업무 행 없음: "원본에 없는 경우 행이 없다"를 읽는 사람이 헷갈리지 않는지도 관찰) → 기여도 100%
2. 지아이데이타 → 원데이보험앱화면리뉴얼 → 담당 업무와 기여도
3. 애비로드 → 피치 → 담당 업무와 기여도
**통과 기준:** 3개 중 2개 이상이 10초 이내, 호버나 확대 없이, 길 찾기에 쓴 클릭이 경력 행 링크 또는 키워드 목록 링크 1회 이하. 실패하면 관찰 메모(어디서 멈췄는지)를 남기고 CSS 수정 후 재시험.
**기록 서식:** `| 폭 | 과제 | 시간(초) | 사용한 경로 | 통과 |`.
**보조 자동 지표(선택, 미검증 A4):** 해시 이동 후 `.meta`의 가시성. CDP 스크립트에서 `Page.navigate url#kn-fsd` 뒤 `document.getElementById('kn-fsd').querySelector('.meta')`의 `top >= header.bottom`과 `bottom <= innerHeight`를 확인. 스크린샷 자리표시(16:10 또는 세로 9:16 200px)가 카드 상단을 차지하므로 `.meta`가 접힘선 아래로 내려가지 않는지 375/1440에서 본다.

## Security Domain

정적 사이트, 서버·인증·폼 없음. 해당 ASVS: V5(입력 검증)는 해당 없음, V14(구성)와 개인정보 보호만 실질적이다.

| 항목 | 적용 | 통제 |
|------|------|------|
| 전화번호 유출 | 예 | `check-repo`(pre-commit/pre-push), `dist/`·`*.pdf`·`out/` gitignore, Spike 출력은 `dist/`에만. 이 리서치는 번호를 읽거나 기록하지 않음 |
| 외부 요청 | 예 | 폰트 self-host, CDN 없음. 외부 링크는 `target=_blank rel=noopener` (check-content `links`가 강제) |
| 검색 노출 | 예 | `<meta name="robots" content="noindex, nofollow">` 유지 |
| 체커 산출물 | 예 | `.taste-skill/` 크롭에는 페이지 스크린샷이 담김. gitignore와 check-repo FORBIDDEN 패턴이 이미 제외 |
| 새 패키지 | 예 | pretendard 하나, postinstall 없음 |

## Sources

### Primary (HIGH confidence, 이 머신에서 직접 실행)
- `npm view pretendard`/`puppeteer@25.17.0`/`api.npmjs.org` (다운로드), `npm i pretendard@1.3.9` 후 `dist/` 구조 확인
- Edge 157.0.4341.42, Chrome 157.0.8103.27 headless: PDF 8종 생성 및 분석 (폰트 타입, MediaBox, 링크, 쪽 분할, 고정 헤더 반복, lazy 이미지)
- CDP 직접 스크립트: container query 자기 적용 불가 재현, 래퍼 해결 확인, 가로 스크롤 검사, 폰트 요청 수
- `~/.claude/skills/design-taste-frontend/scripts/consistency.mjs`, `gate.mjs` 실행 및 헤더 주석(waiver 규칙) 읽음
- 프로젝트 `tools/check-content.mjs`, `tools/check-repo.mjs`, `index.html`, `content-manifest.json` 읽음 및 프로토타입 변환 후 실행

### Secondary (MEDIUM)
- CLAUDE.md STACK 표(브라우저 지원 수치, Pretendard 크기). 이번 세션에서 woff2/Type3 주장 한 가지는 반증됨

### Tertiary (LOW)
- 없음 (미확인 사항은 Assumptions Log에 `A2`~`A6`으로 분리)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 패키지 구조와 크기를 직접 확인. 패키지 합법성 도구(slopcheck)만 미실행
- Architecture: HIGH — container query 제약, `@layer`+`@page` 동작, 콘텐츠 검사 변경은 모두 재현
- Pitfalls: HIGH — Edge CLI 비동기, 고정 헤더 반복, 파일명 규칙, waiver 한계는 실측. no-JS 헤더 높이는 설계 권고(구현 때 실측 필요)

**Research date:** 2026-11-11
**Valid until:** 브라우저/Skia 동작은 Chrome 메이저 업데이트(약 4주)마다 PDF 폰트 임베딩 결과를 재확인. 나머지는 30일.
