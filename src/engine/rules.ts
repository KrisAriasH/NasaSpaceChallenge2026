import type { Environment, Finding, MemberDay, Status, SystemKey, SystemStatus, Trend } from '../types';
import { PROFILES } from '../data/crew';
import { type Baselines, recent, valueOf, z } from './baseline';

/**
 * Rules per system. Thresholds marked PLACEHOLDER must be checked by the science lead.
 * Radiation and CO2 limits come from NASA OCHMO technical briefs (see README).
 */
export const T = {
  zYellow: 2,
  zRed: 3,
  exerciseTarget: 120, // min/day, PLACEHOLDER (verify ISS exercise prescription)
  exerciseYellow: 90,
  exerciseRed: 60,
  skinTempYellow: 0.8, // °C above own normal, PLACEHOLDER
  skinTempRed: 1.2,
  sleepShort: 6, // h, PLACEHOLDER
  lapsesHigh: 4, // PVT lapses, PLACEHOLDER
  moodLow: 2.5, // 1-5 scales, PLACEHOLDER
  stressHigh: 3.5,
  energyLow: 2.5,
  connectionLow: 2.5,
  mentalRedSignals: 3, // this many mental signals at once -> red
  conversationDays: 3, // red this many days in a row -> suggest a private conversation
  radiationBackground: 1.8, // mSv/day, Curiosity RAD cruise average
  radiationYellow: 5, // PLACEHOLDER trigger for a possible solar particle event
  radiationRed: 10, // PLACEHOLDER
  careerLimit: 600, // mSv, NASA-STD-3001
  co2Yellow: 3.0, // mmHg, NASA-STD-3001
  co2Red: 4.5, // mmHg, NASA lists fatigue, nausea, poor sleep above this
  bpSysLow: 90,
  bpDiaLow: 60,
  bpSysHigh: 130,
  bpSysHighTendency: 135,
  bpDiaHigh: 100,
  // Blood pressure thresholds from the consulting physician.
  // Blood panel: common adult reference limits, PLACEHOLDERS to confirm with the consulting physician.
  leukocytesHigh: 11, // ×10^9/L
  lymphocytesLow: 1.0, // ×10^9/L
  eosinophilsHigh: 0.5, // ×10^9/L
  basophilsHigh: 0.2, // ×10^9/L
  ironLow: 60, // µg/dL
  vitaminDLow: 30, // ng/mL (insufficient)
  vitaminDRed: 20, // ng/mL (deficient)
  spo2Urgent: 92, // %, PLACEHOLDER critical rule
  careerYellow: 0.5, // share of the 600 mSv career limit, PLACEHOLDER
  careerRed: 0.8,
  radFollowUpDose: 5, // mSv in one day starts a 7-day blood follow-up, PLACEHOLDER
  radFollowUpDays: 7,
  // Combined early-illness rule (PLACEHOLDERS for clinical review)
  earlyZ: 1, // a signal counts when it is 1 SD from normal in the worse direction
  earlySignals: 3, // this many signals at once...
  earlyDays: 2, // ...on this many consecutive days
};

/** Signals that tend to change days before an infection becomes noticeable. */
const EARLY_SIGNALS: { key: 'restingHR' | 'hrv' | 'skinTemp' | 'leukocytes' | 'lymphocytes' | 'sleepHours'; label: string; worse: 1 | -1 }[] = [
  { key: 'restingHR', label: 'resting heart rate up', worse: 1 },
  { key: 'hrv', label: 'HRV down', worse: -1 },
  { key: 'skinTemp', label: 'skin temperature up', worse: 1 },
  { key: 'leukocytes', label: 'leukocytes up', worse: 1 },
  { key: 'lymphocytes', label: 'lymphocytes down', worse: -1 },
  { key: 'sleepHours', label: 'sleep down', worse: -1 },
];

