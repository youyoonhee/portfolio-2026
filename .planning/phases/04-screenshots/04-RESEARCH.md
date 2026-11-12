# Phase 4: 스크린샷 통합 - Research

**Researched:** 2026-11-12
**Domain:** sharp 이미지 파이프라인(리사이즈, 마스킹, 메타데이터 제거), 반응형 이미지 마크업, 네이티브 `<dialog>` 확대 창, Chrome 인쇄 엔진의 이미지 PDF 임베딩, 도구 확장
**Confidence:** HIGH. 핵심 주장은 이 머신(Windows 11, Node v22.23.4, Chrome)에서 스크래치패드 프로토타입으로 실측했다. Safari 동작만 [ASSUMED]이다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 스크린샷은 사용자가 직접 넣는다. 위치는 `_screenshots/<프로젝트id>/`(git 제외)이고, 프로젝트 id는 `index.html`의 article id(예: `gi-oneday`, `kn-wecankids`)를 쓴다. 원본 PDF에서 이미지를 추출하지 않는다.
- **D-02:** 프로젝트당 딱 1장(대표 화면)만 쓴다. 갤러리, 넘겨 보기, 여러 장 썸네일은 만들지 않는다. 폴더에 여러 장이 있으면 어떤 파일을 쓸지 검수 체크포인트에서 사용자에게 확인한다.
- **D-03:** 스크린샷이 없는 프로젝트는 지금의 빈 프레임을 그대로 둔다(연한 회색 프레임, 앱은 세로 자리표시). 문구는 넣지 않는다. 빈 프레임은 확대 버튼이 되지 않고 지금처럼 `aria-hidden` 상태로 남는다. PDF에서는 지금처럼 숨긴다(`print.css`의 `.shot:not(:has(picture, img))`).
- **D-04:** 앱(세로, `data-frame="app"`) 화면에는 둥근 모서리와 얇은 선만 둔다. 폰 목업이나 베젤은 그리지 않는다. 카드 프레임 안에서 세로 이미지를 가운데에 둔다. 지금 `::before`로 그린 세로 자리표시와 같은 위치와 크기 감각을 유지한다.
- **D-05:** 웹(가로, `data-frame="web"`) 화면에는 테두리만 둔다. 지금 `.shot`의 얇은 선과 `--radius-md`를 유지하고, 브라우저 상단 바는 붙이지 않는다.
- **D-06:** 세로로 긴 웹 페이지 캡처는 카드에서 윗부분(첫 화면)만 보인다. 지금 CSS의 `object-fit: cover; object-position: top` 방향이다. 확대 창에서는 전체 이미지를 세로 스크롤로 본다.
- **D-07:** 스크린샷을 누르면 거의 전체 화면으로 연다. 어두운 배경(`--color-overlay` 계열) 위에 이미지를 최대한 크게 띄운다. 긴 이미지는 확대 창 안에서 세로로 스크롤한다. 모바일도 같은 방식이다.
- **D-08:** 확대 창에는 프로젝트명 한 줄과 닫기 버튼만 둔다. 플랫폼이나 기여도 같은 다른 정보는 넣지 않는다.
- **D-09:** 열고 닫을 때는 짧게 페이드한다. 배경은 흐려지고 이미지는 살짝 커지며 나타난다. `prefers-reduced-motion: reduce`이면 바로 뜨고 바로 닫힌다. Phase 3의 motion 토큰(`--dur-*`)을 쓴다.
- **SHOT-04 그대로 지킨다:** 키보드로 열기(썸네일은 버튼 또는 링크), Tab 이동이 확대 창 안에 갇힘, Esc로 닫기, 닫으면 원래 썸네일로 포커스가 돌아온다.
- **D-10:** 가릴 부분은 Claude가 찾고 칠한다. (1) 원본을 보고 가릴 곳(고객 개인정보, 내부·스테이징 URL, 관리자 계정, 전화번호와 이메일 등)을 목록으로 보여준다. (2) 사용자가 승인하면 그 좌표에 단색 박스를 칠한다. 블러는 쓰지 않는다. (3) 다시 저장해 EXIF를 지운다. (4) 최종 결과 이미지를 공개 전에 사용자에게 확인받는다. 확인을 받기 전에는 `img/projects/`에 커밋하지 않는다.
- **D-11:** 실제로 공개됐던 화면만 쓴다. 관리자, 내부, 개발 중 화면은 쓰지 않는다. 운영이 끝난 서비스의 화면은 사용자가 주면 쓴다. 공개 여부가 애매한 화면은 검수 체크포인트에서 사용자에게 묻는다.
- **D-12:** 대체 텍스트(alt)는 Claude가 초안을 쓴다. 화면에 보이는 것만 짧게 사실대로 적는다(예: "위캔키즈클럽 메인 화면"). 성과나 평가 표현은 넣지 않는다. 검수 때 사용자에게 같이 확인받는다.
- **D-13:** 이미지가 없어도 방식을 먼저 만든다. 실행 중에 스크린샷 검수 체크포인트를 둬서 사용자가 `_screenshots/`에 이미지를 넣고 마스킹을 승인할 수 있게 한다. 그 시점에 받은 이미지만 반영하고, 없는 프로젝트는 D-03대로 둔다. 나중에 받는 이미지는 같은 도구를 다시 돌려 추가할 수 있어야 한다. 반복 실행해도 결과가 같아야 하고, 한 프로젝트씩 추가할 수 있어야 한다.
- **D-14:** 제출용 PDF에는 모든 카드에 작게 스크린샷을 넣는다. 웹과 같은 프레임을 쓰고, 긴 화면은 윗부분만 넣는다. PDF는 JPEG를 쓴다(PDF 스크립트가 `<source>`를 빼고 JPEG `src`를 쓰게 한다). 용량을 재서 5MB가 넘으면 PDF용 JPEG 폭과 품질을 낮춘다. 10MB 이상이면 실패로 본다. 쪽수가 6쪽보다 늘어나는 것은 허용한다. 다만 `--page-plan`과 `pdf-report` 검사를 새 쪽수에 맞게 갱신한다.

### Claude's Discretion
- 이미지 포맷 구성. SHOT-03 기준으로 WebP와 JPEG는 필수이고 AVIF를 추가할지는 연구 후 결정한다. 폭 단계(예: 480/960/1440w), 품질값, 앱 세로 이미지의 폭 단계도 연구 후 정한다.
- 변환 도구의 이름과 구조(예: `tools/optimise-images.mjs`), 마스킹 좌표와 alt를 담는 매니페스트의 형식과 위치. 매니페스트는 공개해도 되는 정보만 담는다.
- `sharp` 설치 방식. devDependency이고 정확한 버전을 고정하며, 설치는 사용자 승인을 받는다.
- 확대 창 구현. `<dialog>`와 `showModal()`을 권장하고, 썸네일을 버튼으로 감쌀지 링크로 감쌀지와 닫기 버튼 위치를 정한다.
- 검사 도구 확장: 이미지의 `width`·`height`·`srcset`·alt 존재, EXIF가 남아 있지 않음, 확대 창 키보드 동작을 `check:ui`에 추가, PDF 용량 한도를 `pdf-report`에 추가.

### Deferred Ideas (OUT OF SCOPE)
- 프로젝트당 여러 장, 갤러리, 넘겨 보기
- OG 대표 이미지(Phase 5)
- 원본 PDF에서 이미지 추출
- (Phase 경계) 배포, noindex, Colophon, 크로스브라우저 실기기 검증은 Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOT-01 | 앱(세로)·웹(가로) 프레임 안의 실제 스크린샷 | 아래 "figure.shot 마크업", "프레임 CSS 주의점", sizes 계산 |
| SHOT-02 | 개인정보·내부 URL·관리자 계정 없음, 단색 박스 마스킹, EXIF 제거 | 파이프라인 순서(회전, 마스크, 크롭, 리사이즈), 메타데이터 검증(실측), 검수 체크리스트, 승인 게이트 |
| SHOT-03 | WebP/JPEG 다중 폭, `width`·`height`·`srcset`·alt | sharp 0.35.5 설정, 폭 사다리, 마크업 생성, `check-content` `shots` 검사 |
| SHOT-04 | 키보드로 다루는 확대 창, 포커스 복귀 | `<dialog>` 실측(Chrome), 코드 예시, `check-ui` 시나리오 |
| PDF-05 | PDF 5MB 이하 목표, 10MB 미만 | JPEG DCT 패스스루 실측, 빌더 변경, 폭 사다리, `pdf-report` 용량 검사 |
</phase_requirements>

## Summary

이 phase는 이미지가 0장인 상태에서 "방식"을 완성해야 한다. 그래서 설계의 중심은 (1) 원본이 들어올 때마다 같은 결과를 내는 결정적 변환 도구, (2) `index.html`의 빈 `figure.shot`을 안전하게 채우고 비우는 마크업 생성기, (3) 합성 이미지(저장소에 커밋하지 않음)로 이 전체를 검증하는 자체 테스트, (4) 사용자의 마스킹 승인이 없으면 공개 폴더에 아무것도 쓰지 않는 승인 게이트다.

