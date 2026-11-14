import type { CrewMember } from '../types';

/** Fictional demo crew with the medical context available to the medical officer. */
export const CREW: CrewMember[] = [
  {
    id: 'ana',
    name: 'Ana Rojas',
    sex: 'female',
    role: 'cmo',
    medicalProfile: {
      conditions: 'None reported',
      allergies: 'Penicillin',
      medications: 'Vitamin D supplement',
      previousFlights: '1 ISS expedition',
      missionPhase: 'Deep-space cruise · days 1–30',
    },
  },
  {
    id: 'ben',
    name: 'Ben Okafor',
    sex: 'male',
    role: 'backup',
    medicalProfile: {
      conditions: 'Mild seasonal rhinitis',
      allergies: 'Dust',
      medications: 'None',
      previousFlights: 'None',
      missionPhase: 'Deep-space cruise · days 1–30',
    },
  },
  {
    id: 'chen',
    name: 'Chen Wei',
    sex: 'female',
    role: 'crew',
    medicalProfile: {
      conditions: 'None reported',
      allergies: 'None known',
      medications: 'None',
      previousFlights: '1 low-Earth-orbit mission',
      missionPhase: 'Deep-space cruise · days 1–30',
    },
  },
  {
    id: 'diego',
    name: 'Diego Morales',
    sex: 'male',
    role: 'crew',
    medicalProfile: {
      conditions: 'History of iron deficiency',
      allergies: 'None known',
      medications: 'Iron supplement as prescribed',
      previousFlights: 'None',
      missionPhase: 'Deep-space cruise · days 1–30',
    },
  },
];

export const MISSION_DAYS = 30;
export const BASELINE_DAYS = 7;

export const memberById = (id: string) => CREW.find((m) => m.id === id)!;

export const ROLE_LABEL: Record<CrewMember['role'], string> = {
  cmo: 'Crew Medical Officer',
  backup: 'Backup medical officer',
  crew: 'Crew member',
};
