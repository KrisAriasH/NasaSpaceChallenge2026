import { CREW, ROLE_LABEL } from '../data/crew';
import { SYSTEM_LABEL } from '../engine/guidance';
import { isMedicalReviewer } from '../engine/privacy';
import { SYSTEMS, overallStatus } from '../engine/rules';
import { useStore } from '../store';
import { PageHeader, Panel, StatusPill, TrendArrow } from '../components/ui';

export function CrewOverview() {
  const { viewer, assess, go, day, data } = useStore();
  const members = CREW.filter((m) => isMedicalReviewer(viewer, m));
  const rows = members.map((m) => ({ m, systems: assess(m.id) }));
  const counts = { red: 0, yellow: 0, green: 0 };
  rows.forEach((r) => counts[overallStatus(r.systems)]++);
  const open = data.followUps.filter((f) => f.status === 'pending').length;

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Crew overview" />
      <div className="kpis">
        <div className="kpi kpi-red"><span>{counts.red}</span>need action</div>
        <div className="kpi kpi-yellow"><span>{counts.yellow}</span>to watch</div>
        <div className="kpi kpi-green"><span>{counts.green}</span>nominal</div>
        <div className="kpi"><span>{open}</span>open follow-ups</div>
      </div>
      <Panel title="Status by system" aside={<span className="muted small">↗ improving · → stable · ↘ worsening (vs. 3 days ago)</span>}>
        <div className="table-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col">Crew member</th>
                {SYSTEMS.map((s) => (
                  <th key={s} scope="col">{SYSTEM_LABEL[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, systems }) => (
                <tr key={m.id} onClick={() => go('member', m.id)} className="clickable">
                  <th scope="row">
                    <button className="link" onClick={() => go('member', m.id)}>{m.name}</button>
                    <span className="muted small">{ROLE_LABEL[m.role]}</span>
                  </th>
                  {systems.map((s) => (
                    <td key={s.system}>
                      <StatusPill status={s.status} small /> <TrendArrow trend={s.trend} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Your own data is reviewed by the backup medical officer. Mental health shows the status only; answers stay private unless shared.
        </p>
      </Panel>
    </>
  );
}
