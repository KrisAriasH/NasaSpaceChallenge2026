export type EnvironmentId = 'leo' | 'transit' | 'moon' | 'mars';

export interface MissionEnvironment {
  id: EnvironmentId;
  name: string;
  gravityG: number;
  radiationBackgroundMSvPerDay: number;
  oneWayDelay: string;
  dust: boolean;
}

export const ENVIRONMENTS: Record<EnvironmentId, MissionEnvironment> = {
  leo: {
    id: 'leo',
    name: 'Low Earth orbit station',
    gravityG: 0,
    radiationBackgroundMSvPerDay: 0.5, // PLACEHOLDER: verify with sources
    oneWayDelay: 'seconds',
    dust: false,
  },
  transit: {
    id: 'transit',
    name: 'Deep-space transit',
    gravityG: 0,
    radiationBackgroundMSvPerDay: 1.8, // PLACEHOLDER: verify with sources
    oneWayDelay: 'seconds to minutes',
    dust: false,
  },
  moon: {
    id: 'moon',
    name: 'Lunar surface base',
    gravityG: 0.17,
    radiationBackgroundMSvPerDay: 1.4, // PLACEHOLDER: verify with sources
    oneWayDelay: 'about 1.3 seconds',
    dust: true,
  },
  mars: {
    id: 'mars',
    name: 'Mars surface base',
    gravityG: 0.38,
    radiationBackgroundMSvPerDay: 0.7, // PLACEHOLDER: verify with sources
    oneWayDelay: '3 to 22 minutes',
    dust: true,
  },
};

export function isEnvironmentId(value: unknown): value is EnvironmentId {
  return typeof value === 'string' && value in ENVIRONMENTS;
}
