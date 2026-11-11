# Project Research Summary

**Project:** 퍼블리셔 유윤희 포트폴리오 2026
**Domain:** 직접 코딩한 정적 한국어 포트폴리오 사이트(앱·반응형 웹 퍼블리셔 이직용) + 같은 HTML에서 뽑는 제출용 PDF, GitHub Pages 배포
**Researched:** 2026-11-11
**Confidence:** MEDIUM-HIGH (스택·브라우저 지원·print CSS는 HIGH. 채용 담당자 행동과 PDF 내부 동작(폰트 임베딩, lazy 이미지)은 MEDIUM~LOW라 실측이 필요하다)

## Executive Summary

이 프로젝트는 "포트폴리오 사이트 자체가 1번 작업물"인 경우다. 국내 퍼블리셔 공고의 자격요건은 거의 그대로 웹표준·웹접근성·크로스브라우징·반응형이다. 그래서 검토자는 화려한 효과보다 깨끗한 마크업, 375px에서 깨지지 않는 레이아웃, Tab 키 이동, 정직한 링크 상태를 본다. 네 연구가 같은 결론에 이른다. **`index.html` 한 장에 콘텐츠를 HTML로 직접 쓰고**(JSON+JS 렌더링 금지), CSS는 `@layer`로 순서를 고정한 모던 네이티브 CSS(nesting, container queries, `clamp()`)로 짜고, JS는 점진적 향상만 맡긴다. PDF는 별도 문서가 아니라 같은 DOM에 `print.css`를 적용해 headless Chrome으로 뽑는다. 이 "단일 소스, 두 매체" 구조가 그대로 차별점이 된다.

핵심 리스크는 기술보다 **정보 관리**에 있다. (1) 전화번호가 공개 저장소·HTML·배포 PDF에 새는 것, (2) 스크린샷에 고객사 실데이터·내부 URL이 찍혀 있는 것, (3) 원본에 없는 수치나 과장된 표현("구축", "주도")이 들어가는 것, (4) 운영 종료된 서비스에 죽은 링크가 걸리는 것이다. 이 네 가지는 모두 콘텐츠 단계의 게이트(원본 대조표, 스크린샷 검수 체크리스트, 링크 상태 필드, 전화번호 grep)로 막는다. 전화번호는 공개 파일에는 빈 `data-slot`만 두고, git 밖 `private/contact.json`에서 PDF를 만드는 순간에만 주입한다. CSS로 숨기는 방식은 금지다.

기술 리스크는 PDF 쪽에 몰려 있다. 웹 레이아웃(긴 스크롤, design-taste 키트의 `100svh` 섹션 높이, `opacity:0` 진입 모션, `loading="lazy"`)과 A4 페이지는 근본적으로 다르다. 또 Chrome은 woff2/가변 폰트를 PDF에 Type3로 넣어 검색·복사 품질이 떨어질 수 있다. 그래서 print 전용 정적 TTF를 쓰고, 화면 레이아웃이 굳기 **전에** 2~3쪽짜리 PDF spike를 돌려 위험을 일찍 확인한다. 디자인 쪽에서는 design-taste-frontend의 트렌디한 규칙이 "10초 안에 회사·화면·기여도 파악"이라는 Core Value와 충돌할 수 있다. 충돌하면 Core Value가 우선이라고 명시하고 waiver로 기록한다.

## Key Findings

### Recommended Stack

사이트 자체는 **런타임 의존성 0개**다. HTML 하나, CSS 파일 몇 개, ES module JS 하나, self-host 폰트, 미리 변환한 이미지만 배포한다. Node 도구는 이미지 변환·PDF 생성·검증용 로컬 도구일 뿐이며 소스를 변환하지 않으므로 "빌드 없음" 제약을 지킨다. 상세: `.planning/research/STACK.md`

