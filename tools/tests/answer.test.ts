import { test, eq, ok, report } from './harness';
import { checkAnswerDetailed, foldKazakh, normalizeAnswer, levenshtein, answerVariants, openAnswerOverlap } from '../../src/utils/answer';

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

report();
