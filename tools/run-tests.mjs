// Запуск тестов: esbuild собирает TypeScript-тесты, node их выполняет.
// Отдельный тест-раннер (vitest, jest) ради четырёх наборов ставить незачем —
// esbuild уже есть в зависимостях Vite.
//
// Наборы идут ДО КОНЦА, даже если один упал. Раньше в package.json они были
// сцеплены через && : падение второго набора молча прятало третий и четвёртый,
// а первая строка вывода при этом бодро сообщала «все тесты пройдены».
// Именно так провалившийся тест прожил в репозитории два дня.
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const out = mkdtempSync(join(tmpdir(), 'tilashar-tests-'));
const suites = [
  'tools/tests/answer.test.ts',
  'tools/tests/srs.test.ts',
  'tools/tests/morphology.test.ts',
  'tools/tests/helpers.test.ts',
];
const esbuild = process.platform === 'win32'
  ? 'node_modules/.bin/esbuild.cmd'
  : 'node_modules/.bin/esbuild';

const упавшие = [];
for (const suite of suites) {
  const bundle = join(out, suite.replace(/[/]/g, '_') + '.mjs');
  execFileSync(esbuild, [suite, '--bundle', '--platform=node', '--format=esm',
    `--outfile=${bundle}`, '--log-level=warning'], { stdio: 'inherit' });
  console.log(`\n— ${suite.split('/').pop()}`);
  try {
    execFileSync(process.execPath, [bundle], { stdio: 'inherit' });
  } catch {
    упавшие.push(suite);
  }
}

console.log(упавшие.length
  ? `\n✗ наборов с ошибками: ${упавшие.length} из ${suites.length} — ${упавшие.join(', ')}`
  : `\n✓ все ${suites.length} набора пройдены`);
process.exit(упавшие.length ? 1 : 0);