**Core technologies:**
- **시맨틱 HTML**: 콘텐츠의 단일 원본. `article.project`, `dl`(메타), `figure/picture`, `<time>`, `<data>`. view-source가 곧 실력 증거다.
- **모던 CSS (무전처리)**: `@layer reset/tokens/base/layout/components/utilities/print`, 네이티브 nesting(Safari 17.2+), container queries, `oklch()`, `clamp()`. 쓰지 않을 것: `@scope`, anchor positioning, `calc-size()`. scroll-driven animations는 `@supports`로 감쌀 때만.
- **Vanilla JS (`type="module"`)**: 모바일 메뉴, `<dialog>` 스크린샷 확대, 현재 섹션 표시. 콘텐츠를 만들지 않는다.
- **Pretendard 1.3.9 (OFL, self-host)**: 웹은 쓰는 굵기(400/600/700)만 static dynamic subset woff2(preload 없음). PDF는 `@media print` 전용 static TTF. 전체 woff2나 가변 파일 그대로 쓰기는 금지.
- **headless Chrome/Edge `--print-to-pdf`**: PDF 생성(아래 충돌 조정 1).
- **sharp**: `_screenshots/` 원본을 WebP/JPEG 여러 폭으로 변환. Node 20.9+에서 동작.
- **GitHub Pages (main / root)**: `.nojekyll`, 상대경로, 소문자 ASCII 파일명.
- **검증 도구**: html-validate 11(Node 22.22+/24.8+), linkinator 8, `npx serve`, Lighthouse, W3C Nu Checker, design-taste 스킬 스크립트(Node 22+).

**버전 주의:** 로컬 Node는 **v20.20.2**다. Puppeteer 25, html-validate 11, design-taste 스킬 스크립트는 Node 20에서 돌지 않는다. Phase 1에서 Node 24 LTS로 올리는 것을 권장한다(Q2).

### Expected Features

상세: `.planning/research/FEATURES.md`

**Must have (table stakes):**
- Hero 한 줄 소개(원본 카피) + 직무명 + 총 경력 기간(경력 데이터에서 계산한 값만) + 이메일
- Skills "주력 / 경험" 두 단계 텍스트(퍼센트 게이지 금지)
- Career 타임라인 4곳(`<ol>` + `<time>`, 프로젝트 앵커)
- 프로젝트 13개를 같은 필드 순서로: 프로젝트명 / 소속사·고객사 / 기간 / 플랫폼 / 작업 유형 / 담당 업무 / 기여도 + 맥락 한 줄 / 스크린샷 / 링크·운영 상태. hover 없이 항상 보이게.
- 링크·운영 상태 배지: `운영 중` / `운영 종료`(링크 없음) / `소개서 링크` / `관련 기사` / `APK 보유`(요청 시 시연) / `비공개`
- Contact: `mailto:` + 복사 가능한 이메일. 웹에 전화번호 없음.
- 반응형 375/768/1440(가로 스크롤 0), Validator 오류 0, skip link·`:focus-visible`·Tab 순서, alt, 대비 AA, Chrome·Edge·iOS Safari
- 이미지 최적화, OG/meta/favicon, 깨진 링크 0
- 같은 디자인의 PDF + 다운로드 버튼

**Should have (v1 포함 권장):**
- Colophon("이 사이트는 이렇게 만들었습니다") + 실측 Lighthouse/Validator 결과(측정일 포함)
- GitHub 공개 저장소 링크 + README
- 프로젝트별 "퍼블리싱 포인트"(원본 근거가 있을 때만)
- `prefers-reduced-motion` 대응, 접근성을 갖춘 `<dialog>` 확대

**Defer:** 플랫폼/회사 필터, 다크모드, 쌍 스크린샷, 영문 버전, 프로젝트별 상세 페이지

**Anti-features:** 스킬 % 게이지, 섹션마다 스크롤 페이드인·패럴랙스·커스텀 커서·스크롤 하이재킹·캐러셀, 인트로 로딩, 문의 폼, 죽은 URL, 지어낸 수치, 고객사 로고 강조, 인증마크 주장, Lighthouse 자동 배지.

### Architecture Approach

`index.html` 한 장에 회사 섹션 4개, 그 안에 `article.project` 13개. 상태는 `data-platform`, `data-status`, `<data value>`로 마크업하고 CSS가 배지를 그린다. 프로젝트 id(`<회사약어>-<프로젝트>`, 예: `kn-puring`)를 article id·앵커·이미지 폴더명에 똑같이 쓴다. `index.html` 맨 위 주석에 article 템플릿을 두고 `tools/check-content.mjs`가 슬롯 누락·alt 누락·전화번호 패턴을 검사한다. 상세: `.planning/research/ARCHITECTURE.md`

