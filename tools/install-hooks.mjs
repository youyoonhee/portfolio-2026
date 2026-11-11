// Installs the repo hooks (core.hooksPath). Never fails `npm install`, but never fails silently either.
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'pipe' });
  console.log('hooks: core.hooksPath set to .githooks');
} catch (e) {
  console.warn('WARNING: git hooks were NOT installed (git missing or not a git checkout).');
  console.warn('         The phone-number pre-commit/pre-push guard is inactive. Run: git config core.hooksPath .githooks');
}
