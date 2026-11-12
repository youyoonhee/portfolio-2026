# Phase 4: 스크린샷 통합 - Context

**Gathered:** 2026-11-12
**Status:** Ready for planning

<domain>
## Phase Boundary

프로젝트 카드 13개의 빈 스크린샷 자리(`figure.shot[data-slot="screenshot"]`)에 사용자가 준 실제 작업 화면을 넣는다. 이미지 변환 도구, 공개 전 검수와 마스킹, 앱·웹 프레임, 키보드로 다룰 수 있는 확대 보기, 스크린샷이 들어간 제출용 PDF의 용량(5MB 목표, 10MB 미만)까지 이 phase에서 끝낸다.

요구사항: SHOT-01, SHOT-02, SHOT-03, SHOT-04, PDF-05.

**현재 상태:** `_screenshots/`는 비어 있다. 이 phase는 **방식부터 만든다**. 즉 변환 도구, 프레임, 확대 창, PDF 처리를 먼저 완성하고, 이미지가 들어오면 도구를 다시 돌려 채운다(D-13).

이 phase에 포함되지 않는 것:
- 배포, noindex, OG 이미지 연결, Colophon, 크로스브라우저 실기기 검증(Phase 5)
- 퍼블리싱 포인트 문구(사용자가 줄 때)
- 카드 구조와 콘텐츠 변경

</domain>

<decisions>
## Implementation Decisions

### 스크린샷 출처와 장수
- **D-01:** 스크린샷은 **사용자가 직접 넣는다**. 위치는 `_screenshots/<프로젝트id>/`(git 제외)이고, 프로젝트 id는 `index.html`의 article id(예: `gi-oneday`, `kn-wecankids`)를 쓴다. 원본 PDF에서 이미지를 추출하지 않는다.
- **D-02:** 프로젝트당 **딱 1장**(대표 화면)만 쓴다. 갤러리, 넘겨 보기, 여러 장 썸네일은 만들지 않는다. 폴더에 여러 장이 있으면 어떤 파일을 쓸지 검수 체크포인트에서 사용자에게 확인한다.
- **D-03:** 스크린샷이 없는 프로젝트는 **지금의 빈 프레임을 그대로 둔다**(연한 회색 프레임, 앱은 세로 자리표시). 문구는 넣지 않는다. 빈 프레임은 확대 버튼이 되지 않고 지금처럼 `aria-hidden` 상태로 남는다. PDF에서는 지금처럼 숨긴다(`print.css`의 `.shot:not(:has(picture, img))`).

### 프레임 모양
- **D-04:** 앱(세로, `data-frame="app"`) 화면에는 **둥근 모서리와 얇은 선만** 둔다. 폰 목업이나 베젤은 그리지 않는다. 카드 프레임 안에서 세로 이미지를 가운데에 둔다. 지금 `::before`로 그린 세로 자리표시와 같은 위치와 크기 감각을 유지한다.
- **D-05:** 웹(가로, `data-frame="web"`) 화면에는 **테두리만** 둔다. 지금 `.shot`의 얇은 선과 `--radius-md`를 유지하고, 브라우저 상단 바는 붙이지 않는다.
- **D-06:** 세로로 긴 웹 페이지 캡처는 카드에서 **윗부분(첫 화면)만** 보인다. 지금 CSS의 `object-fit: cover; object-position: top` 방향이다. 확대 창에서는 전체 이미지를 세로 스크롤로 본다.

### 확대 보기
- **D-07:** 스크린샷을 누르면 **거의 전체 화면**으로 연다. 어두운 배경(`--color-overlay` 계열) 위에 이미지를 최대한 크게 띄운다. 긴 이미지는 확대 창 안에서 세로로 스크롤한다. 모바일도 같은 방식이다.
- **D-08:** 확대 창에는 **프로젝트명 한 줄과 닫기 버튼만** 둔다. 플랫폼이나 기여도 같은 다른 정보는 넣지 않는다.
- **D-09:** 열고 닫을 때는 **짧게 페이드**한다. 배경은 흐려지고 이미지는 살짝 커지며 나타난다. `prefers-reduced-motion: reduce`이면 바로 뜨고 바로 닫힌다. Phase 3의 motion 토큰(`--dur-*`)을 쓴다.
- **SHOT-04 그대로 지킨다:** 키보드로 열기(썸네일은 버튼 또는 링크), Tab 이동이 확대 창 안에 갇힘, Esc로 닫기, 닫으면 원래 썸네일로 포커스가 돌아온다.

