import type { MemberDay } from '../types';

export interface Pattern {
  id: string;
  text: string;
  evidence: string[];
  action: string;
}

const average = (values: number[]) => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

function slope(values: number[]): number {
  if (values.length < 2) return 0;
  const meanX = (values.length - 1) / 2;
  const meanY = average(values);
  const numerator = values.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0);
  const denominator = values.reduce((sum, _, index) => sum + (index - meanX) ** 2, 0);
  return denominator === 0 ? 0 : numerator / denominator;
}

function longestWorkRun(days: MemberDay[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    current = day.checkIn.workHours > 10 ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function patternsFor(history: MemberDay[]): Pattern[] {
  const days = history.slice(-14);
  const patterns: Pattern[] = [];
  const lastFive = days.slice(-5);
  const nobodyDays = lastFive.filter((day) => day.checkIn.contact.includes('nobody')).length;
  const connectionAverage = average(lastFive.map((day) => day.checkIn.connection));

  if (nobodyDays >= 3 || connectionAverage <= 2.5) {
    patterns.push({
      id: 'isolation',
      text: 'Fewer conversations than usual in the last 5 days.',
      evidence: [`${nobodyDays} of the last ${lastFive.length} days included no conversation`, `Connection average ${connectionAverage.toFixed(1)} of 5`],
      action: 'Schedule a call with family or a shared crew activity.',
    });
  }

  const shortSleep = days.filter((day) => day.vitals.sleepHours < 6);
  const adequateSleep = days.filter((day) => day.vitals.sleepHours >= 7);
  const sleepMoodDifference = average(adequateSleep.map((day) => day.checkIn.mood)) - average(shortSleep.map((day) => day.checkIn.mood));
  if (shortSleep.length >= 3 && adequateSleep.length >= 3 && sleepMoodDifference >= 1) {
    patterns.push({
      id: 'sleep-mood',
      text: `Mood has been about ${sleepMoodDifference.toFixed(1)} points lower on days with less than 6 hours of sleep.`,
      evidence: [`${shortSleep.length} days under 6 hours`, `${adequateSleep.length} days at or above 7 hours`],
      action: 'Protect a longer sleep window and review workload.',
    });
  }

  const workRun = longestWorkRun(days);
  const stressSlope = slope(days.map((day) => day.checkIn.stress));
  if (workRun >= 3 && stressSlope > 0) {
    patterns.push({
      id: 'workload',
      text: 'Several consecutive long workdays with rising stress.',
      evidence: `Longest run over 10 work hours: ${workRun} days`.split(' · '),
      action: 'Review workload with the medical officer and protect recovery time.',
    });
  }

  const lastSeven = days.slice(-7);
  const moodSlope = slope(lastSeven.map((day) => day.checkIn.mood));
  if (lastSeven.length >= 7 && moodSlope <= -0.15) {
    patterns.push({
      id: 'mood-decline',
      text: 'Mood has been declining over the last week.',
      evidence: [`Mood slope ${moodSlope.toFixed(2)} points per day`],
      action: 'Schedule a private check-in and review sleep and workload.',
    });
  }

  return patterns;
}
