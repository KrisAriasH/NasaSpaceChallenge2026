// Core types for Asclepio.

export type Sex = 'female' | 'male';

/** cmo = Crew Medical Officer; backup = reviews the CMO's own data. */
export type Role = 'cmo' | 'backup' | 'crew';

export interface CrewMember {
  id: string;
  name: string;
  sex: Sex;
  role: Role;
}

/** Daily readings from wearables (e.g. a Bio-Monitor-type smart shirt) and a sleep watch. */
export interface Vitals {
  restingHR: number; // bpm
  hrv: number; // ms (RMSSD)
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  spo2: number; // %
  skinTemp: number; // °C
  sleepHours: number;
  exerciseMin: number;
  personalDoseMSv: number; // radiation absorbed that day, from the personal dosimeter
}

/** Fictional medical profile, visible to the person and their medical officer. */
export interface MedicalProfile {
  age: number;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  previousFlights: number;
  highBPTendency: boolean;
  priorCareerDoseMSv: number; // radiation from earlier missions
  returnDay: number; // mission day of the planned return to Earth
}

/**
 * Daily finger-prick blood panel (consulting physician's request).
 * Units: cells ×10^9/L, iron µg/dL, vitamin D ng/mL, cortisol µg/dL (morning).
 */
export interface BloodPanel {
  leukocytes: number;
  lymphocytes: number;
  eosinophils: number;
  basophils: number;
  iron: number;
  vitaminD: number;
  cortisol: number;
}

export interface UrineTest {
  day: number;
  color: 'clear' | 'pale yellow' | 'dark yellow' | 'red/pink' | 'brown';
  clarity: 'clear' | 'cloudy' | 'milky';
  specificGravity: number; // e.g. 1.020
  ph: number;
  protein: 'negative' | 'trace' | '1+' | '2+' | '3+';
  nitrites: 'negative' | 'positive';
}

export interface VisionResult {
  day: number;
  acuityStep: number;
  amslerMarks: { row: number; column: number }[];
}

/** 30-second daily self-report. Private by default. */
export interface CheckIn {
  mood: number; // 1 very low – 5 very good
  stress: number; // 1 calm – 5 very stressed
  energy: number; // 1 exhausted – 5 full of energy
  connection: number; // 1 isolated – 5 well connected (contact with crew/family)
  symptoms: string[];
}

/** Psychomotor Vigilance Test result. */
export interface ReactionResult {
  meanMs: number;
  lapses: number; // responses slower than 500 ms
}

export interface Environment {
  radiationMSv: number; // dose received that day
  co2: number; // mmHg
  cabinTemp: number; // °C
  humidity: number; // %
}

export interface MemberDay {
  day: number;
  vitals: Vitals;
  blood: BloodPanel;
  checkIn: CheckIn;
  reaction: ReactionResult;
}

export type SystemKey = 'cardio' | 'blood' | 'immune' | 'bone' | 'mental' | 'environment' | 'vision';
export type Status = 'green' | 'yellow' | 'red';
export type Trend = 'up' | 'flat' | 'down'; // up = getting better

export interface Finding {
  id: string; // stable rule id, used to look up the suggested action
  memberId: string;
  system: SystemKey;
  severity: Exclude<Status, 'green'>;
  message: string;
  /** Category of data the message reveals. The UI hides the message if the viewer can't see it. */
  reveals: DataCategory;
  /** Critical rule: needs an urgent response and is never hidden by acknowledgement. */
  urgent?: boolean;
  /** Early warning from a combined rule, before any single measure reaches its alert level. */
  predictive?: boolean;
  /** Optional context shown with the finding when supported by the data. */
  note?: string;
}

export interface SystemStatus {
  system: SystemKey;
  status: Status;
  trend: Trend;
  findings: Finding[];
  urgent: boolean;
}

/** Level shown to people (SATS-style): 0 no signal, 1 observation, 2 alert, 3 urgent. */
export type Level = 0 | 1 | 2 | 3;

export interface AlertState {
  status: 'acknowledged';
  day: number;
  severity: Finding['severity']; // severity when acknowledged; a worse one re-opens the alert
}

// ---- Privacy ------------------------------------------------------------

export type DataCategory =
  | 'vitals' // heart, BP, SpO2, skin temp, sleep, exercise
  | 'blood' // daily finger-prick panel
  | 'urine' // urinalysis
  | 'environment'
  | 'reaction' // PVT result
  | 'mentalStatus' // green / yellow / red + trend only
  | 'checkInAnswers' // mood, stress, energy, connection, symptoms
  | 'journal'; // never leaves the owner

export type Audience = 'cmo' | 'ground';

/** What each crew member has chosen to share. Everything else is fixed by policy (see privacy.ts). */
export interface SharingSettings {
  checkInAnswersToCmo: boolean;
  checkInAnswersToGround: boolean;
  mentalStatusToGround: boolean;
}

export interface AccessLogEntry {
  viewerId: string;
  subjectId: string;
  day: number;
  categories: DataCategory[];
}

export interface FollowUp {
  id: string;
  memberId: string;
  findingId: string;
  text: string;
  status: 'pending' | 'done';
  createdDay: number;
  note?: string;
}
