import type { MemberDay } from '../types';
import { type BaselineKey, type Baselines, valueOf } from './baseline';

/**
 * Early warning: fits a straight line to the last 7 days of each measure and estimates
 * when it will leave the person's normal range (baseline ± 2 SD).
 * Simple and explainable on purpose; a learned model (the "AI" part) can replace
 * `predict` later without changing the screens.
 */

export interface Forecast {
  key: BaselineKey;
  label: string;
  direction: 'rising' | 'falling';
  daysToLeave: number; // 1..horizon
  projected: number;
  unit: string;
}

/** `worse`: the direction that matters clinically. Changes the other way are not warned about. */
export const FORECAST_METRICS: { key: BaselineKey; label: string; unit: string; worse: 'up' | 'down' }[] = [
  { key: 'restingHR', label: 'Resting heart rate', unit: 'bpm', worse: 'up' },
  { key: 'hrv', label: 'Heart-rate variability', unit: 'ms', worse: 'down' },
  { key: 'systolicBP', label: 'Blood pressure', unit: 'mmHg', worse: 'up' },
  { key: 'diastolicBP', label: 'Diastolic blood pressure', unit: 'mmHg', worse: 'up' },
  { key: 'sleepHours', label: 'Sleep', unit: 'h', worse: 'down' },
  { key: 'meanMs', label: 'Reaction time', unit: 'ms', worse: 'up' },
  { key: 'leukocytes', label: 'Leukocytes', unit: '×10⁹/L', worse: 'up' },
  { key: 'lymphocytes', label: 'Lymphocytes', unit: '×10⁹/L', worse: 'up' },
  { key: 'iron', label: 'Iron', unit: 'µg/dL', worse: 'down' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'ng/mL', worse: 'down' },
  { key: 'cortisol', label: 'Cortisol', unit: 'µg/dL', worse: 'up' },
];

const WINDOW = 7;

function slopeIntercept(ys: number[]) {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, at: (x: number) => my + slope * (x - mx) };
}

/** Measures still inside the normal range today but heading out of it within `horizon` days. */
export function forecasts(days: MemberDay[], b: Baselines, horizon = 7): Forecast[] {
  if (days.length < WINDOW) return [];
  const out: Forecast[] = [];
  for (const m of FORECAST_METRICS) {
    const ys = days.slice(-WINDOW).map((d) => valueOf(d, m.key));
    const { slope, at } = slopeIntercept(ys);
    if ((m.worse === 'up' && slope <= 0) || (m.worse === 'down' && slope >= 0)) continue;
    const lo = b[m.key].mean - 2 * b[m.key].sd;
    const hi = b[m.key].mean + 2 * b[m.key].sd;
    const now = at(WINDOW - 1);
    if (now < lo || now > hi) continue; // already out: the rules handle it
    for (let k = 1; k <= horizon; k++) {
      const v = at(WINDOW - 1 + k);
      if ((m.worse === 'up' && v > hi) || (m.worse === 'down' && v < lo)) {
        out.push({ key: m.key, label: m.label, unit: m.unit, direction: slope > 0 ? 'rising' : 'falling', daysToLeave: k, projected: v });
        break;
      }
    }
  }
  return out.sort((a, c) => a.daysToLeave - c.daysToLeave);
}
