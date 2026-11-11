# Phase 3: 인터랙션과 제출용 PDF - Context

**Gathered:** 2026-11-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2에서 디자인을 입힌 `index.html`에 절제된 움직임과 키보드 접근성을 더한다. 대상은 표지 진입, 헤더 숨김/표시, 햄버거 메뉴, 키워드 스크롤 전환이다. 그리고 명령 하나로 전화번호가 들어간 제출용 A4 PDF를 만든다.

이 phase의 요구사항은 DSGN-03, DSGN-05(전환 동작), QUAL-02, PDF-01~PDF-04다. 실제 스크린샷(SHOT-*)과 PDF 용량 목표(PDF-05)는 Phase 4에서 다룬다.

</domain>

<decisions>
## Implementation Decisions

### 이전 phase에서 이미 정한 것 (다시 묻지 않음)
- 상단 메뉴는 fixed다. 아래로 스크롤하면 숨고, 위로 스크롤하면 스르륵 다시 나타난다(02 D-15).
- 모바일은 햄버거 메뉴다(02 D-15).
- 키워드 섹션은 스크롤하면 반응형 웹 → 인터랙션 → AI 활용 순서로 하나씩 바뀐다. 데스크톱에서만 이렇게 동작하고, JS가 없거나 reduced-motion이거나 모바일이거나 PDF일 때는 세 덩어리를 모두 펼쳐 보여 준다(02 D-11).
- 제출용 PDF는 A4 세로다. 9쪽 안팎이어도 괜찮고, 2~3쪽으로 줄일 필요는 없다(02 D-17, 02-06 사용자 검토).
- Phase 2 PDF spike에서 권고한 대로 Puppeteer 25로 올린다. Edge CLI 스크립트는 미리보기용으로 남긴다(02-PDF-SPIKE.md).
- no-JS 상태의 헤더와 메뉴는 `html:not(.js)`로 처리한다. Phase 3에서 JS가 `.js` 클래스를 붙이고 동작을 더한다(02 RESEARCH, UI-SPEC).

### 키워드 전환
- **D-01:** 키워드가 바뀔 때는 이전 키워드가 위로 사라지고 새 키워드가 아래에서 위로 스르륵 올라온다. 오른쪽 프로젝트 리스트도 같은 방향으로 함께 바뀐다. `transform`과 `opacity`만 움직인다.
- **D-02:** 지금 몇 번째 키워드인지 따로 표시하지 않는다. 번호나 점 같은 진행 표시가 없다.
- **D-03:** 키워드는 스크롤로만 바뀐다. 클릭해서 바꾸는 탭은 만들지 않는다.
  - 키보드 사용자를 막으면 안 된다. 화면에 보이지 않는 키워드의 프로젝트 링크도 Tab으로 갈 수 있어야 하고, 포커스가 들어가면 그 키워드가 보이는 위치로 바뀌어야 한다. 구현 방식은 Claude 재량이다.
- **D-04:** 머무는 길이는 짧게 한다. 키워드 하나당 화면 높이의 절반 정도로, 세 키워드를 합쳐 약 1.5화면 스크롤이면 다음 섹션으로 넘어간다.
- **D-05:** 구현은 sticky 섹션에 IntersectionObserver나 스크롤 위치를 쓰고, 상태 클래스만 바꾼다. `animation-timeline`은 iOS 18 이하에서 지원되지 않으므로, 쓴다면 `@supports` 안에서 점진적 향상으로만 쓴다. design-taste 기준으로 이 섹션이 "dealt moment" 1개다.

### 표지 진입
- **D-06:** "Publishing, / beyond the / expected." 세 줄이 아래에서 살짝 올라오며 차례로 나타난다. 전체 1초 안팎이다. 나머지 표지 요소(보조 문구, 소개, 이메일)는 그 뒤에 짧게 나타나거나 처음부터 보이게 한다(Claude 재량).
- **D-07:** 처음에 숨기는 `opacity: 0` 상태는 `html.js`일 때만 적용한다. JS가 없거나, reduced-motion이거나, PDF에서는 처음부터 다 보인다. 그 밖의 모션은 hover뿐이다(DSGN-03).

