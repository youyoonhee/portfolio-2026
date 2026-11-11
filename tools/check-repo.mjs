// Repository privacy guard: phone-like patterns, forbidden paths, file naming.
// Flags: (none)=tracked + untracked(non-ignored) tree, --staged=index content,
//        --history=every reachable blob, path, commit message and author in history,
//        --self-test=matcher assertions (positives are assembled at runtime).
// Failure output never prints the matched string (logs must not become a leak path).
// The scan fails closed: unreadable files and unknown binary files are errors.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// ---------- phone matcher ----------
const ZERO_WIDTH = /[­͏؜ᅟᅠ឴឵᠋-᠎​-‏‪-‮⁠-⁯ㅤ︀-️﻿ﾠ]/g;
const NAMED = {
  nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ', ndash: '-', mdash: '-', minus: '-', hyphen: '-',
  dash: '-', horbar: '-', sol: '/', period: '.', lpar: '(', rpar: ')', lsqb: '[', rsqb: ']',
  colon: ':', tilde: '~', lowbar: '_', comma: ',', plus: '+', amp: '&', lt: '<', gt: '>',
  quot: '"', apos: "'", num: '#', semi: ';', excl: '!', quest: '?', ast: '*', commat: '@',
};
const decodeEntities = (s) =>
  s.replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z][a-z0-9]{1,15}));?/gi, (m, d, h, n) => {
    try {
      if (d) return String.fromCodePoint(Number(d));
      if (h) return String.fromCodePoint(parseInt(h, 16));
    } catch { return ' '; }
    // unknown named entities become a separator: they can never form digits
    return NAMED[n.toLowerCase()] ?? ' ';
  });

const HANGUL_DIGIT = { 공: '0', 영: '0', 일: '1', 이: '2', 삼: '3', 사: '4', 오: '5', 육: '6', 칠: '7', 팔: '8', 구: '9' };
// Strict context only: a Korean mobile prefix spelled in Hangul (e.g. 공일공) followed by
// 7-8 more Hangul digits, each separated by at most 4 non-alphanumerics. Ordinary text
// does not contain ten consecutive single-digit words that start with such a prefix.
const SEP = String.raw`[^\p{L}\p{N}]{0,4}`;
const HANGUL_PHONE = new RegExp(
  String.raw`(?<![가-힣])[공영]일[공영일육칠팔구](?:${SEP}[공영일이삼사오육칠팔구]){7,8}`, 'gu'
);

// Korean mobile: optional +82/82 (leading 0 optional) or leading 0, prefix 01[016789], then 7-8 digits
// with any run (0-4) of non-alphanumeric separators between digits.
const PHONE_CORE = new RegExp(
  String.raw`(?<!\d)(?:\(?\+?\(?82\)?${SEP}(?:\(?0\)?${SEP})?|0)1[016789](?:${SEP}\d){7,8}(?!\d)`, 'u'
);

export function normalizeForPhone(input) {
  let s = String(input);
  for (let i = 0; i < 2; i++) s = decodeEntities(s); // second pass catches &amp;#48;
  s = s.normalize('NFKC').replace(ZERO_WIDTH, '');
  return s.replace(HANGUL_PHONE, (m) => m.replace(/[공영일이삼사오육칠팔구]/g, (c) => HANGUL_DIGIT[c]));
}
export const hasPhone = (text) => PHONE_CORE.test(normalizeForPhone(text));

const TAG = /<\/?[a-zA-Z!][^<>]*>/g;
// Variants for whole-document checks: lines joined (phone split across lines) and
// tags removed without a separator (phone split across inline elements).
export const hasPhoneAnywhere = (text) =>
  hasPhone(text.replace(/\s+/g, ' ')) || hasPhone(text.replace(TAG, '')) || hasPhone(text.replace(TAG, ' '));

// ---------- paths ----------
const FORBIDDEN =
  /(^|\/)(_screenshots|private|\.private|out|dist|\.taste-skill)\/|^\.planning\/source\/|\.pdf$|(^|\/)\.print-tmp\.html$/i;
