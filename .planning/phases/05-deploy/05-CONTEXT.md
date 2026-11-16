# Phase 5: 검증과 배포 - Context

**Gathered:** 2026-11-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The site goes up on GitHub Pages at a link only recipients know. Search engines do not index it. Before release it passes:
- link and 404 checks;
- real-browser checks in Chrome, Edge and iOS Safari;
- a final phone-number scan.

This phase also adds four things:
- link-preview metadata (OG tags and a favicon);
- a Colophon that reports measured results only;
- a README.

Requirements: QUAL-04, QUAL-05, QUAL-06, DEPL-01, DEPL-02, DEPL-03, DEPL-04.

Already done (do not redo):
- `<meta name="robots" content="noindex, nofollow">` is in `index.html`.
- The 링크알바 status is settled as `운영 종료` with no link, by the user's review on 2026-11-11 (01-CONTEXT D-14 revision). It is **not** rechecked.

</domain>

<decisions>
## Implementation Decisions

### 배포 주소와 방식
- **D-01:** Keep the current repo, `youyoonhee/portfolio-2026`, without renaming. The URL is `https://youyoonhee.github.io/portfolio-2026/`.
  - All paths stay relative.
  - Absolute URLs (`og:image`, `og:url`, canonical) use this base.
- **D-02:** Publish **only the site files**, through GitHub Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`). Do not deploy the branch root.
  - The artifact is built from an explicit allowlist: `index.html`, `404.html`, `robots.txt`, `css/`, `js/`, `fonts/`, `img/`, plus favicon and OG files.
  - `tools/`, `.planning/`, `package*.json`, `node_modules/` and `_screenshots/` must not be reachable at the Pages URL.
  - The workflow must fail if the artifact contains anything outside the allowlist, or if the phone scan finds a match.
- **D-03:** Claude turns Pages on with `gh`. This happens only after every check passes, the phone scan finds 0 matches, and the user approves in chat. It covers the Pages source set to "GitHub Actions" and the first deploy.
  - Afterwards, run linkinator and a network-404 check against the **deployed** URL.
  - Claude never handles tokens. It relies on the user's existing `gh` login.
- **D-04:** **The public deploy waits for real screenshots.** The user chose "스크린샷 넣고 배포".
  - Everything else (OG, favicon, Colophon, README, 404 page, Actions workflow, local and pre-deploy checks) can be built and verified before the screenshots arrive.
  - The final steps, turning Pages on and running the checks against the live URL, are blocked on 04-HUMAN-UAT test 1: screenshots added, reviewed, published, and the PDF at most 5MB.
  - The plan must model this as a human checkpoint, not skip it.

### Claude's Discretion
The user said Claude can decide these, as long as they fit the existing design and the facts-only rule.

- **Link preview (DEPL-03):**
  - `og:image` is a 1200×630 card generated from the site's own tokens and Pretendard. It shows the name and role only and makes no new claims. No screenshot is used, so it does not depend on D-04.
  - `og:title` and `og:description` reuse existing cover copy.
  - Add `og:url`, `og:type=website`, `og:locale=ko_KR` and `twitter:card=summary_large_image`.
  - Favicon set:
    - an SVG monogram in the site's accent color;
    - PNG fallbacks (32px, 180px `apple-touch-icon`);
    - an optional `site.webmanifest` only if it costs nothing.
  - Nothing in the preview contains the phone number or email.
- **Colophon (QUAL-06):**
  - A compact section, `#colophon`, after `#contact` and before the footer. It uses the existing `dl` and meta patterns.
  - Contents:
    - stack: hand-written HTML/CSS/JS, no build step;
    - responsive breakpoints;
    - the accessibility target (WCAG 2.2 AA level, matching what the checks actually enforce);
    - browsers tested;
    - Lighthouse scores and validator results, with the measurement date.
  - **Every number is measured on the deployed site, not invented.** Until then, values are filled from a measurement record file, not typed by hand. If a browser was not tested on a real device, the Colophon does not list it as tested.
  - The Colophon is web-only and is excluded from the submission PDF (`print.css`), so the PDF page budget is unchanged.
  - It is added to nav only if the nav pattern already fits; otherwise it is linked from the footer.
- **Real-device testing (QUAL-04):**
  - Claude checks Chrome and Edge with the existing headless and automation tools at several widths.
  - iOS Safari on a real device is done by the user, following a short checklist Claude writes (scroll, menu, zoom dialog, link opening, the font actually rendering). The result is recorded as UAT.
  - If no device is available, record it as a gap. Never claim iOS was tested.
