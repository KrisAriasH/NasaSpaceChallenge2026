import { communicationNote, GUIDANCE } from '../engine/guidance';
import { useStore } from '../store';
import { PageHeader, Panel } from '../components/ui';
import { SystemCards } from '../components/SystemCards';

/** The crew member's own view: their status, what to do, and what the medical officer assigned. */
export function MyStatus() {
  const { viewer, assess, data, setFollowUpStatus, day, go, environmentId, history, env, visionResults } = useStore();
  const systems = assess(viewer.id);
  const dayData = history(viewer.id).at(-1)!;
  const latestVision = visionResults(viewer.id).filter((result) => result.day <= day).at(-1);
  const findings = systems.flatMap((s) => s.findings).filter((f) => f.id !== 'mental-conversation');
  const assigned = data.followUps.filter((f) => f.memberId === viewer.id);
  const checkedIn = data.checkIns[viewer.id]?.[day];

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title={`Hello, ${viewer.name.split(' ')[0]}`}>
        {!checkedIn && (
          <button className="btn" onClick={() => go('checkin')}>Do today’s check-in</button>
        )}
      </PageHeader>

      <SystemCards systems={systems} dayData={dayData} environment={env[day - 1]} vision={latestVision} />

      <div className="two-col">
        <Panel title="From your medical officer">
          {assigned.length === 0 ? (
            <p className="muted">Nothing assigned.</p>
          ) : (
            <ul className="todo">
              {assigned.map((f) => (
                <li key={f.id} className={f.status === 'done' ? 'done' : ''}>
                  <label>
                    <input id={`fu-${f.id}`} type="checkbox" checked={f.status === 'done'} onChange={() => setFollowUpStatus(f.id, f.status === 'done' ? 'pending' : 'done')} />
                    <span>
                      {f.text}
                      <span className="muted small"> · {GUIDANCE[f.findingId].title}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="What you can do today">
          {findings.length === 0 ? (
            <p className="muted">You are within your normal range. Keep your routine.</p>
          ) : (
            <div className="stack">
              {findings.map((f) => (
                <article key={f.id} className={`finding sev-${f.severity}`}>
                  <h3>{GUIDANCE[f.id].title}</h3>
                  <p className="muted">{f.message}</p>
                  {communicationNote(environmentId, f) && <p className="context-note">{communicationNote(environmentId, f)}</p>}
                  <ul>
                    {GUIDANCE[f.id].actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