**Major components:**
1. `index.html`: 공개 콘텐츠의 단일 원본. 빈 `<span data-slot="phone" data-print-only>`만 둔다.
2. `css/` (`layers.css`, `tokens.css`, `base.css`, `layout.css`, `components.css`, `print.css`): `@layer` 순서 고정, `print.css`는 `media="print"`.
3. `js/main.js`: 점진적 향상만. DOM 노드를 새로 만들지 않는다.
4. `img/projects/<id>/`: 최적화본(커밋). 원본은 `_screenshots/`(git 제외).
5. `tools/build-pdf.mjs`: 임시 사본에 전화번호 주입, lazy 제거, 로컬 http 서빙, headless Chrome 인쇄. 결과는 `dist/`(git 제외).
6. `tools/optimise-images.mjs`, `tools/check-content.mjs`.

### Critical Pitfalls

상세: `.planning/research/PITFALLS.md`

1. **전화번호 유출**: 공개 트리에는 빈 슬롯만, `private/contact.json`에서 빌드 시점에만 주입. `*.pdf`, `dist/`, `private/`, `.print-tmp.html` gitignore, 커밋 전 전화번호 패턴 grep(pre-commit hook).
2. **스크린샷 속 기밀·개인정보**: 검수 체크리스트를 완료 조건으로, 블러 대신 단색 박스, 재인코딩으로 EXIF 제거.
3. **기여도·소속 과장, 지어낸 수치**: `소속사 → 고객사 → 서비스명`, 원문 동사 유지, 원본 대조표에서 "새 숫자 0건".
4. **PDF 깨짐**: 모션 opt-in(`html.js`) + print에서 강제 해제, `print-color-adjust: exact`, 블록 래퍼에 `break-inside: avoid`, `--no-pdf-header-footer`, print 전용 TTF, `pdffonts`로 TrueType 확인.
5. **한글 조판 + iOS + Pages**: `keep-all` + `overflow-wrap: anywhere`, `font-synthesis: none`, `format-detection`, `min-height: 100svh`, 소문자 ASCII kebab-case, 상대경로, `core.ignorecase false`, `.nojekyll`.
6. **트렌디 디자인 vs 빠른 확인**: "10초 테스트"(특정 회사의 담당 업무를 10초 안에 찾기)를 QA 기준으로.

## 연구 간 충돌 조정 (결정 사항)

| # | 충돌 | 결정 | 이유 |
|---|------|------|------|
| 1 | PDF 도구: Puppeteer vs Chrome CLI | **Chrome/Edge CLI를 감싼 `tools/build-pdf.mjs`(Node 내장 모듈만)**. spike에서 폰트 대체·이미지 누락·결과 불안정이 나오면 Puppeteer로 승격(Node 22.12+ 필요) | 로컬 Node 20에서 바로 돌고, 의존성 0 기조와 맞다. Type3 문제는 엔진 공통이라 print 전용 TTF로 해결 |
| 2 | 비공개 폴더 이름 | **`private/contact.json`** | 탐색기에서 보이고 관리 쉬움. 공개 JS가 전화번호를 읽는 경로는 만들지 않는다. 파일이 없으면 스크립트 실패 |
| 3 | PDF 출력 폴더 | **`dist/`** (gitignore) | 구조도와 일치 |
| 4 | 원본 스크린샷 폴더 | **`_screenshots/`** (gitignore 추가) | 이미 생성됨 |
| 5 | 최적화 이미지 | **`img/projects/<id>/`, WebP 800w/1600w + JPEG 1600w 폴백**, AVIF 선택 | PDF 스크립트가 `<source>`를 제거해 JPEG 사용 → 용량 관리 |
| 6 | 폰트 방식 | **static 굵기별 dynamic subset(400/600/700), preload 없음 + print 전용 static TTF** | 조각 92개라 preload 대상이 불명확, 가변은 PDF에서 Type3 |
| 7 | PDF 판형 | **원본 PDF 실제 페이지 크기를 확인한 뒤 맞춤** | 같은 문서의 새 버전으로 읽히도록. spike에서 확정 |
| 8 | 상태값 이름 | **`data-status="live | closed | intro | article | apk | private"`** | 배지 텍스트와 1:1 |
| 9 | PDF 파일명 | 제출본 **`퍼블리셔_유윤희_포트폴리오_2026.pdf`**, 웹 공개본 **`files/portfolio-2026.pdf`** | 공백·한글 URL 문제 회피 |
| 10 | 제목 레벨 | **h1(이름) → h2(섹션·회사) → h3(프로젝트)** | heading 단계 건너뛰지 않기 |
| 11 | 키트 `system.css`(약 104KB) 사용 | **사용자 결정 (Q1)**. 연구는 "키트 CSS를 로드하지 않고 규칙만 손으로 구현 + 스킬 체커로 검증" 쪽으로 기운다 | Core Value가 "직접 마크업한 코드가 실력 증거"이고, 키트에 `@layer`·print가 없으며 `100svh` 섹션 규칙이 PDF·7개 프로젝트 섹션과 부딪힌다. 반대 근거: `@import … layer(kit)`가 게이트 통과에 덜 수고롭다 |

