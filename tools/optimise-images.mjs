// Screenshot conversion tool (Phase 4).
//
// Procedure (D-13), one project at a time:
//   1. Put ONE image in _screenshots/<id>/ (git-ignored). <id> is an article id in index.html.
//   2. node tools/optimise-images.mjs --info             list folders, rotated sizes, formats
//   3. node tools/optimise-images.mjs --annotate <id>    grid image with mask outlines in dist/shots-preview/
//   4. Write masks + alt in tools/screenshots.json with "status": "draft".
//   5. node tools/optimise-images.mjs --only <id>        preview lands in dist/shots-preview/<id>/ only.
//   6. Review the preview, set "status": "approved", run again: img/projects/<id>/ and index.html are written.
//   --clear <id> restores the empty frame and removes that project's published files.
//   --self-test runs the whole pipeline on synthetic images in the OS temp folder.
//
// Path overrides (used by the self-test): --src --out --html --manifest --preview.

const USAGE =
  'usage: node tools/optimise-images.mjs [--self-test] [--info] [--annotate <id>] [--only <id>] [--clear <id>] ' +
  '[--src <dir>] [--out <dir>] [--html <file>] [--manifest <file>] [--preview <dir>]';

const VALUE_FLAGS = new Set(['--only', '--clear', '--annotate', '--src', '--out', '--html', '--manifest', '--preview']);
const BOOL_FLAGS = new Set(['--self-test', '--info']);

export function parseArgs(argv) {
  const opts = {
    src: '_screenshots',
    out: 'img/projects',
    html: 'index.html',
    manifest: 'tools/screenshots.json',
    preview: 'dist/shots-preview',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (BOOL_FLAGS.has(a)) {
      opts[a.slice(2)] = true;
    } else if (VALUE_FLAGS.has(a)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value` };
      opts[a.slice(2)] = v;
      i++;
    } else {
      return { error: `unknown flag ${a}` };
    }
  }
  return { opts };
}

async function render() { throw new Error('not implemented'); }
async function runAll() { throw new Error('not implemented'); }
async function clear() { throw new Error('not implemented'); }
async function info() { throw new Error('not implemented'); }
async function annotate() { throw new Error('not implemented'); }
async function selfTest() {
  console.log('FAIL self-test not written');
  return 1;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.error) {
    console.error(`optimise-images: ${parsed.error}\n${USAGE}`);
    return 2;
  }
  const o = parsed.opts;
  try {
    if (o['self-test']) return await selfTest();
    if (o.info) return await info(o);
    if (o.annotate) return await annotate(o, o.annotate);
    if (o.clear) return await clear(o, o.clear);
    return await runAll(o, o.only);
  } catch (err) {
    console.error(`optimise-images: ${err.message}`);
    return 1;
  }
}

void render;
process.exitCode = await main();
