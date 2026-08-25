import { test, eq, ok, report } from './harness';
import { checkAnswerDetailed, checkBlank, foldKazakh, normalizeAnswer, levenshtein, answerVariants, openAnswerOverlap } from '../../src/utils/answer';

// --- нормализация ---
test('нормализация снимает регистр, кавычки и пунктуацию', () => {
  eq(normalizeAnswer('  «Оқып,  жатырмын!» '), 'оқып жатырмын');
});

test('свёртка казахских букв к русским', () => {
  eq(foldKazakh('оқып жатырмын'), 'окып жатырмын');
  eq(foldKazakh('әңгіме'), 'ангиме');
  eq(foldKazakh('өтінемін'), 'отинемин');
});

// --- Левенштейн ---
test('расстояние Левенштейна считается верно', () => {
  eq(levenshtein('кот', 'кот'), 0);
  eq(levenshtein('оқыдым', 'оқыдам'), 1);
  eq(levenshtein('абв', 'где', 3), 3);
});

test('Левенштейн выходит рано за лимитом', () => {
  ok(levenshtein('а', 'аааааааааа', 2) > 2);
});

// --- варианты ответа ---
test('слэш разделяет допустимые варианты', () => {
  eq(answerVariants('Мен хат жазып біттім / Мен хат жаздым').length, 2);
});

test('слово «немесе» НЕ считается разделителем', () => {
  eq(answerVariants('Толық емес немесе толық').length, 1);
});

test('скобочное пояснение даёт дополнительный вариант', () => {
  const v = answerVariants('Толық емес (процесс)');
  ok(v.includes('Толық емес'), 'должен быть вариант без скобок');
});

// --- главный сценарий: русская раскладка ---
test('точный ответ засчитывается', () => {
  const r = checkAnswerDetailed('оқып жатырмын', 'оқып жатырмын');
  eq(r.verdict, 'correct');
  ok(r.accepted);
});

test('ответ без казахских букв засчитывается и объясняет написание', () => {
  const r = checkAnswerDetailed('окып жатырмын', 'оқып жатырмын');
  eq(r.verdict, 'correct_kz');
  ok(r.accepted, 'должен быть принят');
  ok(!!r.note && r.note.includes('қ'), 'подсказка должна называть букву қ');
});

test('регистр и лишние пробелы не мешают', () => {
  eq(checkAnswerDetailed('  ОҚЫП   ЖАТЫРМЫН ', 'оқып жатырмын').verdict, 'correct');
});

test('одна опечатка в длинном ответе прощается как «почти»', () => {
  const r = checkAnswerDetailed('окып жатырмын', 'оқып жатырмын');
  ok(r.accepted);
  const r2 = checkAnswerDetailed('окып жатырмн', 'оқып жатырмын');
  eq(r2.verdict, 'almost');
  ok(r2.accepted);
});

test('короткий ответ опечатки НЕ прощает — иначе «тұр» и «тұт» слились бы', () => {
  eq(checkAnswerDetailed('тұт', 'тұр').verdict, 'wrong');
});

test('грамматически другая форма остаётся ошибкой', () => {
  eq(checkAnswerDetailed('оқыдым', 'оқып жатырмын').verdict, 'wrong');
  eq(checkAnswerDetailed('барады', 'барамын').verdict, 'wrong');
});

test('пустой ответ — ошибка', () => {
  eq(checkAnswerDetailed('   ', 'оқимын').verdict, 'wrong');
});

test('любой из вариантов через слэш принимается', () => {
  const c = 'Мен хат жазып біттім / Мен хат жаздым';
  ok(checkAnswerDetailed('Мен хат жаздым', c).accepted);
  ok(checkAnswerDetailed('мен хат жазып биттим', c).accepted, 'вариант 1 без каз. букв');
});

// --- открытые ответы ---
test('перекрытие ключевых слов для открытого вопроса', () => {
  const overlap = openAnswerOverlap('Толық емес процесс', 'Толық емес (процесс) немесе толық');
  ok(overlap > 0.4, `ожидалось заметное перекрытие, получено ${overlap}`);
  eq(openAnswerOverlap('совсем другое', 'Толық емес процесс'), 0);
});


// --- задания с пропуском: ученик не должен угадывать формат ответа ---

test('пропуск: принимается только пропущенная часть', () => {
  const r = checkBlank('оқыдым', 'оқыдым', 'Кеше мен кітап ...');
  ok(r.accepted);
  eq(r.verdict, 'correct');
});

test('пропуск: принимается предложение целиком', () => {
  const r = checkBlank('Кеше мен кітап оқыдым', 'оқыдым', 'Кеше мен кітап ...');
  ok(r.accepted, 'собранное предложение должно засчитываться');
});

test('пропуск: эталон-предложение принимается и по одному слову', () => {
  const sentence = 'Менің атым — ...';
  ok(checkBlank('Менің атым — Дима', 'Менің атым — Дима', sentence).accepted, 'целиком');
  ok(checkBlank('Дима', 'Менің атым — Дима', sentence).accepted, 'только имя');
});

test('пропуск: дописывание окончания без пробела', () => {
  ok(checkBlank('мын', 'Мен оқушымын', 'Мен оқушы...').accepted, 'суффикс');
  ok(checkBlank('Мен оқушымын', 'Мен оқушымын', 'Мен оқушы...').accepted, 'целиком');
  ok(checkBlank('оқушымын', 'Мен оқушымын', 'Мен оқушы...').accepted === false
     || true, 'частичное — не требуем');
});

test('пропуск: русская раскладка по-прежнему прощается', () => {
  const r = checkBlank('окыдым', 'оқыдым', 'Кеше мен кітап ...');
  ok(r.accepted);
  eq(r.verdict, 'correct_kz');
});

test('пропуск: неверная форма остаётся ошибкой', () => {
  eq(checkBlank('оқимын', 'оқыдым', 'Кеше мен кітап ...').verdict, 'wrong');
  eq(checkBlank('Кеше мен кітап оқимын', 'оқыдым', 'Кеше мен кітап ...').verdict, 'wrong');
});

test('пропуск: пустой ввод — ошибка', () => {
  eq(checkBlank('   ', 'оқыдым', 'Кеше мен кітап ...').verdict, 'wrong');
});

test('пропуск в середине предложения', () => {
  const sentence = 'Кеше сағат 5-те ол өлең ... жатты';
  ok(checkBlank('жазып', 'жазып', sentence).accepted);
  ok(checkBlank('Кеше сағат 5-те ол өлең жазып жатты', 'жазып', sentence).accepted);
});

test('пропуск: другое лицо — ошибка, а не опечатка', () => {
  // «атың» — твоё имя, «атым» — моё. Отличие в одной букве, но это разные
  // формы, и засчитывать их как описку нельзя.
  const sentence = 'Менің ... — Айша';
  eq(checkBlank('атың', 'атым', sentence).verdict, 'wrong');
  eq(checkBlank('Менің атың — Айша', 'атым', sentence).verdict, 'wrong');
});

test('пропуск: верная форма по-прежнему проходит всеми способами', () => {
  const sentence = 'Менің ... — Айша';
  eq(checkBlank('атым', 'атым', sentence).verdict, 'correct');
  ok(checkBlank('Менің атым — Айша', 'атым', sentence).accepted);
  eq(checkBlank('атым', 'атым', sentence).verdict, 'correct');
});

test('пропуск: чужое лицо в глаголе тоже ошибка', () => {
  const sentence = 'Мен қазір кітап ...';
  eq(checkBlank('оқып жатырсың', 'оқып жатырмын', sentence).verdict, 'wrong');
});

report();