### 햄버거 메뉴 (900px 미만)
- **D-08:** 햄버거를 누르면 헤더 바로 아래로 메뉴 목록이 펼쳐지는 패널이 열린다. 본문에는 살짝 어두운 오버레이를 깐다.
- **D-09:** 버튼은 세 줄 아이콘이고, 열리면 X로 바뀐다. 접근 가능한 이름은 "메뉴"이고 `aria-expanded`를 쓴다.
- **D-10:** 키보드 동작:
  - Esc를 누르면 메뉴가 닫히고 포커스가 버튼으로 돌아간다.
  - 메뉴 항목을 누르면 메뉴가 닫히고 해당 섹션으로 이동한다.
  - 메뉴가 열려 있는 동안 Tab 순서가 자연스러워야 한다.
  - 오버레이를 누르면 메뉴가 닫힌다.
- **D-11:** 헤더가 숨어 있을 때 포커스가 헤더 안으로 들어오면 헤더가 다시 보여야 한다. 메뉴가 열려 있는 동안에는 헤더가 숨지 않는다.

### 연락처와 제출용 PDF
- **D-12:** PDF 파일 이름은 `퍼블리셔 유윤희-포트폴리오.pdf`이고, `dist/`에 만든다(gitignore). 저장소 파일명 규칙(ASCII kebab-case)은 저장소에 커밋되는 파일에만 적용된다. dist 출력물에는 적용되지 않는다.
- **D-13:** PDF 연락처에서 전화번호는 `tel:` 링크다. 이메일 `mailto:`와 같은 방식이다. 공개 `index.html`과 웹에는 여전히 `tel:`도 번호도 없고, 빈 `data-slot="phone"`만 있다. 이 슬롯은 PDF를 만들 때 Puppeteer가 페이지 안에서만 채운다.
- **D-14:** 전화번호는 Claude가 원본 PDF 텍스트(`.planning/source/portfolio-pdf.txt`, gitignore)에서 `private/contact.json`(gitignore)으로 옮겨 만든다.
  - 번호는 채팅, 커밋, 공개 파일, 로그 어디에도 출력하지 않는다.
  - 저장소에는 형식만 보여 주는 커밋 가능한 예시 파일(예: `contact.example.json`)을 둔다. phone 값에는 숫자 자리표시가 아니라 설명 문자열만 넣는다. `private/`는 gitignore라서 예시 파일은 그 밖에 둔다. 정확한 이름과 위치는 Claude 재량이고, 전화번호 검사에 걸리지 않아야 한다.
  - `private/contact.json`이 없으면 PDF 빌드는 실패한다(PDF-02).
- **D-15:** 표시 형식은 원본 PDF 연락처 줄의 형식을 그대로 따른다(01 CONTEXT의 연락처 결정). 빌드 로그와 검사 결과에는 번호 대신 "phone injected: yes"처럼 숫자 없는 결과만 남긴다.

### Claude's Discretion
- 제출용 PDF의 쪽 구성. 사용자가 이번에 따로 정하지 않았다.
  - 빈 스크린샷 자리는 Phase 4 전까지 PDF에서 숨기거나 작게 한다.
  - 회사별로 쪽을 나눌지 정한다.
  - 마지막에 푸터만 남는 고아 쪽은 없앤다(PDF-03 "빈 페이지 없음").
  - 키워드 섹션은 펼친 상태로 넣는다.
  - PDF-03의 "표지 / 스킬·경력 / 회사별 / 연락처" 구성을 만족해야 한다.
- 표지 보조 요소의 진입 방식, 이징과 지속 시간, 헤더 숨김 임계값(몇 px 스크롤 후)
- 키워드 전환에서 숨겨진 리스트의 포커스와 스크린리더 처리 방식(D-03 조건 충족)
- `scroll-behavior: smooth` 사용 여부. 쓴다면 reduced-motion일 때 끈다.
- Puppeteer PDF 옵션(`outline`, `tagged`, `waitForFonts`, `preferCSSPageSize`)과 `loading="lazy"` 제거 처리

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 프로젝트 기준
- `.planning/PROJECT.md`: 제약(순수 HTML/CSS/JS, 웹에는 이메일만, 원본에 없는 사실 금지)
- `.planning/REQUIREMENTS.md`: DSGN-03, DSGN-05, QUAL-02, PDF-01~PDF-04 (PDF-05는 Phase 4)
- `.planning/ROADMAP.md`: Phase 3 success criteria 1~5
- `./CLAUDE.md`: 모션 규칙(transform/opacity만, `html.js`에서만 숨김, reduced-motion·print에서 끔), Puppeteer 25.17.0 PDF 옵션, 폰트(print는 static TTF)

