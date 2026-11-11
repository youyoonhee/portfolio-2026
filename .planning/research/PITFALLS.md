# Pitfalls Research

**Domain:** 국내 이직용 퍼블리셔 포트폴리오 (순수 HTML/CSS/JS 정적 사이트 + 같은 디자인에서 뽑는 제출용 PDF, GitHub Pages 배포)
**Researched:** 2026-11-11
**Confidence:** MEDIUM — 브라우저 동작(100vh, keep-all, print CSS, GitHub Pages 대소문자)은 잘 알려진 사실이라 HIGH. 채용 사이트 첨부 용량 제한, 일부 print 엔진 세부 동작은 공식 자료를 찾지 못해 LOW~MEDIUM으로 표시함.

> 아래 "Phase"는 로드맵이 아직 없으므로 다음 가정 단계명으로 매핑했다. 로드맵 작성 시 실제 단계에 맞춰 옮기면 된다.
> - **P1 기반:** 저장소/폴더 구조, 디자인 토큰, 타이포그래피·폰트, 리셋
> - **P2 콘텐츠·자산:** PDF 내용 이전, 프로젝트 데이터 정리, 스크린샷 가공·검수
> - **P3 레이아웃·섹션:** 히어로, 스킬, 경력, 프로젝트, 연락처 반응형 마크업
> - **P4 인터랙션·접근성:** 모션, 키보드, reduced-motion, 대비
> - **P5 Print/PDF:** print stylesheet, PDF 생성, 전화번호 주입, 용량 관리
> - **P6 배포·QA:** GitHub Pages, 링크 검사, 실기기(iOS Safari) 검수, OG 미리보기

---

## Critical Pitfalls

### Pitfall 1: "웹엔 이메일만"이라면서 전화번호가 공개 저장소에 들어간다

**What goes wrong:**
PDF에는 전화번호가 필요하니 HTML에 `<span class="print-only">010-…</span>`을 넣고 화면에서는 `display:none`으로 숨긴다. 그러면 화면에는 안 보여도 소스 보기, 검색엔진 캐시, GitHub 저장소에서 누구나 볼 수 있다. 완성된 PDF 파일을 저장소에 커밋하거나 사이트에 "PDF 다운로드" 링크로 올리는 경우도 같다. 원본 텍스트(`.planning/source/portfolio-pdf.txt`)가 실수로 커밋되는 경우도 있다. GitHub Pages 무료 플랜은 public 저장소가 기본이라 `.planning/` 전체도 같이 공개된다.

**Why it happens:**
"같은 디자인에서 PDF를 뽑는다"는 요구를 가장 쉽게 푸는 방법이 숨김 처리라서 그렇다. CSS로 숨기는 것과 데이터를 공개하지 않는 것을 같은 일로 착각한다.

**How to avoid:**
- 전화번호는 **어떤 커밋되는 파일에도** 넣지 않는다. 방법은 셋 중 하나를 고른다.
  1. (권장) gitignore된 로컬 파일 `private/contact.local.js`가 있을 때만 print 전용 연락처 노드를 채운다. 공개 사이트에서는 이 파일이 404라 아무 일도 일어나지 않는다.
  2. 로컬에서 `print.local.html`(gitignore)을 따로 두고, 공용 CSS를 그대로 불러 PDF를 만든다.
  3. PDF로 만든 뒤 PDF 편집기로 전화번호를 넣는다(가장 단순하지만 매번 손이 간다).
- 완성된 PDF(`*.pdf`)는 `.gitignore`에 넣는다. 사이트에 PDF 다운로드 링크를 둘 거라면 **전화번호를 뺀 공개판**을 따로 만든다.
- 커밋 전에 `git grep -nE "01[016789][- .]?[0-9]{3,4}[- .]?[0-9]{4}"`로 확인한다. 가능하면 pre-commit hook으로 자동화한다.
- `.planning/` 공개가 꺼려지면 배포 대상을 `docs/` 또는 별도 브랜치로 분리하거나, 사이트 저장소와 기획 저장소를 나눈다.

**Warning signs:**
HTML/JS 어딘가에 `print-only`, `tel:` 문자열이 있다. `git ls-files | grep -i pdf` 결과가 있다. 배포 URL 뒤에 `/.planning/source/...`를 붙였을 때 파일이 열린다.

**Phase to address:** P1(gitignore·저장소 구조), P5(주입 방식), P6(배포 전 grep 검사)

---

### Pitfall 2: 스크린샷에 고객사 기밀·개인정보가 그대로 찍혀 있다

**What goes wrong:**
하나손해보험 산출기·관리자 연동 이벤트 페이지, 마이데이터 앱(피치), ADDY 광고운영플랫폼은 모두 **금융·광고 실데이터**가 화면에 나올 수 있는 서비스다. 관리자 화면의 고객명·계약번호·담당자 이름, 테스트 계정 이메일, 브라우저 주소창의 내부망/스테이징 URL(`dev.`, `stg.`, IP), 앱 상태바의 알림·통신사·배터리, 메신저 알림이 그대로 공개된다. 최악은 이전 직장이나 고객사가 문제를 제기하는 경우다. 포트폴리오를 보는 면접관도 "보안 의식이 없다"고 판단한다.

**Why it happens:**
작업할 때 찍어둔 캡처를 그대로 쓰기 때문이다. 크롭만 하고 블러를 하지 않는다. 블러를 약하게 걸어 글자가 복원되기도 한다.

