# Phase 1: 기반과 실제 콘텐츠 페이지 - Context

**Gathered:** 2026-11-11
**Status:** Ready for planning

<domain>
## Phase Boundary

원본 PDF(`퍼블리셔 유윤희-포트폴리오.pdf`, 8페이지)의 모든 내용을 시맨틱 HTML 한 장(`index.html`)으로 옮겨, 로컬 서버에서 열면 실제 문장 그대로 보이게 한다. 스타일은 없거나 최소다(디자인은 Phase 2). 동시에 개인정보 경계(전화번호, 원본 자료, PDF 출력물이 git에 들어가지 않게)와 검사 도구(Node 22, html-validate, `tools/check-content.mjs`, 전화번호 pre-commit 검사)를 세운다.

이번 phase에 포함되지 않는 것: 디자인 토큰·반응형 레이아웃(Phase 2), 모션·키보드 상호작용·PDF 생성(Phase 3), 실제 스크린샷(Phase 4), 배포·Colophon 실측값(Phase 5).

</domain>

<decisions>
## Implementation Decisions

### 표지와 제목 문구
- **D-01:** 표지(히어로) 영문 문구는 **"Publishing, beyond the expected."** 이다. 원본 줄바꿈대로 `Publishing,` / `beyond the` / `expected.` 세 줄로 둔다(`<br>` 또는 줄 단위 span, 의미상 한 문장). PDF 텍스트 추출본의 `ePbxeupybeolicnsthdeidtnh.ge`는 이 문구와 다른 레이어가 겹친 것이므로 쓰지 않는다.
- **D-02:** 표지에는 원본 그대로 `PORTFOLIO.`, `Selected work / Career 2026`, 한글 소개 `화면 너머의 경험까지 섬세하게. 앱, 반응형 웹 퍼블리셔 유윤희 입니다.`, 이메일을 둔다.
- **D-03:** 큰 섹션 제목은 **원본 영문 제목과 번호를 유지**한다: `01 / Skills` + `Tech stack.`, `02 / Career` + `Career & Work.`, 회사별 섹션, `07 / Contact` + `Contact.`. (`sTteacchk.`는 `Tech stack.`이 겹쳐 추출된 것이다.) 최신순으로 바꾸면서 회사 섹션 번호가 달라지는 부분은 플래너가 일관되게 다시 매긴다.
- **D-04:** 회사명은 **한글만** 쓴다(예: `비스톤스`). 원본의 영문 회사명(`Bistones`, `Abbey Road`, `KN Curation`, `GI Data`)은 화면에 표시하지 않는다. id·폴더명 같은 내부 식별자는 영문 소문자를 써도 된다.
- **D-05:** 저작권 문구 `© Publisher Youyoonhee ALL RIGHTS RESERVED`는 웹에서는 푸터에 한 번만 둔다. (PDF는 페이지마다 — Phase 3)
- **D-06:** Contact 안내 문구는 원본 그대로: `더 궁금한 점이 있으시다면 편하게 연락 부탁 드립니다.` 웹에는 이메일(`youyoonhee12@gmail.com`)만, 전화번호 자리는 빈 `data-slot="phone"`만 둔다.

### 프로젝트 기간과 표기
- **D-07:** 프로젝트별 기간은 **쓰지 않는다.** 회사 섹션 제목 옆 재직 기간만 표기한다. 프로젝트 메타의 "기간" 항목은 비우거나 빼고, 지어내지 않는다.
  - 지아이데이타 2024.09 ~ 2026.09 / 케이엔큐레이션 2023.09 ~ 2024.03 / 비스톤스 2022.01 ~ 2023.07 / 애비로드 2021.08 ~ 2021.12 (`<time datetime>` 사용)