## Implications for Roadmap

의존성 순서(경계 → 콘텐츠 → 스타일 → 컴포넌트 → 이미지 → JS → print → QA)를 뼈대로, **PDF spike를 디자인 골격 단계로 앞당긴다.** 연구가 제안한 8단계(설정이 Coarse라 로드맵에서 3~5단계로 묶을 수 있음):

1. **기반과 개인정보 경계** — 폴더 구조, `.gitignore` 보강, `.nojekyll`, `core.ignorecase false`, 전화번호 grep hook, 파일명 규칙, 프로젝트 id 13개, Node 24(승인 시), 키트 결정 기록
2. **콘텐츠 이전 (스타일 없음)** — CSS 없이 완결된 `index.html`, 원본 대조표(누락 0, 새 수치 0), 링크 생존 확인표, `check-content.mjs`
3. **토큰·타이포·반응형 골격 + PDF spike** — CSS 레이어, Pretendard self-host, 한글 조판 규칙, 포인트 컬러 1개 + 대비 검증, 375/768/1440. spike로 판형·폰트 임베딩·lazy·Puppeteer 승격 여부 확정
4. **섹션 컴포넌트** — 프로젝트 카드(container queries), 배지, 타임라인, 스크린샷 프레임과 자리표시, 케이엔큐레이션 섹션 밀도 결정
5. **스크린샷 파이프라인 (3~4와 병행)** — 검수 체크리스트, `optimise-images.mjs`, srcset·alt, og:image
6. **인터랙션·모션·접근성** — `main.js`, `<dialog>`, reduced-motion 안에서만 모션, 키보드 순회, JS 끈 상태 확인
7. **Print 스타일과 PDF 완성** — `print.css`, `build-pdf.mjs` 완성판(전화번호 주입, `--public` 공개본), 링크·한글 복사·TrueType·용량 ≤5MB
8. **QA·배포·Colophon** — html-validate, W3C Nu, linkinator, 스킬 게이트, Lighthouse 실측, iPhone 실기기, 전화번호 grep 0건, README

### Research Flags

- **Phase 3 (PDF spike):** headless CLI의 웹폰트·lazy 대기, 북마크·tagged PDF, woff2 vs TTF, flex/grid 안 `break-inside` — 실측 필요
- **Phase 4:** 스킬의 "섹션 = 화면 1~2개" 규칙과 7개 프로젝트 섹션 충돌, 키트 미사용 시 게이트 요구사항
- **Phase 7:** 원본 판형 재현, PDF 용량(이미지 재인코딩), 공개본/제출본 이원화
- 1, 2, 5, 6, 8은 표준 패턴이라 별도 리서치 불필요

## 열린 질문 (사용자 확인 필요)