/** The highest personal radiation dose in the follow-up window, if any, and when the follow-up ends. */
export function radiationFollowUp(days: MemberDay[]): { day: number; dose: number; until: number } | null {
  const high = days.slice(-T.radFollowUpDays).filter((d) => d.vitals.personalDoseMSv >= T.radFollowUpDose);
  if (high.length === 0) return null;
  const peak = high.reduce((a, d) => (d.vitals.personalDoseMSv > a.vitals.personalDoseMSv ? d : a));
  return { day: peak.day, dose: peak.vitals.personalDoseMSv, until: high[high.length - 1].day + T.radFollowUpDays };
}

/** Which early signals are present on the last day of `days` (2-day averages vs. personal normal). */
export function earlySignals(days: MemberDay[], b: Baselines): string[] {
  if (days.length < 2) return [];
  return EARLY_SIGNALS.filter((s) => {
    const v = recent(days, (d) => valueOf(d, s.key), 2);
    return z(v, b[s.key]) * s.worse >= T.earlyZ;
  }).map((s) => s.label);
}

const f0 = (n: number) => n.toFixed(0);
const f1 = (n: number) => n.toFixed(1);
const sev = (red: boolean): Finding['severity'] => (red ? 'red' : 'yellow');

export const SYSTEMS: SystemKey[] = ['cardio', 'blood', 'immune', 'bone', 'mental', 'environment'];

