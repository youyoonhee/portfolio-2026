# Phase 1: 기반과 실제 콘텐츠 페이지 - Research

**Researched:** 2026-11-11
**Domain:** 시맨틱 정적 HTML 한 장 + Node 22 로컬 검사 도구(html-validate, 전화번호 pre-commit, 원본 대조)
**Confidence:** HIGH (도구 동작은 이번 세션에서 직접 실행해 확인했다)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 표지 영문 문구는 "Publishing, beyond the expected." 세 줄(`Publishing,` / `beyond the` / `expected.`). 추출본의 `ePbxeupybeolicnsthdeidtnh.ge`는 쓰지 않는다.
- **D-02:** 표지에 `PORTFOLIO.`, `Selected work / Career 2026`, 한글 소개 `화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.`, 이메일.
- **D-03:** 큰 섹션 제목은 원본 영문 제목과 번호 유지: `01 / Skills` + `Tech stack.`, `02 / Career` + `Career & Work.`, 회사별 섹션, `07 / Contact` + `Contact.`. 최신순으로 바꾸면서 회사 섹션 번호는 플래너가 일관되게 다시 매긴다.
- **D-04:** 회사명은 한글만 표시(비스톤스 등). 영문 회사명(Bistones, Abbey Road, KN Curation, GI Data)은 화면에 쓰지 않는다. id/폴더명 등 내부 식별자는 영문 소문자 가능.
- **D-05:** `© Publisher Youyoonhee ALL RIGHTS RESERVED`는 웹 푸터에 한 번만.
- **D-06:** Contact 문구 `더 궁금한 점이 있으시다면 편하게 연락 부탁 드립니다.` 웹에는 이메일만, 전화번호 자리는 빈 `data-slot="phone"`만.
- **D-07:** 프로젝트별 기간은 쓰지 않는다. 회사 섹션 제목 옆 재직 기간만(`<time datetime>`): 지아이데이타 2024.09~2026.09 / 케이엔큐레이션 2023.09~2024.03 / 비스톤스 2022.01~2023.07 / 애비로드 2021.08~2021.12. 프로젝트 메타의 "기간"은 비우거나 뺀다.
- **D-08:** 작업 유형 태그(구축/유지보수/리뉴얼)를 따로 만들지 않는다. 원본 설명 문장 그대로.
- **D-09:** 기여도는 `퍼블 기여도 N%`, 원본에 맥락이 있을 때만 덧붙인다(삼성: `2인 1팀으로 50:50 분담`). 맥락을 새로 쓰지 않는다.
- **D-10:** Career & Work. 요약은 최신순, 회사명 + 원본 대표 문구: 지아이데이타 `하나손해보험 App`, 케이엔큐레이션 `LG ChatEXAONE 초기모델`, 비스톤스 `CJ 광고 플랫폼/삼성닷컴 기획전`, 애비로드 `교보생명 App`. 각 항목은 해당 회사 섹션으로 앵커 이동.
- **D-11:** 케이엔큐레이션 섹션에 `Angular 기반 앱, 반응형 웹 구축 및 유지 보수`.
- **프로젝트 데이터 표(13개)**는 CONTEXT.md의 표가 그대로 정답이다(id, 회사, 원본 표기, 플랫폼, 원본 설명, 기여도+맥락, 링크, 상태). 띄어쓰기 보정은 허용, 단어 추가·변경은 금지. 위캔키즈·링크알바·FSD·그린다는 설명 문장을 만들지 않는다.
- **D-12:** ADDY 소개서 링크 걸지 않음, `운영 종료` 배지만.
- **D-13:** 삼성은 갤럭시 캠퍼스(`https://samsungebiz.com/event/galaxycampus/`)만 건다.
- **D-14:** 링크알바는 링크도 걸지 않고 상태 배지도 확정하지 않는다(Phase 5 재확인).
- **D-15:** 지아이데이타 3개는 링크 없이 `운영 중` 배지.
- **D-16:** `data-status="live | closed | intro | article | apk | private"`; 이번 phase는 live/closed/article/apk + 링크알바용 보류 값. 외부 링크는 새 탭 + `rel="noopener"`, 링크 텍스트에 목적지가 드러나게(예: "관련 기사 보기").
- **D-17:** 프로젝트마다 "퍼블리싱 포인트" 자리만 마크업하고 비워 둔다. 빈 자리는 화면과 접근성 트리에 보이지 않아야 한다(요소 미렌더링 또는 `hidden`).
- **D-18:** 받을 형식은 프로젝트당 한두 줄 문장.

### Claude's Discretion
- article 템플릿의 정확한 마크업(`dl` 항목 이름, 클래스 이름), 회사 섹션 번호 재배열 방식, 영문 id 규칙, 스크린샷 자리표시 마크업
- `tools/check-content.mjs`의 검사 항목과 구현 방식
- `package.json` devDependencies 구성과 pre-commit hook 방식