| # | 질문 | 영향 phase | 기본 제안 |
|---|------|-----------|-----------|
| Q1 | design-taste 키트 `system.css`를 가져올지, 규칙만 손으로 구현할지 | 1, 3, 4 | 손으로 구현 |
| Q2 | Node v20.20.2 → 24 LTS 업그레이드 | 1 | 올린다 |
| Q3 | 사이트 다운로드 PDF를 전화번호 없는 공개본으로 | 7 | 그렇게 한다 |
| Q4 | GitHub 저장소 공개 여부, 공개 시 `.planning/`도 공개되는데 괜찮은지 | 1, 8 | 공개, `.planning/`은 사용자 결정 |
| Q5 | 프로젝트별 기간이 따로 있는지(없으면 재직 기간) | 2 | 재직 기간 |
| Q6 | "운영 중" URL과 ADDY 소개서·EXAONE 기사 URL 생존 확인 | 2 | 확인 안 되면 링크 없음 |
| Q7 | 스크린샷 공개 범위(NDA, 마스킹, 하나손해보험·관리자 화면) | 5 | 이미 공개된 운영 화면만 |
| Q8 | 경력 순서: 최신순 vs 원본 순서 | 2 | 최신순 |
| Q9 | 검색엔진 노출 여부(`noindex`) | 8 | 사용자 결정 |
| Q10 | 영문 표기, 저장소 이름(루트 사이트 vs 프로젝트 사이트) | 1, 7 | 프로젝트 사이트 + 상대경로 |
| Q11 | "퍼블리싱 포인트"로 쓸 추가 사실이 있는지 | 2 | 없으면 비워 둠 |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `npm view`로 버전·engines 확인, MDN BCD로 브라우저 지원 확인. PDF Type3 동작은 MEDIUM(실측 필요) |
| Features | MEDIUM | 공고 요건은 반복 확인, 면접관 행동은 실무 관행에서 추론 |
| Architecture | MEDIUM-HIGH | 공식 문서와 로컬 키트 파일 기준. headless 인쇄 lazy 동작은 미확인 |
| Pitfalls | MEDIUM | 브라우저·Pages 동작 HIGH, 채용 사이트 첨부 한도·인쇄 분할 LOW |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- headless CLI 대기 동작과 PDF 품질 → Phase 3 spike, 실패 시 Puppeteer
- 원본 PDF 판형 → 확인 후 `@page size` 확정
- 채용 사이트 첨부 용량 한도 → 사용자가 업로드 화면에서 확인, 그 전까지 ≤5MB 목표
- design-taste 게이트의 키트 미사용 판정 → Q1 결정 직후 `gate.mjs` 확인
- 사용자 입력(스크린샷, 링크 생존, NDA 범위)이 Phase 2·5 일정을 좌우

## Sources

### Primary (HIGH)
- npm registry(`npm view`, 2026-11-11): pretendard 1.3.9, puppeteer 25.17.0(node>=22.12.0), html-validate 11.21.0, sharp 0.35.5, sharp-cli 6.1.0, linkinator 8.1.0, serve 14.2.7, pagedjs 0.4.3(정체), @squoosh/cli 0.7.3(방치)
- MDN browser-compat-data 8.1.8 + web-features
- https://github.com/orioncactus/pretendard
- https://developer.chrome.com/docs/chromium/headless , https://developer.chrome.com/docs/automation-and-testing/headless-cli
- https://developer.chrome.com/blog/print-margins , Chrome 131 release notes
- https://pptr.dev/api/puppeteer.pdfoptions
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- 로컬 `design-taste-frontend` SKILL.md, `assets/system.css`
- WCAG 2.2 AA

### Secondary (MEDIUM)
- chromium-dev(2025-12-17) Type3 폰트 스레드
- 원티드/리멤버 퍼블리셔 채용공고(wd/45894, wd/61598, posting/265899, 266418)
- 이랜서 블로그, print CSS·page break 가이드(flaviocopes, htmlcsstoimage, dev.to)
- https://github.com/sun-typeface/SUIT

### Tertiary (LOW)
- 면접관 평가 행동(실무 관행 추론), 채용 사이트 첨부 용량(커뮤니티), flex/grid 인쇄 분할(엇갈림), headless lazy 동작(미확인), miso.kr·인프런 강의 소개

---
*Research completed: 2026-11-11*
*Ready for roadmap: yes (Q1~Q4는 Phase 1 착수 전에 답을 받는 것을 권장)*