- **D-08:** 작업 유형(구축/유지보수/리뉴얼)을 **별도 태그로 만들지 않는다.** 원본 설명 문장을 그대로 쓴다(예: "기획전 프로모션 구축 / 유지보수").
- **D-09:** 기여도는 원본 표기 `퍼블 기여도 N%`를 쓰고, **원본에 맥락이 있을 때만** 덧붙인다(예: 삼성 기획전 `2인 1팀으로 50:50 분담`). 맥락을 새로 쓰지 않는다.
- **D-10:** 경력 요약(Career & Work.)은 최신순으로 회사명 + 원본 대표 문구를 그대로 쓴다: 지아이데이타 `하나손해보험 App`, 케이엔큐레이션 `LG ChatEXAONE 초기모델`, 비스톤스 `CJ 광고 플랫폼/삼성닷컴 기획전`, 애비로드 `교보생명 App`. 각 항목은 해당 회사 섹션으로 앵커 이동한다.
- **D-11:** 케이엔큐레이션 섹션에는 원본 회사 설명 `Angular 기반 앱, 반응형 웹 구축 및 유지 보수`를 둔다.

### 프로젝트 데이터 (사용자 확인 완료)

순서는 최신 회사부터, 회사 안에서는 원본 번호 순서.

| id | 회사 | 프로젝트 (원본 표기) | 플랫폼 | 원본 설명 | 기여도 (+원본 맥락) | 링크 | 상태 |
|----|------|---------------------|--------|-----------|---------------------|------|------|
| `gi-calculator` | 지아이데이타 | 보험상품산출기·상품소개페이지 | Web | 웹/앱 모두 화면 유지보수 | 100% | 없음 | live (링크 없이 운영 중) |
| `gi-event` | 지아이데이타 | 이벤트페이지등록 | Web | 관리자 페이지 연동으로 이벤트 관리 | 100% | 없음 | live |
| `gi-oneday` | 지아이데이타 | 원데이보험앱화면리뉴얼 | App | 메인인트로, 상품소개페이지 리뉴얼 담당 | 100% | 없음 | live |
| `kn-puring` | 케이엔큐레이션 | puring | App | 앱 제작 · APK 보유 | 100% | 없음 | apk |
| `kn-roadpill` | 케이엔큐레이션 | 로드필 | Web | 현재 운영 종료 | 50% | 없음 | closed |
| `kn-wecankids` | 케이엔큐레이션 | 위캔키즈클럽 | Web | — | 50% | https://www.wecankids.club/home | live |
| `kn-linkalba` | 케이엔큐레이션 | 링크알바 | Web | — | 100% | 보류 (아래 D-14) | 보류 |
| `kn-fsd` | 케이엔큐레이션 | FSD 코스메틱 | Web | — | 100% | https://www.fsdcosmetic.com/home | live |
| `kn-greenda` | 케이엔큐레이션 | 그린다 | Web | — | 80% | https://green-da.co.kr/home | live |
| `kn-universe` | 케이엔큐레이션 | universe | Web | LG AI연구원 의뢰 · 생성형 AI 'EXAONE' 초기모델 개발 / 미국 학회 발표용 초기모델 · 현재 관련 기사만 확인 가능 · 디자인·기능은 ChatGPT와 거의 유사 | 100% | https://www.lg.co.kr/media/release/26532 (관련 기사) | article |
| `bs-addy` | 비스톤스 | CJ종합광고운영플랫폼 'ADDY' | Web | 웹사이트 반응형 구축 · 현재 운영 종료 | 70% | 없음 (D-12) | closed |
| `bs-samsung` | 비스톤스 | 삼성E스토어기획전프로모션 | Web | 기획전 프로모션 구축 / 유지보수 | 50% · 2인 1팀으로 50:50 분담 | https://samsungebiz.com/event/galaxycampus/ (D-13) | live |
| `ab-peach` | 애비로드 | 교보생명금융마이데이터서비스앱 '피치(Peach)' | App | 앱 구축 프로젝트에서 화면의 초기 설계 작업을 담당 · 현재 운영 종료 | 30% | 없음 | closed |

- 회사 이름 내 띄어쓰기(예: `교보생명금융마이데이터서비스앱`)는 원본이 붙여 쓴 것이다. 읽기 좋게 띄어 쓰는 것은 허용하되(예: `교보생명 금융 마이데이터 서비스 앱 '피치(Peach)'`) 단어를 바꾸거나 더하지 않는다.
- 위캔키즈클럽·링크알바·FSD·그린다는 원본에 설명 문장이 없다. 설명을 만들지 않는다.

