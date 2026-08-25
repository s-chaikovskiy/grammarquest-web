import { test, eq, report } from './harness';
import { speakerOf, speakerName, plural, pluralize, getCharacterSvgName } from '../../src/utils/helpers';

test('говорящий определяется по имени в реплике', () => {
  eq(speakerOf('Мұғалім: Бір, екі, үш.', 'DIMA'), 'teacher');
  eq(speakerOf('Айша: Сәлем!', 'DIMA'), 'girl');
  eq(speakerOf('Дима: Сәлем!', 'AISHA'), 'boy');
});

test('без имени в реплике берётся персонаж урока', () => {
  eq(speakerOf('Бүгін ауа райы жақсы.', 'AISHA'), 'girl');
  eq(speakerOf('Просто текст', 'AUTO'), 'teacher');
});

test('незнакомое имя не ломает разбор', () => {
  eq(speakerOf('Ерлан: Сәлем!', 'AISHA'), 'girl');
});

test('подпись под портретом совпадает с говорящим', () => {
  eq(speakerName('Мұғалім: Сәлем', 'DIMA'), 'Учитель');
  eq(speakerName('Айша: Сәлем', 'DIMA'), 'Айша');
});

test('персонаж урока сопоставляется с картинкой', () => {
  eq(getCharacterSvgName('AUTO'), 'teacher');
  eq(getCharacterSvgName('AISHA'), 'girl');
  eq(getCharacterSvgName('DIMA'), 'boy');
});

test('склонение числительных по-русски', () => {
  eq(plural(1, 'урок', 'урока', 'уроков'), 'урок');
  eq(plural(2, 'урок', 'урока', 'уроков'), 'урока');
  eq(plural(5, 'урок', 'урока', 'уроков'), 'уроков');
  eq(plural(11, 'урок', 'урока', 'уроков'), 'уроков');
  eq(plural(21, 'урок', 'урока', 'уроков'), 'урок');
  eq(plural(114, 'урок', 'урока', 'уроков'), 'уроков');
});

test('pluralize добавляет число к форме', () => {
  eq(pluralize(3, 'слово', 'слова', 'слов'), '3 слова');
});

report();
