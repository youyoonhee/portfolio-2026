---
phase: quick-261117-klf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tools/make-deco.mjs
  - img/deco/cat-run.png
  - img/deco/cursor.png
  - img/deco/cat-desk.png
  - index.html
  - css/components.css
  - css/print.css
  - tools/stage-pages.mjs
  - tools/check-artifact.mjs
autonomous: true
requirements: [QUICK-261117-klf]

must_haves:
  truths:
    - "A running pixel cat sits next to the PORTFOLIO. wordmark in the header without changing the header height (64/72/112px) at 320/375/768/1024/1440"
    - "A pixel cursor arrow sits right after the word expected. in the cover h1 and scales with the clamp() heading size (em-based)"
    - "A pixel cat-at-desk sticker sits next to the Contact. heading inside the grey Contact panel"
    - "All three images have transparent backgrounds (no white box on the #f7f8f7 Contact panel), crisp pixel edges, and empty alt"
    - "The submission PDF still has 7 pages, is under 5MB, and shows none of the three decorations"
    - "The Pages artifact contains img/deco/*.png and both allowlists accept them"
  artifacts:
    - path: "tools/make-deco.mjs"
      provides: "Reproducible JPG -> transparent, trimmed PNG conversion (source path from argv)"
    - path: "img/deco/cat-run.png"
      provides: "Header decoration"
    - path: "img/deco/cursor.png"
      provides: "Cover decoration"
    - path: "img/deco/cat-desk.png"
      provides: "Contact decoration"
  key_links:
    - from: "index.html"
      to: "img/deco/*.png"
      via: "img src (relative path)"
      pattern: "src=\"img/deco/(cat-run|cursor|cat-desk)\\.png\""
    - from: "tools/stage-pages.mjs"
      to: "img/deco"
      via: "DIRS allowlist entry"
      pattern: "img/deco"
    - from: "tools/check-artifact.mjs"
      to: "img/deco"
      via: "ALLOW regex"
      pattern: "img\\\\/deco"
---

<objective>
Convert the user's three pixel-art JPGs into small transparent PNGs and place them as purely decorative images: running cat in the header next to the wordmark, cursor arrow after "expected." in the cover h1, cat-at-desk next to the Contact heading. Keep every existing check, the header height, the cover entrance, the Contact panel and the 7-page PDF unchanged.

Purpose: a little personality on the site without touching content accuracy or layout guarantees.
Output: tools/make-deco.mjs, img/deco/{cat-run,cursor,cat-desk}.png, markup + CSS, allowlist updates, screenshots in dist/deco-shots/.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md

Hard rules (from orchestrator): never read private/, .planning/source/, _screenshots/; never write a phone number; no push, no gh write calls, no --no-verify, do not run design-taste gate.mjs, never kill processes by name, use node not python. Stage files by explicit path; leave .planning/config.json and .claude/ untouched. The source JPGs live OUTSIDE the repo and must never be copied into or committed to the repo. Do NOT touch tools/measurements.json and do not deploy.

Source images (read-only, RGB JPG, no alpha):
- SRC_DIR = C:/Users/user/AppData/Local/Temp/claude/a5c678dff06bf45e/7dfd9e60-a77f-4020-b364-baa59c46925a/images
- 1.jpg 354x346 — cursor arrow (lavender/pink, black outline)
- 2.jpg 736x736 — white running cat (black outline, pink ears). Interior white body is enclosed by the black outline.
- 3.jpg 736x1308 — cat at desk sticker with a WHITE sticker outline on a NEAR-WHITE canvas, lots of empty space above/below.

<interfaces>
Existing markup (index.html):
- line 55-68: `<header class="site-header"><div class="header-bar"><p class="wordmark" lang="en">PORTFOLIO.</p><button class="nav-toggle" ...>...<nav id="site-nav" class="site-nav">...</nav></div></header>`
- line 73: `<h1 id="cover-title" lang="en"><span class="cover-line">Publishing,</span> <span class="cover-line">beyond the</span> <span class="cover-line">expected.</span></h1>`
- line 418-420: `<section id="contact" aria-labelledby="contact-title"><p class="eyebrow" lang="en">...08 / Contact</p><h2 id="contact-title" lang="en">Contact.</h2>`

