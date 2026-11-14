import { useEffect, useState } from 'react';
import type { DataCategory, MemberDay, UrineTest } from '../types';
import { PROFILES, ROLE_LABEL, memberById } from '../data/crew';
import type { BaselineKey } from '../engine/baseline';
import { SYSTEM_LABEL } from '../engine/guidance';
import { forecasts } from '../engine/forecast';
import { T, radiationFollowUp } from '../engine/rules';
import { ALL_CATEGORIES } from '../engine/privacy';
import { useStore } from '../store';
import { FindingList } from '../components/FindingCard';
import { PageHeader, Panel, Private, StatusPill, TrendArrow, TrendChart } from '../components/ui';

interface Metric {
  key: string;
  label: string;
  unit: string;
  category: DataCategory;
  get: (d: MemberDay) => number;
  baseline?: BaselineKey;
}

const METRICS: Metric[] = [
  { key: 'restingHR', label: 'Resting heart rate', unit: 'bpm', category: 'vitals', get: (d) => d.vitals.restingHR, baseline: 'restingHR' },
  { key: 'hrv', label: 'Heart-rate variability', unit: 'ms', category: 'vitals', get: (d) => d.vitals.hrv, baseline: 'hrv' },
  { key: 'systolicBP', label: 'Systolic blood pressure', unit: 'mmHg', category: 'vitals', get: (d) => d.vitals.systolicBP, baseline: 'systolicBP' },
  { key: 'diastolicBP', label: 'Diastolic blood pressure', unit: 'mmHg', category: 'vitals', get: (d) => d.vitals.diastolicBP, baseline: 'diastolicBP' },
  { key: 'skinTemp', label: 'Skin temperature', unit: '°C', category: 'vitals', get: (d) => d.vitals.skinTemp, baseline: 'skinTemp' },
  { key: 'sleepHours', label: 'Sleep', unit: 'h', category: 'vitals', get: (d) => d.vitals.sleepHours, baseline: 'sleepHours' },
  { key: 'personalDose', label: 'Personal radiation dose', unit: 'mSv', category: 'vitals', get: (d) => d.vitals.personalDoseMSv },
  { key: 'exerciseMin', label: 'Exercise', unit: 'min', category: 'vitals', get: (d) => d.vitals.exerciseMin },
  { key: 'leukocytes', label: 'Leukocytes', unit: '×10⁹/L', category: 'blood', get: (d) => d.blood.leukocytes, baseline: 'leukocytes' },
  { key: 'lymphocytes', label: 'Lymphocytes', unit: '×10⁹/L', category: 'blood', get: (d) => d.blood.lymphocytes, baseline: 'lymphocytes' },
  { key: 'eosinophils', label: 'Eosinophils', unit: '×10⁹/L', category: 'blood', get: (d) => d.blood.eosinophils },
  { key: 'basophils', label: 'Basophils', unit: '×10⁹/L', category: 'blood', get: (d) => d.blood.basophils },
  { key: 'iron', label: 'Iron', unit: 'µg/dL', category: 'blood', get: (d) => d.blood.iron, baseline: 'iron' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'ng/mL', category: 'blood', get: (d) => d.blood.vitaminD, baseline: 'vitaminD' },
  { key: 'cortisol', label: 'Cortisol (hormone)', unit: 'µg/dL', category: 'blood', get: (d) => d.blood.cortisol, baseline: 'cortisol' },
  { key: 'meanMs', label: 'Reaction time', unit: 'ms', category: 'reaction', get: (d) => d.reaction.meanMs, baseline: 'meanMs' },
  { key: 'mood', label: 'Mood (1–5)', unit: '', category: 'checkInAnswers', get: (d) => d.checkIn.mood },
  { key: 'stress', label: 'Stress (1–5)', unit: '', category: 'checkInAnswers', get: (d) => d.checkIn.stress },
  { key: 'connection', label: 'Connection (1–5)', unit: '', category: 'checkInAnswers', get: (d) => d.checkIn.connection },
];

type UrineForm = Omit<UrineTest, 'day'>;

const DEFAULT_URINE_FORM: UrineForm = {
  color: 'pale yellow',
  clarity: 'clear',
  specificGravity: 1.015,
  ph: 6,
  protein: 'negative',
  nitrites: 'negative',
};

