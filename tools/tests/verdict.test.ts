import { test, ok, report } from './harness';
import { isCorrect } from '../../src/utils/verdict';
import type { Task } from '../../src/types';

const choice: Task = { kind: 'choice', kz: '', ru: '', options: ['таулы', 'сары'], answers: ['сары'] };
const multi: Task = {
  kind: 'multi', kz: '', ru: '',
  options: ['өнерлі', 'үлкен', 'жазғы', 'биік', 'тұзды'],
  answers: ['үлкен', 'биік'],
};

test('один верный вариант засчитывается', () => {
  ok(isCorrect(choice, ['сары']));
  ok(!isCorrect(choice, ['таулы']));
});

test('все верные варианты — в любом порядке', () => {
  ok(isCorrect(multi, ['биік', 'үлкен']));
});

test('пропущенный верный вариант — ошибка', () => {
  ok(!isCorrect(multi, ['үлкен']));
});

test('лишний отмеченный вариант — ошибка', () => {
  ok(!isCorrect(multi, ['үлкен', 'биік', 'тұзды']));
});

test('отметить всё подряд нельзя', () => {
  ok(!isCorrect(multi, multi.options));
});

test('двойное нажатие не считается вторым ответом', () => {
  ok(isCorrect(choice, ['сары', 'сары']));
});

report();