/** All findings for one person, using their history up to and including today. */
export function findingsFor(memberId: string, days: MemberDay[], b: Baselines, env: Environment[]): Finding[] {
  if (days.length === 0) return [];
  const today = days[days.length - 1];
  const envToday = env[today.day - 1];
  const out: Finding[] = [];
  const add = (f: Omit<Finding, 'memberId'>) => out.push({ ...f, memberId });

  // Cardiovascular
  const hr = recent(days, (d) => d.vitals.restingHR);
  const hrZ = z(hr, b.restingHR);
  if (hrZ >= T.zYellow)
    add({ id: 'cardio-hr', system: 'cardio', severity: sev(hrZ >= T.zRed), reveals: 'vitals',
      message: `Resting heart rate ${f0(hr)} bpm (3-day average), ${f0(hr - b.restingHR.mean)} bpm above normal.` });
  const hrv = recent(days, (d) => d.vitals.hrv);
  const hrvZ = z(hrv, b.hrv);
  if (hrvZ <= -T.zYellow)
    add({ id: 'cardio-hrv', system: 'cardio', severity: sev(hrvZ <= -T.zRed), reveals: 'vitals',
      message: `Heart-rate variability ${f0(hrv)} ms, below a normal of ${f0(b.hrv.mean)} ms.` });
  const systolicBP = recent(days, (d) => d.vitals.systolicBP);
  const diastolicBP = recent(days, (d) => d.vitals.diastolicBP);
  const systolicHigh = PROFILES[memberId].highBPTendency ? T.bpSysHighTendency : T.bpSysHigh;
  if (systolicBP < T.bpSysLow || diastolicBP < T.bpDiaLow)
    add({ id: 'cardio-bp-low', system: 'cardio', severity: 'red', reveals: 'vitals',
      message: `Blood pressure ${f0(systolicBP)}/${f0(diastolicBP)} mmHg (3-day average), below ${T.bpSysLow}/${T.bpDiaLow} mmHg.` });
  else if (systolicBP > systolicHigh || diastolicBP > T.bpDiaHigh)
    add({ id: 'cardio-bp', system: 'cardio', severity: 'red', reveals: 'vitals',
      message: `Blood pressure ${f0(systolicBP)}/${f0(diastolicBP)} mmHg (3-day average), above the clinical threshold.` });
  else if (z(systolicBP, b.systolicBP) >= T.zYellow || z(diastolicBP, b.diastolicBP) >= T.zYellow)
    add({ id: 'cardio-bp', system: 'cardio', severity: 'yellow', reveals: 'vitals',
      message: `Blood pressure ${f0(systolicBP)}/${f0(diastolicBP)} mmHg (3-day average), above the personal normal. Ideal: 120/80 mmHg.` });

  // Blood panel (daily finger-prick). Alerts when values fall below the person's own standard
  // or outside the reference range, as requested by the consulting physician.
  const bl = today.blood;
  const iron = recent(days, (d) => d.blood.iron);
  if (z(iron, b.iron) <= -T.zYellow || iron < T.ironLow)
    add({ id: 'blood-iron', system: 'blood', severity: sev(iron < T.ironLow), reveals: 'blood',
      message: `Iron ${f0(iron)} µg/dL (3-day average), below a personal normal of ${f0(b.iron.mean)} µg/dL.` });
  const vitD = recent(days, (d) => d.blood.vitaminD);
  if (z(vitD, b.vitaminD) <= -T.zYellow || vitD < T.vitaminDLow)
    add({ id: 'blood-vitd', system: 'blood', severity: sev(vitD < T.vitaminDLow), reveals: 'blood',
      message: `Vitamin D ${f1(vitD)} ng/mL, below a personal normal of ${f1(b.vitaminD.mean)}. Low vitamin D adds to bone loss.` });
  const cort = recent(days, (d) => d.blood.cortisol);
  if (z(cort, b.cortisol) >= T.zYellow)
    add({ id: 'blood-cortisol', system: 'blood', severity: sev(z(cort, b.cortisol) >= T.zRed), reveals: 'blood',
      message: `Morning cortisol ${f1(cort)} µg/dL, above a personal normal of ${f1(b.cortisol.mean)} (stress hormone).` });

  // Bone & muscle: exercise is the main countermeasure
  const ex = recent(days, (d) => d.vitals.exerciseMin, 7);
  if (ex < T.exerciseYellow)
    add({ id: 'bone-exercise', system: 'bone', severity: sev(ex < T.exerciseRed), reveals: 'vitals',
      message: `Exercise ${f0(ex)} min/day this week; target ${T.exerciseTarget} min.` });

  // Critical rules (urgent level)
  if (today.vitals.spo2 <= T.spo2Urgent)
    add({ id: 'cardio-spo2', system: 'cardio', severity: 'red', urgent: true, reveals: 'vitals',
      message: `Blood oxygen ${today.vitals.spo2}% today.` });

  // Immune
  const tempUp = today.vitals.skinTemp - b.skinTemp.mean;
  if (tempUp >= T.skinTempYellow)
    add({ id: 'immune-temp', system: 'immune', severity: sev(tempUp >= T.skinTempRed), reveals: 'vitals',
      message: `Skin temperature ${f1(today.vitals.skinTemp)} °C, ${f1(tempUp)} °C above normal.` });
  const wbc = recent(days, (d) => d.blood.leukocytes);
  if (z(wbc, b.leukocytes) >= T.zYellow || wbc > T.leukocytesHigh)
    add({ id: 'immune-wbc', system: 'immune', severity: sev(z(wbc, b.leukocytes) >= T.zRed || wbc > T.leukocytesHigh), reveals: 'blood',
      message: `Leukocytes ${f1(wbc)} ×10⁹/L, above a personal normal of ${f1(b.leukocytes.mean)}.` });
  const lym = recent(days, (d) => d.blood.lymphocytes);
  if (z(lym, b.lymphocytes) <= -T.zYellow || lym < T.lymphocytesLow)
    add({ id: 'immune-lymph', system: 'immune', severity: sev(z(lym, b.lymphocytes) <= -T.zRed || lym < T.lymphocytesLow), reveals: 'blood',
      message: `Lymphocytes ${lym.toFixed(2)} ×10⁹/L, below a personal normal of ${b.lymphocytes.mean.toFixed(2)}.` });
  if (bl.eosinophils > T.eosinophilsHigh || bl.basophils > T.basophilsHigh)
    add({ id: 'immune-eos-baso', system: 'immune', severity: 'yellow', reveals: 'blood',
      message: `Eosinophils ${bl.eosinophils.toFixed(2)} / basophils ${bl.basophils.toFixed(2)} ×10⁹/L above reference (possible allergic reaction).` });
  // Combined early-illness rule: several small changes together, kept for 2 days in a row.
  const early = earlySignals(days, b);
  const persisted = Array.from({ length: T.earlyDays }, (_, i) => days.slice(0, days.length - i)).every(
    (d) => earlySignals(d, b).length >= T.earlySignals,
  );
  if (persisted)
    add({ id: 'risk-illness', system: 'immune', severity: 'yellow', predictive: true, reveals: 'vitals',
      message: `Early signs of possible illness for ${T.earlyDays} days: ${early.join(', ')}. No single measure has reached its alert level yet.` });
  if (tempUp >= T.skinTempRed && today.checkIn.symptoms.includes('shortness of breath'))
    add({ id: 'immune-critical', system: 'immune', severity: 'red', urgent: true, reveals: 'vitals',
      message: `Fever with shortness of breath reported today.` });

  const symptoms = [...new Set(days.slice(-3).flatMap((d) => d.checkIn.symptoms))];
  if (symptoms.length > 0)
    add({ id: 'immune-symptoms', system: 'immune', severity: 'yellow', reveals: 'checkInAnswers',
      message: `Symptoms in the last 3 days: ${symptoms.join(', ')}.` });

  // Radiation absorbed by this person (personal dosimeter)
  const profile = PROFILES[memberId];
  const career = profile.priorCareerDoseMSv + days.reduce((sum, d) => sum + d.vitals.personalDoseMSv, 0);
  const share = career / T.careerLimit;
  if (share >= T.careerYellow)
    add({ id: 'rad-career', system: 'environment', severity: sev(share >= T.careerRed), reveals: 'vitals',
      message: `Career radiation dose ${f0(career)} mSv (${f0(share * 100)}% of the ${T.careerLimit} mSv limit), including ${f0(profile.priorCareerDoseMSv)} mSv from earlier missions.` });
  // Leukocytes and lymphocytes are sensitive to radiation: after a high personal dose, watch them for a week.
  const exposure = radiationFollowUp(days);
  if (exposure) {
    const lymZ = z(recent(days, (d) => d.blood.lymphocytes), b.lymphocytes);
    const wbcZ = z(recent(days, (d) => d.blood.leukocytes), b.leukocytes);
    if (lymZ <= -T.zYellow || wbcZ <= -T.zYellow)
      add({ id: 'rad-blood', system: 'blood', severity: sev(lymZ <= -T.zYellow && wbcZ <= -T.zYellow), reveals: 'blood',
        message: `Lymphocytes or leukocytes below normal in the week after a ${f1(exposure.dose)} mSv radiation dose on day ${exposure.day}.` });
  }

  // Mental health: several signals; the status depends on how many are present
  const mental: Omit<Finding, 'memberId' | 'severity'>[] = [];
  const sleep = recent(days, (d) => d.vitals.sleepHours);
  if (sleep < T.sleepShort)
    mental.push({ id: 'mental-sleep', system: 'mental', reveals: 'vitals', message: `Sleep ${f1(sleep)} h a night (3-day average).` });
  const rt = recent(days, (d) => d.reaction.meanMs);
  const lapses = recent(days, (d) => d.reaction.lapses);
  if (z(rt, b.meanMs) >= T.zYellow || lapses >= T.lapsesHigh)
    mental.push({ id: 'mental-fatigue', system: 'mental', reveals: 'reaction',
      message: `Reaction test slower: ${f0(rt)} ms average, ${f1(lapses)} lapses (normal ${f0(b.meanMs.mean)} ms).` });
  const mood = recent(days, (d) => d.checkIn.mood);
  if (mood <= T.moodLow)
    mental.push({ id: 'mental-mood', system: 'mental', reveals: 'checkInAnswers', message: `Mood ${f1(mood)} / 5 (3-day average).` });
  const stress = recent(days, (d) => d.checkIn.stress);
  if (stress >= T.stressHigh)
    mental.push({ id: 'mental-stress', system: 'mental', reveals: 'checkInAnswers', message: `Stress ${f1(stress)} / 5 (3-day average).` });
  const energy = recent(days, (d) => d.checkIn.energy);
  if (energy <= T.energyLow)
    mental.push({ id: 'mental-energy', system: 'mental', reveals: 'checkInAnswers', message: `Energy ${f1(energy)} / 5 (3-day average).` });
  const connection = recent(days, (d) => d.checkIn.connection);
  if (connection <= T.connectionLow)
    mental.push({ id: 'mental-connection', system: 'mental', reveals: 'checkInAnswers',
      message: `Feeling of connection ${f1(connection)} / 5: little contact with crew or family.` });
  const mentalRed = mental.length >= T.mentalRedSignals;
  for (const m of mental) add({ ...m, severity: sev(mentalRed) });

  // Environment (same habitat for everyone)
  if (envToday.radiationMSv >= T.radiationYellow)
    add({ id: 'env-radiation', system: 'environment', severity: sev(envToday.radiationMSv >= T.radiationRed),
      urgent: envToday.radiationMSv >= T.radiationRed, reveals: 'environment',
      message: `Radiation ${f1(envToday.radiationMSv)} mSv today, ${f0(envToday.radiationMSv / T.radiationBackground)}× the usual dose. Possible solar particle event.` });
  if (envToday.co2 > T.co2Yellow)
    add({ id: 'env-co2', system: 'environment', severity: sev(envToday.co2 > T.co2Red), reveals: 'environment',
      message: `Cabin CO2 ${f1(envToday.co2)} mmHg, above the ${f1(T.co2Yellow)} mmHg limit.` });

  return out;
}

