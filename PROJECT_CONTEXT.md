# GrammarQuest - Полный контекст проекта

## 📋 Описание
GrammarQuest — интерактивное веб-приложение для изучения казахского языка через диалоги и грамматику. PWA с offline-поддержкой, gamification системой и премиальным дизайном.

**Сайт:** https://grammarquest-web.vercel.app  
**GitHub:** https://github.com/s-chaikovskiy/grammarquest-web

---

## 🎯 Целевая аудитория
- Школьники 12-17 лет + учителя
- Использование: каждый день по 10-15 минут
- Платформы: десктоп + мобильные (responsive)

---

## 🛠 Технологии

### Frontend
- **React 18** + TypeScript
- **Vite** (сборка)
- **Tailwind CSS** (стилизация)
- **Framer Motion** (анимации)
- **React Router** (маршрутизация)

### Дополнительные библиотеки
- `canvas-confetti` — эффекты конфетти
- `@tsparticles/react` + `@tsparticles/slim` — анимированные частицы
- `workbox-precaching` — PWA service worker

### Хостинг
- **Vercel** (автодеплой с GitHub)
- **GitHub** (репозиторий)

---

## 📁 Структура проекта

```
grammarquest-web/
├── public/
│   └── characters/          # PNG изображения персонажей
│       ├── teacher.png
│       ├── teacher_finger_up.png
│       ├── teacher_like.png
│       ├── aisha.png
│       ├── aisha_finger_up.png
│       ├── dima.png
│       ├── dima_finger_up.png
│       └── app_icon.png
├── src/
│   ├── components/
│   │   ├── AnimatedBackground.tsx  # Анимированный фон с частицами
│   │   ├── AchievementsSection.tsx # Секция достижений
│   │   ├── Character.tsx           # Компонент персонажа
│   │   ├── Subtitle.tsx            # Субтитры
│   │   ├── TaskInput.tsx           # Компонент заданий (5 типов)
│   │   ├── TiltCard.tsx            # 3D карточки с наклоном
│   │   └── Toast.tsx               # Уведомления
│   ├── data/
│   │   ├── achievements.ts   # 12 достижений + функции уровней
│   │   ├── index.ts          # Экспорты данных
│   │   ├── lessons.json      # 18 уроков
│   │   ├── reference.json    # 22 темы справочника
│   │   └── rules.json        # 33 правила
│   ├── hooks/
│   │   ├── useApp.tsx        # React Context
│   │   └── useAppState.ts    # Состояние приложения + localStorage
│   ├── screens/
│   │   ├── LessonListScreen.tsx  # Список уроков
│   │   ├── LessonScreen.tsx      # Прохождение урока
│   │   ├── MenuScreen.tsx        # Главное меню
│   │   ├── ReferenceScreen.tsx   # Справочник
│   │   ├── ReviewScreen.tsx      # Повторение
│   │   ├── RulesScreen.tsx       # Правила
│   │   └── WelcomeScreen.tsx     # Приветственный экран
│   ├── types/
│   │   └── index.ts          # TypeScript типы
│   ├── utils/
│   │   ├── confetti.ts       # Функции конфетти
│   │   ├── helpers.ts        # Вспомогательные функции
│   │   └── sounds.ts         # Звуки + озвучка
│   ├── App.tsx               # Главный компонент + маршруты
│   ├── index.css             # Глобальные стили + тема
│   ├── main.tsx              # Точка входа
│   └── vite-env.d.ts         # Vite типы
── index.html                # HTML шаблон
├── package.json              # Зависимости
├── tsconfig.json             # TypeScript конфиг
└── vite.config.ts            # Vite конфиг
```

---

## 🎨 Дизайн система

### Цветовая палитра (тёмная тема)
```css
--color-bg-primary: #0A0A0F        /* Основной фон */
--color-bg-secondary: #13131A      /* Вторичный фон */
--color-bg-tertiary: #1C1C24       /* Третичный фон */
--color-bg-glass: rgba(255,255,255,0.03)  /* Glass эффект */

--color-text-primary: #FFFFFF      /* Основной текст */
--color-text-secondary: #A0A0B0    /* Вторичный текст */
--color-text-muted: #6B6B7B        /* Приглушённый текст */

--color-accent: #6366F1            /* Индиго (основной) */
--color-success: #10B981           /* Зелёный */
--color-error: #EF4444             /* Красный */
--color-warning: #F59E0B           /* Жёлтый */
--color-info: #3B82F6              /* Синий */
--color-purple: #8B5CF6            /* Фиолетовый */
--color-pink: #EC4899              /* Розовый */
```

