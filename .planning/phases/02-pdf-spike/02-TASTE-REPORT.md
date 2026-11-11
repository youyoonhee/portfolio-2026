# Phase 2 design-taste checker report (advisory)

Command (repo root, advisory only; gate.mjs was never run):

```
node ~/.claude/skills/design-taste-frontend/scripts/consistency.mjs index.html --quick --widths 1440,390 --page service --profile .taste-skill/profile
```

Browser: headless Edge 156.0.4314.58 (bundled with the checker's own profile in `.taste-skill/profile`). Logs: `.taste-skill/run-1.log`, `run-2.log` (gitignored).

Waivers are recorded here, not in `.taste-skill/waivers.json`: gate.mjs caps waivers at 5 and `gate.mjs --start` arms a Stop hook (RESEARCH), so it is never run. `--page service` covers UI-SPEC W-1 and no data-type meta was added.

## Run 1 (finished Phase 2 page, before this plan's fixes)

- 1440x900: 10 screens, 43 FAIL, 13 WARN
- 390x844: 17 screens, 18 FAIL, 9 WARN
- 320 and 768 sweeps: 2 FAIL (off-viewport skip link, hero-fill at 768), 1 WARN
- Total: **63 FAIL, 23 WARN**

Checks with 0 FAIL and 0 WARN that the plan named as real candidates: focus-hidden PASS, collide PASS, nav PASS, nav-covers PASS, hero-screen PASS, hero-enter PASS.

## Decision table

Counts are rows in the log across all widths (1440, 390, and the 320/768 sweeps). "run 2" is filled after the fixes.

| class | FAIL | WARN | decision | reason / W-n | phase |
|-------|------|------|----------|--------------|-------|
| focus-hidden | 0 | 0 | none needed | skip link already clears the fixed header | - |
| tap-size | 0 | 3 | fix | only the resting skip link (26px high, parked off screen); give it a 44px box | 2 (this plan) |
| off-viewport | 1 | 0 | fix | skip link rested at -9999px; park it above the viewport instead | 2 (this plan) |
| container-edges (content edges) | 3 | 0 | fix | keywords and contact panel padding pushed content 64px inside the wrap; panel ground moved to a pseudo-element so the content keeps the wrap edges | 2 (this plan) |
| container-edges (footer text centred) | 2 | 0 | fix | footer text set left (`text-align: start`) | 2 (this plan) |
| container-edges (cover content) | 1 | 0 | defer | cover is centred by design decision; hero composition is reworked with the entrance in Phase 3 | Phase 3 |
| container-edges (header/footer/skip-link "outside header.nav, main, footer.closing") | 4 | 0 | waive W-1 | kit-specific class names (`header.nav`, `footer.closing`); CSS is hand-written (DSGN-01) and all three share the same wrap math | - |
| no-visual | 17 | 0 | waive W-2 | no photographs or illustrations in the source; screenshots arrive in Phase 4 | Phase 4 |
| text-only | 2 | 0 | waive W-2 | contact section is text by design | - |
| card-visual | 4 | 0 | waive W-2 | cards carry empty `.shot` frames until Phase 4 screenshots | Phase 4 |
| section-height | 8 | 0 | waive W-3 | content-driven section heights (skills, career, contact shorter; kn-curation taller) | - |
| one-section | 3 | 0 | waive W-3 | career list and company sections share a screen by design | - |
| one-heading | 1 | 0 | waive W-3 | career block heading sits with the company list | - |
| section-tile | 4 | 1 | waive W-3 | same cause as section-height | - |
| empty-area | 2 | 2 | waive W-3 | cover and abbey-road leave whitespace; filled by screenshots in Phase 4 | Phase 4 |
| hero-fill | 1 | 0 | waive W-3 | cover is capped at `min(100svh - header, 880px)` by UI-SPEC, so a 1024px tall screen shows the next section | - |
| one-screen | 0 | 2 | waive W-3 | skills is shorter than one screen | - |
| cta | 5 | 1 | waive W-6 | the only hero action is an email link; copy is source-bound (CONT-06) | - |
| copy-headline, copy-headings | 0 | 2 | waive W-6 | h1 is fixed brand copy; Korean/source copy is exempt | - |
| moment-none | 0 | 1 | waive W-4 | dealt moment (keyword scroll switch) arrives in Phase 3 | Phase 3 |
| nav-current | 0 | 2 | defer | current-section marker is Phase 3 JS | Phase 3 |
| heading-scale | 3 | 0 | defer | keyword-title is the deliberate display size (D-11 scroll switch); size is retuned with the Phase 3 switch | Phase 3 |
| nav-labels | 0 | 1 | defer | nav "Skills" opens "Tech stack."; label text is source copy, a markup change would be `fix in 02-06` | 02-06 / Phase 3 |
| off-grid | 3 | 1 | defer | skills tiles pad their text 24px inside the page margin; tile restyle with Phase 3 polish | Phase 3 |
| row-lines | 2 | 0 | defer | a 2-card last row in a 3-column grid; content count, not layout | - |
| row-gap | 1 | 0 | defer | single card (kn-universe) in a last row; same cause as row-lines | - |
| section-gaps | 1 | 2 | defer | cover is centred in a taller block, so the first gap differs; tuned in Phase 3 | Phase 3 |
| link-styles | 0 | 2 | defer | career-link weight vs body links; one link look decided in Phase 3 | Phase 3 |
| heading-align, proximity | 0 | 3 | defer | advisory, no real defect found | Phase 3 |
| skip-link | 0 | 1 | defer | first Tab stop is already a skip link; the checker wants its own starter class | - |
| page-meta, share-meta | 0 | 2 | defer | OG/meta tags belong to the deploy phase | Phase 5 |

Inline links inside running sentences are exempt from the 44px rule (WCAG 2.5.8 inline exception).
