# GrammarQuest — Product Context

## What is this?
Интерактивный веб-квест для изучения казахского языка через диалоги и грамматику.

## Target audience
Русскоязычные школьники 12-17 лет, изучающие казахский как второй язык.

## Core value proposition
- Билингвальный контент (казахский основной + русский субтитр)
- Интерактивные диалоги с персонажами
- Прогрессивное обучение грамматике
- PWA — работает офлайн, устанавливается на телефон

## Key features
1. **Уроки** — диалоги с персонажами (Айша, Дима, Учитель)
2. **Правила** — грамматические правила с примерами
3. **Справочник** — полный справочник по темам
4. **Прогресс** — отслеживание пройденных уроков
5. **Озвучка** — Web Speech API для казахского текста
6. **Звуки** — Web Audio API для feedback

## Tech stack
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4 + OKLCH colors
- Framer Motion (springs)
- React Router 7
- PWA (vite-plugin-pwa)

## Design principles
1. **No AI slop** — избегаю Inter, gradient text, glassmorphism, 3 equal cards
2. **OKLCH colors** — perceptually uniform, accessible
3. **Springs motion** — interruptible, natural (damping 1.0)
4. **Asymmetric layout** — visual interest, not boring
5. **List over cards** — when cards aren't necessary
6. **Typography hierarchy** — size + weight + tracking
7. **Generous whitespace** — breathing room
8. **Reduced motion** — accessibility first

## Color palette (OKLCH)
- Background: oklch(0.15 0.02 240) — тёмно-синий
- Surface: oklch(0.18 0.025 240)
- Accent: oklch(0.75 0.15 85) — золото
- Success: oklch(0.7 0.15 160) — зелёный
- Error: oklch(0.65 0.2 25) — красный

## Typography
- Font: system-ui (Geist if available)
- Display: clamp(2rem, 5vw, 3.5rem), tracking -0.02em
- Heading: clamp(1.5rem, 3vw, 2rem), tracking -0.01em
- Body: 1rem, line-height 1.6, max-width 65ch

## Layout
- Asymmetric grid (2fr 1fr)
- List layout вместо cards
- Dividers вместо borders
- Generous whitespace (py-12, px-6 md:px-12 lg:px-24)

## Animation
- Springs: { type: 'spring', damping: 1.0, stiffness: 100 }
- Hover: whileHover={{ y: -2 }}
- Press: whileTap={{ scale: 0.97 }}
- Transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }

## Data structure
- 18 уроков (lessons.json)
- 33 правила (rules.json)
- 22 темы справочника (reference.json)
- Все данные на казахском + русский перевод

## Characters
- Учитель (teacher.png) — женщина в зелёном платье
- Айша (aisha.png) — девочка с тюбетейкой
- Дима (dima.png) — мальчик с тюбетейкой

## PWA
- manifest.webmanifest
- Service worker
- Offline mode
- Install to home screen

## Deployment
- Vercel (recommended): `npx vercel`
- Netlify: drag dist/ to netlify.com/drop
- GitHub Pages: push + enable Pages

## Version
- Current: v5.0 Premium
- Status: Ready for production