**How to avoid:**
- P2에 **스크린샷 검수 체크리스트**를 단계 완료 조건으로 둔다: 개인정보(이름·전화·이메일·계약/주문번호), 내부 URL, 관리자 계정명, 상태바, 미공개 상품명·가격, 사내 메신저.
- 가릴 때는 블러 대신 **단색 박스나 더미 텍스트로 덮는다**. 약한 모자이크는 복원될 수 있다.
- 관리자 화면은 실데이터가 없는 상태(빈 목록, 더미 값)만 쓰거나, 아예 쓰지 않고 사용자 화면만 보여준다.
- 이미지 메타데이터(EXIF/GPS, 특히 휴대폰 캡처)를 내보낼 때 지운다. 웹용으로 다시 인코딩(WebP/AVIF 변환)하면 대부분 사라진다.
- 계약상 공개가 애매한 프로젝트(재직 중이던 지아이데이타의 하나손해보험 작업 등)는 공개 사이트에는 **이미 공개된 운영 화면**만 쓴다. 내부 화면은 PDF(제출용, 비공개 전달)에만 넣는 식으로 공개 범위를 나눌 수 있다.

**Warning signs:**
스크린샷에 사람 이름이나 숫자 ID가 보인다. 주소창이 함께 찍혀 있다. 파일명이 `KakaoTalk_2023…`, `스크린샷 2024-…`처럼 원본 그대로다.

**Phase to address:** P2(필수 게이트). P6에서 최종 재검수

---

### Pitfall 3: 기여도·소속을 과장하거나 애매하게 표기한다

**What goes wrong:**
- "교보생명 앱 피치 구축"처럼 쓰면 고객사 직원이었던 것처럼 읽힌다. 실제로는 에이전시(애비로드) 소속이다.
- "기여도 30%"만 있고 무엇을 했는지 없으면 면접관이 첫 질문으로 "나머지 70%는 누가 했나요?"를 묻는다. 반대로 실제보다 높게 쓰면 기술 면접에서 바로 드러난다.
- 원본 PDF에 없는 성과 수치(전환율 ↑, 로딩속도 개선 %)를 "그럴듯하게" 만들어 넣는다. 디자인 스킬이나 AI 카피가 자주 이렇게 한다. 프로젝트 제약상 금지 사항이다.
- 고객사 로고를 크게 써서 고객사 공식 사이트처럼 보이게 만든다.

**Why it happens:**
경력이 에이전시·SI 위주면 "작아 보일까" 걱정해 고객사 이름을 앞세운다. 퍼센트는 숫자라 객관적으로 보이지만 정의가 없다.

**How to avoid:**
- 표기 규칙을 데이터 단계에서 통일한다: `소속사 → 고객사 → 서비스명` 순서로 쓴다(예: "비스톤스 · CJ · ADDY").
- 기여도 옆에 **범위를 한 줄로** 붙인다: "기여도 50% — 2인 1팀, 기획전 마크업·반응형 담당". 원본 PDF에 있는 사실만 쓴다.
- "초기 화면 설계"(피치)처럼 원문 표현을 바꿀 때는 의미가 넓어지지 않게 한다. "설계"를 "구축"으로 바꾸지 않는다.
- 로고는 쓰지 않거나 작게 텍스트 수준으로만 쓴다. 기사 링크(EXAONE)는 "관련 기사"라고 분명히 적는다.
- P2 완료 조건: 원본 `portfolio-pdf.txt`와 웹 문구를 항목별로 대조한 표를 만든다. 새로 생긴 숫자가 0개인지 확인한다.

**Warning signs:**
웹 문구에 원본에 없는 숫자, "주도", "리드", "전담" 같은 단어가 있다. 소속사 이름이 빠진 카드가 있다.

**Phase to address:** P2

---

### Pitfall 4: 운영 종료·만료된 링크가 그대로 걸려 있다

**What goes wrong:**
피치, ADDY, 로드필은 운영이 끝났다. 삼성 E스토어 기획전은 기간이 끝난 프로모션이라 대부분 404가 나거나 메인으로 리다이렉트된다. 고객사 사이트는 리뉴얼로 URL이 자주 바뀐다. 채용 담당자가 링크를 눌렀는데 빈 페이지나 다른 회사 페이지가 나오면 "관리 안 하는 포트폴리오"로 보인다. 도메인이 만료되어 **스팸/도박 사이트로 넘어간** 경우가 가장 위험하다.

**Why it happens:**
링크를 만들 때 한 번만 확인하고, PDF는 한 번 만들면 다시 보지 않는다.

**How to avoid:**
- 프로젝트 데이터에 `status` 필드를 둔다: `live` / `ended` / `article-only` / `apk-only` / `intro-only`. 상태별로 UI를 다르게 그린다(뱃지 "운영 종료", 링크 대신 스크린샷만, "소개서 보기" 등).
- 운영 종료 서비스는 **링크를 아예 걸지 않는다**. 꼭 필요하면 Wayback Machine 아카이브 링크를 "보관본"이라고 적어서 건다.
- puring APK는 **공개 사이트에 APK 파일을 올리지 않는다**. 고객사 바이너리 재배포 문제가 있고, 보안 경고가 뜬다. 스크린샷과 "APK 보유(면접 시 시연 가능)" 문구로 대신한다.
- 외부 링크는 `target="_blank" rel="noopener noreferrer"`로 열고, 새 창이 열린다는 것을 텍스트나 아이콘+`aria-label`로 알린다.
- P6과 PDF 제출 직전마다 링크를 검사한다(`curl -sIL`로 최종 상태 코드와 최종 도메인 확인). 리다이렉트 결과 도메인이 원래와 다르면 실패로 본다.

**Warning signs:**
`status` 없이 `url`만 있는 데이터. 링크를 클릭했더니 메인 페이지로 가거나, 리다이렉트 횟수가 많다.

**Phase to address:** P2(데이터 스키마), P3(상태별 UI), P6(검사)

---

### Pitfall 5: 같은 HTML로 PDF를 뽑았더니 깨진다

