/**
 * Учебная статистика и выгрузка для апробации.
 *
 * Приложение локально пишет, как ученик отвечал: тип задания, вердикт, время
 * на ответ. Это даёт объективные данные для исследовательской части проекта
 * (и учителю — картину класса), причём без сервера и без персональных данных:
 * всё лежит в localStorage конкретного устройства и выгружается в CSV руками.
 */
import type { Verdict } from './answer';
import { todayISO } from './srs';

export interface AnswerEvent {
  ts: number;          // отметка времени ответа
  lessonId: string;
  stepIndex: number;
  taskType: string;
  verdict: Verdict;
  msToAnswer: number;  // сколько думал над заданием
  hintsUsed: number;
}

export interface DayStats {
  date: string;
  answered: number;
  correct: number;
  accuracy: number;
  medianMs: number;
}

export const MAX_EVENTS = 3000;   // ~полгода ежедневных занятий, localStorage не переполнится

export function pushEvent(events: AnswerEvent[], e: AnswerEvent): AnswerEvent[] {
  const out = [...events, e];
  return out.length > MAX_EVENTS ? out.slice(out.length - MAX_EVENTS) : out;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const dateOf = (ts: number) => todayISO(new Date(ts));

export function byDay(events: AnswerEvent[]): DayStats[] {
  const groups = new Map<string, AnswerEvent[]>();
  for (const e of events) {
    const d = dateOf(e.ts);
    (groups.get(d) ?? groups.set(d, []).get(d)!).push(e);
  }
  return [...groups.entries()]
    .map(([date, list]) => {
      const correct = list.filter(e => e.verdict !== 'wrong').length;
      return {
        date,
        answered: list.length,
        correct,
        accuracy: list.length ? correct / list.length : 0,
        medianMs: median(list.map(e => e.msToAnswer)),
      };
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Точность в разрезе типов заданий — какой формат даётся хуже всего. */
export function byTaskType(events: AnswerEvent[]): Record<string, { answered: number; accuracy: number }> {
  const out: Record<string, { answered: number; correct: number }> = {};
  for (const e of events) {
    const b = (out[e.taskType] ??= { answered: 0, correct: 0 });
    b.answered++;
    if (e.verdict !== 'wrong') b.correct++;
  }
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, { answered: v.answered, accuracy: v.answered ? v.correct / v.answered : 0 }])
  );
}

/**
 * Доля ответов, где грамматика верна, но казахские буквы напечатаны русскими.
 * Это и есть измеримый эффект от умной проверки: столько ответов старая
 * версия зачла бы как ошибку.
 */
export function keyboardRescueRate(events: AnswerEvent[]): number {
  const graded = events.filter(e => e.verdict !== 'wrong');
  if (!graded.length) return 0;
  return graded.filter(e => e.verdict === 'correct_kz').length / graded.length;
}

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV для выгрузки в Excel: одна строка — один ответ. */
export function eventsToCsv(events: AnswerEvent[], participant = ''): string {
  const header = ['participant', 'date', 'time', 'lesson', 'step', 'task_type', 'verdict', 'ms_to_answer', 'hints'];
  const rows = events.map(e => {
    const d = new Date(e.ts);
    return [
      participant,
      dateOf(e.ts),
      d.toTimeString().slice(0, 8),
      e.lessonId,
      e.stepIndex,
      e.taskType,
      e.verdict,
      e.msToAnswer,
      e.hintsUsed,
    ];
  });
  // Разделитель «;» и BOM — чтобы Excel на Windows открыл кириллицу без плясок.
  return '﻿' + [header, ...rows].map(r => r.map(csvCell).join(';')).join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
