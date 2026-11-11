# Phase 3: 인터랙션과 제출용 PDF - Research

**Researched:** 2026-11-11
**Domain:** vanilla JS 인터랙션(헤더·햄버거·sticky 키워드 전환), 키보드 접근성, Puppeteer 25 PDF 빌드, A4 print 레이아웃
**Confidence:** HIGH (모든 핵심 주장을 이 머신에서 스크래치패드 프로토타입으로 실측함. Safari 동작만 [ASSUMED])

## Summary

Phase 2가 남긴 정적 CSS(헤더·`data-hidden`·`data-open`)와 UI-SPEC의 모션 계약은 그대로 구현 가능하다. 스크래치패드의 프로토타입 사이트(index.html 마크업 변경 + CSS + `js/main.js`)를 Puppeteer로 돌려 약 45개 항목을 검증했고, 실패는 테스트 순서 실수 1건뿐이었다(고친 뒤 통과). 키워드 sticky 전환(트랙 2250px = 2.5 x 900, 슬롯 450px), Tab 포커스 시 해당 키워드 활성화(`scrollTo({behavior:'instant'})`가 `scroll-behavior: smooth`에서도 즉시 이동), 헤더 80px/8px 로직, `focusin` 복귀, 햄버거(Esc·오버레이·링크·Tab 순서·`matchMedia`), reduced-motion, JS 끈 상태(`setJavaScriptEnabled(false)`)가 모두 Chrome 157에서 동작한다.

PDF는 `puppeteer-core@25.17.0` + 설치된 Chrome(`channel: 'chrome'`)으로 만든다. Chrome for Testing 170MB 다운로드가 필요 없고, node_modules 증가량은 32MB / 패키지 23개, postinstall 없음이다. **Edge는 Puppeteer에서 이 머신에서 기동에 실패하거나 멈춘다(사용하지 않는다).** `page.pdf`는 6쪽, 132KB, 0.6초(전체 빌드 약 4초)이고 TrueType 2개 임베딩, h1/h2/h3 outline 24개, `tel:` 링크 주석 1개, mailto 2개가 나온다. 전화번호 주입, 숫자 없는 로그, 파일 없을 때 실패, 반대 모드(번호가 있어야 통과) 검사기를 모두 가짜 번호로 검증했다.

UI-SPEC에 **고쳐야 할 결함 2개**가 있다. (1) `.nav-bars`의 `::before/::after`가 위·아래 막대이고 가운데 막대를 `opacity:0`으로 끄면 자식 pseudo까지 같이 사라진다. 막대 소유자를 바꿔야 한다. (2) Phase 3의 헤더 숨김이 기존 `check-layout`의 앵커 오프셋 검사(헤더 bottom 기준)를 깨뜨린다(24건 FAIL 재현). 검사가 `--header-h`를 읽도록 바꿔야 한다.

**Primary recommendation:** `puppeteer-core@25.17.0`(exact) + Chrome 전용 `tools/build-pdf.mjs`, 키보드·모션 자동 검사는 같은 Puppeteer로 새 `tools/check-ui.mjs`에 쓰고 `check-layout.mjs`(제로 의존성 CDP)는 그대로 둔다(앵커 검사 1곳만 수정). 키워드 전환은 rAF 스로틀 스크롤 계산(IO는 가드용)으로 구현한다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
(03-CONTEXT.md `## Decisions` 원문 요약 없이 그대로 적용. 핵심만 재기재)
- 02에서 확정: 헤더 fixed, 아래로 스크롤하면 숨고 위로 스크롤하면 다시 나타남(02 D-15). 모바일은 햄버거(02 D-15). 키워드 섹션은 스크롤로 반응형 웹 → 인터랙션 → AI 활용 순서로 하나씩 전환, 데스크톱만 동작, JS 없음·reduced-motion·모바일·PDF는 세 덩어리 모두 펼침(02 D-11). 제출용 PDF는 A4 세로, 9쪽 안팎 허용(02 D-17). Phase 2 spike 권고대로 Puppeteer 25로 승격, Edge CLI 스크립트는 미리보기용으로 유지. no-JS 헤더·메뉴는 `html:not(.js)`, Phase 3에서 JS가 `.js` 클래스를 붙이고 동작을 더함.
- **D-01:** 키워드가 바뀔 때 이전 키워드는 위로 사라지고 새 키워드는 아래에서 위로 스르륵 올라온다. 오른쪽 프로젝트 리스트도 같은 방향으로 함께 바뀐다. `transform`과 `opacity`만 움직인다.
- **D-02:** 몇 번째 키워드인지 표시하지 않는다(번호·점 없음).
- **D-03:** 키워드는 스크롤로만 바뀐다(클릭 탭 없음). 보이지 않는 키워드의 프로젝트 링크도 Tab으로 갈 수 있어야 하고, 포커스가 들어가면 그 키워드가 보이는 위치로 바뀌어야 한다. 구현 방식은 Claude 재량.
- **D-04:** 키워드 하나당 화면 높이의 절반 정도, 세 키워드 합쳐 약 1.5화면 스크롤.
- **D-05:** sticky 섹션 + IntersectionObserver 또는 스크롤 위치, 상태 클래스만 변경. `animation-timeline`은 쓴다면 `@supports` 안에서만. 이 섹션이 "dealt moment" 1개.
- **D-06:** "Publishing, / beyond the / expected." 세 줄이 아래에서 살짝 올라오며 차례로 나타난다(전체 1초 안팎). 나머지 표지 요소는 뒤에 짧게 나타나거나 처음부터 보임(재량).
- **D-07:** 숨김 `opacity: 0` 상태는 `html.js`일 때만. JS 없음·reduced-motion·PDF에서는 처음부터 다 보인다. 그 밖의 모션은 hover뿐(DSGN-03).
- **D-08:** 햄버거(900px 미만)를 누르면 헤더 바로 아래로 메뉴 패널이 열리고 본문에 살짝 어두운 오버레이.
- **D-09:** 세 줄 아이콘, 열리면 X. 접근 가능한 이름 "메뉴", `aria-expanded`.
- **D-10:** Esc로 닫고 포커스를 버튼으로 복귀. 항목 클릭 시 닫고 이동. 열려 있는 동안 Tab 순서 자연스러움. 오버레이 클릭 시 닫힘.
- **D-11:** 헤더가 숨어 있을 때 포커스가 헤더 안으로 들어오면 다시 보인다. 메뉴가 열려 있는 동안 헤더는 숨지 않는다.
- **D-12:** PDF 파일명 `퍼블리셔 유윤희-포트폴리오.pdf`, `dist/`(gitignore). ASCII kebab-case 규칙은 커밋 파일에만 적용.
- **D-13:** PDF 연락처에서 전화번호는 `tel:` 링크(mailto와 같은 방식). 공개 `index.html`에는 `tel:`도 번호도 없고 빈 `data-slot="phone"`만. Puppeteer가 PDF 빌드 중 페이지 안에서만 채운다.
- **D-14:** 번호는 `.planning/source/portfolio-pdf.txt`에서 `private/contact.json`으로 옮긴다. 번호는 채팅·커밋·공개 파일·로그 어디에도 출력하지 않는다. 저장소에는 형식만 보여 주는 커밋 가능한 예시 파일을 둔다(phone 값은 숫자 자리표시가 아니라 설명 문자열). 이름·위치는 Claude 재량, 전화번호 검사에 걸리지 않아야 한다. `private/contact.json`이 없으면 PDF 빌드는 실패(PDF-02).
- **D-15:** 표시 형식은 원본 PDF 연락처 줄 형식 그대로. 로그와 검사 결과에는 "phone injected: yes"처럼 숫자 없는 결과만.