### 검수와 마스킹
- **D-10:** 가릴 부분은 **Claude가 찾고 칠한다**. 절차는 다음과 같다.
  1. 원본을 보고 가릴 곳(고객 개인정보, 내부·스테이징 URL, 관리자 계정, 전화번호와 이메일 등)을 목록으로 보여준다.
  2. 사용자가 승인하면 그 좌표에 **단색 박스**를 칠한다. 블러는 쓰지 않는다.
  3. 다시 저장해 EXIF를 지운다.
  4. 최종 결과 이미지를 공개 전에 사용자에게 확인받는다.
  
  확인을 받기 전에는 `img/projects/`에 커밋하지 않는다.
- **D-11:** **실제로 공개됐던 화면만** 쓴다. 관리자, 내부, 개발 중 화면은 쓰지 않는다. 운영이 끝난 서비스의 화면은 사용자가 주면 쓴다. 공개 여부가 애매한 화면은 검수 체크포인트에서 사용자에게 묻는다.
- **D-12:** 대체 텍스트(alt)는 **Claude가 초안을 쓴다**. 화면에 보이는 것만 짧게 사실대로 적는다(예: "위캔키즈클럽 메인 화면"). 성과나 평가 표현은 넣지 않는다. 검수 때 사용자에게 같이 확인받는다.

### 진행 방식
- **D-13:** 이미지가 없어도 **방식을 먼저 만든다**. 실행 중에 **스크린샷 검수 체크포인트**를 둬서 사용자가 `_screenshots/`에 이미지를 넣고 마스킹을 승인할 수 있게 한다. 그 시점에 받은 이미지만 반영하고, 없는 프로젝트는 D-03대로 둔다. 나중에 받는 이미지는 같은 도구를 다시 돌려 추가할 수 있어야 한다. 반복 실행해도 결과가 같아야 하고, 한 프로젝트씩 추가할 수 있어야 한다.

### PDF
- **D-14:** 제출용 PDF에는 **모든 카드에 작게** 스크린샷을 넣는다. 웹과 같은 프레임을 쓰고, 긴 화면은 윗부분만 넣는다. PDF는 JPEG를 쓴다(CLAUDE.md: PDF 스크립트가 `<source>`를 빼고 JPEG `src`를 쓰게 한다). 용량을 재서 5MB가 넘으면 PDF용 JPEG 폭과 품질을 낮춘다. 10MB 이상이면 실패로 본다. 쪽수가 6쪽보다 늘어나는 것은 허용한다. 다만 `--page-plan`과 `pdf-report` 검사를 새 쪽수에 맞게 갱신한다.

### Claude's Discretion
- 이미지 포맷 구성. SHOT-03 기준으로 WebP와 JPEG는 필수이고 AVIF를 추가할지는 연구 후 결정한다. 폭 단계(예: 480/960/1440w), 품질값, 앱 세로 이미지의 폭 단계도 연구 후 정한다.
- 변환 도구의 이름과 구조(예: `tools/optimise-images.mjs`), 마스킹 좌표와 alt를 담는 매니페스트의 형식과 위치. 매니페스트는 공개해도 되는 정보만 담는다.
- `sharp` 설치 방식. devDependency이고 정확한 버전을 고정하며, 설치는 사용자 승인을 받는다.
- 확대 창 구현. `<dialog>`와 `showModal()`을 권장하고, 썸네일을 버튼으로 감쌀지 링크로 감쌀지와 닫기 버튼 위치를 정한다.
- 검사 도구 확장. 다음을 검사할 수 있다.
  - 이미지의 `width`·`height`·`srcset`·alt 존재
  - EXIF가 남아 있지 않음
  - 확대 창 키보드 동작을 `check:ui`에 추가
  - PDF 용량 한도를 `pdf-report`에 추가

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 범위와 요구사항
- `.planning/ROADMAP.md` §Phase 4: 목표와 성공 기준 5개(프레임, 검수 체크리스트, `img/projects/<id>/` 다중 폭, 키보드 확대 창, PDF 5MB 이하)
- `.planning/REQUIREMENTS.md`: SHOT-01~04, PDF-05
- `.planning/PROJECT.md`: 제약(콘텐츠 정확성, 개인정보, 반응형, 호환성)
- `CLAUDE.md`: 반응형 이미지 지침(포맷, AVIF 4:4:4, 폭, `sizes`, `width`/`height`, lazy, `fetchpriority`), PDF 이미지 처리(`<source>` 제거 후 JPEG, 5MB), print에서 모션 끄기

