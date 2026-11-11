# Phase 2 검사 증거 (02-06)

실행일 2026-11-11. 02-TASTE-REPORT.md에 `fix in 02-06` 항목이 없어 index.html은 수정하지 않았다. pdf:spike 수치는 02-PDF-SPIKE.md와 같아(9쪽, 142,639 bytes) 갱신하지 않았다.

## 최종 상태

- `npm run check`: exit 0
- `npm run check:source`: exit 0 (PASS source-coverage (site 65 / excluded 14 / unmapped 0))
- `npm run check:contrast`: exit 0
- `npm run check:layout`: exit 0
- `npm run pdf:spike`: exit 0

## SC1 Pretendard self-host, @layer, 키트 CSS 없음

- 폰트: check:layout 줄 `fonts: family Pretendard, check true, woff2 requests 23, third-party 0` (375/768/1440 모두 동일)
- `@layer` 파일: css/base.css, components.css, layers.css(순서 선언), layout.css, reset.css, tokens.css, utilities.css, print.css
- `grep -rn "@import" css` 결과 없음. 키트 CSS(system.css 등)는 로드하지 않는다.
- design-taste 검사 보고: [02-TASTE-REPORT.md](02-TASTE-REPORT.md)

## SC2 반응형 레이아웃 (375/768/1440)

```
PASS 375px overflow: viewport 375, scrollWidth 375, body 375
PASS 375px grid columns: want 1, got ["gi-data:1","kn-curation:1","bistones:1","abbey-road:1"]
PASS 375px equal heights in kn-curation: 7 cards, 0 uneven rows
PASS 375px keyword section: 3 blocks, visible [true,true,true]
PASS 375px anchor #career (link click): offset below header 15.6px
PASS 375px anchor #keywords (hash): offset below header 16.0px
PASS 375px anchor #abbey-road (link click): offset below header 15.9px
PASS 375px meta of #abbey-road visible: top 581.6, bottom 771.9, header 112.0, viewport 812
PASS 375px anchor #kn-fsd (link click): offset below header 16.1px
PASS 375px meta of #kn-fsd visible: top 389.2, bottom 497.9, header 112.0, viewport 812
PASS 375px anchor #gi-oneday (link click): offset below header 16.3px
PASS 375px meta of #gi-oneday visible: top 389.4, bottom 554.1, header 112.0, viewport 812
PASS 375px anchor #ab-peach (hash): offset below header 16.1px
PASS 375px meta of #ab-peach visible: top 411.6, bottom 601.9, header 112.0, viewport 812
PASS 375px tap targets: all >= 44px (keywords >= 48px)
PASS 375px fonts: family Pretendard, check true, woff2 requests 23, third-party 0
PASS 768px overflow: viewport 768, scrollWidth 768, body 768
PASS 768px grid columns: want 2, got ["gi-data:2","kn-curation:2","bistones:2","abbey-road:2"]
PASS 768px equal heights in kn-curation: 7 cards, 0 uneven rows
PASS 768px keyword section: 3 blocks, visible [true,true,true]
PASS 768px anchor #career (link click): offset below header 15.5px
PASS 768px anchor #keywords (hash): offset below header 16.0px
PASS 768px anchor #abbey-road (link click): offset below header 16.0px
PASS 768px meta of #abbey-road visible: top 593.1, bottom 741.9, header 112.0, viewport 1024
PASS 768px anchor #kn-fsd (link click): offset below header 15.8px
PASS 768px meta of #kn-fsd visible: top 388.4, bottom 452.4, header 112.0, viewport 1024
PASS 768px anchor #gi-oneday (link click): offset below header 15.9px
PASS 768px meta of #gi-oneday visible: top 388.6, bottom 511.7, header 112.0, viewport 1024
PASS 768px anchor #ab-peach (hash): offset below header 16.1px
PASS 768px meta of #ab-peach visible: top 411.1, bottom 559.9, header 112.0, viewport 1024
PASS 768px tap targets: all >= 44px (keywords >= 48px)
PASS 768px fonts: family Pretendard, check true, woff2 requests 23, third-party 0
PASS 1440px overflow: viewport 1440, scrollWidth 1440, body 1440
PASS 1440px grid columns: want 3, got ["gi-data:3","kn-curation:3","bistones:3","abbey-road:3"]
PASS 1440px equal heights in kn-curation: 7 cards, 0 uneven rows
PASS 1440px keyword section: 3 blocks, visible [true,true,true]
PASS 1440px anchor #career (link click): offset below header 15.9px
PASS 1440px anchor #keywords (hash): offset below header 16.0px
PASS 1440px anchor #abbey-road (link click): offset below header 15.6px
PASS 1440px meta of #abbey-road visible: top 575.7, bottom 698.9, header 72.0, viewport 900
PASS 1440px anchor #kn-fsd (link click): offset below header 15.7px
PASS 1440px meta of #kn-fsd visible: top 375.8, bottom 439.8, header 72.0, viewport 900
PASS 1440px anchor #gi-oneday (link click): offset below header 16.5px
PASS 1440px meta of #gi-oneday visible: top 376.6, bottom 499.8, header 72.0, viewport 900
PASS 1440px anchor #ab-peach (hash): offset below header 15.6px
PASS 1440px meta of #ab-peach visible: top 375.7, bottom 498.9, header 72.0, viewport 900
PASS 1440px tap targets: all >= 44px (keywords >= 48px)
PASS 1440px fonts: family Pretendard, check true, woff2 requests 23, third-party 0
```

