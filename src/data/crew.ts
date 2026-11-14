import type { CrewMember } from '../types';

/** Fictional demo crew: two women and two men so the sex-specific notes can be shown. */
export const CREW: CrewMember[] = [
  { id: 'ana', name: 'Ana Rojas', sex: 'female', role: 'cmo' },
  { id: 'ben', name: 'Ben Okafor', sex: 'male', role: 'backup' },
  { id: 'chen', name: 'Chen Wei', sex: 'female', role: 'crew' },
  { id: 'diego', name: 'Diego Morales', sex: 'male', role: 'crew' },
];

export const MISSION_DAYS = 30;
export const BASELINE_DAYS = 7;

export const memberById = (id: string) => CREW.find((m) => m.id === id)!;

export const ROLE_LABEL: Record<CrewMember['role'], string> = {
  cmo: 'Crew Medical Officer',
  backup: 'Backup medical officer',
  crew: 'Crew member',
};