### Claude's Discretion
- 제출용 PDF의 쪽 구성(빈 스크린샷 자리 숨김/축소, 회사별 쪽 나눔, 마지막 푸터 고아 쪽 제거, 키워드 펼침, "표지 / 스킬·경력 / 회사별 / 연락처" 구성)
- 표지 보조 요소의 진입 방식·이징·지속 시간, 헤더 숨김 임계값
- 키워드 전환에서 숨겨진 리스트의 포커스·스크린리더 처리(D-03 충족)
- `scroll-behavior: smooth` 사용 여부(쓰면 reduced-motion에서 끔)
- Puppeteer PDF 옵션(`outline`, `tagged`, `waitForFonts`, `preferCSSPageSize`)과 `loading="lazy"` 제거 처리

### Deferred Ideas (OUT OF SCOPE)
- 실제 스크린샷과 PDF 용량 목표(5MB): Phase 4
- 스크린샷 확대 보기: Phase 4 (SHOT-04)
- 퍼블리싱 포인트 문구: 사용자가 나중에 제공
- 배포, noindex/robots, OG 메타: Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-03 | 모션은 히어로 진입과 hover뿐, reduced-motion에서 꺼짐, JS 꺼도 모든 내용 보임 | 표지 keyframes + `html.js` 게이트(실측: 샘플 opacity 0→1, 끝 상태 전부 1), reduced-motion/no-JS 검사(전 요소 opacity 1) |
| DSGN-05 (전환 동작) | 데스크톱에서 스크롤하면 키워드가 하나씩 전환, 나머지 환경은 모두 펼침 | sticky 트랙 + rAF 스크롤 계산 프로토타입(슬롯 경계 p=0/460/900에서 상태 전환 실측), 포커스 활성화, `matchMedia` on/off |
| QUAL-02 | 키보드만으로 모든 링크·버튼 접근 | Tab 순서, 스킵 링크 -> `main` 포커스, Esc, 헤더 `focusin` 복귀, 키워드 포커스 활성화 모두 Puppeteer로 자동 검증 |
| PDF-01 | 명령 하나로 웹과 같은 디자인의 PDF | `tools/build-pdf.mjs` 프로토타입(puppeteer-core + Chrome, 약 4초, 132KB) |
| PDF-02 | 전화번호는 git 밖 `private/contact.json`에서 PDF 빌드 시에만 주입 | 주입·검증·숫자 없는 로그·파일 없음 실패 모두 가짜 번호로 검증 |
| PDF-03 | 표지/스킬·경력/회사별/연락처, 카드 안 잘림, 빈 페이지 없음 | print CSS 추가분으로 9쪽 -> 6쪽, 최소 123자, 푸터 단독 쪽 없음 |
| PDF-04 | 링크 클릭, 한글 복사·검색(TrueType), 머리글·바닥글 경로 없음 | `tel:`/mailto/외부 링크 주석, Pretendard TrueType 2개·Type3 0, `displayHeaderFooter:false`, 경로 누출 검사 PASS |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 표지 진입 애니메이션 | CSS (`@keyframes`, `html.js` 게이트) | inline head script(클래스만) | 끝 상태가 CSS fill-mode로 보장되어 `main.js` 실패에도 숨은 채 남지 않는다 |
| 헤더 hide/show | Browser JS (rAF 스크롤 리스너) | CSS(`:focus-within` 안전망, transform 트랜지션) | 방향·누적 거리는 JS가 필요하고 표시 복귀는 CSS가 보장한다 |
| 햄버거 패널·오버레이 | CSS 상태(`aria-expanded`, `data-open`) | JS 이벤트(클릭, Esc, focusin, matchMedia) | 상태 표현은 CSS, 상태 전이만 JS |
| 키워드 전환 | CSS(sticky 트랙, `data-state` 스타일) | JS(스크롤 인덱스 계산, 포커스 보정) | 위치 pin은 CSS sticky, 어떤 블록이 active인지만 JS |
| 현재 섹션 표시 | JS IntersectionObserver | CSS(기존 `aria-current` 스타일) | 관찰 로직만 JS |
| 전화번호 주입 | 빌드 스크립트(Node + `page.evaluate`) | 정적 HTML의 빈 슬롯 | 번호는 git 밖 파일에서 읽어 DOM에만 주입, 저장소 HTML은 불변 |
| PDF 페이지 구성 | print CSS(`@layer print`) | 빌드 스크립트(lazy 제거, 미디어 에뮬레이션) | 같은 `index.html` 하나로 웹과 PDF 모두 생성 |
| PDF 검증 | Node 검사기(`pdf-report.mjs`, 의존성 0) | 빌드 스크립트가 호출 | 이미 있는 PDF 파서를 모드만 추가해 재사용 |
| 키보드·모션 검증 | Puppeteer 검사 스크립트 | `check-layout.mjs`(CDP) | 키 입력·컨텍스트 분리·JS 끄기를 짧은 코드로 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `puppeteer-core` | **25.17.0** (exact, devDependency) | `page.pdf`, 키보드 검사 자동화 | CLAUDE.md의 "Puppeteer 25.17.0"과 같은 릴리스·같은 저장소(github.com/puppeteer/puppeteer). `puppeteer`와 달리 **postinstall이 없고 브라우저를 받지 않는다**. engines `node >=22.12.0`(로컬 22.23.4 충족) [VERIFIED: npm view + 실설치] |
| 설치된 Google Chrome | 157.0.8103.27 | PDF 렌더, UI 검사 | `channel: 'chrome'`으로 찾는다. Edge 157은 Puppeteer에서 실패 [VERIFIED: 실행] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (없음) | - | 사이트 런타임에는 라이브러리를 추가하지 않는다 | `js/main.js`는 의존성 0 ES module |

기존 도구(`tools/lib/static-server.mjs`, `pdf-report.mjs`, `check-repo.mjs`, `check-layout.mjs`)를 그대로 재사용한다.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `puppeteer-core` + 시스템 Chrome | `puppeteer` + `PUPPETEER_SKIP_DOWNLOAD`/`.puppeteerrc.cjs` | 설치 크기는 동일(32MB, 25패키지). 설정 파일이 하나 더 필요하고 `node install.mjs` postinstall이 돈다. 기본값으로 두면 Chrome for Testing 약 170MB를 `C:\Users\user\.cache\puppeteer`에 받는다 |
| Chrome 전용 | Edge `executablePath` | **불가.** 이 머신에서 `Failed to launch ... Code: 0` 또는 무한 대기. `channel:'msedge'`는 `computeSystemExecutablePath`에서 TypeError |
| Puppeteer로 `check-layout` 이관 | 기존 CDP 유지 | 이관하면 Edge 지원이 사라지고 제로 의존성이 깨진다. 유지한다 |

**Installation:**
```bash
npm i -D puppeteer-core@25.17.0 --save-exact
```

**Version verification:** `npm view puppeteer-core@25.17.0` 확인함. engines `node>=22.12.0`, repository `git+https://github.com/puppeteer/puppeteer.git`, 의존성 6개(ws, chromium-bidi, devtools-protocol, @puppeteer/browsers, typed-query-selector, webdriver-bidi-protocol), `scripts.postinstall` 없음, 생성 2018-08, 주간 다운로드 약 3252만(`puppeteer`는 약 1520만) [VERIFIED: npm registry, api.npmjs.org 2026-11-04~10]. `engines`가 `package.json`의 `>=22.22.0`과 충돌하지 않는다.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| puppeteer-core | npm | 약 8년(2018-08) | 약 3250만/주 | github.com/puppeteer/puppeteer | 실행하지 못함(pip 설치가 권한 정책으로 거부됨) | Approved (근거: 프로젝트 스택 문서 CLAUDE.md와 pptr.dev가 지정한 공식 패키지, `puppeteer`의 직접 의존성) |

**Packages removed due to slopcheck [SLOP] verdict:** 없음
**Packages flagged as suspicious [SUS]:** 없음. 다만 slopcheck를 못 돌렸으므로 `[ASSUMED]` 보수 규칙에 따라 설치 task 앞에 `checkpoint:human-verify` 한 줄을 두기를 권한다(`npm view puppeteer-core@25.17.0 scripts dist.integrity` 출력 확인이면 충분). `puppeteer-core`의 transitive 의존성 22개는 `npm i` 로그의 `found 0 vulnerabilities`로만 확인했다.

