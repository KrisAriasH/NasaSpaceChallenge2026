import type { Finding, SystemKey } from '../types';
import type { EnvironmentId } from '../data/environments';

/**
 * Suggested actions per finding. The medical officer assigns one as a follow-up;
 * the crew member sees it in "My status".
 * `source`: TODO for the science lead unless a reference is given.
 */
export interface Guidance {
  title: string;
  actions: string[];
  source: string;
}

export const GUIDANCE: Record<string, Guidance> = {
  'cardio-hr': {
    title: 'Elevated resting heart rate',
    actions: ['Re-measure after 5 minutes of seated rest', 'Check fluid intake today', 'Moderate exercise only until it settles'],
    source: 'TODO',
  },
  'cardio-hrv': {
    title: 'Low heart-rate variability',
    actions: ['Protect tonight’s sleep window', '5 minutes of slow breathing before bed', 'Review workload for the next 48 h'],
    source: 'TODO',
  },
  'cardio-bp': {
    title: 'Blood pressure high',
    actions: ['Re-measure twice, 1 minute apart', 'Note caffeine and sodium intake'],
    source: 'TODO',
  },
  'cardio-bp-low': {
    title: 'Blood pressure low',
    actions: ['Re-measure seated and standing', 'Check fluid intake and dizziness', 'Avoid sudden position changes'],
    source: 'Consulting physician: keep above 90/60 mmHg',
  },
  'bone-exercise': {
    title: 'Exercise below target',
    actions: ['Schedule resistive exercise before optional tasks', 'Protect the exercise slot in tomorrow’s plan'],
    source: 'TODO: NASA HRP bone loss countermeasures',
  },
  'immune-temp': {
    title: 'Raised skin temperature',
    actions: ['Re-check in 2 hours', 'Rest and hydrate', 'Limit close contact with the crew'],
    source: 'TODO',
  },
  'risk-illness': {
    title: 'Early signs of possible illness',
    actions: ['Rest and hydrate today', 'Limit close contact with the crew', 'Repeat the blood panel and temperature tomorrow', 'Ask about symptoms at the next check-in'],
    source: 'TODO: wearable early-detection studies (resting HR, HRV, skin temperature before symptom onset)',
  },
  'immune-critical': {
    title: 'Fever with shortness of breath',
    actions: ['Assess now following the onboard medical checklist', 'Contact the flight surgeon at the first opportunity'],
    source: 'TODO: consulting physician',
  },
  'cardio-spo2': {
    title: 'Low blood oxygen',
    actions: ['Re-measure immediately', 'Check cabin oxygen and CO2', 'Follow the onboard medical checklist'],
    source: 'TODO: consulting physician',
  },
  'immune-symptoms': {
    title: 'Symptoms reported',
    actions: ['Keep logging symptoms daily', 'Prioritize sleep'],
    source: 'TODO',
  },
  'mental-sleep': {
    title: 'Short sleep',
    actions: ['Fixed sleep window tonight', 'Check light, noise and temperature in crew quarters', 'No caffeine in the 6 h before sleep'],
    source: 'TODO: NASA HRP sleep and circadian risk',
  },
  'mental-fatigue': {
    title: 'Slower reaction test',
    actions: ['Avoid safety-critical tasks while fatigued', 'Plan a recovery sleep', 'Repeat the test tomorrow'],
    source: 'Psychomotor Vigilance Test, NASA Cognition battery',
  },
  'mental-mood': {
    title: 'Low mood',
    actions: ['Schedule a private call with family or friends', 'Share a meal or non-work activity with the crew'],
    source: 'TODO: NASA HRP behavioral health risk',
  },
  'mental-stress': {
    title: 'High stress',
    actions: ['Agree the top 3 tasks for tomorrow and defer the rest', '10-minute break every 2 hours'],
    source: 'TODO',
  },
  'mental-energy': {
    title: 'Low energy',
    actions: ['Review sleep and workload together', 'Short daylight-spectrum light exposure in the morning'],
    source: 'TODO',
  },
  'mental-connection': {
    title: 'Feeling isolated',
    actions: ['Schedule a family call at the next communication window', 'Plan a shared crew activity'],
    source: 'TODO',
  },
  'mental-conversation': {
    title: 'Private conversation recommended',
    actions: ['Find a private moment to check in, without referring to specific answers', 'Offer a private conference with the ground behavioral health team'],
    source: 'TODO',
  },
  'blood-iron': {
    title: 'Iron below personal normal',
    actions: ['Review iron intake in the menu with the crew', 'Repeat panel tomorrow and watch the trend'],
    source: 'TODO: consulting physician',
  },
  'blood-vitd': {
    title: 'Low vitamin D',
    actions: ['Check vitamin D supplement adherence', 'Combine with resistive exercise to protect bone'],
    source: 'TODO: consulting physician / NASA HRP bone risk',
  },
  'blood-cortisol': {
    title: 'High stress hormone',
    actions: ['Review workload and sleep', 'Offer a check-in conversation'],
    source: 'TODO: consulting physician',
  },
  'immune-wbc': {
    title: 'Leukocytes above personal normal',
    actions: ['Check for signs of infection', 'Re-check temperature and symptoms', 'Repeat panel tomorrow'],
    source: 'TODO: consulting physician',
  },
  'immune-lymph': {
    title: 'Lymphocytes above personal normal',
    actions: ['Check for signs of infection (fever, sore throat, congestion)', 'Re-check temperature and symptoms', 'Repeat the blood panel tomorrow'],
    source: 'Consulting physician',
  },
  'immune-lymph-low': {
    title: 'Lymphocytes below personal normal',
    actions: ['Watch for infections and latent virus reactivation symptoms', 'Prioritize sleep and limit close contact'],
    source: 'TODO: consulting physician / NASA immune risk',
  },
  'urine-uti': {
    title: 'Possible urinary infection',
    actions: ['Start the onboard urinary infection protocol with the flight surgeon', 'Increase fluid intake', 'Repeat the test in 48 hours'],
    source: 'Consulting physician',
  },
  'urine-blood': {
    title: 'Blood detected in urine',
    actions: ['Repeat the test', 'Report to the flight surgeon today'],
    source: 'Consulting physician',
  },
  'urine-protein': {
    title: 'Protein detected in urine',
    actions: ['Repeat the test', 'Report to the flight surgeon'],
    source: 'Consulting physician',
  },
  'urine-dehydration': {
    title: 'Concentrated urine',
    actions: ['Increase fluid intake', 'Repeat the test tomorrow'],
    source: 'Consulting physician',
  },
  'urine-ph': {
    title: 'Urine pH outside range',
    actions: ['Review diet and fluids', 'Watch for kidney stone symptoms'],
    source: 'Consulting physician',
  },
  'urine-clarity': {
    title: 'Urine clarity changed',
    actions: ['Repeat the test', 'Report persistent cloudiness to the flight surgeon'],
    source: 'Consulting physician',
  },
  'immune-eos-baso': {
    title: 'Possible allergic reaction',
    actions: ['Ask about new exposures (food, materials, dust)', 'Check skin and breathing symptoms'],
    source: 'TODO: consulting physician',
  },
  'rad-career': {
    title: 'Career radiation dose rising',
    actions: ['Prioritize shielded areas for this person’s work and sleep', 'Plan shelter first for this person in the next solar event', 'Report to the ground radiation team'],
    source: 'NASA OCHMO Radiation Protection technical brief (600 mSv career limit)',
  },
  'rad-blood': {
    title: 'Blood cells low after a radiation dose',
    actions: ['Repeat the blood panel tomorrow', 'Check for infections and unusual fatigue', 'Report the dose and blood values to the flight surgeon'],
    source: 'TODO: consulting physician (lymphocyte depletion as a radiation biomarker)',
  },
  'env-radiation': {
    title: 'Radiation spike: take shelter',
    actions: ['Move the crew to the storm shelter', 'Stay until dose returns to background', 'Log time outside the shelter'],
    source: 'NASA OCHMO Radiation Protection technical brief',
  },
  'env-co2': {
    title: 'High cabin CO2',
    actions: ['Check the CO2 removal system', 'Improve airflow in work and sleep areas', 'Watch for headaches and poor sleep'],
    source: 'NASA OCHMO Carbon Dioxide technical brief',
  },
  'env-dust': {
    title: 'Surface dust symptoms',
    actions: ['Check suit and airlock dust procedures; rinse eyes; report if it persists.'],
    source: 'NASA human spaceflight risk: planetary dust',
  },
  'vision-change': {
    title: 'Vision change',
    actions: ['Repeat the test tomorrow', 'Schedule an eye exam (OCT/fundoscopy) with the medical officer', 'Report headache with blurred vision'],
    source: 'NASA human spaceflight risk: SANS',
  },
};

export function communicationNote(environmentId: EnvironmentId, finding: Finding): string | null {
  if (finding.severity !== 'red' && !finding.urgent) return null;
  if (environmentId === 'mars')
    return 'Ground response takes about 6 to 44 minutes round trip. Decide the first steps with the medical officer.';
  if (environmentId === 'leo') return 'The flight surgeon can be contacted directly.';
  return null;
}

/** Rule metadata shown with every alert, so the medical officer knows which rule fired and its review status. */
export const RULESET_VERSION = 'v1';
export const RULE_REVIEW = 'pending review by the team’s consulting physician';

export const SYSTEM_LABEL: Record<SystemKey, string> = {
  cardio: 'Heart & rhythm',
  blood: 'Blood panel',
  bone: 'Bone & muscle',
  immune: 'Immune',
  mental: 'Mental health',
  environment: 'Radiation & cabin',
  vision: 'Vision',
};

