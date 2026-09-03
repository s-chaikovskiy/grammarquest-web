// Оболочка приложения для Windows.
//
// Внутри — та же самая веб-сборка, что открывается по ссылке и лежит в APK.
// Отдельной версии для компьютера не существует: собирается один dist,
// а здесь он просто показывается в окне.
//
// Файлы отдаются по собственной схеме app://, а не по file://.
// Причина простая: в разметке есть абсолютные пути вроде /characters/aisha.webp
// и /audio/xxxx.mp3, и по file:// они уводят в корень диска. Своя схема
// делает корнем папку со сборкой, и всё разрешается так же, как в браузере.
const { app, BrowserWindow, protocol, shell, net } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, 'dist');

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
}]);

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 900,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: '#f6f8fc',
    title: 'Тілашар',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Окно показывается уже отрисованным: иначе на слабой машине сначала
  // мелькает белый прямоугольник.
  win.once('ready-to-show', () => win.show());

  // Внешние ссылки открываются в браузере, а не подменяют окно приложения.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL('app://tilashar/index.html');
  return win;
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    // Пустой путь и любой неизвестный адрес — на index.html: маршрутизация
    // внутри приложения идёт через хеш, отдельных страниц на диске нет.
    const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    // Выход за пределы папки сборки запрещён.
    const target = file.startsWith(ROOT) ? file : path.join(ROOT, 'index.html');
    return net.fetch(pathToFileURL(target).toString());
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