### 링크와 운영 상태
- **D-12:** ADDY 소개서(Google Drive) 링크는 로그인 없이 404라서 **걸지 않는다.** `운영 종료` 배지만 둔다. (원본의 "소개서만 확인 가능" 문구도 링크가 없으므로 쓰지 않는다.)
- **D-13:** 삼성 기획전은 **갤럭시 캠퍼스(`https://samsungebiz.com/event/galaxycampus/`)만 건다.** `www.samsung.com/sec/event/indexExhibitionCollection/?eventTypeCd=90`은 지금 쇼핑 메인으로 넘어가므로 걸지 않는다.
- **D-14:** [2026-11-11 사용자 검토로 대체됨, 아래 개정 참조] 링크알바(`www.linkalba.com/home`)는 2026-11-11 확인 시 서버 연결 실패(80/443 시간 초과, DNS는 응답). **링크를 걸지 않고 상태 배지도 확정하지 않는다**(`운영 종료`라고 단정하지 않음). Phase 5 배포 직전에 다시 확인해 live면 링크를 걸고, 아니면 사용자에게 상태를 묻는다.
- **D-15:** [2026-11-11 사용자 검토로 대체됨, 아래 개정 참조] 지아이데이타(하나손해보험) 3개는 **링크 없이 `운영 중` 배지**만 둔다.
- **D-16:** [2026-11-11 사용자 검토로 일부 대체됨, 아래 개정 참조] 상태값은 리서치에서 정한 `data-status="live | closed | intro | article | apk | private"`를 쓴다. 이번 phase에서 쓰는 값은 `live`, `closed`, `article`, `apk`와 링크알바용 보류 값이다. 외부 링크는 새 탭으로 열고 `rel="noopener"`, 링크 텍스트에 목적지가 드러나게 한다(예: "관련 기사 보기").

  - **사용자 검토 개정 (2026-11-11, 사용자 제공 사실):** 페이지 검토 후 사용자가 상태 배지를 다음과 같이 바꾸라고 했다.
    1. `운영 중` 배지는 표시하지 않는다. `live` 프로젝트(gi-calculator, gi-event, gi-oneday, kn-wecankids, kn-fsd, kn-greenda, bs-samsung)는 `data-status="live"`만 유지하고 링크(사이트 보기 / 기획전 보기)는 그대로 둔다. 링크가 없는 live 프로젝트는 상태·링크 묶음 자체가 없다.
    2. `운영 종료` 배지는 kn-roadpill, bs-addy, ab-peach에 그대로 둔다.
    3. kn-linkalba는 보류에서 `운영 종료`(`data-status="closed"`, 링크 없음)로 바뀐다. 이 사실은 사용자가 알려준 것이며 원본 PDF에는 없다. D-14의 "상태 배지 미확정"과 "Phase 5 재확인" 항목은 대체된다.
    4. kn-puring 배지는 `APK 보유`에서 `운영 여부 확인 어려움`(`data-status="unknown"`)으로 바뀐다. 이 문구는 사용자가 정한 UI 문구라서 원본에는 없고 허용 목록에 둔다. 담당 업무 텍스트 `앱 제작 · APK 보유`는 원본 그대로 유지한다.
    5. kn-universe의 `관련 기사` 배지와 링크는 언급이 없었으므로 변경하지 않는다. D-15의 "운영 중 배지"는 4번에 따라 표시하지 않는다.

### 퍼블리싱 포인트
- **D-17:** 프로젝트마다 **"퍼블리싱 포인트" 자리만 마크업**하고 비워 둔다. 빈 자리는 화면과 접근성 트리에 보이지 않아야 한다(내용이 없으면 요소 자체를 렌더링하지 않거나 `hidden`). 사용자가 결과물을 본 뒤 내용을 주면 채운다.
- **D-18:** 받을 형식은 프로젝트당 **한두 줄 문장**이다(키워드 태그 아님).

