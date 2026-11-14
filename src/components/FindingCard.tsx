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
export function PrivateSignals({ findings, showName, number }: { findings: Finding[]; showName?: boolean; number?: number }) {
  const { go } = useStore();
  const first = findings[0];
  const member = memberById(first.memberId);
  const name = member.name.split(' ')[0];
  const n = findings.length;
  const red = findings.some((f) => f.severity === 'red' || f.urgent);
  return (
    <article className={`finding sev-${red ? 'red' : 'yellow'}`}>
      <div className="finding-head">
        <div>
          {number !== undefined && <span className="alert-number" aria-label={`Alert ${number}`}>{number}</span>}
          {showName && (
            <button className="link" onClick={() => go('member', member.id)}>
              {member.name}
            </button>
          )}
          <span className="finding-system">{SYSTEM_LABEL[first.system]}</span>
          {red && <span className="badge badge-status-red">Status: Red</span>}
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
export function FindingList({
  findings,
  showName,
  groups,
  numbered = false,
  startNumber = 1,
}: {
  findings: Finding[];
  showName?: boolean;
  groups?: boolean;
  numbered?: boolean;
  startNumber?: number;
}) {
  const { can, isAcknowledged } = useStore();
  const rank = (f: Finding) => (f.urgent ? 0 : f.severity === 'red' ? 1 : f.predictive ? 2 : 3);
  const countCards = (list: Finding[]) => {
    const privateGroups = new Set<string>();
    let count = 0;
    for (const f of [...list].sort((a, b) => rank(a) - rank(b))) {
      if (can(f.memberId, f.reveals)) {
        count += 1;
      } else {
        const key = `${f.memberId}-${f.system}`;
        if (!privateGroups.has(key)) {
          privateGroups.add(key);
          count += 1;
        }
      }
    }
    return count;
  };
  if (groups) {
    const urgent = findings.filter((f) => f.urgent);
    const fresh = findings.filter((f) => !f.urgent && !isAcknowledged(f));
    const acked = findings.filter((f) => !f.urgent && isAcknowledged(f));
    const freshStart = startNumber + countCards(urgent);
    const ackedStart = freshStart + countCards(fresh);
    return (
      <div className="stack">
        {urgent.length > 0 && <h2 className="group-title urgent">Urgent</h2>}
        {urgent.length > 0 && <FindingList findings={urgent} showName={showName} numbered={numbered} startNumber={startNumber} />}
        <h2 className="group-title">New ({fresh.length})</h2>
        {fresh.length > 0 ? (
          <FindingList findings={fresh} showName={showName} numbered={numbered} startNumber={freshStart} />
        ) : (
          <p className="muted">Nothing new.</p>
        )}
        {acked.length > 0 && (
          <details className="acked-group">
            <summary>Acknowledged ({acked.length}): shown again only if they get worse</summary>
            <FindingList findings={acked} showName={showName} numbered={numbered} startNumber={ackedStart} />
          </details>
        )}
      </div>
    );
  }
  const sorted = [...findings].sort((a, b) => rank(a) - rank(b));
  const items: Array<
    | { kind: 'finding'; finding: Finding; number?: number }
    | { kind: 'private'; id: string; findings: Finding[]; number?: number }
  > = [];
  const grouped = new Map<string, Finding[]>();
  let nextNumber = startNumber;
  for (const f of sorted) {
    if (can(f.memberId, f.reveals)) {
      items.push({ kind: 'finding', finding: f, number: numbered ? nextNumber : undefined });
      nextNumber += 1;
    } else {
      const key = `${f.memberId}-${f.system}`;
      if (!grouped.has(key)) {
        const privateFindings: Finding[] = [];
        grouped.set(key, privateFindings);
        const number = numbered ? nextNumber : undefined;
        items.push({ kind: 'private', id: key, findings: privateFindings, number });
        nextNumber += 1;
      }
      grouped.get(key)!.push(f);
    }
  }
  return (
    <div className="stack">
      {items.map((item) => {
        if (item.kind === 'private') {
          return <PrivateSignals key={item.id} findings={item.findings} showName={showName} number={item.number} />;
        }
        return (
          <FindingCard
            key={`${item.finding.memberId}-${item.finding.id}`}
            finding={item.finding}
            showName={showName}
            number={item.number}
          />
        );
      })}
    </div>
  );
}

/** One readable finding, with a way to assign a follow-up. */
export function FindingCard({ finding, showName, number }: { finding: Finding; showName?: boolean; number?: number }) {
  const { can, addFollowUp, data, go, history, isAcknowledged, acknowledge, unacknowledge, viewer, environmentId } = useStore();
  const acked = isAcknowledged(finding);
  const canAck = viewer.id !== finding.memberId && !finding.urgent;
  const visible = can(finding.memberId, finding.reveals);
  const g = GUIDANCE[finding.id];
  const [choice, setChoice] = useState(g.actions[0]);
  const assigned = data.followUps.some((f) => f.memberId === finding.memberId && f.findingId === finding.id && f.status === 'pending');
  const member = memberById(finding.memberId);
  const recent = visible ? history(finding.memberId).slice(-3) : [];
  const latest = recent[recent.length - 1];
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const telemetry =
    finding.id === 'mental-sleep' && recent.length > 0
      ? [{ label: 'Sleep', value: `${average(recent.map((d) => d.vitals.sleepHours)).toFixed(1)} h`, detail: '3-day average' }]
      : finding.id === 'mental-fatigue' && recent.length > 0
        ? [
            {
              label: 'Reaction',
              value: `${average(recent.map((d) => d.reaction.meanMs)).toFixed(0)} ms`,
              detail: `${average(recent.map((d) => d.reaction.lapses)).toFixed(1)} lapses`,
            },
          ]
        : finding.id === 'immune-temp' && latest
          ? [{ label: 'Skin temp', value: `${latest.vitals.skinTemp.toFixed(1)} °C`, detail: 'Today' }]
          : finding.id === 'risk-illness' && latest
            ? [
                { label: 'Sleep', value: `${latest.vitals.sleepHours.toFixed(1)} h`, detail: 'Today' },
                { label: 'Skin temp', value: `${latest.vitals.skinTemp.toFixed(1)} °C`, detail: 'Today' },
                { label: 'Resting HR', value: `${latest.vitals.restingHR.toFixed(0)} bpm`, detail: 'Today' },
                { label: 'HRV', value: `${latest.vitals.hrv.toFixed(0)} ms`, detail: 'Today' },
              ]
            : [];
  const red = finding.severity === 'red' || finding.urgent;

  return (
    <article className={`finding sev-${finding.urgent ? 'urgent' : finding.severity}${acked ? ' acked' : ''}`}>
      <div className="finding-head">
        <div>
          {number !== undefined && <span className="alert-number" aria-label={`Alert ${number}`}>{number}</span>}
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
          {red && <span className="badge badge-status-red">Status: Red</span>}
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
          {telemetry.length > 0 && (
            <div className="alert-telemetry" aria-label="Alert telemetry">
              {telemetry.map((item) => (
                <div className="alert-telemetry-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>
          )}
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
