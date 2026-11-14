import type React from 'react';
import { useState } from 'react';
import type { Finding } from '../types';
import { communicationNote, GUIDANCE, RULESET_VERSION, RULE_REVIEW, SYSTEM_LABEL } from '../engine/guidance';
import { memberById } from '../data/crew';
import { useStore } from '../store';
import { Private } from './ui';

/**
 * Findings the viewer may not read are grouped into one card per person and system,
 * so the medical officer knows something is there without seeing what it is.
 */
export function PrivateSignals({ findings, showName }: { findings: Finding[]; showName?: boolean }) {
  const { go } = useStore();
  const first = findings[0];
  const member = memberById(first.memberId);
  const name = member.name.split(' ')[0];
  const n = findings.length;
  const red = findings.some((f) => f.severity === 'red');
  return (
    <article className={`finding sev-${red ? 'red' : 'yellow'}`}>
      <div className="finding-head">
        <div>
          {showName && (
            <button className="link" onClick={() => go('member', member.id)}>
              {member.name}
            </button>
          )}
          <span className="finding-system">{SYSTEM_LABEL[first.system]}</span>
        </div>
        <Private />
      </div>
      <h3>
        {n} private signal{n > 1 ? 's' : ''}
      </h3>
      <p className="muted">
        From {name}’s private check-in. {n > 1 ? 'They count' : 'It counts'} toward the {SYSTEM_LABEL[first.system].toLowerCase()} status;
        the answers are visible only if {name} chooses to share them.
      </p>
    </article>
  );
}

/** Splits findings into readable cards and grouped private cards, in severity order. */
export function FindingList({ findings, showName, groups }: { findings: Finding[]; showName?: boolean; groups?: boolean }) {
  const { can, isAcknowledged } = useStore();
  if (groups) {
    const urgent = findings.filter((f) => f.urgent);
    const fresh = findings.filter((f) => !f.urgent && !isAcknowledged(f));
    const acked = findings.filter((f) => !f.urgent && isAcknowledged(f));
    return (
      <div className="stack">
        {urgent.length > 0 && <h2 className="group-title urgent">Urgent</h2>}
        {urgent.length > 0 && <FindingList findings={urgent} showName={showName} />}
        <h2 className="group-title">New ({fresh.length})</h2>
        {fresh.length > 0 ? <FindingList findings={fresh} showName={showName} /> : <p className="muted">Nothing new.</p>}
        {acked.length > 0 && (
          <details className="acked-group">
            <summary>Acknowledged ({acked.length}): shown again only if they get worse</summary>
            <FindingList findings={acked} showName={showName} />
          </details>
        )}
      </div>
    );
  }
  const rank = (f: Finding) => (f.urgent ? 0 : f.severity === 'red' ? 1 : f.predictive ? 2 : 3);
  const sorted = [...findings].sort((a, b) => rank(a) - rank(b));
  const items: React.ReactNode[] = [];
  const grouped = new Map<string, Finding[]>();
  for (const f of sorted) {
    if (can(f.memberId, f.reveals)) {
      items.push(<FindingCard key={`${f.memberId}-${f.id}`} finding={f} showName={showName} />);
    } else {
      const key = `${f.memberId}-${f.system}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
        items.push(<PrivateSlot key={key} id={key} />);
      }
      grouped.get(key)!.push(f);
    }
  }
  return (
    <div className="stack">
      {items.map((it) => {
        const el = it as React.ReactElement<{ id?: string }>;
        if (el.type === PrivateSlot) {
          return <PrivateSignals key={el.key} findings={grouped.get(el.props.id!)!} showName={showName} />;
        }
        return it;
      })}
    </div>
  );
}

function PrivateSlot(_: { id: string }) {
  return null;
}

/** One readable finding, with a way to assign a follow-up. */
export function FindingCard({ finding, showName }: { finding: Finding; showName?: boolean }) {
  const { can, addFollowUp, data, go, isAcknowledged, acknowledge, unacknowledge, viewer, environmentId } = useStore();
  const acked = isAcknowledged(finding);
  const canAck = viewer.id !== finding.memberId && !finding.urgent;
  const visible = can(finding.memberId, finding.reveals);
  const g = GUIDANCE[finding.id];
  const [choice, setChoice] = useState(g.actions[0]);
  const assigned = data.followUps.some((f) => f.memberId === finding.memberId && f.findingId === finding.id && f.status === 'pending');
  const member = memberById(finding.memberId);

  return (
    <article className={`finding sev-${finding.urgent ? 'urgent' : finding.severity}${acked ? ' acked' : ''}`}>
      <div className="finding-head">
        <div>
          {showName &&
            (finding.system === 'environment' ? (
              <strong>Whole crew</strong>
            ) : (
              <button className="link" onClick={() => go('member', member.id)}>
                {member.name}
              </button>
            ))}
          <span className="finding-system">{SYSTEM_LABEL[finding.system]}</span>
          {finding.urgent && <span className="badge badge-urgent">Urgent</span>}
          {finding.predictive && <span className="badge badge-predict">Early warning</span>}
        </div>
        {canAck &&
          (acked ? (
            <button className="btn-ghost small" onClick={() => unacknowledge(finding)}>Mark as new</button>
          ) : (
            <button className="btn-ghost small" onClick={() => acknowledge(finding)}>Acknowledge</button>
          ))}
      </div>
      {visible ? (
        <>
          <h3>{g.title}</h3>
          <p className="muted">{finding.message}</p>
          {finding.note && <p className="context-note">{finding.note}</p>}
          {communicationNote(environmentId, finding) && <p className="context-note">{communicationNote(environmentId, finding)}</p>}
          <div className="assign">
            <label className="sr-only" htmlFor={`act-${finding.memberId}-${finding.id}`}>
              Suggested action
            </label>
            <select id={`act-${finding.memberId}-${finding.id}`} value={choice} onChange={(e) => setChoice(e.target.value)}>
              {g.actions.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <button
              className="btn"
              disabled={assigned}
              onClick={() => addFollowUp({ memberId: finding.memberId, findingId: finding.id, text: choice })}
            >
              {assigned ? 'Follow-up open' : 'Assign follow-up'}
            </button>
          </div>
          <p className="rule-line">
            Rule <code>{finding.id}</code> · ruleset {RULESET_VERSION} · {RULE_REVIEW}
          </p>
        </>
      ) : null}
    </article>
  );
}
