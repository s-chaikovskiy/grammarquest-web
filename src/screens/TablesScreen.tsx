import { useState, useMemo } from 'react';
import { declension, plural, possessive, presentTense, pastTense, isBack, lastSound } from '../utils/morphology';
import { vocabulary } from '../data';
import ScreenHeader from '../components/ScreenHeader';

type Mode = 'noun' | 'verb';

const SOUND_LABEL: Record<string, string> = {
  vowel: 'на гласную',
  nasal: 'на носовую (м, н, ң)',
  sonorant: 'на сонорную (л, р, й, у)',
  voiced: 'на звонкую',
  voiceless: 'на глухую',
};

/**
 * Живые таблицы окончаний.
 *
 * Обычная таблица в учебнике показывает одно слово-образец, и школьник
 * каждый раз гадает, как приложить её к своему слову. Здесь он вводит
 * собственное слово и сразу видит все формы с подсвеченным окончанием —
 * и подпись, почему выбрано именно оно.
 */
export default function TablesScreen() {
  const [mode, setMode] = useState<Mode>('noun');
  const [word, setWord] = useState('кітап');
  const [verb, setVerb] = useState('жаз');

  const input = mode === 'noun' ? word : verb;
  const clean = input.trim().toLowerCase();

  const rows = useMemo(() => (mode === 'noun' ? declension(clean) : []), [mode, clean]);
  const owns = useMemo(() => (mode === 'noun' ? possessive(clean) : []), [mode, clean]);
  const many = useMemo(() => (mode === 'noun' ? plural(clean) : { suffix: '', form: '' }), [mode, clean]);
  const present = useMemo(() => (mode === 'verb' ? presentTense(clean) : []), [mode, clean]);
  const past = useMemo(() => (mode === 'verb' ? pastTense(clean) : []), [mode, clean]);

  // Подсказки берём из словаря курса: это слова, которые ученик уже видел.
  const suggestions = useMemo(
    () => vocabulary.filter(w => w.kz.split(' ').length === 1 && w.kz.length > 2).slice(0, 8),
    []
  );

  return (
    <div className="stack">
      <ScreenHeader
        back={{ to: '/reference', label: 'Справка' }}
        title="Таблицы окончаний"
        subtitle="Подставь любое слово — увидишь все его формы. Окончание подсвечено, рядом сказано, почему выбрано именно оно."
      />

      <div className="tabs" role="group" aria-label="Часть речи">
        <button className={`tab${mode === 'noun' ? ' tab--active' : ''}`} onClick={() => setMode('noun')}>
          Существительное
        </button>
        <button className={`tab${mode === 'verb' ? ' tab--active' : ''}`} onClick={() => setMode('verb')}>
          Глагол
        </button>
      </div>

      <div className="stack--tight">
        <input
          type="text"
          className="field"
          value={input}
          onChange={e => (mode === 'noun' ? setWord(e.target.value) : setVerb(e.target.value))}
          placeholder={mode === 'noun' ? 'кітап, бала, мектеп…' : 'жаз, кел, оқы…'}
          aria-label={mode === 'noun' ? 'Существительное' : 'Основа глагола'}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {mode === 'verb' && (
          <p className="t-small">
            Вводи основу, а не форму на -у: <strong>жаз</strong> (не «жазу»), <strong>оқы</strong> (не «оқу»).
          </p>
        )}
        {clean && (
          <p className="t-small">
            Ряд: <strong>{isBack(clean) ? 'твёрдый' : 'мягкий'}</strong> ·
            основа заканчивается <strong>{SOUND_LABEL[lastSound(clean)]}</strong>
          </p>
        )}
      </div>

      {!clean ? (
        <p className="t-small">Введи слово, чтобы увидеть таблицу.</p>
      ) : mode === 'noun' ? (
        <>
          <FormTable title="Септіктер — падежи" caption="кім? не? — вопрос падежа">
            {rows.map(r => (
              <FormRow
                key={r.id}
                label={r.nameRu}
                sub={`${r.nameKz} · ${r.question}`}
                stem={clean}
                form={r.form}
              />
            ))}
          </FormTable>

          <FormTable title="Көптік жалғау — множественное число">
            <FormRow label="Много" sub="кімдер? нелер?" stem={clean} form={many.form} />
          </FormTable>

          <FormTable title="Тәуелдік жалғау — чьё это">
            {owns.map(p => (
              <FormRow key={p.id} label={p.pronounRu} sub={p.pronoun} stem={clean} form={p.form} />
            ))}
          </FormTable>
        </>
      ) : (
        <>
          <FormTable title="Ауыспалы осы шақ — настоящее-будущее">
            {present.map(p => (
              <FormRow key={p.id} label={p.pronounRu} sub={p.pronoun} stem={clean} form={p.form} />
            ))}
          </FormTable>

          <FormTable title="Жедел өткен шақ — прошедшее">
            {past.map(p => (
              <FormRow key={p.id} label={p.pronounRu} sub={p.pronoun} stem={clean} form={p.form} />
            ))}
          </FormTable>
        </>
      )}

      <section className="panel stack--tight">
        <h2 className="t-sub">Слова из уроков</h2>
        <div className="bank">
          {suggestions.map(w => (
            <button
              key={w.kz}
              type="button"
              className="chip"
              onClick={() => (mode === 'noun' ? setWord(w.kz) : setVerb(w.kz))}
            >
              {w.kz}
            </button>
          ))}
        </div>
      </section>

      <p className="t-small prose">
        Таблица строится по правилам сингармонизма и озвончения. В казахском
        есть исключения и заимствования, которые правилу не подчиняются, —
        если форма выглядит странно, сверься со справочником.
      </p>
    </div>
  );
}

function FormTable({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="panel stack--tight">
      <h2 className="t-sub">{title}</h2>
      {caption && <p className="t-small">{caption}</p>}
      <div className="forms">{children}</div>
    </section>
  );
}

/**
 * Строка таблицы: основа обычным начертанием, окончание — подсвечено.
 * Граница между ними определяется по совпадению с введённой основой,
 * а не по длине окончания: при озвончении «кітап» → «кітабым» основа
 * меняется, и отрезать фиксированное число букв было бы неверно.
 */
function FormRow({ label, sub, stem, form }: { label: string; sub: string; stem: string; form: string }) {
  let common = 0;
  while (common < stem.length && common < form.length && stem[common] === form[common]) common++;
  // Озвончённую согласную оставляем в основе: она часть слова, а не окончания.
  if (common === stem.length - 1 && form.length > stem.length) common += 1;

  return (
    <div className="forms__row">
      <div className="forms__label">
        <span>{label}</span>
        <span className="t-small">{sub}</span>
      </div>
      <div className="morph">
        <span className="morph__stem">{form.slice(0, common)}</span>
        {form.length > common && <span className="morph__suffix">{form.slice(common)}</span>}
      </div>
    </div>
  );
}