## Architecture Patterns

### System Architecture Diagram

```
 index.html (정적, 전화번호 없음)
      |                              +--------------------------+
      |  <head> inline: html.js      |  js/main.js (module)     |
      |-----------------------------> |  header hide/show        |
      |                              |  hamburger + overlay      |
      |   css/*.css (@layer)         |  current-section IO       |
      |   print.css --------+        |  keyword switch (rAF)     |
      v                     |        +--------------------------+
  Browser (screen)          |
                            |   npm run pdf:build  (tools/build-pdf.mjs)
                            |     1. read private/contact.json  -- missing/invalid --> exit 1 (no digits in message)
                            |     2. startStaticServer(root)  127.0.0.1:<ephemeral>
                            |     3. puppeteer-core.launch(channel:'chrome')
                            |     4. emulateMediaFeatures(reduce) -> goto -> emulateMediaType(print)
                            |     5. strip data-switch/data-hidden, strip loading=lazy + img.decode(), fonts.ready
                            |     6. page.evaluate(inject phone into [data-slot=phone])
                            |     7. page.pdf({preferCSSPageSize, printBackground, tagged, outline, waitForFonts})
                            v     8. write dist/퍼블리셔 유윤희-포트폴리오.pdf
                       pdf-report.mjs <pdf> --text --expect-phone --min-page-chars 80
                            (digits never printed; dist/ is gitignored and never scanned by check-repo)
```

### Recommended Project Structure
```
index.html                  # + cover-line spans, keywords-stage, nav-bars, main tabindex, 2 scripts
js/main.js                  # new, the only runtime JS
css/tokens.css              # + motion tokens, --color-overlay
css/components.css          # panel/overlay/hamburger, cover keyframes, keyword state styles
css/layout.css              # header transition, keyword track + sticky stage
css/base.css                # + smooth scroll under no-preference
css/print.css               # + page plan rules (below)
tools/build-pdf.mjs         # new
tools/check-ui.mjs          # new (Puppeteer, keyboard/motion/no-JS)
tools/contact.example.json  # new, committed, descriptive placeholders only
tools/pdf-report.mjs        # + --expect-phone, --min-page-chars
tools/check-layout.mjs      # fix anchor-offset check only
private/contact.json        # created by the executor later, gitignored
```

### Pattern 1: Puppeteer PDF build (verified end to end)
Key facts measured on this machine (Chrome 157.0.8103.27, puppeteer-core 25.17.0):
- Launch 1.7s, `page.pdf` 0.57s, whole build about 4s; output 132-148KB for the current page. [VERIFIED: run]
- Options accepted together with no error: `preferCSSPageSize`, `printBackground`, `tagged: true`, `outline: true`, `waitForFonts: true`, `displayHeaderFooter: false`. Result: `StructTreeRoot` present, `/Outlines` present, A4 MediaBox, TrueType only (Type3 0, FontFile2 2, BaseFont Pretendard-Regular/SemiBold). [VERIFIED: pdf-report]
- **Outline:** 24 bookmark entries = h1 (1) + h2 (7) + h3 (16). The visually-hidden `Keywords` h2 is not in the outline; everything else is. Titles decode to correct Hangul. [VERIFIED]
- **`tel:`:** an injected `<a href="tel:...">` becomes a `/Link` annotation with `/URI (tel:...)`. mailto 2, external 5 (all manifest links) stay. [VERIFIED]
- **`emulateMediaType('print')` before `goto` is lost** for `matchMedia('print')` (returned false), while `emulateMediaFeatures` reduced-motion survives. Calling `emulateMediaType('print')` **after** `goto` works (true, header `display:none`). `page.pdf` applies print CSS by itself, so the call only matters for in-page measurements. Call it after `goto`. [VERIFIED: run]
- **Lazy images:** before stripping, `img.complete` is false for off-screen lazy images; after `removeAttribute('loading')` + `await img.decode()` they are loaded. The PDF contains the images either way on Chrome 157 (Phase 2 finding reconfirmed), so stripping is a harmless belt-and-braces step. [VERIFIED: fixture]
- Chrome candidates: `channel:'chrome'` resolves the default install; `CHROME_PATH` env override for other locations. Missing Chrome gives `Could not find Google Chrome executable for channel 'chrome' at:`; catch it and print "Chrome not found. Install Chrome or set CHROME_PATH". [VERIFIED]

**Build script (verified prototype; adapt paths, keep structure):**
```js
// tools/build-pdf.mjs
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { startStaticServer } from './lib/static-server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const redact = (s) => String(s).replace(/\d/g, '#');           // every message passes through this
const die = (m) => { console.error(`build-pdf: ${redact(m)}`); process.exit(1); };

function loadPhone() {                                          // never echoes file content
  const file = join(ROOT, 'private', 'contact.json');
  if (!existsSync(file)) die('private/contact.json is missing. Copy tools/contact.example.json to private/contact.json and fill it in.');
  let phone;
  try { phone = JSON.parse(readFileSync(file, 'utf8')).phone; } catch { die('private/contact.json is not valid JSON (content not shown).'); }
  const d = phone?.display;
  const n = typeof d === 'string' ? d.replace(/\D/g, '').length : 0;
  if (typeof d !== 'string' || d.startsWith('<') || n < 9 || n > 13) die('private/contact.json: phone.display is empty, still a placeholder, or not phone-like (value not shown).');
  if (phone.label != null && typeof phone.label !== 'string') die('private/contact.json: phone.label must be a string.');
  return { label: phone.label || '', display: d, dial: d.replace(/[^\d+]/g, '') };
}

const phone = loadPhone();                                      // fail BEFORE any browser/server starts
mkdirSync(DIST, { recursive: true });
const out = join(DIST, '퍼블리셔 유윤희-포트폴리오.pdf');
let server; let browser;
try {
  server = await startStaticServer(ROOT);
  browser = await puppeteer.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }) });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);   // BEFORE goto: no entrance, no switch
  await page.goto(server.url, { waitUntil: 'networkidle0' });
  await page.emulateMediaType('print');                          // AFTER goto (it is lost otherwise)
  await page.evaluate(async () => {
    document.querySelectorAll('[data-switch],[data-hidden]').forEach((e) => { e.removeAttribute('data-switch'); e.removeAttribute('data-hidden'); });
    const imgs = [...document.images]; imgs.forEach((i) => i.removeAttribute('loading'));
    await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
    await document.fonts.ready;
  });
  const injected = await page.evaluate((p) => {
    const slot = document.querySelector('[data-slot="phone"]');
    if (!slot) return false;
    slot.replaceChildren();
    if (p.label) { const s = document.createElement('span'); s.className = 'contact-phone-label'; s.textContent = p.label; slot.append(s); }
    const a = document.createElement('a'); a.href = `tel:${p.dial}`; a.textContent = p.display; slot.append(a);
    slot.hidden = false;
    return true;
  }, phone);
  if (!injected) throw new Error('data-slot="phone" not found in index.html');   // throw, never process.exit inside try (see Pitfall 4)
  writeFileSync(out, await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true, outline: true, waitForFonts: true, displayHeaderFooter: false }));
  console.log('phone injected: yes');
} catch (e) {
  die(e?.message ?? 'unknown error');
} finally {
  await browser?.close().catch(() => {});
  await server?.close().catch(() => {});
}
// then: node tools/pdf-report.mjs out --text --expect-phone --min-page-chars 80   (spawnSync, inherit stdio, propagate exit code)
```
Test results of this script (fake number built at runtime, never written to a file in the repo): normal run exits 0 and prints only `phone injected: yes` plus counts (a grep for the fake string in the log found 0 hits); missing file, malformed JSON, and placeholder value each exit 1 with a digit-free message. [VERIFIED]