- **README (DEPL-04):** In Korean, concise. It covers:
  - what was hand-written versus what came from other sources (Pretendard and the design-taste kit, if used);
  - how to run it locally (`npm run serve`);
  - the check commands;
  - how to build the PDF: `private/contact.json` is required and gitignored, and the phone number is never committed;
  - the screenshot rules: `_screenshots/<id>/` → `tools/screenshots.json` (draft/approved, masks, `noSensitive`) → `npm run images`.
  - The README never contains the phone number.
- **404.html:** A minimal page in the site's style with a link back to the home page, plus `noindex`.
- **robots.txt:** `User-agent: *` / `Disallow: /`. It works only as a hint on a project subpath. `noindex` stays the real guard.
- **Pre-deploy phone scan:** Re-run the existing repo and history scans (`check:repo`, `check:history`) and add a scan of the built Pages artifact, all expecting 0 matches.
  - The scan never prints the number. It reports only match counts and file names.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` § Phase 5: goal and the 5 success criteria.
- `.planning/REQUIREMENTS.md`: QUAL-04..06, DEPL-01..04.
- `.planning/PROJECT.md`: constraints (email only on the web, no fabricated facts, supported browsers).
- `CLAUDE.md`:
  - the GitHub Pages section (relative paths, `404.html`, `.gitignore` must-haves, no custom headers, so use `<meta>`);
  - the tool versions for linkinator 8.1.0 and html-validate 11.21.0.

### Prior decisions that constrain this phase
- `.planning/phases/01-foundation-content/01-CONTEXT.md` D-14..D-16 and the 2026-11-11 revision: link and status badge rules; 링크알바 is closed.
- `.planning/phases/03-pdf/03-CONTEXT.md`: phone injection at PDF build only, and the `private/contact.json` handling.
- `.planning/phases/04-screenshots/04-CONTEXT.md` and `04-HUMAN-UAT.md`: the screenshot pipeline and the pending UAT that blocks D-04.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tools/check-repo.mjs` (`check:repo`, `check:history`, `check:selftest`): the existing phone and private-data scans. Extend them or reuse them on the Pages artifact.
- `tools/lib/static-server.mjs`: a local static server for checks. Point the artifact checks at a staged copy of the allowlist.
- `npm run check:links`: linkinator against `http://127.0.0.1:3000`. Point it at the deployed URL for the post-deploy run.
- `tools/check-ui.mjs` and `tools/check-layout.mjs`: headless Chrome checks at multiple widths. Reuse them for the Chrome/Edge side of QUAL-04, and for the network-404 listener if they already capture responses.
- `tools/optimise-images.mjs` (sharp 0.35.5): can render the OG PNG and favicon PNGs from SVG, so no new dependency is needed.
- `css/tokens.css`: colors and type for the OG card, favicon, 404 page and Colophon.

### Established Patterns
- Hand-written semantic HTML, `@layer` CSS, and no build step for the site itself. The Actions workflow only copies the allowlist, nothing else.
- A pre-push hook runs `check-content`. Pushes must keep passing it, and `--no-verify` is never used.
- Every check has self-tests (RED/GREEN). New checks (artifact allowlist, artifact phone scan, OG and meta presence) should follow the same pattern.

### Integration Points
- `index.html` `<head>`: OG and twitter meta, favicon links, canonical.
- `index.html`: the new `#colophon` section between `#contact` and `<footer>`.
- `css/print.css`: exclude `#colophon` from the PDF.
- `tools/check-content.mjs`: add the Colophon to the content and section expectations. Its values must come from the measurement record.
- New files: `.github/workflows/pages.yml`, `404.html`, `robots.txt`, favicon and OG assets, `README.md`.

</code_context>

<specifics>
## Specific Ideas

- The user wants the link sent to recruiters only after real screenshots are in. Deploying with empty frames is not acceptable for the public release.

</specifics>

<deferred>
## Deferred Ideas

- Renaming the repo to `youyoonhee.github.io` or using a custom domain. The user declined this for now.
- Lighthouse CI (`@lhci/cli`) in Actions. A one-off manual measurement is enough for v1, per CLAUDE.md.
- The optional follow-ups from Phase 4: the `keyword-focus` check:ui flake and the 04-REVIEW info items IN-01..07. Not in this phase's scope unless they block a check.

</deferred>

---

*Phase: 05-검증과 배포*
*Context gathered: 2026-11-16*
