---
status: partial
phase: 05-deploy
source: [05-05-PLAN.md, 05-RESEARCH.md]
started: 2026-11-16T00:00:00+09:00
updated: 2026-11-16T00:00:00+09:00
---

## Current Test

[awaiting human testing — 공개 URL 배포 후 실기기·시각 확인]

## Tests

### 1. og-card.png 확인 (첫 공유 전)
Steps:
1. Open img/og-card.png.

expected: The image shows exactly `PORTFOLIO.`, `유윤희`, `앱, 반응형 웹 퍼블리셔`, with clean text edges, and no email or phone number. Once the link has been shared, the file must not change in place (messenger cache, RESEARCH Pitfall 6).
result: [pending]

### 2. Edge 데스크톱
Steps:
1. Open the live URL in Edge and check the layout at full width and in a narrow window.
2. Check the menu, the zoom dialog and the links.
3. Record the Edge version (edge://version).

expected: No layout break at either width; menu, zoom dialog and links all work. Note: the 05-04 headless automation produced `browser: Edg/157.0.4341.60` with 0 failing requests, so this item is the optional visual confirmation on the live URL.
result: [pending]

### 3. iOS Safari 실기기
Fields: device model, iOS version, date, pass/fail per item.

Items:
1. 폰트 렌더링: 본문과 제목이 Pretendard로 보이는지 확인 (굵은 제목, 한글 자형). 스크롤 중 글자가 늦게 바뀌지 않아야 한다.
2. iOS 버전 17.2 이상 (CSS nesting): 17.0/17.1이면 스타일이 깨지는 알려진 미지원 구간이므로 버전을 기록한다.
3. 카드 탭 상태 (`:has()`): 프로젝트 카드 썸네일을 탭했을 때 포커스/탭 반응이 있는지 확인한다.
4. 메뉴: 세로 휴대폰 폭에서 토글이 보이고, 열면 뒤 화면 스크롤이 잠기며, 버튼과 섹션 링크 탭으로 닫힌다. 스크롤 시 헤더 숨김/표시와 주소창 접힘 후 빈 틈이 없는지 확인한다.
5. 확대 대화상자 (zoom dialog): 스크린샷을 열고, 긴 스크린샷을 안에서 이동할 수 있으며, 뒤 페이지로 스크롤이 새지 않고, 닫기 버튼과 되돌리기 동작이 되고, 닫으면 포커스가 썸네일로 돌아온다.
6. 앵커 이동: Keywords/Skills/Career/Contact 링크가 sticky 헤더 아래에 착지하고, 푸터의 사이트 정보 링크가 #colophon으로 이동한다.
7. 링크: 외부 링크가 새 탭으로 열리고 (새 탭), mailto가 메일 앱을 열며, 전화번호 자동 링크가 없다.
8. 회전과 확대: 가로 회전 후 복귀, 핀치 줌 가능 (`user-scalable=no` 없음), 375px 폭에서 가로 스크롤이 없다.
9. 홈 화면 아이콘 (선택): 홈 화면에 추가하면 검은 모서리 없이 초록 Y 아이콘이 보인다.
10. 메신저 링크 미리보기: 공개 URL을 KakaoTalk (가능하면 iMessage)에 붙여넣어 제목, 설명, 이미지가 나오는지 확인한다. 카카오 스크랩 성공 여부도 여기서 확인한다.

Gap rule: 기기가 없으면 gap(기기 없음)으로 기록한다. 이 경우 Colophon은 `iOS Safari · 실기기 확인 전` 표기를 유지하며, iOS는 테스트했다고 주장하지 않는다.

expected: Every item passes on a real iPhone/iPad, or the missing device is written down as a gap.
result: [pending]

### 4. 최종 공개 확인
Steps:
1. After deploy 2, open the live URL.
2. Confirm the Colophon is filled with the measured values.
3. Only then share the link.

expected: The live site opens without errors and the Colophon shows measured values. The link is shared only after this check.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
