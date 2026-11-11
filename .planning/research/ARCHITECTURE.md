# Architecture Research

**Domain:** 직접 손으로 작성한 정적 포트폴리오 사이트 (순수 HTML/CSS/JS, GitHub Pages)와 같은 소스에서 뽑는 제출용 PDF
**Researched:** 2026-11-11
**Confidence:** MEDIUM-HIGH (CSS·print·headless Chrome 동작은 공식 문서로 확인했다. 스킬 키트와 어떻게 통합할지는 로컬 파일을 직접 읽고 판단했다. lazy 이미지 인쇄 동작은 검증하지 못했다.)

---

## 핵심 결론 (먼저 읽을 것)

1. **페이지는 `index.html` 한 장으로 만든다.** 13개 프로젝트를 회사별 섹션 4개로 묶는다. 프로젝트별 상세 페이지는 v1에서 만들지 않는다.
2. **콘텐츠는 HTML에 직접 쓴다.** JSON 파일을 JS로 렌더링하는 방식은 쓰지 않는다. JS 없이도 보이고, SEO와 인쇄가 바로 되고, "view-source가 곧 실력 증거"가 되기 때문이다.
3. **PDF는 같은 `index.html`에 `@media print`(`css/print.css`)를 적용해 만든다.** 전화번호는 공개 저장소에 넣지 않는다. 로컬 스크립트(`tools/build-pdf.mjs`)가 git에서 제외된 파일에서 번호를 읽어 임시 사본에 넣은 뒤 headless Chrome으로 PDF를 만든다.
4. **CSS는 `@layer`로 순서를 고정한다.** 스킬 키트(`system.css`)는 가장 낮은 `kit` 레이어에 넣는다. 직접 쓴 토큰·컴포넌트·print가 그 위에서 이긴다.
5. **스크린샷은 원본(`_screenshots/`, git 제외)과 최적화본(`img/projects/<id>/`, 커밋)을 나눈다.**

