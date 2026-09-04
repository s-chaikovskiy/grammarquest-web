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
import { buildSync } from 'esbuild';

const out = mkdtempSync(join(tmpdir(), 'tilashar-tests-'));
const suites = [
  'tools/tests/answer.test.ts',
  'tools/tests/srs.test.ts',
  'tools/tests/morphology.test.ts',
  'tools/tests/helpers.test.ts',
];
// Сборка идёт через JS-API, а не через исполняемый файл в node_modules/.bin.
// На Windows там лежит .cmd, а Node с 18-й версии отказывается запускать
// .cmd и .bat без shell — тесты падали только на Windows, и только там.
const упавшие = [];
for (const suite of suites) {
  const bundle = join(out, suite.replace(/[/]/g, '_') + '.mjs');
  buildSync({
    entryPoints: [suite],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: bundle,
    logLevel: 'warning',
  });
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
