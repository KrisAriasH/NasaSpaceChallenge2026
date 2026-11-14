import { useEffect, useState } from 'react';
import type { CheckIn } from '../types';
import { useStore } from '../store';
import { ReactionTest } from '../components/ReactionTest';
import { PageHeader, Panel, Private } from '../components/ui';

const SYMPTOMS = [
  'headache',
  'congestion',
  'nausea',
  'back pain',
  'blurred vision',
  'urinary discomfort',
  'dizziness',
  'sore throat',
  'cramps',
  'hair loss',
  'nail weakness',
  'chest pain',
  'constipation',
  'tooth weakness or pain',
  'shortness of breath',
];

const SCALES: { key: keyof Omit<CheckIn, 'symptoms'>; label: string; low: string; high: string }[] = [
  { key: 'mood', label: 'Mood', low: 'Very low', high: 'Very good' },
  { key: 'energy', label: 'Energy', low: 'Exhausted', high: 'Full of energy' },
  { key: 'stress', label: 'Stress', low: 'Calm', high: 'Very stressed' },
  { key: 'connection', label: 'Connection with crew and family', low: 'Isolated', high: 'Well connected' },
];

export function CheckInPage() {
  const { viewer, history, saveCheckIn, saveReaction, day, data, go, environment } = useStore();
  const today = history(viewer.id).at(-1)!;
  const [form, setForm] = useState<CheckIn>(today.checkIn);
  const [saved, setSaved] = useState(false);
  const [rtSaved, setRtSaved] = useState(false);
  const shared = data.sharing[viewer.id]?.checkInAnswersToCmo;
  const symptoms = environment.dust ? [...SYMPTOMS, 'cough', 'eye irritation'] : SYMPTOMS;

  useEffect(() => {
    setForm(today.checkIn);
    setSaved(false);
    setRtSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, viewer.id]);

  const toggle = (s: string) =>
    setForm((f) => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s] }));

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Daily check-in">
        {shared ? <span className="muted small">Your answers are shared with your medical officer</span> : <Private>Answers private</Private>}
      </PageHeader>
      <div className="two-col">
        <Panel title="How are you today? (30 seconds)">
          <form
            className="checkin"
            onSubmit={(e) => {
              e.preventDefault();
              saveCheckIn(viewer.id, form);
              setSaved(true);
            }}
          >
            {SCALES.map((s) => (
              <fieldset key={s.key} className="scale">
                <legend>{s.label}</legend>
                <div className="scale-row">
                  <span className="muted small">{s.low}</span>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <label key={v} className={form[s.key] === v ? 'dot on' : 'dot'}>
                      <input type="radio" name={s.key} value={v} checked={form[s.key] === v} onChange={() => setForm({ ...form, [s.key]: v })} />
                      <span>{v}</span>
                    </label>
                  ))}
                  <span className="muted small">{s.high}</span>
                </div>
              </fieldset>
            ))}
            <fieldset>
              <legend>Symptoms</legend>
              <div className="chips">
                {symptoms.map((s) => (
                  <button type="button" key={s} aria-pressed={form.symptoms.includes(s)} className={form.symptoms.includes(s) ? 'chip on' : 'chip'} onClick={() => toggle(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="row">
              <button type="submit" className="btn">Save check-in</button>
              {saved && <span className="muted small">Saved for day {day}.</span>}
            </div>
            <p className="muted small">
              Your medical officer sees only your mental health status unless you share your answers.{' '}
              <button type="button" className="link" onClick={() => go('privacy')}>Manage sharing</button>
            </p>
          </form>
        </Panel>
        <Panel title="Reaction test">
          <p className="muted small">An objective measure of fatigue. Your medical officer can see the result.</p>
          <ReactionTest
            onResult={(r) => {
              saveReaction(viewer.id, r);
              setRtSaved(true);
            }}
          />
          {rtSaved && <p className="muted small">Result saved for day {day}.</p>}
        </Panel>
      </div>
    </>
  );
}
