import { CREW, memberById, ROLE_LABEL } from '../data/crew';
import { GUIDANCE, SYSTEM_LABEL } from '../engine/guidance';
import { isMedicalReviewer } from '../engine/privacy';
import { SYSTEMS, overallStatus } from '../engine/rules';
import { useStore } from '../store';
import { PageHeader, Panel, StatusPill, TrendArrow } from '../components/ui';

export function CrewOverview() {
  const { viewer, assess, go, day, data, can, isAcknowledged } = useStore();
  const members = CREW.filter((m) => isMedicalReviewer(viewer, m));
  const rows = members.map((m) => ({ m, systems: assess(m.id) }));
  const counts = { red: 0, yellow: 0, green: 0 };
  rows.forEach((r) => counts[overallStatus(r.systems)]++);
  const open = data.followUps.filter((f) => f.status === 'pending').length;
  const findings = rows
    .flatMap((r) => r.systems.flatMap((s) => s.findings))
    .filter((f, i, all) => f.system !== 'environment' || all.findIndex((other) => other.id === f.id) === i);
  const urgent = findings.filter((f) => f.urgent);
  const decisions = findings
    .filter((f) => !isAcknowledged(f))
    .sort((a, b) => {
      const priority = (f: typeof a) => (f.urgent ? 0 : f.severity === 'red' ? 1 : f.predictive ? 2 : 3);
      return priority(a) - priority(b);
    })
    .slice(0, 3);

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Crew overview" />
      <div className="kpis">
        <div className="kpi kpi-red"><span>{counts.red}</span>with an alert</div>
        <div className="kpi kpi-yellow"><span>{counts.yellow}</span>under observation</div>
        <div className="kpi kpi-green"><span>{counts.green}</span>no signal</div>
        <div className="kpi"><span>{open}</span>open follow-ups</div>
      </div>
      {urgent.length > 0 && (
        <div className="urgent-banner" role="status">
          <div>
            <strong>{urgent.length} urgent {urgent.length === 1 ? 'decision' : 'decisions'}</strong>
            <span>Requires prompt review.</span>
          </div>
          <button className="btn-ghost" onClick={() => go('alerts')}>Review urgent</button>
        </div>
      )}
      <Panel title={`Decisions for you today · ${decisions.length}`} className="decision-panel">
        {decisions.length === 0 ? (
          <p className="muted">No active decisions today.</p>
        ) : (
          <ol className="decision-list">
            {decisions.map((finding, index) => {
              const member = memberById(finding.memberId);
              const subjectName = finding.system === 'environment' ? 'Habitat' : member.name.split(' ')[0];
              const visible = can(finding.memberId, finding.reveals);
              const badge = finding.severity === 'red'
                ? { label: 'Status: Red', className: 'pill-red' }
                : finding.predictive
                  ? { label: 'Observation', className: 'pill-observation' }
                  : { label: 'Alert', className: 'pill-yellow' };
              const title = visible
                ? `${subjectName}: ${finding.id === 'mental-conversation' ? 'private conversation' : GUIDANCE[finding.id].title.toLowerCase()}`
                : `${subjectName}: private signal`;
              const description = visible
                ? finding.message
                : 'A private signal needs a confidential check-in.';
              const action = finding.system === 'environment'
                ? { label: 'See environment', run: () => go('environment') }
                : finding.id === 'mental-conversation'
                  ? { label: 'Open guidance', run: () => go('member', member.id) }
                  : { label: 'Review evidence', run: () => go('member', member.id) };

              return (
                <li className="decision-row" key={`${finding.memberId}-${finding.id}`}>
                  <span className="decision-number" aria-hidden="true">{index + 1}</span>
                  <div className="decision-copy">
                    <h3>{title}</h3>
                    <p className="muted">{description}</p>
                  </div>
                  <span className={`pill decision-badge ${badge.className}`}>
                    <span className="pill-dot" aria-hidden="true" />
                    {badge.label}
                  </span>
                  <button className="btn-ghost decision-action" onClick={action.run}>{action.label}</button>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
      <Panel title="Status by system" aside={<span className="muted small">↗ improving · → stable · ↘ worsening (vs. 3 days ago) · “No signal” means nothing detected with the data available, not a diagnosis of health</span>}>
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
                      <StatusPill status={s.status} urgent={s.urgent} small /> <TrendArrow trend={s.trend} />
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