**What goes wrong (자주 나오는 증상들):**
- **스크롤 등장 애니메이션 때문에 내용이 비어 보인다.** `opacity:0` + IntersectionObserver로 숨긴 요소는 인쇄할 때 스크롤 이벤트가 없어서 끝까지 투명하다. PDF 절반이 빈 페이지가 된다.
- **`loading="lazy"` 이미지가 빠진다.** 브라우저·버전에 따라 인쇄 전에 lazy 이미지를 다 불러오지 않을 수 있다(MEDIUM — 동작이 엔진마다 다름).
- **카드가 페이지 경계에서 잘린다.** 스크린샷 반은 앞 페이지, 반은 뒤 페이지에 걸린다. 반대로 `break-inside: avoid`가 flex/grid 컨테이너에서 기대대로 듣지 않는 경우도 보고된다. Chromium은 103~108 버전에서 flex/grid fragmentation을 지원하기 시작했지만, 실무에서는 블록 래퍼에 거는 편이 안전하다.
- **배경색·포인트 컬러가 사라진다.** 인쇄 대화상자의 "배경 그래픽" 기본값이 꺼져 있다.
- **머리글/바닥글에 날짜·URL·`file:///C:/Users/user/...` 경로가 찍힌다.** 로컬 경로에 사용자명과 폴더 구조가 그대로 드러난다.
- **링크가 클릭되지 않는다.** Windows에서 프린터를 "Microsoft Print to PDF"로 고르면 하이퍼링크가 사라진다. Chrome/Edge의 **"PDF로 저장"** 을 써야 링크가 살아 있다.
- **한글 폰트가 빠지거나 대체된다.** 웹폰트 로딩 전에 인쇄하면 시스템 폰트(맑은 고딕)로 나간다. 반대로 폰트가 통째로 들어가면 용량이 커진다(Chrome은 보통 subset으로 넣는다).
- **화면용 sticky 헤더, 햄버거 메뉴, "맨 위로" 버튼이 매 페이지에 찍힌다.** `position: fixed` 요소는 페이지마다 반복된다.

**Why it happens:**
"같은 디자인"을 같은 CSS를 그대로 인쇄하는 것으로 이해하기 때문이다. print는 별도의 출력 매체라 화면과 다른 규칙이 필요하다.

**How to avoid:**
- 처음부터 **`@media print` 레이어를 따로 설계한다.** 페이지 단위(표지/스킬/경력/회사별 프로젝트/연락처 — 원본 PDF 8페이지 구조)를 `break-before: page`로 고정한다.
- `@page { size: A4 landscape; margin: 0; }` 또는 원본 PDF 비율에 맞추고, 머리글/바닥글이 생기지 않게 `margin:0` 처리한다. CLI로 만들 때는 `--no-pdf-header-footer`를 쓴다.
- 모션은 **"기본은 보임, JS가 붙었을 때만 숨김"** 으로 만든다(`html.js .reveal{opacity:0}`). print에서는 `.reveal{opacity:1!important; transform:none!important}`로 덮는다.
- 인쇄 전에 `document.fonts.ready`를 기다리고, 이미지는 `loading` 속성을 빼거나 `beforeprint`에서 `eager`로 바꾼다.
- `* { print-color-adjust: exact; -webkit-print-color-adjust: exact; }`를 넣는다. 그래도 배경에 의존하는 정보는 테두리·텍스트로도 보이게 만든다.
- PDF 생성 방법을 하나로 정해 문서화한다. 권장은 Chrome 헤드리스 CLI: `chrome --headless --no-pdf-header-footer --print-to-pdf=out.pdf print.local.html`. 매번 같은 결과가 나오고 사람 실수(배경 그래픽 체크 누락, 잘못된 프린터 선택)가 없다.
- 카드 단위에 `break-inside: avoid`를 걸되 **flex/grid 자식이 아닌 블록 래퍼**에 건다. 결과는 반드시 PDF를 열어 페이지별로 눈으로 확인한다.

**Warning signs:**
print 미리보기에서 빈 영역이 보인다. PDF 페이지 수가 매번 다르다. PDF에서 링크 위에 커서를 올려도 손 모양이 안 나온다. PDF 속성 → 글꼴 목록에 Pretendard가 없다.

**Phase to address:** P1(모션 기본값 규칙), P5(전담 단계로 분리 — 연구 플래그 필요)

---

### Pitfall 6: PDF 용량이 채용 사이트·메일 첨부 한도를 넘는다

**What goes wrong:**
스크린샷 13개 이상을 2x~3x 원본 PNG로 넣으면 PDF가 수십 MB가 된다. 채용 사이트 업로드가 실패하거나, 메일 첨부가 대용량 링크로 바뀌어 담당자가 열지 않는다. 사람인·잡코리아의 포트폴리오 첨부 한도는 공식 자료로 확인하지 못했다(LOW). 업로드 화면에서 직접 확인해야 한다.

**Why it happens:**
웹에서는 `srcset`으로 작은 이미지를 받지만, 인쇄할 때는 엔진이 고해상도 후보를 고르거나 원본을 그대로 넣는다.

**How to avoid:**
- 목표 용량을 정해 둔다: **10MB 미만, 가능하면 5MB 미만**(메일 본문 첨부 기준으로도 안전함).
- 스크린샷 원본은 `assets-src/`(gitignore 또는 별도 보관)에 두고, 배포용은 가로 최대 1600px 정도로 줄인 WebP(웹)와 JPEG/WebP(인쇄 겸용)를 만든다. PNG 원본을 그대로 배포하지 않는다.
- PDF를 만든 직후 파일 크기를 확인하는 것을 P5 완료 조건에 넣는다. 넘치면 이미지 품질부터 낮춘다. Ghostscript 등으로 후처리 압축을 하면 링크·텍스트 레이어가 유지되는지 다시 확인한다.
- 파일명은 원본과 같은 규칙(`퍼블리셔_유윤희_포트폴리오_2026.pdf`)으로 하되, 띄어쓰기 대신 `_`를 쓴다. 일부 업로드 폼과 메일 클라이언트에서 공백 파일명이 깨진다.

**Warning signs:**
PDF가 10MB를 넘는다. 스크린샷 파일 하나가 1MB를 넘는다.

