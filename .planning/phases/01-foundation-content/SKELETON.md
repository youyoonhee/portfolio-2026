# Walking Skeleton — 퍼블리셔 유윤희 포트폴리오 2026

**Phase:** 1
**Generated:** 2026-11-11

## Capability Proven End-to-End

> `npm run serve`로 띄운 `index.html`(http://localhost:3000)에서 방문자가 원본 PDF의 실제 표지·Contact 문장을 읽고, 같은 순간 저장소는 전화번호가 섞인 커밋을 막으며 `npm run check`(html-validate + 콘텐츠 대조 + 저장소 검사)가 Node 22에서 초록으로 통과한다.

정적 사이트라서 "DB 읽기/쓰기"는 다음으로 대신한다: **읽기** = 검사 도구가 `tools/content-manifest.json`(원본 대조표)과 git 밖 원본 추출본을 읽어 `index.html`과 대조, **쓰기** = git 커밋이 pre-commit 훅을 통과해 공개 저장소에 기록됨. "개발 배포"는 문서화된 로컬 실행 명령(`npm run serve`)이고, GitHub Pages 배포는 Phase 5에서 켠다(지금은 켜지 않는다).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | 없음. 손으로 쓴 `index.html` 한 장(시맨틱 HTML), 빌드 단계 없음 | 직접 마크업이 퍼블리셔 실력의 증거(PROJECT 제약). 정적 호스팅에 그대로 올림 |
| 콘텐츠 원천 | `index.html`에 콘텐츠를 직접 쓴다. JS가 콘텐츠를 만들지 않는다 | view-source가 곧 작업물, JS 꺼져도 내용이 보임(DSGN-03 대비), PDF도 같은 DOM에서 |
| 검증 데이터 | `tools/content-manifest.json` = 원본 대조표(공개 가능한 문장만). 원본 추출본 `.planning/source/portfolio-pdf.txt`는 git 밖, 있으면 역검증 | 채용 문서라 사실만. 누락 0 / 새 문장·수치 0을 자동 검사 |
| 개인정보 경계 | 웹·저장소에 전화번호 없음. HTML에는 빈 `<div data-slot="phone" hidden>`만. 실제 번호는 git 밖 `private/contact.json`에서 PDF 빌드 때만 주입(Phase 3) | 공개 저장소 + 공개 사이트. CSS로 숨기는 방식 금지 |
| 커밋 가드 | `.githooks/pre-commit` → `node tools/check-repo.mjs --staged` (`core.hooksPath`, `npm install`의 prepare가 설정). 전체 트리 `npm run check:repo`, 히스토리 `npm run check:history` | 의존성 0(husky 없음), 인덱스 내용을 검사 |
| 인증 | 해당 없음(정적 공개 사이트, 백엔드·폼 없음) | Out of Scope |
| 로컬 도구 | Node 22.22+ (현재 22.23.4), `package.json`은 devDependencies만: html-validate 11.21.0, serve 14.2.7, linkinator 8.1.0. 검사 스크립트는 Node 내장 모듈만 | BASE-04. 배포 산출물에 영향 없음 |
| HTML 규칙 | `.htmlvalidate.json` = recommended + a11y + `heading-level: error`. `<!DOCTYPE html>` 대문자, `lang="ko"`, inline style 금지 | QUAL-01, recommended에 heading-level이 없음(실측) |
| 제목 구조 | h1 = 표지 문구 "Publishing, beyond the expected." 1개 → h2 = 섹션·회사 → h3 = 프로젝트 | 단계 건너뛰기 없음 |
| 섹션 번호 | 01 Skills / 02 Career / 03 지아이데이타 / 04 케이엔큐레이션 / 05 비스톤스 / 06 애비로드 / 07 Contact (최신순). 회사 섹션 눈썹은 번호만, 영문 회사명 없음 | D-03 + D-04 (D-04가 더 구체적) |
| id 규칙 | ASCII 소문자 kebab-case. 섹션 `skills`, `career`, `contact`, 회사 `gi-data`, `kn-curation`, `bistones`, `abbey-road`, 프로젝트 `<회사약어>-<프로젝트>`(예: `kn-puring`). 프로젝트 id = article id = 이후 `img/projects/<id>/` 폴더명 | 앵커·이미지·검사가 같은 키를 씀 |
| 프로젝트 article 템플릿 | `article.project[data-platform][data-status]` → h3 → `dl.meta`(소속 / 플랫폼 / 담당 업무(원본에 있을 때만) / 퍼블 기여도) → `div.point[data-slot=point][hidden]` → `figure.shot[data-slot=screenshot][data-frame][aria-hidden]` → `div.status-links`(배지 + 링크). 기간 행 없음(D-07). `index.html` 상단 주석에 템플릿 | CONT-04 고정 순서. Phase 2 CSS, Phase 4 이미지가 이 슬롯에 붙는다 |
| 상태값 | `data-status="live | closed | intro | article | apk | private | pending"`. 배지 텍스트가 정답(운영 중 / 운영 종료 / 소개서 / 관련 기사 / APK 보유 / 비공개), pending(링크알바)은 배지·링크 없음 | D-14, D-16 |
| 외부 링크 | 새 탭 + `rel="noopener"`, 링크 텍스트에 목적지(사이트 보기 / 관련 기사 보기 / 기획전 보기). 허용 URL 목록은 manifest.links | D-16, 죽은 링크 금지 |
| 경로 | 모두 상대경로(`/`로 시작하는 루트 경로 금지), 파일명 소문자 ASCII kebab-case (예외: CLAUDE.md, README.md, `.planning/`) | GitHub Pages 프로젝트 사이트(`/<repo>/`) |
| 배포 대상 | 지금: 로컬 `npm run serve`(http://localhost:3000, `file://` 미사용). Phase 5: GitHub Pages `main` / root + `.nojekyll`, noindex | 사용자 결정 |
| 디렉터리 구조 | 루트: `index.html`, `package.json`, `.htmlvalidate.json`, `.gitattributes`, `.githooks/`, `tools/`. 이후: `css/`(Phase 2), `fonts/`(Phase 2), `js/`(Phase 3), `img/projects/<id>/`(Phase 4). git 밖: `.planning/source/`, `_screenshots/`, `private/`, `dist/`, `*.pdf` | 단일 페이지, 레이어별 폴더 |

## Stack Touched in Phase 1

- [ ] Project scaffold — `package.json`(devDependencies만), `.htmlvalidate.json`, `.gitattributes`, `npm run check`
- [ ] Routing — 한 페이지 안 앵커 라우트: nav → `#skills` / `#career` / `#contact`, Career → 회사 섹션 4개
- [ ] Data read — 검사 도구가 manifest와 원본 추출본을 읽어 `index.html`과 대조(누락 0, 새 문장·수치 0)
- [ ] Data write — 커밋이 pre-commit 전화번호 검사를 통과해야만 기록됨 (차단 실측)
- [ ] UI — 실제 링크 상호작용: 경력 → 회사 앵커 이동, 외부 링크 5개 새 탭, `mailto:` 이메일
- [ ] Local run — `npm run serve` → http://localhost:3000 (Pages 배포는 Phase 5)

## Out of Scope (Deferred to Later Slices)

- CSS 전체(토큰, Pretendard, 반응형, 배지 모양, `.visually-hidden` 실제 숨김) — Phase 2
- PDF spike — Phase 2. 제출용 PDF·전화번호 주입·모션·키보드 다듬기·JS — Phase 3
- 실제 스크린샷, 확대 창 — Phase 4 (지금은 빈 `figure.shot` 자리만)
- GitHub Pages 배포, `robots.txt`, OG/favicon, 404.html, Colophon, README — Phase 5 (noindex meta 한 줄만 미리 넣음)
- 퍼블리싱 포인트 실제 문장 — 사용자가 결과를 본 뒤 제공 (자리만 hidden으로)
- 링크알바 링크·상태 — Phase 5 배포 직전 재확인
- ADDY 소개서 링크 — Drive 공유가 공개로 바뀌면 v2 이후 검토
- 프로젝트별 실제 기간 — 사용자가 기억해 주면 추가 (지금은 회사 재직 기간만)

## Subsequent Slice Plan

각 phase는 이 골격의 결정(단일 `index.html`, 콘텐츠 직접 마크업, manifest 대조, 전화번호 경계, id·상태값·템플릿)을 바꾸지 않고 한 겹씩 얹는다.

- Phase 2: 채용 담당자가 어떤 화면 폭에서든 단정한 미니멀 디자인으로 읽고 10초 안에 회사별 담당 업무·기여도를 찾는다 (+ PDF spike)
- Phase 3: 키보드만으로·모션/JS 없이도 다룰 수 있고, 사용자는 명령 하나로 전화번호가 들어간 제출용 PDF를 얻는다
- Phase 4: 프로젝트마다 실제 작업 화면을 비율 프레임으로 보고 확대한다
- Phase 5: GitHub Pages(noindex)에서 깨짐·404 없이 보고, Colophon과 README로 제작 근거를 확인한다
