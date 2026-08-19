# GrammarQuest — Developer Guide

## Quick start

```bash
cd grammarquest-web
npm install
npm run dev
```

Открой: http://localhost:5173

## Build

```bash
npm run build
```

Output: `dist/`

## Deploy

### Vercel
```bash
npx vercel
```

### Netlify
Перетащи папку `dist/` на https://netlify.com/drop

### GitHub Pages
1. Push в репо
2. Settings → Pages → Source: gh-pages branch

## Project structure

```
grammarquest-web/
├── src/
│   ├── components/
│   │   ├── Character.tsx      — SVG персонажи
│   │   └── Subtitle.tsx       — Компонент субтитров
│   ├── screens/
│   │   ├── WelcomeScreen.tsx  — Стартовый экран
│   │   ├── MenuScreen.tsx     — Главное меню
│   │   ├── LessonListScreen.tsx — Список уроков
│   │   ├── LessonScreen.tsx   — Экран урока
│   │   ├── RulesScreen.tsx    — Правила
│   │   └── ReferenceScreen.tsx — Справочник
│   ├── hooks/
│   │   ├── useApp.tsx         — React Context
│   │   ── useAppState.ts     — Состояние + localStorage
│   ├── data/
│   │   ├── index.ts           — Экспорт данных
│   │   ├── lessons.json       — 18 уроков
│   │   ├── rules.json         — 33 правила
│   │   ── reference.json     — 22 темы
│   ├── types/
│   │   └── index.ts           — TypeScript типы
│   ├── utils/
│   │   ├── helpers.ts         — Утилиты
│   │   └── sounds.ts          — Звуковые эффекты
│   ├── App.tsx                — Роутинг
│   ├── main.tsx               — Точка входа
│   └── index.css              — Стили (OKLCH)
├── public/
│   └── characters/            — PNG персонажей
├── dist/                      — Продакшн сборка
├── PRODUCT.md                 — Контекст проекта
├── DESIGN.md                  — Дизайн-система
└── README.md                  — Этот файл
```

## Design tokens

Смотри `DESIGN.md` для полной документации.

### Colors (OKLCH)
- Background: oklch(0.15 0.02 240)
- Accent: oklch(0.75 0.15 85) — золото
- Success: oklch(0.7 0.15 160) — зелёный
- Error: oklch(0.65 0.2 25) — красный

### Typography
- Font: system-ui (Geist если доступен)
- Display: clamp(2rem, 5vw, 3.5rem)
- Body: 1rem, line-height 1.6

### Motion
- Springs: damping 1.0, stiffness 100
- Hover: y -2px
- Press: scale 0.97

## Data format

### Lesson
```json
{
  "id": "kzru_grammar_01",
  "titleKz": "Нақ осы шақ",
  "titleRu": "Настоящее время",
  "character": "AUTO",
  "steps": [
    {
      "dialogueKz": "...",
      "dialogueRu": "...",
      "grammarKz": "...",
      "grammarRu": "...",
      "taskKz": "...",
      "taskRu": "...",
      "answerKz": "...",
      "answerRu": "...",
      "teacherKz1": "...",
      "teacherKz2": "...",
      "teacherRu1": "...",
      "teacherRu2": "..."
    }
  ]
}
```

### Rule
```json
{
  "id": "kz_present_simple",
  "titleKz": "Осы шақ",
  "titleRu": "Настоящее время",
  "kz": "...",
  "ru": "...",
  "examplesKz": ["..."],
  "examplesRu": ["..."]
}
```

### Reference topic
```json
{
  "id": "kz_cases_full",
  "categoryKz": "Септіктер",
  "categoryRu": "Падежи",
  "titleKz": "...",
  "titleRu": "...",
  "bodyKz": "...",
  "bodyRu": "...",
  "examplesKz": ["..."],
  "examplesRu": ["..."],
  "mistakesKz": ["..."],
  "mistakesRu": ["..."]
}
```

## Adding new content

### New lesson
1. Добавь объект в `src/data/lessons.json`
2. Follow существующую структуру
3. character: "AUTO" | "AISHA" | "DIMA" | "TEACHER"

### New rule
1. Добавь объект в `src/data/rules.json`
2. examplesKz/examplesRu — массивы строк

### New reference topic
1. Добавь объект в `src/data/reference.json`
2. categoryKz/categoryRu — для группировки

## Testing

### Visual
```bash
npm run dev
```
Проверь в Chrome, Safari, Firefox.

### Build
```bash
npm run build
```
Убедись что нет ошибок.

### Lighthouse
Открой DevTools → Lighthouse → Run audit.

Цели:
- Performance: ≥95
- Accessibility: ≥100
- Best Practices: ≥100
- SEO: ≥100

## Troubleshooting

### Port 5173 занят
```bash
npx vite --port 3000
```

### TypeScript errors
```bash
npx tsc --noEmit
```

### Build fails
```bash
rm -rf node_modules
npm install
npm run build
```

### PWA не устанавливается
1. Открой в Chrome
2. DevTools → Application → Manifest
3. Убедись что manifest корректный
4. Service Worker → Update

## Future improvements

### Voice
- [ ] Google Cloud TTS для премиум качества
- [ ] ElevenLabs для естественных голосов
- [ ] Записать аудио с носителем языка

### Images
- [ ] Конвертировать PNG в WebP
- [ ] Добавить lazy loading
- [ ] CDN для продакшена

### Features
- [ ] Синхронизация прогресса между устройствами
- [ ] Админка для учителя
- [ ] Статистика и аналитика
- [ ] Достижения и streaks
- [ ] Тёмная/светлая тема (переключатель)

### Performance
- [ ] Code splitting для роутов
- [ ] Lazy load изображений
- [ ] Optimize bundle size

## License

MIT

## Credits

Original app: GrammarQuest v1.0 (Java + JavaFX)
Rewrite: React + TypeScript + Tailwind CSS
Design: OKLCH + Springs + Asymmetric layout