### Pattern 2: Contact file design (PDF-02, D-14)
- **Committed example:** `tools/contact.example.json` (kebab-case ASCII, passes `NAME_OK`, outside gitignored `private/`). `hasPhone()` and `hasPhoneAnywhere()` both return false on it [VERIFIED]:
```json
{
  "_readme": "Copy this file to private/contact.json (gitignored) and replace the two values. Never commit the real file.",
  "phone": {
    "label": "<optional label shown before the number, exactly as in the source contact line; empty string for none>",
    "display": "<the phone number exactly as the source contact line shows it>"
  }
}
```
- `display` is shown verbatim (D-15). The `tel:` href is derived by stripping everything except digits and `+`. The builder rejects values starting with `<` (still a placeholder) and values with fewer than 9 or more than 13 digits, **without echoing the value**.
- The slot structure injected: optional `span.contact-phone-label`, then `a[href^="tel:"]`. Add small print CSS for both (below). `contact.example.json` needs no `uiAllowlist` entry.
- **Leak paths closed:** `redact()` masks every digit in any message; the JSON parse error is replaced by a fixed sentence (Node 22 `JSON.parse` messages can include a snippet of the source for some syntax errors); the page console is not forwarded; no `dumpio`; no `--json` report contains the number (`pdf-report` only writes lengths/counts).
- **`check-repo` never scans `dist/`:** it scans `git ls-files --cached --others --exclude-standard`; `dist/` and `private/` are in `.gitignore`, and `FORBIDDEN` also rejects any tracked `dist/`/`private/`/`*.pdf` path. `git check-ignore -v` confirmed `private/contact.json` and `dist/퍼블리셔 유윤희-포트폴리오.pdf` are ignored. No change needed. [VERIFIED]

### Pattern 3: `pdf-report.mjs` submission mode (verified)
Add two flags; the default behavior ("phone must be absent") stays unchanged:
```js
// replace the existing phone guard block (inside the --text branch)
const phonePresent = hasPhone(full) || hasPhoneAnywhere(full);
if (flag('--expect-phone')) {
  const telDigits = uris.filter((u) => u.startsWith('tel:')).map((u) => u.replace(/\D/g, ''));
  const allDigits = full.replace(/\D/g, '');
  assert('submission: phone text present', phonePresent, phonePresent ? 'phone present: yes' : 'phone present: no');
  assert('submission: tel link matches text',
    telDigits.length === 1 && telDigits[0].length >= 9 && allDigits.includes(telDigits[0].replace(/^82/, '0')), `tel links ${telDigits.length}`);
} else {
  if (phonePresent) console.log('phone-like pattern found');
  assert('phone guard', !phonePresent);
}
const minChars = Number(opt('--min-page-chars') ?? 0);
if (minChars) {
  const footer = strip(manifest.footer);
  const thin = pageTexts.map((t, i) => [i + 1, strip(t)]).filter(([, t]) => t.length < minChars || t === footer);
  assert('no blank or footer-only page', thin.length === 0, thin.length ? `pages ${thin.map(([n]) => n).join(',')}` : `min ${Math.min(...pageTexts.map((t) => strip(t).length))} chars`);
  const last = strip(pageTexts.at(-1) || '');
  assert('last page holds contact and footer', last.includes(footer) && last.includes('Contact'));
}
```
Also add `'--min-page-chars'` to the argument-skip condition that finds the file argument (`args[i - 1] !== '--min-page-chars'`). Results: PDF with phone -> all PASS, exit 0, log has no digit run; PDF without phone in `--expect-phone` -> FAIL on both phone assertions; PDF with phone in default mode -> `phone guard` FAIL; the Phase 2 baseline (9 pages) with `--min-page-chars 80` -> FAIL (pages 4 and 9, the 9th being the footer-only orphan). [VERIFIED]
Remove/skip any code that prints page tails or heads of the last page when a phone may be present (the last page text contains the number).

### Pattern 4: A4 print page plan (verified, CSS goes into `css/print.css` inside `@layer print { @media print { ... } }`)
```css
.shot:not(:has(picture, img)) { display: none; }                 /* empty frames vanish; Phase 4 pictures appear automatically */
.cover { padding-block: 10mm; gap: 4mm; }
.keyword-block { padding-block: 4mm; }
#skills { break-before: page; }
#gi-data { break-before: page; }
.company > .eyebrow, .company > h2, .company > .period, .company > .company-desc { break-after: avoid; }
.company > .project-grid { break-before: avoid; }
#contact { break-inside: avoid; break-after: avoid; margin-block: 8mm 0; padding-block: 8mm; }
body > footer { break-before: avoid; padding-block: 6mm 0; }
/* skills + career must fit page 2 (the UI-SPEC rules alone leave 3 career rows on a near-empty page 3) */
main > section:not(.cover, .keywords, .company, #contact) { padding-block: 8mm; }
.skills { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4mm; margin-block-start: 5mm; }
.skills > div { padding: 4mm; }
.career { margin-block-start: 4mm; }
.career > li { grid-template-columns: 1.2fr 2fr auto; align-items: center; gap: 4mm; padding-block: 1mm; }
.career a { min-block-size: 0; }
.career .career-period { text-align: end; }
/* injected phone (label + link) */
.contact-phone-label { display: block; font-size: var(--text-label); font-weight: 600; color: var(--color-ink-3); }
.contact-phone a { color: var(--color-accent); text-decoration: underline; margin-block-start: 2mm; overflow-wrap: anywhere; }
/* JS-created / state elements never print */
.nav-overlay { display: none !important; }
.keyword-block, .cover-line, .cover-intro, .cover-mail { opacity: 1 !important; visibility: visible !important; }
.cover-line { display: block; }
```
**Measured result (current content, no screenshots):** 6 pages, 132KB.

| Page | Content | Chars |
|------|---------|-------|
| 1 | cover + 3 keyword blocks (cover 377px + keywords 524px of 1009px usable) | 210 |
| 2 | Skills + Career (395 + 253px) | 307 |
| 3 | 지아이데이타 (3 cards) + 케이엔큐레이션 heading and first 2 cards | 286 |
| 4 | 케이엔큐레이션 remaining 5 cards | 207 |
| 5 | 비스톤스 (2 cards) + 애비로드 (1 card) | 239 |
| 6 | Contact + footer (text 123 chars incl. phone) | 123 |

Baseline before the changes: 9 pages, page 9 = 37 chars (footer only), page 3 near-empty after the first CSS attempt (98 chars). `cards per page` pairs stayed matched on every page. [VERIFIED]
- **`break-*` in Chrome 157:** `break-before: page` on `#skills`/`#gi-data` works; `break-inside: avoid` on `.project`/`#contact`/`.keyword-block` works (no card split, blocks intact); `break-after: avoid` on headings and `break-before: avoid` on `.project-grid` work (a sweep of 20 top-margin values before `#bistones` never left a heading at a page bottom: MEDIUM, sweep was coarse); `body > footer { break-before: avoid }` kept the footer with the contact block. In the content stream the footer text is emitted before `#contact` text because `#contact` is positioned (`position: relative`): assert with `includes`, not order.
- **Why `#contact` is alone on page 6:** bistones (447px) + abbey-road (451px) + contact (239px) = 1137px > 1009px. Acceptable (PDF-03 lists contact as its own part). Phase 4 screenshots will lengthen cards; re-measure then. To force one company per page later, add `.company { break-before: page }` (one rule).
- Unit conversion for planning checks: A4 content box is 186 x 267 mm = about 703 x 1009 px at 96dpi (`@page` margin 14/12/16mm).

### Pattern 5: Header hide/show + hamburger (verified)
Behavior and thresholds follow UI-SPEC section 2/3. Measured on Chrome: header hides after scrolling down 300px (bottom -2px), stays hidden for a 5px up-scroll, shows after 20px up-scroll (bottom 72px), a scroll of 60px (< 80) does not hide, focusing a nav link while hidden restores it (bottom 72px, `data-hidden` removed). Menu open: header never hides while scrolled 360px. Reduced motion: header never hides. [VERIFIED]

