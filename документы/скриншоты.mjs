// Скриншоты приложения для документов — через Chrome DevTools Protocol.
//
// Chrome поднимается снаружи:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --remote-debugging-port=9222 --user-data-dir=<одноразовая папка> about:blank
//   node документы/скриншоты.mjs документы/скриншоты [адрес]
//
// По умолчанию снимается боевой сайт: в документ идёт то, что увидит учитель
// по ссылке, а не сборка с чьей-то машины.
import fs from 'node:fs';

const OUT = process.argv[2];
const BASE = process.argv[3] ?? 'https://tilashar-kz.vercel.app/';
if (!OUT) throw new Error('укажите папку для снимков');
fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));

let id = 0;
const waiting = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result ?? m.error); waiting.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id;
  waiting.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async expr =>
  (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

// Кадр ровно в экран телефона: снимок «во всю прокрутку» в лист не влезает —
// Word его не уменьшает, а обрезает и выталкивает на пустую страницу.
const ЭКРАН = { width: 400, height: 860, deviceScaleFactor: 2, mobile: true };
const снимки = [];

async function кадр(имя) {
  // Переход сбрасывает эмуляцию устройства — ставим её перед каждым кадром.
  await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
  await sleep(500);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(data, 'base64');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== 800 || h !== 1720) throw new Error(`${имя}: снимок ${w}×${h}, а нужен 800×1720`);
  fs.writeFileSync(`${OUT}/${имя}.png`, buf);
  снимки.push(имя);
  console.log(`  ${имя}.png`);
}

// Нажатие по видимому тексту кнопки или варианта. Не нашлось — съёмка падает:
// иначе в документ молча ушёл бы кадр не того экрана.
async function нажать(текст, селектор = 'button') {
  const итог = await ev(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(селектор)})]
      .find(e => e.textContent.trim() === ${JSON.stringify(текст)});
    if (!el) return 'нет';
    el.click(); return 'ok';
  })()`);
  if (итог !== 'ok') throw new Error(`не найдено: «${текст}»`);
  await sleep(700);
}

async function перейти(хеш) {
  await ev(`location.hash = ${JSON.stringify(хеш)}`);
  await sleep(900);
}

// Чистое состояние и светлая тема: кадры должны повторяться от прогона к прогону.
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
await send('Page.navigate', { url: BASE });
await sleep(3000);
await ev(`localStorage.clear(); localStorage.setItem('grammarquest_theme', 'light'); 'ok'`);
await send('Page.navigate', { url: BASE });
await sleep(3000);

await кадр('01-бастапқы');

// Список тем — с одной пройденной, чтобы было видно отметку и счёт.
await перейти('#/lesson/zat-esim');
for (const ответ of ['кітап', 'білім']) {
  await нажать('Ережеге өту');
  await нажать('Тапсырмаға өту');
  await нажать(ответ, '.option');
  await sleep(400);
  await нажать(ответ === 'білім' ? 'Аяқтау' : 'Келесі');
}
await перейти('#/learn');
await кадр('02-тақырыптар');

// Тема «Сын есім» — задания учителя.
await перейти('#/lesson/syn-esim');
await кадр('03-диалог');
await нажать('Ережеге өту');
await кадр('04-ереже');
await нажать('Тапсырмаға өту');
await кадр('05-тапсырма');
await нажать('сары', '.option');
await sleep(400);
await кадр('06-дұрыс');

await нажать('Келесі');
await нажать('Ережеге өту');
await нажать('Тапсырмаға өту');
await нажать('үлкен', '.option');
await нажать('биік', '.option');
await кадр('07-бірнеше-жауап');
await нажать('Тексеру');

await нажать('Келесі');
await нажать('Ережеге өту');
await нажать('Тапсырмаға өту');
await нажать('тәтті', '.option');
await sleep(400);
await кадр('08-қате');
await нажать('Аяқтау');
await кадр('09-қорытынды');

// Русский режим: те же казахские тексты, перевод под ними.
await перейти('#/learn');
await нажать('Рус', '.tab');
await перейти('#/lesson/san-esim');
await кадр('10-орысша');
await нажать('Қаз', '.tab').catch(() => {});
await ev(`localStorage.clear(); 'ok'`);

console.log(`снято: ${снимки.length}`);
ws.close();
