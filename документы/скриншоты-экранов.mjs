// Скриншоты экранов приложения через Chrome DevTools Protocol.
// Chrome поднимается снаружи с --remote-debugging-port=9222.
import fs from 'node:fs';

const OUT = process.argv[2];
const BASE = 'https://tilashar-kz.vercel.app/';

const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));

let id = 0;
const waiting = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id;
  waiting.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const evaluate = expr => send('Runtime.evaluate', { expression: expr, awaitPromise: true });

await send('Page.enable');
await send('Runtime.enable');
// Кадр ровно в экран телефона. Раньше часть снимков делалась «во всю
// прокрутку», и «профиль» выходил 800×5251 — при ширине 7,2 см это 47 см
// высоты, вдвое выше листа. Такая картинка не помещается никуда: документ
// получал обрезанный рисунок и пустую страницу перед ним.
const ЭКРАН = { width: 400, height: 860, deviceScaleFactor: 2, mobile: true };
const ЖДЁМ = [ЭКРАН.width * ЭКРАН.deviceScaleFactor, ЭКРАН.height * ЭКРАН.deviceScaleFactor];

await send('Emulation.setDeviceMetricsOverride', ЭКРАН);

async function shot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(data, 'base64');
  // Размер PNG лежит в заголовке IHDR: ширина и высота — байты 16..24.
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== ЖДЁМ[0] || h !== ЖДЁМ[1]) {
    throw new Error(`${name}: снимок ${w}×${h}, а нужен ${ЖДЁМ[0]}×${ЖДЁМ[1]}. `
      + 'Похоже, съёмка ушла за пределы экрана — такой кадр в документ не влезет.');
  }
  fs.writeFileSync(`${OUT}/${name}.png`, buf);
  console.log(`  ${name}.png  ${w}×${h}`);
}

// Кнопка по видимому тексту: селекторов по тексту в CDP нет.
const clickText = txt => evaluate(`
  (() => {
    const b = [...document.querySelectorAll('button')]
      .find(e => e.textContent.trim().startsWith(${JSON.stringify(txt)}));
    if (b) { b.click(); return 'ok'; }
    return 'НЕ НАЙДЕНА: ' + ${JSON.stringify(txt)};
  })()`);

async function go(hash, wait = 2200) {
  await send('Page.navigate', { url: BASE + hash });
  await sleep(wait);
}

// Прогресс, чтобы экраны не выглядели пустыми
await go('');
await evaluate(`localStorage.setItem('grammarquest_theme', 'light')`);
// Съёмка идёт с чистого состояния: иначе кадры зависят от того, что осталось
// в браузере от прошлого прогона, и повторить их нельзя.
await evaluate(`localStorage.removeItem('grammarquest_state')`);
await sleep(300);

// Экраны верхнего уровня. Съёмка урока — в скриншоты-урока.mjs: там нужны
// нажатия, а не просто переход по адресу.
const plan = [
  ['01-приветствие', ''],
  ['02-учиться', '#/learn'],
  ['07-практика', '#/practice'],
  ['08-словарь', '#/dictionary'],
  ['09-справка', '#/reference'],
  ['10-таблицы', '#/reference/tables'],
  ['11-профиль', '#/stats'],
];
for (const [name, hash] of plan) {
  await go(hash);
  // Переход через Page.navigate сбрасывает эмуляцию устройства, и следующий
  // кадр снимался бы в размер окна браузера.
  await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
  await sleep(400);
  await shot(name);
}

// Урок: три фазы подряд
await go('#/lesson/kz_base_03_otbasy');
await shot('03-урок-диалог');
console.log('  клик:', (await clickText('К правилу')).result?.value);
await sleep(1200);
await shot('04-урок-правило');
console.log('  клик:', (await clickText('К заданию')).result?.value);
await sleep(1200);
await shot('05-урок-задание');

ws.close();
