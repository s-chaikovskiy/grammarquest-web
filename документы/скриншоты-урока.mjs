import fs from 'node:fs';
const OUT = process.argv[2];
const BASE = 'https://tilashar-kz.vercel.app/';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const waiting = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); } });
const send = (m, p = {}) => new Promise(res => { const n = ++id; waiting.set(n, res);
  ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true })).result?.value;

await send('Page.enable'); await send('Runtime.enable');
// Кадр ровно в экран телефона: снимок «во всю прокрутку» в документ не влезает.
const ЭКРАН = { width: 400, height: 860, deviceScaleFactor: 2, mobile: true };
await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
const shot = async n => { const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(data, 'base64');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== 800 || h !== 1720) throw new Error(`${n}: снимок ${w}×${h}, а нужен 800×1720`);
  fs.writeFileSync(`${OUT}/${n}.png`, buf); console.log('  ' + n + '.png  ' + w + '×' + h); };
const click = t => ev(`(()=>{const b=[...document.querySelectorAll('button')]
  .find(e=>e.textContent.trim().startsWith(${JSON.stringify(t)}));
  if(b){b.click();return 'ok'}return 'НЕТ: '+${JSON.stringify(t)}})()`);

// Прогресс от прошлого прогона оставлял урок открытым сразу на задании,
// и все три «фазы» выходили одним и тем же кадром. Чистим состояние —
// профиль браузера здесь одноразовый, ничьи данные не страдают.
await send('Page.navigate', { url: BASE });
await sleep(1800);
await ev(`localStorage.removeItem('grammarquest_state')`);
await send('Page.navigate', { url: BASE + '#/lesson/kz_base_03_otbasy' });
await sleep(2600);
// Переход сбрасывает эмуляцию устройства — возвращаем её до первого кадра.
await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
await sleep(400);
await shot('03-урок-диалог');
console.log('   ', await click('К правилу')); await sleep(1200);
await shot('04-урок-правило');
console.log('   ', await click('К заданию')); await sleep(1400);
await shot('05-урок-задание');

// Ответ русскими буквами вместо казахских — главный сюжет приложения
console.log('   ', await ev(`(()=>{const i=document.querySelector('input.field, input[type=text]');
  if(!i) return 'нет поля';
  const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  s.call(i,'аке'); i.dispatchEvent(new Event('input',{bubbles:true})); return 'введено '+i.value})()`));
await sleep(700);
console.log('   ', await click('Проверить')); await sleep(1600);
await shot('06-урок-разбор');
ws.close();