### Шрифты
- **Основной:** Manrope (sans-serif)
- **Заголовки:** Playfair Display (serif)
- **Моно:** JetBrains Mono

### Визуальные эффекты
- **Glassmorphism** — полупрозрачные карточки с blur
- **Mesh gradients** — анимированные градиентные пятна
- **3D Tilt** — наклон карточек при наведении
- **Particles** — 50 плавающих частиц со связями
- **Confetti** — при правильных ответах и достижениях

---

##  Функциональность

### Gamification система
- **XP** — опыт за правильные ответы (+10 XP)
- **Уровни** — каждые 100 XP = новый уровень
- **Streaks** — серии ежедневных занятий
- **Достижения** — 12 различных достижений:
  - Первый шаг (1 урок)
  - Табандылық (5 уроков)
  - Білімпаз (10 уроков)
  - Шебер (все 18 уроков)
  - Үш күн (3 дня подряд)
  - Апта (7 дней)
  - Ай (30 дней)
  - Жинаушы (100 XP)
  - Бай (500 XP)
  - Миллионер (1000 XP)
  - Перфекционист (урок без ошибок)
  - Деңгей 5 (5 уровень)

### Типы заданий
1. **Input** — ввод текста
2. **Choice** — выбор из вариантов
3. **Matching** — сопоставление пар
4. **Fill blank** — заполнение пропусков
5. **Translate** — перевод

### Структура урока
1. **Диалог** — контекст с персонажами
2. **Грамматика** — правило с объяснением
3. **Задание** — практика (один из 5 типов)
4. **Результат** — фидбек + комментарий учителя

### Экраны
1. **Welcome** — приветствие с персонажем
2. **Menu** — главное меню с прогрессом и статистикой
3. **LessonList** — список из 18 уроков
4. **Lesson** — прохождение урока (4 фазы)
5. **Rules** — 33 грамматических правила
6. **Reference** — 22 темы справочника
7. **Review** — повторение пройденного

---

##  Данные

### Уроки (18 штук)
- Формат: JSON
- Каждый урок: 5-7 шагов
- Каждый шаг: диалог + грамматика + задание
- Персонажи: Айша, Дима, Учитель

### Правила (33 штуки)
- Категории: грамматика казахского языка
- Формат: казахский + русский перевод
- Примеры использования

### Справочник (22 темы)
- Категории: фонетика, морфология, синтаксис
- Подробные объяснения
- Примеры и типичные ошибки

---

## 🔊 Звуки

### Звуковые эффекты
- **Correct** — восходящая арпеджио (C5, E5, G5, C6)
- **Wrong** — нисходящий тон (350Hz → 280Hz)
- **Click** — короткий щелчок (1200Hz)
- **Transition** — двойной тон (440Hz → 554Hz)
- **LevelUp** — торжественный аккорд
- **Achievement** — звук достижения
- **Streak** — звук серии

### Озвучка
- Web Speech API (отключена — роботизированный голос)
- Поддержка kk-KZ и ru-RU

### Фоновая музыка
- Простая мелодия через Web Audio API
- Вкл/выкл кнопка в меню

---

##  Деплой

### GitHub
- Репозиторий: `s-chaikovskiy/grammarquest-web`
- SSH ключ: добавлен
- Ветка: `main`

### Vercel
- Проект: `chaikovskiy-s-projects/grammarquest-web`
- Автодеплой: при каждом push
- Домен: `grammarquest-web.vercel.app`
- Build command: `npm run build`
- Output directory: `dist`

### PWA
- Service worker: workbox-precaching
- Manifest: manifest.webmanifest
- Offline-ready: да

---

## 📝 Команды

```bash
# Разработка
npm run dev              # Запуск dev сервера (порт 5174)

# Сборка
npm run build            # Production сборка
npm run preview          # Предпросмотр сборки

# Деплой
vercel --yes --prod      # Деплой на Vercel

# Git
git add . && git commit -m "message"
git push                 # Push на GitHub → автодеплой
```

---