Required CSS corrections to what UI-SPEC wrote:
- Hidden transform must be `translateY(calc(-100% - 2px))`, not `-100%`: `--shadow-header` is a 1px shadow below the box and would otherwise leave a hairline at the top edge [ASSUMED: geometry reasoning; my pixel probe could not distinguish the two renders, verify visually].
- `html.js .site-header { transition: transform var(--dur-header) var(--ease); }` and `.site-header[data-hidden="true"]:not(:focus-within) { transform: ... }` (the existing inert rule has no `:not(:focus-within)`).
- `.site-header` with a `transform` becomes the containing block of its absolutely positioned `.site-nav` panel: that is what we want. Do not put `position: fixed` children inside the header.

Hamburger icon (**UI-SPEC defect, fix required**): with `.nav-bars` as the middle bar and its `::before/::after` as the outer bars, `opacity:0` on `.nav-bars` also hides the pseudo-element bars (opacity applies to the whole subtree). Use this instead (verified visually: closed = three bars, open = X, middle bar opacity 0, outer bars `matrix(0.707, 0.707, ...)` rotations):
```css
@media (max-width: 899.98px) {
  html.js .nav-toggle::before,
  html.js .nav-toggle::after,
  html.js .nav-bars {            /* span = middle bar; button pseudos = top and bottom bars */
    content: ""; position: absolute; inset-inline-start: 11px; inline-size: 22px; block-size: 2px;
    background: currentcolor; transform-origin: center;
    transition: transform var(--dur) var(--ease), opacity var(--dur) var(--ease);
  }
  html.js .nav-toggle::before { inset-block-start: 14px; }
  html.js .nav-bars           { inset-block-start: 21px; }
  html.js .nav-toggle::after  { inset-block-start: 28px; }
  html.js .nav-toggle[aria-expanded="true"]::before { transform: translateY(7px) rotate(45deg); }
  html.js .nav-toggle[aria-expanded="true"]::after  { transform: translateY(-7px) rotate(-45deg); }
  html.js .nav-toggle[aria-expanded="true"] .nav-bars { opacity: 0; transform: scaleX(0); }
}
```
Panel and overlay CSS follow UI-SPEC section 3 exactly (absolute under the header, `opacity/transform/visibility` with `visibility 0s linear var(--dur)` on close, overlay `z-index: 40`). Verified: closed state `visibility:hidden` (Tab order skip -> toggle -> cover mail, panel links not focusable); open state Tab order `#keywords, #skills, #career, #contact` then on into `main`; Shift+Tab from Keywords returns to the toggle; Space and Enter both toggle; Esc closes and focuses the toggle; overlay click closes; link click closes and the anchor lands 80px below the top; resizing across 900px closes the panel; tabbing out of the header (5th Tab) closes it without moving focus. [VERIFIED]
Add `cursor: pointer` to `.nav-overlay` so iOS Safari delivers `click` on a non-interactive element [ASSUMED: known iOS quirk, not testable here].

### Pattern 6: Keyword sticky switch (verified, rAF scroll math)
Geometry confirmed at 1440 x 900: `.keywords[data-switch="on"]` height 2250px (`calc(100svh + 3 * 50svh)`), stage 900px, `getBoundingClientRect().top` of the stage stays 0 while pinned and goes to -650 after release. Active block by scroll offset p (px past track top): p=0 and 200 -> block 0; p=460 and 800 -> block 1; p=900, 1349, 2000 -> block 2; before the pin -> block 0; opacities settle to exactly [1,0,0]/[0,1,0]/[0,0,1] 700ms after each jump. [VERIFIED]

- **No `overflow` ancestor problem exists today:** computed `overflow` of every ancestor from `.keywords-stage` up to `<html>` is `visible`. Existing `overflow` rules are only `.shot`, the `html:not(.js) .site-nav ul` row (no-JS only), and `.visually-hidden` (a sibling, not an ancestor). The `.company { container: company / inline-size }` containment is on other sections, not on `.keywords`. Keep it that way (a regression guard is in `check-ui`). [VERIFIED]
- **IO vs scroll handler: use a passive scroll listener + `requestAnimationFrame` throttle that reads one `getBoundingClientRect()` per frame.** Reasons: (1) the same slot math is needed for the focus correction, so IO sentinels would duplicate geometry; (2) the state must be correct on initial load at an arbitrary scroll offset and after anchor jumps, which a threshold-crossing IO does not give without extra bookkeeping; (3) only writes on index change, no per-frame style writes. IO is still used for the current-section spy. The listener is attached only while the switch is on (`matchMedia` change attaches/detaches it).
- **Initial paint:** set `data-state` on the three blocks first, then `data-switch="on"` (prototype order) so the first paint has no transition.
- **Focus behavior (D-03) verified:** starting at the cover mail link, nine Tabs visit `kn-wecankids, kn-fsd, kn-greenda` (block 0), `gi-oneday, kn-universe, kn-fsd` (block 1), `gi-calculator, gi-oneday, kn-universe` (block 2). After each Tab the focused link's block has computed opacity 1, `data-active` equals that block's index, and the link is inside the viewport below the header. Tab 10 lands in `#career`. Shift+Tab from Career re-enters block 3 (active 2); four more Shift+Tab reach block 2 (active 1). This also passes with `html { scroll-behavior: smooth }` enabled: `scrollTo({top, behavior: 'instant'})` jumps at once even when CSS says smooth (y read back exactly 3000). [VERIFIED]
- **Screen reader friendliness:** inactive blocks are not `aria-hidden`, `inert`, `hidden` or `visibility:hidden`; a DOM check found zero such attributes inside `#keywords`. They keep `pointer-events: none` only. All three blocks are read in DOM order. [VERIFIED]
- **matchMedia on/off:** at 1440x900 `data-switch="on"`, 3 states set; at 900x900 and at 1440x500 `data-switch` and all `data-state` removed (static layout, height back to 940/1036); back at 1440x900 on again. [VERIFIED]

### Pattern 7: Cover entrance (verified)
- Opacity samples every 250ms after `domcontentloaded` for (line1, line2, line3, intro, mail): `[0,0,0,0,0] -> [0.9,0.6,0,0,0] -> [1,0.9,0.8,0.4,0] -> [1,1,1,1,0.8] -> [1,1,1,1,1]`: staggered rise, all 1 by about 1.1s. [VERIFIED]
- Set the stagger index without inline styles (html-validate's `no-inline-style` forbids `style=""`): `.cover-line:nth-child(2) { --i: 1 } .cover-line:nth-child(3) { --i: 2 }` (the spans are the h1's only element children, so `nth-child` works).
- The global `@media (prefers-reduced-motion: reduce)` rule (`animation: none !important`) is a second safety layer; with it the lines compute `animation-name: none`, opacity 1. [VERIFIED]

### Pattern 8: Scripts in `<head>` (Q5)
- **Inline script is fine for html-validate.** The prototype (inline `classList.add('js')` before the stylesheets + `<script type="module" src="js/main.js">` in `<head>` + `<main tabindex="-1">` + spans + wrapper div) passes `html-validate index.html` with the repo's `.htmlvalidate.json` (`recommended` + `a11y`): exit 0, no messages. An `onerror="..."` attribute on the module script also passed. `no-inline-style` only concerns `style=""`; `require-sri` applies to cross-origin external resources only. [VERIFIED]
- GitHub Pages cannot set CSP headers (CLAUDE.md), so an inline script has no policy conflict. [CITED: CLAUDE.md]
- Module scripts are deferred, so `main.js` alone would add `js` after first paint and the cover would flash visible, hide, then animate. The one-statement inline script before the stylesheets prevents that. [CITED: HTML Living Standard module script semantics]
- **Risk to note for the planner:** `html.js` also enables the hamburger and hides `.site-nav` below 900px. If `main.js` fails to load or throws, a mobile user gets a dead hamburger. Mitigation chosen: keep `main.js` tiny and dependency-free; optionally add `onerror="document.documentElement.classList.remove('js')"` on the module script (handles a 404/network failure, not a syntax error; html-validate accepted it). Cover content is never hidden in that case because the keyframes use `fill-mode: both`.

