# Phase 2 PDF Spike (02-04)

측정일 2026-11-11. 대상은 02-03/02-05 이후의 현재 `index.html`과 `css/print.css`. PDF는 `dist/`(gitignored)에만 생기며 커밋하지 않는다. 이 문서에는 개수와 크기만 적고, 추출한 본문과 전화번호 형태의 문자열은 적지 않는다.

## 실행 명령

```
npm run pdf:spike
  = node tools/spike-pdf.mjs dist/spike.pdf
    && node tools/pdf-report.mjs dist/spike.pdf --text --json dist/spike-report.json
node tools/spike-pdf.mjs dist/spike-chrome.pdf --browser chrome
node tools/pdf-report.mjs dist/spike-chrome.pdf --text --json dist/spike-chrome-report.json
node tools/spike-pdf.mjs dist/lazy.pdf --lazy-fixture && node tools/pdf-report.mjs dist/lazy.pdf --fixture
```

실행기는 로컬 정적 서버(127.0.0.1)로 페이지를 열고, 새 임시 프로필로 headless Edge/Chrome 157을 띄우고, `--no-pdf-header-footer --print-to-pdf`를 쓴다. msedge가 PDF가 쓰이기 전에 반환하므로 파일 크기가 두 번 연속 같을 때까지 300ms 간격으로 기다린다(30초 한도). 한 번 실행에 약 3.5~4.3초가 걸렸다. 출력 경로가 `dist/` 밖이면 종료 코드 2로 거부한다(확인함).

## 판형

- 측정한 MediaBox: `[0 0 594.96 841.92]`, 모든 쪽이 같다. A4 세로(D-17)다.
- 원본 포트폴리오 PDF는 960x540pt 슬라이드형이었다. 이 spike는 세로 문서로 바꿨을 때의 비용을 보려는 것이다.

## 쪽수

- 측정 결과: Edge 9쪽, Chrome 9쪽.
- D-18의 "2~3쪽"은 예시였고 목표가 아니다. 현재 레이아웃의 실측값은 9쪽이다.
- 쪽별 카드 수(플랫폼/퍼블 기여도 라벨 쌍): 1쪽 0, 2쪽 0, 3쪽 2, 4쪽 1, 5쪽 4, 6쪽 3, 7쪽 2, 8쪽 1, 9쪽 0. 합계 13장이다.
- 마지막 쪽(9쪽)은 고아 쪽이다. 추출 글자 수가 37자로 푸터 문구 한 줄의 길이와 같아서 푸터만 남은 것으로 본다.
- 쪽수가 큰 주된 원인은 스크린샷이 아직 없는 빈 `.shot` 프레임(16:10)이 카드마다 자리를 차지하는 것으로 추정한다(이번 실행에서 프레임을 숨겨 직접 비교하지는 않았다. RESEARCH 측정은 2쪽 절약). 1쪽(표지)과 2쪽(키워드)은 카드 없이 각각 한 쪽을 쓴다.
- Phase 3 선택지:
  1. Phase 4에서 실제 스크린샷이 들어오기 전까지 빈 `.shot` 프레임을 print에서 숨긴다(RESEARCH 측정으로 2쪽 절약).
  2. 회사 단위로 강제 쪽 나눔(`break-before: page`)을 걸어 슬라이드형 구성으로 간다.
  3. 현재 흐름을 그대로 받아들인다.
  실제 스크린샷이 들어오면 쪽수가 다시 바뀌므로, 최종 쪽 구성은 Phase 3에서 스크린샷 비율을 정한 뒤 확정하는 편이 맞다.

## 폰트

- Type3 0개. `FontFile2` 2개, `CIDFontType2` 2개, `ToUnicode` 2개.
- BaseFont: `Pretendard-Regular`, `Pretendard-SemiBold`(6글자 서브셋 접두어 제거). Malgun Gothic 같은 대체 폰트는 없다.
- RESEARCH에서 확인한 대로 Chrome/Edge 157은 woff2도 Type3로 바꾸지 않고 TrueType으로 내보낸다. 그래도 print 전용 정적 TTF를 유지한다. 이유는 임베딩 개수가 적고(웹 폰트 조각 23개 대신 2개), 웹용 dynamic subset 92조각에 의존하지 않으며, 이후 Chrome 동작이 바뀌어도 CLAUDE.md의 "woff2/가변 폰트로 PDF 출력 금지" 규칙을 지키기 때문이다.

## 한글 텍스트

