import type { SystemKey } from '../types';
import { BASELINE_DAYS, CREW, MISSION_DAYS } from '../data/crew';
import { type ScenarioEvent, scenarioEvents, simulateEnvironment, simulateMember, simulateUrineTests } from '../data/simulate';
import { computeBaselines } from './baseline';
import { SYSTEMS, assessMember } from './rules';

/**
 * Measures the rules against the problems injected in the simulation (the ground truth):
 * how many were detected, how fast, how many alerts fired on healthy days, and how far
 * ahead of symptoms the early-illness rule warned. Run by the tests and shown in the app.
 * These numbers describe the demo scenario only, not real-world performance.
 */

export interface EventResult {
  event: ScenarioEvent;
  firstAlertDay: number | null;
  delayDays: number | null; // first alert minus start of the change
  leadBeforeSymptoms: number | null; // symptom day minus first alert (positive = warned before)
}

export interface Evaluation {
  events: EventResult[];
  detected: number;
  sensitivity: number; // detected / events
  healthyDays: number; // person-system-days with nothing injected
  falseAlarmDays: number; // of those, days with an alert
  specificity: number;
  meanDelay: number;
}

export function evaluate(): Evaluation {
  const env = simulateEnvironment();
  const events = scenarioEvents(env);
  const urineByMember = Object.fromEntries(CREW.map((m) => [m.id, simulateUrineTests(m.id)]));
  // status[memberId][system][day] = alert present?
  const status: Record<string, Record<SystemKey, Record<number, boolean>>> = {};
  for (const m of CREW) {
    const all = simulateMember(m.id);
    const urine = urineByMember[m.id];
    const b = computeBaselines(all);
    status[m.id] = Object.fromEntries(SYSTEMS.map((s) => [s, {}])) as Record<SystemKey, Record<number, boolean>>;
    for (let day = BASELINE_DAYS + 1; day <= MISSION_DAYS; day++) {
      for (const s of assessMember(m.id, all.slice(0, day), b, env, urine)) status[m.id][s.system][day] = s.status !== 'green';
    }
  }
  const memberFor = (e: ScenarioEvent) => (e.memberId === 'all' ? CREW[0].id : e.memberId);

  const results: EventResult[] = events.map((event) => {
    const map = status[memberFor(event)][event.system];
    let first: number | null = null;
    for (let d = Math.max(event.start, BASELINE_DAYS + 1); d <= (event.end ?? MISSION_DAYS); d++) {
      if (map[d]) {
        first = d;
        break;
      }
    }
    return {
      event,
      firstAlertDay: first,
      delayDays: first === null ? null : first - event.start,
      leadBeforeSymptoms: first === null || event.symptomDay === undefined ? null : event.symptomDay - first,
    };
  });

  // Healthy person-system-days: nothing injected for that person and system on that day.
  // Habitat (environment) is shared, so it is counted once.
  let healthy = 0;
  let falseAlarms = 0;
  const covered = (memberId: string, system: SystemKey, day: number) =>
    events.some(
      (e) => (e.memberId === memberId || e.memberId === 'all') && e.system === system && day >= e.start && day <= (e.end ?? MISSION_DAYS),
    );
  for (const m of CREW) {
    for (const s of SYSTEMS) {
      if (s === 'environment' && m.id !== CREW[0].id) continue;
      for (let day = BASELINE_DAYS + 1; day <= MISSION_DAYS; day++) {
        if (covered(m.id, s, day)) continue;
        // Chen's abnormal urine test remains clinically relevant for seven days.
        const urineEvent = (s === 'immune' || s === 'blood') && urineByMember[m.id].some(
          (test) => test.nitrites === 'positive' && day >= test.day && day < test.day + 7,
        );
        if (urineEvent) continue;
        healthy++;
        if (status[m.id][s][day]) falseAlarms++;
      }
    }
  }

  const detected = results.filter((r) => r.firstAlertDay !== null);
  return {
    events: results,
    detected: detected.length,
    sensitivity: detected.length / results.length,
    healthyDays: healthy,
    falseAlarmDays: falseAlarms,
    specificity: healthy === 0 ? 1 : (healthy - falseAlarms) / healthy,
    meanDelay: detected.length === 0 ? 0 : detected.reduce((a, r) => a + (r.delayDays ?? 0), 0) / detected.length,
  };
}
