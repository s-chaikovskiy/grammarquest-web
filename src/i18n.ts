import { useApp } from './hooks/useApp';
import { plural } from './utils/helpers';
import type { Lang, Speaker } from './types';

/**
 * Надписи интерфейса на двух языках.
 *
 * По умолчанию всё казахское — так же, как документы учителя. Переключатель
 * «Тілді өзгерту» есть и в прошлогоднем приложении (руководство, пункт 1.2):
 * русский режим меняет кнопки и добавляет перевод под казахским текстом,
 * но сам урок остаётся казахским.
 */
const KZ = {
  appTag: 'Қазақ тілі грамматикасы',
  intro: '«Grammar» — грамматика, «Dialogue» — диалог, «Quest» — тапсырма. Айша мен мұғалім әр тақырыпты үш қадаммен түсіндіреді.',
  threeSteps: 'Әр тапсырма — үш қадам',
  flow: {
    dialogue: ['Диалог', 'Айша мен мұғалім тақырып бойынша сөйлеседі'],
    rule: ['Ереже', 'Тақырыптың ережесі'],
    task: ['Тапсырма', 'Дұрыс жауапты таңда'],
  },
  start: 'Бастау',
  continue: 'Жалғастыру',
  lessons: 'Тақырыптар',
  toLessons: 'Тақырыптар',
  toRule: 'Ережеге өту',
  toTask: 'Тапсырмаға өту',
  check: 'Тексеру',
  next: 'Келесі',
  finish: 'Аяқтау',
  correct: 'Дұрыс!',
  wrong: 'Қате',
  rightAnswer: 'Дұрыс жауап',
  pickOne: 'Бір дұрыс жауапты таңда.',
  pickAll: 'Барлық дұрыс жауапты белгіле.',
  summary: 'Тақырып аяқталды',
  score: (n: number, total: number) => `Дұрыс жауап: ${n} / ${total}`,
  again: 'Қайта өту',
  nextLesson: 'Келесі тақырып',
  leaveTitle: 'Тақырыптан шығасыз ба?',
  leaveText: 'Жауаптар сақталмайды, тақырып басынан басталады.',
  stay: 'Қалу',
  leave: 'Шығу',
  listen: 'Тыңдау',
  lang: 'Тілді өзгерту',
  home: 'Басты бет',
  notFound: 'Тақырып табылмады',
  tasks: (n: number) => `${n} тапсырма`,
  facts: (lessons: number, tasks: number) => `${lessons} тақырып · ${tasks} тапсырма`,
  names: { girl: 'Айша', teacher: 'Мұғалім' } as Record<Speaker, string>,
};

const RU: typeof KZ = {
  appTag: 'Грамматика казахского языка',
  intro: '«Grammar» — грамматика, «Dialogue» — диалог, «Quest» — задание. Айша и учитель объясняют каждую тему в три шага.',
  threeSteps: 'Каждое задание — три шага',
  flow: {
    dialogue: ['Диалог', 'Айша и учитель говорят по теме'],
    rule: ['Правило', 'Правило по теме'],
    task: ['Задание', 'Выбери правильный ответ'],
  },
  start: 'Начать',
  continue: 'Продолжить',
  lessons: 'Темы',
  toLessons: 'Темы',
  toRule: 'К правилу',
  toTask: 'К заданию',
  check: 'Проверить',
  next: 'Дальше',
  finish: 'Завершить',
  correct: 'Верно!',
  wrong: 'Неверно',
  rightAnswer: 'Правильный ответ',
  pickOne: 'Выбери один правильный ответ.',
  pickAll: 'Отметь все правильные ответы.',
  summary: 'Тема пройдена',
  score: (n, total) => `Верно: ${n} из ${total}`,
  again: 'Пройти заново',
  nextLesson: 'Следующая тема',
  leaveTitle: 'Выйти из темы?',
  leaveText: 'Ответы не сохранятся — тема начнётся сначала.',
  stay: 'Остаться',
  leave: 'Выйти',
  listen: 'Послушать',
  lang: 'Сменить язык',
  home: 'На главный',
  notFound: 'Тема не найдена',
  tasks: n => `${n} ${plural(n, 'задание', 'задания', 'заданий')}`,
  facts: (lessons, tasks) =>
    `${lessons} ${plural(lessons, 'тема', 'темы', 'тем')} · ${tasks} ${plural(tasks, 'задание', 'задания', 'заданий')}`,
  names: { girl: 'Айша', teacher: 'Учитель' },
};

export const STRINGS: Record<Lang, typeof KZ> = { kz: KZ, ru: RU };

/** Надписи на выбранном языке и признак русского режима. */
export function useStrings() {
  const { state } = useApp();
  const lang = state.settings.lang;
  return { t: STRINGS[lang], lang, ru: lang === 'ru' };
}
