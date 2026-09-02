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
await send('Emulation.setDeviceMetricsOverride',
  { width: 400, height: 860, deviceScaleFactor: 2, mobile: true });

async function shot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
  console.log(`  ${name}.png`);
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
await sleep(300);

const plan = [];
for (const [name, hash] of plan) { await go(hash); await shot(name); }

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