스크린샷(dist/shots, 커밋하지 않음): w375.png, w768.png, w1440.png

## SC3 대비

```
PASS color-accent #0a7a3d on color-bg #ffffff  5.43:1 (min 4.5, text)
PASS color-accent #0a7a3d on color-surface #f7f8f7  5.10:1 (min 4.5, text)
PASS color-accent #0a7a3d on color-accent-tint #eaf6ee  4.90:1 (min 4.5, text)
PASS color-bg #ffffff on color-accent #0a7a3d  5.43:1 (min 4.5, text)
PASS color-accent-strong #075c2d on color-bg #ffffff  8.15:1 (min 4.5, text)
PASS color-ink #111827 on color-bg #ffffff  17.74:1 (min 4.5, text)
PASS color-ink-2 #4b5563 on color-bg #ffffff  7.56:1 (min 4.5, text)
PASS color-ink-2 #4b5563 on color-surface #f7f8f7  7.10:1 (min 4.5, text)
PASS color-ink-3 #5b6370 on color-bg #ffffff  6.06:1 (min 4.5, text)
PASS color-ink-3 #5b6370 on color-surface #f7f8f7  5.70:1 (min 4.5, text)
PASS color-ink-3 #5b6370 on color-accent-tint #eaf6ee  5.46:1 (min 4.5, text)
PASS color-accent #0a7a3d on color-bg #ffffff  5.43:1 (min 3, focus ring)
PASS color-line-strong #8a919c on color-bg #ffffff  3.18:1 (min 3, non-text)
```

## SC4 10초 테스트

| 폭 | 과제 | 시간(초) | 사용한 경로 | 통과 |
|----|------|----------|-------------|------|
| | | | | |

(체크포인트 후 채움)

## SC5 PDF spike

```
bytes 142639, pages 9, MediaBox [0 0 594.95996 841.91998]
PASS fonts: TrueType Pretendard only (type3 0, FontFile2 2)
PASS page size A4 portrait ([0 0 594.95996 841.91998])
PASS links clickable (5/5 external, mailto 2)
PASS Korean extraction (projects 13/13, keywords 3/3, U+FFFD 0)
PASS chrome hidden (no header, nav, browser footer) (none found)
cards per page (platform/contribution): 0/0 0/0 2/2 1/1 4/4 3/3 2/2 1/1 0/0
PASS no card split across pages (13 cards)
PASS phone guard
```

상세: [02-PDF-SPIKE.md](02-PDF-SPIKE.md)
