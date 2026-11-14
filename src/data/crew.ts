import type { CrewMember, MedicalProfile } from '../types';

/** Fictional demo crew; medical context is stored separately in PROFILES. */
export const CREW: CrewMember[] = [
  { id: 'ana', name: 'Ana Rojas', sex: 'female', role: 'cmo' },
  { id: 'ben', name: 'Ben Okafor', sex: 'male', role: 'backup' },
  { id: 'chen', name: 'Chen Wei', sex: 'female', role: 'crew' },
  { id: 'diego', name: 'Diego Morales', sex: 'male', role: 'crew' },
];

/** Fictional profiles for the demo. */
export const PROFILES: Record<string, MedicalProfile> = {
  ana: { age: 41, bloodType: 'O+', allergies: [], conditions: [], medications: ['Vitamin D supplement'], previousFlights: 1, priorCareerDoseMSv: 120, returnDay: 30 },
  ben: { age: 38, bloodType: 'A+', allergies: ['Penicillin'], conditions: ['Mild seasonal asthma (controlled)'], medications: ['Vitamin D supplement'], previousFlights: 0, priorCareerDoseMSv: 40, returnDay: 30 },
  chen: { age: 35, bloodType: 'B+', allergies: [], conditions: [], medications: ['Vitamin D supplement'], previousFlights: 0, priorCareerDoseMSv: 0, returnDay: 30 },
  diego: { age: 47, bloodType: 'A−', allergies: ['Latex'], conditions: [], medications: ['Vitamin D supplement'], previousFlights: 2, priorCareerDoseMSv: 260, returnDay: 30 },
};

export const MISSION_DAYS = 30;
export const BASELINE_DAYS = 7;

export const memberById = (id: string) => CREW.find((m) => m.id === id)!;

export const ROLE_LABEL: Record<CrewMember['role'], string> = {
  cmo: 'Crew Medical Officer',
  backup: 'Backup medical officer',
  crew: 'Crew member',
};