CSS facts:
- css/tokens.css: --color-bg #ffffff, --color-surface #f7f8f7 (Contact panel background via #contact::before), --text-label 0.875rem, --text-heading clamp(24px, 2.4vw + 16px, 36px), --text-display clamp(48px, 6vw + 8px, 96px), --header-h 64px / 72px (>=900px) / 112px (no-JS <900px).
- css/layout.css .header-bar: flex, wrap, align-items center, space-between, min-block-size 64px (72px >=900px).
- css/components.css (inside `@layer components`): `.wordmark { font-size: var(--text-label); line-height: 1.4; ... }`; no-JS <900px: `html:not(.js) .wordmark { display:flex; align-items:center; min-block-size:64px }`. `.cover h1 { font-size: var(--text-display); line-height: 1.05 }`. `.cover-line` spans animate with `cover-rise` under `html.js` and prefers-reduced-motion: no-preference.
- css/print.css: `.site-header, .nav-toggle, .skip-link, .site-nav { display:none !important }` already (header deco hidden in print automatically, still add an explicit rule for all three).

Check constraints discovered (do not break):
- tools/check-content.mjs only validates `<img>` inside `.shot` / data-slot="screenshot" (alt must be non-empty THERE) — decorative imgs outside `.shot` are not subject to it. 404.html must contain NO img — do not touch 404.html.
- tools/build-pdf.mjs only rewrites `.shot img`; deco imgs are ignored by it, so hide them in print.
- tools/check-ui.mjs "cover 2" expects exactly 5 elements from `.cover-line, .cover-intro, .cover-mail` — do not add/remove those classes. "header height" asserts --header-h values.
- tools/check-repo.mjs scans binaries by signature; PNG is on its allowlist.
- tools/stage-pages.mjs: `DIRS` array of [dir, regex] (css, js, fonts/pretendard, fonts/print, fonts). tools/check-artifact.mjs: `ALLOW` regex list (independent, deliberately not shared) + `--self-test` with a fixture builder `w(dir, path)`.
- Browser helpers: tools/lib/browser.mjs `launchChrome(extra)` / `closeBrowser(browser)`; tools/lib/static-server.mjs `startStaticServer(root)`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Conversion tool and the three PNGs</name>
  <files>tools/make-deco.mjs, img/deco/cat-run.png, img/deco/cursor.png, img/deco/cat-desk.png</files>
  <action>
Create tools/make-deco.mjs (ES module, node + sharp 0.35.5 only, header comment in the style of other tools). CLI: `node tools/make-deco.mjs <input.jpg> <output.png> --height <px> [--tol <n>]`. Input path ALWAYS comes from argv (never hard-code the temp path; the script must not reference the temp directory at all). Refuse to write outside img/deco/ (resolve output, require it to be inside ROOT/img/deco, filename `^[a-z0-9-]+\.png$`). Exit 1 with a usage message on bad args or missing input.

Algorithm:
1. `sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })` → RGB buffer.
2. Background colour = per-channel median of the pixels on the 1px outer border.
3. Flood fill (iterative BFS with an Int32Array queue, 4-connected) seeded from every border pixel whose colour distance to the background is <= tol (distance = max abs channel difference; default tol 24). Mark visited pixels transparent. Only pixels CONNECTED to the edges are removed, so the enclosed white cat body stays opaque.
4. Build an RGBA buffer (alpha 0 for filled, 255 otherwise), then `.trim()`-equivalent: compute the bounding box of opaque pixels yourself and `extract` it (sharp trim works on colour, not reliably on alpha here) plus 0px padding.
5. Resize to the requested `--height` with `kernel: 'nearest'` (pixel-art crispness), keep aspect ratio.
6. Output `.png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 })` (palette PNG keeps it tiny; sharp default output strips metadata). Print `output WxH bytes` to stdout so the executor can copy the intrinsic size into the HTML.