이 머신에서 실측한 핵심은 세 가지다. 첫째, sharp 0.35.5는 Windows x64 prebuilt가 설치되고(컴파일 없음, postinstall 스크립트 없음), 기본 출력에서 EXIF·ICC·XMP·IPTC가 모두 사라지며(`keepMetadata()`를 부르면 남음), 같은 입력에서 같은 바이트가 나온다. 둘째, Chrome 인쇄는 JPEG를 DCT 그대로 임베딩하지만(같은 이미지 6번 사용에도 객체 1개, PDF 99.5KB) WebP와 AVIF는 Flate로 재인코딩해 PDF가 4.8배(474KB), 1.6배(163KB)로 커진다. 그래서 PDF용 `<source>` 제거와 `srcset` 제거는 필수다. 셋째, 네이티브 `<dialog>`는 포커스 복귀, 초기 포커스(`autofocus`), Esc, 백드롭 클릭, 페이드 인·아웃(`@starting-style` + `data-closing` + `transitionend`)이 모두 계획대로 동작한다.

**Primary recommendation:** `sharp@0.35.5`를 정확히 고정해 API로 쓴다(CLI 아님). 포맷은 WebP+JPEG만(AVIF 제외). 도구 하나(`tools/optimise-images.mjs`)와 커밋되는 매니페스트(`tools/screenshots.json`)로 "회전 → 단색 박스 → 크롭 → 리사이즈 → 재인코딩"을 하고, `figure.shot` 하나만 정규식으로 다시 쓴다. 검증은 합성 이미지 자체 테스트(`--self-test`)와 요청 가로채기 픽스처(check-ui)로 하고, 실제 이미지는 승인 체크포인트에서만 공개 폴더로 들어간다.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 마스킹, 리사이즈, 재인코딩, EXIF 제거 | 로컬 Node 도구(빌드 타임) | — | 사이트에는 sharp가 로드되지 않는다. 결과 파일만 커밋한다. |
| 프레임, 썸네일 hover, 반응형 이미지 선택 | Browser(HTML/CSS) | — | `<picture>`, `srcset`, `sizes`, container query는 마크업과 CSS로 해결한다. |
| 확대 창 열기·닫기·포커스 | Browser(JS 최소) + 네이티브 `<dialog>` | — | 포커스 트랩, 인ert, Esc는 브라우저가 제공한다. JS는 열기, 닫기 전환, 포커스 복귀만 한다. |
| no-JS 폴백 | Browser(HTML) | — | `a.shot-link` → 큰 JPEG 링크. JS가 버튼으로 승격한다. |
| 공개 전 검수 게이트 | 매니페스트 `status` + 도구 거부 + 사람 체크포인트 | check 스크립트 | 코드로 막을 수 있는 것은 막고, 판단은 사용자가 한다. |
| PDF 이미지 처리, 용량 | Puppeteer 빌더(로컬) | pdf-report(검증) | 인쇄 전에 DOM을 정리하고(소스 제거, lazy 제거, decode) 결과 용량을 잰다. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sharp | **0.35.5** (npm latest, modified 2026-09-27) | 리사이즈, WebP/JPEG 인코딩, 합성(단색 박스), 메타데이터 제거 | libvips 기반, Windows x64 prebuilt(`@img/sharp-win32-x64`)가 있어 컴파일이 필요 없다. `engines.node >=20.9.0`이라 현재 Node v22.23.4에서 동작한다. Apache-2.0, 의존성은 `semver`, `@img/colour`, `detect-libc`뿐이다. [VERIFIED: npm view, 스크래치패드 설치·실행] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| puppeteer-core | 25.17.0 (이미 설치) | check-ui 확대 창 시나리오, build-pdf | 기존 `tools/lib/browser.mjs` 그대로 |
| html-validate | 11.21.0 (이미 설치) | 새 마크업 검증 | 아래 마크업은 현재 `.htmlvalidate.json`으로 오류 0건 (doctype 대소문자만 내 픽스처 문제) [VERIFIED: 실행] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp API | sharp-cli 6.1.0 (CLAUDE.md 기재) | CLI는 단색 박스 합성, 매니페스트, 해시 비교가 안 된다. **API를 쓴다.** CLAUDE.md는 "sharp-cli/sharp" 둘 다 허용한다. sharp-cli를 추가로 설치하지 않는다. |
| WebP+JPEG | AVIF 추가 | **제외한다.** 아래 "AVIF 결정" 참조. |
| 정규식으로 `figure.shot`만 교체 | 마커 주석 13쌍 | 마커는 HTML을 지저분하게 하고 `check-content`의 자식 순서·빈 슬롯 검사와 충돌 소지가 있다. `figure[data-slot="screenshot"]` 자체가 앵커다. |

**Installation (사용자 승인 후, 한 번):**
```bash
npm i -D -E sharp@0.35.5     # -E = 정확한 버전 고정. package-lock에 @img/* optional deps가 추가된다 (정상)
```

