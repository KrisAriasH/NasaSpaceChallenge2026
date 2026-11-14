import type { MemberDay } from '../types';
import { BASELINE_DAYS } from '../data/crew';

/** Metrics that are judged against each person's own normal. */
export type BaselineKey =
  | 'restingHR' | 'hrv' | 'systolicBP' | 'skinTemp' | 'sleepHours' | 'meanMs'
  | 'leukocytes' | 'lymphocytes' | 'iron' | 'vitaminD' | 'cortisol';

export interface Baseline {
  mean: number;
  sd: number;
}
export type Baselines = Record<BaselineKey, Baseline>;

/** Smallest SD accepted, so a very stable first week doesn't make tiny changes look huge. PLACEHOLDERS. */
const MIN_SD: Record<BaselineKey, number> = {
  restingHR: 2,
  hrv: 4,
  systolicBP: 3,
  skinTemp: 0.2,
  sleepHours: 0.3,
  meanMs: 15,
  leukocytes: 0.5,
  lymphocytes: 0.2,
  iron: 8,
  vitaminD: 3,
  cortisol: 1.5,
};

export const valueOf = (d: MemberDay, k: BaselineKey): number => {
  if (k === 'meanMs') return d.reaction.meanMs;
  if (k === 'leukocytes' || k === 'lymphocytes' || k === 'iron' || k === 'vitaminD' || k === 'cortisol') return d.blood[k];
  return d.vitals[k];
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function computeBaselines(days: MemberDay[]): Baselines {
  const first = days.slice(0, BASELINE_DAYS);
  const out = {} as Baselines;
  for (const k of Object.keys(MIN_SD) as BaselineKey[]) {
    const xs = first.map((d) => valueOf(d, k));
    const m = mean(xs);
    const sd = Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
    out[k] = { mean: m, sd: Math.max(sd, MIN_SD[k]) };
  }
  return out;
}

/** Mean of a numeric getter over the last n days. */
export const recent = (days: MemberDay[], get: (d: MemberDay) => number, n = 3) =>
  mean(days.slice(-n).map(get));

export const z = (value: number, b: Baseline) => (value - b.mean) / b.sd;