### Deferred Ideas (OUT OF SCOPE)
- 퍼블리싱 포인트 실제 내용
- 링크알바 링크·상태 (Phase 5 배포 전 재확인)
- ADDY 소개서 (Drive 공유가 공개로 바뀌면)
- 프로젝트별 실제 기간
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BASE-01 | 공개 저장소·사이트에 전화번호 없음 | `tools/check-repo.mjs` 전화번호 정규식(실측 통과) + `.githooks/pre-commit` + 전체 트리 스캔 |
| BASE-02 | `_screenshots/`, `private/`, `dist/`, `*.pdf`가 git에 없음 | `.gitignore`(이미 있음) + 스테이지된 금지 경로 검사 + `git check-ignore` 확인 |
| BASE-03 | 소문자 kebab-case 파일명, 상대경로 | `check-repo.mjs` 파일명 검사 + `check-content.mjs` 속성 경로 검사 |
| BASE-04 | Node 22에서 도구 실행, devDependencies만 | html-validate 11.21.0 engines `^22.22.0 \|\| >=24.8.0` 충족(22.23.4), package.json 설계 |
| CONT-01~08 | 원본 콘텐츠 전부 | 마크업 패턴, 데이터 표 → 대조표(manifest), 원본 텍스트 노드 역검증 |
| QUAL-01 | HTML 검사기 오류 0, h1→h2→h3 | `.htmlvalidate.json`(heading-level 명시 활성화 필수) |
</phase_requirements>

## Summary

이 phase는 새 라이브러리 연구가 거의 필요 없다. 핵심은 (1) 손으로 쓰는 `index.html` 한 장의 마크업 규칙을 고정하고, (2) 사람이 눈으로 하던 "원본 대조"와 "전화번호 유출 방지"를 의존성 없는 Node 스크립트 두 개와 git hook 하나로 자동화하는 것이다. 이번 세션에서 임시 폴더에 html-validate 11.21.0과 serve 14.2.7을 설치해 Node 22.23.4에서 실제로 돌렸고, git hook(`core.hooksPath`)과 전화번호 정규식도 Git Bash에서 실행해 동작을 확인했다.

가장 중요한 발견 세 가지. 첫째, `html-validate:recommended`에는 **`heading-level` 규칙이 없다.** h2→h4 건너뛰기가 오류로 잡히지 않았다. 수동으로 켜야 성공 기준 5(h1→h2→h3)가 자동 검증된다. 둘째, 빈 `hidden` 요소·빈 `data-slot` 요소·빈 `<figure aria-hidden="true">`·`dl > div > dt/dd` 구조는 recommended + a11y에서 오류 0건이었다(실측). 셋째, `<!DOCTYPE html>`은 대문자여야 한다(`doctype-style`).

**Primary recommendation:** `package.json`(devDependencies: html-validate, serve, linkinator) + `.htmlvalidate.json`(recommended + a11y + heading-level) + `tools/check-repo.mjs`(전화번호·금지 경로·파일명) + `tools/check-content.mjs`(대조표 `tools/content-manifest.json` 기반, 원본 있으면 역검증) + `.githooks/pre-commit`(스테이지 내용 스캔) + `.gitattributes`(hook LF 고정)로 구성하고, 모든 검사를 `npm run check` 하나로 묶는다.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 콘텐츠(문장·수치) | 정적 HTML (`index.html`) | — | JS가 콘텐츠를 만들지 않는다. 직접 마크업이 포트폴리오의 증거 |
| 상태 배지 의미 | HTML `data-status` + 텍스트 | CSS(Phase 2) | 텍스트가 정답이고 모양은 CSS가 data 값에서 만든다 |
| 전화번호 경계 | 저장소 정책(.gitignore, hook, 검사 스크립트) | PDF 주입(Phase 3) | HTML에는 빈 `data-slot`만 |
| 원본 대조 | 로컬 Node 스크립트 | 커밋된 manifest | 원본 텍스트는 git 밖, manifest는 공개되어도 안전한 문장만 |
| HTML 품질 | html-validate | W3C Nu(Phase 5) | 오프라인 규칙 검사 |

## Standard Stack

### Core (이번 phase에 설치하는 것)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| html-validate | 11.21.0 | HTML/a11y 규칙 검사 | `npm view` engines `^22.22.0 \|\| >= 24.8.0` — 로컬 Node 22.23.4 충족. 이번 세션에 실제 설치·실행 확인 [VERIFIED: npm registry + 로컬 실행] |
| serve | 14.2.7 | 로컬 http 서버 | engines `>= 14`, vercel/serve [VERIFIED: npm registry] |
| linkinator | 8.1.0 | 링크 검사 | engines `>=22`, 저장소 JustinBeckwith/linkinator [VERIFIED: npm registry]. 사용 플래그는 [ASSUMED] — 실행해서 확인할 것 |

Node 내장(`node:fs`, `node:path`, `node:child_process`)만으로 두 검사 스크립트를 만든다. jsdom/cheerio/husky는 쓰지 않는다.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 손수 만든 `.githooks` | husky / lefthook | 의존성과 설치 단계가 늘어난다. 이 규모에서는 불필요 |
| 정규식 기반 구조 검사 | parse5 / jsdom | 마크업이 직접 쓴 정형 HTML이고 html-validate가 먼저 구조를 보장하므로 정규식으로 충분. 필요해지면 그때 추가 |

