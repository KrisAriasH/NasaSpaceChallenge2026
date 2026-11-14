import type { AccessLogEntry, CrewMember, DataCategory, SharingSettings } from '../types';

/**
 * THE privacy rule of Asclepio. Every screen reads data through these functions,
 * never directly, so the policy lives in one place and is covered by tests.
 *
 * Policy:
 *  - You always see all of your own data.
 *  - The medical officer sees vitals, blood panel, environment, reaction test and the mental health
 *    STATUS (green/yellow/red) of the people they look after.
 *  - Check-in answers (mood, stress, energy, connection, symptoms) only if the owner shares them.
 *  - The private journal is never visible to anyone else.
 *  - Other crew members only see the shared environment data.
 *
 * In a real deployment this check must also run on the server; here it runs in the client.
 */

export const DEFAULT_SHARING: SharingSettings = {
  checkInAnswersToCmo: false,
  checkInAnswersToGround: false,
  mentalStatusToGround: false,
};

/** Who looks after whom: the CMO reviews everyone else; the backup reviews the CMO. */
export function isMedicalReviewer(viewer: CrewMember, subject: CrewMember): boolean {
  if (viewer.id === subject.id) return false;
  if (viewer.role === 'cmo') return true;
  if (viewer.role === 'backup' && subject.role === 'cmo') return true;
  return false;
}

export function canSee(
  viewer: CrewMember,
  subject: CrewMember,
  category: DataCategory,
  sharing: SharingSettings,
): boolean {
  if (viewer.id === subject.id) return true;
  if (category === 'environment') return true;
  if (!isMedicalReviewer(viewer, subject)) return false;
  switch (category) {
    case 'vitals':
    case 'blood':
    case 'reaction':
    case 'mentalStatus':
      return true;
    case 'checkInAnswers':
      return sharing.checkInAnswersToCmo;
    case 'journal':
      return false;
  }
}

/** What would be included in a report to the flight surgeons on Earth. */
export function canGroundSee(category: DataCategory, sharing: SharingSettings): boolean {
  switch (category) {
    case 'vitals':
    case 'blood':
    case 'environment':
    case 'reaction':
      return true;
    case 'mentalStatus':
      return sharing.mentalStatusToGround;
    case 'checkInAnswers':
      return sharing.checkInAnswersToGround;
    case 'journal':
      return false;
  }
}

export const CATEGORY_LABEL: Record<DataCategory, string> = {
  vitals: 'Vital signs, sleep and exercise',
  blood: 'Blood panel (daily finger-prick)',
  environment: 'Habitat environment',
  reaction: 'Reaction test (fatigue)',
  mentalStatus: 'Mental health status (green / yellow / red)',
  checkInAnswers: 'Check-in answers (mood, stress, energy, connection, symptoms)',
  journal: 'Private journal',
};

export const ALL_CATEGORIES: DataCategory[] = [
  'vitals',
  'blood',
  'environment',
  'reaction',
  'mentalStatus',
  'checkInAnswers',
  'journal',
];

/** Add an access record, at most one per viewer, subject and day. */
export function recordAccess(log: AccessLogEntry[], entry: AccessLogEntry): AccessLogEntry[] {
  const exists = log.some(
    (e) => e.viewerId === entry.viewerId && e.subjectId === entry.subjectId && e.day === entry.day,
  );
  return exists ? log : [...log, entry];
}
