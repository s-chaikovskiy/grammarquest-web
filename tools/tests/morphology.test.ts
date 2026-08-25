import { test, eq, ok, report } from './harness';
import { declension, plural, possessive, presentTense, pastTense, isBack, lastSound } from '../../src/utils/morphology';

const caseOf = (word: string, id: string) => declension(word).find(c => c.id === id)!.form;

// --- определение ряда и последнего звука ---
test('сингармонизм определяется по последней гласной', () => {
  ok(isBack('бала'), 'бала — твёрдый ряд');
  ok(!isBack('мектеп'), 'мектеп — мягкий ряд');
  ok(isBack('оқушы'));
  ok(!isBack('үй'));
});

test('класс последнего звука', () => {
  eq(lastSound('бала'), 'vowel');
  eq(lastSound('адам'), 'nasal');
  eq(lastSound('дәптер'), 'sonorant');
  eq(lastSound('қыз'), 'voiced');
  eq(lastSound('кітап'), 'voiceless');
});

// --- семь септіктер, проверка по учебниковым формам ---
test('ілік септік', () => {
  eq(caseOf('бала', 'ilik'), 'баланың');
  eq(caseOf('адам', 'ilik'), 'адамның');
  eq(caseOf('кітап', 'ilik'), 'кітаптың');
  eq(caseOf('дәптер', 'ilik'), 'дәптердің');
  eq(caseOf('қыз', 'ilik'), 'қыздың');
});

test('барыс септік', () => {
  eq(caseOf('бала', 'barys'), 'балаға');
  eq(caseOf('мектеп', 'barys'), 'мектепке');
  eq(caseOf('адам', 'barys'), 'адамға');
  eq(caseOf('үй', 'barys'), 'үйге');
});

test('табыс септік', () => {
  eq(caseOf('бала', 'tabys'), 'баланы');
  eq(caseOf('кітап', 'tabys'), 'кітапты');
  eq(caseOf('адам', 'tabys'), 'адамды');
  eq(caseOf('дәптер', 'tabys'), 'дәптерді');
});

test('жатыс септік', () => {
  eq(caseOf('қала', 'jatys'), 'қалада');
  eq(caseOf('мектеп', 'jatys'), 'мектепте');
  eq(caseOf('үй', 'jatys'), 'үйде');
});

test('шығыс септік — после носовых особая форма', () => {
  eq(caseOf('қала', 'shygys'), 'қаладан');
  eq(caseOf('мектеп', 'shygys'), 'мектептен');
  eq(caseOf('адам', 'shygys'), 'адамнан');
  eq(caseOf('үй', 'shygys'), 'үйден');
});

test('көмектес септік не подчиняется сингармонизму', () => {
  eq(caseOf('қалам', 'komektes'), 'қаламмен');
  eq(caseOf('кітап', 'komektes'), 'кітаппен');
  eq(caseOf('қыз', 'komektes'), 'қызбен');
  eq(caseOf('бала', 'komektes'), 'баламен');
});

test('атау септік — без окончания', () => {
  eq(caseOf('бала', 'atau'), 'бала');
  eq(declension('бала')[0].suffix, '');
});

test('в таблице ровно семь падежей', () => {
  eq(declension('кітап').length, 7);
});

// --- множественное число ---
test('множественное число: р, й, у ведут себя как гласные', () => {
  eq(plural('бала').form, 'балалар');
  eq(plural('дәптер').form, 'дәптерлер');
  eq(plural('тау').form, 'таулар');
});

test('множественное число: л, м, н, ң дают -дар/-дер', () => {
  eq(plural('жыл').form, 'жылдар');
  eq(plural('ел').form, 'елдер');
  eq(plural('адам').form, 'адамдар');
  eq(plural('күн').form, 'күндер');
});

test('множественное число после глухих', () => {
  eq(plural('мектеп').form, 'мектептер');
  eq(plural('кітап').form, 'кітаптар');
});

// --- притяжательные ---
test('тәуелдік жалғау: конечные қ, к, п озвончаются перед гласной', () => {
  eq(possessive('кітап').find(p => p.id === 'my')!.form, 'кітабым');
  eq(possessive('кітап').find(p => p.id === 'his')!.form, 'кітабы');
  eq(possessive('жүрек').find(p => p.id === 'my')!.form, 'жүрегім');
  eq(possessive('тарақ').find(p => p.id === 'my')!.form, 'тарағым');
  eq(possessive('сағат').find(p => p.id === 'my')!.form, 'сағатым');
});

test('тәуелдік жалғау после гласной', () => {
  const bala = possessive('бала');
  eq(bala.find(p => p.id === 'my')!.form, 'балам');
  eq(bala.find(p => p.id === 'his')!.form, 'баласы');
  eq(bala.find(p => p.id === 'our')!.form, 'баламыз');
});

// --- глагол ---
test('настоящее-будущее время', () => {
  const jaz = presentTense('жаз');
  eq(jaz.find(p => p.id === 'i')!.form, 'жазамын');
  eq(jaz.find(p => p.id === 'you')!.form, 'жазасың');
  eq(jaz.find(p => p.id === 'he')!.form, 'жазады');
  eq(jaz.find(p => p.id === 'we')!.form, 'жазамыз');
});

test('мягкий ряд в настоящем времени', () => {
  const kel = presentTense('кел');
  eq(kel.find(p => p.id === 'i')!.form, 'келемін');
  eq(kel.find(p => p.id === 'he')!.form, 'келеді');
});

test('основа на ы даёт «и»: оқы → оқимын', () => {
  const oqy = presentTense('оқы');
  eq(oqy.find(p => p.id === 'i')!.form, 'оқимын');
  eq(oqy.find(p => p.id === 'he')!.form, 'оқиды');
});

test('основа на гласную получает «й»', () => {
  eq(presentTense('ойна').find(p => p.id === 'i')!.form, 'ойнаймын');
});

test('прошедшее время: после глухих -ты/-ті', () => {
  eq(pastTense('жаз').find(p => p.id === 'i')!.form, 'жаздым');
  eq(pastTense('кел').find(p => p.id === 'i')!.form, 'келдім');
  eq(pastTense('кет').find(p => p.id === 'he')!.form, 'кетті');
  eq(pastTense('жаз').find(p => p.id === 'we')!.form, 'жаздық');
  eq(pastTense('кел').find(p => p.id === 'we')!.form, 'келдік');
});

test('пустой ввод не ломает таблицы', () => {
  eq(declension('  ').length, 0);
  eq(presentTense('').length, 0);
  eq(plural('').form, '');
});

report();
