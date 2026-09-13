// Запись ролика о приложении — через Chrome DevTools Protocol.
//
// Прошлый ролик записывался так же, но скрипт записи не сохранили, и
// пересобрать мастер было нечем. Теперь запись — этот файл.
//
// Chrome поднимается снаружи, со звуком без жеста пользователя:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --remote-debugging-port=9223 --autoplay-policy=no-user-gesture-required \
//     --user-data-dir=<одноразовая папка> about:blank
//   node видео/записать.mjs <папка-для-кадров> [адрес]
//
// Скрипт пишет кадры и журнал: когда что нажато и когда какая запись озвучки
// зазвучала. Звук из headless Chrome не снять, поэтому дорожку приложения
// `собрать.py --мастер` собирает из тех же mp3, что лежат в приложении, —
// ровно в моменты из журнала. По тому же журналу считаются окна, в которые
// диктору говорить нельзя.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const КОРЕНЬ = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const OUT = process.argv[2];
const BASE = process.argv[3] ?? 'https://tilashar-kz.vercel.app/';
if (!OUT) throw new Error('укажите папку для кадров');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
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

// Кадр 780×1592: ролик вертикальный, под ним плашка подписи высотой 96.
const ЭКРАН = { width: 390, height: 796, deviceScaleFactor: 2, mobile: true };

// Записи озвучки — те же файлы, что в приложении: имя — хеш текста.
const запись = текст => crypto.createHash('sha1').update(текст, 'utf8').digest('hex').slice(0, 12);
const длительность = файл => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries',
  'format=duration', '-of', 'csv=p=0', файл]).toString());

let t0 = 0;
const сейчас = () => (Date.now() - t0) / 1000;
const кадры = [];
const события = [];
let идёт = true;

async function съёмка() {
  while (идёт) {
    const t = сейчас();
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
    const имя = `${String(кадры.length).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(OUT, имя), Buffer.from(data, 'base64'));
    кадры.push({ имя, t: Math.round(t * 1000) / 1000 });
  }
}

function отметить(что, подробно = {}) {
  события.push({ t: Math.round(сейчас() * 1000) / 1000, что, ...подробно });
}

async function нажать(текст, селектор = 'button') {
  const итог = await ev(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(селектор)})]
      .find(e => e.textContent.trim() === ${JSON.stringify(текст)});
    if (!el) return 'нет';
    el.click(); return 'ok';
  })()`);
  if (итог !== 'ok') throw new Error(`не найдено: «${текст}»`);
  отметить('нажатие', { текст });
}

/** Кнопка «Тыңдау» у реплики: звучит запись, персонаж говорит. */
async function послушать(кто, текст) {
  const файл = path.join(КОРЕНЬ, 'public', 'audio', `${запись(текст)}.mp3`);
  if (!fs.existsSync(файл)) throw new Error(`нет записи для «${текст}»`);
  const итог = await ev(`(() => {
    const b = [...document.querySelectorAll('button.speak')]
      .find(e => e.getAttribute('aria-label') === ${JSON.stringify(`Тыңдау: ${кто}`)});
    if (!b) return 'нет';
    b.click(); return 'ok';
  })()`);
  if (итог !== 'ok') throw new Error(`нет кнопки «Тыңдау: ${кто}»`);
  const д = длительность(файл);
  отметить('звук', { кто, текст, файл: path.relative(КОРЕНЬ, файл), длительность: д });
  await sleep(д * 1000 + 350);
}

