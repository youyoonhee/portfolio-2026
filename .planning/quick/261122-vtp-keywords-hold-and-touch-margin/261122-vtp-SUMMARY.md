---
quick_id: 261122-vtp
type: quick
status: complete
commit: 5797e24
---

# Quick 261122-vtp: hold after step 4, and a wider touch margin

User requests (2026-11-22), after checking on a phone:
- "Add about 0.5s of delay after keyword step 4, AI 활용, before you can scroll on."
- "The keyword area is still a bit touchy. Would raising the threshold help?"

## Changes
- **Hold after step 4:** the track has 0.7 of a step extra after step 4, `KW_TAIL` in js/main.js. It is 4.7 steps in `css/layout.css`: 0.35 screen on desktop and 0.49 screen on phones.
  - The stage stays pinned on step 4 there.
  - No scroll blocking: a timed lock would be scroll hijacking, so the pause comes from scroll distance.
- **Margin:** `KW_MARGIN` goes from 0.15 to 0.25 of a step (about 140px on a 375×812 phone).
- **Dwell:** `KW_DWELL` goes from 350 to 500ms.
- **check-ui:**
  - slot math and track height include the hold;
  - a new keyword-touch assertion checks that at 4.2 and 4.6 steps the stage is pinned on step 4.

## Verification
check, check:ui, check:layout and pdf (12 pages) all exit 0.
