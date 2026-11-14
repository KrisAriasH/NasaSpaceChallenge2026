import { useEffect, useState } from 'react';
import type { CheckIn } from '../types';
import { useStore } from '../store';
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

const CONTACT_OPTIONS: CheckIn['contact'] = ['crew', 'family', 'nobody'];
const SCALES: { key: 'mood' | 'energy' | 'stress' | 'connection'; label: string; low: string; high: string }[] = [
  { key: 'mood', label: 'Mood', low: 'Very low', high: 'Very good' },
  { key: 'energy', label: 'Energy', low: 'Exhausted', high: 'Full of energy' },
  { key: 'stress', label: 'Stress', low: 'Calm', high: 'Very stressed' },
  { key: 'connection', label: 'Connection with crew and family', low: 'Isolated', high: 'Well connected' },
];

export function CheckInPage() {
  const { viewer, history, saveCheckIn, day, data, go, environment } = useStore();
  const today = history(viewer.id).at(-1)!;
  const [form, setForm] = useState<CheckIn>(today.checkIn);
  const [saved, setSaved] = useState(false);
  const shared = data.sharing[viewer.id]?.checkInAnswersToCmo;
  const symptoms = environment.dust ? [...SYMPTOMS, 'cough', 'eye irritation'] : SYMPTOMS;

  useEffect(() => {
    setForm(today.checkIn);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, viewer.id]);

  const toggleSymptom = (symptom: string) =>
    setForm((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));

  const toggleContact = (contact: CheckIn['contact'][number]) =>
    setForm((current) => {
      if (contact === 'nobody') return { ...current, contact: ['nobody'] };
      const next = current.contact.filter((item) => item !== 'nobody');
      return { ...current, contact: next.includes(contact) ? next.filter((item) => item !== contact) : [...next, contact] };
    });

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Check-in">
        {shared ? <span className="muted small">Check-in answers are shared with the medical officer</span> : <Private>Check-in answers private</Private>}
      </PageHeader>
      <Panel title="Daily check-in">
        <form
          className="checkin"
          onSubmit={(event) => {
            event.preventDefault();
            saveCheckIn(viewer.id, form);
            setSaved(true);
          }}
        >
          {SCALES.map((scale) => (
            <fieldset key={scale.key} className="scale">
              <legend>{scale.label}</legend>
              <div className="scale-row">
                <span className="muted small">{scale.low}</span>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className={form[scale.key] === value ? 'dot on' : 'dot'}>
                    <input type="radio" name={scale.key} value={value} checked={form[scale.key] === value} onChange={() => setForm({ ...form, [scale.key]: value })} />
                    <span>{value}</span>
                  </label>
                ))}
                <span className="muted small">{scale.high}</span>
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend>Who did you talk to today?</legend>
            <div className="chips">
              {CONTACT_OPTIONS.map((contact) => (
                <button type="button" key={contact} aria-pressed={form.contact.includes(contact)} className={form.contact.includes(contact) ? 'chip on' : 'chip'} onClick={() => toggleContact(contact)}>
                  {contact}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Work hours</span>
            <input type="number" min={0} max={16} step={1} value={form.workHours} onChange={(event) => setForm({ ...form, workHours: Number(event.target.value) })} />
          </label>
          <fieldset>
            <legend>Symptoms</legend>
            <div className="chips">
              {symptoms.map((symptom) => (
                <button type="button" key={symptom} aria-pressed={form.symptoms.includes(symptom)} className={form.symptoms.includes(symptom) ? 'chip on' : 'chip'} onClick={() => toggleSymptom(symptom)}>
                  {symptom}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Anything else worth noting</span>
            <textarea rows={3} maxLength={500} value={form.note ?? ''} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </label>
          <div className="row">
            <button type="submit" className="btn">Save check-in</button>
            {saved && <span className="muted small">Saved for day {day}.</span>}
          </div>
          <p className="muted small">
            Check-in answers are private unless shared.{' '}
            <button type="button" className="link" onClick={() => go('privacy')}>Manage privacy</button>
          </p>
        </form>
      </Panel>
    </>
  );
}
