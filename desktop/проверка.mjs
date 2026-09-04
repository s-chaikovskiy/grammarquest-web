// Проверка оболочки для Windows через Chrome DevTools Protocol.
//
// Отвечает на вопрос, который задают про .exe первым: работает ли приложение
// без интернета. Ответ доказывается не словами, а списком запросов — если
// приложению нужна сеть, в протоколе будет запрос со схемой http или https.
// Здесь мы обходим все экраны и требуем, чтобы таких запросов не было ни
// одного, а звук открывался с диска и имел длительность.
//
// Оболочка поднимается снаружи:
//     cd desktop && npx electron . --remote-debugging-port=9333
//     node desktop/проверка.mjs [папка-для-скриншотов]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const КОРЕНЬ = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const OUT = process.argv[2] ?? null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const page = targets.find((t) => t.type === 'page');
if (!page) {
  console.error('Оболочка не запущена: нет страницы на порту 9333.');
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const waiting = new Map();
const запросы = [];
const ошибкиКонсоли = [];
const провалы = [];

ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m.result ?? m.error);
    waiting.delete(m.id);
    return;
  }
  if (m.method === 'Network.requestWillBeSent') запросы.push(m.params.request.url);
  if (m.method === 'Network.loadingFailed') провалы.push(m.params.errorText);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    ошибкиКонсоли.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    ошибкиКонсоли.push(m.params.exceptionDetails.text ?? 'исключение');
  }
});

const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    waiting.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const оценить = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  return r?.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');

const текст = () => оценить(`document.body.innerText.trim()`);

/**
 * Ждём не паузой, а сменой содержимого: фиксированная пауза уже один раз
 * соврала — попала в момент подмены экрана и показала предыдущий.
 */
async function перейти(маршрут, было) {
  await оценить(`location.hash = ${JSON.stringify(маршрут)}`);
  for (let i = 0; i < 60; i += 1) {
    const стало = await оценить(`(() => {
      const root = document.getElementById('root');
      if (document.readyState !== 'complete' || !root || !root.children.length) return '';
      return document.body.innerText.trim();
    })()`);
    if (стало && стало !== было && стало.length > 40) return стало;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

const первыйУрок = JSON.parse(
  fs.readFileSync(path.join(КОРЕНЬ, 'src/data/lessons.json'), 'utf8'),
).lessons[0].id;

const ЭКРАНЫ = [
  ['#/learn', 'уроки'],
  [`#/lesson/${первыйУрок}`, 'урок'],
  ['#/practice', 'практика'],
  ['#/dictionary', 'словарь'],
  ['#/reference', 'справочник'],
  ['#/reference/rules', 'правила'],
  ['#/reference/topics', 'темы'],
  ['#/reference/tables', 'таблицы'],
  ['#/cards', 'карточки'],
  ['#/sprint', 'спринт'],
  ['#/review', 'повторение'],
  ['#/stats', 'статистика'],
  ['#/help', 'помощь'],
  ['#/', 'начало'],
];

let сбоев = 0;
console.log('Экраны:');
let было = await текст();
for (const [маршрут, имя] of ЭКРАНЫ) {
  const стало = await перейти(маршрут, было);
  if (!стало) {
    console.log(`  ✗ ${имя} — экран не отрисовался`);
    сбоев += 1;
    continue;
  }
  было = стало;
  const заголовок = (await оценить(`(document.querySelector('h1')?.textContent ?? '').trim()`)) || '—';
  console.log(`  ✓ ${имя} — ${стало.length} симв., «${заголовок}»`);
  if (OUT) {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, `${имя}.png`), Buffer.from(data, 'base64'));
  }
}

// Звук. Список записей вшит в сборку, поэтому имена берём из исходника
// и проверяем, что файлы лежат рядом с приложением и открываются.
const индекс = JSON.parse(fs.readFileSync(path.join(КОРЕНЬ, 'src/data/audio-index.json'), 'utf8'));
const идентификаторы = индекс.items.slice(0, 5).map(([id]) => id);
const звук = await оценить(`(async () => {
  const итоги = [];
  for (const id of ${JSON.stringify(идентификаторы)}) {
    const адрес = '/audio/' + id + '.mp3';
    const длительность = await new Promise((res) => {
      const a = new Audio(адрес);
      a.addEventListener('loadedmetadata', () => res(a.duration), { once: true });
      a.addEventListener('error', () => res(0), { once: true });
      setTimeout(() => res(-1), 5000);
    });
    итоги.push({ адрес, длительность });
  }
  return итоги;
})()`);

console.log(`\nЗвук (в списке ${индекс.items.length} записей, проверяем ${идентификаторы.length}):`);
for (const { адрес, длительность } of звук ?? []) {
  const хорошо = длительность > 0;
  if (!хорошо) сбоев += 1;
  console.log(`  ${хорошо ? '✓' : '✗'} ${адрес} — ${хорошо ? длительность.toFixed(2) + ' с' : 'не открылся'}`);
}

// Главное: ни одного обращения в сеть.
const внешние = [...new Set(запросы.filter((u) => /^https?:/i.test(u)))];
const схемы = [...new Set(запросы.map((u) => u.split(':')[0]))];
console.log('\nСеть:');
console.log(`  запросов: ${запросы.length}, схемы: ${схемы.join(', ')}`);
if (внешние.length) {
  сбоев += 1;
  console.log('  ✗ приложение обращается наружу:');
  for (const u of внешние) console.log('    ', u);
} else {
  console.log('  ✓ ни одного обращения в интернет — всё читается с диска');
}

const реальныеПровалы = провалы.filter((t) => t && !/ERR_ABORTED/.test(t));
console.log('\nОшибки:');
console.log(`  консоль: ${ошибкиКонсоли.length}, сорванные загрузки: ${реальныеПровалы.length}`);
for (const e of [...ошибкиКонсоли, ...реальныеПровалы].slice(0, 10)) console.log('    ✗', e);
сбоев += ошибкиКонсоли.length + реальныеПровалы.length;

console.log(сбоев === 0 ? '\n✓ оболочка проверена, замечаний нет' : `\n✗ замечаний: ${сбоев}`);
ws.close();
process.exit(сбоев === 0 ? 0 : 1);
