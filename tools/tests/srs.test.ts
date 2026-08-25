import { test, eq, ok, report } from './harness';
import { newCard, reviewCard, dueQueue, forecast, todayISO, verdictQuality } from '../../src/utils/srs';
import { plural } from '../../src/utils/helpers';
import { byDay, byTaskType, keyboardRescueRate, eventsToCsv, pushEvent, MAX_EVENTS } from '../../src/utils/metrics';
import type { AnswerEvent } from '../../src/utils/metrics';

const NOW = new Date('2026-09-01T10:00:00Z');

test('новая карточка доступна сразу', () => {
  eq(newCard('l1', 0).due, todayISO());
  eq(newCard('l1', 0).id, 'l1:0');
});

test('вердикт переводится в оценку SM-2', () => {
  eq(verdictQuality('correct'), 5);
  eq(verdictQuality('correct_kz'), 4);
  eq(verdictQuality('almost'), 3);
  eq(verdictQuality('wrong'), 0);
});

test('интервалы растут 1 → 3 → дальше по коэффициенту', () => {
  let c = newCard('l1', 0);
  c = reviewCard(c, 'correct', NOW);
  eq(c.interval, 1);
  c = reviewCard(c, 'correct', NOW);
  eq(c.interval, 3);
  c = reviewCard(c, 'correct', NOW);
  ok(c.interval > 3, `третий интервал должен быть больше 3, получено ${c.interval}`);
});

test('ошибка возвращает карточку на сегодня и роняет лёгкость', () => {
  let c = newCard('l1', 0);
  c = reviewCard(c, 'correct', NOW);
  c = reviewCard(c, 'correct', NOW);
  const easeBefore = c.ease;
  c = reviewCard(c, 'wrong', NOW);
  eq(c.due, todayISO(NOW));
  eq(c.reps, 0);
  eq(c.lapses, 1);
  ok(c.ease < easeBefore, 'лёгкость должна упасть');
});

test('лёгкость не проваливается ниже 1.3', () => {
  let c = newCard('l1', 0);
  for (let i = 0; i < 20; i++) c = reviewCard(c, 'wrong', NOW);
  ok(c.ease >= 1.3, `ease=${c.ease}`);
});

test('интервал не превышает 180 дней', () => {
  let c = newCard('l1', 0);
  for (let i = 0; i < 30; i++) c = reviewCard(c, 'correct', NOW);
  ok(c.interval <= 180, `interval=${c.interval}`);
});

test('очередь ставит вперёд то, что забывалось чаще', () => {
  const easy = reviewCard(reviewCard(newCard('l', 1), 'wrong', NOW), 'wrong', NOW);
  const hard = { ...newCard('l', 2), lapses: 5 };
  const q = dueQueue({ [easy.id]: easy, [hard.id]: hard }, NOW);
  eq(q[0].id, hard.id);
});

test('в очередь не попадают карточки с будущей датой', () => {
  const future = reviewCard(reviewCard(newCard('l', 3), 'correct', NOW), 'correct', NOW);
  eq(dueQueue({ [future.id]: future }, NOW).length, 0);
});

test('прогноз раскладывает карточки по дням', () => {
  const c = reviewCard(newCard('l', 4), 'correct', NOW);  // +1 день
  const f = forecast({ [c.id]: c }, 7, NOW);
  eq(f[0], 0);
  eq(f[1], 1);
});

// --- метрики ---
const ev = (over: Partial<AnswerEvent> = {}): AnswerEvent => ({
  ts: NOW.getTime(), lessonId: 'l1', stepIndex: 0, taskType: 'choice',
  verdict: 'correct', msToAnswer: 4000, hintsUsed: 0, ...over,
});

test('статистика по дням считает точность', () => {
  const d = byDay([ev(), ev({ verdict: 'wrong' })]);
  eq(d.length, 1);
  eq(d[0].answered, 2);
  eq(d[0].accuracy, 0.5);
});

test('точность в разрезе типов заданий', () => {
  const s = byTaskType([ev({ taskType: 'choice' }), ev({ taskType: 'input', verdict: 'wrong' })]);
  eq(s.choice.accuracy, 1);
  eq(s.input.accuracy, 0);
});

test('доля ответов, спасённых умной проверкой раскладки', () => {
  const rate = keyboardRescueRate([ev(), ev({ verdict: 'correct_kz' }), ev({ verdict: 'wrong' })]);
  eq(rate, 0.5, 'из двух зачтённых один — без казахских букв:');
});

test('CSV экранирует разделитель и несёт BOM для Excel', () => {
  const csv = eventsToCsv([ev({ lessonId: 'a;b' })], 'ученик 1');
  ok(csv.startsWith('﻿'), 'нужен BOM');
  ok(csv.includes('"a;b"'), 'точка с запятой должна быть экранирована');
  eq(csv.trim().split('\n').length, 2);
});

test('журнал событий не растёт бесконечно', () => {
  let list: AnswerEvent[] = [];
  for (let i = 0; i < MAX_EVENTS + 50; i++) list = pushEvent(list, ev());
  eq(list.length, MAX_EVENTS);
});

test('русское склонение числительных', () => {
  eq(plural(1, 'задание', 'задания', 'заданий'), 'задание');
  eq(plural(2, 'задание', 'задания', 'заданий'), 'задания');
  eq(plural(5, 'задание', 'задания', 'заданий'), 'заданий');
  eq(plural(11, 'задание', 'задания', 'заданий'), 'заданий', '11 — исключение:');
  eq(plural(21, 'задание', 'задания', 'заданий'), 'задание');
  eq(plural(0, 'задание', 'задания', 'заданий'), 'заданий');
});

report();