**Phase to address:** P2(이미지 파이프라인), P5(용량 게이트)

---

### Pitfall 7: 한글 타이포그래피를 영문 기준으로 잡는다

**What goes wrong:**
- **어절 중간 줄바꿈:** 기본 `word-break: normal`에서 한글은 글자 단위로 줄이 바뀐다("퍼블리\n셔"). 헤드라인과 카드 제목이 특히 어색하다.
- **`keep-all`의 반작용:** `word-break: keep-all`만 전역으로 걸면 긴 URL, 영문 클래스명, 이메일 주소, 띄어쓰기 없는 긴 복합어가 375px에서 **가로 스크롤**을 만든다. 프로젝트 요구사항 "가로 스크롤 없음" 위반이다.
- **자간:** 디자인 레퍼런스(영문 기반)의 큰 음수 tracking(-0.04em~-0.05em)을 본문 한글에 쓰면 글자가 붙어 읽기 힘들다. 반대로 Pretendard·Noto Sans KR 헤드라인을 0으로 두면 성글어 보인다.
- **행간:** 영문 기준 `line-height: 1.4`는 한글 본문에 답답하다. 큰 헤드라인에 1.6을 쓰면 반대로 줄 사이가 벌어진다.
- **글자 굵기 합성:** 폰트 파일에 없는 weight(예: 600)를 지정하면 브라우저가 가짜 볼드를 만든다. 한글에서 특히 뭉개진다.
- **기간 표기:** `2021.08 ~ 2021.12`의 `~`가 폰트에 따라 위로 떠 보인다. iOS Safari가 숫자열을 전화번호로 인식해 링크로 바꾸는 일도 있다.
- **영문/숫자 혼용:** "HTML5, CSS3, SCSS" 같은 스킬 태그에서 한글과 영문의 기준선·크기가 맞지 않는다.

**Why it happens:**
디자인 스킬과 레퍼런스가 대부분 영문 타이포그래피 기준이기 때문이다.

**How to avoid:**
- 기본 규칙(P1 토큰으로 고정):
  - 본문: `word-break: keep-all; overflow-wrap: anywhere;` 조합(또는 `break-word`). URL·이메일 요소에는 `word-break: break-all`을 따로 준다.
  - 헤드라인: `text-wrap: balance`를 progressive enhancement로 쓴다(지원 안 되면 무시됨). 의도한 줄바꿈은 `<br class="br-pc">`처럼 반응형 클래스로 제어하고, 375px에서 반드시 확인한다.
  - 행간: 본문 1.6~1.75, 소제목 1.4 안팎, 대형 헤드라인 1.2~1.3.
  - 자간: 본문 0 ~ -0.01em, 헤드라인 -0.02em ~ -0.03em. 영문 대문자 라벨(SKILLS 등)만 양수(+0.04em 이상)를 쓴다.
  - 본문 크기는 모바일 16px 이상(14px 이하 한글 본문은 iOS에서 특히 읽기 힘듦). 캡션도 13px 미만으로 내리지 않는다.
- 실제로 불러온 weight만 쓴다(예: 400/500/700). `font-synthesis: none`으로 가짜 볼드를 막는다.
- 숫자에는 `font-variant-numeric: tabular-nums`를 써서 기간 열을 정렬한다. 기간 구분은 `–`(en dash) 또는 `~`를 폰트에서 확인한 뒤 고른다. 날짜는 `<time datetime="2021-08">`로 마크업한다.
- `<meta name="format-detection" content="telephone=no">`로 iOS가 숫자를 링크로 바꾸지 않게 한다.
- `<html lang="ko">`를 꼭 넣는다. 스크린리더 발음과 브라우저의 줄바꿈·폰트 선택에 영향을 준다.

**Warning signs:**
375px에서 단어가 잘려 있다. `document.documentElement.scrollWidth > innerWidth`가 true다. 볼드가 뭉개진다.

**Phase to address:** P1(토큰), P3(섹션별 375px 확인)

---

### Pitfall 8: 한글 웹폰트 용량·로딩 문제(FOUT/FOIT, CLS)

**What goes wrong:**
한글 폰트는 글자 수가 많아 weight 하나가 woff2로도 수백 KB~1MB 이상이다(정확한 수치는 폰트마다 다름. 공식 수치는 확인하지 못함). static weight 3~4개를 통째로 받으면 모바일 첫 로딩이 느리다. `font-display: block`이면 글자가 몇 초 안 보이고(FOIT), `swap`이면 맑은 고딕/Apple SD 고딕으로 보였다가 바뀌면서 줄바꿈·높이가 달라져 레이아웃이 튄다(CLS). 외부 CDN이 막히거나 느린 사내망(채용 담당자 PC)에서는 폰트가 아예 안 뜬다.

**Why it happens:**
영문 폰트처럼 `@font-face` 하나에 파일 하나를 연결하는 방식을 그대로 쓰기 때문이다.

**How to avoid:**
- **Pretendard Variable의 dynamic subset**을 쓴다. `unicode-range`로 나뉜 woff2 조각 중 필요한 것만 받는다. 공식 README가 variable dynamic subset이 가장 가볍고 빠르다고 안내한다. CDN(jsDelivr/cdnjs) 대신 **파일을 저장소에 직접 넣는(self-host)** 쪽을 권장한다. 외부 의존성이 없고 PDF를 로컬에서 만들 때도 같은 폰트가 보장된다.
- `font-display: swap` + 메트릭이 비슷한 fallback 스택(`-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`)을 쓴다. 가능하면 `size-adjust`로 fallback 크기를 맞춰 CLS를 줄인다.
- 첫 화면 헤드라인에 쓰는 subset만 `<link rel="preload" as="font" type="font/woff2" crossorigin>`로 미리 받는다. 전부 preload하면 오히려 느려진다.
- 폰트 라이선스(OFL)를 확인하고 `LICENSE`를 같이 넣는다.