### 이전 phase 결과물
- `.planning/phases/02-pdf-spike/02-CONTEXT.md`: D-11(키워드 전환), D-15/D-16(헤더·햄버거), D-17~D-19(PDF)
- `.planning/phases/02-pdf-spike/02-UI-SPEC.md`: 토큰, 헤더·햄버거·키워드 컴포넌트 계약, print 규칙, 모션 지속 시간 규칙
- `.planning/phases/02-pdf-spike/02-PDF-SPIKE.md`: 측정값(9쪽, TrueType, Type3 0), Puppeteer 승격 권고, lazy 이미지 권고
- `.planning/phases/02-pdf-spike/02-CHECKS.md`, `02-VERIFICATION.md`, `02-REVIEW-FIX.md`: 검사 도구 현황
- `.planning/phases/01-foundation-content/01-CONTEXT.md`: 연락처 줄 결정(원본 그대로, 빈 phone 슬롯)
- `index.html`, `css/*.css`, `tools/check-layout.mjs`, `tools/spike-pdf.mjs`, `tools/pdf-report.mjs`, `tools/lib/static-server.mjs`, `tools/check-content.mjs`

### 디자인 규칙
- `~/.claude/skills/design-taste-frontend/SKILL.md`: 모션 규칙(dealt moment 1~2개, 스크롤 페이드인 금지, 스크롤 하이재킹 금지). `gate.mjs`는 실행하지 않는다.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tools/pdf-report.mjs`: 의존성 없는 PDF 검사기다(Type3 0, BaseFont Pretendard, A4, 링크, 한글 추출, 헤더 숨김, 카드 잘림, 전화번호 가드).
  - 제출용 PDF에는 반대 조건이 필요하다. 번호가 **있어야** 하지만 숫자를 출력해서는 안 된다. 그래서 모드를 분리해야 한다.
- `tools/lib/static-server.mjs`: 127.0.0.1 전용 정적 서버다. Puppeteer 빌드가 그대로 쓸 수 있다.
- `tools/check-layout.mjs`: CDP 기반 375/768/1440(+320) 검사다. 키보드와 모션 검사를 확장하는 데 쓸 수 있다.
- `css/components.css`: `.site-header`, `.nav-toggle`, `.site-nav[data-open]`, `[data-hidden]` 같은 Phase 3용 정적 스타일이 이미 있다. 쓰이지 않은 채 대기 중이다.

### Established Patterns
- `npm run check`가 html-validate, content, repo, selftest, history, contrast, server 검사를 돌린다. pre-commit과 pre-push 훅이 전화번호를 검사한다.
- 공개 HTML에 `tel:`이 있으면 check-content가 실패한다. PDF 주입은 빌드 중 DOM에서만 하고, 저장소의 HTML은 바꾸지 않는다.

### Integration Points
- `js/main.js` 하나를 `type="module"`로 추가한다(상대경로). `<html>`에 `js` 클래스를 붙이고, 헤더, 햄버거, 키워드, 표지 진입을 담당한다.
- `tools/build-pdf.mjs`(Puppeteer)를 만든다. 정적 서버를 띄우고, `private/contact.json`을 읽어 phone 슬롯을 주입하고, `dist/퍼블리셔 유윤희-포트폴리오.pdf`를 만든다. 그다음 pdf-report로 검사한다.

</code_context>

<specifics>
## Specific Ideas

- 표지 진입과 키워드 전환은 같은 "아래에서 위로 스르륵" 언어를 쓴다. 이 둘이 페이지의 대표 움직임이다.
- 채용 담당자가 지루하지 않게, 키워드 섹션은 짧게 머문다(약 1.5화면).

</specifics>

<deferred>
## Deferred Ideas

- 실제 스크린샷과 PDF 용량 목표(5MB): Phase 4
- 스크린샷 확대 보기: Phase 4 (SHOT-04)
- 퍼블리싱 포인트 문구: 사용자가 나중에 제공
- 배포, noindex/robots, OG 메타: Phase 5

</deferred>

---

*Phase: 03-인터랙션과 제출용 PDF*
*Context gathered: 2026-11-11*
