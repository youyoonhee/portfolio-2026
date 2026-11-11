// Reads --color-* hex tokens from css/tokens.css and checks WCAG 2.2 contrast pairs. Exit 1 on failure.
import { readFileSync } from 'node:fs';

const css = readFileSync(process.argv[2] ?? 'css/tokens.css', 'utf8');
const t = Object.fromEntries([...css.matchAll(/--(color-[\w-]+)\s*:\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRS = [ // [fg, bg, min, why]
  ['color-accent', 'color-bg', 4.5], ['color-accent', 'color-surface', 4.5], ['color-accent', 'color-accent-tint', 4.5],
  ['color-bg', 'color-accent', 4.5], ['color-accent-strong', 'color-bg', 4.5],
  ['color-ink', 'color-bg', 4.5], ['color-ink-2', 'color-bg', 4.5], ['color-ink-2', 'color-surface', 4.5],
  ['color-ink-3', 'color-bg', 4.5], ['color-ink-3', 'color-surface', 4.5], ['color-ink-3', 'color-accent-tint', 4.5],
  ['color-accent', 'color-bg', 3, 'focus ring'], ['color-line-strong', 'color-bg', 3, 'non-text'],
];
let bad = 0;
for (const [f, b, min, why = 'text'] of PAIRS) {
  if (!t[f] || !t[b]) { console.log(`MISSING token ${f} or ${b}`); bad++; continue; }
  const r = ratio(t[f], t[b]);
  const ok = r >= min;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${f} ${t[f]} on ${b} ${t[b]}  ${r.toFixed(2)}:1 (min ${min}, ${why})`);
}
process.exit(bad ? 1 : 0);