const SKIP = /(^|\/)package-lock\.json$/;
const NAME_OK = /^[a-z0-9._-]+(\/[a-z0-9._-]+)*$/;
const NAME_EXCEPT = /^(CLAUDE\.md|README\.md|LICENSE)$|^\.planning\//;

// Binary formats that may be skipped: extension must be allowlisted AND magic bytes must match.
const BINARY_MAGIC = {
  png: [[0, [0x89, 0x50, 0x4e, 0x47]]],
  jpg: [[0, [0xff, 0xd8, 0xff]]],
  jpeg: [[0, [0xff, 0xd8, 0xff]]],
  gif: [[0, [0x47, 0x49, 0x46, 0x38]]],
  webp: [[0, [0x52, 0x49, 0x46, 0x46]], [8, [0x57, 0x45, 0x42, 0x50]]],
  avif: [[4, [0x66, 0x74, 0x79, 0x70]]],
  ico: [[0, [0x00, 0x00, 0x01, 0x00]]],
  woff: [[0, [0x77, 0x4f, 0x46, 0x46]]],
  woff2: [[0, [0x77, 0x4f, 0x46, 0x32]]],
  ttf: [[0, [0x00, 0x01, 0x00, 0x00]]],
  otf: [[0, [0x4f, 0x54, 0x54, 0x4f]]],
};
const isKnownBinary = (path, buf) => {
  const ext = path.split('.').pop().toLowerCase();
  const sig = BINARY_MAGIC[ext];
  return !!sig && sig.every(([off, bytes]) => bytes.every((b, i) => buf[off + i] === b));
};

// ---------- decoding ----------
function decodeText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le');
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) return Buffer.from(buf.subarray(2)).swap16().toString('utf16le');
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8');
  if (!buf.includes(0)) return buf.toString('utf8');
  // No BOM but NUL bytes: UTF-16 without BOM has NULs concentrated at odd (LE) or even (BE) offsets.
  let odd = 0; let even = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 0) { if (i & 1) odd++; else even++; }
  const half = Math.floor(buf.length / 2);
  if (odd >= half * 0.2 && odd > even * 3) return buf.toString('utf16le');
  if (even >= half * 0.2 && even > odd * 3) return Buffer.from(buf).swap16().toString('utf16le');
  return null; // unknown binary
}

// Returns number of problems found; label is printed instead of any matched text.
function scanBuffer(label, path, buf) {
  if (isKnownBinary(path, buf)) return 0;
  const text = decodeText(buf);
  if (text === null) {
    console.error(`${label}: unrecognised binary file (extension not on the allowlist or signature mismatch)`);
    return 1;
  }
  let bad = 0;
  const lines = text.split(/\r?\n|\r/);
  lines.forEach((line, i) => {
    if (hasPhone(line)) { console.error(`${label}:${i + 1}: phone-like pattern`); bad++; }
  });
  if (!bad && hasPhoneAnywhere(text)) {
    console.error(`${label}: phone-like pattern (split across lines or tags)`);
    bad++;
  }
  return bad;
}

const gitBuf = (args) => execFileSync('git', args, { maxBuffer: 1 << 30 });
const git = (args) => gitBuf(args).toString('utf8');

