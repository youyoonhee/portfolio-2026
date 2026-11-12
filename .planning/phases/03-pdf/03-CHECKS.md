# Phase 3 검사 증거 (03-05)

측정일 2026-11-12. 대상 커밋 9a4c44f (03-04 완료 직후). 이 단계에서 소스 수정은 없었다. 번호, 연락처 줄, 쪽 텍스트는 적지 않았고 개수와 크기만 기록했다.

## 명령별 결과

| 명령 | exit | PASS | FAIL |
|------|------|------|------|
| `npm run check` | 0 | 53 | 0 |
| `npm run check:source` | 0 | 23 | 0 |
| `npm run check:layout` | 0 | 64 | 0 |
| `npm run check:ui` | 0 | 92 | 0 |
| `npm run pdf` (build-pdf + pdf-report) | 0 | 16 | 0 |
| `npm run pdf:spike` | 0 | (Edge CLI 미리보기, 90초 타임아웃 안에 종료) | - |
| `pdf-report ... --json dist/submission-report.json` | 0 | 개수만 기록 | - |

## ROADMAP Phase 3 성공 기준별 증거

| 성공 기준 | 증거 |
|-----------|------|
| 성공 기준 1 (본문 바로가기, Tab 순서, 포커스 표시) | check:ui `skip` 3, `focus-ring` 6 (375/1440의 skip-link, nav-toggle, 내비 링크, 표지 메일), `keyword-focus` 12 (Tab 9회로 키워드 링크 아홉 개를 지나며 해당 키워드 표시, Shift+Tab 복귀) |
| 성공 기준 2 (모션은 진입과 hover만, reduced-motion, JS 없음) | check:ui `cover` 5 (세 줄 진입 지연 0/150/300ms), `reduced` 5, `nojs` 8, `nojs-all` 4, `print-state` 3, `keyword-media` 6 (1024px 미만에서는 전환 꺼짐), `header` 12 (reduced-motion에서 숨지 않음 포함) |
| 성공 기준 3 (명령 하나로 PDF, 번호는 private에서만 주입, 공개 HTML에는 빈 슬롯) | `npm run pdf` exit 0, 로그 "phone injected: yes", `submission: phone text present`, `tel link matches text (tel links 1)`. check:content slots PASS (공개 index.html은 빈 hidden 슬롯). `grep -c "tel:" index.html` = 0 |
| 성공 기준 4 (표지 / 스킬·경력 / 회사별 / 연락처, 카드 안 잘림, 빈 쪽 없음) | pdf-report `page plan` 4개 PASS (표지·키워드 1쪽, 스킬·경력 2쪽, 회사별 3~5쪽, 연락처 6쪽), `no card split across pages (13 cards)`, `no blank or footer-only page (min 123 chars)`, `last page holds contact and footer (page 6)` |
| 성공 기준 5 (링크 클릭, 한글 복사·검색, TrueType, 머리글·바닥글 경로 없음) | `fonts: TrueType Pretendard only (type3 0, FontFile2 2)`, `links clickable (5/5 external, mailto 2)`, `Korean extraction (projects 13/13, keywords 3/3, U+FFFD 0)`, `chrome hidden (no header, nav, browser footer)`, `outline and tags` |

## PDF 측정값 (dist/submission-report.json)

- 쪽수 6, 크기 132,180 bytes, MediaBox A4 세로 (594.96 x 841.92 pt)
- 쪽별 추출 글자 수 (1~6쪽): 210, 307, 286, 207, 239, 123
- 쪽별 카드 수 (platform/contribution 쌍, 1~6쪽): 0/0, 0/0, 5/5, 5/5, 3/3, 0/0 (합계 13 카드)
- Type3 0, CIDFontType2 2, FontFile2 2, ToUnicode 2, Image 0
- BaseFont: Pretendard-Regular, Pretendard-SemiBold
- 링크 총 8 (mailto 2, tel 1, 외부 5)
- Outlines true, StructTreeRoot true

## UI 시나리오별 PASS 수 (check:ui, 합계 92)

cover 5, focus-ring 6, header 12, keyword-focus 12, keyword-media 6, keywords 12, menu 13, nojs 8, nojs-all 4, print-state 3, reduced 5, skip 3, spy 3

## 개인정보 확인

- `grep -c "tel:" index.html` = 0
- check-content slots PASS: phone 슬롯은 `hidden`이고 비어 있다
- `git check-ignore -q private/contact.json`: exit 0 (ignored)
- `git check-ignore -q "dist/퍼블리셔 유윤희-포트폴리오.pdf"`: exit 0 (ignored)
- `git status --porcelain`: 비어 있음 (private, dist, pdf 없음)
- `git ls-files | grep -ciE "\.pdf$"` = 0
- 추적되는 contact 관련 파일: `tools/contact.example.json` 하나뿐

## 남은 위험

- Safari/iOS 미검증 항목(RESEARCH Pitfall 11, A2, A3)은 Phase 5 실기기 확인에서 본다.
- Phase 4에서 스크린샷이 들어가면 쪽수와 카드 배치를 다시 측정한다(Pitfall 6).
- 회사별 강제 쪽 나눔 여부는 Phase 4에서 결정한다.
- `npm run pdf:spike`는 이 PC의 Edge에서 멈춘 적이 있어 타임아웃을 걸고 실행했다. 이번에는 정상 종료했다. 공식 빌드는 Chrome `npm run pdf`다.
- :3000 serve는 127.0.0.1 바인딩 적용을 위해 재시작이 필요했고, 오케스트레이터가 이미 재시작했다.
- design-taste `gate.mjs`는 실행하지 않았다.

## 사용자 검토

사용자 승인 (2026-11-12): 1~8 전체 승인, PDF 전화번호 포함 연락처 확인(전체 승인으로 갈음)
