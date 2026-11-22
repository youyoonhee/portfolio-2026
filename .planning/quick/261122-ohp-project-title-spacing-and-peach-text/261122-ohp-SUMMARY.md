---
quick_id: 261122-ohp
type: quick
status: complete
commit: 4de8761
---

# Quick 261122-ohp: project title spacing and Peach text

User request (2026-11-22):
- **Peach title:** drop '앱' from "교보생명 금융 마이데이터 서비스 앱 ‘피치(Peach)’". It is now "교보생명 금융 마이데이터 서비스 ‘피치(Peach)’".
- **Peach role line:** drop "· 현재 운영 종료". It is now "앱 구축 프로젝트에서 화면의 초기 설계 작업을 담당".
- **Spacing:**
  - CJ 종합광고운영플랫폼 ‘ADDY’
  - 삼성 E스토어 기획전 프로모션
  - 원데이보험앱 화면 리뉴얼
  - 이벤트 페이지 등록
  - 하나손해보험 보험 상품 산출기, 상품 소개 페이지
  - 메인 인트로, 상품 소개 페이지 리뉴얼 담당

## Changes
- **index.html:** headings, keyword-list links and shot-link aria-labels updated.
- **tools/content-manifest.json:** project names and descriptions updated.
  - The Peach source title in sourceCoverage is now `excluded` (reason: 2026-11-22 사용자 개정).
  - The edited title is in uiAllowlist with a reason.
  - Spacing-only changes need no coverage change, because check-content normalises whitespace.

## Verification
- npm run check: 0
- check:source: 0 (site 57 / excluded 23 / unmapped 0)
- check:ui: 0
- check:layout: 0
- pdf: 0, 7 pages, 586,263 bytes