- ToUnicode를 거쳐 쪽별 본문을 추출한 결과가 PASS다: 프로젝트명 13/13, 키워드 제목 3/3, `퍼블 기여도` 라벨 포함, U+FFFD 0개.
- 추출된 프로젝트명 예시 3개: `puring`, `로드필`, `그린다`.
- 사람이 직접 복사·붙여넣기와 검색으로 확인하는 일은 02-06 체크포인트에서 한다.

## 링크

- URI 링크 7개: 외부 링크 5개(manifest의 5개 모두 포함)와 `mailto:` 2개(표지, Contact). 내부 앵커 링크는 `/Dest`로 들어 있다.
- Outlines(북마크)는 CLI 경로에서는 없다. `StructTreeRoot`는 있다(태그 PDF).

## 고정 헤더·모션

- PASS. 추출 본문에 `PORTFOLIO.` 워드마크, `메뉴`, `localhost`, `127.0.0.1`, `file:`이 없다. 고정 헤더, 햄버거, 내비, 건너뛰기 링크가 어느 쪽에도 찍히지 않았다.
- 모션은 print에서 `animation/transition/transform`을 모두 끈다. 진입 전 상태(`opacity: 0`)가 찍힌 곳은 없다.
- 키워드 섹션은 세 블록이 모두 펼쳐진 상태로 나온다.

## lazy 이미지

- 픽스처(3000px 여백 아래 `loading="lazy"` 이미지 1장)를 인쇄한 결과 PDF에 이미지 객체 1개가 들어갔다. 즉 Chrome/Edge 157의 인쇄는 lazy 이미지를 불러온다.
- 그래도 이것이 모든 환경에서 보장되는지는 알 수 없으므로(RESEARCH A5), Phase 3 빌드는 인쇄 전에 스크립트로 `loading="lazy"`를 제거하고 이미지 로드를 기다린 뒤 출력하는 것을 권고한다.

## 카드 분할

- PASS. 쪽마다 플랫폼 라벨 수와 퍼블 기여도 라벨 수가 같다. `break-inside: avoid`로 13장이 모두 한 쪽 안에 들어갔다.
- (검사기는 라벨이 독립된 텍스트 줄일 때만 센다. "플랫폼"이라는 단어가 회사 설명에도 나오기 때문이다.)

## 파일 크기

- Edge 142,639 bytes(약 139KB), Chrome 142,625 bytes. 5MB 목표의 3% 미만이다.
- 스크린샷이 들어오면 커진다. 이 값은 Phase 4 이후에 다시 측정해야 한다.

## Edge vs Chrome

- 쪽수 9쪽 동일, 쪽별 카드 분포 동일, 글꼴·링크 수·MediaBox 동일. 파일 크기는 14바이트 차이(생성 시각·Creator 문자열 차이로 보인다).
- 결론: 본 레이아웃에서 두 브라우저의 PDF는 사실상 같다.

## 권고: Phase 3는 Puppeteer로 승격, CLI는 미리보기로 유지

- Puppeteer 25로 승격한다. 이유:
  - `outline: true`로 북마크를 만든다(CLI에서는 불가).
  - 전화번호를 `page.evaluate`로 DOM에 주입해 바로 인쇄할 수 있다. CLI 경로는 임시 HTML 파일을 써야 하고, 그 파일이 저장소에 남을 위험이 있다.
  - `waitForFonts`와 이미지 로드 대기를 명시할 수 있고, 파일 크기를 폴링하지 않아도 된다.
  - 로컬 Node 22.23.4는 Puppeteer 25의 engines(>=22.12.0)를 만족한다.
- `tools/spike-pdf.mjs`(CLI)는 설치 없이 빠르게 미리보기를 볼 때만 쓴다. `tools/pdf-report.mjs`는 의존성이 없으므로 Phase 3에서도 그대로 검사기로 쓴다.
- 쪽 구성(빈 `.shot` 처리, 회사별 쪽 나눔, 9쪽 고아 푸터)은 위 쪽수 항목의 선택지에서 Phase 3가 정한다.

## 전화번호

- 슬롯(`data-slot="phone"`)은 `hidden` 상태로 비어 있다. Phase 2에서는 주입하지 않는다(주입은 Phase 3, PDF-02).
- 전화번호 가드 PASS: 추출 본문 전체에 대해 `hasPhone`과 `hasPhoneAnywhere`가 모두 false다. 이 문서와 로그에는 번호 형태의 문자열을 적지 않았다.
- print CSS에는 슬롯이 채워졌을 때의 스타일만 있다.