**Installation:**
```bash
npm init -y   # 이후 package.json을 아래 형태로 정리
npm i -D html-validate@11.21.0 serve@14.2.7 linkinator@8.1.0
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| html-validate | npm | 오래됨(프로젝트 STACK.md 선정) | 미측정 | gitlab.com/html-validate/html-validate | 미실행 | Approved, [ASSUMED] 표기 |
| serve | npm | 오래됨 | 미측정 | github.com/vercel/serve | 미실행 | Approved, [ASSUMED] 표기 |
| linkinator | npm | 오래됨 | 미측정 | github.com/JustinBeckwith/linkinator | 미실행 | Approved, [ASSUMED] 표기 |

slopcheck는 설치(pip) 권한이 거부되어 실행하지 못했다. 세 패키지는 모두 프로젝트 STACK.md에서 선정됐고 `npm view`로 존재·저장소·engines를 확인했으며, `scripts.postinstall`이 비어 있다(html-validate 확인; serve/linkinator는 postinstall 출력 없음). 규칙상 `[ASSUMED]`이므로 **플래너는 `npm i -D` 전에 `checkpoint:human-verify`를 한 번 둔다.** serve 설치 시 `npm audit` 경고가 나왔다(로컬 개발 전용이며 배포 산출물과 무관).

## Architecture Patterns

### 데이터 흐름 (검사 포함)

```
.planning/source/portfolio-pdf.txt (git 밖, 로컬 전용)
        │ (있으면 읽기 전용 대조)
        ▼
tools/content-manifest.json (공개 OK: 전화번호 없는 문장·13개 프로젝트 데이터표)
        │
        ▼
index.html ──► html-validate (.htmlvalidate.json) ──► 오류 0
   │  └────► check-content.mjs (필수 슬롯·순서·제목·경로·수치·원본 역검증)
   │
git add ──► .githooks/pre-commit ──► check-repo.mjs --staged
                                       ├ 스테이지된 내용 전화번호 스캔
                                       ├ 금지 경로(_screenshots/ private/ dist/ *.pdf .planning/source/)
                                       └ 파일명 kebab-case
npm run check = validate + check:content + check:repo (전체 트리)
```

### 권장 구조
```
index.html
404.html            (Phase 5로 미뤄도 됨)
robots.txt          (선택, 아래 noindex 참고)
.gitattributes      (hook LF 고정)
.htmlvalidate.json
package.json / package-lock.json (커밋)
.githooks/pre-commit
tools/check-repo.mjs
tools/check-content.mjs
tools/content-manifest.json
```
`css/`, `js/`, `fonts/`는 Phase 2 이후. Phase 1의 `index.html`은 CSS/JS 없이 읽혀야 한다.

### Pattern 1: 프로젝트 article 템플릿 (실측 통과)
**What:** 13개 모두 같은 슬롯 순서. 없는 필드는 요소째 생략하되 순서는 고정(설명 문장이 없는 프로젝트는 "담당 업무" 행을 만들지 않는다).
```html
<article class="project" id="kn-universe" data-platform="web" data-status="article"
         aria-labelledby="kn-universe-title">
  <h3 id="kn-universe-title">universe</h3>
  <p class="status" data-status-label>관련 기사</p>      <!-- 텍스트가 정답, 모양은 CSS -->
  <dl class="meta">
    <div><dt>소속</dt><dd>케이엔큐레이션</dd></div>
    <div><dt>플랫폼</dt><dd>Web</dd></div>
    <div><dt>담당 업무</dt><dd>LG AI연구원 의뢰 · 생성형 AI ‘EXAONE’ 초기모델 개발 …</dd></div>
    <div><dt>퍼블 기여도</dt><dd><data value="100">100%</data></dd></div>
  </dl>
  <figure class="shot" data-slot="screenshot" data-frame="web" aria-hidden="true"></figure>
  <div class="point" data-slot="point" hidden></div>
  <p class="links"><a href="https://www.lg.co.kr/media/release/26532" target="_blank"
     rel="noopener">관련 기사 보기<span class="visually-hidden"> (새 탭)</span></a></p>
</article>
```
- 같은 구조(`dl > div > dt/dd`, 빈 `hidden` div, 빈 `aria-hidden` figure, `<data>`)를 `html-validate:recommended` + `a11y`로 돌려 오류 0건을 확인했다 [VERIFIED: 로컬 실행].
- **퍼블리싱 포인트(D-17):** `<div class="point" data-slot="point" hidden></div>`. `hidden`이면 렌더링·접근성 트리에서 빠지고, 빈 요소여서 검사기가 불평하지 않는다. 내용이 오면 `hidden`만 지우고 `<dt>`/`<p>` 라벨을 넣는다. check-content는 "`hidden`이면 비어 있어야 하고, 비어 있으면 `hidden`이어야 한다"를 검사한다.
- **스크린샷 자리(Phase 4 대비):** `<figure class="shot" data-slot="screenshot" data-frame="app|web" aria-hidden="true"></figure>`. 깨진 `<img>`가 없고, Phase 2에서 CSS가 `data-frame`으로 비율 박스를 잡을 수 있다. 화면에 "준비 중" 같은 문구를 넣지 않는다(원본에 없는 UI 문구는 대조표에서 허용 목록 관리 부담이 생기고 채용 담당자에게 미완성으로 보임).
- **소속 = 회사명만.** 원본은 프로젝트별 "고객사"를 따로 적지 않는다. 고객사는 프로젝트명(`교보생명…`, `CJ…`, `삼성E스토어…`)과 Career 요약 문구에만 이미 들어 있다. 새 고객사 항목을 만들지 않는다.
- **기간 행 생략**(D-07). 요구사항 CONT-04의 "기간"은 회사 섹션 제목 옆 `<time>`이 충족한다.
- **상태값 매핑**(UI 라벨은 사용자 확인 CONTEXT 근거): live→`운영 중`, closed→`운영 종료`, article→`관련 기사`, apk→`APK 보유`, 링크알바→`data-status="pending"` + 배지 요소 없음.

### Pattern 2: 회사 섹션과 Career 앵커
```html
<section id="gi-data" aria-labelledby="gi-data-title">
  <p class="eyebrow">03</p>
  <h2 id="gi-data-title">지아이데이타.</h2>
  <p><time datetime="2024-09">2024.09</time> ~ <time datetime="2026-09">2026.09</time></p>
  ...articles...