### 이전 결정
- `.planning/research/SUMMARY.md`: 폴더 규칙(`_screenshots/` 원본은 git 제외, `img/projects/<id>/` 최적화본은 커밋), 단색 박스 마스킹, EXIF 제거, `<dialog>` 확대, Q7 공개 범위
- `.planning/research/PITFALLS.md`: 스크린샷 기밀과 개인정보 위험
- `.planning/phases/02-pdf-spike/02-CONTEXT.md` D-07: 카드 안 항목과 스크린샷 자리, 앱 세로·웹 가로 프레임
- `.planning/phases/02-pdf-spike/02-UI-SPEC.md`: 토큰, 프레임, 카드 디자인 계약
- `.planning/phases/03-pdf/03-CONTEXT.md`, `.planning/phases/03-pdf/03-UI-SPEC.md`: motion 토큰, reduced-motion 규칙, PDF 쪽 계획, 빈 스크린샷 숨김
- `.planning/phases/02-pdf-spike/02-PDF-SPIKE.md`: lazy 이미지가 PDF에 찍히지 않는 문제와 권고

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html`: article 13개마다 `<figure class="shot" data-slot="screenshot" data-frame="app|web" aria-hidden="true"></figure>`가 있다. article에는 `data-platform`도 있다. 앱은 gi-oneday, kn-puring, ab-peach이고 나머지는 웹이다(정확한 목록은 파일로 확인한다).
- `css/components.css` `.shot`: 프레임은 16/10, surface 배경, 선, `--radius-md`다. app은 `::before`로 9/16 세로 자리표시를 그리고(max 200px), `picture, img`는 `object-fit: cover; object-position: top`이다.
- `css/print.css`: `.shot:not(:has(picture, img)) { display:none }`. 이미지가 들어가면 PDF 프레임이 자동으로 나타난다.
- `css/tokens.css`: `--color-overlay`, `--dur-*` motion 토큰, radius, spacing.
- `js/main.js`: init이 try/catch 안에 있고, 실패하면 no-JS 상태로 돌아간다. 키보드, Esc, 포커스 복귀 패턴은 햄버거 메뉴에 이미 있다.
- `tools/build-pdf.mjs`, `tools/pdf-report.mjs`(`--page-plan`, `--min-page-chars`), `tools/check-ui.mjs`(Puppeteer), `tools/lib/browser.mjs`, `tools/lib/static-server.mjs`.
- `tools/check-repo.mjs`: 전화번호와 금지 경로 검사. 새 이미지 파일명도 kebab-case여야 한다.

### Established Patterns
- 빌드 도구 없이 손으로 쓴 HTML/CSS/JS를 쓴다. CSS는 `@layer`로 나누고 상대경로를 쓴다.
- devDependencies는 버전을 정확히 고정한다. Node 도구는 `tools/*.mjs`에 둔다.
- 기본 상태는 no-JS다(`html:not(.js)`). JS가 없으면 썸네일은 큰 이미지로 가는 링크로 동작해야 한다(점진적 향상 권장).
- 실행 에이전트는 메인 트리에서 순서대로 실행한다. git에서 제외된 `_screenshots/`, `private/`, `node_modules/`가 메인 트리에만 있기 때문이다.
- 전화번호와 원본 텍스트는 출력이나 공개 파일에 절대 넣지 않는다. 브라우저 프로세스를 이름으로 종료하지 않는다.

### Integration Points
- `index.html`의 각 `figure.shot`에 `<picture>`나 버튼과 `<img>`를 넣는다. 도구가 생성하거나, 매니페스트를 보고 손으로 넣는다.
- `tools/build-pdf.mjs`: `<source>`를 빼서 JPEG를 쓰게 하고, lazy 이미지를 강제로 로드하고, 용량을 확인한다.
- `npm run check`, `check:ui`, `check:layout`에 이미지와 확대 창 검사를 추가한다.

</code_context>

<specifics>
## Specific Ideas

- 미니멀한 톤을 유지한다. 폰 목업이나 브라우저 바 같은 장식 없이 실제 화면이 주인공이 되게 한다.
- 확대 창은 캡션이 프로젝트명 한 줄뿐이다. 채용 담당자가 화면만 크게 보는 용도다.

</specifics>

<deferred>
## Deferred Ideas

- 프로젝트당 여러 장, 갤러리, 넘겨 보기: 사용자가 1장으로 정했다. 나중에 필요하면 별도로 다룬다.
- OG 대표 이미지(스크린샷 활용 가능): Phase 5
- 원본 PDF에서 이미지 추출: 사용하지 않기로 했다.

</deferred>

---

*Phase: 04-screenshots*
*Context gathered: 2026-11-12*