// ---------- self test ----------
function selfTest() {
  const d = (...n) => n.join('');
  const fw = (s) => [...s].map((c) => (/\d/.test(c) ? String.fromCodePoint(0xff10 + Number(c)) : c)).join('');
  const a = d('0', '1', '0');
  const b = d('12', '34');
  const c = d('56', '78');
  const ZW = String.fromCodePoint(0x200b);
  const positives = [];
  for (const sep of ['-', '.', ' ', '', '–', '—', ' - ', '  ', '/', '~', '_', ':', ' / ']) {
    positives.push([a, b, c].join(sep));
    positives.push([d('0', '1', '1'), d('123'), d('4567')].join(sep));
  }
  positives.push(`(${a}) ${b}-${c}`);
  positives.push(`(${a})${b}-${c}`);
  positives.push(`${a} - ${b} - ${c}`);
  positives.push(fw(`${a}-${b}-${c}`));
  positives.push(fw(a + b + c));
  positives.push(`${a[0]}${ZW}${a.slice(1)}-${b}-${c}`);
  positives.push(`${a}-${b}${ZW}-${c}`);
  positives.push(`&#${48};${a.slice(1)}-${b}-${c}`);
  positives.push(`&#x${(48).toString(16)};${a.slice(1)}-${b}-${c}`);
  positives.push(`${a}&#45;${b}&#${45};${c}`);
  positives.push(`${a}&ndash;${b}&nbsp;${c}`);
  positives.push(`&amp;#${48};${a.slice(1)}-${b}-${c}`);
  positives.push(['+' + '82', ' ', '10', '-', b, '-', c].join(''));
  positives.push(['+' + '82', '10', b, c].join(''));
  positives.push(['(' + '+' + '82' + ')', ' ', '10', '-', b, '-', c].join(''));
  positives.push(['+' + '82', ' ', '(0)', '10', '-', b, '-', c].join(''));
  positives.push(['82', '-', '10', '-', b, '-', c].join(''));
  positives.push(`연락처 ${a}-${b}-${c} 입니다`);
  const H = ['공', '일', '공', '일', '이', '삼', '사', '오', '육', '칠', '팔'];
  positives.push(H.slice(0, 3).join('') + '-' + H.slice(3, 7).join('') + '-' + H.slice(7).join('') + '입니다');
  positives.push(['영', '일', '영', ' ', '일이삼사', ' ', '오육칠팔'].join(''));
  positives.push(['공', '일', '공', '일이삼사오육칠'].join('')); // 10 digits
  const negatives = [
    '2024.09', '2021. 08 ~ 2021. 12', '2022.01 ~ 2023.07', '2021.08~2021.12',
    '50:50', 'eventTypeCd=90', '26532', '20240901', '2024.09 ~ 2026.09',
    '2023.01 ~ 2024.10', '2020. 10 ~ 2021. 01', '2019.03 ~ 2019.12', '2021.10.01 ~ 2022.01.10',
    'v1.0.10 2024', '01 ~ 12', '공일 이삼 사오', '일이삼사오육칠팔구', '영일 이후 일이 많아',
    '이사 일정 공유', '10%  20%  30%  40%', '#010 1', '1920 1080 1440 960',
  ];
  let fail = 0;
  for (const p of positives) if (!hasPhone(p)) { console.error('self-test: positive not matched'); fail++; }
  for (const n of negatives) if (hasPhone(n)) { console.error(`self-test: negative matched: ${n}`); fail++; }
  // whole-document variants
  const split = [`<span>${a}</span>-${b}-${c}`, `${a}\n${b}\n${c}`, `<b>${a}</b><i>-</i><b>${b}-${c}</b>`];
  for (const p of split) if (!hasPhoneAnywhere(p)) { console.error('self-test: split positive not matched'); fail++; }
  // path names
  if (!hasPhone(`images/${a}-${b}-${c}.png`)) { console.error('self-test: path positive not matched'); fail++; }
  // fail-closed decoding
  const utf16 = Buffer.from(`﻿${a}-${b}-${c}`, 'utf16le');
  const utf16nobom = Buffer.from(`note ${a}-${b}-${c}`, 'utf16le');
  const utf16be = Buffer.from(`note ${a}-${b}-${c}`, 'utf16le').swap16();
  for (const [n, buf] of [['utf16le-bom', utf16], ['utf16le', utf16nobom], ['utf16be', utf16be]]) {
    const t = decodeText(buf);
    if (t === null || !hasPhone(t)) { console.error(`self-test: ${n} not decoded`); fail++; }
  }
  if (decodeText(Buffer.from([0x41, 0, 0, 0, 0x42, 0, 0, 0x43, 0xff, 0, 0, 0])) !== null) {
    console.error('self-test: unknown binary should not decode'); fail++;
  }
  if (!isKnownBinary('x.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0])) || isKnownBinary('x.txt', Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    console.error('self-test: binary allowlist'); fail++;
  }
  if (!FORBIDDEN.test('a/out/x.txt') || !FORBIDDEN.test('.private/x') || !FORBIDDEN.test('.taste-skill/x') || FORBIDDEN.test('about/index.html')) {
    console.error('self-test: forbidden paths'); fail++;
  }
  if (fail) process.exit(1);
  console.log(`self-test: ${positives.length + negatives.length + split.length + 8} passed`);
}

// ---------- history ----------
function scanHistory() {
  let bad = 0;
  // 1) commit metadata: author/committer name+email and the full message (all refs, merges included)
  let ownEmail = '';
  try { ownEmail = git(['config', 'user.email']).trim().toLowerCase(); } catch { /* none configured */ }
  const meta = git(['log', '--all', '-m', '--format=%H%x1f%an%x1f%ae%x1f%cn%x1f%ce%x1f%B%x1e']);
  for (const rec of meta.split('\x1e')) {
    if (!rec.trim()) continue;
    const [hash, an, ae, cn, ce, body] = rec.replace(/^\s+/, '').split('\x1f');
    const fields = { author: an, committer: cn, message: body };
    if (ae?.toLowerCase() !== ownEmail) fields['author-email'] = ae;
    if (ce?.toLowerCase() !== ownEmail) fields['committer-email'] = ce;
    for (const [k, v] of Object.entries(fields)) {
      if (v && hasPhoneAnywhere(v)) { console.error(`history ${hash.slice(0, 7)}: phone-like pattern in ${k}`); bad++; }
    }
  }
  // 2) refs and tag annotations
  const refs = git(['for-each-ref', '--format=%(refname)%1f%(contents)%1f%(taggername)%1f%(taggeremail)%1e']);
  for (const rec of refs.split('\x1e')) {
    if (rec.trim() && hasPhoneAnywhere(rec.replace(/\x1f/g, '\n'))) {
      console.error(`history ref ${rec.trim().split('\x1f')[0].slice(0, 80)}: phone-like pattern`); bad++;
    }
  }
  // 3) every reachable object path and blob (covers merges, '++' lines, UTF-16 and renamed files)
  const seen = new Set();
  for (const line of git(['rev-list', '--objects', '--all']).split('\n')) {
    if (!line) continue;
    const sp = line.indexOf(' ');
    const sha = sp < 0 ? line : line.slice(0, sp);
    const path = sp < 0 ? '' : line.slice(sp + 1);
    if (path && hasPhone(path)) { console.error(`history ${sha.slice(0, 7)}: phone-like pattern in path`); bad++; }
    if (!path || seen.has(sha) || SKIP.test(path)) continue;
    let type;
    try { type = git(['cat-file', '-t', sha]).trim(); } catch (e) { console.error(`history ${sha.slice(0, 7)}: cannot read object`); bad++; continue; }
    if (type !== 'blob') continue;
    seen.add(sha);
    let buf;
    try { buf = gitBuf(['cat-file', 'blob', sha]); } catch { console.error(`history ${sha.slice(0, 7)}: cannot read blob`); bad++; continue; }
    bad += scanBuffer(`history ${sha.slice(0, 7)} ${path}`, path, buf);
  }
  if (bad) { console.error(`BLOCKED: ${bad} problem(s) in history`); process.exit(1); }
  console.log(`history: clean (${seen.size} blob(s))`);
}

// ---------- tree / staged ----------
function scanTree(staged) {
  const files = (staged
    ? git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'])
    : git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
  ).split('\0').filter(Boolean);

  let bad = 0;
  for (const f of files) {
    if (FORBIDDEN.test(f)) { console.error(`forbidden path: ${f}`); bad++; continue; }
    if (hasPhone(f)) { console.error('file name: phone-like pattern'); bad++; }
    if (!NAME_OK.test(f) && !NAME_EXCEPT.test(f)) {
      console.error(`file name must be lowercase ascii kebab-case: ${f}`); bad++;
    }
    if (SKIP.test(f)) continue;
    let buf;
    try { buf = staged ? gitBuf(['show', `:${f}`]) : readFileSync(f); }
    catch (e) { console.error(`cannot read ${f}: ${e.code || 'error'} (scan fails closed)`); bad++; continue; }
    bad += scanBuffer(f, f, buf);
  }
  if (bad) { console.error(`BLOCKED: ${bad} problem(s)`); process.exit(1); }
  console.log(`check-repo: ${files.length} file(s) clean`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) selfTest();
  else if (process.argv.includes('--history')) scanHistory();
  else scanTree(process.argv.includes('--staged'));
}
