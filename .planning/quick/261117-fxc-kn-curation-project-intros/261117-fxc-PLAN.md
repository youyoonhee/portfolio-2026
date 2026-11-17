---
phase: quick-261117-fxc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - index.html
  - tools/content-manifest.json
  - tools/check-content.mjs
  - tools/check-shots-pdf.mjs
  - .planning/phases/01-foundation-content/01-CONTEXT.md
  - .planning/PROJECT.md
autonomous: true
requirements: [CONT-06]
must_haves:
  truths:
    - "The 케이엔큐레이션 section shows 5 cards in this order: puring, 위캔키즈클럽, FSD 코스메틱, 그린다, universe. 로드필 and 링크알바 are gone from the page and the PDF"
    - "Every KN card's meta list reads 플랫폼 -> 소개 -> 퍼블 기여도, with the exact user-provided intro text"
    - "The universe intro ends at '현재 관련 기사만 확인 가능'. The ChatGPT sentence no longer appears anywhere on the site"
    - "Other companies' cards still use the '담당 업무' label and are byte-identical to before"
    - "The source gates still pass: user-provided intro text is exempt through uiAllowlist + uiAllowlistReasons 'user-provided 2026-11-17', not by loosening the checker"
    - "npm run check, check:ui, check:layout, check:source, check:shots-pdf, check:pdfguard and pdf all exit 0"
  artifacts:
    - path: "index.html"
      provides: "11 project articles, 5 in #kn-curation"
      contains: "<dt>소개</dt><dd>복용약 알림 어플</dd>"
    - path: "tools/content-manifest.json"
      provides: "11 projects; metaLabel/descriptionNote on KN projects; allowlist + coverage updates"
      contains: "user-provided 2026-11-17"
    - path: "tools/check-content.mjs"
      provides: "projects check honouring metaLabel and descriptionNote"
      contains: "metaLabel"
    - path: "tools/check-shots-pdf.mjs"
      provides: "article count derived from manifest, not hard-coded 13"
  key_links:
    - from: "tools/check-content.mjs checkProjects"
      to: "tools/content-manifest.json projects[].metaLabel / descriptionNote"
      via: "expected dt label and allowlist/reason requirement"
      pattern: "metaLabel"
    - from: "tools/check-shots-pdf.mjs"
      to: "tools/content-manifest.json projects.length"
      via: "expected article/picture count"
      pattern: "projects\\.length"
---