export function MemberDetail({ memberId }: { memberId: string }) {
  const { viewer, can, assess, history, baselines, logAccess, data, day, urineTests, saveUrineTest } = useStore();
  const member = memberById(memberId);
  const isSelf = viewer.id === memberId;
  const allowed = can(memberId, 'vitals');
  const [metric, setMetric] = useState('restingHR');
  const [showUrineForm, setShowUrineForm] = useState(false);
  const [urineForm, setUrineForm] = useState<UrineForm>(DEFAULT_URINE_FORM);
  const [urineError, setUrineError] = useState('');

  // Record that the medical officer opened this person's data (shown to them in "My privacy").
  const visibleCats = ALL_CATEGORIES.filter((c) => c !== 'environment' && can(memberId, c)).join(',');
  useEffect(() => {
    if (!isSelf && allowed) logAccess(memberId, visibleCats.split(',') as DataCategory[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, day, isSelf, allowed, visibleCats]);

  if (!allowed) {
    return <p className="empty">You don’t have access to {member.name}’s health data.</p>;
  }

  const systems = assess(memberId);
  const days = history(memberId);
  const b = baselines(memberId);
  const metrics = METRICS.filter((m) => can(memberId, m.category));
  const current = metrics.find((m) => m.key === metric) ?? metrics[0];
  const band = current.baseline
    ? { lo: b[current.baseline].mean - 2 * b[current.baseline].sd, hi: b[current.baseline].mean + 2 * b[current.baseline].sd, mid: b[current.baseline].mean }
    : undefined;
  const findings = systems.flatMap((s) => s.findings).sort((a, x) => (a.severity === x.severity ? 0 : a.severity === 'red' ? -1 : 1));
  const followUps = data.followUps.filter((f) => f.memberId === memberId);
  const answersShared = can(memberId, 'checkInAnswers');
  const early = forecasts(days, b);
  const urineRecords = urineTests(memberId);
  const latestUrine = urineRecords.filter((test) => test.day <= day).at(-1);
  const canRecordUrine = can(memberId, 'urine');
  const profile = PROFILES[memberId];
  const careerDose = profile.priorCareerDoseMSv + days.reduce((sum, d) => sum + d.vitals.personalDoseMSv, 0);
  const careerShare = careerDose / T.careerLimit;
  const followUp = radiationFollowUp(days);
  const lymNow = days.at(-1)!.blood.lymphocytes;
  const lymLow = lymNow < b.lymphocytes.mean - 2 * b.lymphocytes.sd;
  const daysToReturn = profile.returnDay - day;
  const nextMonthlyLab = Math.ceil(day / 30) * 30; // urine and stool exam every 30 days

  return (
    <>
      <PageHeader eyebrow={`${ROLE_LABEL[member.role]} · ${member.sex}`} title={member.name}>
        {!isSelf && !answersShared && <Private>Check-in answers not shared</Private>}
      </PageHeader>

      <div className="systems">
        {systems.map((s) => (
          <div key={s.system} className={`system system-${s.status}`}>
            <span className="system-name">{SYSTEM_LABEL[s.system]}</span>
            <span className="system-status">
              <StatusPill status={s.status} urgent={s.urgent} /> <TrendArrow trend={s.trend} />
            </span>
          </div>
        ))}
      </div>

      <div className="two-col">
        <Panel
          title="Trends"
          aside={
            <select aria-label="Metric" value={current.key} onChange={(e) => setMetric(e.target.value)}>
              {metrics.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          }
        >
          <TrendChart data={days.map((d) => ({ day: d.day, value: current.get(d) }))} band={band} unit={current.unit} />
          <p className="muted small">{band ? 'Shaded band: this person’s normal range, learned in the first 7 days.' : 'No personal baseline for this measure.'}</p>
        </Panel>

        <Panel title="Medical profile">
          <dl className="profile">
            <dt>Age · sex</dt>
            <dd>{profile.age} · {member.sex}</dd>
            <dt>Blood type</dt>
            <dd>{profile.bloodType}</dd>
            <dt>Allergies</dt>
            <dd>{profile.allergies.length ? profile.allergies.join(', ') : 'None known'}</dd>
            <dt>Conditions</dt>
            <dd>{profile.conditions.length ? profile.conditions.join(', ') : 'None'}</dd>
            <dt>Medications</dt>
            <dd>{profile.medications.join(', ') || 'None'}</dd>
            <dt>Previous flights</dt>
            <dd>{profile.previousFlights}</dd>
            <dt>Return to Earth</dt>
            <dd>Day {profile.returnDay}{daysToReturn >= 0 ? ` (in ${daysToReturn} days)` : ''}</dd>
          </dl>

          <div className="profile-block">
            <span className="label">Radiation absorbed (personal dosimeter)</span>
            <span className="value-line">
              {careerDose.toFixed(0)} <small>of {T.careerLimit} mSv career limit</small>
            </span>
            <div className="meter">
              <span style={{ width: `${Math.min(100, careerShare * 100)}%` }} className={careerShare >= T.careerRed ? 'crit' : careerShare >= T.careerYellow ? 'warn' : ''} />
            </div>
            <span className="muted small">
              {profile.priorCareerDoseMSv} mSv from earlier missions + {(careerDose - profile.priorCareerDoseMSv).toFixed(1)} mSv this mission
            </span>
          </div>

          {followUp && (
            <div className={`profile-block followup${lymLow ? ' warn' : ''}`}>
              <span className="label">Radiation blood follow-up until day {followUp.until}</span>
              <span>
                {followUp.dose.toFixed(1)} mSv absorbed on day {followUp.day}. Lymphocytes today {lymNow.toFixed(2)} ×10⁹/L:{' '}
                <strong>{lymLow ? 'below normal' : 'within normal range'}</strong>.
              </span>
            </div>
          )}

        </Panel>
      </div>

      <div className="two-col">
        <Panel title="Early warning (next 7 days)">
          {early.length === 0 ? (
            <p className="muted">No measure is heading out of the normal range.</p>
          ) : (
            <ul className="forecast">
              {early.map((f) => (
                <li key={f.key}>
                  <strong>{f.label}</strong> is {f.direction} and may leave the normal range in{' '}
                  <strong>{f.daysToLeave} day{f.daysToLeave > 1 ? 's' : ''}</strong>{' '}
                  <span className="muted small">(projected {+f.projected.toFixed(2)} {f.unit})</span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small">Trend model on the last 7 days against this person’s own normal.</p>
        </Panel>
        <Panel title="Lab schedule">
          <ul className="notes">
            <li>Blood panel by finger-prick: daily (iron, leukocytes, lymphocytes, eosinophils, basophils, vitamin D, cortisol).</li>
            <li>Urine and stool exam: monthly. Next on mission day {nextMonthlyLab === day ? `${day} (today)` : nextMonthlyLab}.</li>
          </ul>
          {latestUrine ? (
            <div className="table-wrap">
              <table className="urine-table">
                <caption>Latest urine test · day {latestUrine.day}</caption>
                <thead>
                  <tr><th>Parameter</th><th>Value</th><th>Normal range</th></tr>
                </thead>
                <tbody>
                  <tr><td>Color</td><td>{latestUrine.color}</td><td>Pale yellow</td></tr>
                  <tr><td>Clarity</td><td>{latestUrine.clarity}</td><td>Clear</td></tr>
                  <tr><td>Specific gravity</td><td>{latestUrine.specificGravity.toFixed(3)}</td><td>1.005–1.030</td></tr>
                  <tr><td>pH</td><td>{latestUrine.ph.toFixed(1)}</td><td>5.0–7.5</td></tr>
                  <tr><td>Protein</td><td>{latestUrine.protein}</td><td>Negative</td></tr>
                  <tr><td>Nitrites</td><td>{latestUrine.nitrites}</td><td>Negative</td></tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">No urine test recorded yet.</p>
          )}
          {canRecordUrine && (
            <>
              <button type="button" className="btn-ghost" onClick={() => { setShowUrineForm((shown) => !shown); setUrineError(''); }}>
                {showUrineForm ? 'Cancel' : 'Record urine test'}
              </button>
              {showUrineForm && (
                <form
                  className="urine-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!Number.isFinite(urineForm.specificGravity) || !Number.isFinite(urineForm.ph)) {
                      setUrineError('Specific gravity and pH must be valid numbers.');
                      return;
                    }
                    saveUrineTest(memberId, { ...urineForm, day });
                    setShowUrineForm(false);
                    setUrineError('');
                  }}
                >
                  <label>Color
                    <select value={urineForm.color} onChange={(event) => setUrineForm({ ...urineForm, color: event.target.value as UrineForm['color'] })}>
                      <option>clear</option><option>pale yellow</option><option>dark yellow</option><option>red/pink</option><option>brown</option>
                    </select>
                  </label>
                  <label>Clarity
                    <select value={urineForm.clarity} onChange={(event) => setUrineForm({ ...urineForm, clarity: event.target.value as UrineForm['clarity'] })}>
                      <option>clear</option><option>cloudy</option><option>milky</option>
                    </select>
                  </label>
                  <label>Specific gravity
                    <input type="number" step="0.001" value={urineForm.specificGravity} onChange={(event) => setUrineForm({ ...urineForm, specificGravity: Number(event.target.value) })} />
                  </label>
                  <label>pH
                    <input type="number" step="0.1" value={urineForm.ph} onChange={(event) => setUrineForm({ ...urineForm, ph: Number(event.target.value) })} />
                  </label>
                  <label>Protein
                    <select value={urineForm.protein} onChange={(event) => setUrineForm({ ...urineForm, protein: event.target.value as UrineForm['protein'] })}>
                      <option>negative</option><option>trace</option><option>1+</option><option>2+</option><option>3+</option>
                    </select>
                  </label>
                  <label>Nitrites
                    <select value={urineForm.nitrites} onChange={(event) => setUrineForm({ ...urineForm, nitrites: event.target.value as UrineForm['nitrites'] })}>
                      <option>negative</option><option>positive</option>
                    </select>
                  </label>
                  <button type="submit" className="btn">Save urine test</button>
                  {urineError && <p className="error">{urineError}</p>}
                </form>
              )}
            </>
          )}
          <p className="muted small">Panel and schedule defined with the team’s consulting physician.</p>
        </Panel>
      </div>

      <Panel title="Findings">
        {findings.length === 0 ? (
          <p className="muted">Everything is within this person’s normal range.</p>
        ) : (
          <FindingList findings={findings} />
        )}
      </Panel>

      {followUps.length > 0 && (
        <Panel title="Follow-ups">
          <ul className="followups">
            {followUps.map((f) => (
              <li key={f.id}>
                <span className={`tag tag-${f.status}`}>{f.status === 'done' ? 'Done' : 'Pending'}</span>
                {f.text} <span className="muted small">· assigned day {f.createdDay}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
