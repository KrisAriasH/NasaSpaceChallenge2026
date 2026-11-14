import type { Environment, MemberDay, SystemKey, SystemStatus, VisionResult } from '../types';
import { SYSTEM_LABEL } from '../engine/guidance';
import { StatusPill, TrendArrow } from './ui';

interface SystemCardsProps {
  systems: SystemStatus[];
  dayData: MemberDay;
  environment: Environment;
  vision?: VisionResult;
  compactStatus?: boolean;
}

function metricsFor(system: SystemKey, dayData: MemberDay, environment: Environment, vision?: VisionResult): string[] {
  switch (system) {
    case 'cardio':
      return [
        `Resting HR ${dayData.vitals.restingHR} bpm`,
        `BP ${dayData.vitals.systolicBP}/${dayData.vitals.diastolicBP} mmHg`,
        `SpO2 ${dayData.vitals.spo2}%`,
      ];
    case 'blood':
      return [
        `Leukocytes ${dayData.blood.leukocytes.toFixed(1)} ×10⁹/L`,
        `Lymphocytes ${dayData.blood.lymphocytes.toFixed(1)} ×10⁹/L`,
        `Vitamin D ${dayData.blood.vitaminD.toFixed(1)} ng/mL`,
      ];
    case 'immune':
      return [
        `Temperature ${dayData.vitals.skinTemp.toFixed(1)} °C`,
        `Leukocytes ${dayData.blood.leukocytes.toFixed(1)} ×10⁹/L`,
        `Lymphocytes ${dayData.blood.lymphocytes.toFixed(1)} ×10⁹/L`,
      ];
    case 'bone':
      return [
        `Exercise ${dayData.vitals.exerciseMin} min`,
        `Vitamin D ${dayData.blood.vitaminD.toFixed(1)} ng/mL`,
      ];
    case 'mental':
      return [
        `Mood ${dayData.checkIn.mood}/5`,
        `Stress ${dayData.checkIn.stress}/5`,
        `Sleep ${dayData.vitals.sleepHours.toFixed(1)} h`,
      ];
    case 'environment':
      return [
        `CO₂ ${environment.co2.toFixed(1)} mmHg`,
        `Radiation ${environment.radiationMSv.toFixed(2)} mSv/day`,
        `Cabin ${environment.cabinTemp.toFixed(1)} °C`,
      ];
    case 'vision':
      return vision
        ? [`Acuity step ${vision.acuityStep}/8`, `Amsler marks ${vision.amslerMarks.length}`]
        : ['No vision test recorded'];
    default:
      return [];
  }
}

export function SystemCards({ systems, dayData, environment, vision, compactStatus = false }: SystemCardsProps) {
  return (
    <div className="systems">
      {systems.map((system) => (
        <div key={system.system} className={`system system-${system.status}`}>
          <span className="system-name">{SYSTEM_LABEL[system.system]}</span>
          <span className="system-status">
            <StatusPill status={system.status} urgent={system.urgent} small={compactStatus} />
            <TrendArrow trend={system.trend} />
          </span>
          <div className="system-metrics">
            {metricsFor(system.system, dayData, environment, vision).map((metric) => <span key={metric}>{metric}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
