// Repository privacy guard: phone-like patterns, forbidden paths, file naming.
// Flags: (none)=tracked + untracked(non-ignored) tree, --staged=index content,
//        --history=added lines across all commits, --self-test=regex assertions.
// Failure output never prints the matched string (logs must not become a leak path).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const S = String.raw`[-–—.\s]?`; // hyphen / dot / space / en-em dash, 0 or 1
export const PHONE_RE = new RegExp(
  String.raw`(?<!\d)(?:\(?\+?82\)?${S}(?:\(0\)${S})?|0)1[016789]${S}\d{3,4}${S}\d{4}(?!\d)`
);

const FORBIDDEN = /^(_screenshots|private|dist|\.planning\/source)\/|\.pdf$|^\.print-tmp\.html$/i;
const SKIP = /(^|\/)package-lock\.json$/;
const NAME_OK = /^[a-z0-9._-]+(\/[a-z0-9._-]+)*$/;
const NAME_EXCEPT = /^(CLAUDE\.md|README\.md|LICENSE)$|^\.planning\//;

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });

function selfTest() {
  const lead = '01' + '0';
  const blocks = ['1234', '5678'];
  const positives = [];
  for (const sep of ['-', '.', ' ', '', '–', '—']) {
    positives.push([lead, ...blocks].join(sep));
    positives.push(['01' + '1', '123', '4567'].join(sep));
  }
  positives.push(['+' + '82' + ' ' + '10', ...blocks].join('-'));
  positives.push(['+' + '82' + '10', ...blocks].join(''));
  positives.push(['(' + '+' + '82' + ')' + ' ' + '10', ...blocks].join('-'));
  positives.push('연락처 ' + [lead, ...blocks].join('-') + ' 입니다');
  const negatives = [
    '2024.09', '2021. 08 ~ 2021. 12', '2022.01 ~ 2023.07', '2021.08~2021.12',
    '50:50', 'eventTypeCd=90', '26532', '20240901', '2024.09 ~ 2026.09',
  ];
  let fail = 0;
  for (const p of positives) if (!PHONE_RE.test(p)) { console.error('self-test: positive not matched'); fail++; }
  for (const n of negatives) if (PHONE_RE.test(n)) { console.error(`self-test: negative matched: ${n}`); fail++; }
  if (fail) process.exit(1);
  console.log(`self-test: ${positives.length + negatives.length} passed`);
}

function scanHistory() {
  const out = git(['log', '-p', '--all', '--no-color', '--no-ext-diff']);
  let commit = '';
  let bad = 0;
  for (const line of out.split(/\r?\n/)) {
    if (line.startsWith('commit ')) commit = line.slice(7, 14);
    else if (line.startsWith('+') && !line.startsWith('+++') && PHONE_RE.test(line)) {
      console.error(`history ${commit}: phone-like pattern`);
      bad++;
    }
  }
  if (bad) { console.error(`BLOCKED: ${bad} problem(s) in history`); process.exit(1); }
  console.log('history: clean');
}

function scanTree(staged) {
  const files = (staged
    ? git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'])
    : git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
  ).split('\0').filter(Boolean);

  let bad = 0;
  for (const f of files) {
    if (FORBIDDEN.test(f)) { console.error(`forbidden path: ${f}`); bad++; continue; }
    if (!NAME_OK.test(f) && !NAME_EXCEPT.test(f)) {
      console.error(`file name must be lowercase ascii kebab-case: ${f}`); bad++;
    }
    if (SKIP.test(f)) continue;
    let txt;
    try { txt = staged ? git(['show', `:${f}`]) : readFileSync(f, 'utf8'); } catch { continue; }
    if (txt.includes('\0')) continue; // binary
    txt.split(/\r?\n/).forEach((line, i) => {
      if (PHONE_RE.test(line)) { console.error(`${f}:${i + 1}: phone-like pattern`); bad++; }
    });
  }
  if (bad) { console.error(`BLOCKED: ${bad} problem(s)`); process.exit(1); }
  console.log(`check-repo: ${files.length} file(s) clean`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) selfTest();
  else if (process.argv.includes('--history')) scanHistory();
  else scanTree(process.argv.includes('--staged'));
}
