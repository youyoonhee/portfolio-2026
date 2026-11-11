<!-- GSD:project-start source:PROJECT.md -->
## Project

**퍼블리셔 유윤희 포트폴리오 2026**

앱·반응형 웹 퍼블리셔 유윤희의 이직용 포트폴리오다. 지금은 코드 없이 PDF 한 개(`퍼블리셔 유윤희-포트폴리오.pdf`, 8페이지)로만 존재하는데, 이를 단정한 미니멀 디자인의 반응형 웹사이트(HTML/CSS/JS)로 새로 만들고, 같은 디자인에서 제출용 PDF도 뽑아낸다. 주 독자는 이직 시 포트폴리오를 검토하는 채용 담당자와 실무 면접관이다.

**Core Value:** 채용 담당자가 짧은 시간 안에 "어떤 회사에서, 어떤 화면을, 얼마나 직접 퍼블리싱했는지"를 실제 화면과 함께 바로 파악할 수 있어야 한다. 그리고 사이트 자체의 마크업·반응형·완성도가 퍼블리셔 실력의 증거가 되어야 한다.

### Constraints

- **기술 스택:** 순수 HTML/CSS/JS(빌드 도구 없음) — 퍼블리셔 역량을 코드 그대로 보여주고, 정적 호스팅에 바로 올리기 위해
- **개인정보:** 웹에는 이메일만, 전화번호는 제출용 PDF에만 — 공개 사이트 노출 최소화
- **콘텐츠 정확성:** 원본 PDF에 없는 수치나 성과를 지어내지 않는다 — 채용 문서라서 사실만 담아야 함
- **반응형:** 모바일·태블릿·데스크톱 모두 지원 — 앱·반응형 웹 퍼블리셔라는 정체성과 직결
- **호환성:** 최신 Chrome, Safari(iOS 포함), Edge — 채용 담당자가 주로 쓰는 환경
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## 한 줄 결론
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| HTML (semantic) | Living Standard | 페이지 구조 | 퍼블리셔 역량을 보여주는 게 목적이다. `header/nav/main/section/article/footer`, `<dl>`(기간·기여도 메타), `<figure>`(스크린샷)를 쓰면 접근성과 PDF 태깅(`tagged: true`)에서 그대로 득을 본다. | HIGH |
| CSS (모던, 무전처리) | Baseline 기준 | 레이아웃·타이포·모션·인쇄 | SCSS가 하던 일(nesting, 변수, 모듈화)은 이제 네이티브 nesting(Safari 17.2+), custom properties, `@layer`(Safari 15.4+)로 다 된다. 전처리기를 쓰면 빌드 단계가 생겨 제약을 어긴다. | HIGH |
| JavaScript (ES2022+, `type="module"`) | — | 모바일 메뉴, 현재 섹션 표시, 히어로 진입 등 최소 상호작용 | 번들러 없이 `<script type="module" src="js/main.js">` 하나로 충분하다. jQuery는 불필요하다. | HIGH |
| Pretendard | **1.3.9** (2023-11 이후 최신, npm으로 확인) | 본문·제목 서체 | 한국 UI 업계의 사실상 표준 서체다. 라틴은 Inter, 한글은 Source Han Sans 계열로 화면 가독성이 좋다. **SIL OFL 1.1**이라 self-host와 PDF 임베딩이 자유롭다(서체만 따로 판매하는 것만 금지). **92조각 dynamic subset**을 공식 제공해서, 웹에서는 페이지에 실제로 쓰인 글자 조각만 받는다. | HIGH |
| Puppeteer | **25.17.0** (Node `>=22.12.0`) | 같은 HTML을 PDF로 렌더링 | Chrome의 인쇄 엔진을 그대로 쓴다. 옵션은 `preferCSSPageSize`, `printBackground`, `tagged`(기본 true), `outline`(북마크), `waitForFonts`(기본 true)를 쓴다. Chrome 131부터 `@page` margin box를 네이티브로 지원하므로 폴리필이 필요 없다. | HIGH |
| GitHub Pages | — | 정적 호스팅 | 무료이고 HTTPS를 기본 제공한다. 저장소 링크와 사이트 링크를 같이 낼 수 있어서, 채용 담당자에게 코드도 보여줄 수 있다. 한도는 사이트 1GB, 대역폭 100GB/월(soft)이다. | HIGH |
### Supporting Libraries / Assets (사이트에 포함되는 것)
| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Pretendard dynamic subset (self-hosted) | 1.3.9 | 웹 화면용 폰트 | `npm i -D pretendard@1.3.9`로 받은 뒤 `node_modules/pretendard/dist/web/static/woff2-dynamic-subset/`에서 **실제로 쓰는 굵기(예: 400/600/700)의 woff2만** `fonts/`에 복사하고, `pretendard-dynamic-subset.css`도 그 굵기의 `@font-face`만 남겨서 복사한다. 굵기 하나가 92개 `unicode-range` 조각이고, 브라우저는 필요한 조각만 받는다. | HIGH |
| Pretendard static TTF (`dist/public/static/alternative/*.ttf`) | 1.3.9 | **PDF 전용** 폰트 | `@media print`에서만 쓰는 별도 `font-family`(예: `"Pretendard Print"`)로 선언한다. 이유는 아래 "PDF 폰트" 항목에 있다. 용량을 줄이려면 `subset-font`(6.0.0)로 사이트에 쓰인 글자만 남긴다(선택). | MEDIUM |
| design-taste-frontend 키트 (`assets/` 복사본) | tasteskill 2.5.1 | 토큰, 버튼, 내비, 모션 레이어(`system.css`, `system.js`, `assets/motion`) | 프로젝트 디자인 기준이 이 스킬이다. 키트는 **정적 파일로 복사해서 로드**하는 방식이라 no-build 원칙과 충돌하지 않는다. 쓸 섹션과 자산만 남긴다. | MEDIUM (키트 내부는 이번에 검토하지 않음) |
### Development Tools (선택, 로컬 전용. 배포 산출물에는 영향 없음)
| Tool | Version | Purpose | Notes | Confidence |
|------|---------|---------|-------|------------|
| **Node.js** | **24 LTS 이상** | 아래 도구 실행 | **현재 로컬은 v20.20.2라서 Puppeteer 25(>=22.12), html-validate 11(^22.22 \|\| >=24.8), design-taste 스킬(22+)을 모두 실행할 수 없다.** 첫 phase에서 업그레이드해야 한다(`winget install OpenJS.NodeJS.LTS` 또는 nvm-windows). | HIGH (engines 필드로 확인) |
| sharp-cli | **6.1.0** (sharp 0.35.x) | 스크린샷을 AVIF/WebP/JPEG 여러 폭으로 변환 | libvips 기반이라 빠르고 AVIF를 지원한다. `@squoosh/cli`는 2023년 0.7.3에서 멈췄다. | HIGH |
| html-validate | **11.21.0** | 오프라인 HTML/접근성 규칙 검사 | `npx html-validate "*.html"`로 쓴다. `html-validate:recommended`에 `a11y` 규칙을 포함한다. 최종 확인은 W3C Nu Checker(https://validator.w3.org/nu/)에 배포 URL을 넣어 한 번 돌린다(Java가 필요한 `vnu-jar`는 설치하지 않는다). | HIGH |
| linkinator | **8.1.0** | 내부·외부 링크 깨짐 검사 | `npx linkinator . --recurse`. 프로젝트 외부 링크(운영 종료된 서비스, 기사, 소개서)가 많아서 꼭 필요하다. lychee는 Rust 바이너리라 Windows에서 설치가 번거롭고, npm의 `lychee` 패키지는 무관한 패키지다. | HIGH |
| serve | **14.2.7** | 로컬 http 서버 | `npx serve .`로 띄운다. `file://`에서는 ES module과 일부 폰트 로딩이 막히고, 검사 도구들도 http를 전제로 한다. | HIGH |
| Lighthouse (Chrome DevTools 내장) | Chrome 내장 | 성능·접근성·SEO 점검 | 별도 설치는 필요 없다. CI까지 원하면 `@lhci/cli`(0.16.0)를 쓰되, v1에서는 과하다. | HIGH |
| Prettier (선택) | 3.9.10 | 포맷 일관성 | 공개 저장소의 코드가 곧 포트폴리오이므로 정돈된 들여쓰기가 중요하다. | HIGH |
| Stylelint + stylelint-config-standard (선택) | 18.0.0 / 41.0.0 | CSS 실수 방지 | 넣으면 좋지만 필수는 아니다. | MEDIUM |
## 폰트 상세: Pretendard vs SUIT, 그리고 성능
- Pretendard 1.3.9는 9개 굵기, 가변 폰트, dynamic subset(굵기당 92조각), KS X 1001 2,350자 subset(Regular 기준 woff2 약 267KB)을 제공한다. 전체 static woff2는 굵기당 약 766KB이고, 가변 woff2는 약 2.06MB다(jsDelivr 응답 헤더로 확인). 그래서 **전체 파일을 그대로 쓰는 방식은 금지**한다.
- SUIT(sun-typeface, `@2`)도 OFL 1.1이고 Source Han Sans 기반이다. 하지만 공식 README에는 dynamic subset이 언급되지 않고, static/variable CSS만 안내한다. 같은 성능을 내려면 직접 subset해야 해서 손이 더 간다. 기하학적이고 날렵한 인상이 꼭 필요할 때만 대안으로 쓴다.
- **CDN 대신 self-host를 쓴다.** 브라우저 캐시 분할(cache partitioning) 이후로는 jsDelivr를 써도 다른 사이트와 캐시를 공유하지 못한다. 외부 의존이 없어야 PDF 빌드도 오프라인에서 결정적으로 나온다. 참고로 jsDelivr의 `gh/orioncactus/pretendard` 경로는 저장소 크기가 50MB를 넘어 일부 파일이 403으로 막힌다. 꼭 CDN을 써야 하면 `cdn.jsdelivr.net/npm/pretendard@1.3.9/...` 경로를 쓴다.
- 권장 설정은 다음과 같다.
## 모던 CSS: 지금 써도 되는 것 (MDN BCD 8.1.8 기준)
| 기능 | Chrome | Firefox | Safari / iOS | 판단 |
|------|--------|---------|--------------|------|
| `clamp()` 유동 타이포·여백 | 79 | 75 | 13.1 / 13.4 | **자유롭게 사용** |
| `:has()` | 105 | 121 | 15.4 | **사용** (예: 이미지가 없는 카드의 스타일 분기) |
| Container queries `@container` (size) | 105 | 110 | 16 | **사용**. 프로젝트 카드가 1/2/3열에서 스스로 레이아웃을 바꾸는 데 핵심이다. |
| CSS Nesting | 120 | 117 | 17.2 | **사용**. SCSS 대체. iOS 17.0~17.1은 지원하지 않지만 점유율이 무시할 수준이다. |
| `@layer` | 99 | 97 | 15.4 | **사용** (`reset, tokens, base, layout, components, utilities, print`) |
| `text-wrap: balance` | 114 | 121 | 17.5 | 사용 (미지원 시 무해) |
| `@starting-style` | 117 | 129 | 17.5 | 사용. 메뉴·dialog 진입 트랜지션에 JS 없이 쓴다. |
| Popover API / `<dialog>` | 114 / 37 | 125 / 98 | 17 / 15.4 | 모바일 메뉴, 스크린샷 확대에 사용 |
| `oklch()` 색 | 111 | 113 | 15.4 | 사용. 포인트 컬러 하나의 명도 단계를 만들 때 편하다. |
| `text-box-trim` | 133 | 154 | 18.2 | 점진적 향상 |
| Same-document View Transitions (`startViewTransition`) | 111 | 144 | 18 | 점진적 향상. 단일 페이지라면 쓸 일이 거의 없다. |
| **Cross-document View Transitions** (`@view-transition`) | 126 | **미지원** | 18.2 | 페이지를 나눌 때만 의미가 있다. **Baseline 아님**. 쓰더라도 `@media (prefers-reduced-motion: no-preference)` 안에서만 쓴다. |
| **Scroll-driven animations** (`animation-timeline`) | 115 | 159 | **26** | **Baseline "newly available"(2026-10-27)**. iOS 18 이하에는 없다. 반드시 `@supports (animation-timeline: view())`와 reduced-motion으로 감싼다. design-taste 규칙상 스크롤 연동 모션은 "dealt moment" 1~2개에만 허용된다. |
| Anchor positioning | 125 | 147 | 26 | v1에서는 쓰지 않는다(iOS 26 미만에서 없음). |
| `interpolate-size` / `calc-size()` | 129 | 없음 | 없음 | **쓰지 않는다** (Chrome 전용) |
| `@scope` | 118 | 146 | 26.4 | 쓰지 않는다(너무 최신). `@layer`와 클래스 규칙으로 충분하다. |
| Style container queries | 111 | 151 | 18 | 선택. 꼭 필요하지 않다. |
## 모션: 라이브러리 없이
- **기본은 CSS transition**이다. 호버 시 카드 2px 상승, 이미지 1.02배 확대, 밑줄 그리기는 design-taste 규칙 5번에 해당한다. `transform`과 `opacity`만 애니메이트한다.
- **히어로 진입 1회:** CSS `@keyframes`에 `animation-fill-mode: both`를 주거나, 키트의 `data-enter`/`m-enter`를 쓴다. 순차 진입이 필요하면 Web Animations API(`el.animate()`)와 `--i` 커스텀 프로퍼티 지연으로 한다.
- **"보이면 재생"이 꼭 필요한 곳(dealt moment 1~2개):** `IntersectionObserver`(모든 대상 브라우저 지원)로 클래스만 토글한다. 스크롤 진행률에 묶어야 할 때만 scroll-driven animations를 `@supports` 안에서 쓴다.
- **필수:** `@media (prefers-reduced-motion: reduce)`에서 모든 모션을 끄고 콘텐츠가 숨은 상태로 남지 않게 한다. 초기 `opacity: 0`은 JS가 `html.js` 클래스를 붙였을 때만 적용한다. 그래야 PDF나 JS 실패 상황에서도 내용이 보인다.
- **print에서는 모션을 전부 끈다**(`@media print { *, *::before, *::after { animation: none !important; transition: none !important; } }`). 그리고 진입 전 상태(`opacity:0`)가 PDF에 찍히지 않게 한다.
## 반응형 이미지 (프로젝트 스크린샷)
- 포맷: **AVIF → WebP → JPEG 폴백**을 `<picture>`로 넣는다. AVIF는 Safari 16.4 / iOS 16.1+이고 2024-01부터 Baseline이다. WebP는 iOS 14+다. 대상 환경에서는 폴백이 사실상 쓰이지 않지만, PDF용(아래)으로 JPEG가 필요하다.
- UI 스크린샷은 글자가 많아서 AVIF 기본 설정(4:2:0 크로마)으로 압축하면 작은 글씨 주변이 번진다. **AVIF `quality≈60–70` + `chromaSubsampling: '4:4:4'`, WebP `quality≈80`**에서 시작해 눈으로 비교한다.
- 폭: 카드 썸네일과 상세 이미지 기준으로 **480 / 960 / 1440 / 1920w** 정도를 만들고, `sizes`는 실제 CSS 레이아웃에 맞춰 작성한다(예: `(min-width: 1024px) 40vw, 100vw`). 앱 화면처럼 세로로 긴 스크린샷은 폭을 더 작게 잡는다.
- `width`/`height` 속성을 반드시 넣어 CLS를 막는다. 첫 화면 밖은 `loading="lazy" decoding="async"`, 히어로 이미지 하나만 `fetchpriority="high"`(Safari 17.2+)를 준다.
- 원본(`images/_src/`)은 저장소에 두되 배포가 무거워지지 않게 관리한다. 대안은 원본을 `.gitignore`에 넣고 변환 결과만 커밋하는 것이다.
# 예: 한 장을 4가지 폭 x 3포맷으로 (sharp-cli 6.x)
## PDF 생성: print CSS + Puppeteer (Paged.js는 쓰지 않음)
- **Paged.js를 쓰지 않는 이유:** npm `pagedjs`는 0.4.3에서 2024-10 이후 멈춰 있다. Chrome 131이 `@page` margin box를 네이티브로 지원하면서, 페이지 번호와 머리글·바닥글 같은 Paged.js의 핵심 장점이 Puppeteer 경로에서는 필요 없어졌다. 또 Paged.js는 DOM을 페이지 단위로 쪼개 다시 배치하기 때문에 grid/flex/container query 레이아웃과 충돌하기 쉽다. 이 PDF는 섹션 하나가 한 페이지인 "슬라이드형"이라 `break-before: page`로 충분하다.
- **margin box는 Chrome 전용**(Safari/Firefox 미지원)이다. 그래서 PDF는 반드시 Puppeteer(Chrome)로 만든다. 사용자가 Safari에서 직접 인쇄해도 깨지지만 않으면 된다.
- **이미지:** 헤드리스 Chrome도 `<picture>`에서 AVIF를 고른다. Skia PDF는 JPEG가 아닌 이미지를 재인코딩하므로 PDF 용량이 커지거나 품질이 달라질 수 있다(LOW, 측정 필요). PDF 스크립트에서 `<source>`를 제거해 JPEG `src`를 쓰게 하고, 결과 파일 크기를 확인한다. 목표는 5MB 안쪽이다(채용 사이트 업로드 제한 대비).
- **텍스트 레이어 확인:** 인쇄 결과에서 한글을 복사하고 붙여넣었을 때 깨지지 않는지, 링크가 클릭되는지 확인한다(Chrome PDF는 `<a href>`를 링크 주석으로 넣는다).
- **zero-install 대안:** 설치된 Edge/Chrome CLI도 쓸 수 있다. `msedge --headless --no-pdf-header-footer --print-to-pdf=out.pdf http://localhost:3000/`. 다만 북마크(`outline`), 전화번호 주입, 폰트 대기를 제어할 수 없어서 빠른 미리보기용으로만 쓴다.
## GitHub Pages 배포
- 공개 저장소에서 **Settings > Pages > Deploy from a branch: `main` / `(root)`**. 무료 플랜의 Pages는 공개 저장소를 전제로 한다. 비공개 저장소에서 Pages를 쓰려면 유료 플랜이 필요하다(MEDIUM).
- 루트에 **`.nojekyll`**를 둔다. 이게 없으면 Jekyll이 `_`로 시작하는 폴더(`images/_src` 등)를 무시하고 빌드 시간도 쓴다.
- `404.html`을 둔다. 저장소 이름이 `<user>.github.io`가 아니면 사이트가 `/<repo>/` 하위 경로로 서비스되므로 **모든 경로를 상대경로로 쓴다**(`/css/...` 금지).
- 커스텀 헤더(Cache-Control, CSP)는 설정할 수 없다. 필요한 메타는 `<meta>`로 넣는다(`<meta name="referrer">`, OG 태그 등).
- **`.gitignore`에 반드시 추가할 것:** `node_modules/`, `out/`(생성된 PDF, **전화번호 포함**), `.private/`(전화번호 원본), `.taste-skill/`의 크롬 프로필과 스크린샷. 공개 저장소에 들어간 것은 Pages로 공개된다.
- `package.json`, `tools/`가 루트에 같이 배포되는 건 무해하다. 오히려 "도구까지 갖춘 저장소"로 읽힌다. 사이트 폴더만 분리하려면 GitHub Actions(`actions/upload-pages-artifact` + `actions/deploy-pages`)로 바꿔야 하는데, v1에서는 필요 없다.
## Installation
# 0) Node 업그레이드 (현재 v20.20.2 → 24 LTS 이상)
# 1) 사이트 자체: 설치할 것 없음 (index.html + css/ + js/ + fonts/ + images/)
# 2) 로컬 도구 (devDependencies만, 사이트는 이것을 로드하지 않음)
# 선택
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Pretendard | SUIT (`@2`, OFL) | 더 기하학적이고 촘촘한 인상이 디자인상 꼭 필요할 때. 이 경우 직접 subset해야 한다. |
| Pretendard dynamic subset (self-host) | Pretendard KS X 1001 subset(굵기당 ~267KB woff2) | 파일 수를 줄이고 싶을 때. 포트폴리오 텍스트는 고정이라 2,350자 밖의 글자가 나올 위험이 낮다. 다만 지금 쓰는 글자로 확인해야 한다. |
| Self-host | jsDelivr `npm/pretendard@1.3.9` CDN | 프로토타입 단계에서 빨리 보고 싶을 때만 쓴다. 출시 전에는 self-host로 바꾼다. |
| Puppeteer 25 | Playwright 1.65 (`page.pdf`, Chromium만) | 이미 Playwright로 E2E를 쓰고 있다면. 여기서는 PDF 한 가지 용도라 Puppeteer가 더 가볍고 직관적이다. |
| Puppeteer | Edge/Chrome `--headless --print-to-pdf` CLI | Node 없이 빠른 미리보기를 볼 때. |
| print CSS + Chrome | Paged.js 0.4.3 / pagedjs-cli | 책처럼 흐르는 긴 문서에서 각주, 교차참조(`target-counter`), 이름 붙은 문자열 머리글이 필요할 때. 이 프로젝트에는 해당하지 않는다. |
| print CSS + Chrome | WeasyPrint / Prince | CSS Paged Media를 완벽하게 지원해야 할 때. 하지만 브라우저와 렌더링이 달라져서 "같은 디자인"이라는 요구를 어기고, Prince는 유료다. |
| sharp-cli / sharp API | Squoosh 웹앱(squoosh.app) | 이미지 몇 장을 눈으로 비교하며 품질을 정할 때. 일괄 처리는 sharp로 한다. |
| GitHub Pages (branch) | Netlify / Cloudflare Pages | 커스텀 헤더, 리다이렉트, 폼이 필요할 때. 지금 요구사항에는 없다. |
| linkinator | lychee (Rust, GitHub Action) | CI에서 링크 검사를 자동화할 때 `lycheeverse/lychee-action`을 쓴다. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React/Vue/Angular, Astro, 11ty 등 SSG | 프로젝트 제약 위반이다. 순수 마크업 역량을 보여주는 게 목적이다. | 손으로 쓴 HTML |
| SCSS/Sass, PostCSS, Tailwind | 빌드 단계가 생긴다. 네이티브 nesting, 변수, `@layer`로 대체할 수 있다. | 모던 CSS |
| jQuery, Bootstrap | 이력서에 이미 있는 스킬이다. 사이트는 "현재 기준" 역량을 보여줘야 하고, 용량도 낭비다. | Vanilla JS, 직접 짠 grid |
| GSAP, AOS, ScrollReveal, Lenis, Swiper | AOS류의 "섹션마다 스크롤 페이드인"은 design-taste가 명시적으로 금지한다. Lenis 같은 스크롤 하이재킹도 금지 항목이고, 캐러셀도 금지다. | CSS transition, WAAPI, IntersectionObserver |
| Pretendard **가변/정적 전체 woff2**를 웹에 그대로 | 각각 2.06MB, 굵기당 766KB라 모바일 첫 로딩을 망친다. | dynamic subset |
| **woff2/가변 폰트로 PDF 출력** | Chrome Skia가 Type3로 변환한다. 폰트명이 사라지고 검색·복사 품질이 떨어질 수 있다. | 정적 TTF를 print 전용으로 |
| Google Fonts의 Noto Sans KR | 동작은 하지만 Pretendard보다 UI 가독성과 라틴 조합이 떨어진다. 외부 요청도 생긴다. | Pretendard |
| Paged.js | 2024 이후 정체 상태이고 레이아웃과 충돌한다. Chrome 131+ margin box로 대체된다. | `@page` + Puppeteer |
| `@squoosh/cli` | 2023년 이후 방치됐고 최신 Node에서 문제가 생긴다. | sharp / sharp-cli |
| `html2pdf.js`, `jsPDF` + `html2canvas` | 페이지를 **비트맵으로** 찍어서 텍스트 선택, 검색, 링크가 사라지고 한글도 흐려진다. | Chrome 인쇄 엔진 |
| `interpolate-size`, `calc-size()`, `@scope`, anchor positioning | Safari/iOS 지원이 없거나 너무 최신이다(iOS 26+). | 기존 기법 |
| 절대경로(`/img/...`) | 프로젝트 Pages(`/<repo>/`)에서 깨진다. | 상대경로 |
| `file://`로 미리보기 | module script와 폰트가 막히고 검사 도구와 결과가 달라진다. | `npx serve .` |
## Stack Patterns by Variant
- 섹션 앵커 내비 + `scroll-margin-top` + `scroll-behavior: smooth`(reduced-motion에서는 끔)
- View Transitions는 쓰지 않는다.
- PDF는 같은 페이지에서 섹션마다 `break-before: page`로 나눈다.
- `@view-transition { navigation: auto; }`를 reduced-motion 가드 안에서 점진적 향상으로 쓴다(Chrome 126+, Safari 18.2+, Firefox는 그냥 일반 이동).
- PDF는 Puppeteer로 각 페이지를 열어 PDF를 만들고 병합해야 한다(`pdf-lib` 필요). 그래서 **PDF용 내용은 index.html 하나에 모두 들어 있게** 설계하는 편이 훨씬 단순하다.
- `@page { size: A4 landscape; margin: 0 }` 또는 `size: 297mm 167mm`(16:9). 원본 PDF의 페이지 크기는 phase에서 확인한다(`pdfinfo`).
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| puppeteer@25.17.0 | Node >=22.12.0 | Chrome for Testing을 자동으로 받는다(~170MB, 최초 1회). 로컬 Node 20에서는 동작하지 않는다. |
| html-validate@11.21.0 | Node ^22.22.0 \|\| >=24.8.0 | Node 22 초기 버전에서는 안 된다. Node 24 LTS 이상을 권장한다. |
| sharp@0.35.x / sharp-cli@6.1.0 | Node >=20.9.0 | Windows x64 prebuilt 바이너리가 있다. |
| design-taste-frontend 스킬 스크립트 | Node 22+, Chrome/Edge | 스킬의 gate와 checker가 같은 Node 요구사항을 가진다. |
| `@page` margin boxes | Chrome/Edge 131+ | Safari/Firefox는 미지원이므로 PDF 생성은 Chrome에서만 한다. |
| Pretendard 1.3.9 | 모든 대상 브라우저 | `unicode-range`는 전 브라우저에서 지원한다. |
## Sources
- npm registry (`npm view`, 2026-11-11 실행): pretendard 1.3.9, puppeteer 25.17.0(engines node>=22.12.0), html-validate 11.21.0, sharp 0.35.5, sharp-cli 6.1.0, linkinator 8.1.0, serve 14.2.7, playwright 1.65.0, pagedjs 0.4.3(2024-10), @squoosh/cli 0.7.3(2023-01), subset-font 6.0.0. HIGH
- MDN browser-compat-data 8.1.8 + web-features (unpkg): 위 지원 표 전체. scroll-driven-animations는 Baseline low(2026-10-27), cross-document view transitions는 Baseline 아님(Firefox 미지원), AVIF는 Baseline(2024-01), page margin box는 Chrome 131만. HIGH
- https://github.com/orioncactus/pretendard: OFL, dynamic subset, CDN 경로. HIGH. jsDelivr 응답 헤더로 파일 크기 확인(woff2 766KB/가변 2.06MB/subset 267KB), dynamic-subset CSS의 `@font-face` 828개(9굵기 x 92). HIGH
- https://github.com/sun-typeface/SUIT: OFL 1.1, Source Han Sans 기반, `@2` CDN, dynamic subset 언급 없음. MEDIUM
- https://pptr.dev/api/puppeteer.pdfoptions: `preferCSSPageSize`, `printBackground`, `tagged`(기본 true), `outline`(실험적), `waitForFonts`(기본 true). HIGH
- https://developer.chrome.com/blog/print-margins , https://developer.chrome.com/blog/new-in-chrome-131: `@page` margin box(Chrome 131). HIGH
- https://groups.google.com/a/chromium.org/g/chromium-dev/c/O-a4sW3nLNo (Ben Wagner, 2025-12-17): woff2/가변 폰트는 PDF에서 Type3, non-woff2·non-variable TrueType만 직접 임베딩. MEDIUM (공식 문서가 아닌 개발자 발언. 실제 PDF로 검증 필요)
- https://webkit.org/blog/17333/webkit-features-in-safari-26-0/: Safari 26의 scroll-driven animations. HIGH
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits: 1GB, 100GB/월, 10분 배포 제한. HIGH
- design-taste-frontend SKILL.md(로컬): Node 22+, Chrome 필요. 스크롤 페이드인, 캐러셀, 스크롤 하이재킹, 틸트 금지. 호버 모션 규칙. 정적 키트 복사 방식.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