const worst = (fs: Finding[]): Status =>
  fs.some((f) => f.severity === 'red') ? 'red' : fs.length > 0 ? 'yellow' : 'green';
const load = (fs: Finding[]) => fs.reduce((s, f) => s + (f.severity === 'red' ? 2 : 1), 0);

/** Status and 3-day trend per system, plus the break-glass conversation alert. */
export function assessMember(memberId: string, days: MemberDay[], b: Baselines, env: Environment[]): SystemStatus[] {
  const now = findingsFor(memberId, days, b, env);
  const before = days.length > 3 ? findingsFor(memberId, days.slice(0, -3), b, env) : now;

  const result = SYSTEMS.map((system): SystemStatus => {
    const a = now.filter((f) => f.system === system);
    const p = before.filter((f) => f.system === system);
    const trend: Trend = load(a) < load(p) ? 'up' : load(a) > load(p) ? 'down' : 'flat';
    return { system, status: worst(a), trend, findings: a, urgent: a.some((f) => f.urgent) };
  });

  // Safety rule: mental health red several days in a row -> the medical officer is told
  // to have a private conversation. It reveals only the status, never the answers.
  const redDays = consecutiveMentalRedDays(memberId, days, b, env);
  if (redDays >= T.conversationDays) {
    result.find((s) => s.system === 'mental')!.findings.unshift({
      id: 'mental-conversation',
      memberId,
      system: 'mental',
      severity: 'red',
      reveals: 'mentalStatus',
      message: `Mental health has been red for ${redDays} days in a row. A private conversation is recommended.`,
    });
  }
  return result;
}

export function mentalStatusOn(memberId: string, days: MemberDay[], b: Baselines, env: Environment[]): Status {
  return worst(findingsFor(memberId, days, b, env).filter((f) => f.system === 'mental'));
}

export function consecutiveMentalRedDays(memberId: string, days: MemberDay[], b: Baselines, env: Environment[]): number {
  let count = 0;
  for (let end = days.length; end > 0; end--) {
    if (mentalStatusOn(memberId, days.slice(0, end), b, env) !== 'red') break;
    count++;
  }
  return count;
}

/** SATS-style level of a set of findings. Level 0 means no signal with the data available, not "healthy". */
export const levelOf = (fs: Finding[]): import('../types').Level =>
  fs.some((f) => f.urgent) ? 3 : fs.some((f) => f.severity === 'red') ? 2 : fs.length > 0 ? 1 : 0;

export const overallStatus = (systems: SystemStatus[]): Status =>
  systems.some((s) => s.status === 'red') ? 'red' : systems.some((s) => s.status === 'yellow') ? 'yellow' : 'green';

export const missionDose = (env: Environment[], day: number) =>
  env.slice(0, day).reduce((sum, e) => sum + e.radiationMSv, 0);