</section>
<!-- Career 요약 -->
<li><a href="#gi-data">지아이데이타</a> 하나손해보험 App</li>
```
- 회사 section id: `gi-data`, `kn-curation`, `bistones`, `abbey-road`. 프로젝트 id(`gi-calculator`, `kn-puring` …)와 겹치지 않는다. 모두 ASCII 소문자 kebab.
- 번호: 01 Skills, 02 Career, 03 지아이데이타, 04 케이엔큐레이션, 05 비스톤스, 06 애비로드, 07 Contact. 원본 숫자 01~07이 모두 원본에 존재하므로 "새 수치" 검사를 통과한다.
- **D-03/D-04 충돌 지점:** 원본 회사 섹션 눈썹 문구는 `06 / GI Data`처럼 영문 회사명을 쓴다. D-04가 영문 회사명 표시를 금지하므로, 회사 섹션은 번호(`03`)와 한글 제목(`지아이데이타.`)만 둔다. 플래너가 이 해석을 명시해 둘 것(Open Question 1).

### Pattern 3: 문서 골격
```html
<!DOCTYPE html>            <!-- 대문자 필수: doctype-style 규칙 (실측) -->
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no">   <!-- PITFALLS 7: iOS 숫자 자동 링크 방지 -->
  <meta name="robots" content="noindex, nofollow">         <!-- DEPL-02 선반영, 선택 -->
  <title>퍼블리셔 유윤희 포트폴리오</title>
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>
  <header>…<h1>Publishing,<br>beyond the<br>expected.</h1>…<nav aria-label="주요 섹션">…</nav></header>
  <main id="main">…h2 섹션들…</main>
  <footer><small>© Publisher Youyoonhee ALL RIGHTS RESERVED</small></footer>
