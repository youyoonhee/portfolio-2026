// Shared Chrome launcher for local tools. Chrome only (Edge hangs or fails to start on the dev machine).
// Teardown kills only the one pid this process launched, never by image name or command line.
import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

export async function launchChrome(extra = {}) {
  const opts = process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' };
  try {
    return await puppeteer.launch({ headless: true, ...opts, ...extra });
  } catch (err) {
    if (/could not find|no usable|enoent/i.test(String(err && err.message))) {
      throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH.');
    }
    throw err;
  }
}

export async function closeBrowser(browser) {
  if (!browser) return;
  const pid = browser.process()?.pid;
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
  }
}
