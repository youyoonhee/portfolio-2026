// Minimal static server for local checks. Binds 127.0.0.1 only, serves an extension allowlist,
// refuses dot-segments (.planning, .git, ...), denylisted folders and traversal (also via `\`).
// Only GET/HEAD, and only for Host 127.0.0.1:<port> / localhost:<port> (DNS-rebinding guard).
// `node tools/lib/static-server.mjs --self-test` runs a fast browserless regression test.
import { createServer, request as httpRequest } from 'node:http';
import { readFile, realpath, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, sep, extname, join, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};
const DENIED_SEGMENTS = new Set([
  'private', '_screenshots', 'node_modules', 'dist', 'out', '.planning', '.git', '.taste-skill', '.private',
]);

const badSegment = (s) =>
  s.startsWith('.') || /[. ]$/.test(s) || /[\0:<>"|?*]/.test(s) || DENIED_SEGMENTS.has(s.toLowerCase());

// Case-insensitive on Windows, where the filesystem is.
const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
function insideRoot(root, target) {
  const rel = relative(norm(root), norm(target));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

export function startStaticServer(root, { allow = [] } = {}) {
  const base = resolve(root);
  // `allow` lets a caller explicitly re-permit a denylisted segment (used by nothing in the repo today).
  const denied = (s) => badSegment(s) && !allow.includes(s.toLowerCase());
  let hostOk = () => false;
  const server = createServer(async (req, res) => {
    const deny = (code = 404) => { res.writeHead(code, { 'content-type': 'text/plain' }); res.end(code === 404 ? 'Not found' : 'Denied'); };
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return deny(405);
      if (!hostOk(req.headers.host ?? '')) return deny(403);
      let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (pathname.endsWith('/') || pathname.endsWith('\\')) pathname += 'index.html';
      const segments = pathname.split(/[\/\\]+/).filter(Boolean);
      if (segments.some(denied)) return deny();
      const type = MIME[extname(pathname).toLowerCase()];
      if (!type) return deny();
      const file = resolve(join(base, ...segments));
      if (!insideRoot(base, file)) return deny();
      // defense in depth: validate the real path as well (symlinks, 8.3 names, ...)
      const real = await realpath(file);
      const realBase = await realpath(base);
      if (!insideRoot(realBase, real)) return deny();
      if (relative(realBase, real).split(sep).some(denied)) return deny();
      const body = await readFile(real);
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      deny();
    }
  });
  return new Promise((ok, bad) => {
    server.once('error', bad);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      hostOk = (h) => h === `127.0.0.1:${port}` || h === `localhost:${port}`;
      ok({
        url: `http://127.0.0.1:${port}/`,
        close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }),
      });
    });
  });
}

async function selfTest() {
  const tmp = await mkdtemp(join(tmpdir(), 'static-server-selftest-'));
  const srv = await (async () => {
    for (const d of ['css', 'private', '_screenshots', 'node_modules', '.git']) await mkdir(join(tmp, d));
    await writeFile(join(tmp, 'index.html'), '<!doctype html>ok');
    await writeFile(join(tmp, 'css', 'a.css'), 'a{}');
    for (const d of ['private', '_screenshots', 'node_modules', '.git']) await writeFile(join(tmp, d, 'x.html'), 'SECRET');
    return startStaticServer(tmp);
  })();
  const port = new URL(srv.url).port;
  const get = (path, { method = 'GET', host = `127.0.0.1:${port}` } = {}) => new Promise((ok, bad) => {
    const r = httpRequest({ host: '127.0.0.1', port, path, method, headers: { host } }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => ok({ status: res.statusCode, body: b }));
    });
    r.on('error', bad); r.end();
  });
  let failed = 0;
  const expect = async (name, path, status, opts) => {
    const r = await get(path, opts);
    const good = r.status === status && !r.body.includes('SECRET');
    if (!good) failed++;
    console.log(`${good ? 'PASS' : 'FAIL'} static-server ${name}: ${r.status} (want ${status})`);
  };
  try {
    await expect('index', '/', 200);
    await expect('css', '/css/a.css', 200);
    await expect('private direct', '/private/x.html', 404);
    await expect('private upper-case', '/PRIVATE/x.html', 404);
    await expect('backslash bypass %5C', '/css%5C..%5Cprivate%5Cx.html', 404);
    await expect('backslash bypass literal', '/css\\..\\private\\x.html', 404);
    await expect('backslash bypass node_modules', '/css%5C..%5Cnode_modules%5Cx.html', 404);
    await expect('trailing dot', '/private./x.html', 404);
    await expect('trailing space', '/private%20/x.html', 404);
    await expect('dot segment dir', '/.git/x.html', 404);
    await expect('encoded dot segments', '/css/%2e%2e/private/x.html', 404);
    await expect('traversal', '/..%5C..%5Cindex.html', 404);
    await expect('colon / ADS', '/index.html:stream', 404);
    await expect('NUL', '/index.html%00.css', 404);
    await expect('bad host', '/', 403, { host: 'evil.example' });
    await expect('localhost host', '/', 200, { host: `localhost:${port}` });
    await expect('POST refused', '/', 405, { method: 'POST' });
  } finally {
    await srv.close();
    await rm(tmp, { recursive: true, force: true });
  }
  console.log(failed ? `static-server self-test FAILED (${failed})` : 'static-server self-test OK');
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--self-test')) {
  await selfTest();
}