</body>
```
- `<meta>`는 `head` 안에만 둔다(`element-permitted-content` 오류 실측).
- h1은 표지 영문 문구 하나. `<title>`은 PDF 파일명에서 온 문자열이라 대조표 허용 목록에 둔다.
- `noindex` 메타와 `robots.txt`는 DEPL-02(Phase 5)지만 한 줄이라 지금 넣어도 된다. 범위 확장은 하지 않는다. 단 `robots.txt`는 크롤러에게 "Disallow"를 알려줄 뿐 메타 noindex가 실제 노출 차단이다.

### Pattern 4: 스킬 마크업
분류당 `dl`의 `dt`=분류명(원본 그대로 `Markup & Style` 등), `dd > ul > li`=항목. `TYPESCRIPT (경험)`처럼 원본 텍스트를 **한 텍스트 노드로** 그대로 둔다(대문자 포함). 게이지·퍼센트 없음.

### Anti-Patterns
- 전화번호를 `hidden`/`display:none`으로라도 HTML에 넣는다 → 소스 보기·저장소에 남는다.
- 실패한 외부 링크의 URL을 `<a>`가 아닌 텍스트로 남기는 것도 금지(운영 종료 서비스 URL 노출은 Out of Scope).
- 이미지 자리에 존재하지 않는 `src`를 가진 `<img>`.
- `href="/css/…"` 식 루트 절대경로.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML 구조·a11y 규칙 | 정규식 검증 | html-validate | 중첩 허용 규칙, id 중복, 라벨 등 정확히 구현돼 있다 |
| 링크 생존 검사 | fetch 루프 | linkinator | 재시도·리다이렉트·로컬 서버 처리 |
| 로컬 서버 | 자체 http 서버 | serve | |
| 커밋 훅 관리 | husky | `core.hooksPath` + 셸 한 줄 | 의존성 0 |
| 전화번호 검사 | 포맷별 개별 정규식 여러 개 | 단일 정규식 하나(아래) | 구분자 클래스로 한 번에 처리 |

단, **원본 대조(check-content)와 전화번호 스캔은 직접 만든다.** 이 둘은 프로젝트 고유 규칙이라 기성 도구가 없다. 둘 다 Node 내장만으로 수십 줄이다.

## Runtime State Inventory

해당 없음(리팩터/마이그레이션 phase가 아니다). 단 한 가지: **git 히스토리에 이미 전화번호가 없는지**는 이 phase가 시작되는 시점에 한 번 확인한다(`git log -p | <정규식>` 또는 `git grep <정규식> $(git rev-list --all)`). 현재 커밋 5개는 문서뿐이고 `.planning/source/`는 무시되어 있다. 누락 시 이후 수정 비용이 크다(PITFALLS: 히스토리 재작성 필요).

## Common Pitfalls

### Pitfall 1: `heading-level`이 recommended에 없다
**What goes wrong:** h2→h4 건너뛰기를 검사기가 통과시킨다 → 성공 기준 5가 자동 검증되지 않는다.
**How to avoid:** `.htmlvalidate.json`에 `"heading-level": "error"`를 넣는다. [VERIFIED: 이 규칙을 켜자 "Heading level can only increase by one, expected <h3> but got <h4>" 오류 발생]. 단 이 규칙은 **여러 h1**도 막는다.

### Pitfall 2: 검사 도구 테스트 데이터가 훅에 걸린다
**What goes wrong:** 전화번호 형식 예시를 리포지토리 파일(문서, 테스트 픽스처, RESEARCH.md)에 쓰면 pre-commit이 막는다.
**How to avoid:** 테스트 문자열은 런타임에 조립한다(예: `['01'+'0','1234','5678'].join('-')`). 문서에는 형식을 말로 설명한다. `package-lock.json`은 해시 문자열이 있으니 스캔 대상에서 제외한다(LOW 위험이지만 오탐 방지).

### Pitfall 3: 스테이지 안 된 파일을 검사해서 놓친다
**How to avoid:** 훅은 `git show :경로`로 **인덱스(스테이지된) 내용**을 읽는다. 작업 트리 파일을 읽으면 `git add -p` 일부만 올린 경우와 어긋난다. 실측: 한글 파일명도 `-z`로 안전하게 처리됨.

### Pitfall 4: Windows CRLF가 훅을 깨뜨린다
**What goes wrong:** `core.autocrlf=true`(이 환경은 LF→CRLF 경고가 실제로 출력됨)에서 `.githooks/pre-commit` 셔뱅 줄이 CRLF가 되면 sh가 실패할 수 있다. [ASSUMED: 실패 여부는 직접 재현하지 않았다. 예방이 값쌈]
**How to avoid:** `.gitattributes`에 `.githooks/* text eol=lf`, `*.sh text eol=lf`, `*.mjs text eol=lf`를 둔다.

### Pitfall 5: 훅이 clone마다 켜지지 않는다
`core.hooksPath`는 `.git/config`에 저장돼 저장소에 따라가지 않는다. `package.json`에 `"prepare": "git config core.hooksPath .githooks || exit 0"`를 두면 `npm install` 때 자동 설정된다. README(Phase 5)와 `npm run check:repo`가 훅 없이도 같은 검사를 수동 실행하게 한다. `git commit --no-verify`로 우회 가능하므로 push 전 `npm run check`를 습관화하고, 원하면 `.githooks/pre-push`에 전체 트리 스캔을 추가한다.

### Pitfall 6: 원본 추출본의 공백·따옴표 불일치
원본 텍스트는 `2021. 08 ~ 2021. 12`처럼 공백이 들어 있고, 따옴표가 ‘ ’ 이며, 회사명은 `교보생명금융마이데이터서비스앱‘피치(Peach)’`로 붙어 있다. 대조는 **공백 전부 제거 + 따옴표류(' ‘ ’ " “ ”) 제거** 후 부분 문자열 비교로 한다. 그래야 CONTEXT가 허용한 띄어쓰기 보정이 통과한다.

### Pitfall 7: 원본 일부가 PDF 레이어 겹침으로 깨져 있다
`ePbxeupybeolicnsthdeidtnh.ge`, `sTteacchk.`는 원본 텍스트에서 찾을 수 없다. 이 문구는 대조표에서 "원본 근거: CONTEXT D-01/D-03"으로 표시한 허용 목록에 넣는다(`Publishing,` `beyond the` `expected.` `Tech stack.` `Selected work / Career 2026` — 마지막은 원본에 `Selectedwork/Career2026`으로 있어 공백 제거 비교로 통과).

### Pitfall 8: 외부 링크 검사 오탐
삼성·LG 사이트는 봇 요청에 403/타임아웃을 줄 수 있다. linkinator 실패가 나오면 브라우저로 직접 열어 확인하고 결과를 기록한다. 링크 목록은 manifest에 고정해 "예상치 못한 외부 링크 추가"를 check-content가 잡는다. 링크알바는 걸지 않는다(D-14).

### Pitfall 9: iOS 숫자 자동 링크
기간 `2021.08` 같은 숫자열이 전화로 인식될 수 있다. `format-detection` 메타를 넣는다(PITFALLS 7).

## Code Examples

### `package.json`
```json
{
  "name": "portfolio-2026",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "퍼블리셔 유윤희 포트폴리오 2026",
  "engines": { "node": ">=22.22.0" },
  "scripts": {
    "serve": "serve . -l 3000",
    "validate": "html-validate index.html",
    "check:content": "node tools/check-content.mjs",
    "check:repo": "node tools/check-repo.mjs",
    "check": "npm run validate && npm run check:content && npm run check:repo",
    "check:links": "linkinator http://localhost:3000 --recurse",
    "prepare": "git config core.hooksPath .githooks || exit 0"
  },
  "devDependencies": {
    "html-validate": "11.21.0",
    "linkinator": "8.1.0",
    "serve": "14.2.7"
  }
}
```
`"type": "module"`이 있으면 `.mjs` 확장자는 필수가 아니지만 `tools/*.mjs`는 그대로 둔다. `check:links`는 `npm run serve`를 다른 터미널에서 띄운 상태에서 실행한다(플래그는 [ASSUMED], 첫 실행에서 확인).

### `.htmlvalidate.json` (실측 통과 구성)
```json
{
  "extends": ["html-validate:recommended", "html-validate:a11y"],
  "rules": {
    "heading-level": "error"
  }
}
```
- recommended가 이미 켜는 것: `no-inline-style`(style 속성 금지 → 클래스 사용), `prefer-native-element`, `no-redundant-role`, `empty-heading`, `wcag/*`, `unique-landmark`, `valid-id`, `doctype-style` 등.
- 빈 `hidden`/`data-slot` 요소, `data-*` 속성, `<data value>`, `role` 없는 빈 `aria-hidden` figure 모두 규칙 충돌이 없었다(실측). 끄거나 완화한 규칙은 **없다.**
- `unique-landmark`: `<nav>`가 둘 이상이면 `aria-label`이 서로 달라야 한다(실측 통과 시 `aria-label="주요 섹션"` 사용).
- 한글 콘텐츠와 충돌하는 규칙은 발견하지 못했다. `lang="ko"`는 필수.

### `.githooks/pre-commit`
```sh
#!/bin/sh
command -v node >/dev/null 2>&1 || { echo "pre-commit: node not found (blocking)"; exit 1; }
exec node tools/check-repo.mjs --staged
```
Git Bash에서 `core.hooksPath` 설정 후 실제로 커밋을 막고(전화번호 포함) 통과시키는 것까지 확인했다. 실행 권한 비트는 필요 없었다.

### `tools/check-repo.mjs` 핵심 (실측 통과 정규식)
```js
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const S = String.raw`[-–—.\s]?`;            // 하이픈/점/공백/en·em dash 중 0~1개
export const PHONE_RE = new RegExp(
  String.raw`(?<!\d)(?:\(?\+?82\)?${S}(?:\(0\)${S})?|0)1[016789]${S}\d{3,4}${S}\d{4}(?!\d)`
);
const git = (a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const staged = process.argv.includes('--staged');

const files = (staged
  ? git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'])
  : git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
).split('\0').filter(Boolean);

const SKIP = /(^|\/)package-lock\.json$/;
const FORBIDDEN = /^(_screenshots|private|dist|\.planning\/source)\/|\.pdf$|^\.print-tmp\.html$/i;
let bad = 0;
for (const f of files) {
  if (FORBIDDEN.test(f)) { console.error(`forbidden path tracked: ${f}`); bad++; continue; }
  if (SKIP.test(f)) continue;
  let txt;
  try { txt = staged ? git(['show', `:${f}`]) : readFileSync(f, 'utf8'); } catch { continue; }
  if (txt.includes('\0')) continue;                      // 바이너리 건너뜀
  txt.split(/\r?\n/).forEach((line, i) => {
    if (PHONE_RE.test(line)) { console.error(`${f}:${i + 1}: phone-like pattern`); bad++; }
  });
}
if (bad) { console.error(`BLOCKED: ${bad} problem(s)`); process.exit(1); }
```
- 실측: 구분자가 하이픈·점·공백·무구분인 휴대폰, 국가번호가 `+82`, `(+82)`, `82`, `+8210`인 형식, en dash 구분 모두 걸렸다. `2024.09`, `2021. 08 ~ 2021. 12`, `2022.01 ~ 2023.07`, `2021.08~2021.12`, `50:50`, `eventTypeCd=90`, URL 속 숫자 `26532`, 8자리 날짜 연속열은 오탐 0건.
- `--others --exclude-standard`가 `.planning/source/` 등 무시 파일을 제외하므로 전체 스캔이 원본 추출본에서 스스로 실패하지 않는다.
- 이 정규식은 휴대폰(01x) 중심이다. 서울 지역번호 등 유선번호는 포함하지 않았다(프로젝트에 해당 번호 없음, 필요하면 추가).
- 추가 검사(같은 파일): 파일명이 `^[a-z0-9._-]+(/[a-z0-9._-]+)*$`인지(예외: `CLAUDE.md`, `README.md`, `LICENSE`, `.planning/` 하위) 확인. BASE-03.
- BASE-02 확인 명령: `git check-ignore -v _screenshots/x.png private/contact.json dist/a.pdf x.pdf`가 모두 매칭, `git ls-files | grep -E '^(_screenshots|private|dist)/|\.pdf$'`가 0건.

### `.gitattributes`
```
* text=auto
.githooks/* text eol=lf
*.mjs text eol=lf
*.sh text eol=lf
```

### `tools/check-content.mjs` 설계
**입력:** `index.html`, `tools/content-manifest.json`, (있으면) `.planning/source/portfolio-pdf.txt`.
**텍스트 추출(정규식):** `<script>/<style>/<!-- -->` 제거 → 태그를 경계로 텍스트 노드 배열 생성 → `&amp; &lt; &gt; &quot; &#39; &nbsp; &middot;` 정도만 디코드 → `hidden`/`aria-hidden` 요소는 비어 있어야 한다는 별도 규칙으로 처리.

**manifest(대조표):**
```json
{
  "projects": [
    { "id": "bs-samsung", "name": "삼성E스토어기획전프로모션", "company": "비스톤스",
      "platform": "web", "status": "live", "contribution": 50,
      "contributionContext": "2인 1팀으로 50:50 분담",
      "description": "기획전 프로모션 구축 / 유지보수",
      "links": ["https://samsungebiz.com/event/galaxycampus/"] }
  ],
  "companies": [ { "id": "gi-data", "name": "지아이데이타", "from": "2024-09", "to": "2026-09", "summary": "하나손해보험 App" } ],
  "sourceStrings": ["퍼블 기여도", "더 궁금한 점이 있으시다면 편하게 연락 부탁 드립니다."],
  "uiAllowlist": ["운영 중","운영 종료","관련 기사","APK 보유","관련 기사 보기","본문 바로가기","새 탭","소속","플랫폼","담당 업무","Publishing,","beyond the","expected.","Tech stack.","퍼블리셔 유윤희 포트폴리오"]
}
```
manifest는 전화번호가 없고 어차피 사이트에 공개되는 문장이므로 커밋해도 안전하다. CONTEXT의 프로젝트 표가 그대로 manifest의 원천이다.

**검사 항목(번호는 실패 메시지에 쓴다):**
1. 존재: manifest의 프로젝트 13개 id가 `article.project#id`로 모두 있고 개수 정확히 13. 회사 section 4개, 순서가 지아이데이타→케이엔큐레이션→비스톤스→애비로드.
2. 필드: 각 article의 `<dt>` 순서가 `소속, 플랫폼, [담당 업무], 퍼블 기여도` 중 고정 순서의 부분수열이고, `data-slot="screenshot"`·`data-slot="point"` figure/div가 이 순서로 존재. `data-status` 값이 허용 집합, 기여도 숫자가 manifest와 일치, 맥락 문구는 manifest에 있을 때만 존재.
3. 링크: 모든 `<a href^="http">`는 `target="_blank"` + `rel`에 `noopener`, manifest `links`와 집합 일치(D-12/13/14 위반 즉 ADDY 소개서·링크알바·삼성 쇼핑 메인 URL이 걸리면 실패). `mailto:`만 이메일, **`tel:` 금지.**
4. 앵커: 모든 `href="#x"`에 `id="x"` 존재, id 전체 유일, id/파일 경로는 kebab-case ASCII, Career 요약 4개가 회사 id를 가리킴.
5. 제목: h1 1개, 레벨이 한 단계씩만 증가(html-validate와 중복이지만 단독 실행 시를 위해). article마다 h3.
6. 경로: `src|href|srcset|poster`에 `/`로 시작하는 루트 절대경로 금지(`//`·`http` 제외), `\` 금지.
7. 슬롯: `data-slot="phone"`이 존재하고 **텍스트가 비어 있다**; `hidden` 요소는 내용이 없다.
8. 전화번호: `check-repo`의 `PHONE_RE`를 import해 `index.html`에도 적용.
9. **원본 역검증(원본 파일이 있을 때만):** (a) manifest `sourceStrings`와 각 프로젝트 `name`·`description`이 원본에 있다(공백·따옴표 제거 비교). (b) `index.html`의 모든 텍스트 노드(공백·구두점만인 것 제외)가 원본에 부분 문자열로 있거나 `uiAllowlist`에 있어야 한다 → "원본에 없는 문장 0건" 자동화. (c) 숫자 토큰(`/\d+(?:\.\d+)*%?/g`)을 `index.html` 텍스트와 원본에서 각각 뽑아(원본은 `(\d)\.\s+(\d)`→`$1.$2` 정규화 후) 사이트 쪽 집합이 원본 쪽 집합의 부분집합. 이 검사는 약하다(30%와 50%가 둘 다 원본에 있다)이므로 프로젝트별 기여도는 항목 2의 manifest 일치로 보완한다.
10. **원본이 없으면** 9번을 건너뛰고 `skipped: source text not found (local-only check)`를 출력하며 종료 코드 0. `--require-source`를 주면 실패. 이렇게 하면 CI나 다른 clone에서도 `npm run check`가 통과한다.

출력은 항목별 `PASS/FAIL` 한 줄과 실패 상세. 종료 코드는 실패 건수 > 0이면 1. 정규식 방식의 한계: 중첩 같은 태그(`<div>` 안의 `<div>`)를 완전히 파싱하지 못한다. article 경계는 `<article … class="project"` ~ `</article>` 사이만 자르고(article은 중첩하지 않는다), 내부 필드는 `<dt>`/`data-slot` 순서만 본다. 이 범위는 정규식으로 충분하다.

### 로컬 실행
```bash
npm run serve       # http://localhost:3000  (file:// 미사용)
npm run check
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| husky + lint-staged | `core.hooksPath` + 직접 스크립트 | 의존성 0 |
| 작업 트리 grep | 인덱스(`git show :path`) 스캔 | 스테이지된 내용만 정확히 검사 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | html-validate/serve/linkinator는 정상 패키지(slopcheck 미실행) | Package Legitimacy | 낮음: STACK.md 선정 + 저장소 확인. 설치 전 human-verify 한 번 |
| A2 | linkinator 8.1.0의 `--recurse` 옵션과 `http://localhost:3000` 대상 사용법 | Code Examples | 낮음: 첫 실행에서 도움말로 확인 |
| A3 | CRLF 셔뱅이 실제로 훅을 깨는지(예방책은 무해) | Pitfall 4 | 낮음 |
| A4 | 배지 라벨(`운영 중` 등)은 CONTEXT/REQUIREMENTS 표기 기준이며 원본 문장이 아닌 UI 라벨 | Pattern 1 | 중간: 대조표 허용 목록에 명시해야 함 |
| A5 | 회사 섹션에서 영문 눈썹 문구 제거(D-04 우선) 해석 | Pattern 2 | 중간: 사용자 의도와 다르면 `06 / GI Data` 등 복원 |

## Open Questions

1. **회사 섹션 영문 눈썹 문구.**
   - 아는 것: D-03은 원본 영문 번호·제목 유지, D-04는 영문 회사명 표시 금지.
   - 불명확: 회사 섹션에 `03 / GI Data` 형태를 쓸지.
   - 권고: 번호 + 한글 제목만(`03`, `지아이데이타.`). D-04가 더 구체적이다.
2. **담당 업무가 없는 프로젝트(위캔키즈클럽, 링크알바, FSD 코스메틱, 그린다)의 카드 밀도.**
   - 권고: 해당 행을 생략하고 새 문장을 만들지 않는다. 시각 균형은 Phase 2 CSS 과제.
3. **`<title>` 문자열**(`퍼블리셔 유윤희 포트폴리오`)은 원본 PDF 파일명에서 온 것이다. 허용 목록에 둔다.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 모든 도구 | ✓ | 22.23.4 | — |
| npm | 설치·스크립트 | ✓ | Node 22 동봉 | — |
| git | hook, 검사 | ✓ | 2.43.0.windows.1 | — |
| html-validate 11.21.0 | QUAL-01 | ✓ (임시 폴더에서 설치·실행 확인) | 11.21.0 | — |
| 외부 네트워크 | 링크 검사 | ✓(npm 접속 확인) | — | 수동 브라우저 확인 |
| slopcheck | 패키지 검증 | ✗ (pip 설치 권한 거부) | — | human-verify |

## Validation Architecture

nyquist 검증이 설정에서 비활성이므로 별도 테스트 프레임워크는 두지 않는다. 검증은 위 `npm run check` 한 줄과 수동 항목으로 구성한다.

| Req | Behavior | Command |
|-----|----------|---------|
| QUAL-01 | 오류 0, h1→h2→h3 | `npm run validate` |
| CONT-01~08 | 13개 article, 필드 순서, 링크, 슬롯, 원본 역검증 | `npm run check:content` |
| BASE-01~03 | 전화번호 0, 금지 경로 0, 파일명 | `npm run check:repo` |
| BASE-04 | Node 22에서 위가 모두 동작 | `node --version` + `npm run check` |
| 링크 열림(성공 기준 3) | 걸린 링크 실제 확인 | `npm run serve` 후 `npm run check:links` + 브라우저 수동 확인 |
| 훅 | 전화번호 포함 커밋 차단 | 런타임에 조립한 임시 번호 파일을 `git add` → `git commit`이 실패하는지 확인 후 `git reset` |

수동: 브라우저에서 CSS 없이 읽히는지, 접근성 트리에 `hidden` 요소가 없는지(DevTools Accessibility), 원본 PDF를 한 번 눈으로 훑어 누락 확인.

## Security Domain

| ASVS | Applies | Control |
|------|---------|---------|
| V5 Input Validation | no (사용자 입력 없음) | — |
| V8 Data Protection | yes | 전화번호 비공개: 훅, `.gitignore`, 전체 스캔, 히스토리 확인 |
| V14 Config | yes | 외부 링크 `rel="noopener"`, `.gitignore` 금지 경로 |

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| 전화번호/원본 텍스트 커밋 | Information Disclosure | pre-commit 스테이지 스캔 + `FORBIDDEN` 경로 + 푸시 전 `npm run check` |
| 새 탭 링크의 `window.opener` | Tampering | `rel="noopener"` (check-content가 강제) |
| 훅 우회(`--no-verify`) | Information Disclosure | 푸시 전 수동 `npm run check`, 필요 시 pre-push 훅 |

## Sources

### Primary (HIGH)
- 로컬 실행(2026-11-11): Node 22.23.4에서 html-validate 11.21.0·serve 14.2.7 설치, `.htmlvalidate.json` 구성별 결과(doctype-style, heading-level 미포함, meta 위치 오류, 빈 hidden 요소 통과), 전화번호 정규식 26개 사례, git `core.hooksPath` 훅 차단/통과.
- `npm view` (html-validate, serve, linkinator): engines, 저장소, postinstall.
- CONTEXT.md, REQUIREMENTS.md, CLAUDE.md, `.planning/research/PITFALLS.md`·`ARCHITECTURE.md`.

### Secondary / Tertiary
- html-validate 규칙 문서(https://html-validate.org/rules/heading-level.html)는 오류 메시지의 안내 링크만 확인, 본문은 읽지 않았다 (MEDIUM).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 실행 확인
- Architecture(마크업·검사 설계): HIGH — 핵심 패턴 실측, check-content 구현 자체는 미실행이므로 설계 수준
- Pitfalls: HIGH (CRLF 항목만 MEDIUM)

**Research date:** 2026-11-11
**Valid until:** 2026-12-11
