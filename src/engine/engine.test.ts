import { describe, expect, it } from 'vitest';
import { CREW, memberById } from '../data/crew';
import { simulateEnvironment, simulateMember } from '../data/simulate';
import type { SystemKey } from '../types';
import { computeBaselines } from './baseline';
import { GUIDANCE } from './guidance';
import { DEFAULT_SHARING, canGroundSee, canSee } from './privacy';
import { assessMember } from './rules';
import { forecasts } from './forecast';

const env = simulateEnvironment();
const statusOn = (id: string, day: number) => {
  const days = simulateMember(id);
  const s = assessMember(id, days.slice(0, day), computeBaselines(days), env);
  return Object.fromEntries(s.map((x) => [x.system, x])) as Record<SystemKey, (typeof s)[number]>;
};

const ana = memberById('ana'); // CMO
const ben = memberById('ben'); // backup
const chen = memberById('chen');
const diego = memberById('diego');

describe('privacy policy', () => {
  it('lets everyone see all of their own data', () => {
    expect(canSee(chen, chen, 'journal', DEFAULT_SHARING)).toBe(true);
    expect(canSee(chen, chen, 'checkInAnswers', DEFAULT_SHARING)).toBe(true);
  });

  it('shows the CMO vitals and mental status, but not answers unless shared', () => {
    expect(canSee(ana, chen, 'vitals', DEFAULT_SHARING)).toBe(true);
    expect(canSee(ana, chen, 'mentalStatus', DEFAULT_SHARING)).toBe(true);
    expect(canSee(ana, chen, 'checkInAnswers', DEFAULT_SHARING)).toBe(false);
    expect(canSee(ana, chen, 'checkInAnswers', { ...DEFAULT_SHARING, checkInAnswersToCmo: true })).toBe(true);
  });

  it('never shows the journal to anyone else', () => {
    const all = { checkInAnswersToCmo: true, checkInAnswersToGround: true, mentalStatusToGround: true };
    expect(canSee(ana, chen, 'journal', all)).toBe(false);
    expect(canGroundSee('journal', all)).toBe(false);
  });

  it('lets the backup review the CMO, and only the CMO', () => {
    expect(canSee(ben, ana, 'vitals', DEFAULT_SHARING)).toBe(true);
    expect(canSee(ben, chen, 'vitals', DEFAULT_SHARING)).toBe(false);
  });

  it('gives regular crew members no access to each other, except the environment', () => {
    expect(canSee(diego, chen, 'vitals', DEFAULT_SHARING)).toBe(false);
    expect(canSee(diego, chen, 'mentalStatus', DEFAULT_SHARING)).toBe(false);
    expect(canSee(diego, chen, 'environment', DEFAULT_SHARING)).toBe(true);
  });

  it('keeps mental health data from the ground unless authorized', () => {
    expect(canGroundSee('mentalStatus', DEFAULT_SHARING)).toBe(false);
    expect(canGroundSee('vitals', DEFAULT_SHARING)).toBe(true);
  });
});

describe('demo story', () => {
  it('is all green for everyone on day 14', () => {
    for (const m of CREW) {
      for (const s of Object.values(statusOn(m.id, 14))) expect(s.status, `${m.id} ${s.system}`).toBe('green');
    }
  });

  it('tells everyone to shelter on the solar particle event day', () => {
    expect(statusOn('ben', 12).environment.status).toBe('red');
  });

  it('turns Chen mental health yellow, then red, then recommends a conversation', () => {
    expect(statusOn('chen', 21).mental.status).not.toBe('green');
    expect(statusOn('chen', 26).mental.status).toBe('red');
    const ids = statusOn('chen', 30).mental.findings.map((f) => f.id);
    expect(ids).toContain('mental-conversation');
  });

  it('flags Diego bone and later cardio', () => {
    expect(statusOn('diego', 23).bone.status).not.toBe('green');
    expect(statusOn('diego', 27).cardio.status).not.toBe('green');
  });

  it('flags Ana immune during her fever', () => {
    expect(statusOn('ana', 26).immune.status).not.toBe('green');
  });

  it('flags the blood panel: Diego vitamin D, Ana leukocytes and lymphocytes, Chen cortisol', () => {
    expect(statusOn('diego', 20).blood.findings.map((f) => f.id)).toContain('blood-vitd');
    const anaImmune = statusOn('ana', 25).immune.findings.map((f) => f.id);
    expect(anaImmune).toContain('immune-wbc');
    expect(anaImmune).toContain('immune-lymph');
    expect(statusOn('chen', 24).blood.findings.map((f) => f.id)).toContain('blood-cortisol');
  });

  it('warns about Diego vitamin D before it leaves his normal range', () => {
    const days = simulateMember('diego');
    const f = forecasts(days.slice(0, 13), computeBaselines(days));
    expect(f.map((x) => x.key)).toContain('vitaminD');
  });

  it('has guidance for every finding the rules can produce', () => {
    for (const m of CREW) {
      for (let d = 1; d <= 30; d++) {
        for (const s of Object.values(statusOn(m.id, d))) {
          for (const f of s.findings) expect(GUIDANCE[f.id], f.id).toBeDefined();
        }
      }
    }
  });
});