**Warning signs:**
Lighthouse에서 폰트가 LCP를 늦춘다고 나온다. 새로고침할 때 헤드라인 줄바꿈이 바뀐다. 네트워크 탭에서 폰트 전송량이 1MB를 넘는다.

**Phase to address:** P1

---

### Pitfall 9: 트렌디한 디자인이 채용 담당자의 "빠른 확인"을 막는다

**What goes wrong:**
`design-taste-frontend` 같은 기준을 따르다 보면 화면을 꽉 채운 대형 히어로 타이포, 커스텀 커서, 스크롤 하이재킹(풀페이지 스냅), 마퀴, 회색 위 연회색 텍스트, hover해야 정보가 보이는 카드, 모달 상세, 가로 스크롤 갤러리가 들어가기 쉽다. 그러면 채용 담당자가 Core Value("어느 회사·어떤 화면·얼마나 직접")를 확인하기까지 스크롤과 클릭이 너무 많아진다. 모바일(채용 담당자가 카카오톡으로 받은 링크를 여는 경우)에는 hover가 없어 정보가 아예 안 보인다.

**Why it happens:**
포트폴리오를 "작품"으로 보고 첫인상에 힘을 쏟기 때문이다. 퍼블리셔 포트폴리오는 화려한 효과보다 **정돈된 마크업과 반응형 정확도**가 실력의 증거다.

**How to avoid:**
- 첫 화면(1440px 기준 스크롤 없이 보이는 영역) 안에 이름·직무·경력 연차 요약·연락(이메일)이 들어가게 한다.
- 모든 프로젝트 카드에 **회사 · 기간 · App/Web · 기여도 · 상태**를 hover나 클릭 없이 기본으로 보여준다. 상세 모달은 쓰지 않거나, 써도 같은 정보가 카드에 먼저 있게 한다.
- 스크롤 하이재킹, 커스텀 커서, 자동 재생 캐러셀은 쓰지 않는다(디자인 기준과 충돌하면 이 문서가 우선이라고 명시).
- 회색 텍스트도 대비 4.5:1(본문), 3:1(18.66px bold/24px 이상)을 넘겨야 한다. "절제된 포인트 컬러"가 링크·뱃지에 쓰일 때 흰 배경에서 대비가 되는지 확인한다.
- 13개 프로젝트는 회사별로 묶고(원본 PDF 구조 그대로), 회사 기준 목차/앵커 내비게이션을 둔다.

**Warning signs:**
"이 사람이 하나손해보험에서 뭘 했지?"를 찾는 데 10초 이상 걸린다. 정보가 `:hover` 안에만 있다. Lighthouse 대비 경고가 나온다.

**Phase to address:** P3(정보 구조), P4(대비 검사)

---

### Pitfall 10: 모션이 접근성과 안정성을 해친다

**What goes wrong:**
`prefers-reduced-motion`을 무시한 패럴랙스·확대 효과가 전정기관 장애 사용자에게 어지러움을 준다. JS 오류나 느린 로딩 때 reveal 요소가 계속 숨겨진다(Pitfall 5와 같은 원인). `scroll-behavior: smooth`가 앵커 이동을 느리게 만든다. 5초 넘게 움직이는 자동 재생 요소에 정지 수단이 없으면 WCAG 2.2.2 위반이다. 리셋 CSS에서 `outline: none`을 걸어 키보드 포커스가 안 보인다.

**How to avoid:**
- 모션은 **opt-in**으로 만든다: `@media (prefers-reduced-motion: no-preference) { ... }` 안에서만 transition/animation을 정의한다. 반대로 reduce에서 끄는 방식은 빠뜨리기 쉽다.
- reveal은 `html.js` 클래스가 있을 때만 숨긴다. IntersectionObserver가 없으면 바로 보이게 한다.
- `:focus-visible` 스타일을 디자인 토큰으로 정의하고(포인트 컬러 2px outline + offset), 리셋에서 지우지 않는다.
- skip link("본문 바로가기"), 랜드마크(`header/nav/main/footer`), 섹션별 `h2`, 순서가 맞는 heading 구조를 갖춘다.
- 스크린샷 `alt`는 "스크린샷1" 대신 "하나손해보험 원데이보험 앱 메인 인트로 화면"처럼 쓴다. 같은 화면 여러 장이면 첫 장만 설명하고 나머지는 짧게 쓴다.

**Warning signs:**
OS에서 "동작 줄이기"를 켜도 애니메이션이 그대로다. Tab 키로 이동할 때 포커스가 안 보인다. JS를 끄면 빈 페이지가 된다.

**Phase to address:** P1(리셋·포커스 토큰), P4

---

### Pitfall 11: iOS Safari 전용 레이아웃 버그

**What goes wrong:**
- 히어로를 `height: 100vh`로 만들면 iOS Safari에서 주소창·툴바 높이만큼 아래가 가려지거나, 스크롤할 때 높이가 튄다.
- `position: fixed` 헤더나 하단 버튼이 홈 인디케이터·노치와 겹친다.
- 가로로 돌리면 iOS가 글자 크기를 자동으로 키운다.
- `background-attachment: fixed`가 iOS에서 동작하지 않거나 성능이 나쁘다.
- `overflow-x: hidden`을 `body`에만 걸면 iOS에서 가로 스크롤이 막히지 않는 경우가 있다(넘치는 요소 자체를 고쳐야 함).
- 숫자열이 전화번호 링크로 바뀐다(Pitfall 7).

**Why it happens:**
데스크톱 Chrome DevTools의 기기 에뮬레이션만으로 확인하기 때문이다. 에뮬레이션은 iOS의 동적 툴바를 재현하지 못한다.