<objective>
Change the 케이엔큐레이션 section (index.html #kn-curation) using facts the user gave in chat on 2026-11-17. These facts are not in the source PDF.
(1) Delete the kn-roadpill (로드필) and kn-linkalba (링크알바) cards.
(2) On the 5 remaining KN cards, rename the meta label '담당 업무' to '소개' and set the exact intro text.
(3) Update every gate that depends on the project list or text so the full check suite and the PDF build exit 0.

Purpose: a recruiter should read a one-line, accurate intro for each KN project. The user-fact exemption must stay explicit and traceable, the same way the 2026-11-11 user-review revision was handled.
Output: an updated index.html, manifest and checkers, and the decision recorded in 01-CONTEXT.md and PROJECT.md.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md

HARD RULES
- Never open private/, .planning/source/, _screenshots/, dist/, or .taste-skill/ (a generated rendered.html copy there still mentions the deleted cards; ignore it).
- Running `npm run check:source` is fine. It reads the local source text internally. Opening the source text is not.
- Never write a phone number anywhere.
- No --no-verify, no push, no state-changing gh.
- Do NOT stage or modify .planning/config.json, .claude/, or tools/screenshots.json. tools/screenshots.json holds in-progress drafts and has no roadpill/linkalba entries. Stage files by explicit path only, never `git add -A` or `git add .`.
- Do NOT re-record measurements (tools/measurements.json / colophon rows). The colophon is unaffected.
- Known flake: if `npm run check:ui` fails only on keyword-focus, re-run it once.

<interfaces>
index.html #kn-curation (lines ~238-333). The article for kn-puring looks like this today. The other cards follow the same shape.
  article.project#kn-puring[data-platform=app][data-status=unknown][aria-labelledby=kn-puring-title]
    h3#kn-puring-title "puring"
    dl.meta > div>(dt 플랫폼, dd App) ; div>(dt 담당 업무, dd 앱 제작 · APK 보유) ; div>(dt 퍼블 기여도, dd <data value="100">100%</data>)
    div.point[data-slot=point][hidden] ; figure.shot[data-slot=screenshot][data-frame=app][aria-hidden=true]
    div.status-links > p.status "운영 여부 확인 어려움"
kn-roadpill = lines 253-265 (with the blank line after it). kn-linkalba = lines 280-291 (with the blank line after it).
kn-wecankids / kn-fsd / kn-greenda currently have only 플랫폼 + 퍼블 기여도 rows.
kn-universe line 323: dt 담당 업무, dd "LG AI연구원 의뢰 · 생성형 AI ‘EXAONE’ 초기모델 개발 / 미국 학회 발표용 초기모델 · 현재 관련 기사만 확인 가능 · 디자인·기능은 ChatGPT와 거의 유사"
Template comment at index.html lines 3 and 6: "프로젝트 article 템플릿 (프로젝트 13개 공통, ...)" and "메타 목록의 dt 순서: 플랫폼, 담당 업무(원본 설명이 있을 때만), 퍼블 기여도. ..."

tools/check-content.mjs checkProjects (lines 368-440):
  line 371: articles count must equal manifest.projects.length (derived already)
  line 402: const want = ['플랫폼'].concat(pm.description ? ['담당 업무'] : [], ['퍼블 기여도']);
  line 406: description dd must normalize-equal pm.description
  lines 407-411: existing user-fact pattern. If pm.nameNote, then manifest.uiAllowlist must include pm.name and uiAllowlistReasons[pm.name] === 'user-provided 2026-11-11'.
source-reverse (720-742): every visible text node must be inside a 1-3 line source window or be in uiAllowlist (normalized, whole-string).
source-coverage (763-800): each sourceCoverage entry {text,status:'site'|'excluded',reason?} must be in the source. 'site' entries must appear in the site text. 'excluded' entries need a reason. Entries are also used as fragments that are stripped from each source line, and any leftover letters count as "unmapped".
forbidden (659-664): manifest.forbiddenText must not appear in any visible text.
allowlist-reasons (210-219): every uiAllowlistReasons key must be in uiAllowlist.

tools/content-manifest.json:
  uiAllowlist (45-67) already contains "담당 업무". It must stay, because other companies still use it.
  uiAllowlistReasons (68-75) use the value format "user-provided 2026-11-11".
  projects[] (222-395) has 13 entries. kn-roadpill is at 272-283 and kn-linkalba at 299-310.
  sourceCoverage entries to touch (around lines 584-614): "앱 제작 · APK 보유" (site), "로드필" (site), "링크알바" (site), and "LG AI연구원 의뢰 · 생성형 AI ‘EXAONE’ 초기모델 개발 미국 학회 발표용 초기모델 · 현재 관련 기사만 확인 가능 · 디자인·기능은 ChatGPT와 거의 유사" (site).
  excludedPatterns keeps the linkalba URL pattern (the source still contains that URL). forbiddenHrefs keeps "linkalba.com".

tools/check-shots-pdf.mjs line 78: `if (!(opt.status === 0 && ids.length === 13 && filled === 13))`. The header comment on line 2 says "13 synthetic images". ROOT is defined on line 15, and readFileSync and join are already imported.
tools/check-layout.mjs line 45 derives the KN card count from the manifest (no change needed). tools/build-pdf.mjs DEFAULT_MAX_PAGES = 8, an upper bound, so fewer cards is fine. Line 25 is a historical measurement comment; leave it.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Apply the KN content change to index.html, the manifest and the projects checker, and record the user facts</name>
  <files>index.html, tools/content-manifest.json, tools/check-content.mjs, .planning/phases/01-foundation-content/01-CONTEXT.md, .planning/PROJECT.md</files>
  <action>
A. index.html (#kn-curation only; every other section stays byte-identical):
  1. Delete the whole kn-roadpill article and the whole kn-linkalba article, each with its trailing blank line.
  2. kn-puring: change the row to `<div><dt>소개</dt><dd>복용약 알림 어플</dd></div>`.
  3. kn-wecankids, kn-fsd, kn-greenda: insert a new row right after the 플랫폼 row, at the same indentation. The dd texts are exactly `교육 상담 예약`, `화장품 브랜드 소개` and `재활용 친환경 사업 소개`.
  4. kn-universe: change the row to dt `소개` and dd `LG AI연구원 의뢰 · 생성형 AI ‘EXAONE’ 초기모델 개발 / 미국 학회 발표용 초기모델 · 현재 관련 기사만 확인 가능`. Keep the curly quotes ‘ ’. The trailing ` · 디자인·기능은 ChatGPT와 거의 유사` is dropped.
  5. Keep every other row and element unchanged: 퍼블 기여도, data-status, status-links, links, point, figure.
  6. Template comment: line 3 changes "프로젝트 13개 공통" to "프로젝트 11개 공통". In line 6, change the dt-order sentence to: 플랫폼, 담당 업무(원본 설명이 있을 때만) 또는 소개(케이엔큐레이션, 2026-11-17 사용자 제공), 퍼블 기여도. The rest of that line stays.

B. tools/content-manifest.json (keep the 2-space JSON formatting and key order):
  1. Remove the kn-roadpill and kn-linkalba objects from projects[]. 11 projects remain.
  2. Add `"metaLabel": "소개"` to all 5 KN projects, placed after "platform".
  3. kn-puring, kn-wecankids, kn-fsd and kn-greenda: set "description" to the exact new text and add `"descriptionNote": "user-provided 2026-11-17"`.
  4. kn-universe: set "description" to the trimmed text from A4. Add no descriptionNote, because the text is still a prefix of the source sentence and source-reverse verifies it directly.
  5. uiAllowlist: append "소개", "복용약 알림 어플", "교육 상담 예약", "화장품 브랜드 소개" and "재활용 친환경 사업 소개".
  6. uiAllowlistReasons: give each of the four intro texts the value "user-provided 2026-11-17". Give "소개" the value "UI structural label: 케이엔큐레이션 project intro row, user-provided 2026-11-17".
  7. forbiddenText: append "로드필", "링크알바" and "ChatGPT" so the deleted content cannot come back.
  8. sourceCoverage, so that source-coverage keeps 0 unmapped lines:
     - Change "앱 제작 · APK 보유" to status "excluded" with reason "2026-11-17 사용자 개정: puring 소개 문구로 대체".
     - Change "로드필" and "링크알바" to status "excluded" with reason "2026-11-17 사용자 개정: 프로젝트 카드 삭제".
     - Replace the single long universe entry with two entries. The first is a "site" entry with text "LG AI연구원 의뢰 · 생성형 AI ‘EXAONE’ 초기모델 개발 미국 학회 발표용 초기모델 · 현재 관련 기사만 확인 가능". The second is an "excluded" entry with text "디자인·기능은 ChatGPT와 거의 유사" and reason "2026-11-17 사용자 개정: universe 소개 문구에서 삭제".
     - Leave every other entry alone. The "현재 운영 종료" site entries stay covered by bs-addy and ab-peach.

C. tools/check-content.mjs checkProjects. Extend the existing nameNote pattern; do not loosen it:
  1. On line 402, the middle label is `pm.metaLabel || '담당 업무'`. It is still emitted only when pm.description is set.
  2. If pm.metaLabel is set and manifest.uiAllowlist does not include it, fail with "metaLabel needs uiAllowlist entry".
  3. Right after the nameNote block, add a descriptionNote block. If pm.descriptionNote is set, require that pm.descriptionNote === 'user-provided 2026-11-17', that manifest.uiAllowlist includes pm.description, and that uiAllowlistReasons[pm.description] === pm.descriptionNote. Otherwise fail with "user-provided description needs uiAllowlist entry with matching reason".
  4. Do not change any other check.

D. Record the user facts:
  1. In .planning/phases/01-foundation-content/01-CONTEXT.md, add a new bullet right after item 5 of the "사용자 검토 개정 (2026-11-11, 사용자 제공 사실)" list (after line 69) and before "### 퍼블리싱 포인트". Title it "**사용자 검토 개정 (2026-11-17, 사용자 제공 사실):**" and give it numbered items:
     (1) kn-roadpill and kn-linkalba cards are deleted, so the project count goes 13 → 11.
     (2) The KN meta label '담당 업무' becomes '소개', and the 5 intro texts listed verbatim.
     (3) The universe text drops '디자인·기능은 ChatGPT와 거의 유사'.
     (4) The 4 new intro texts are user-provided and not in the source PDF. They are allowlisted with reason "user-provided 2026-11-17", and this supersedes the line-55 "설명을 만들지 않는다" for those three projects plus puring.
     Also mark the line-43/44/46/49 table rows and the line-55 bullet with a short "[2026-11-17 사용자 개정으로 대체됨]" prefix or suffix. Do not delete history.
  2. In .planning/PROJECT.md line 45, update the 케이엔큐레이션 bullet so it lists puring (복용약 알림 어플), 위캔키즈클럽, FSD 코스메틱, 그린다 and universe, and drops 로드필, 링크알바 and the APK wording. Keep the date range and "기여도 50~100%" (wecankids is still 50%). Change the Key Decisions row on line 74 only by appending "(링크알바·로드필은 2026-11-17 삭제)".
  </action>
  <verify>
    <automated>cd "C:/Users/user/포트폴리오2026" && npm run check:content && npm run check:source && node -e "const m=require('./tools/content-manifest.json');const k=m.projects.filter(p=>p.company==='kn-curation');process.exit(m.projects.length===11&&k.map(p=>p.id).join()==='kn-puring,kn-wecankids,kn-fsd,kn-greenda,kn-universe'&&k.every(p=>p.metaLabel==='소개')?0:1)" && test "$(grep -c 'kn-roadpill\|kn-linkalba\|ChatGPT' index.html)" = "0" && test "$(grep -c '<dt>소개</dt>' index.html)" = "5"</automated>
  </verify>
  <done>index.html has 11 articles, and #kn-curation has 5 cards whose meta rows read 플랫폼/소개/퍼블 기여도 with the exact texts. check:content and check:source both pass, and source-coverage reports unmapped 0. The 2026-11-17 revision is recorded in 01-CONTEXT.md and PROJECT.md.</done>
</task>

<task type="auto">
  <name>Task 2: Derive the shots-pdf project count and run the full gate suite plus the PDF build</name>
  <files>tools/check-shots-pdf.mjs</files>
  <action>
  1. In tools/check-shots-pdf.mjs, read the expected count from the manifest: `const EXPECTED = JSON.parse(readFileSync(join(ROOT, 'tools', 'content-manifest.json'), 'utf8')).projects.length;`, placed next to the other constants after ROOT. Line 78 becomes `ids.length === EXPECTED && filled === EXPECTED`. In the header comment on line 2, change "with 13 synthetic images" to "with one synthetic image per project article". Make no other changes.
  2. Grep for leftover references outside the excluded folders: `grep -rn "roadpill\|linkalba\|로드필\|링크알바" index.html css js tools README.md 404.html`. The only allowed hits are content-manifest.json's forbiddenText, the sourceCoverage excluded entries, forbiddenHrefs "linkalba.com" and the excludedPatterns linkalba URL. Remove anything else you find in css/js/README. None is expected.
  3. Run in order: `npm run check`, `npm run check:ui` (re-run once if only keyword-focus fails), `npm run check:layout`, `npm run check:source`, `npm run check:shots-pdf`, `npm run check:pdfguard`, `npm run pdf`. Fix any failure caused by this change at its root (for example, a coverage entry wording or a missing allowlist reason). Never weaken a gate. Write down the PDF page count and byte size from the `npm run pdf` output for the summary. The page count can only stay the same or drop, and it must stay within the 8-page cap.
  4. Commit with explicit paths only: index.html, tools/content-manifest.json, tools/check-content.mjs, tools/check-shots-pdf.mjs, .planning/phases/01-foundation-content/01-CONTEXT.md, .planning/PROJECT.md. Use the message `feat(quick-261117-fxc): KN 프로젝트 소개 문구 반영, 로드필·링크알바 삭제`, ending with the Co-Authored-By line. Confirm that `git status` still shows .planning/config.json, tools/screenshots.json and .claude/ unstaged.
  </action>
  <verify>
    <automated>cd "C:/Users/user/포트폴리오2026" && npm run check && npm run check:ui && npm run check:layout && npm run check:source && npm run check:shots-pdf && npm run check:pdfguard && npm run pdf</automated>
  </verify>
  <done>All seven commands exit 0. check-shots-pdf contains no hard-coded 13. The commit includes exactly the 6 files above, and config.json, screenshots.json and .claude/ remain unstaged.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user chat facts → public site | User-supplied text not in the source PDF is published to a hiring document |
| local source text → tool output | check:source reads the private source text that contains the phone number |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-q261117-01 | Tampering (content integrity) | uiAllowlist exemption | mitigate | Exempt only the exact 4 intro strings plus "소개", each with reason "user-provided 2026-11-17". The checker requires descriptionNote and a matching reason, so no blanket exemption is possible. |
| T-q261117-02 | Information disclosure | source text / phone | mitigate | Never open .planning/source. Run the gates only. Source-coverage already redacts digits. Write no phone numbers. |
| T-q261117-03 | Information disclosure | git staging | mitigate | Stage by explicit path. config.json, screenshots.json and .claude/ stay unstaged. |
| T-q261117-04 | Repudiation | removed facts reappearing | mitigate | forbiddenText gains 로드필, 링크알바 and ChatGPT. |
</threat_model>

<verification>
- #kn-curation renders 5 cards, and every card has a 소개 row.
- The full gate suite and `npm run pdf` exit 0.
- `git show --stat HEAD` lists only the 6 intended files.
</verification>

<success_criteria>
- 로드필 and 링크알바 are gone from the site and the PDF.
- The 5 KN intro texts match the user's wording exactly.
- Other companies are unchanged.
- User-fact provenance is recorded and enforced by check-content.
- All listed npm commands exit 0.
</success_criteria>

<output>
Create `.planning/quick/261117-fxc-kn-curation-project-intros/261117-fxc-SUMMARY.md` when done (include PDF pages/bytes from `npm run pdf`).
</output>