### Anti-Patterns to Avoid
- `process.exit()` inside the `try` that owns the browser (Pitfall 4).
- `emulateMediaType('print')` before `goto` (lost).
- `opacity` on a parent that owns the pseudo-element bars (hamburger).
- Printing page text, heads/tails, or the phone value anywhere in the build or report output.
- `behavior: 'smooth'` (or the CSS default) for the focus-correction scroll.
- Adding `aria-hidden`, `inert`, `hidden` or `visibility:hidden` to inactive keyword blocks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction/validation | New parser | Existing `tools/pdf-report.mjs` + two flags | Already handles Skia ToUnicode CMaps, links, fonts; only the phone mode and page-size check are new |
| Local server for the build | `file://` or a new server | `tools/lib/static-server.mjs` | Already hardened (denylist includes `private/`, `dist/`) |
| Phone detection | New regex | `hasPhone`/`hasPhoneAnywhere` from `check-repo.mjs` | Already handles separators, entities, split runs; reused for the inverse assertion |
| Browser lookup | Hard-coded Chrome path list | `channel: 'chrome'` (+ `CHROME_PATH`) | Puppeteer resolves the Windows install locations |
| Keyboard automation | Raw CDP `Input.dispatchKeyEvent` | `page.keyboard.press('Tab')`, `createBrowserContext`, `setJavaScriptEnabled` | Short, reliable, verified |
| Page-by-page PDF text | `pdftotext` | `pdf-report` `textPages` JSON | Not installed; the existing extraction works |

**Key insight:** every piece of the PDF pipeline already exists as a hardened local tool; Phase 3 adds one builder plus two flags, not new parsers.

## Runtime State Inventory
Not a rename/refactor phase: omitted.

## Common Pitfalls

### Pitfall 1: `emulateMediaType('print')` before navigation is dropped
**What goes wrong:** `matchMedia('print').matches` is false after `goto`; reduced-motion emulation survives. **Why:** emulation set on a fresh `about:blank` target is not retained across the cross-origin navigation to the local server. **Avoid:** call after `goto` (re-emulating after navigation returned true and applied print CSS). `page.pdf` uses print CSS regardless, so only in-page measurements are affected. **Warning sign:** header `display` is not `none` in a pre-pdf evaluate.

### Pitfall 2: UI-SPEC hamburger puts the outer bars under the faded bar
**What goes wrong:** the X icon would show nothing (all bars vanish). **Avoid:** use the pseudo-element ownership in Pattern 5. **Warning sign:** the open icon screenshot is empty.

### Pitfall 3: Phase 3 header hiding breaks `check-layout.mjs` anchor checks
**What goes wrong:** the check measures `target.top - header.getBoundingClientRect().bottom`. After an anchor jump scrolls down, the header hides (bottom = -2), so every anchor case fails with a delta of 81-90px at all four widths (24 FAILs reproduced on the prototype; every other check passed). **Avoid:** in `jump()` read the nominal height `parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))` (64/72/112 depending on state) instead of the live rect, and keep the `[-0.5, 32.5]` window (measured delta is 16px by design: `scroll-margin-top: 16px`). Also note `scroll-padding-top` is `var(--header-h)` (64/72px), not the fixed 80px that UI-SPEC text mentions; the 80px value is only the JS hide threshold.

### Pitfall 4: orphaned Chrome after a failed build
**What goes wrong:** `process.exit(1)` inside the `try` skips `finally`, leaving headless Chrome running (and a temp profile). **Avoid:** `die()` only before the browser starts and in the top-level `catch`; use `throw` inside the `try`. Kill only your own browser: `browser.close()` in `finally` closes the process tree; do not match by process name. (During this research a name-pattern kill also matched unrelated `bash.exe` processes; match on image name `chrome.exe|msedge.exe` plus the profile tag, as `check-layout.mjs` does.)

### Pitfall 5: error messages and JSON parse snippets leak the number
**What goes wrong:** `JSON.parse` errors, Puppeteer errors and stack traces can include file or argument text. **Avoid:** fixed sentences for file problems, `redact()` on every printed message, no `console` forwarding, never log `phone`. The no-leak test greps the combined stdout/stderr for the fake value and for any 4-digit run.

### Pitfall 6: the footer-only orphan comes back when content changes
**What goes wrong:** Phase 4 screenshots lengthen the cards; contact may split away or a company page may end up nearly empty. **Avoid:** keep the `--min-page-chars 80` and "last page holds contact and footer" assertions in the build; the char threshold catches blank/footer-only pages but not "mostly empty" pages, so re-measure page count after Phase 4 (expected 6-9 pages).

### Pitfall 7: `check-repo` phone regex vs JS numeric arrays
`PHONE_CORE` matches `0`,`1`,`[016789]` followed by 7-8 digits with up to 4 non-alphanumeric separators each, so a literal such as `[0, 1, 0, 0, 0, ...]` in `main.js` would be flagged. The prototype `main.js`, all CSS and `index.html` pass (`hasPhone` false). Run `npm run check:repo` after writing `main.js`; keep thresholds as named constants.

### Pitfall 8: sticky keyword stage needs `100svh`, a clean ancestor chain, and no stage `overflow`
Verified clean today. A regression guard in `check-ui` (computed `overflow` of all ancestors up to `html` is `visible`, stage `position: sticky`) is cheap and prevents silent breakage when someone adds `overflow-x: clip` to `main` or `body` for a mobile overflow fix.

### Pitfall 9: the panel's `visibility` flip must be delayed on close and immediate on open
Open state sets a `transition` list without `visibility` (so it flips at once); closed state lists `visibility 0s linear var(--dur)`. If the delay is omitted the fade-out is cut; if it is applied on open the links are unfocusable for 200ms and Enter-then-Tab fails.

### Pitfall 10: Edge under Puppeteer
Do not try `channel: 'msedge'` or Edge `executablePath` in the builder: both failed here (launch error, or a hang that required killing the process tree). The Edge CLI preview script `spike-pdf.mjs` still works and stays.

### Pitfall 11: iOS/Safari items not verifiable here
`scrollTo({behavior:'instant'})` (Safari 15.4+), `svh` (15.4+), `matchMedia(...).addEventListener('change')` (14+), `:focus-within`, `:has()` (15.4+) are all within the project's Safari floor, but none was run in Safari: [ASSUMED]. Phase 5 cross-browser check should cover keyword focus correction and the overlay tap on a real iOS device.

## Code Examples

