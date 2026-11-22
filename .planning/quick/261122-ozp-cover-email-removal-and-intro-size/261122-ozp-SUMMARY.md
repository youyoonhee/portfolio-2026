---
quick_id: 261122-ozp
status: complete
completed: 2026-11-22
commits: [50ca1ff]
---

# Quick 261122-ozp Summary: cover email removed, cover intro at 18px

The cover no longer shows the email (`p.cover-mail` deleted; the address stays in `#contact` only), and `.cover-intro` is `font-size: 1.125rem` (measured 18px at 320, 375, 768 and 1440).

## Changes (commit 50ca1ff)
- **index.html:** `p.cover-mail` removed from `section#cover`.
- **css/components.css:** `.cover-intro` font-size `var(--text-body)` -> `1.125rem` (no token added; max-inline-size 28em, colour and centring kept). The `html.js .cover-mail` animation selectors and the `.cover-mail a` block are gone; `.cover-intro` keeps its rise and its `+3 x stagger` delay.
- **css/print.css:** `.cover-mail` dropped from the motion-state guard list.
- **tools/check-content.mjs:** hero check inverted: `section#cover` must contain no `mailto:` link. Contact mailto check unchanged.
- **tools/content-manifest.json:** `hero.email` removed (no longer read); `contact.email` and the source-coverage entry for the address stay.
- **tools/check-ui.mjs:**
  - focus-ring third target: `.cover-mail a` -> `.contact-list a` (still a mailto link, both widths).
  - skip 3 and menu 2 (tab order): the third stop is now asserted to be the first `main a[href]` (currently `#kn-wecankids`) instead of a mailto link. Menu 2 then blurs and scrolls back to the top, because that link sits below the fold and the later "link click navigates" step (menu 8) assumes it starts from the top.
  - cover 2 / cover 6 / cover-orbs reduced: `.cover-mail` removed from the selector lists; counts 5 -> 4 and 9 -> 8. The h1 line timing assertions are unchanged.
  - cover 5 retargeted: "intro not visibility-hidden during entrance" on `.cover-intro`.
  - cover-orbs contrast list: `.cover-mail a` entry dropped.
  - keyword-focus start point: `page.focus('#main')` (tabindex -1, directly before the first keyword link).
- **tools/check-layout.mjs:** `.cover-mail a` dropped from the tap-target selector list.
- **tools/check-contrast.mjs:** accent-strong over gold / orb-2 / sage-soft / cover-bg removed (only the cover email used accent-strong over the cover); ink-2 circle pairs and accent-strong on bg kept.

## Verification
- `grep -rn "cover-mail" index.html css js tools` -> nothing.
- `npm run check` exit 0; `npm run check:ui` exit 0 (204 PASS; first run had menu 2/menu 8 fail, fixed as above); `npm run check:layout` exit 0; `npm run check:source` exit 0; `npm run check:artifact` exit 0; `npm run pdf` exit 0.
- PDF: 7 pages, A4 portrait, 585,147 bytes, all pdf-report checks PASS (mailto 1, from #contact).
- Measured `.cover-intro`: 18px at 320 (2 lines, 288px wide), 375 (2 lines, 338px), 768 and 1440 (1 line, 490px); no horizontal overflow; no mailto in cover, mailto in contact.
- Screenshots: `dist/cover-noemail/cover-375.png`, `dist/cover-noemail/cover-1440.png` (taken after 9s). Wrapping looks fine; no change to max-inline-size.

## Deviations
- [Rule 1] menu 2 tab-order check also asserted the third tab stop was a mailto link (not listed in the plan's line refs); retargeted like skip 3, plus a scroll-to-top so menu 8 keeps its starting position.

## Self-Check: PASSED
