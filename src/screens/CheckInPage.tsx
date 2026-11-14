import { useEffect, useState } from 'react';
import type { CheckIn, VisionResult } from '../types';
import { useStore } from '../store';
import { ReactionTest } from '../components/ReactionTest';
import { AmslerTest } from '../components/AmslerTest';
import { VisionAcuityTest } from '../components/VisionAcuityTest';
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
  const { viewer, history, saveCheckIn, saveReaction, saveVisionResult, day, data, go, environment } = useStore();
  const today = history(viewer.id).at(-1)!;
  const [form, setForm] = useState<CheckIn>(today.checkIn);
  const [saved, setSaved] = useState(false);
  const [rtSaved, setRtSaved] = useState(false);
  const [farAcuity, setFarAcuity] = useState<number>();
  const [nearAcuity, setNearAcuity] = useState<number>();
  const [amslerMarks, setAmslerMarks] = useState<VisionResult['amslerMarks']>();
  const [visionSaved, setVisionSaved] = useState(false);
  const shared = data.sharing[viewer.id]?.checkInAnswersToCmo;
  const symptoms = environment.dust ? [...SYMPTOMS, 'cough', 'eye irritation'] : SYMPTOMS;
  const weekStart = Math.floor((day - 1) / 7) * 7 + 1;
  const weekDays = Array.from({ length: 7 }, (_, index) => weekStart + index).filter((d) => d <= 30);
  const countInWeek = (values: number[]) => values.filter((d) => weekDays.includes(d)).length;
  const visionDue = day % 7 === 0 && !data.visionResults?.[viewer.id]?.[day];
  const recordVision = () => {
    if (farAcuity === undefined || nearAcuity === undefined || amslerMarks === undefined || visionSaved) return;
    saveVisionResult(viewer.id, { day, acuityStep: Math.min(farAcuity, nearAcuity), amslerMarks });
    setVisionSaved(true);
  };

  useEffect(() => {
    setForm(today.checkIn);
    setSaved(false);
    setRtSaved(false);
    setFarAcuity(undefined);
    setNearAcuity(undefined);
    setAmslerMarks(undefined);
    setVisionSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, viewer.id]);

  const toggle = (s: string) =>
    setForm((f) => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s] }));

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Daily check-in">
        {shared ? <span className="muted small">Your answers are shared with your medical officer</span> : <Private>Answers private</Private>}
      </PageHeader>
      {visionDue && (
        <Panel title="Today's tasks">
          <p>Vision self-tests are due today.</p>
        </Panel>
      )}
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
      <Panel title="Vision self-tests">
        <p className="muted small">For tracking changes over time, not a diagnosis.</p>
        <div className="two-col">
          <VisionAcuityTest label="Distance vision" onComplete={setFarAcuity} />
          <VisionAcuityTest label="Near vision" instruction="Hold the screen at reading distance." onComplete={setNearAcuity} />
        </div>
        <AmslerTest onComplete={setAmslerMarks} />
        <div className="row">
          <button type="button" className="btn" disabled={farAcuity === undefined || nearAcuity === undefined || amslerMarks === undefined || visionSaved} onClick={recordVision}>
            {visionSaved ? 'Vision result saved' : 'Save vision result'}
          </button>
          {visionSaved && <span className="muted small">Saved for day {day}.</span>}
        </div>
      </Panel>
      <Panel title="Weekly record">
        <p className="muted">
          This week: {countInWeek(Object.keys(data.checkIns[viewer.id] ?? {}).map(Number))} of 7 check-ins,{' '}
          {countInWeek(Object.keys(data.reactions[viewer.id] ?? {}).map(Number))} of 7 reaction tests,{' '}
          {countInWeek(Object.keys(data.visionResults?.[viewer.id] ?? {}).map(Number))} of 1 vision test.
        </p>
        <p className="muted small">Vision tests are scheduled weekly.</p>
      </Panel>
    </>
  );
}
