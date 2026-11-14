import type { CheckIn, Environment, MemberDay } from '../types';
import { CREW, MISSION_DAYS } from './crew';

/**
 * Simulated 30-day mission. ALL VALUES ARE PLACEHOLDERS for the demo.
 * The science lead should check the healthy ranges against sources.
 *
 * Demo story:
 *  - Environment: solar particle event on day 12; cabin CO2 rises from day 21.
 *  - Chen: from day 18 sleep, mood and connection drop and reaction time slows
 *          -> mental health yellow, then red (the privacy story).
 *  - Diego: skips exercise from day 17 -> bone; heart rate rises from day 23 -> cardio.
 *  - Ana (CMO): low fever and congestion on days 25-27 -> immune (Ben reviews her).
 *  - Ben: healthy, mild headaches when CO2 is high.
 *  Blood (daily finger-prick):
 *  - Ana: leukocytes up and lymphocytes down around her fever.
 *  - Diego: vitamin D drifts down (bone risk) and iron falls slowly.
 *  - Chen: morning cortisol rises with stress.
 *  Healthy ranges are common adult reference ranges, rounded. VERIFY with the consulting physician.
 */

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const scale = (n: number) => Math.round(clamp(n, 1, 5));
/** 0 before `start`, then grows by 1 per day up to `cap`. */
const ramp = (day: number, start: number, cap = 6) => clamp(day - start + 1, 0, cap);

export function simulateEnvironment(days = MISSION_DAYS): Environment[] {
  const rand = rng(7);
  const n = (a: number) => (rand() - 0.5) * 2 * a;
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    let radiationMSv = 1.8 + n(0.15); // deep-space cruise order of magnitude (Curiosity RAD)
    if (day === 12) radiationMSv += 28;
    if (day === 13) radiationMSv += 6;
    const co2 = 2.3 + n(0.2) + 0.3 * ramp(day, 21);
    return {
      radiationMSv: Math.round(radiationMSv * 100) / 100,
      co2: r1(co2),
      cabinTemp: r1(22.5 + n(0.5)),
      humidity: Math.round(45 + n(4)),
    };
  });
}

export function simulateMember(memberId: string, days = MISSION_DAYS): MemberDay[] {
  const index = CREW.findIndex((m) => m.id === memberId);
  const rand = rng(100 + index * 31);
  const n = (a: number) => (rand() - 0.5) * 2 * a;
  const female = CREW[index].sex === 'female';
  const env = simulateEnvironment(days);

  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    // Personal healthy levels differ a little per person.
    let restingHR = (female ? 64 : 60) + index + n(2.5);
    let hrv = 55 - index * 2 + n(5);
    const systolicBP = (female ? 112 : 120) + n(4);
    const spo2 = 98 + n(0.8);
    let skinTemp = 33.5 + n(0.3);
    let sleepHours = 7.1 + n(0.4);
    let exerciseMin = 118 + n(12);
    let mood = 4 + n(0.6);
    let stress = 2 + n(0.6);
    let energy = 4 + n(0.6);
    let connection = 4 + n(0.6);
    let meanMs = 270 + index * 8 + n(15);
    let lapses = Math.max(0, Math.round(1 + n(1)));
    const symptoms: string[] = [];
    let leukocytes = 6.5 + n(0.6);
    let lymphocytes = 2.1 + n(0.25);
    const eosinophils = 0.18 + n(0.05);
    const basophils = 0.04 + n(0.015);
    let iron = (female ? 95 : 110) + n(8);
    let vitaminD = 42 + n(3);
    let cortisol = 13 + n(1.5);

    if (memberId === 'chen') {
      const k = ramp(day, 18, 8);
      sleepHours -= 0.3 * k;
      mood -= 0.35 * k;
      connection -= 0.4 * k;
      energy -= 0.3 * k;
      stress += 0.3 * k;
      meanMs += 12 * k;
      lapses += Math.round(0.6 * k);
      cortisol += 1.3 * k;
    }
    if (memberId === 'diego') {
      if (day >= 17) exerciseMin = 50 + n(15);
      vitaminD -= 0.75 * Math.max(0, day - 8);
      iron -= 1.6 * Math.max(0, day - 12);
      const k = ramp(day, 23, 5);
      restingHR += 2.2 * k;
      hrv -= 3 * k;
    }
    if (memberId === 'ana' && day >= 25 && day <= 27) {
      skinTemp += 1.1;
      symptoms.push('congestion');
    }
    if (memberId === 'ana') {
      const k = day >= 24 && day <= 28 ? 1 : 0;
      leukocytes += 4 * k;
      lymphocytes -= 0.9 * k;
    }
    if (env[i].co2 > 3.2 && (memberId === 'ben' || memberId === 'chen')) symptoms.push('headache');

    const checkIn: CheckIn = {
      mood: scale(mood),
      stress: scale(stress),
      energy: scale(energy),
      connection: scale(connection),
      symptoms,
    };

    return {
      day,
      vitals: {
        restingHR: Math.round(restingHR),
        hrv: Math.round(hrv),
        systolicBP: Math.round(systolicBP),
        spo2: Math.round(clamp(spo2, 90, 100)),
        skinTemp: r1(skinTemp),
        sleepHours: r1(clamp(sleepHours, 3, 10)),
        exerciseMin: Math.round(clamp(exerciseMin, 0, 180)),
      },
      blood: {
        leukocytes: r1(leukocytes),
        lymphocytes: Math.round(lymphocytes * 100) / 100,
        eosinophils: Math.round(eosinophils * 100) / 100,
        basophils: Math.round(basophils * 100) / 100,
        iron: Math.round(iron),
        vitaminD: r1(vitaminD),
        cortisol: r1(cortisol),
      },
      checkIn,
      reaction: { meanMs: Math.round(meanMs), lapses },
    };
  });
}
