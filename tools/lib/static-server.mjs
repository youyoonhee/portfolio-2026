// Minimal static server for local checks. Binds 127.0.0.1 only, serves an extension allowlist,
// refuses dot-segments (.planning, .git, ...), node_modules, private, _screenshots and traversal.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';

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
const DENIED_SEGMENTS = new Set(['node_modules', 'private', '_screenshots']);

export function startStaticServer(root) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    const deny = () => { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); };
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (pathname.includes('\0')) return deny();
      if (pathname.endsWith('/')) pathname += 'index.html';
      const segments = pathname.split(/[\/]+/).filter(Boolean);
      if (segments.some((s) => s.startsWith('.') || DENIED_SEGMENTS.has(s.toLowerCase()))) return deny();
      const type = MIME[extname(pathname).toLowerCase()];
      if (!type) return deny();
      const file = resolve(join(base, ...segments));
      if (file !== base && !file.startsWith(base + sep)) return deny();
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      deny();
    }
  });
  return new Promise((ok, bad) => {
    server.once('error', bad);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      ok({
        url: `http://127.0.0.1:${port}/`,
        close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }),
      });
    });
  });
}
