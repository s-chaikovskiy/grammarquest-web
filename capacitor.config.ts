import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Конфигурация мобильной сборки.
 *
 * Приложение полностью офлайновое: весь код, данные, шрифты и картинки
 * лежат внутри пакета, сервер не нужен. Поэтому в `server` нет ни url,
 * ни разрешений на сеть — APK работает в самолётном режиме.
 */
const config: CapacitorConfig = {
  appId: 'kz.grammarquest.app',
  appName: 'GrammarQuest',
  webDir: 'dist',

  android: {
    // Аппаратное ускорение веб-вью: без него анимации на бюджетных
    // школьных телефонах заметно дёргаются.
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: '#0064B9',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#0064B9',
    },
  },
};

export default config;