**How to avoid:**
- `min-height: 100vh; min-height: 100svh;`(fallback 후 svh) 순서로 쓴다. 높이가 바뀌어도 괜찮은 곳만 `dvh`를 쓴다. 히어로는 고정 높이 대신 `min-height`로 둬서 내용이 넘치지 않게 한다.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`와 `env(safe-area-inset-*)` 패딩을 쓴다. 단 `user-scalable=no`/`maximum-scale=1`은 쓰지 않는다(확대 차단은 접근성 위반).
- `html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }`를 넣는다.
- P6에 **실기기 iPhone Safari 확인**을 필수 항목으로 넣는다. 실기기가 없으면 최소한 macOS Safari 반응형 모드나 BrowserStack 같은 실제 WebKit 환경에서 확인한다.

**Warning signs:**
에뮬레이터에서만 확인했다. 히어로 하단 CTA가 iPhone에서 잘린다.

**Phase to address:** P1(viewport·리셋), P3(히어로), P6(실기기)

---

### Pitfall 12: 로컬(Windows)에서는 되는데 GitHub Pages에서 이미지·CSS가 깨진다

**What goes wrong:**
- **대소문자:** Windows 파일시스템은 대소문자를 구분하지 않아 `Hero.webp`를 `hero.webp`로 불러도 로컬에서는 보인다. GitHub Pages(Linux)에서는 404가 난다. git도 Windows 기본 설정(`core.ignorecase=true`)에서는 파일명 대소문자만 바꾼 것을 변경으로 잡지 못한다.
- **루트 절대경로:** 저장소 이름으로 배포되는 project site(`username.github.io/repo/`)에서 `/images/a.webp`는 `username.github.io/images/a.webp`를 가리켜 깨진다.
- **한글·공백 파일명:** `퍼블리셔 유윤희.pdf`, `하나손보_메인.png`는 URL 인코딩 문제가 생긴다. macOS에서 만든 파일(NFD 정규화)을 Windows/Linux(NFC)로 옮기면 **보기에는 같은 이름인데 서로 다른 파일**로 인식되어 링크가 깨진다. 스크린샷을 여러 기기에서 모으는 이 프로젝트에서 실제로 생길 수 있다.
- **Jekyll 처리:** GitHub Pages는 기본으로 Jekyll을 돌려 `_`로 시작하는 폴더/파일(`_partials/`, `_variables.css`)을 배포에서 뺀다.
- **`file://`로만 확인:** 로컬에서 HTML 파일을 더블클릭해 열면 `fetch()`로 JSON을 불러오는 코드가 CORS로 실패한다. 반대로 상대경로 실수가 숨겨지기도 한다.

**How to avoid:**
- 모든 자산 파일명은 **ASCII 소문자 kebab-case**로 한다(`hana-oneday-main-01.webp`). 한글 원본 파일명은 데이터의 `alt`/캡션으로만 쓴다.
- 경로는 모두 **상대경로**(`./assets/...`)로 쓴다. `<base>` 태그는 앵커 링크를 깨뜨릴 수 있으니 쓰지 않는다.
- 저장소 루트에 빈 `.nojekyll` 파일을 둔다.
- `git config core.ignorecase false`를 이 저장소에 설정한다. 파일명 대소문자를 바꿀 때는 `git mv`를 쓴다.
- 로컬 확인은 `npx serve` 또는 `python -m http.server` 같은 로컬 서버로 한다(빌드 도구는 아니므로 제약 위반 아님).
- 프로젝트 데이터를 JSON+`fetch`로 그리면 JS 실패 시 내용이 비고 SEO·print에도 불리하다. **콘텐츠는 HTML에 직접 마크업한다**(퍼블리셔 포트폴리오라 마크업 자체가 보여줄 대상이기도 함).

**Warning signs:**
배포 후 Network 탭에 404가 있다. 파일명에 대문자·한글·공백이 있다. `src="/`로 시작하는 경로가 있다.

**Phase to address:** P1(명명 규칙, `.nojekyll`, git 설정), P6(배포 후 404 검사)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 전화번호를 HTML에 넣고 CSS로 숨김 | PDF 생성이 한 번에 됨 | 공개 저장소·소스에 개인정보 노출 | **Never** |
| 스크린샷 원본 PNG를 그대로 배포 | 가공 시간 절약 | 느린 로딩, PDF 수십 MB, EXIF 노출 | Never(최소 리사이즈+재인코딩) |
| 웹폰트 CDN 링크 하나로 해결 | 설정 1줄 | CDN 장애·사내망 차단 시 폰트 없음, PDF 재현성 낮음 | 개발 초기 시안 단계에서만 |
| 프로젝트 13개를 JS 배열 → DOM 생성 | 데이터 수정이 편함 | JS 실패 시 빈 화면, 마크업 역량이 안 보임, print 불안정 | 필터 같은 보조 기능에만 |
| print CSS 없이 화면 그대로 인쇄 | 빠름 | 잘린 카드, 빈 페이지, 매번 손으로 맞춤 | Never |
| 링크 상태를 확인하지 않고 원본 PDF 링크 복사 | 빠름 | 404·리다이렉트·도메인 만료 | Never |
| 고정 `<br>`로 헤드라인 줄바꿈 | 1440px에서 예쁨 | 375px에서 어색한 줄바꿈 | 반응형 클래스(`br-pc`/`br-mo`)로 제어할 때만 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages | 루트 절대경로, 대소문자 불일치, `_` 폴더 누락 | 상대경로, 소문자 파일명, `.nojekyll`, 배포 후 404 검사 |
| 카카오톡/슬랙 링크 미리보기 | `og:image`를 상대경로로 넣음, 이미지 없음 | `og:title/description/image`는 **절대 URL**, 1200×630 이미지. 카카오는 미리보기를 캐시하므로 공유 전 카카오 개발자 "공유 디버거"로 캐시를 지움 |
| Chrome "PDF로 저장" | "Microsoft Print to PDF" 선택, 배경 그래픽 꺼짐, 머리글/바닥글 켜짐 | 헤드리스 CLI(`--print-to-pdf --no-pdf-header-footer`)로 고정하거나 체크리스트화 |
| Pretendard | static 전체 파일 사용, 라이선스 누락 | Variable dynamic subset self-host, OFL 라이선스 포함 |
| 외부 고객사 링크 | `target="_blank"`만 씀 | `rel="noopener noreferrer"` + 새 창 안내, 상태 필드에 따라 링크 여부 결정 |
| 채용 사이트 업로드 | 용량·파일명 확인 안 함 | 업로드 화면에서 한도 직접 확인(공식 자료 미확인), 공백 없는 파일명 |