async function вниз() {
  await ev(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); 'ok'`);
}

// ─────────────────────────── подготовка ───────────────────────────
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
await send('Page.navigate', { url: BASE });
await sleep(3000);
await ev(`localStorage.clear(); localStorage.setItem('grammarquest_theme', 'light'); 'ok'`);
await send('Page.navigate', { url: BASE });
await sleep(3500);
await send('Emulation.setDeviceMetricsOverride', ЭКРАН);
await sleep(600);

t0 = Date.now();
const поток = съёмка();
отметить('сцена', { экран: 'бастапқы' });

// ─────────────────────────── сценарий ───────────────────────────
await sleep(2600);
await ev(`window.scrollTo({ top: 520, behavior: 'smooth' }); 'ok'`);
await sleep(2200);
await нажать('Бастау');
отметить('сцена', { экран: 'тақырыптар' });
await sleep(3400);

await нажать('Сын есім6 · 3 тапсырма', '.step__hit').catch(async () => {
  // Подпись кнопки склеена из номера, названия и числа заданий — ищем по названию.
  const итог = await ev(`(() => { const b = [...document.querySelectorAll('.step__hit')]
    .find(e => e.querySelector('.step__title')?.textContent === 'Сын есім'); if (!b) return 'нет';
    b.click(); return 'ok'; })()`);
  if (итог !== 'ok') throw new Error('нет темы «Сын есім»');
  отметить('нажатие', { текст: 'Сын есім' });
});
отметить('сцена', { экран: 'диалог' });
await sleep(1400);
await послушать('Айша', 'Бақшада қызыл-сары гүлдер бар.');
await послушать('Мұғалім', 'Бұл сөйлемде қызыл-сары сөздері сын есім болады.');
await sleep(300);

await нажать('Ережеге өту');
отметить('сцена', { экран: 'ереже' });
await sleep(4200);

await нажать('Тапсырмаға өту');
отметить('сцена', { экран: 'тапсырма' });
await sleep(2600);
await нажать('сары', '.option');
await sleep(700);
await вниз();
отметить('сцена', { экран: 'дұрыс' });
await sleep(1600);
await послушать('сары', 'сары');
await sleep(900);

await нажать('Келесі');
отметить('сцена', { экран: 'диалог-2' });
await sleep(2000);
await нажать('Ережеге өту');
await sleep(1900);
await нажать('Тапсырмаға өту');
отметить('сцена', { экран: 'бірнеше-жауап' });
await sleep(1800);
await нажать('үлкен', '.option');
await sleep(700);
await нажать('биік', '.option');
await sleep(900);
await вниз();
await sleep(500);
await нажать('Тексеру');
await sleep(500);
await вниз();
await sleep(2400);

await нажать('Келесі');
отметить('сцена', { экран: 'диалог-3' });
await sleep(1500);
await нажать('Ережеге өту');
await sleep(1500);
await нажать('Тапсырмаға өту');
отметить('сцена', { экран: 'қате' });
await sleep(1500);
await нажать('тәтті', '.option');
await sleep(700);
await вниз();
await sleep(3000);

await нажать('Аяқтау');
отметить('сцена', { экран: 'қорытынды' });
await sleep(3000);

await ev(`location.hash = '#/learn'; 'ok'`);
отметить('сцена', { экран: 'тақырыптар-2' });
await sleep(1400);
await нажать('Рус', '.tab');
отметить('сцена', { экран: 'орысша' });
await sleep(2200);
await ev(`location.hash = '#/lesson/san-esim'; 'ok'`);
await sleep(3600);

идёт = false;
await поток;
отметить('конец');

fs.writeFileSync(path.join(OUT, 'журнал.json'), JSON.stringify({
  кадр: [ЭКРАН.width * ЭКРАН.deviceScaleFactor, ЭКРАН.height * ЭКРАН.deviceScaleFactor],
  кадры, события,
}, null, 1));
await ev(`localStorage.clear(); 'ok'`);
const длина = кадры.at(-1).t;
console.log(`кадров: ${кадры.length} за ${длина.toFixed(1)} с (${(кадры.length / длина).toFixed(1)} в секунду)`);
for (const с of события) console.log(`  ${с.t.toFixed(2).padStart(6)}  ${с.что}  ${с.экран ?? с.текст ?? ''}`);
ws.close();
