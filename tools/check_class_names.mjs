/**
 * Поиск столкновений своих классов с утилитами Tailwind.
 *
 * Tailwind просматривает исходники и генерирует утилиту для любого слова,
 * похожего на её имя. Если собственный класс называется так же, утилита
 * подмешивается к нему — и правило появляется из ниоткуда. Так класс .ring
 * получил контур цветом текста: чёрный прямоугольник в светлой теме,
 * белый в тёмной, причём border и outline в вычисленных стилях пустые.
 *
 * Запуск: node tools/check_class_names.mjs (нужна свежая npm run build)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* fileURLToPath, а не .pathname: в пути проекта есть пробел, и без
   декодирования он остаётся как %20 — файл не находится. */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const own = new Set(
  [...readFileSync(join(root, 'src/index.css'), 'utf8')
    .matchAll(/^\.([a-z][\w-]*)/gm)].map(m => m[1])
);

const assets = join(root, 'dist/assets');
const cssFile = readdirSync(assets).find(f => f.startsWith('index-') && f.endsWith('.css'));
if (!cssFile) {
  console.error('Нет собранного CSS. Сначала npm run build.');
  process.exit(1);
}
const built = readFileSync(join(assets, cssFile), 'utf8');

/* Утилиты Tailwind в сборке легко отличить: они объявлены отдельным правилом
   с тем же именем и почти всегда трогают --tw-* переменные или слой utilities. */
const collisions = [];
for (const name of own) {
  const re = new RegExp(`\\.${name.replace(/[-]/g, '\\-')}\\s*\\{([^}]*)\\}`, 'g');
  const bodies = [...built.matchAll(re)].map(m => m[1]);
  if (bodies.length < 2) continue;
  const twLike = bodies.filter(b => b.includes('--tw-'));
  if (twLike.length) collisions.push({ name, правило: twLike[0].trim().slice(0, 90) });
}

if (collisions.length) {
  console.log(`✗ Классы, совпавшие с утилитами Tailwind: ${collisions.length}`);
  for (const c of collisions) console.log(`   .${c.name}  →  ${c.правило}`);
  console.log('\nПереименуйте их: утилита подмешивается к своему классу молча.');
  process.exit(1);
}
console.log(`✓ Столкновений имён с утилитами Tailwind нет (проверено классов: ${own.size})`);