## Performance Traps

규모는 작은 정적 사이트지만, 채용 담당자가 모바일 데이터나 사내망에서 처음 열 때의 인상이 중요하다.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 스크린샷 13개+ 전체 즉시 로딩 | 첫 로딩 수 MB, LCP 지연 | 첫 화면 밖은 `loading="lazy"`(print 시 eager 전환), `srcset`/`sizes`, WebP/AVIF | 이미지 총량 3MB 이상 |
| `width/height` 없는 `<img>` | 스크롤 중 레이아웃이 튐(CLS) | 모든 이미지에 고유 `width`/`height` 또는 `aspect-ratio` | 이미지가 있는 모든 카드 |
| 한글 웹폰트 weight 여러 개 통째 로딩 | 폰트 1~3MB 전송, FOUT 길어짐 | variable dynamic subset, preload 최소화 | weight 2개 이상 |
| 세로로 긴 앱 스크린샷을 원본 높이로 사용 | 카드 하나가 화면 몇 개 길이 | 기기 프레임 또는 고정 비율 크롭, 상세는 별도 보기 | 앱 프로젝트(피치, puring, 원데이보험) |
| JPEG 고압축으로 UI 캡처 | 글자 주변 노이즈, 흐릿함 | UI는 WebP(품질 80+) 또는 PNG→WebP lossless, **2x 해상도**로 캡처 후 축소. 작은 이미지를 확대하지 않음 | 텍스트가 많은 화면 |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| 전화번호/원본 PDF 텍스트 커밋 | 개인정보 영구 노출(git 히스토리에 남음) | gitignore, pre-commit grep. 이미 커밋했다면 히스토리 재작성(`git filter-repo`) + force push + 번호 노출 사실 인지 |
| 스크린샷 속 고객 개인정보·내부 URL | 고객사·이전 직장 문제 제기, 신뢰 하락 | P2 스크린샷 검수 게이트, 단색 마스킹 |
| 고객사 APK·소스 파일 공개 | 저작권·계약 위반, 보안 경고 | 바이너리·소스 비공개, 스크린샷과 시연 가능 문구로 대체 |
| 이메일 평문 `mailto:` | 스팸 수집(위험 낮음) | 채용 목적상 클릭 가능한 mailto가 더 중요하므로 허용. 포트폴리오 전용 메일 주소 사용을 고려 |
| 로컬 경로가 찍힌 PDF | 사용자명·폴더 구조 노출 | 머리글/바닥글 끄기, PDF 메타데이터(제목/작성자) 확인 |
| 검색엔진 노출 범위 미결정 | 이름 검색 시 의도치 않게 노출 | `robots`/`noindex` 여부를 결정해 기록(Key Decision 후보) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 정보가 hover/모달 안에만 있음 | 모바일 사용자와 빠르게 훑는 담당자가 핵심을 놓침 | 카드에 회사·기간·플랫폼·기여도·상태를 항상 노출 |
| "운영 종료"인데 버튼 모양 링크 | 눌렀다가 404 → 실망 | 상태 뱃지 + 비활성 처리 또는 링크 없음 |
| 경력 순서가 오래된 순 | 최신(지아이데이타, 100% 기여) 경력이 맨 아래에 묻힘 | 최신순 정렬(원본 PDF 순서와 다르면 결정 사항으로 기록) |
| 기여도 %만 표기 | "나머지는 누가?" 의문 | % + 담당 범위 한 줄 |
| 연락처가 맨 아래에만 있음 | 연락하려면 끝까지 스크롤해야 함 | 헤더/히어로에 이메일 버튼, 푸터에 반복 |
| 375px에서 스킬 태그가 넘침 | 가로 스크롤, 마감이 안 된 인상 | `flex-wrap`, 최소 터치 영역 44px, 375px 실측 |

## "Looks Done But Isn't" Checklist

