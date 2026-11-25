---
quick_id: 261125-tf4
type: quick
status: complete
commit: 71bfbe8
---

# Quick 261125-tf4: calmer Keywords dial on phones

User request (2026-11-25): "On my phone the keyword area is still touch-sensitive; improve it more."

## Changes
- **Phone track:** one full screen of scroll per step below 640px, up from 0.7. The hold after step 4 stays 0.7 of a step.
- **KW_MARGIN:** up from 0.25 to 0.3 of a step.
- **KW_DWELL:** up from 500 to 600ms. The dwell is now always respected while scrolling, with no whole-step bypass.
- **One step at a time:** while scrolling, the dial turns at most one step per dwell, so a fast flick shows each keyword in turn.
- **Settle with hysteresis:** at rest, a stop inside the margin past a boundary keeps the shown step. The keyword no longer flips after the finger lifts. A farther stop catches up.
- **check-ui:** the phone step length is now 1 screen; the 1440 marks moved to mid-step; and the at-rest test expects the held step.

## Verification
check, check:ui, check:layout and pdf (12 pages) all exit 0.
