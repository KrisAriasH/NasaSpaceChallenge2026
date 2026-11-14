import { useMemo } from 'react';
import { evaluate } from '../engine/evaluation';
import { RULESET_VERSION, RULE_REVIEW } from '../engine/guidance';
import { PageHeader, Panel } from '../components/ui';

/** How well the rules detect the problems injected in the demo scenario. */
export function Validation() {
  const e = useMemo(() => evaluate(), []);
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  return (
    <>
      <PageHeader eyebrow={`Ruleset ${RULESET_VERSION}`} title="How the alerts perform" />
      <div className="kpis">
        <div className="kpi"><span>{e.detected}/{e.events.length}</span>events detected</div>
        <div className="kpi"><span>{pct(e.specificity)}</span>healthy days without alerts</div>
        <div className="kpi"><span>{e.falseAlarmDays}</span>false-alarm days of {e.healthyDays}</div>
        <div className="kpi"><span>{e.meanDelay.toFixed(1)}</span>days on average to detect</div>
      </div>
      <Panel title="Injected events">
        <div className="table-wrap">
          <table className="list">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Change starts</th>
                <th scope="col">First alert</th>
                <th scope="col">Delay</th>
                <th scope="col">Before symptoms</th>
              </tr>
            </thead>
            <tbody>
              {e.events.map((r) => (
                <tr key={r.event.label}>
                  <td>{r.event.label}</td>
                  <td className="num">day {r.event.start}</td>
                  <td className="num">{r.firstAlertDay ? `day ${r.firstAlertDay}` : 'missed'}</td>
                  <td className="num">{r.delayDays === null ? '—' : `${r.delayDays} d`}</td>
                  <td className="num">{r.leadBeforeSymptoms === null ? '—' : `${r.leadBeforeSymptoms} d earlier`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Measured on the simulated mission, so these numbers describe the demo scenario, not real-world accuracy. The false alarms are
          alerts that stayed on for a couple of days after a recovery. Thresholds are {RULE_REVIEW}. Real validation needs clinical data and
          sensitivity, specificity and predictive values per group, as the SATS method proposes.
        </p>
      </Panel>
    </>
  );
}
