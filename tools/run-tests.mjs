// Запуск тестов: esbuild собирает TypeScript-тесты в один файл, node его выполняет.
// Отдельный тест-раннер (vitest, jest) ради двух наборов тестов ставить незачем —
// esbuild уже есть в зависимостях Vite.
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = mkdtempSync(join(tmpdir(), 'gq-tests-'));
const suites = ['tools/tests/answer.test.ts', 'tools/tests/srs.test.ts'];
const esbuild = process.platform === 'win32'
  ? 'node_modules/.bin/esbuild.cmd'
  : 'node_modules/.bin/esbuild';

let failed = false;
for (const suite of suites) {
  const bundle = join(out, suite.replace(/[\/]/g, '_') + '.mjs');
  execFileSync(esbuild, [suite, '--bundle', '--platform=node', '--format=esm',
    `--outfile=${bundle}`, '--log-level=warning'], { stdio: 'inherit' });
  try {
    console.log(`\n— ${suite}`);
    execFileSync(process.execPath, [bundle], { stdio: 'inherit' });
  } catch {
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