- [ ] **연락처:** 웹에는 이메일만 보임 — **소스 보기와 저장소에도** 전화번호가 없는지 `git grep`으로 확인
- [ ] **PDF:** 링크가 클릭됨 — PDF 뷰어에서 실제로 눌러 확인(Microsoft Print to PDF로 만들지 않았는지)
- [ ] **PDF:** 모든 페이지에 reveal 대상 콘텐츠가 보임, 카드가 페이지 경계에서 잘리지 않음
- [ ] **PDF:** 글꼴 목록에 Pretendard(또는 선택한 폰트)가 포함됨, 머리글/바닥글(날짜·URL·file 경로) 없음
- [ ] **PDF:** 용량이 목표(≤10MB, 가능하면 ≤5MB) 이하, 파일명에 공백 없음
- [ ] **반응형:** 375/768/1440px에서 `scrollWidth === clientWidth`(가로 스크롤 없음)
- [ ] **타이포:** 375px에서 헤드라인·카드 제목이 어절 중간에서 끊기지 않음, 긴 URL/이메일은 넘치지 않음
- [ ] **iOS:** 실기기 Safari에서 히어로 하단이 잘리지 않음, 숫자가 전화 링크로 바뀌지 않음
- [ ] **링크:** 모든 외부 링크 최종 상태 200 + 원래 도메인, 운영 종료 항목엔 링크 없음
- [ ] **스크린샷:** 개인정보·내부 URL·상태바 검수 완료, EXIF 제거, 각 이미지에 의미 있는 alt
- [ ] **접근성:** 키보드만으로 전체 이동 가능, 포커스가 보임, "동작 줄이기"에서 모션 없음, `lang="ko"`
- [ ] **배포:** GitHub Pages URL에서 Network 404 0건, `.nojekyll` 존재, 파일명 모두 소문자 ASCII
- [ ] **공유:** 카카오톡으로 링크를 보냈을 때 제목·설명·이미지 미리보기가 정상
- [ ] **콘텐츠:** 원본 PDF 대비 누락 0건(경력 4곳, 프로젝트 13개), 새로 생긴 수치 0건

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 전화번호가 커밋·배포됨 | HIGH | 파일 수정 → `git filter-repo`로 히스토리에서 제거 → force push → GitHub 캐시는 바로 사라지지 않을 수 있으므로 필요하면 저장소를 다시 만듦. 이미 노출된 번호는 되돌릴 수 없다는 점을 인지 |
| 기밀이 담긴 스크린샷이 공개됨 | HIGH | 즉시 이미지 교체·삭제 + 히스토리 정리. 해당 회사에 문의가 오면 바로 내렸다고 설명할 수 있게 기록 |
| PDF 레이아웃 깨짐 | MEDIUM | print 전용 페이지 구조로 다시 설계(`break-before: page` 단위). 화면 CSS를 고쳐서 맞추려 하지 않음 |
| 죽은 링크 발견 | LOW | 데이터 `status` 변경 → UI가 자동으로 뱃지/비활성 처리 |
| GitHub Pages 404(대소문자/경로) | LOW | `git mv`로 소문자화, 상대경로로 일괄 치환, `.nojekyll` 추가 |
| 폰트 용량·FOUT | LOW | variable dynamic subset self-host로 교체, preload 범위 조정 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. 전화번호 공개 저장소 유출 | P1, P5, P6 | `git grep` 전화번호 패턴 0건, 배포 URL 소스 보기 확인 |
| 2. 스크린샷 기밀·개인정보 | P2 (게이트) | 이미지별 검수 체크리스트 서명, EXIF 0 |
| 3. 기여도·소속 과장 | P2 | 원본 대비 문구 대조표, 새 수치 0건 |
| 4. 죽은 링크 | P2, P3, P6 | `curl -sIL` 결과표, `status` 필드 100% 채움 |
| 5. PDF 깨짐(모션·lazy·break·링크·폰트) | P1(모션 기본값), P5 | PDF 페이지별 육안 검수, 링크 클릭, 글꼴 목록 |
| 6. PDF 용량 | P2, P5 | 파일 크기 ≤10MB(목표 ≤5MB) |
| 7. 한글 타이포그래피 | P1, P3 | 375px 스크린샷 검수, scrollWidth 검사 |
| 8. 웹폰트 용량/FOUT | P1 | Network 폰트 전송량, Lighthouse CLS |
| 9. 트렌디 디자인 vs 가독성 | P3, P4 | "10초 테스트": 특정 회사의 담당 업무를 10초 안에 찾기, 대비 검사 |
| 10. 모션·접근성 | P1, P4 | reduced-motion 켜고 확인, 키보드 순회, JS 끄고 확인 |
| 11. iOS Safari | P1, P3, P6 | 실기기 iPhone Safari 확인 |
| 12. GitHub Pages 경로/대소문자 | P1, P6 | 배포 후 404 0건 |

**연구 플래그:** P5(Print/PDF)는 엔진별 동작 차이(flex/grid fragmentation, lazy 이미지 인쇄, 폰트 임베드)가 커서 단계 착수 전에 짧은 spike(샘플 2~3페이지를 실제 PDF로 뽑아보기)를 권장한다. 이 spike는 **P3보다 먼저 또는 P3와 같이** 하는 편이 좋다. 화면 레이아웃이 다 굳은 뒤에 print가 안 된다는 것을 알면 고치는 비용이 커진다.

## Sources

- Pretendard 공식 저장소/README (dynamic subset, variable 권장): https://github.com/orioncactus/pretendard , https://cdn.jsdelivr.net/npm/pretendard@1.3.9/docs/en/README.md — MEDIUM
- 한글 웹폰트 용량 관련 블로그(수치 미검증): https://wkhuman.tistory.com/24 — LOW
- Print CSS·page break 가이드: https://flaviocopes.com/css-printing/ , https://htmlcsstoimage.com/blog/optimize-html-for-pdf-printing , https://dev.to/accreditly/how-to-control-page-breaks-in-html-to-pdf-output-1maj — MEDIUM
- flex/grid 인쇄 분할 이슈: https://www.useanvil.com/ask-anvil/pdfs/flexbox-grid-layout-breaks-html-to-pdf/ , https://support.markedapp.com/questions/D1dc (WebKit의 break-inside 무시 보고) — LOW~MEDIUM(출처 간 의견이 다름)
- 채용 사이트 포트폴리오 첨부 관련 커뮤니티: https://www.teamblind.com/kr/post/사람인-잡코리아-이력서에-포함된-첨부파일-67z33ykn , https://comento.kr — LOW(공식 용량 한도 미확인)
- 브라우저 표준 동작(word-break: keep-all, svh/dvh, env(safe-area-inset), prefers-reduced-motion, print-color-adjust, GitHub Pages Jekyll/`.nojekyll`, Linux 대소문자 구분, WCAG 2.2.2/1.4.3): MDN·WCAG·GitHub Docs에 기반한 잘 알려진 사실 — HIGH(이번 세션에서 개별 페이지를 다시 열어 확인하지는 않음)
- Windows "Microsoft Print to PDF"가 하이퍼링크를 남기지 않는 점, Chrome 헤드리스 `--no-pdf-header-footer` 플래그: 실무에서 널리 알려진 동작 — MEDIUM(P5 spike에서 확인 권장)

---
*Pitfalls research for: 국내 이직용 퍼블리셔 포트폴리오(정적 웹 + 제출용 PDF)*
*Researched: 2026-11-11*