## 🎯 Архитектурные решения

### State Management
- React Context + useReducer паттерн
- localStorage для персистентности
- Ключ: `grammarquest_state`

### Состояние приложения
```typescript
interface AppState {
  lang: 'kz' | 'ru';
  progress: Record<string, LessonProgress>;
  xp: number;
  streak: number;
  achievements: string[];
  lastActiveDate: string;
  level: number;
}
```

### Маршрутизация
```
/ → WelcomeScreen
/menu → MenuScreen
/lessons → LessonListScreen
/lesson/:id → LessonScreen
/rules → RulesScreen
/reference → ReferenceScreen
/review → ReviewScreen
```

### Анимации
- Framer Motion для всех переходов
- Spring анимации для интерактивности
- Stagger для последовательного появления
- Exit анимации для смены фаз

---

## 🐛 Известные ограничения

1. **Озвучка** — Web Speech API имеет роботизированный голос для казахского
2. **Персонажи** — статичные PNG, не анимированные SVG
3. **Иконки** — эмодзи вместо профессиональных SVG
4. **Контент** — 18 уроков (можно расширить)

---

##  История изменений

### v5.0 (текущая)
- Полный редизайн в тёмной теме
- Glassmorphism + mesh gradients
- Анимированные частицы
- 3D tilt карточки
- Confetti эффекты
- Gamification система
- 5 типов заданий
- Экран повторения
- PWA поддержка

### v4.0
- Duolingo-стиль (светлая тема)
- Базовая gamification
- Исправление багов

### v3.0 и ранее
- Базовый функционал
- Минимальный дизайн

---

##  Зависимости

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "framer-motion": "^11.2.10",
  "canvas-confetti": "^1.9.3",
  "@tsparticles/react": "^3.0.0",
  "@tsparticles/slim": "^3.4.0",
  "tailwindcss": "^3.4.4",
  "typescript": "^5.4.5",
  "vite": "^5.2.12",
  "vite-plugin-pwa": "^0.20.0"
}
```

---

## 🎓 Контент

### Языки
- **Казахский** (основной)
- **Русский** (перевод)

### Темы уроков
1. Настоящее время
2. Прошедшее время
3. Будущее время
4. Падежи
5. Числительные
6. Прилагательные
7. Глаголы
8. Предлоги
9. Союзы
10. И другие...

---

## 🔐 Безопасность

- Нет серверной части (client-side only)
- Данные в localStorage (не чувствительные)
- Нет авторизации/регистрации
- HTTPS через Vercel

---

##  PWA возможности

- Установка на домашний экран
- Offline режим
- Service worker кэширование
- Manifest для мобильных

---

## 🎨 Компоненты UI

### Карточки
- `card-premium` — glassmorphism с hover эффектом
- `TiltCard` — 3D наклон при наведении

### Кнопки
- `btn-premium` — градиентная с glow
- `glass` — полупрозрачная
- `shadow-duo` — тень в стиле Duolingo

### Анимации
- `mesh-bg` — анимированный градиентный фон
- `AnimatedBackground` — частицы + градиенты
- `confetti` — эффекты при успехе

---

##  Тестирование

- TypeScript строгая проверка
- Production сборка без ошибок
- Ручное тестирование всех экранов

---

## 📈 Метрики

- **Размер бандла:** ~1.2 MB (gzip: ~304 KB)
- **Количество файлов:** 21 TypeScript/TSX
- **Строк кода:** ~2,500
- **Время сборки:** ~3-4 секунды
- **Lighthouse:** не тестировался

---

##  Планы на будущее

1. **Контент**
   - Добавить ещё 20-30 уроков
   - Аудио от носителей языка
   - Видео объяснения

2. **Функциональность**
   - Система повторения (spaced repetition)
   - Статистика и аналитика
   - Соревнования между пользователями

3. **Дизайн**
   - Анимированные SVG персонажи
   - Профессиональные иконки
   - Больше микроанимаций

4. **Техническое**
   - Backend для прогресса в облаке
   - Авторизация пользователей
   - Мультиплеер режим

---

## 📞 Контакты

- **GitHub:** s-chaikovskiy
- **Сайт:** grammarquest-web.vercel.app

---

*Последнее обновление: Август 2026*  
*Версия: 5.0*  
*Статус: Production-ready*
