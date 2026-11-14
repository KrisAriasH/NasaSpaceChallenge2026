import { useEffect, useState } from 'react';
import type { DataCategory, MemberDay } from '../types';
import { ROLE_LABEL, memberById } from '../data/crew';
import type { BaselineKey } from '../engine/baseline';
import { SEX_NOTES, SYSTEM_LABEL } from '../engine/guidance';
import { forecasts } from '../engine/forecast';
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
  { key: 'skinTemp', label: 'Skin temperature', unit: '°C', category: 'vitals', get: (d) => d.vitals.skinTemp, baseline: 'skinTemp' },
  { key: 'sleepHours', label: 'Sleep', unit: 'h', category: 'vitals', get: (d) => d.vitals.sleepHours, baseline: 'sleepHours' },
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

export function MemberDetail({ memberId }: { memberId: string }) {
  const { viewer, can, assess, history, baselines, logAccess, data, day } = useStore();
  const member = memberById(memberId);
  const isSelf = viewer.id === memberId;
  const allowed = can(memberId, 'vitals');
  const [metric, setMetric] = useState('restingHR');

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
              <StatusPill status={s.status} /> <TrendArrow trend={s.trend} />
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

        <Panel title="Sex-specific notes">
          <ul className="notes">
            {SEX_NOTES[member.sex].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="muted small">
            Evidence from NASA/NSBRI working groups (2014). No sex differences were found in behavioral health, bone or immune responses, so
            those rules are the same for everyone.
          </p>
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
