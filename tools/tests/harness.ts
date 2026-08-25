/** Минимальный тест-раннер без внешних зависимостей: собирается esbuild-ом, бежит в node. */
let passed = 0;
const failures: string[] = [];

export function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}\n    ${(e as Error).message}`);
  }
}

export function eq<T>(actual: T, expected: T, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`);
  }
}

export function ok(cond: boolean, msg = '') {
  if (!cond) throw new Error(msg || 'ожидалось true');
}

export function report() {
  if (failures.length) {
    console.error(`\n✗ провалено ${failures.length}, пройдено ${passed}\n`);
    failures.forEach(f => console.error('  ✗ ' + f));
    process.exit(1);
  }
  console.log(`✓ все тесты пройдены: ${passed}`);
}
