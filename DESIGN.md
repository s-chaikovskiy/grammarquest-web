# GrammarQuest — Design System

## Color System (OKLCH)

### Backgrounds
```css
--color-bg-primary: oklch(0.15 0.02 240);      /* Основной фон */
--color-bg-secondary: oklch(0.18 0.025 240);   /* Карточки, поверхности */
--color-bg-tertiary: oklch(0.22 0.03 240);     /* Hover states */
```

### Text
```css
--color-text-primary: oklch(0.95 0.01 240);    /* Основной текст */
--color-text-secondary: oklch(0.75 0.015 240); /* Вторичный текст */
--color-text-muted: oklch(0.55 0.02 240);      /* Приглушённый */
```

### Accents
```css
--color-accent: oklch(0.75 0.15 85);           /* Золото (основной) */
--color-accent-hover: oklch(0.8 0.18 85);      /* Hover */
--color-accent-active: oklch(0.7 0.12 85);     /* Active */

--color-success: oklch(0.7 0.15 160);          /* Правильный ответ */
--color-error: oklch(0.65 0.2 25);             /* Ошибка */
--color-warning: oklch(0.8 0.15 75);           /* Предупреждение */
```

### Contrast requirements
- Body text: ≥4.5:1 against background
- Large text (≥18px or bold ≥14px): ≥3:1
- Placeholder text: ≥4.5:1 (не muted gray!)

## Typography Scale

### Display (H1)
```css
font-size: clamp(2rem, 5vw, 3.5rem);
line-height: 1.05;
letter-spacing: -0.02em;
font-weight: 700;
```

### Heading (H2-H3)
```css
font-size: clamp(1.5rem, 3vw, 2rem);
line-height: 1.1;
letter-spacing: -0.01em;
font-weight: 600;
```

### Body
```css
font-size: 1rem;
line-height: 1.6;
letter-spacing: 0;
max-width: 65ch;
```

### Small
```css
font-size: 0.875rem;
line-height: 1.5;
letter-spacing: 0.01em;
```

### Caption
```css
font-size: 0.75rem;
line-height: 1.4;
letter-spacing: 0.02em;
text-transform: uppercase;
```

### Font family
```css
--font-sans: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

## Layout System

### Spacing
- Section padding: py-12 (48px)
- Page padding: px-6 md:px-12 lg:px-24
- Component gap: gap-4 (16px) to gap-8 (32px)

### Grid
- Asymmetric: grid-cols-1 lg:grid-cols-3 (2fr 1fr 1fr)
- Symmetric: grid-cols-1 md:grid-cols-2

### Max width
- Content: max-w-4xl (896px)
- Wide: max-w-7xl (1280px)

## Component Patterns

### Buttons
```tsx
// Primary
<button className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-bg-primary font-semibold rounded-lg text-body">

// Secondary
<button className="px-6 py-3 bg-bg-secondary text-text-secondary rounded-lg hover:bg-bg-tertiary transition-colors">

// Ghost
<button className="w-12 h-12 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-tertiary">
```

### Cards
```tsx
<div className="bg-bg-secondary rounded-xl p-8">
  {/* Content */}
</div>
```

### Lists
```tsx
<div className="space-y-0">
  {items.map((item, i) => (
    <div className="border-b border-bg-tertiary py-6">
      {/* Item */}
    </div>
  ))}
</div>
```

### Progress
```tsx
<div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
  <motion.div
    animate={{ width: `${percent}%` }}
    className="h-full bg-accent rounded-full"
  />
</div>
```

## Motion System

### Springs
```js
{ type: 'spring', damping: 1.0, stiffness: 100 }
```

### Hover
```js
whileHover={{ y: -2 }}
```

### Press
```js
whileTap={{ scale: 0.97 }}
```

### Page transition
```js
transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
```

### Stagger
```js
transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
```

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Screen-specific patterns

### WelcomeScreen
- Asymmetric layout (content left, character right)
- Only 1 eyebrow per page
- Headline max 2 lines
- Subtext max 20 words
- Single CTA

### MenuScreen
- Asymmetric grid (2+1+1)
- Progress bar without card
- Hover effects (y: -2)

### LessonListScreen
- List layout with dividers
- Status indicators (success/accent/muted)
- Hover effects (x: 4)

### LessonScreen
- Springs for all transitions
- No cards - bg-secondary with rounded-xl
- Clear hierarchy (eyebrow → content → translation)
- Feedback on press (scale 0.97)

### RulesScreen & ReferenceScreen
- List layout instead of accordion cards
- Expandable sections
- Clear visual hierarchy

## Accessibility

### Contrast
- All text ≥4.5:1 against background
- Large text ≥3:1
- Focus rings: 2px solid accent

### Keyboard
- All interactive elements focusable
- Tab order logical
- Escape closes modals

### Screen readers
- ARIA labels on icons
- Semantic HTML (header, main, section)
- Alt text on images

### Reduced motion
- All animations respect prefers-reduced-motion
- Cross-fade instead of slide
- No infinite loops

## Images & Assets

### Characters
- Size: 48-80px in UI, 320px in hero
- Format: PNG with transparency
- Location: /public/characters/

### Icons
- Use emoji for simplicity (, 📐, )
- Or install @phosphor-icons/react

## Performance

### Bundle size
- JS: <1.1 MB (262 KB gzip)
- CSS: <25 KB (5.4 KB gzip)

### Images
- Lazy load characters
- Use WebP if possible
- CDN for production

### Code splitting
- Lazy load routes
- Dynamic imports for heavy components

## Testing

### Visual
- Check in Chrome, Safari, Firefox
- Test on mobile (320px+)
- Test dark mode (if implemented)

### Accessibility
- Lighthouse accessibility score ≥95
- Keyboard navigation works
- Screen reader compatible

### Performance
- Lighthouse performance score ≥95
- LCP <2.5s
- INP <200ms
- CLS <0.1

## Deployment checklist

- [ ] TypeScript compiles without errors
- [ ] Build successful
- [ ] Dev server works
- [ ] All 6 screens present
- [ ] OKLCH colors applied
- [ ] Springs animations working
- [ ] Reduced motion support
- [ ] Contrast ≥4.5:1
- [ ] Voice working
- [ ] Sound effects working
- [ ] PWA ready
- [ ] Responsive
- [ ] Accessible

## Version history

- v1.0: Initial Java app
- v2.0: React rewrite
- v3.0: daisyUI integration
- v4.0: Color fixes
- v5.0: Premium design (OKLCH, springs, asymmetric)