Image 3 sticker outline: the white sticker outline touches the near-white canvas, so a large tol would eat it and leave a halo-less sticker on the grey Contact panel. Before generating cat-desk, probe: print the median border colour of 3.jpg and sample a few outline pixels (write a throwaway probe in the scratchpad, not in the repo, or add a `--probe` flag to the tool that prints the border median and the histogram of near-white values). Choose tol so the canvas goes but the outline (closer to pure #fff or separated by a faint grey shadow) survives; if canvas and outline are indistinguishable (difference under ~4), use a small tol and record in the SUMMARY that the outline was partly lost. Also check the result for a light JPEG fringe: if visible on a dark test background, the executor may add an option `--fringe <n>` that, after the fill, also clears edge-adjacent pixels within a wider tol (e.g. 48) one ring deep — only if needed.

Sizes (output = 2x the max CSS display height, per user request):
- cat-run.png: display 32px tall in the header → `--height 64`.
- cursor.png: display 0.7em of the cover h1 (max 96px → ~68px) → `--height 136`.
- cat-desk.png: display up to 112px tall next to the Contact heading → `--height 224`.

Run, with SRC_DIR from the context:
node tools/make-deco.mjs "$SRC_DIR/2.jpg" img/deco/cat-run.png --height 64
node tools/make-deco.mjs "$SRC_DIR/1.jpg" img/deco/cursor.png --height 136
node tools/make-deco.mjs "$SRC_DIR/3.jpg" img/deco/cat-desk.png --height 224 --tol N (N from the probe)

Then view each PNG with the Read tool (and composite a copy onto #f7f8f7 and #222 in dist/ for viewing, e.g. dist/deco-check-*.png via sharp `flatten`) to confirm: transparent corners, white cat body opaque, no white box, outline crisp.
  </action>
  <verify>
    <automated>node -e "const s=require('sharp');Promise.all(['cat-run','cursor','cat-desk'].map(async n=>{const f='img/deco/'+n+'.png';const {data,info}=await s(f).ensureAlpha().raw().toBuffer({resolveWithObject:true});const m=await s(f).metadata();const fs=require('fs').statSync(f).size;const a=(x,y)=>data[(y*info.width+x)*4+3];const ok=m.format==='png'&&info.channels===4&&a(0,0)===0&&a(info.width-1,info.height-1)===0&&fs<30000&&!m.exif&&!m.icc;console.log(n,info.width+'x'+info.height,fs,ok?'OK':'FAIL');if(!ok)process.exitCode=1}))"</automated>
  </verify>
  <done>Three palette PNGs exist in img/deco/ with transparent corners, each under 30KB, heights 64/136/224, no EXIF/ICC; visual check on light grey and dark backgrounds shows no white box and the running cat's body is still white.</done>
</task>

<task type="auto">
  <name>Task 2: Markup, CSS, print hiding and artifact allowlists</name>
  <files>index.html, css/components.css, css/print.css, tools/stage-pages.mjs, tools/check-artifact.mjs</files>
  <action>
index.html (use the intrinsic sizes printed in Task 1 for width/height; all paths relative, never leading slash):
- Header: inside the wordmark p, after the text: `PORTFOLIO.<img class="deco deco-cat-run" src="img/deco/cat-run.png" alt="" width=W height=64 decoding="async">` — NO loading=lazy (above the fold). Keep `lang="en"` and the text unchanged.
- Cover: inside the third `.cover-line` span, after "expected.": `<img class="deco deco-cursor" src="img/deco/cursor.png" alt="" width=W height=136 decoding="async">` (no lazy; it is above the fold). Putting it inside the span makes it ride the existing cover-rise entrance (no new motion) and keeps it on the same line as "expected.". Do not add or remove .cover-line/.cover-intro/.cover-mail elements.
- Contact: wrap nothing; put the img inside the h2 after the text: `Contact.<img class="deco deco-cat-desk" src="img/deco/cat-desk.png" alt="" width=W height=224 loading="lazy" decoding="async">`. Empty alt keeps the accessible name "Contact." (aria-labelledby on the section). No aria-hidden needed.

css/components.css (inside the existing `@layer components` block, near .wordmark / .cover rules; use native nesting like the rest of the file):
- `.deco { image-rendering: pixelated; display: inline-block; vertical-align: middle; flex: none; user-select: none; pointer-events: none; }` and `max-inline-size: none` only if the reset forces max-inline-size:100% and that distorts the em sizing.
- `.deco-cat-run { block-size: 32px; inline-size: auto; margin-inline-start: 0.5em; }` — 32px fits the 64px bar and the 64px no-JS wordmark row, so --header-h does not change. Make the wordmark keep text and cat on one line: add `white-space: nowrap` to `.wordmark` if needed at 320px (verify the nav-toggle still fits).
- `.deco-cursor { block-size: 0.7em; inline-size: auto; margin-inline-start: 0.08em; vertical-align: baseline; }` (em of the h1 so it scales with --text-display). Add `white-space: nowrap` to `.cover-line:nth-child(3)` only if the arrow wraps alone onto its own line at 320px. text-wrap: balance on the h1 must keep working (do not change h1 text-wrap).
- `.deco-cat-desk { block-size: clamp(72px, 2.4em + 16px, 112px); inline-size: auto; margin-inline-start: 0.35em; vertical-align: bottom; }` — h2 font-size is --text-heading; if this inflates the h2 line box too much, instead make `#contact-title` `display:flex; align-items:flex-end; gap:...` (h2 is a block so this is safe) and drop the margin. Pick whichever looks better in the Task 3 screenshots; the Contact panel padding must not collapse.
- No new animation. No hover effect.

css/print.css: in the existing print block add `.deco { display: none !important; }` with a short comment "decorations stay off the submission PDF (page plan unchanged)". The header deco is already hidden with .site-header; the rule covers cover and contact.

tools/stage-pages.mjs: add `['img/deco', /^[a-z0-9-]+\.png$/]` to `DIRS`. If listDir throws on a missing dir, check its behaviour — img/deco exists after Task 1, so no special case needed.
tools/check-artifact.mjs: add `/^img\/deco\/[a-z0-9-]+\.png$/` to `ALLOW` (keep it independent from stage-pages). In `--self-test`, add one negative case following the existing `neg(...)` pattern: `neg('deco-not-png', (d) => w(d, 'img/deco/x.svg'), 'FAIL not-allowlisted img/deco/x.svg')`, and make sure the positive fixture still passes (optionally write `img/deco/x.png` into the good fixture and reference it nowhere — only if unreferenced files are allowed; otherwise skip).

Do NOT edit tools/content-manifest.json, uiAllowlist, tools/measurements.json, or 404.html unless a check fails and explicitly requires it; if one does, record why in the SUMMARY.
  </action>
  <verify>
    <automated>npm run validate && npm run check:content && npm run check:artifact && npm run check:images && npm run check:preview && npm run colophon:check</automated>
  </verify>
  <done>index.html has three `.deco` imgs with alt="", width/height, relative src; header one is not lazy; print.css hides .deco; dist/site contains img/deco/cat-run.png, cursor.png, cat-desk.png; artifact self-test passes including the new negative case.</done>
</task>

<task type="auto">
  <name>Task 3: Full check run, PDF and screenshots</name>
  <files>(no committed files; outputs in dist/ which is gitignored)</files>
  <action>
1. Run in order: `npm run check`, `npm run check:ui` (known flake: keyword-focus — re-run once if only that fails), `npm run check:layout`, `npm run check:source`, `npm run check:artifact`, `npm run pdf`. Read the pdf output: page count must still be 7 and size under 5MB. Fix any regressions in the Task 2 files (e.g. header row overflow at 320px → shrink the cat to 28px or nowrap the wordmark; h1 wrap issue → nowrap the third line).
2. Screenshots: write a throwaway script dist/deco-shots.mjs (dist/ is gitignored, so node resolves puppeteer-core from the repo node_modules) that imports `launchChrome`/`closeBrowser` from ../tools/lib/browser.mjs and `startStaticServer` from ../tools/lib/static-server.mjs (read its return shape first), serves the repo root, and for viewports 375x812 and 1440x900 (also 320x700 as a sanity check) saves: the header+cover viewport at scrollY 0 after the cover entrance finishes (wait ~1.5s, or emulate prefers-reduced-motion: reduce), and an element screenshot of #contact. Output to dist/deco-shots/{vw}-cover.png and dist/deco-shots/{vw}-contact.png. Close the browser via closeBrowser and close the server; never kill processes by name.
3. Look at the screenshots with the Read tool and confirm: cat beside PORTFOLIO. on one line, header height unchanged, menu toggle visible at 375; cursor right after "expected." at both sizes; cat-desk beside Contact. on the grey panel with no white box.
4. In the SUMMARY note: the Colophon still shows Lighthouse/Nu values measured on 2026-11-17 before this change; re-measurement and redeploy are pending user approval; tools/measurements.json was not touched. Also note the chosen tol for cat-desk and whether the sticker outline survived.
5. Commit by explicit paths only: tools/make-deco.mjs img/deco/cat-run.png img/deco/cursor.png img/deco/cat-desk.png index.html css/components.css css/print.css tools/stage-pages.mjs tools/check-artifact.mjs (plus the quick-task SUMMARY/PLAN per the workflow). Never stage .planning/config.json, .claude/, dist/, or the source JPGs.
  </action>
  <verify>
    <automated>npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:artifact && npm run pdf && node -e "const fs=require('fs');for(const v of [375,1440])for(const k of ['cover','contact']){const f='dist/deco-shots/'+v+'-'+k+'.png';if(!fs.existsSync(f)){console.log('missing',f);process.exitCode=1}}"</automated>
  </verify>
  <done>All listed npm scripts exit 0; PDF is 7 pages and under 5MB; dist/deco-shots/ holds 375 and 1440 cover/contact screenshots that show all three decorations placed correctly; commit contains only the explicit paths.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| local temp source -> repo | User-supplied JPGs outside the repo are converted; only derived PNGs enter the public repo |
| repo -> GitHub Pages artifact | Allowlisted files are published |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-klf-01 | Information disclosure | img/deco/*.png | mitigate | sharp output strips EXIF/ICC; Task 1 verify asserts no exif/icc; source JPGs never copied into the repo |
| T-klf-02 | Tampering | tools/make-deco.mjs output path | mitigate | output restricted to ROOT/img/deco with a strict filename regex |
| T-klf-03 | Information disclosure | Pages artifact | mitigate | new allowlist entries accept only `img/deco/[a-z0-9-]+.png`; check-artifact self-test negative case for non-png |
| T-klf-04 | Information disclosure | PDF (contains phone) | accept | PDF pipeline unchanged; decorations hidden in print; no phone written anywhere by this task |
</threat_model>

<verification>
- Three PNGs transparent, trimmed, crisp, tiny, metadata-free
- Header height tokens unchanged (check:ui header height), layout checks pass at all breakpoints
- PDF 7 pages, under 5MB, no decorations
- Artifact allowlists include img/deco/*.png
</verification>

<success_criteria>
`npm run check`, `check:ui`, `check:layout`, `check:source`, `check:artifact`, `pdf` all exit 0; screenshots at 375 and 1440 saved in dist/deco-shots/; SUMMARY records that the Colophon measurements predate this change and re-measure/redeploy await user approval.
</success_criteria>

<output>
Create `.planning/quick/261117-klf-pixel-deco-images/261117-klf-SUMMARY.md` when done
</output>