### Claude's Discretion
- article 템플릿의 정확한 마크업(`dl` 항목 이름, 클래스 이름), 회사 섹션 번호 재배열 방식, 영문 id 규칙(`<회사약어>-<프로젝트>` 권장), 스크린샷 자리표시의 마크업
- `tools/check-content.mjs`의 검사 항목(필수 슬롯, alt, 전화번호 패턴, 원본 대조) 구현 방식
- `package.json` devDependencies 구성(html-validate, serve 등)과 pre-commit hook 방식

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 원본 콘텐츠
- `.planning/source/portfolio-pdf.txt` — 원본 PDF 텍스트 추출본(UTF-8). **git 제외, 전화번호 포함** — 읽기만 하고 내용을 공개 파일로 복사할 때 전화번호는 절대 옮기지 않는다
- `C:\Users\user\Desktop\퍼블리셔 유윤희-포트폴리오.pdf` — 원본 PDF(판형·시각 확인용)

### 프로젝트 기준
- `.planning/PROJECT.md` — Core Value, 제약, Key Decisions
- `.planning/REQUIREMENTS.md` — BASE-01~04, CONT-01~08, QUAL-01 (이번 phase)
- `.planning/ROADMAP.md` §Phase 1 — 성공 기준 5개
- `.planning/research/SUMMARY.md` — 충돌 조정 결정(폴더 이름 `private/`, `dist/`, `_screenshots/`, `img/projects/<id>/`, 상태값, 제목 레벨 h1→h2→h3)
- `.planning/research/ARCHITECTURE.md` — 단일 `index.html`, 콘텐츠 HTML 직접 작성, `data-*` 상태, article 템플릿 주석, 폴더 구조
- `.planning/research/PITFALLS.md` — 전화번호 유출, 과장 금지, 파일명/경로, 한글 조판
- `.planning/research/STACK.md` — 도구 버전(html-validate 11, serve 14 등)

### 디자인 기준 (Phase 2에서 본격 적용, 이번엔 마크업 구조만 고려)
- `C:\Users\user\.agents\skills\design-taste-frontend\SKILL.md` — 섹션 구조·카피 규칙

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 없음 — 코드가 없는 새 프로젝트다. 저장소에는 `.planning/`, `.gitignore`, `CLAUDE.md`만 있다.

### Established Patterns
- `.gitignore`에 이미 `.planning/source/`, `_screenshots/`, `private/`, `dist/`, `*.pdf`, `.print-tmp.html`, `node_modules/`가 있다.
- 브랜치 `main`, 원격 `origin` = https://github.com/youyoonhee/portfolio-2026 (공개). 푸시하면 공개되므로 전화번호 검사는 커밋 전에 돌아야 한다.

### Integration Points
- 로컬 Node 22.23.4(nvm). html-validate 11은 Node ^22.22를 요구하므로 충족한다.
- `_screenshots/` 폴더는 이미 있다(현재 비어 있음, git 제외).

</code_context>

<specifics>
## Specific Ideas

- 표지 문구 "Publishing, beyond the expected."는 세 줄 구성을 살린다.
- 섹션 제목은 원본의 `0N / Name` + 마침표로 끝나는 영문 제목(`Tech stack.`, `Career & Work.`, `Contact.`) 톤을 그대로 이어 간다. "같은 문서의 새 버전"으로 읽히는 것이 목표.
- 스킬은 원본 분류 그대로: Markup & Style(HTML5, CSS3, SCSS) / Language(JAVASCRIPT (ES6+), TYPESCRIPT (경험)) / Framework(ANGULAR, VUE (경험)) / Library(JQUERY, BOOTSTRAP) / Tools(GIT, VISUAL STUDIO CODE, ECLIPSE).

</specifics>

<deferred>
## Deferred Ideas

- 퍼블리싱 포인트 실제 내용 — 사용자가 결과물을 본 뒤 제공
- 링크알바 링크·상태 — Phase 5 배포 전 재확인
- ADDY 소개서 — 사용자가 Drive 공유를 공개로 바꾸면 다시 검토(v2 이후)
- 프로젝트별 실제 기간 — 사용자가 기억해 주면 추가 가능(지금은 회사 기간만)

</deferred>

---

*Phase: 01-기반과 실제 콘텐츠 페이지*
*Context gathered: 2026-11-11*
