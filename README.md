# 퍼블리셔 유윤희 포트폴리오 2026

앱·반응형 웹 퍼블리셔 포트폴리오 사이트의 소스입니다. 같은 HTML에서 제출용 PDF도 만듭니다.

## 직접 작성한 범위

- `index.html`, `404.html`: 시맨틱 마크업을 손으로 작성했습니다.
- `css/`: `@layer`, 네이티브 nesting, custom properties, container query로 작성했습니다. 전처리기와 프레임워크는 쓰지 않습니다.
- `js/`: `type="module"` 순수 JavaScript입니다. 라이브러리를 쓰지 않습니다.
- `tools/`: 검사, 이미지 변환, PDF 생성 스크립트를 모두 직접 작성했습니다.
- 빌드 단계가 없습니다. 저장소 파일이 그대로 사이트입니다.

## 가져온 것

- 서체 Pretendard 1.3.9 (SIL OFL 1.1). 라이선스는 `fonts/pretendard-ofl.txt`에 있습니다.
- npm devDependencies는 로컬 도구에서만 씁니다: html-validate, linkinator, puppeteer-core, serve, sharp. 사이트는 이 패키지들을 불러오지 않습니다.
- design-taste-frontend 스킬은 디자인 규칙으로만 참고했습니다. 스킬 키트의 CSS/JS는 사이트에서 불러오지 않습니다.

## 로컬에서 보기

```
npm install
npm run serve
```

http://127.0.0.1:3000 에서 확인합니다. `file://`로 열면 module 스크립트와 폰트가 막혀서 지원하지 않습니다.

## 검사

| 명령 | 내용 |
|------|------|
| `npm run check` | HTML 검사, 콘텐츠, 저장소 개인정보 검사, 이미지, 미리보기 메타, 배포 산출물 검사 |
| `npm run check:layout` | 뷰포트별 레이아웃 (Chrome 필요) |
| `npm run check:ui` | 메뉴, 키보드, 포커스 등 동작 (Chrome 필요) |
| `npm run check:links` | 링크 검사 (`npm run serve`를 켜 둔 상태에서) |
| `npm run check:preview` | OG/미리보기 메타 |
| `npm run check:artifact` | 배포 산출물(`dist/site`) 검사 |
| `npm run check:source` | 로컬 전용. 원본 대조 검사 |

## 제출용 PDF

```
npm run pdf
```

`tools/contact.example.json`을 `private/contact.json`으로 복사해서 값을 채운 뒤 실행합니다. `private/`, `*.pdf`, `dist/`는 gitignore 대상입니다. 연락처는 PDF를 만들 때만 주입하며 저장소와 웹 사이트에는 들어가지 않습니다.

## 스크린샷 추가 규칙

1. 원본을 `_screenshots/<id>/`에 둡니다 (gitignore, 저장소에 올리지 않음).
2. `tools/screenshots.json`에 항목을 추가합니다. `status`(draft/approved), 가림 영역(masks), `noSensitive`를 채웁니다.
3. `npm run images`를 실행합니다. draft는 `dist/shots-preview`에 미리보기만 만들고, approved만 `img/projects`에 게시용 파일을 만듭니다.
4. 한 프로젝트만 다시 만들 때는 `npm run images -- --only <id>`를 씁니다.

## 배포

- GitHub Actions: push 시에는 검증만 하고, 수동 실행(workflow_dispatch)을 할 때만 허용 목록으로 만든 `dist/site`를 게시합니다.
- 검색 노출 제어는 `noindex` 메타가 담당합니다. `robots.txt`는 프로젝트 하위 경로에서 힌트일 뿐이라 색인을 막는다고 보지 않습니다.
