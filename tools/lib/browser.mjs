// Shared Chrome launcher for local tools. Chrome only (Edge hangs or fails to start on the dev machine).
// Teardown kills only the one pid this process launched, never by image name or command line.
// The profile directory is created here (OS temp dir) and removed here, also after a forced kill.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const profiles = new WeakMap();

export async function launchChrome(extra = {}) {
  const opts = process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' };
  const userDataDir = mkdtempSync(join(tmpdir(), 'pw-chrome-'));
  const removeProfile = () => rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  try {
    const browser = await puppeteer.launch({ headless: true, ...opts, ...extra, userDataDir });
    profiles.set(browser, userDataDir);
    return browser;
  } catch (err) {
    try { removeProfile(); } catch { /* best effort */ }
    if (/could not find|no usable|enoent/i.test(String(err && err.message))) {
      throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH.');
    }
    throw err;
  }
}

export async function closeBrowser(browser) {
  if (!browser) return;
  const pid = browser.process()?.pid;
  const userDataDir = profiles.get(browser);
  let timer;
  try {
    const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('close timeout')), 5000); });
    await Promise.race([browser.close(), timeout]);
  } catch {
    if (pid) {
      try {
        if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
        else process.kill(pid, 'SIGKILL');
      } catch { /* already gone */ }
    }
  } finally {
    clearTimeout(timer);
    if (userDataDir) {
      try { rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* best effort */ }
    }
  }
}