### `js/main.js` (verified prototype, condensed comments)
```js
const root = document.documentElement;
root.classList.add('js');
const header = document.querySelector('.site-header');
const toggle = header.querySelector('.nav-toggle');
const nav = header.querySelector('.site-nav');
const mqWide = matchMedia('(min-width: 900px)');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

/* hamburger */
const overlay = document.createElement('div');
overlay.className = 'nav-overlay';
overlay.setAttribute('aria-hidden', 'true');
document.body.append(overlay);
const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  for (const el of [nav, overlay]) open ? el.setAttribute('data-open', 'true') : el.removeAttribute('data-open');
  if (open) showHeader();
}
toggle.addEventListener('click', () => setMenu(!isOpen()));
overlay.addEventListener('click', () => { const had = header.contains(document.activeElement); setMenu(false); if (had) toggle.focus(); });
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); } });
document.addEventListener('focusin', (e) => { if (isOpen() && !header.contains(e.target)) setMenu(false); });
mqWide.addEventListener('change', () => { if (mqWide.matches) setMenu(false); });

/* header hide / show */
const HIDE_AFTER = 80, DELTA = 8;
let lastY = scrollY, dir = 0, acc = 0, ticking = false;
function showHeader() { header.removeAttribute('data-hidden'); }
function hideHeader() { if (isOpen() || mqReduce.matches || header.matches(':focus-within')) return; header.setAttribute('data-hidden', 'true'); }
function onScrollFrame() {
  ticking = false;
  const y = scrollY, max = root.scrollHeight - innerHeight;
  if (y < 0 || y > max) { lastY = Math.min(Math.max(y, 0), max); return; }   // iOS rubber-band
  const d = y - lastY; lastY = y;
  if (y <= HIDE_AFTER) { showHeader(); dir = 0; acc = 0; return; }
  if (!d) return;
  const nd = Math.sign(d);
  if (nd !== dir) { dir = nd; acc = 0; }
  acc += Math.abs(d);
  if (acc < DELTA) return;
  dir > 0 ? hideHeader() : showHeader();
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); } }, { passive: true });
header.addEventListener('focusin', showHeader);
mqReduce.addEventListener('change', () => { if (mqReduce.matches) showHeader(); });

/* current section (IntersectionObserver, band at 40-45% of the viewport) */
const links = new Map([...nav.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
const ownerOf = (id) => (['gi-data', 'kn-curation', 'bistones', 'abbey-road'].includes(id) ? 'career' : id);
const spy = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    const key = ownerOf(en.target.id);
    for (const [id, a] of links) id === key ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
  }
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => spy.observe(s));   // #cover is observed too: it clears the highlight? (see note)

/* keyword scroll switch */
const kw = document.querySelector('#keywords');
const stage = kw.querySelector('.keywords-stage');
const blocks = [...kw.querySelectorAll('.keyword-block')];
const mqSwitch = matchMedia('(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');
let active = -1, switching = false, frame = 0;
const slotSize = () => (kw.offsetHeight - stage.offsetHeight) / blocks.length;
const scrollIndex = () => Math.min(blocks.length - 1, Math.max(0, Math.floor(-kw.getBoundingClientRect().top / slotSize())));
function setActive(i) {
  if (i === active) return;
  active = i; kw.dataset.active = String(i);
  blocks.forEach((b, j) => { b.dataset.state = j < i ? 'past' : j > i ? 'next' : 'active'; });
}
const onKwScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; setActive(scrollIndex()); }); };
function onKwFocus(e) {
  const i = blocks.indexOf(e.target.closest('.keyword-block'));
  if (i < 0) return;
  if (i !== scrollIndex()) scrollTo({ top: scrollY + kw.getBoundingClientRect().top + (i + 0.5) * slotSize(), behavior: 'instant' });
  setActive(i);
}
function enableSwitch() { if (switching) return; switching = true; setActive(scrollIndex()); kw.dataset.switch = 'on'; addEventListener('scroll', onKwScroll, { passive: true }); kw.addEventListener('focusin', onKwFocus); }
function disableSwitch() { if (!switching) return; switching = false; removeEventListener('scroll', onKwScroll); kw.removeEventListener('focusin', onKwFocus); delete kw.dataset.switch; delete kw.dataset.active; blocks.forEach((b) => delete b.dataset.state); active = -1; }
const syncSwitch = () => (mqSwitch.matches ? enableSwitch() : disableSwitch());
mqSwitch.addEventListener('change', syncSwitch);
syncSwitch();
```
Notes: (a) the prototype observed only `main > section[id]`; `#cover` is one of them, and since it maps to no nav link (`links.get('cover')` is undefined) every link loses `aria-current` while the cover is in the band, which is the intended "cover maps to none". (b) `scroll` listener and `focusin` run only while `switching`. (c) `main.js` contains no `0,1,0,...`-style digit lists (check-repo clean).

### Motion CSS shapes (verified; layer placement per UI-SPEC)
```css
/* tokens */
--dur-header: 250ms; --dur-switch: 500ms; --dur-enter: 600ms; --stagger-enter: 150ms; --stagger-switch: 80ms; --color-overlay: rgb(17 24 39 / 0.32);

/* components: cover */
@keyframes cover-rise { from { opacity: 0; transform: translateY(var(--rise, var(--space-lg))); } to { opacity: 1; transform: none; } }
.cover-line { display: block; }
.cover-line:nth-child(2) { --i: 1; } .cover-line:nth-child(3) { --i: 2; }
@media screen and (prefers-reduced-motion: no-preference) {
  html.js .cover-line { animation: cover-rise var(--dur-enter) var(--ease) both; animation-delay: calc(var(--i, 0) * var(--stagger-enter)); }
  html.js .cover-intro, html.js .cover-mail { --rise: var(--space-md); animation: cover-rise var(--dur-switch) var(--ease) both; }
  html.js .cover-intro { animation-delay: 450ms; } html.js .cover-mail { animation-delay: 600ms; }
}

/* layout: keyword switch geometry (all inside the one gated media query) */
@media screen and (min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference) {
  .keywords[data-switch="on"] { block-size: calc(100svh + 3 * 50svh); padding-block: 0; }
  .keywords[data-switch="on"] .keywords-stage { position: sticky; inset-block-start: 0; block-size: 100svh; display: grid; grid-template-rows: auto 1fr; }
  .keywords[data-switch="on"] .keywords-stage > .eyebrow { padding-block-start: calc(var(--header-h) + var(--space-md)); }
  .keywords[data-switch="on"] .keyword-block { grid-area: 2 / 1; align-self: center; padding-block: 0; border-block-start: 0; }
}
/* components: states + list delay (list delay: .keyword-list in [data-state="active"] gets transition-delay var(--stagger-switch)) */
```
The eyebrow gets header-height top padding so it is not under the 72px bar when the header is shown (the stage pins at `top: 0`). Specificity: `.keywords[data-switch] .keyword-block` (0,3,0) beats the layout `& + &` divider and the desktop `padding-block`.

### Checks: keyboard/motion automation skeleton (Puppeteer, verified)
```js
const ctx = await browser.createBrowserContext();     // fresh state per scenario
const page = await ctx.newPage();
await page.setJavaScriptEnabled(false);               // no-JS scenario
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.keyboard.press('Tab');                     // Shift+Tab: keyboard.down('Shift'); press('Tab'); up('Shift')
await page.evaluate(() => document.activeElement.id); // skip link -> 'main' after Enter
```
Observed in the verified suite (about 43s, 45 assertions): closed/open/Esc/overlay/link/resize hamburger; header 80/8px rules; focusin reveal; skip link focuses `main`; cover samples; keyword positions p=0..2000; nine-Tab keyword walk plus Shift+Tab back; no `aria-hidden/inert/hidden` in `#keywords`; ancestor overflow guard; reduced-motion (no switch, no animation, opacity 1, header never hides); no JS at 1440 and 375 (no `js` class, every `body *` opacity exactly 1, toggle `display:none`, nav `visibility:visible`, header 72px / 112px, all keyword blocks have height).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `puppeteer` downloads Chrome for Testing (~170MB) | `puppeteer-core` + system Chrome via `channel` | Puppeteer long-standing | 32MB devDependency, no postinstall |
| Edge CLI `--print-to-pdf` | Puppeteer `page.pdf` with `outline`, `tagged`, `waitForFonts` | Phase 2 recommendation | bookmarks, injection, deterministic waits |
| `scroll-behavior` forcing smooth on programmatic scrolls | `behavior: 'instant'` override | CSSOM View | focus correction never animates |

**Deprecated/outdated:** `check-layout` anchor check using the live header rect (breaks once the header can hide).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `translateY(-100%)` leaves a 1px hairline from `--shadow-header`, so `calc(-100% - 2px)` is needed | Pattern 5 | Cosmetic only; the extra 2px is harmless either way |
| A2 | iOS Safari needs `cursor: pointer` for overlay `click` | Pattern 5 | Overlay tap-to-close might not fire on iOS; Phase 5 device check |
| A3 | Safari/iOS behave like Chrome for `scrollTo({behavior:'instant'})`, sticky + `svh`, `:focus-within` | Pitfall 11 | Keyword focus correction might misbehave on Safari; verify in Phase 5 |
| A4 | `puppeteer-core` is clean (slopcheck was not run; pip install was denied) | Package Legitimacy Audit | Low; same release as the stack document's package, 3250만 weekly downloads, no postinstall. Planner may add one human-verify step |
| A5 | Page count stays 6-9 after Phase 4 screenshots | Pitfall 6 | Contact/footer page could split; the build assertions catch footer-only and blank pages |