**AVIF 결정 (Claude's Discretion 해결):** 쓰지 않는다. 근거: (1) SHOT-03이 WebP/JPEG만 요구한다. (2) WebP는 대상 브라우저 전부 Baseline이다. (3) 파일 수가 폭×3포맷으로 늘어 저장소가 무거워지고 libvips 버전에 따른 바이트 변동 위험이 커진다. (4) PDF는 어차피 JPEG를 쓴다. (5) 합성 이미지 실측에서 AVIF 960w가 14.5KB, WebP가 41KB였지만 이는 합성 이미지라 실제 비율은 아니다 [LOW]. 용량이 문제가 되면 도구에 `--avif` 플래그로 나중에 추가할 수 있게 포맷 목록을 배열로 둔다.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| sharp 0.35.5 | npm | 13 yrs (2013-08) | 161,679,063/week (2026-11-05..11) | github.com/lovell/sharp | not run (slopcheck 설치가 도구 권한 정책으로 거부됨) | Approved by evidence below; `[ASSUMED]` 규칙에 따라 planner는 설치 전 `checkpoint:human-verify` 유지 (이미 D에서 "설치는 사용자 승인"으로 잠겨 있음) |

- 레지스트리 확인: `npm view sharp@0.35.5` 버전·저장소·라이선스·의존성 확인. `scripts.install`/`scripts.postinstall` 출력 없음 (설치 스크립트 없음). 스크래치패드에서 `npm i sharp@0.35.5`가 8개 패키지를 6초에 설치했고 `sharp.versions`에 vips 8.18.7, webp 1.6.0, mozjpeg, aom(AVIF) 포함을 확인했다.
- 패키지 이름은 CLAUDE.md(프로젝트 스택 문서)와 `.planning/research/SUMMARY.md`가 이미 지정한 것이다.
- **Packages removed:** none. **Packages flagged [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 _screenshots/<id>/*.png|jpg|webp   (git 제외, 사용자가 넣음)
            |
            v
   tools/optimise-images.mjs  <---- tools/screenshots.json (커밋, 공개 가능한 정보만)
   [--info] [--annotate] [--preview] [--only id] [--check] [--self-test]
            |   읽기: index.html (article id, h3, data-frame)
            |
   +--------+-----------------------------------------------------------+
   | 1 rotate(EXIF 방향 적용) -> 2 flatten(흰 배경) -> 3 단색 박스(원본 좌표)
   | -> 4 crop(선택) -> 5 resize(폭 사다리, 확대 금지) -> 6 WebP + JPEG 인코딩
   |    (기본 출력은 메타데이터 없음)
   +--------+-----------------------------------------------------------+
            |                                   |
   status != approved                   status == approved
            v                                   v
   dist/shots-preview/<id>/ (gitignore)   img/projects/<id>/<id>-<w>.{webp,jpg}
   + annotated 격자 이미지                  + index.html figure.shot 재작성
   (사용자·Claude 검수용)                          |
                                                   v
        +---------------- 브라우저 -----------------+        +------ build-pdf ------+
        | figure.shot > a.shot-link > picture      |        | <source> 제거          |
        |   source(webp srcset) + img(jpg srcset)  |        | srcset/sizes 제거      |
        | JS: a -> button, 공유 <dialog> showModal  |        | lazy 제거, decode()    |
        | no-JS: a -> 1920 jpg                      |        | a[href] 제거           |
        +-------------------------------------------+        | 용량 측정 -> 사다리    |
                                                             +-----------------------+
```

### Recommended Project Structure
```
tools/
├── optimise-images.mjs     # 변환 + 마크업 + 미리보기 + 자체 테스트
├── screenshots.json        # 매니페스트 (커밋)
├── check-images.mjs        # 산출물 감사 (메타데이터, 치수, 승인, 고아 파일)
└── lib/shot-markup.mjs     # figure.shot 마크업 생성 + 교체 (optimise-images와 check가 공유)
img/projects/<id>/<id>-<w>.webp|jpg    # 소문자 kebab-case, 확장자 webp/jpg (check-repo 허용)
_screenshots/<id>/          # 원본 (gitignore)
dist/shots-preview/         # 검수용 미리보기 (gitignore)
```

### 변환 파이프라인 (실측 검증됨)

**순서가 중요하다.** 마스크 좌표는 항상 "EXIF 방향을 적용한 원본 픽셀 좌표"이고, 크롭과 리사이즈보다 먼저 칠한다. 그래야 좌표가 크롭·폭 설정과 무관하다.

```js
// Source: 스크래치패드 spike.mjs (sharp 0.35.5, Windows, Node 22.23.4)에서 실행해 확인
import sharp from 'sharp';

const MASK = '#111827';                       // --color-ink, 단색 박스 (블러 금지)
const WEB_W = [480, 960, 1440, 1920];
const APP_W = [360, 540, 720, 1080];

async function render(srcPath, entry, frame) {
  const meta = await sharp(srcPath).rotate().metadata();   // rotate()가 방향 적용 후 크기 확정
  const buf = await sharp(srcPath)
    .rotate()                                  // EXIF Orientation 적용 (이후 메타데이터는 버려진다)
    .flatten({ background: '#ffffff' })        // 알파 PNG를 JPEG로 낼 때 검은 배경 방지
    .toColourspace('srgb')
    .composite(entry.masks.map(m => ({
      input: { create: { width: m.w, height: m.h, channels: 3, background: MASK } },
      left: m.x, top: m.y,
    })))
    .png().toBuffer();                         // 마스크가 구워진 중간본 (메모리에만 존재)
  let img = sharp(buf);
  if (entry.crop) img = sharp(await img.extract({ left: entry.crop.x, top: entry.crop.y, width: entry.crop.w, height: entry.crop.h }).png().toBuffer());
  // 폭 사다리: 원본보다 큰 폭은 만들지 않고, 마지막 폭은 실제 최대폭으로 이름 붙인다
  const srcW = entry.crop ? entry.crop.w : meta.width;
  const ladder = frame === 'app' ? APP_W : WEB_W;
  const widths = [...new Set(ladder.map(w => Math.min(w, srcW)))];
  const out = {};
  for (const w of widths) {
    const r = sharp(await img.clone().resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' }).png().toBuffer());
    out[`${w}.webp`] = await r.clone().webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer();
    out[`${w}.jpg`]  = await r.clone().jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  }
  return { out, widths, width: srcW, height: entry.crop ? entry.crop.h : meta.height };
}
```

**실측 결과 (합성 1440x3000 UI 이미지, P3 ICC + EXIF 포함 JPEG 입력):**
- 모든 출력(WebP 480/960/1440, JPEG 480/960/1440, AVIF 960)에서 `metadata()`의 `exif`, `icc`, `xmp`, `iptc`가 모두 없음, `hasProfile: false`, `space: 'srgb'`. 출력 바이트에 입력 EXIF 문자열(`testtool`, `Exif`)과 WebP의 `EXIF`/`ICCP` 청크도 없다. [VERIFIED: 실행]
- `.keepMetadata()`를 호출하면 `icc`와 `exif`가 다시 생긴다. 즉 **기본값이 안전하고, `keepMetadata`/`withMetadata`는 코드와 감사에서 금지**해야 한다. 공식 문서도 같은 설명이다: "convert to the device-independent sRGB colour space and strip all metadata". [CITED: sharp.pixelplumbing.com/api-output]
- 같은 입력을 두 번 처리하면 모든 출력의 SHA-1이 동일했다(결정적). 같은 머신·같은 sharp 버전에서의 확인이므로, 다른 머신에서의 바이트 동일은 보장되지 않는다. sharp 버전을 정확히 고정하고, 재실행은 `--only <id>`로 필요한 프로젝트만 하고, 감사는 바이트가 아니라 "메타데이터 없음·치수·참조 무결성"으로 한다. [VERIFIED 동일 머신 / ASSUMED 다른 머신]
- 마스크 픽셀: 박스 안 `(100,60)`의 JPEG 디코드 값이 `[17,24,40]`(= `#111827`, JPEG 오차 1~2 이내). 박스는 완전 불투명이므로 아래 내용은 복원되지 않는다. [VERIFIED]
- 크기 참고(합성 이미지라 실제와 다름): 1440w WebP 173KB / JPEG 226KB, 960w WebP 98KB / JPEG 123KB, 480w 32KB / 43KB.

**품질 값은 시작값이다.** 체크포인트에서 사용자가 실제 결과를 보고 글씨가 번지지 않는지 확인한다. UI 스크린샷은 작은 글씨가 많아 JPEG `4:4:4`, WebP `smartSubsample: true`를 켠다(CLAUDE.md 4:4:4 지침과 일치; `smartSubsample`은 공식 옵션이지만 이 머신에서 단독 비교하지 않았다 [ASSUMED 효과]).

**ICC/색:** 입력이 Display P3 등이면 sharp가 sRGB로 변환하고 프로파일을 붙이지 않는다(위 실측: P3 입력 → 출력 `space: srgb`, `icc` 없음). 작은 색 차이는 허용한다. 입력이 CMYK나 16비트라면 `toColourspace('srgb')`가 처리한다.

**함정:**
- 입력 형식: PNG, JPEG, WebP는 문제없다. **HEIC/HEIF는 prebuilt sharp가 읽지 못한다**(특허 코덱 제외). 아이폰 캡처가 HEIC면 사용자에게 PNG/JPEG로 내보내 달라고 한다. [ASSUMED: sharp 문서의 일반 설명, 이 머신에서 HEIC 입력을 실행해 보지 않음]
- WebP 한 변 최대 16383px. 웹 1920폭에서 높이가 16383을 넘는(비율 1:8.5 이상) 풀페이지 캡처는 인코딩이 실패한다. 도구가 결과 높이를 검사해 "크롭하라"는 메시지로 실패시킨다. [ASSUMED: libwebp 한계, 도구에서 가드]
- 한국어 파일명은 NFC/NFD가 다를 수 있다. 매니페스트의 `source`를 `normalize('NFC')`로 비교한다.
- 프로젝트 폴더에 이미지가 여러 장이면 `source`가 매니페스트에 없을 때 실패하고 목록을 보여준다(D-02).

### 폭 사다리와 `sizes` (실제 CSS에서 계산)

`css/layout.css`: `main > section` 폭 = `min(100% - 2*gutter, 1200px)`, `gutter = clamp(16px, 5vw, 32px)`. `.company`가 `container: company / inline-size`이고 카드 그리드는 컨테이너 폭 ≥600px에서 2열(gap 24), ≥920px에서 3열. 카드 padding은 16px(컨테이너 <600) 또는 24px, 테두리 1px. 썸네일 프레임 폭 = 카드 내부 폭이다.

| 뷰포트 | 컨테이너 | 열 | 프레임 폭 (CSS px) |
|--------|----------|----|--------------------|
| 375 | 337.5 | 1 | 약 303 |
| 663 (1열 최대) | 599 | 1 | 약 565 |
| 664 (2열 시작) | 600 | 2 | 약 238 |
| 983 (2열 최대) | 919 | 2 | 약 397 |
| 984 (3열 시작) | 920 | 3 | 약 241 |
| 1264+ | 1200 | 3 | 334 |

**웹 `sizes`** (뷰포트 미디어 쿼리 기준이라 컨테이너 쿼리와 약간 어긋나지만 과대 추정 쪽으로만 틀리게 설계):
```
(min-width: 1264px) 334px,
(min-width: 984px) calc((100vw - 112px) / 3 - 50px),
(min-width: 664px) calc(50vw - 94px),
calc(90vw - 34px)
```
최대 약 565px이므로 DPR2에서도 1130px이면 충분하다. 1440w까지가 카드용이고 **1920w는 확대 창과 no-JS 링크 전용**이다.
**앱 `sizes`:** `200px`(상자 폭은 `min(200px, 프레임 폭 x 0.35)`이므로 200이 상한). 앱 폭 사다리 360/540/720/1080에서 DPR1은 360, DPR2는 540, DPR3은 720을 고른다. 1080은 확대 창용이다.

이 값은 손으로 계산한 것이므로 `check-layout`에 `shot-sizes` 검사를 추가해 검증한다: 뷰포트 [360, 414, 640, 700, 768, 983, 984, 1024, 1264, 1440]에서 빈 `.shot`(13개 모두 이미 DOM에 있음)의 `clientWidth`를 재고, 위 `sizes` 식을 프로브 `div`에 적용해 얻은 폭이 실제보다 작지 않은지(과소 추정 금지) 본다. 앱은 200 이하인지 본다.

### `figure.shot` 마크업 생성 (SHOT-01/03)

도구가 `<article ... id="ID" ...>`부터 첫 `<figure class="shot" ...>…</figure>`까지를 정규식으로 찾아 그 figure만 교체한다. 정확히 1건이 아니면 실패한다. 결과가 항상 같으므로 반복 실행해도 diff가 없다. 이미지가 없는 프로젝트를 되돌리는 `--clear <id>`도 지원한다(빈 마크업 복원).

```html
<!-- 빈 프레임 (현재, 그대로 유지) -->
<figure class="shot" data-slot="screenshot" data-frame="web" aria-hidden="true"></figure>

<!-- 이미지 있음 (no-JS 상태) -->
<figure class="shot" data-slot="screenshot" data-frame="web">
  <a class="shot-link" href="img/projects/gi-event/gi-event-1920.jpg" aria-label="이벤트페이지등록 화면 크게 보기">
    <picture>
      <source type="image/webp" srcset="img/projects/gi-event/gi-event-480.webp 480w, img/projects/gi-event/gi-event-960.webp 960w, img/projects/gi-event/gi-event-1440.webp 1440w, img/projects/gi-event/gi-event-1920.webp 1920w" sizes="(min-width: 1264px) 334px, calc((100vw - 112px) / 3 - 50px)...">
      <img src="img/projects/gi-event/gi-event-960.jpg" srcset="...jpg 480w, ...jpg 960w, ...jpg 1440w, ...jpg 1920w" sizes="(same)" alt="이벤트 등록 화면" width="960" height="1600" loading="lazy" decoding="async">
    </picture>
  </a>
</figure>
```

규칙:
- `aria-label`의 프로젝트명은 **도구가 같은 article의 `h3` 텍스트에서 읽는다**(수작업 불일치 방지). `check-content`가 다시 대조한다.
- `width`/`height`는 `src`(웹 960, 앱 540)로 쓰는 JPEG의 실제 치수다. `height = round(width x H / W)`.
- `srcset`에는 1920(웹)/1080(앱)까지 모두 넣는다. 확대 창은 이 `<picture>`를 복제해 `sizes="100vw"`로 바꾸기만 하면 되므로 추가 data 속성이 필요 없다.
- `src` 기본 JPEG는 PDF가 그대로 쓰기 좋은 폭(웹 960, 앱 540)으로 둔다.
- 모든 카드 이미지는 `loading="lazy" decoding="async"`다. 13개 카드는 히어로·키워드 아래에 있어 첫 화면에 없으므로 UI-SPEC의 "첫 카드만 eager"는 적용하지 않는 편이 CLAUDE.md 지침(첫 화면 밖은 lazy)에 맞다. `fetchpriority`는 쓰지 않는다. [DISCRETION]
- 속성 순서·들여쓰기(10칸)를 도구가 고정해 diff를 안정시킨다.
- html-validate: 위 구조는 `.htmlvalidate.json`(recommended + a11y)에서 오류 0건이었다 [VERIFIED]. 링크에 `aria-label`이 있고 `img alt`도 있어도 규칙에 걸리지 않는다. 확대 창은 JS로 만들어 `index.html`에 들어가지 않으므로 `<dialog>` 규칙은 정적 검증 대상이 아니다.

### 프레임 CSS 주의점 (UI-SPEC 구현 시 실제로 막히는 곳)

1. **`picture`는 기본이 `display: inline`이다.** 기존 `.shot picture, img { inline-size:100%; block-size:100% }`는 inline에서 무시된다. `picture { display: block }`을 추가한다.
2. **`dialog`에 `display`를 직접 주지 않는다.** 스파이크에서 `.shot-dialog { display: grid }`를 `[open]` 없이 썼더니 닫힌 dialog가 `opacity:0`인 채 화면을 덮고 클릭을 가로챘다. `display`는 반드시 `.shot-dialog[open]`에만 준다.
3. 카드 lift 선택자 `.project:has(a):hover` → `:has(a, .shot-link)`로 확장한다(UI-SPEC가 지시). no-JS의 `a.shot-link`는 `:has(a)`에도 걸리므로, 이미지가 있는 카드가 전부 lift하게 된다. 의도된 동작이다.
4. `.shot-link` 버튼 리셋(`padding:0; border:0; background:none; font:inherit; color:inherit; cursor: zoom-in`)을 잊으면 UA 버튼 스타일이 보인다.
5. `.shot[data-frame="app"]:has(.shot-link)::before { content: none }` 로 자리표시를 끄고, 앱 상자는 `.shot-link`가 그린다(UI-SPEC 그대로).
6. 인쇄: `.shot-link { cursor: auto }`, `.shot-dialog { display:none !important }`. `print.css`의 `.shot:not(:has(picture, img))` 규칙은 그대로 둔다.

### 확대 창 (`<dialog>`) — Chrome에서 실측

구조는 UI-SPEC 그대로. 프로토타입(스크래치패드 `dlg.html`)을 헤드리스 Chrome에서 돌려 확인한 것:

| 항목 | 결과 |
|------|------|
| 초기 포커스 | `autofocus`가 달린 닫기 버튼으로 간다 |
| 열기/닫기 페이드 | `@starting-style` + `opacity` 전환이 동작. 열 때 30ms 0.07 → 100ms 0.87 → 200ms 1. 닫을 때 `data-closing`을 붙이고 `transitionend`(또는 250ms 폴백)에서 `close()`하면 0.78 → 0.04 → 0 |
| `::backdrop` | dialog의 `opacity`를 상속해서 같이 페이드한다. 단, 명시적으로 `::backdrop` 전환과 `[data-closing]::backdrop { opacity: 0 }`도 써 두는 편이 안전하다 |
| Tab | 닫기 버튼 → 스크롤 영역(Chrome은 스크롤 가능한 영역을 기본 포커스 가능하게 만든다) → `BODY`(브라우저 UI로 빠짐) → 다시 닫기. **페이지 뒤쪽 요소(썸네일 버튼)로는 가지 않는다**(inert). 이것이 네이티브 "갇힘"의 실제 모양이다 |
| Esc | `cancel` 이벤트 후 `close`. `cancel`에서 `preventDefault()`하고 직접 페이드 후 `close()`해도 된다. Esc 두 번을 빠르게 눌러도 `close`는 한 번만 발생했다(가드된 `closeIt()` 덕분) |
| 백드롭 클릭 | dialog가 inset 영역 전체를 차지하고 배경이 투명하므로 `e.target === dialog`이면 백드롭(또는 바 밖 빈 곳) 클릭이다. 이미지·바 클릭은 target이 자식이라 닫히지 않는다 |
| 포커스 복귀 | `close()` 후 열었던 버튼으로 돌아갔다. 저장한 참조에 `focus({preventScroll:true})`를 명시적으로 한 번 더 호출해 둔다 |
| 스크롤 잠금 | `html:has(dialog.shot-dialog[open]) { overflow: hidden }`로 `scrollY`가 유지됐다 |

**`closedby` 속성은 쓰지 않는다.** MDN BCD 8.1.8: Chrome/Edge 134, Firefox 141, **Safari는 preview(iOS 없음)**. 백드롭 클릭은 JS로 처리한다. `requestClose()`도 Safari 18.4+라서 쓰지 않고 `closeIt()`을 직접 쓴다. `showModal()`은 Chrome 37, Safari/iOS 15.4, Firefox 98로 대상 환경에서 모두 된다. [VERIFIED: MDN BCD 8.1.8 JSON]

**테스트 가능한 계약:** 위 표의 Tab 결과가 곧 `check-ui`의 판정 기준이다. "Tab을 여러 번 눌러도 `document.activeElement`가 dialog 안 요소이거나 `BODY`이고, 썸네일 버튼이나 다른 페이지 요소가 아니다"로 검사한다. (Puppeteer의 headless에서는 브라우저 UI로 빠질 때 `BODY`가 보인다.)

```js
// Source: 스크래치패드 dlg.html에서 실측한 패턴 (js/main.js에 맞게 정리)
function initShots() {
  if (!(window.HTMLDialogElement && 'showModal' in HTMLDialogElement.prototype)) return;   // 미지원: 링크로 남김
  const links = [...document.querySelectorAll('a.shot-link')];
  if (!links.length) return;
  const dlg = buildDialog();                        // dialog.shot-dialog 생성, body에 append (예외는 여기서 먼저 난다)
  let opener = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  function open(btn) {
    opener = btn;
    const pic = btn.querySelector('picture').cloneNode(true);
    for (const s of pic.querySelectorAll('source, img')) s.sizes = '100vw';
    const img = pic.querySelector('img');
    img.removeAttribute('loading'); img.alt = img.alt;           // alt는 썸네일 것을 그대로
    dlg.querySelector('.shot-dialog-title').textContent = btn.closest('article').querySelector('h3').textContent;
    dlg.querySelector('.shot-dialog-scroll').replaceChildren(pic);
    dlg.showModal();
    const sc = dlg.querySelector('.shot-dialog-scroll');
    const over = sc.scrollHeight > sc.clientHeight;              // 넘칠 때만 포커스 가능 + 이름
    over ? (sc.tabIndex = 0, sc.setAttribute('role', 'region'), sc.setAttribute('aria-label', dlg.querySelector('.shot-dialog-title').textContent))
         : (sc.removeAttribute('tabindex'), sc.removeAttribute('role'), sc.removeAttribute('aria-label'));
  }
  function closeIt() {
    if (!dlg.open || dlg.dataset.closing) return;
    if (reduce.matches) return finish();
    dlg.dataset.closing = 'true';
    const t = setTimeout(finish, 250);                           // transitionend 폴백 (--dur 200ms + 50)
    dlg.addEventListener('transitionend', function f(e) {
      if (e.target === dlg && e.propertyName === 'opacity') { clearTimeout(t); dlg.removeEventListener('transitionend', f); finish(); }
    });
  }
  function finish() { delete dlg.dataset.closing; if (dlg.open) dlg.close(); opener?.focus({ preventScroll: true }); }

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeIt(); });   // Esc
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeIt(); });  // 백드롭
  dlg.querySelector('.shot-dialog-close').addEventListener('click', closeIt);
  // 마지막에 승격: 위에서 예외가 났다면 링크가 그대로 남는다
  for (const a of links) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = a.className; b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-label', a.getAttribute('aria-label'));
    b.append(...a.childNodes);
    b.addEventListener('click', () => open(b));
    a.replaceWith(b);
  }
}
```
`initShots()`는 기존 `init()`의 끝에서 호출한다(try/catch 안). 승격 루프가 맨 마지막이므로 앞에서 던지면 링크는 그대로 남는다. 헤더 숨김 로직은 dialog가 열려 있는 동안 스크롤이 잠기므로 영향이 없다.

`transition-behavior: allow-discrete`로 `display`/`overlay` 전환을 켜는 것은 선택이다. 스파이크는 이를 켠 상태에서 정상이었고, 미지원 브라우저는 페이드 없이 나타나고 사라질 뿐이다.

### Anti-Patterns to Avoid
- **`keepMetadata()`/`withMetadata()` 사용:** 메타데이터가 되살아난다. 도구와 감사에서 금지.
- **마스크를 리사이즈 후 좌표로 칠하기:** 폭마다 좌표가 달라진다. 항상 원본(회전 후) 좌표.
- **블러/픽셀화 마스크:** 복원 가능성이 있다. 단색 불투명 박스만.
- **WebP/AVIF를 PDF에 그대로 두기:** 4.8배로 커진다(아래 실측).
- **`dialog`에 무조건 `display` 지정:** 닫힌 dialog가 클릭을 막는다.
- **원본 파일명을 매니페스트·산출물 이름에 쓰기:** 출력 이름은 항상 `<id>-<폭>.<ext>`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 포커스 트랩, 배경 inert, Esc | 커스텀 트랩 JS | `dialog.showModal()` | 브라우저가 top layer와 inert를 제공한다. 실측 확인 |
| 메타데이터 제거 | EXIF 바이트 편집 | sharp 기본 출력(재인코딩) | 재인코딩이 가장 확실하다. 실측 확인 |
| 이미지 합성/마스크 | Canvas, 직접 픽셀 조작 | `composite()` + `create` | 한 줄이고 불투명이 보장된다 |
| 반응형 이미지 선택 | JS로 src 교체 | `<picture>` + `srcset` + `sizes` | 브라우저가 DPR과 폭을 고려한다 |
| 감사용 EXIF 검사 | 정규식으로 문자열 찾기 | 컨테이너 구조 파싱(JPEG 세그먼트, RIFF 청크) + sharp `metadata()` 교차 확인 | 문자열 검색은 놓친다 |

**Key insight:** 이 phase의 위험은 코드 복잡성이 아니라 "민감 정보가 공개 폴더로 새는 경로"다. 승인 게이트와 감사가 코드보다 중요하다.

## 매니페스트 설계 (`tools/screenshots.json`)

공개해도 되는 정보만 담는다: id, 프레임, 파일 이름(원본 경로 아님), 마스크 좌표와 **일반적인 사유 분류**(예: `person-name`), alt, 승인 상태. **마스크 안에 가려진 실제 텍스트는 절대 적지 않는다.**

```json
{
  "version": 1,
  "projects": {
    "gi-event": {
      "source": "main.png",
      "crop": null,
      "masks": [
        { "x": 120, "y": 64, "w": 480, "h": 40, "kind": "internal-url" },
        { "x": 900, "y": 20, "w": 220, "h": 36, "kind": "account" }
      ],
      "alt": "이벤트 등록 화면",
      "status": "draft"
    }
  }
}
```
- `status`: `draft`(미리보기만) → `approved`(사용자가 마스크·alt·최종 이미지를 확인). `approved`가 아닌 항목은 `img/projects/`와 `index.html`을 건드리지 않는다.
- `frame`은 `index.html`의 `data-frame`에서 읽는다(중복 저장 금지). 프로젝트명도 `h3`에서 읽는다.
- `kind` 허용값: `person-name`, `phone`, `email`, `internal-url`, `account`, `id-number`, `status-bar`, `other`. `check-images`가 허용값 외를 거부한다.
- `source`는 파일명만(디렉터리 없음). 한 프로젝트씩 추가·재실행이 가능하다(`--only gi-event`).
- 좌표를 정하는 방법: 도구의 `--info <id>`가 회전 적용 후 치수를 출력하고, `--annotate <id>`가 `dist/shots-preview/<id>-grid.png`에 100px 격자와 번호 라벨, 기존 마스크 후보를 그려 준다. Claude는 이 이미지를 보고 원본 픽셀 좌표를 읽는다. (이 파일은 PII가 보이는 원본 기반이므로 `dist/`(gitignore)에만 쓰고 커밋·공유하지 않는다.)

## 검수 체크리스트 (SHOT-02, 사용자 체크포인트에서 사용)

화면별로 다음을 확인하고 한 항목이라도 있으면 박스로 가리거나 그 화면을 쓰지 않는다.
1. 고객·회원의 이름, 전화번호, 이메일, 주소, 계약·주문·회원 번호
2. 주소창의 내부·스테이징·개발 URL, 탭 제목, 북마크 바
3. 관리자 계정명, 사내 계정, 관리자 메뉴 (D-11: 관리자 화면 자체를 쓰지 않음)
4. 휴대폰 상태바(시간, 통신사, 알림), 메신저·알림 팝업
5. 미공개 상품명·가격·프로모션 코드
6. 공개 범위가 애매한 화면은 사용 전에 사용자에게 질문
7. 최종 이미지(1920/1440w)를 사람이 한 번 더 확인한다(마스크 누락, 박스 위치 어긋남)
8. alt 초안 확인

## Runtime State Inventory

해당 없음(rename/refactor 아님). 새 상태: `img/projects/`, `tools/screenshots.json`, `index.html` 13개 `figure.shot`, `dist/shots-preview/`(gitignore). 저장소 밖 상태 없음.

## Common Pitfalls

### Pitfall 1: PDF에 로컬 링크 주석이 생긴다
**What goes wrong:** 이미지가 들어가면 `a.shot-link href="img/..."`가 Chrome PDF에서 `http://127.0.0.1:포트/img/...`를 가리키는 링크 주석이 된다. 제출 PDF에 죽은 localhost 링크가 남는다.
**Why:** 빌더 페이지에서 main.js가 이미 버튼으로 승격하면 안 생기지만, JS 실패나 순서에 기대면 안 된다.
**How to avoid:** build-pdf가 인쇄 전에 `a.shot-link`의 `href`를 제거하고(또는 자식으로 풀어쓰기), `pdf-report`가 `127.0.0.1`/`localhost`를 포함한 URI가 없음을 검사한다(현재는 텍스트만 검사).
**Warning signs:** `pdf-report`의 uriCount가 manifest.links 개수보다 많다.

### Pitfall 2: 매니페스트·산출물을 통한 PII 유출
**What goes wrong:** `masks`에 가린 글자를 메모하거나, 원본 파일명(`홍길동_계약.png`)이 매니페스트에 들어간다.
**How to avoid:** `kind` 분류만 허용, `source`는 승인 시 검토, `check-images`가 매니페스트의 모든 문자열 필드에 `hasPhone`을 적용. `check-repo`는 이미 매니페스트 JSON(텍스트)을 스캔한다.

### Pitfall 3: 마스크가 이미지 밖이거나 크롭과 겹쳐 일부만 가려진다
**How to avoid:** 도구가 마스크 사각형이 `[0,width]x[0,height]` 안인지 검사해 실패시킨다. 크롭 후 영역과 마스크가 부분 교차하면(잘리는 마스크) 경고 대신 실패한다. 크롭은 마스크 뒤에 적용되므로 크롭에서 제외된 마스크는 무해하다.

### Pitfall 4: lazy 이미지가 PDF에 비어 찍힘
**How to avoid:** 이미 Phase 3 빌더가 `loading` 제거 + `decode()`를 한다. 단 `srcset`이 있는 이미지는 `decode()` 시점에 선택된 후보가 인쇄 후보와 다를 수 있으므로, 아래 PDF 절처럼 `srcset/sizes`를 제거하고 `src`를 고정한 뒤 decode한다.

### Pitfall 5: 앱 캡처가 9:16이 아니다
`object-fit: cover`로 아래가 잘린다. 허용(UI-SPEC)이지만 체크포인트에서 사용자가 확인하게 하고, 도구가 앱 이미지의 비율이 9:16에서 15% 넘게 벗어나면 경고를 출력한다.

### Pitfall 6: 풀페이지 세로 캡처의 용량
1920w x 매우 긴 이미지는 JPEG 한 장이 수 MB가 될 수 있다. 도구가 파일당 상한(예: 1920w는 1.5MB, 나머지는 600KB)을 넘으면 경고하고 `check-images`가 실패시킨다. 해결은 크롭 또는 품질 조정이다.

### Pitfall 7: 이미지가 있는 카드의 페이지 분할
`.project { break-inside: avoid }`가 이미 있다. 이미지 추가로 카드가 커져 쪽 수와 빈 공백이 달라진다. 실제 쪽 수는 이미지가 들어간 뒤에 측정하고 `--page-plan`은 쪽 번호가 아니라 "회사 순서·시작 쪽 ≥3·연락처가 마지막"만 보므로(현재 구현을 읽어 확인) 6쪽 하드코딩은 없다. 새로 필요한 것은 쪽 수 상한 정도다.

## PDF 이미지 처리 (PDF-05) — 실측

스크래치패드에서 A4, 85x53mm 크기로 같은 이미지(960w)를 6번 넣고 headless Chrome `page.pdf()`로 만든 결과:

| 입력 | PDF 크기 | `/DCTDecode` | `/FlateDecode` | 이미지 객체 |
|------|----------|--------------|----------------|--------------|
| JPEG 96,105B | **99,536B** | 1 | 3 | 1 |
| WebP 41,148B | 474,656B | 0 | 4 | 1 |
| AVIF 14,525B | 163,006B | 0 | 4 | 1 |

- **JPEG는 재인코딩 없이 DCT로 임베딩**되고, 같은 JPEG는 한 번만 저장된다. WebP/AVIF는 Flate(무손실)로 풀려서 커진다. 따라서 CLAUDE.md의 "`<source>` 제거 후 JPEG `src`" 지침이 맞다. [VERIFIED: 실행]
- 이 프로젝트는 카드마다 다른 이미지 13장이므로 JPEG 합이 곧 PDF 이미지 부분 크기다. 웹 960w JPEG(품질 82)가 장당 100~250KB라고 가정하면 13장에 1.3~3.3MB, 폰트와 텍스트를 더해도 5MB 안쪽일 가능성이 높다(실제 이미지로 측정해야 함 [ASSUMED]).

**build-pdf.mjs 변경 목록:**
1. 인쇄 전 `page.evaluate`에서(기존 `loading` 제거와 `decode()` 부분을 확장):
   - 모든 `picture > source` 제거.
   - `.shot img`의 `srcset`, `sizes` 제거, `src`를 고정.
   - `a.shot-link`의 `href` 제거.
   - 그 뒤에 `loading` 제거와 `await img.decode()`(순서 중요: 속성을 바꾼 뒤에 decode).
2. **폭 사다리:** 기본 후보는 이미지의 JPEG 후보 중 `<=960`(웹)/`<=540`(앱)의 최대. 결과 PDF가 `PDF_SOFT_BYTES`(기본 5,000,000)를 넘으면 한 단계 낮은 JPEG 후보로 교체(`srcset`에서 파싱, 예: 960 → 480)하고 다시 인쇄한다. 한 단계 내려도 넘으면 마지막 결과를 쓰고 경고. `PDF_HARD_BYTES`(기본 10,000,000) 이상이면 실패하고 PDF를 지운다. 품질은 도구의 파일에 구워져 있어 빌더가 낮추지 못하므로 "폭 내리기"가 유일한 레버다. 품질 조정이 필요하면 도구에 `--print-quality`로 `<id>-print.jpg`를 따로 만드는 확장을 쓴다(지금은 불필요).
3. 환경 변수 `PDF_SITE_ROOT`(기본 저장소 루트), `PDF_OUT`(기본 `dist/퍼블리셔 유윤희-포트폴리오.pdf`)을 추가한다. 기존 `PDF_CONTACT_FILE` 패턴과 같다. 이것이 합성 이미지로 전체를 검증하는 통로다(아래 검증 전략). 5MB=5,000,000(십진 MB)을 쓰는 이유는 업로드 한도가 MiB인지 MB인지 알 수 없어 더 보수적인 값을 택하기 위함이다.
4. 쪽수는 6쪽 고정이 아니다. `pdf-report`의 `pages`를 로그로 남기고 `--max-pages 12` 같은 상한만 둔다 [DISCRETION].

**pdf-report.mjs 확장:**
- 새 플래그 `--max-bytes <n>`(기본 5,000,000, 초과는 경고 출력 + 실패 코드는 `--hard-bytes`만), `--hard-bytes <n>`(기본 10,000,000, 초과 FAIL).
- 새 플래그 `--expect-images <n>`: `m.images >= n`이고 `/DCTDecode` 수 `>= n`임을 검사(JPEG 패스스루 확인). `m.dct = count(/\/DCTDecode/g)`를 측정에 추가. **이미지가 0장인 지금 상태에서는 `n=0`이라 통과**해야 하므로, 빌더가 `index.html`의 `.shot img` 개수를 세어 넘긴다.
- `uris`에 `127.0.0.1`, `localhost`, `file:`이 있으면 FAIL(Pitfall 1).
- `--page-plan`은 변경 불필요(위 Pitfall 7). 단 "회사 순서"의 `co[0] === 3`은 이미지가 들어가면 `#gi-data`가 3쪽에서 시작한다는 가정이 유지되는지 실측 후 확인한다.

## 도구·검사 확장 목록

| 파일 | 변경 |
|------|------|
| `package.json` | devDependency `sharp` `0.35.5` 정확 고정(승인 후). 스크립트 추가: `images`(`node tools/optimise-images.mjs`), `check:images`(`node tools/check-images.mjs` + `node tools/optimise-images.mjs --self-test`)를 `check`에 포함 |
| `tools/check-content.mjs` | (a) 328~334행 자식 태그 순서 검사는 그대로(figure는 항상 존재). (b) **499~500행 "screenshot slot ... not empty" 실패 조건을 완화:** 슬롯은 "비어 있고 `aria-hidden="true"`"이거나 "`a.shot-link > picture(source+img) | img`를 가진 정상 구조 + `aria-hidden` 없음"이어야 한다. (c) 새 `register('shots')`: 정상 구조일 때 `img`의 `alt`(비어 있지 않음, "스크린샷"/"이미지"로 시작 금지, 40자 이내), 정수 `width`/`height`, `srcset`의 모든 URL이 디스크에 존재, `aria-label`이 `h3 + " 화면 크게 보기"`와 같음, `href`가 존재하는 최대 폭 JPEG인지 검사. (d) `visibleTexts`는 텍스트 노드만 보므로 `alt`/`aria-label`은 `uiAllowlist`·`source-reverse` 대상이 **아니다**. 확대 창의 `닫기`는 JS가 만들어 정적 HTML에 없어서 `uiAllowlist` 항목도 불필요하다. 정말 정적 마크업에 넣게 되면 그때 `uiAllowlist`+`uiAllowlistReasons`에 사유와 함께 추가한다. |
| `tools/check-repo.mjs` | 변경 거의 없음. `NAME_OK`(`[a-z0-9._-]`)와 `isKnownBinary`(webp/jpg 매직)가 `img/projects/<id>/<id>-<w>.webp|jpg`를 이미 허용한다. 단 바이너리는 PHONE 스캔을 건너뛰므로 EXIF는 못 잡는다 → 새 `check-images`가 맡는다. `.gitattributes`에 `img/** binary`를 추가해 줄바꿈 변환 위험을 없앤다 |
| `tools/check-images.mjs` (새) | 제로 의존성 컨테이너 파서로 `img/projects/**`를 감사: JPEG는 세그먼트를 순회해 APP1(0xE1 EXIF/XMP), APP2(0xE2 ICC), APP13(0xED IPTC/Photoshop)가 없음을 확인(APP0 JFIF는 허용). WebP는 RIFF 청크 순회로 `EXIF`, `XMP `, `ICCP` 없음 확인. 확장자 대신 매직 바이트로 형식 확인. 그 위에 sharp `metadata()`로 치수를 읽어 HTML의 `width`/`height`, `srcset` 폭 설명자와 일치하는지 대조. 폴더 이름이 article id와 같은지, 파일 이름 패턴, 고아 파일(HTML이 참조하지 않는 파일), 매니페스트에 `status: approved`가 있는지(파일이 있는데 승인 안 됨 = FAIL), 파일당·합계 용량 한도, 매니페스트 문자열 필드의 `hasPhone`. 이미지가 0장이면 "0 projects, OK"로 통과한다 |
| `tools/check-ui.mjs` | 새 시나리오 `shot-dialog`, `shot-nojs`, `shot-reduced` (아래). `--only` 목록과 상단 usage 주석 갱신 |
| `tools/check-layout.mjs` | `shot-sizes` 검사(위), 확대 창 열린 상태에서 가로 스크롤 없음 |
| `tools/build-pdf.mjs`, `tools/pdf-report.mjs` | 위 PDF 절 |
| `css/components.css`, `css/print.css`, `css/tokens.css`, `js/main.js` | UI-SPEC 구현 |
| `.gitignore` | `dist/`가 이미 있으므로 `dist/shots-preview/`는 자동 제외. 변경 불필요 |

## 검증 전략: `_screenshots/`가 비어 있어도 (D-13)

**원칙: 합성 이미지는 임시 폴더나 메모리에서만 만들고 저장소에 두지 않는다.**

1. **`optimise-images.mjs --self-test` (Chrome 불필요, 약 수 초):** `os.tmpdir()`에 임시 작업 폴더를 만들고 `sharp({create})`로 만든 SVG 텍스트 이미지(웹 1440x3000, 앱 1080x2340, EXIF 방향 6 + Display P3 ICC + EXIF 문자열을 `withExif`/`withIccProfile`로 주입)를 `_screenshots/<id>/`처럼 배치한다. `index.html`의 복사본과 임시 매니페스트로 도구를 `--src --out --html --manifest` 경로 오버라이드와 함께 실행해 다음을 단언한다.
   - 모든 출력에서 EXIF/ICC/XMP/IPTC 없음(sharp `metadata()` + 제로 의존성 컨테이너 파서 둘 다).
   - 마스크 영역 픽셀이 `#111827`에 근접(JPEG 오차 허용)하고 가려진 영역의 원래 글자 색이 남지 않음.
   - 폭 사다리: 원본보다 큰 폭 없음, 이름이 실제 폭, 작은 원본(예: 400px)에서 단일 폭.
   - 두 번 실행해 파일 바이트와 HTML이 동일(멱등).
   - 한 프로젝트만 추가(`--only`)해도 다른 13-1개 figure는 변하지 않음. `--clear`가 정확히 원래 빈 마크업을 복원.
   - `status: draft`이면 `img/`와 HTML에 아무것도 쓰지 않고 미리보기만 생성.
   - 생성된 HTML 복사본이 `check-content`의 shots 검사를 통과.
2. **`check-ui` 픽스처 (요청 가로채기):** 저장소 파일은 건드리지 않는다. Puppeteer `page.setRequestInterception(true)`로 `index.html` 응답의 첫 빈 `figure.shot`을 위 마크업(웹: `__fixture__` 경로)으로 바꿔 돌려주고, `img/projects/__fixture__/*` 요청에는 sharp로 만든 1440x4000 JPEG/WebP 버퍼를 `request.respond`한다. main.js는 이미 정상 로드되므로 `a → button` 승격과 dialog 동작을 그대로 시험할 수 있다. 시나리오:
   - `shot-dialog`: 키보드(Enter, Space)로 열기, 초기 포커스가 `.shot-dialog-close`, Tab을 6번 눌러도 활성 요소가 dialog 안이거나 `BODY`(스파이크에서 확인한 네이티브 형태), Esc로 닫힘 후 `document.activeElement`가 열었던 버튼, 백드롭 클릭으로 닫힘 후 동일, 열린 동안 `scrollY` 불변, 가로 스크롤 없음, 긴 이미지에서 `.shot-dialog-scroll`이 `tabindex=0`+`role=region`, 이름이 프로젝트명, 닫기 버튼 높이 ≥44.
   - `shot-nojs`: JS 끔 → `a.shot-link`의 `href`가 존재하는 큰 JPEG, 빈 프레임은 `aria-hidden` 유지, `opacity:0` 상태 없음.
   - `shot-reduced`: `prefers-reduced-motion: reduce`에서 열고 닫을 때 `transition-duration`이 0이거나 `data-closing` 대기 없이 즉시 닫힘.
   - 뷰포트 375x812, 768x1024, 1440x900 3개에서 반복.
3. **PDF 종단 검증 (Chrome, 무거움):** 별도 스크립트 `tools/check-shots-pdf.mjs`(npm `check:shots-pdf`)가 임시 폴더에 사이트(index.html, css, js, fonts)를 복사하고, 합성 원본 13장을 만들어 `optimise-images`를 `--src/--out/--html/--manifest` 오버라이드로 돌린 뒤, `PDF_SITE_ROOT=<임시>`, `PDF_OUT=<임시>`, 가짜 연락처 파일(기존 `check-build-pdf.mjs`처럼 런타임에 조립한 가짜 번호)로 `build-pdf.mjs`를 실행한다. 단언: 성공 종료, `pdf-report`의 이미지 ≥13 & DCT ≥13, 용량 < 5,000,000, localhost URI 없음, 텍스트 추출 PASS. 사다리 시험: `PDF_SOFT_BYTES=1000`으로 낮춰 한 단계 내림이 실제로 일어나는지, `PDF_HARD_BYTES=1000`이면 PDF가 지워지고 종료 코드 1인지 확인.
4. **사람 체크포인트 (D-13, 자율 불가):** 사용자가 `_screenshots/<id>/`에 이미지를 넣는다 → Claude가 `--info`/`--annotate`로 가릴 곳 목록을 제시 → 사용자 승인 → `status: approved`로 변경 → 도구 실행 → `dist/shots-preview`와 사이트에서 최종 이미지(1920w와 카드 썸네일, 모바일)를 사용자가 확인 → alt 확인 → 그때 `img/projects/`와 `index.html`을 커밋. 승인 전에는 아무것도 `img/`에 쓰지 않는다. 이미지가 일부 프로젝트만 있으면 있는 것만 승인·반영한다.

## Code Examples

### 제로 의존성 메타데이터 감사 (check-images 핵심)
```js
// JPEG: SOI 후 세그먼트 순회. APP1(E1)=EXIF/XMP, APP2(E2)=ICC, APP13(ED)=IPTC 금지. APP0(E0)=JFIF 허용.
function jpegMeta(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not jpeg');
  const bad = [];
  for (let i = 2; i + 4 <= buf.length;) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    if (marker === 0xda) break;                           // SOS: 이후는 이미지 데이터
    const len = buf.readUInt16BE(i + 2);
    if ([0xe1, 0xe2, 0xed].includes(marker)) bad.push('APP' + (marker - 0xe0));
    i += 2 + len;
  }
  return bad;
}
// WebP: RIFF....WEBP 다음 청크(fourCC + LE 길이)를 순회. EXIF, 'XMP ', ICCP 금지.
function webpMeta(buf) {
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') throw new Error('not webp');
  const bad = [];
  for (let i = 12; i + 8 <= buf.length;) {
    const id = buf.toString('latin1', i, i + 4); const len = buf.readUInt32LE(i + 4);
    if (['EXIF', 'XMP ', 'ICCP'].includes(id)) bad.push(id.trim());
    i += 8 + len + (len & 1);
  }
  return bad;
}
```
(위 두 함수는 이 머신에서 실행해 보지 않았다. 구현 시 자체 테스트가 `keepMetadata()`로 만든 양성 샘플을 반드시 잡는지 단언해야 한다 — 이것이 감사 도구 자신의 회귀 테스트다.)

### 마스크 박스 그리기
```js
// Source: sharp composite + create input (스크래치패드에서 확인, 마스크 픽셀 17,24,40)
.composite([{ input: { create: { width: m.w, height: m.h, channels: 3, background: '#111827' } }, left: m.x, top: m.y }])
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `@squoosh/cli` | sharp API | squoosh CLI는 2023년 이후 방치 |
| 커스텀 모달 + 포커스 트랩 라이브러리 | `<dialog>.showModal()` (Baseline 2022) | 트랩, inert, Esc가 네이티브 |
| JS로 모달 페이드 | `@starting-style` + `transition-behavior: allow-discrete` | 진입은 CSS만, 퇴장은 `data-closing`+`transitionend` |
| `closedby` 속성 | 아직 Safari 미지원 | JS 백드롭 클릭으로 처리 |

**Deprecated/outdated:** `sharp-cli`로 마스킹·매니페스트 처리(불가능), 이미지를 PDF에 WebP/AVIF로 넣기(용량 폭증).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | HEIC/HEIF 입력은 prebuilt sharp로 읽을 수 없다 | 파이프라인 함정 | 사용자가 HEIC를 주면 도구 오류. 완화: 오류 시 PNG/JPEG로 내보내 달라고 안내 |
| A2 | WebP 한 변 16383px 한계 때문에 매우 긴 캡처가 실패한다 | 파이프라인 함정 | 도구가 이미 가드(높이 검사). 틀려도 해가 없음 |
| A3 | `smartSubsample: true`가 UI 글씨 선명도에 유리하다 | 품질값 | 용량만 약간 늘 수 있음. 체크포인트에서 눈으로 확인 |
| A4 | 다른 머신에서 같은 sharp 버전이 바이트 동일 출력을 낸다 | 결정성 | 감사를 바이트가 아닌 구조 기반으로 했으므로 영향 작음 |
| A5 | 실제 스크린샷 13장의 PDF 이미지 합이 5MB 안쪽이다 | PDF | 폭 사다리와 경고가 있고, 실제 이미지 도착 후 측정 필요 |
| A6 | Safari/iOS에서 `showModal` 포커스 복귀, `autofocus`, `html:has(dialog[open]) {overflow:hidden}` 스크롤 잠금이 Chrome처럼 동작한다 | 확대 창 | Phase 5 실기기 검증에서 확인. 완화: 스크롤 영역에 `overscroll-behavior: contain`, 포커스는 JS로 명시 복귀 |
| A7 | `sizes` 수식(뷰포트 기준 근사)이 항상 과대 추정 쪽이다 | sizes | `shot-sizes` 레이아웃 검사가 이를 검증한다 |
| A8 | 사용자 환경에서 5MB가 십진/이진 어느 쪽 한도인지 모름 | PDF | 5,000,000으로 보수적으로 설정 |

## Open Questions

1. **카드 `h3` 텍스트가 길 때 `aria-label`이 장황해진다** (예: "하나손해보험 보험상품산출기, 상품소개페이지 화면 크게 보기").
   - Recommendation: UI-SPEC 계약대로 유지(정확성 우선).
2. **PDF 쪽 수가 이미지로 몇 쪽이 될지** — 실제 이미지가 있어야 안다. 합성 이미지 종단 테스트에서 먼저 확인하고, 6쪽을 넘어도 D-14상 허용이다.
3. **최종 사용자 이미지가 앱 9:16이 아닐 때** — 체크포인트에서 크롭 좌표(`crop`)를 정하도록 한다.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | 모든 도구 | ✓ | v22.23.4 (`engines >=22.22.0` 충족) | — |
| sharp 0.35.5 (Windows x64) | 변환, 자체 테스트 | ✓ 설치 가능 (스크래치패드 설치 성공) | 0.35.5 (vips 8.18.7) | 없음. 사용자 승인 필요 |
| Google Chrome | check-ui, build-pdf | ✓ (스파이크에서 `launchChrome()` 성공) | — | — |
| 로컬 서버 | 수동 확인 | ✓ http://127.0.0.1:3000 이미 실행 중 (건드리지 않음) | — | — |
| slopcheck | 패키지 검증 | ✗ (설치가 권한 정책으로 거부됨) | — | npm view + 다운로드·저장소 증거로 대체, planner는 설치 전 human-verify 유지 |

**Missing with no fallback:** 없음 (sharp 설치는 사용자 승인 대기 항목).

## Validation Architecture

(config의 `workflow.nyquist_validation`은 `false`이지만 요청에 따라 포함한다.)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | 없음(프로젝트는 테스트 러너 없이 `tools/*.mjs` 자체 검사 스크립트 사용) |
| Config file | 없음 |
| Quick run command | `npm run check` (여기에 `check:images` 포함) |
| Full suite command | `npm run check && npm run check:layout && npm run check:ui && npm run check:shots-pdf && npm run check:pdfguard` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOT-01 | 이미지가 있는 `figure.shot` 구조, 앱·웹 프레임, 빈 프레임 유지 | 마크업 + 레이아웃 | `node tools/check-content.mjs` (shots), `npm run check:layout` | ❌ Wave 0 |
| SHOT-02 | EXIF/ICC/XMP/IPTC 없음, 마스크 픽셀 불투명, 승인 게이트 | 자체 테스트 + 감사 | `node tools/optimise-images.mjs --self-test`, `node tools/check-images.mjs` | ❌ Wave 0 |
| SHOT-03 | WebP/JPEG 다중 폭, width/height/srcset/alt, 참조 무결성 | 마크업 + 감사 | `node tools/check-content.mjs`, `node tools/check-images.mjs` | ❌ Wave 0 |
| SHOT-04 | 키보드 열기·Tab·Esc·포커스 복귀·백드롭·reduced motion·no-JS | e2e(Chrome) | `node tools/check-ui.mjs --only shot-dialog` (`shot-nojs`, `shot-reduced`) | ❌ Wave 0 |
| PDF-05 | PDF < 5MB(경고), < 10MB(하드), JPEG DCT, localhost 링크 없음, 사다리 | e2e(Chrome) | `node tools/check-shots-pdf.mjs` | ❌ Wave 0 |
| (회귀) | 이미지 0장 상태에서 기존 PDF 빌드가 그대로 통과 | e2e | `npm run pdf` (연락처 필요, 로컬) | ✅ |

### Sampling Rate
- **Per task commit:** `npm run check` (+ 수정한 영역의 단일 검사)
- **Per wave merge:** 전체 스위트
- **Phase gate:** 전체 스위트 green + 체크포인트에서 사용자 승인 분(있다면) 반영 확인

### Wave 0 Gaps
- [ ] `tools/optimise-images.mjs` (`--self-test` 포함)
- [ ] `tools/check-images.mjs` (+ 컨테이너 파서 양성 샘플 회귀)
- [ ] `tools/screenshots.json` 초기값 `{ "version": 1, "projects": {} }`
- [ ] `tools/check-shots-pdf.mjs`
- [ ] `check-content`의 shots 검사와 slots 완화
- [ ] `check-ui` 시나리오 3개, `check-layout` `shot-sizes`
- [ ] 설치: `npm i -D -E sharp@0.35.5` (사용자 승인 필요)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2/V3/V4 인증·세션·접근제어 | no (정적 사이트) | — |
| V5 Input Validation | yes | 도구 입력 검증(마스크 범위, 허용 `kind`, 경로 정규화, 매니페스트 스키마), 사이트에는 사용자 입력 없음 |
| V6 Cryptography | no | — (해시가 필요하면 `node:crypto`) |
| V8/V12 Data & Files | yes | 재인코딩으로 메타데이터 제거, 업로드 개념 없음, 로컬 파일만 처리 |
| V14 Config | yes | `_screenshots/`, `dist/` gitignore 유지, `check-repo`가 금지 경로 검사 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 스크린샷의 고객 PII·내부 URL·관리자 계정 공개 | Information Disclosure | 단색 불투명 박스, 사용자 승인 게이트, 최종 이미지 육안 확인, 체크리스트 |
| EXIF(GPS, 기기, 소프트웨어) 노출 | Information Disclosure | 재인코딩(기본 strip) + 컨테이너 감사 |
| 원본 파일명·매니페스트에 PII | Information Disclosure | 출력 이름은 id-폭, 매니페스트는 분류값만, `hasPhone` 적용 |
| PDF에 localhost 링크/미승인 이미지 | Information Disclosure | 빌더가 href 제거, `pdf-report`가 URI 검사 |
| 미승인 이미지가 커밋됨 | Information Disclosure | `check-images`가 `approved` 아닌 프로젝트의 파일 존재를 FAIL, pre-commit 훅이 `check` 실행 |
| 악성/손상 이미지 입력 | DoS | 로컬 도구, sharp `limitInputPixels` 기본값(268MP) 유지 |
| 공급망(sharp) | Tampering | 정확한 버전 고정, `package-lock.json` 커밋, 사용자 승인 |

## Sources

### Primary (HIGH confidence)
- 로컬 실측(스크래치패드, 2026-11-12): sharp 0.35.5 설치·실행(메타데이터 제거, keepMetadata 되살림, 결정성, 마스크 픽셀, 포맷별 크기), Chrome PDF 임베딩(JPEG DCT vs WebP/AVIF Flate), `<dialog>` 프로토타입(포커스, Esc, 백드롭, 페이드, Tab 순서, 이중 Esc), html-validate 실행.
- `npm view sharp@0.35.5`: 버전, 저장소, 라이선스, 의존성, 설치 스크립트 없음; npm downloads API 161,679,063/주.
- https://sharp.pixelplumbing.com/api-output : 기본 메타데이터 제거, `keepMetadata`, `withMetadata`, jpeg/webp/avif 옵션과 기본값.
- MDN browser-compat-data 8.1.8 (`unpkg.com/@mdn/browser-compat-data/data.json`): `closedby`, `requestClose`, `showModal` 지원 버전.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog : `autofocus` 지침, `cancel` 이벤트, `closedby` 기본값, 백드롭이 닫힘 즉시 제거됨.
- 프로젝트 소스: `CLAUDE.md`, `index.html`, `css/{components,layout,tokens,print}.css`, `js/main.js`, `tools/*.mjs`, `04-CONTEXT.md`, `04-UI-SPEC.md`, `02-PDF-SPIKE.md`.

### Secondary (MEDIUM)
- 이전 phase 리서치(`.planning/research/SUMMARY.md`, `PITFALLS.md`)의 폴더·검수 규칙.

### Tertiary (LOW)
- HEIC 미지원, WebP 16383px 한계(일반 지식, 위 Assumptions).

## Metadata

**Confidence breakdown:**
- Standard stack (sharp): HIGH. 설치·실행 실측.
- Architecture (파이프라인, 마크업, 도구 확장): HIGH. 기존 코드를 읽고 변경 지점을 특정했다.
- 확대 창: HIGH(Chromium 실측), Safari는 MEDIUM [ASSUMED A6].
- PDF 임베딩: HIGH. 실측.
- sizes 수식: MEDIUM. 수작업 계산이며 `shot-sizes` 검사로 검증하게 설계.
- Pitfalls: HIGH.

**Research date:** 2026-11-12
**Valid until:** 2026-12-12 (sharp, Chrome 버전 이동이 느린 편이라 30일)