---

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                     Source (git에 커밋됨, 공개)                     │
├───────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐  │
│  │ index.html │  │ css/*.css     │  │ js/main.js│  │ img/       │  │
│  │ (콘텐츠 전부 │  │ @layer 순서   │  │ (점진적    │  │ projects/  │  │
│  │  시맨틱 HTML)│  │ tokens→print │  │  향상만)   │  │ (최적화본)  │  │
│  └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  └─────┬──────┘  │
│        │                │                │              │         │
│        │        ┌───────┴────────┐       │              │         │
│        │        │ assets/ (스킬 키트,│       │              │         │
│        │        │ 수정 금지, kit 레이어)│     │              │         │
│        │        └────────────────┘       │              │         │
├────────┴─────────────────────────────────┴──────────────┴─────────┤
│                         Output 두 갈래                              │
├──────────────────────────────┬────────────────────────────────────┤
│  Web (GitHub Pages)          │  PDF (로컬에서만 생성)                │
│  index.html 그대로 서빙        │  tools/build-pdf.mjs                │
│  @media screen 규칙           │   1) index.html → 임시 사본          │
│  이메일만 노출                 │   2) private/contact.json의 전화번호  │
│                              │      를 [data-slot="phone"]에 주입   │
│                              │   3) loading="lazy" 제거             │
│                              │   4) chrome --headless               │
│                              │      --print-to-pdf                  │
│                              │      --no-pdf-header-footer          │
│                              │   → dist/유윤희-포트폴리오.pdf (git 제외)│
├──────────────────────────────┴────────────────────────────────────┤
│                 Local only (.gitignore, 공개 안 됨)                  │
│  _screenshots/ (원본)   private/contact.json (전화번호)   dist/      │
│  .taste-skill/ (스킬 게이트 기록·크롬 프로필)                          │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | 책임 (소유하는 것) | 구현 방식 | 의존/통신 대상 |
|-----------|------------------|-----------|---------------|
| `index.html` | **모든 텍스트 콘텐츠의 단일 원본.** 표지/소개, Skills, Career 요약, 회사 4곳 × 프로젝트 13개, Contact | 시맨틱 HTML: `header`, `nav`, `main > section`, `article.project`, `dl`(메타), `figure`/`picture`(스크린샷) | css가 모양을, js가 동작을 더한다. HTML은 둘 다 몰라도 완결된다 |
| `css/tokens.css` | 색·타이포·간격·반경 등 디자인 토큰 | `:root` 커스텀 프로퍼티. 키트의 `--p-*` 팔레트 변수를 **덮어쓰는 방식**으로 연결하고, 두 번째 토큰 체계는 만들지 않는다 | 모든 CSS 레이어가 읽는다 |
| `css/base.css` | 요소 기본값(본문, 링크, 포커스 링, 이미지) | `@layer base` | tokens |
| `css/layout.css` | 페이지 골격(`.wrap`, 섹션 간격, 회사 섹션 그리드, 반응형 분기) | `@layer layout`, 375/768/1440 기준 | tokens, base |
| `css/components.css` | 프로젝트 카드, 메타 배지(App/Web·기여도·운영 상태), 스킬 목록, 경력 타임라인, 스크린샷 프레임(모바일 세로형/웹 가로형) | `@layer components`, BEM 비슷한 단일 클래스 | tokens |
| `css/print.css` | PDF 출력 전용 규칙 | `<link media="print">`, `@layer print`, `@page`, `break-*` | 위의 모든 레이어를 덮어쓴다 |
| `js/main.js` | 점진적 향상만 담당: 모바일 메뉴 토글, 스크린샷 확대(`<dialog>`), 현재 섹션 표시 | `type="module"`, `defer`. **콘텐츠를 만들어 넣지 않는다** | DOM을 읽기만 하고 `data-*` 속성을 토글한다 |
| `assets/` (스킬 키트) | design-taste-frontend의 `system.css`, `system.js`, `motion/`, 아이콘 | 스킬 지시대로 그대로 복사하고 **수정하지 않는다** | `css/`가 `@layer kit`으로 가져온다 |
| `img/projects/` | 최적화한 스크린샷 | WebP, 너비 2종(예: 800w/1600w), `width`·`height` 명시 | index.html의 `<picture>`/`srcset`이 가리킨다 |
| `tools/build-pdf.mjs` | PDF 생성 (전화번호 주입 포함) | Node 22 내장 모듈만 쓰고(의존성 0), 로컬 Chrome/Edge를 실행한다 | 읽기: index.html, private/. 쓰기: dist/ |
| `tools/optimise-images.mjs` (선택) | 원본을 최적화본으로 변환 | sharp를 `npx`로 쓰거나 ffmpeg/cwebp 사용. 사이트 런타임과 무관한 일회성 작업 | 읽기: `_screenshots/`, 쓰기: `img/projects/` |

---

## 결정 1: 단일 페이지 vs 인덱스 + 프로젝트별 상세 페이지

**권장: `index.html` 한 장. 회사별 섹션 4개 안에 프로젝트 `article`을 둔다.**

| 기준 | 단일 페이지 | 인덱스 + 상세 13장 |
|------|------------|-------------------|
| 채용 담당자 스캔 속도 (Core Value) | 스크롤 하나로 "어디서·무엇을·얼마나"가 다 보인다 | 클릭하고 돌아오는 왕복이 13번 생긴다 |
| PDF 생성 | 한 페이지를 인쇄하면 끝이다. 원본 PDF처럼 회사별 페이지 나눔이 1:1로 맞는다 | 14개 문서를 합쳐야 해서 병합 도구가 필요하다 |
| 콘텐츠 분량 | 프로젝트당 설명이 2~5줄이라 상세 페이지를 채울 내용이 없다 (원본에 없는 내용을 지어내면 안 된다) | 빈약한 상세 페이지 13장이 생긴다 |
| 유지보수 (빌드 없음) | 헤더·푸터가 한 벌뿐이다 | 헤더·푸터·head가 14벌 복제된다 |
| 스킬 게이트 | 한 페이지만 검사하면 된다 | 페이지마다 게이트를 돌려야 한다 |
| SEO | 한 URL에 신호가 모인다 | 롱테일에 약간 유리하지만 이 용도에서는 의미 없다 |

- 각 프로젝트에 `id`(예: `#kn-puring`)를 붙여 **딥링크**를 지원한다. "이 프로젝트 봐 주세요"처럼 링크로 공유할 수 있으면 상세 페이지의 장점 대부분을 얻는다.
- 스크린샷이 여러 장인 프로젝트는 카드에 대표 1~2장만 보여 주고, 나머지는 `<dialog>` 확대 보기(JS 향상)로 넘긴다. JS가 없으면 `<a href="img/...1600.webp">`로 원본 크기 이미지를 연다.
- **v2 확장 경로:** 나중에 프로젝트 상세(케이스 스터디)가 필요해지면 `projects/<id>.html`을 추가하고 index 카드를 링크로 바꾼다. 지금 구조가 그 확장을 막지 않는다.

**스킬 규칙과 부딪히는 지점 (주의):** design-taste-frontend는 "섹션 하나 = 화면 1~2개(100svh 배수)"를 강제한다(`system.css` 223행 근처의 `height: calc(var(--h,1) * 100svh)`). 회사 섹션에 프로젝트가 7개(케이엔큐레이션)라면 1440x900 화면 2개 안에 들어가지 않을 수 있다. 대응 방법은 이렇다. (a) 카드를 촘촘한 그리드로 만들어 화면 2개 안에 맞춘다. (b) 케이엔큐레이션만 섹션 2개로 나눈다(예: 앱 / 웹). (c) 그래도 FAIL이 나면 `.taste-skill/waivers.json`에 "채용 문서, 원본 콘텐츠 분량" 사유로 면제를 기록한다. 이 판단은 레이아웃 단계에서 확정한다.

---

## 결정 2: 13개 프로젝트 콘텐츠를 어디에 둘까

**권장: `index.html`에 직접 쓴다. JSON + 클라이언트 렌더링은 쓰지 않는다.**

| 기준 | HTML 직접 작성 | `data/projects.json` + JS 렌더 |
|------|---------------|-------------------------------|
| JS 없이 보이는가 | 그대로 보인다 | 빈 화면이 된다 |
| SEO / 공유 미리보기 | 크롤러가 바로 읽는다 | Google은 렌더링하지만 늦다. 다른 크롤러와 미리보기는 실패할 수 있다 |
| 인쇄 / PDF | DOM이 처음부터 완성돼 있어 headless 인쇄가 안정적이다 | fetch가 끝나기 전에 인쇄될 수 있다. `--virtual-time-budget` 같은 타이밍 조정이 필요하다 |
| `file://`로 열기 | 된다 | `fetch()`가 CORS에 막힌다 (로컬 미리보기가 깨진다) |
| 퍼블리셔 역량 증명 | view-source가 곧 시맨틱 마크업 샘플이다 | 마크업이 JS 템플릿 문자열 속에 묻힌다 |
| 유지보수 | 13개 `article`을 같은 패턴으로 반복한다. 고칠 곳이 한 파일이다 | 데이터·템플릿이 분리돼 이론상 편하지만, 13개 규모에서는 이점이 작다 |

**HTML 직접 작성의 약점(구조가 제각각 흩어질 위험)은 이렇게 보완한다.**
- `index.html` 맨 위 주석에 **프로젝트 article 템플릿 1벌**을 둔다. 새 프로젝트는 이 템플릿을 복사해서 만든다.
- 모든 프로젝트가 같은 슬롯을 가진다. 회사·기간·플랫폼·담당 업무·기여도·링크/운영 상태를 `dl.project__meta`의 `dt`/`dd` 순서로 고정한다.
- 상태값은 `data-*`로 표현한다: `data-platform="app|web|app web"`, `data-status="live|closed|article-only|apk"`. CSS가 배지 모양을 이 값에서 만들기 때문에 텍스트와 모양이 어긋나지 않는다.
- (선택) `tools/check-content.mjs`: 모든 `article.project`에 필수 슬롯이 있는지, `img`에 `alt`가 있는지, `tel:`이나 전화번호 패턴이 없는지 정규식으로 검사한다. 의존성 없는 Node 스크립트로 만든다.

```html
<!-- PROJECT TEMPLATE: 복사해서 사용. 슬롯 순서 고정 -->
<article class="project" id="kn-puring" data-platform="app" data-status="apk">
  <header class="project__head">
    <h4 class="project__title">puring</h4>
    <p class="project__summary">…원본 PDF 문장 그대로…</p>
  </header>
  <dl class="project__meta">
    <div><dt>기간</dt><dd><time datetime="2023-09">2023.09</time> ~ <time datetime="2024-03">2024.03</time></dd></div>
    <div><dt>플랫폼</dt><dd>App</dd></div>
    <div><dt>담당</dt><dd>…</dd></div>
    <div><dt>기여도</dt><dd><data value="100">100%</data></dd></div>
    <div><dt>상태</dt><dd>APK 보유</dd></div>
  </dl>
  <figure class="shot shot--phone">
    <picture>
      <img src="img/projects/kn-puring/01-800.webp"
           srcset="img/projects/kn-puring/01-800.webp 800w, img/projects/kn-puring/01-1600.webp 1600w"
           sizes="(min-width: 1024px) 360px, 80vw"
           width="800" height="1733" alt="puring 앱 메인 화면" loading="lazy" decoding="async">
    </picture>
  </figure>
</article>
```

> 제목 단계: `h1`(이름/표지) → `h2`(Skills, Career, 회사명, Contact) → `h3`(회사 섹션 안의 소제목, 필요할 때만) → 프로젝트. 회사 섹션에 h3가 없다면 프로젝트 제목은 **`h3`**로 둔다. 스킬 체커의 `heading-order`가 단계를 건너뛰는지 검사하므로, 실제 마크업을 짤 때 한 단계씩 내려가도록 확정한다.

---

## 결정 3: CSS 아키텍처

**권장: 파일 6개 + `@layer` 순서 선언 1줄. 빌드 없이 `<link>` 여러 개로 불러온다.**

```html
<!-- head: 순서가 곧 우선순위 선언 -->
<link rel="stylesheet" href="css/layers.css">                 <!-- @layer kit, tokens, base, layout, components, utilities, print; + @import kit -->
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/print.css" media="print">    <!-- 화면 렌더링을 막지 않음 -->
```

```css
/* css/layers.css */
@layer kit, tokens, base, layout, components, utilities, print;
@import url("../assets/system.css") layer(kit);
@import url("../assets/motion/motion.css") layer(kit);
```

- **왜 `@layer`인가:** 키트의 `system.css`(약 104KB)는 레이어 없이 작성돼 있다. 그대로 링크하면 레이어 밖 스타일이라 **우리가 레이어 안에 쓴 규칙보다 항상 이긴다.** `@import … layer(kit)`으로 키트를 가장 낮은 레이어에 넣으면, 우리 코드는 선택자 명시도 싸움 없이 키트를 덮어쓸 수 있다. 키트 파일 자체는 고치지 않으므로 스킬의 "키트 수정 금지" 규칙도 지킨다. (`@layer`와 `@import layer()`는 Chrome 99+, Safari 15.4+, Edge 99+에서 지원돼 대상 브라우저가 모두 포함된다.)
- **주의:** `@import`는 반드시 `@layer` 선언문 다음, 다른 규칙보다 앞에 둔다. `@import`는 직렬로 요청되지만, 키트 파일 2개 정도라면 GitHub Pages(HTTP/2)에서 체감 차이가 없다.
- **토큰:** 우리 토큰을 따로 만들지 않고 **키트 변수(`--p-bg`, `--p-ink`, `--p-accent`, `--font-display`, `--r-*` 등)에 값을 넣는 방식**으로 연결한다. 스킬은 "두 번째 그리드·간격·타입 스케일을 만들지 말라"고 요구한다. 포트폴리오 전용 의미 토큰(`--project-gap`, `--badge-closed` 같은 것)만 `tokens.css`에 추가하고, 이것도 키트 토큰을 참조하게 만든다.
- **컴포넌트 파일:** 13개 프로젝트 규모에서는 `components.css` 한 파일 안에 주석 블록으로 구분하는 편이 낫다. `components/*.css`로 쪼개면 빌드가 없으니 `<link>`나 `@import`가 늘어난다. 파일이 600줄을 넘을 때만 나눈다.
- **반응형:** 모바일 우선 `min-width` 미디어쿼리(768, 1024, 1440 근처)를 쓰고, 카드 내부는 컨테이너 쿼리(`container-type: inline-size`)로 처리한다. 같은 프로젝트 카드가 1열/2열 어디에 들어가도 스스로 배치를 바꾼다.
- **print.css를 별도 파일로 두는 이유:** `media="print"`를 붙인 링크는 화면 첫 렌더링을 막지 않는다. 또 PDF 규칙을 한곳에서 감사할 수 있다. 파일 안에서도 `@layer print { … }`로 감싸 최상위 레이어 순서를 따르게 한다.

### Print 스타일시트의 필수 규칙

```css
@layer print {
  @page { size: A4; margin: 14mm 14mm 16mm; }
  @page :first { margin: 0; }                         /* 표지 꽉 채우기(선택) */

  html { print-color-adjust: exact; -webkit-print-color-adjust: exact; }

  /* 1) 키트의 100svh 섹션 높이를 끈다. 이걸 빼면 섹션마다 빈 페이지가 생긴다 */
  main > section, .hero, .section { height: auto !important; min-height: 0 !important; }

  /* 2) 등장 애니메이션 초기상태(opacity:0/transform)를 해제한다. 빠뜨리면 빈 영역이 인쇄된다 */
  [data-enter], .m-enter, [data-enter] * { opacity: 1 !important; transform: none !important; animation: none !important; transition: none !important; }

  /* 3) 화면 전용 요소 숨김 */
  .skip-link, .site-nav, .menu-toggle, dialog, .loop-pause { display: none !important; }

  /* 4) 페이지 나눔: 원본 PDF 구조(표지 / Skills+Career / 회사별 / Contact)를 재현 */
  #skills, .company, #contact { break-before: page; }
  .project, .shot, .project__meta { break-inside: avoid; }
  h2, h3 { break-after: avoid; }

  /* 5) PDF 전용 슬롯 표시 (전화번호는 build-pdf.mjs가 채운다) */
  [data-print-only] { display: revert !important; }
}
/* 화면에서는 숨김 (screen 규칙은 components/base 레이어에 둔다) */
/* [data-print-only] { display: none; } */
```

- 링크: Chrome의 PDF 출력은 하이퍼링크를 살려 둔다. 그래서 URL을 `::after`로 펼쳐 쓰기보다 **링크 텍스트 자체를 의미 있게** 쓴다(예: "ADDY 서비스 소개서 보기"). 종이로 인쇄할 때를 대비하려면 짧은 URL만 `::after { content: " (" attr(href) ")" }`로 보여 준다.
- `@page` 여백 상자(페이지 번호, 머리말)는 Chrome 131부터 지원된다. 페이지 번호가 필요하면 `@page { @bottom-right { content: counter(page); } }`를 쓴다. Safari에서는 동작이 다를 수 있지만, PDF 생성은 Chrome에서만 하므로 문제없다.

---

## 결정 4: 스크린샷 에셋 구조

```
_screenshots/                    # 사용자가 넣는 원본. .gitignore에 추가 (용량·고객사 데이터 노출 위험)
  애비로드/피치/*.png              #   폴더명은 사용자가 정한 대로 둔다
img/projects/                    # 최적화본. 커밋하고 배포한다
  abbeyroad-peach/
    01-800.webp  01-1600.webp
  bistones-addy/ …
  bistones-samsung-estore/ …
  kn-puring/ kn-roadfeel/ kn-wecankids/ kn-linkalba/ kn-fsd/ kn-grinda/ kn-exaone-universe/
  gidata-hana-calc/ gidata-hana-event/ gidata-hana-oneday/ …
img/share.jpg                    # og:image 1200x630
```

- **id 규칙:** `<회사약어>-<프로젝트>`, 영문 소문자와 하이픈만 쓴다. 이 id 하나를 이미지 폴더명, `article id`, 딥링크 앵커에 똑같이 쓴다(한글 경로는 URL 인코딩 문제가 생기므로 피한다).
- **형식:** WebP를 주력으로 하고, 너비는 800w/1600w 2종이다. 대상 브라우저(최신 Chrome/Edge/Safari)는 모두 WebP를 지원하므로 JPEG 폴백은 생략한다. AVIF는 Safari 16+에서 지원되지만 변환 시간 대비 이득이 작아 선택 사항으로 둔다.
- **앱 vs 웹 비율:** 앱 스크린샷은 세로(약 9:19.5), 웹 스크린샷은 가로(16:10 등)다. `figure.shot--phone`과 `figure.shot--web` 두 프레임 변형을 두고, `width`/`height` 속성으로 레이아웃 이동(CLS)을 막는다.
- **스크린샷 안의 개인정보:** 실제 서비스 화면에 고객 이름·전화번호가 찍혀 있을 수 있다. 원본에서 최적화본을 만들 때 마스킹 여부를 확인하는 단계를 둔다.
- **변환 도구:** 사이트에는 빌드가 없지만, 이미지 변환은 일회성 에셋 작업이라 도구를 써도 "빌드 없음" 원칙에 어긋나지 않는다. `npx sharp-cli`나 `cwebp`(또는 ffmpeg)로 처리하고, 스킬의 `perf.mjs`가 이미지 무게를 검사하게 둔다.

---

## 결정 5: PDF 생성 경로 (같은 페이지에서)

**권장: `print.html`을 따로 만들지 않는다. `index.html`과 `print.css`를 그대로 쓰고, 로컬 Node 스크립트가 전화번호를 주입한 임시 사본을 headless Chrome으로 인쇄한다.**

이유는 이렇다. `print.html`을 두면 콘텐츠가 두 벌이 되어 어긋난다. 그렇다고 `?print` 쿼리에 JS로 전화번호를 넣으면 **전화번호가 공개 저장소의 JS/HTML 안에 들어가게** 된다. 이것은 PROJECT.md의 개인정보 제약 위반이다. 전화번호는 git 밖(`private/contact.json`)에만 있어야 하고, PDF를 만드는 순간에만 합쳐져야 한다.

```
index.html (공개, 빈 슬롯: <span data-slot="phone" data-print-only></span>)
      │
      ▼  tools/build-pdf.mjs   (node tools/build-pdf.mjs)
  ① index.html 읽기 → 메모리에서 문자열 치환
     - [data-slot="phone"] ← private/contact.json의 phone
     - loading="lazy" 제거 (headless 인쇄에서 화면 밖 이미지 누락 방지)
  ② 프로젝트 루트에 .print-tmp.html로 저장 (상대경로 유지, .gitignore 대상)
  ③ 로컬 http 서버(node:http, 127.0.0.1)로 서빙 (file:// 대신. 폰트와 모듈 JS 때문)
  ④ chrome --headless=new --print-to-pdf=dist/유윤희-포트폴리오.pdf
            --no-pdf-header-footer --virtual-time-budget=10000 http://127.0.0.1:<port>/.print-tmp.html
  ⑤ 임시 파일 삭제 → 결과 PDF 페이지 수와 용량 출력
```

- Chrome 실행 파일 경로는 Windows 기본 경로(`C:\Program Files\Google\Chrome\Application\chrome.exe`, Edge `msedge.exe`)를 차례로 찾는다. 스킬 스크립트도 같은 Chrome/Edge를 쓰므로 이미 있다고 가정해도 된다.
- **수동 대안:** 브라우저에서 Ctrl+P → "PDF로 저장" → 머리글/바닥글 끄기 → 배경 그래픽 켜기. 이 경로에서는 전화번호가 빠진다. 그래서 정식 제출본은 스크립트로만 만든다고 문서에 적어 둔다.
- 생성된 PDF는 `dist/`(git 제외)에 둔다. 공개 사이트에 PDF 다운로드 링크를 두려면 **전화번호가 없는 버전을 따로** 만들어야 한다(스크립트 `--public` 옵션). v1 범위에 넣을지는 FEATURES 단계에서 결정한다.
- 화면에서 print 레이아웃을 미리 보려면 Chrome DevTools > Rendering > "Emulate CSS media type: print"를 쓴다. 별도 라우트는 필요 없다.

**PDF 페이지 구성 목표 (원본 8쪽 구조를 따른다):**

| 쪽 | 내용 | print 규칙 |
|----|------|-----------|
| 1 | 표지 + 한 줄 소개 | `@page :first`, hero 높이 해제 |
| 2 | Skills + Career 요약 | `#skills { break-before: page }` |
| 3~6+ | 회사별 1섹션 (애비로드 / 비스톤스 / 케이엔큐레이션 / 지아이데이타) | `.company { break-before: page }`, `.project { break-inside: avoid }`. 케이엔큐레이션은 2쪽이 될 수 있다 |
| 끝 | Contact (이메일 + **전화번호**) | `#contact { break-before: page }`, `[data-print-only]` 표시 |

PDF에서 스크린샷은 프로젝트당 대표 1장으로 줄인다. `.shot:not(:first-of-type) { display:none }` 규칙으로 페이지 수와 용량을 관리한다.

---

## Recommended Project Structure

```
포트폴리오2026/
├── index.html                 # 콘텐츠의 단일 원본 (모든 섹션, 13개 프로젝트)
├── 404.html                   # (선택) GitHub Pages 기본 404 대체
├── .nojekyll                  # Jekyll 처리 끄기 (밑줄로 시작하는 경로 등 예기치 않은 제외 방지)
├── css/
│   ├── layers.css             # @layer 순서 선언 + 키트 @import layer(kit)
│   ├── tokens.css             # 키트 변수에 값 넣기 + 포트폴리오 전용 의미 토큰
│   ├── base.css               # 요소 기본값, 포커스, 링크
│   ├── layout.css             # .wrap, 섹션, 회사 그리드, 반응형 분기
│   ├── components.css         # project, badge, shot, skills, timeline, contact
│   └── print.css              # media="print", @page, break-*, PDF 전용 슬롯
├── js/
│   └── main.js                # 메뉴 토글, <dialog> 확대 보기, 현재 섹션 표시 (콘텐츠 생성 없음)
├── fonts/                     # 자체 호스팅 woff2 (예: Pretendard 서브셋), 라이선스 파일
├── img/
│   ├── projects/<id>/NN-800.webp, NN-1600.webp
│   ├── share.jpg              # og:image
│   └── favicon.svg
├── assets/                    # design-taste-frontend 키트 복사본 (수정 금지)
│   ├── system.css  system.js  starter.html(참고용)
│   ├── motion/  icons/  …     # 실제로 쓰는 하위 폴더만 남기는 것을 권장
├── tools/
│   ├── build-pdf.mjs          # 전화번호 주입 → headless Chrome PDF
│   ├── optimise-images.mjs    # _screenshots → img/projects (선택)
│   └── check-content.mjs      # 슬롯·alt·전화번호 유출 검사 (선택)
├── private/                   # .gitignore: contact.json { "phone": "..." }
├── _screenshots/              # .gitignore: 원본 스크린샷
├── dist/                      # .gitignore: 생성된 PDF
├── .taste-skill/              # .gitignore 권장: 게이트 기록, 크롬 프로필, waivers.json은 커밋 고려
├── README.md                  # 직접 작성한 코드 범위, PDF 생성법, 이미지 규칙
└── .planning/                 # GSD 문서 (source/는 이미 git 제외)
```

### Structure Rationale

- **`css/`·`js/`·`img/`와 `assets/`를 나눈다:** 직접 작성한 코드와 서드파티 키트의 경계가 폴더 단위로 보인다. 채용 담당자나 면접관이 저장소를 볼 때 "본인이 짠 코드"가 어디인지 바로 알 수 있다(Core Value: 사이트 자체가 실력 증거). README에 이 경계를 적어 둔다.
- **`private/`·`_screenshots/`·`dist/`는 git에서 제외한다:** 전화번호, 원본 이미지, 전화번호가 들어간 PDF가 공개 저장소에 들어가는 일을 구조적으로 막는다.
- **경로는 모두 상대경로로 쓴다:** GitHub Pages 프로젝트 사이트는 `username.github.io/<repo>/` 하위에서 서빙된다. `/css/…` 같은 루트 절대경로는 배포하면 깨진다.
- **`tools/`는 배포돼도 해가 없다:** 다만 Pages 소스를 루트로 두면 함께 공개된다. 민감한 정보는 `private/`에만 있으므로 문제없다.

---

## Architectural Patterns

### Pattern 1: HTML 우선 + 점진적 향상 (Content-first, JS-optional)

**What:** HTML만으로 완결된 문서를 만든다. CSS는 모양을, JS는 편의를 더한다. JS가 실패해도 콘텐츠·링크·이미지는 모두 동작한다.
**When to use:** 정적 포트폴리오에서는 항상. 인쇄, 크롤러, 스킬 체커가 모두 이 전제에 의존한다.
**Trade-offs:** 반복 마크업 13벌을 손으로 맞춰야 한다. 템플릿 주석과 `check-content.mjs`로 보완한다.

```js
// js/main.js: 있으면 좋고, 없어도 되는 것만
document.documentElement.classList.add('js');
for (const a of document.querySelectorAll('a[data-zoom]')) {
  a.addEventListener('click', (e) => {
    const dlg = document.getElementById('zoom');
    if (!dlg?.showModal) return;          // 미지원이면 기본 링크 동작(이미지 열기)
    e.preventDefault();
    dlg.querySelector('img').src = a.href;
    dlg.querySelector('img').alt = a.querySelector('img')?.alt ?? '';
    dlg.showModal();
  });
}
```

### Pattern 2: 데이터 속성으로 상태 표현 (State as data-attributes)

**What:** 플랫폼·운영 상태·기여도를 `data-platform`, `data-status`, `<data value>`로 마크업한다. CSS가 이 값에서 배지 색·아이콘을 만든다.
**When to use:** 같은 메타 정보가 13번 반복될 때.
**Trade-offs:** 클래스 이름 남발을 막고 의미와 표현을 한곳에 묶는다. 스크린리더에는 텍스트(`dd`)가 읽히므로 접근성에도 손해가 없다.

```css
@layer components {
  .project[data-status="closed"] .status { color: var(--p-muted); }
  .project[data-status="closed"] .status::before { content: "운영 종료 · "; }
}
```

### Pattern 3: 단일 소스, 두 매체 (One source, two media)

**What:** 웹과 PDF가 같은 DOM을 쓴다. 차이는 (a) `print.css`, (b) 출력 시점에 채우는 `data-slot`, 두 가지뿐이다.
**When to use:** "같은 디자인의 PDF" 요구사항.
**Trade-offs:** 웹 레이아웃(긴 스크롤, 100svh 섹션)과 A4 페이지는 근본적으로 다르다. 그래서 print.css가 상당히 많은 것을 덮어써야 한다. 이 비용을 줄이려면 처음부터 섹션 높이를 `min-height` 기반으로 짜는 편이 좋다.

### Pattern 4: 키트는 낮은 레이어, 내 코드는 위 레이어 (Vendor in a low cascade layer)

**What:** 서드파티 CSS를 `@import … layer(kit)`으로 가장 낮은 레이어에 둔다.
**When to use:** 수정이 금지된 외부 CSS를 덮어써야 할 때.
**Trade-offs:** 키트가 `!important`를 쓴 곳은 레이어 우선순위가 뒤집힌다(낮은 레이어의 `!important`가 더 강하다). print.css에서 키트의 `!important`와 부딪히면 그 규칙만 확인해서 처리한다.

---

## Data Flow

### 콘텐츠 흐름 (단방향)

```
원본 PDF (.planning/source/portfolio-pdf.txt, git 제외)
    ↓ 사람이 옮겨 적음 (지어내기 금지, 문장 대조)
index.html (공개 콘텐츠의 단일 원본)
    ├──→ 브라우저 (screen CSS + main.js 향상) → GitHub Pages 방문자
    └──→ build-pdf.mjs ← private/contact.json (전화번호)
              ↓ 임시 사본 + print.css
         headless Chrome → dist/*.pdf → 채용 제출
```

### 이미지 흐름

```
사용자 → _screenshots/ (원본, 로컬)
           ↓ optimise-images.mjs (리사이즈, WebP, 개인정보 마스킹 확인)
         img/projects/<id>/ (커밋)
           ↓ <img srcset width height alt loading>
         index.html → 웹(lazy) / PDF(lazy 제거, 대표 1장)
```

### 스타일 흐름 (캐스케이드 순서)

```
@layer kit  →  tokens  →  base  →  layout  →  components  →  utilities  →  print
(키트 원본)   (키트 변수에    (요소)    (골격·반응형)   (카드·배지)              (media=print일 때만)
             값 넣기)
낮음 ─────────────────────────────────────────────────────────────────→ 높음
```

### Key Data Flows

1. **콘텐츠는 HTML → 출력 방향으로만 흐른다.** JS가 콘텐츠를 만들거나 바꾸지 않는다. 예외는 PDF 스크립트가 출력 시점에 `data-slot`을 채우는 것 하나다.
2. **개인정보(전화번호)는 `private/` → `dist/`로만 흐른다.** 공개 트리(`index.html`, `js/`, `css/`)로 들어가는 경로가 없어야 하고, `check-content.mjs`가 이를 검증한다.
3. **토큰은 `tokens.css` → 모든 레이어로 흐른다.** 컴포넌트에 색이나 간격을 직접 숫자로 쓰지 않는다(포인트 컬러는 하나로 절제한다는 요구사항).

---

## Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| index.html ↔ css | 클래스 + `data-*` 속성 | CSS는 `data-status` 같은 상태를 읽기만 한다 |
| index.html ↔ main.js | DOM 조회, `data-*`·클래스 토글 | `main.js`는 노드를 새로 만들지 않는다(`<dialog>`도 HTML에 미리 둔다) |
| css ↔ assets(kit) | `@import layer(kit)` + 키트 CSS 변수 | 키트 파일은 수정하지 않는다. 덮어쓰기는 위 레이어에서만 한다 |
| build-pdf.mjs ↔ index.html | 파일 읽기 + 문자열 치환(`data-slot`) | index.html에는 빈 슬롯만 둔다. 스크립트는 원본 파일에 쓰지 않는다 |
| build-pdf.mjs ↔ private/ | JSON 읽기 | 파일이 없으면 실패한다(전화번호 없는 제출본이 실수로 나가는 것을 막는다) |
| 스킬 체커(gate/check/consistency) ↔ index.html | `127.0.0.1` http로 페이지를 열어 검사 | 체커는 screen 미디어만 본다. PDF 품질은 별도로 눈으로 확인한다 |

## Integration Points

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | main 브랜치 루트에서 배포 (Actions 불필요) | `.nojekyll`, 상대경로, 대소문자 구분(Windows에서는 안 보이던 경로 오류가 배포 후 드러난다) |
| Chrome/Edge (로컬) | `--headless=new --print-to-pdf --no-pdf-header-footer` | Chrome 132부터 옛 headless는 별도 바이너리로 분리됐다. 반드시 `=new`를 명시한다 |
| design-taste-frontend 스크립트 | `node <skill>/scripts/gate.mjs index.html` 등 | Node 22+ 필요. 페이지 종류는 "service"(사람을 고용함)가 가장 가깝다. 이 분류는 STACK/FEATURES 단계에서 확정한다 |

---

## Scaling Considerations

이 프로젝트에서 "규모"는 트래픽이 아니라 **콘텐츠 양**이다.

| 규모 | 구조 조정 |
|------|----------|
| 프로젝트 13개 (현재) | 단일 index.html + 손으로 작성한 article. 충분하다 |
| 20~30개 / 케이스 스터디 추가 | `projects/<id>.html` 상세 페이지를 도입한다. head·header·footer 중복이 생기므로 이 시점에 간단한 Node 템플릿 스크립트(빌드)를 검토한다 |
| 다국어 (v1 범위 밖) | `en/index.html`을 별도로 두고 `hreflang`을 단다. 콘텐츠를 JSON으로 분리하는 것은 이때 비로소 이득이 생긴다 |

### Scaling Priorities

1. **처음 깨지는 곳:** 회사 섹션이 "화면 1~2개" 규칙을 넘는다(케이엔큐레이션 7개). 카드 밀도 조정, 섹션 분할, 면제 기록으로 해결한다.
2. **다음에 깨지는 곳:** 이미지 용량. 프로젝트당 3장 × 2해상도 × 13개 ≈ 78파일이다. `loading="lazy"`, `sizes`를 정확히 쓰고, 웹 가로형 1600w 기준 약 200KB 이하를 목표로 한다.

---

## Anti-Patterns

### Anti-Pattern 1: JSON + JS 템플릿으로 프로젝트 렌더링
**What people do:** "데이터와 뷰 분리"라는 이유로 `projects.json`을 fetch해서 innerHTML로 그린다.
**Why it's wrong:** JS가 없으면 빈 화면이 되고, `file://`로 열면 깨지고, 인쇄 타이밍이 불안정하다. 무엇보다 퍼블리셔 포트폴리오인데 마크업이 view-source에서 사라진다.
**Do this instead:** HTML에 직접 쓰고, 템플릿 주석과 검사 스크립트로 일관성을 지킨다.

### Anti-Pattern 2: 전화번호를 숨김 처리(`display:none`)해서 공개 HTML에 두기
**What people do:** 웹에서는 `display:none`, 인쇄에서는 보이게 한다.
**Why it's wrong:** 소스·크롤러·저장소에 그대로 노출된다. CSS로 숨기는 것은 개인정보 보호가 아니다.
**Do this instead:** 빈 `data-slot`만 공개하고, 실제 값은 PDF 생성 시점에 git 밖 파일에서 주입한다.

### Anti-Pattern 3: `print.html`을 따로 손으로 유지
**What people do:** 인쇄용 페이지를 복제해서 따로 다듬는다.
**Why it's wrong:** 콘텐츠가 두 벌이 되어 수정할 때마다 어긋난다. "같은 디자인"이라는 요구도 깨진다.
**Do this instead:** 한 DOM에 `print.css`를 적용한다.

### Anti-Pattern 4: 키트 CSS를 레이어 없이 링크하고 명시도로 싸우기
**What people do:** `system.css`를 그대로 링크한 뒤 `.page .section .project` 같은 긴 선택자나 `!important`로 덮어쓴다.
**Why it's wrong:** 레이어 밖 스타일은 레이어 안 스타일을 항상 이기므로 결국 `!important` 남발로 끝난다. 퍼블리셔 코드 품질 증명에도 역효과다.
**Do this instead:** `@import url(...) layer(kit)`.

### Anti-Pattern 5: 등장 애니메이션 초기상태가 인쇄에 남음
**What people do:** `opacity:0`에서 시작하는 진입 모션을 넣고 print에서 해제하는 것을 잊는다.
**Why it's wrong:** headless 인쇄는 애니메이션이 끝나기 전 상태를 찍을 수 있어 PDF 표지가 비어 나온다.
**Do this instead:** print.css에서 `[data-enter]`·모션 클래스를 강제로 `opacity:1; transform:none; animation:none`으로 만들고, `--virtual-time-budget`도 준다.

### Anti-Pattern 6: 루트 절대경로(`/img/...`)
**Why it's wrong:** GitHub Pages 프로젝트 사이트(`/<repo>/` 하위)에서 모든 에셋이 404가 된다.
**Do this instead:** `img/...`, `css/...` 같은 상대경로를 쓴다.

---

## Suggested Build Order

의존성 순서다. 앞 단계의 산출물이 뒤 단계의 입력이 된다.

| # | 단계 | 산출물 | 의존 | 비고 |
|---|------|--------|------|------|
| 1 | **골격과 경계 세팅** | 폴더 구조, `.gitignore`(private/·_screenshots/·dist/·.print-tmp.html), `.nojekyll`, 키트를 `assets/`에 복사, 스킬 게이트 armed | 없음 | 개인정보 경계를 **콘텐츠보다 먼저** 만든다 |
| 2 | **콘텐츠 마크업 (스타일 없음)** | `index.html`에 PDF 내용 전부, 시맨틱 구조, 13개 article, 프로젝트 id, `data-*`, 빈 `data-slot="phone"` | 1 | CSS 없이도 읽히는지 확인한다. 원본 PDF와 문장을 대조한다. 이 단계만으로 "콘텐츠 누락 없음" 요구를 검증할 수 있다 |
| 3 | **토큰·base·layout (반응형 골격)** | `layers.css`, `tokens.css`, `base.css`, `layout.css`. 375/768/1440에서 가로 스크롤 없음 | 2 | 스킬 deal 명령으로 팔레트·타입을 확정한 뒤 키트 변수에 넣는다 |
| 4 | **컴포넌트** | 프로젝트 카드, 배지, 스킬, 경력 타임라인, contact, 스크린샷 프레임(phone/web 변형, 자리표시 상태 포함) | 3 | 스크린샷이 오기 전에도 프레임 비율로 레이아웃을 확정한다 |
| 5 | **스크린샷 파이프라인** | `_screenshots/` → `img/projects/<id>/` 변환, alt 작성, srcset 연결 | 2(id 규칙), 4(프레임) | 사용자 제공 시점에 따라 **3~4와 병행할 수 있다**. 개인정보 마스킹을 확인한다 |
| 6 | **JS 향상 + 모션** | `main.js`(메뉴, dialog 확대), 키트 모션 레이어 연결, reduced-motion | 4 | 없어도 동작해야 한다. 스킬의 hover·enter 규칙을 충족한다 |
| 7 | **Print + PDF 파이프라인** | `print.css`, `tools/build-pdf.mjs`, `private/contact.json` 형식 문서화, 원본 8쪽 구조와 비교 | 4, 5(이미지가 있어야 페이지 나눔을 확정할 수 있다), 6(모션 해제 대상) | 화면 디자인이 안정된 뒤에 한다. 그 전에 하면 계속 다시 맞춰야 한다 |
| 8 | **QA·배포** | 스킬 gate/check/consistency/perf/copy-lint, 접근성(키보드·대비·alt), Safari iOS 실기기, `check-content.mjs`(전화번호 유출 검사), GitHub Pages 배포, og:image | 전부 | `waivers.json` 사유를 정리한다. 배포 URL에서 경로와 대소문자를 재검증한다 |

**순서의 근거:**
- 2(콘텐츠)를 3(스타일)보다 앞에 둔다. 콘텐츠의 실제 분량(케이엔큐레이션 7개, 프로젝트별 설명 길이)이 레이아웃 결정(섹션 분할, 카드 밀도)을 좌우하기 때문이다. 스타일 먼저 하면 lorem 기준 레이아웃을 다시 짜게 된다.
- 7(PDF)을 늦게 둔다. print.css는 화면 CSS를 덮어쓰는 차등 규칙이라 화면 쪽이 바뀔 때마다 다시 맞춰야 한다. 다만 **2단계에서 `data-slot`과 `data-print-only` 자리는 미리 만들어 둔다.**
- 5(이미지)는 외부 의존(사용자 제공)이라 크리티컬 패스에서 뺀다. 4에서 비율 프레임과 자리표시로 막힘을 피한다.

**단계별 추가 리서치 플래그:**
- 3단계: 스킬의 "섹션 = 화면 1~2개" 규칙과 회사 섹션 분량의 충돌. 실제 콘텐츠를 넣고 측정해 봐야 판단할 수 있다.
- 7단계: headless Chrome에서 `loading="lazy"` 이미지와 웹폰트가 인쇄 전에 확실히 로드되는지(LOW confidence, 직접 실험해서 확인), 한글 웹폰트가 PDF에 임베딩되는 방식과 용량.
- 2·8단계 표준 패턴: 추가 리서치는 필요 없다.

---

## Skill Kit 재사용 메모 (design-taste-frontend)

- **그대로 쓴다:** `scripts/gate.mjs`, `check.mjs`, `consistency.mjs`, `copy-lint.mjs`, `perf.mjs`, `shoot.mjs`. QA 단계의 자동 검사 도구로 쓴다. 모두 `127.0.0.1` http로 페이지를 직접 서빙하므로 별도 서버가 필요 없다.
- **기반으로 쓴다:** `assets/system.css`(토큰·그리드·버튼·nav·footer), `assets/motion/`(hover·enter). 스킬이 "두 번째 시스템을 만들지 말라"고 요구하므로 `@layer kit`으로 가져오고 변수만 채운다. `assets/starter.html`은 head 블록(skip link, meta, og)과 섹션 마크업 패턴의 **참고본**으로만 쓰고, `index.html`은 새로 쓴다.
- **쓰지 않는다:** effects, scenes, shader, objects, diagrams. 포트폴리오는 기술 카테고리 사이트가 아니고, 미니멀이 요구사항이다. 배포 용량을 줄이려면 `assets/`에서 쓰지 않는 하위 폴더를 빼고 복사하는 것을 권장한다(키트 파일 내용은 고치지 않고 폴더만 선택해 복사).
- **키트에 없는 것:** print 스타일이 전혀 없다(`@media print`·`@page` 없음). 오히려 `100svh` 섹션 높이를 강제하므로 print.css에서 반드시 해제해야 한다. `@layer`도 쓰지 않으므로 Pattern 4가 필요하다.
- **긴장 관계 (로드맵에서 결정할 것):** "직접 마크업한 코드가 실력 증거"(Core Value)와 "104KB 서드파티 system.css 위에 짓기"는 서로 부딪힌다. 이 문서의 권장은 키트를 `kit` 레이어 기반으로 쓰되 직접 쓴 코드를 `css/`에 분리하고 README에 경계를 밝히는 것이다. 대안은 키트 CSS를 로드하지 않고 규칙(토큰 값, 간격, 모션 기준)만 손으로 다시 구현한 뒤 스킬 체커로 검증하는 것이다. 대안 쪽이 역량 증명에는 더 강하지만, 게이트 통과 비용이 커진다.

---

## Sources

- 로컬: `C:\Users\user\.agents\skills\design-taste-frontend\SKILL.md`, `assets/system.css`(직접 읽음: `@layer`·`@media print` 없음, `100svh` 섹션 높이 규칙 확인) — HIGH
- Chrome headless CLI (`--print-to-pdf`, `--no-pdf-header-footer`, `--headless=new`): https://developer.chrome.com/docs/chromium/headless , https://developer.chrome.com/docs/automation-and-testing/headless-cli — HIGH
- Chrome 131 `@page` 여백 상자: https://developer.chrome.com/blog/print-margins , https://developer.chrome.com/release-notes/131 — HIGH
- `@layer` / `@import layer()` 브라우저 지원(Chrome 99, Safari 15.4): MDN/caniuse 기준, 학습 데이터 — MEDIUM (대상 브라우저가 모두 최신이라 위험은 낮다)
- headless 인쇄에서 `loading="lazy"` 이미지 동작: 확인하지 못했다 — LOW, 그래서 스크립트에서 lazy 속성을 제거하는 방어책을 넣었다
- GitHub Pages 상대경로와 `.nojekyll`: GitHub Pages 문서 및 일반 관행 — MEDIUM

---
*Architecture research for: 정적 포트폴리오 사이트 + 단일 소스 PDF*
*Researched: 2026-11-11*