## Open Questions (RESOLVED)

1. **Does the user want one company per page once screenshots exist?**
   - What we know: with empty frames hidden, flow-after-forced-break gives 6 pages; forcing `break-before: page` on all four companies would give about 8 pages with the abbey-road page holding a single card.
   - What's unclear: whether the "회사별" look matters more than page economy.
   - Recommendation: keep the flow layout now; decide in Phase 4 with real screenshot heights (one-line CSS change).
   - RESOLVED: 03-02-PLAN Task 2 implements the flow layout (`#skills` and `#gi-data` forced breaks only, no `.company { break-before: page }`). The one-company-per-page decision is deferred to Phase 4, when real screenshot heights are known.
2. **Contact label text:** the original contact line may carry a label before the number (the executor sees the source; this research never read it). If it does, put it in `phone.label`; if it is part of the same string, leave `label` empty. Recommendation: executor decides when creating `private/contact.json`.
   - RESOLVED: 03-01-PLAN Task 2 step E. The executor's no-echo extraction script splits the source contact line into `phone.label` (text before the number; empty if it holds `@` or digits) and `phone.display` (the number as shown). Only digit-masked shapes are printed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | yes | 22.23.4 | none needed |
| Google Chrome | `build-pdf`, `check-ui` | yes (default install path) | 157.0.8103.27 | set `CHROME_PATH` |
| Microsoft Edge | `check-layout` (existing), `spike-pdf` | yes | 157.0.4341.42 | not usable under Puppeteer |
| `puppeteer-core` | build, check-ui | not installed in repo yet (installed 32MB in scratchpad) | 25.17.0 | none |
| Chrome for Testing (170MB) | not needed | no, and it must not be downloaded | - | use installed Chrome |
| `slopcheck` / `pdffonts` / `pdftotext` | audit | not available | - | `pdf-report.mjs` covers fonts and text |
| Dev server on :3000 | user's | running, left untouched | - | experiments used ephemeral ports |

**Missing dependencies with no fallback:** none. **Leftover:** five `puppeteer_dev_chrome_profile-*` temp directories remain under `%TEMP%` from experiments (a cleanup command was refused by the permission policy); harmless, deletable by the user.

## Testing Approach (workflow.nyquist_validation is false: no Validation Architecture section)

- **Recommendation:** new `tools/check-ui.mjs` (Puppeteer, Chrome) for keyboard, motion, reduced-motion and no-JS; keep `check-layout.mjs` (CDP, zero-dependency, Edge-first) for geometry and patch only the anchor-offset header measurement (Pitfall 3). Do not migrate `check-layout`: the migration costs Edge coverage and gains nothing.
- Reuse one shared helper for launching Chrome, ephemeral static server, and teardown (`finally { browser.close(); server.close(); }`, own-profile-tag cleanup if a hard kill is ever needed).
- Commands: `npm run pdf:build` (builder, then `pdf-report --text --expect-phone --min-page-chars 80`), `npm run check:ui`, `npm run check:layout`, existing `npm run check`. `check-ui` and `pdf:build` need a local Chrome and `private/contact.json`, so keep them out of the pre-commit hook and out of `npm run check`'s default chain (like `check:layout` today).
- Requirement map: DSGN-03 -> reduced-motion/no-JS/cover samples; DSGN-05 -> keyword positions, matchMedia toggle, focus walk; QUAL-02 -> skip link, Tab order, Esc, header reveal, focus ring visible (screenshot or `:focus-visible` outline-width check); PDF-01..04 -> `pdf:build` plus `pdf-report` flags (pages, TrueType, tel/mailto/external link annotations, no path in text, per-page minimum characters, outline count 24).
- Also run in the check: nothing may compute `opacity` other than 1 under JS-off/reduced/print; `data-switch` absent at 1023 and at height < 560.

## Content-check impact (Q7)

Verified by running the real `check-content.mjs` against the prototype `index.html` (copy outside the repo): **all runnable checks pass unchanged**.
- `<br>` -> `.cover-line` spans: `textNodesIn(h1)` still returns `["Publishing,","beyond the","expected."]` (whitespace-only text nodes between spans collapse to empty and are filtered), so the `hero` check and the `headings` check (one h1) pass. The PDF/accessibility title of the h1 also gains the spaces ("Publishing, beyond the expected.") instead of the run-together text seen in the Phase 2 outline.
- `.keywords-stage` wrapper: the `keywords` check finds blocks with `elsIn(sec, 'div')` (descendant search), so the extra `div` does not break it; the `sections` check only looks at direct `main > section` children.
- `main tabindex="-1"`, `.nav-bars` span (no text), inline script, module script (scripts are stripped by the parser before checks): no effect. The `.nav-bars` span has `aria-hidden="true"`, so `visibleTexts` ignores it anyway.
- 3 source-dependent checks showed as SKIP in my copy because `.planning/source` is not present there (I did not read it). They compare text, and no new visible text is added, so none should change; the executor must still run `npm run check:source` on the machine that has the source.
- `js/main.js` is not scanned by `check-content`; `check-repo` scans it (clean, see Pitfall 7). `html-validate` only validates `index.html` (`npm run validate`).
- Recommended small additions (not required): a `check-content` assertion that `#cover-title` has exactly three `.cover-line` spans and that `section#keywords` contains one `.keywords-stage`.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2/V3 Authentication/Session | no | static site |
| V4 Access Control | yes (data exposure) | `private/` and `dist/` gitignored, denied by the static server, `check-repo` + hooks |
| V5 Input Validation | yes (builder reads a local JSON) | schema checks, fixed error strings, `redact()` |
| V6 Cryptography | no | - |
| V8 Data Protection | yes | phone only in `private/` and the gitignored PDF, never in logs/HTML |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Phone leaks through logs/errors/JSON parse snippets | Information disclosure | no echo, `redact()`, no console/dumpio forwarding |
| Phone committed via the example file | Information disclosure | descriptive placeholders only; `check-repo` self-check on the file (`hasPhone` false) |
| Generated PDF committed | Information disclosure | `dist/` and `*.pdf` ignored; `FORBIDDEN` blocks tracked `.pdf`/`dist/` |
| Builder serves private files to the browser | Information disclosure | static server denylist (`private`, `dist`, `.planning`, dotfolders) |
| Supply-chain (new package) | Tampering | exact version pin, no postinstall, `npm view` check, one human-verify step |

## Sources

### Primary (HIGH confidence)
- Local execution, 2026-11-11: puppeteer-core 25.17.0 + Chrome 157.0.8103.27 (build, pdf, outline, tag, media emulation, lazy fixture, keyboard/motion suite, no-JS, reduced-motion, html-validate 11.21.0, `check-layout.mjs` against the prototype, `check-content.mjs` against the prototype, pdf-report modes).
- `npm view puppeteer@25.17.0`, `npm view puppeteer-core@25.17.0` (engines, repository, dependencies, scripts) and api.npmjs.org weekly downloads.
- Repo files read: `index.html`, `css/*.css`, `tools/*.mjs`, `03-CONTEXT.md`, `03-UI-SPEC.md`, `02-PDF-SPIKE.md`, `02-REVIEW-FIX.md`, `CLAUDE.md`.

### Secondary (MEDIUM confidence)
- pptr.dev PDF options (as cited by CLAUDE.md), HTML Living Standard module-script deferral.

### Tertiary (LOW confidence)
- Safari/iOS behavior (Pitfall 11, A2, A3): not tested.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - installed and run; slopcheck not available (A4).
- Architecture: HIGH - prototype passes the suite; Safari unverified.
- Pitfalls: HIGH for Chrome-observed ones (1, 2, 3, 4, 8, 10), MEDIUM for 6 and the orphan-heading sweep.

**Research date:** 2026-11-11
**Valid until:** 2026-12-11 (Chrome/Puppeteer move monthly; re-check `npm view puppeteer-core version` and Chrome major before executing)
