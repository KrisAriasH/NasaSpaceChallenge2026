import { useState } from 'react';
import type { Finding, ReportCategory } from '../types';
import { GUIDANCE } from '../engine/guidance';
import { patternsFor } from '../engine/patterns';
import { useStore } from '../store';
import { PageHeader, Panel, StatusPill } from '../components/ui';
import { SystemCards } from '../components/SystemCards';

const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'vitals', label: 'Vitals' },
  { value: 'blood', label: 'Blood' },
  { value: 'reaction', label: 'Reaction test' },
  { value: 'checkInAnswers', label: 'Check-in answers' },
  { value: 'patterns', label: 'Patterns' },
];

export function TodayPage() {
  const { viewer, day, history, assess, data, env, urineTests, visionResults, submitReport } = useStore();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>([]);
  const [reportMessage, setReportMessage] = useState('');
  const today = history(viewer.id).at(-1)!;
  const systems = assess(viewer.id);
  const findings = systems.flatMap((system) => system.findings).filter((finding) => finding.id !== 'mental-conversation');
  const mainFinding = [...findings].sort((a, b) => Number(b.severity === 'red' || b.urgent) - Number(a.severity === 'red' || a.urgent))[0];
  const reportState = findings.some((finding) => finding.severity === 'red' || finding.urgent || finding.id === 'risk-illness')
    ? 'report'
    : findings.length > 0
      ? 'watch'
      : 'clear';
  const patterns = patternsFor(history(viewer.id));
  const checkInDone = Boolean(data.checkIns[viewer.id]?.[day]);
  const reactionDone = Boolean(data.reactions[viewer.id]?.[day]);
  const bloodDone = Boolean(today.blood);
  const urineDue = day === 1 || day === 30;
  const urineDone = urineTests(viewer.id).some((test) => test.day === day);
  const environmentToday = env[day - 1];
  const latestVision = visionResults(viewer.id).filter((result) => result.day <= day).at(-1);
  const openReport = () => {
    const reveals = findings.map((finding) => finding.reveals as ReportCategory);
    setSelectedFindings(findings.map((finding) => finding.id));
    setSelectedCategories([...new Set(reveals.filter((category) => REPORT_CATEGORIES.some((option) => option.value === category)))]);
    setReportOpen(true);
    setReportSent(false);
  };

  const toggle = <T,>(current: T[], value: T, set: (next: T[]) => void) =>
    set(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Today">
        <button type="button" className={reportState === 'report' ? 'btn' : 'btn-ghost'} onClick={openReport}>Report to medical officer</button>
      </PageHeader>

      <Panel className={`today-status today-${reportState}`}>
        <StatusPill status={reportState === 'clear' ? 'green' : reportState === 'watch' ? 'yellow' : 'red'} />
        <h2>
          {reportState === 'clear'
            ? 'No issues detected today'
            : reportState === 'watch'
              ? 'Watch'
              : 'Report to the medical officer recommended'}
        </h2>
        <p className="muted">{mainFinding ? mainFinding.message : 'No finding has been recorded today.'}</p>
      </Panel>

      {reportOpen && (
        <Panel title="Report to medical officer">
          <p className="muted small">Select the findings and data categories to share for mission day {day}. Journal text is never included.</p>
          <fieldset>
            <legend>Findings</legend>
            <div className="report-options">
              {findings.length === 0 ? <p className="muted small">No findings selected.</p> : findings.map((finding) => (
                <label key={finding.id} className="toggle">
                  <input type="checkbox" checked={selectedFindings.includes(finding.id)} onChange={() => toggle(selectedFindings, finding.id, setSelectedFindings)} />
                  <span>{finding.message}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Categories</legend>
            <div className="report-options">
              {REPORT_CATEGORIES.map((category) => (
                <label key={category.value} className="toggle">
                  <input type="checkbox" checked={selectedCategories.includes(category.value)} onChange={() => toggle(selectedCategories, category.value, setSelectedCategories)} />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Message</span>
            <textarea rows={3} maxLength={500} value={reportMessage} onChange={(event) => setReportMessage(event.target.value)} />
          </label>
          <div className="row">
            <button type="button" className="btn" disabled={selectedFindings.length === 0 && selectedCategories.length === 0} onClick={() => {
              submitReport({ memberId: viewer.id, day, includes: selectedCategories, findingIds: selectedFindings, message: reportMessage.trim() || undefined });
              setReportSent(true);
              setReportOpen(false);
            }}>Send report</button>
            <button type="button" className="btn-ghost" onClick={() => setReportOpen(false)}>Cancel</button>
          </div>
        </Panel>
      )}
      {reportSent && <p className="muted small">Report sent for mission day {day}.</p>}

      <Panel title="Today's tasks">
        <ul className="task-list">
          <li className={checkInDone ? 'task-done' : 'task-pending'}><span>Check-in</span><strong>{checkInDone ? 'Done' : 'Pending'}</strong></li>
          <li className={reactionDone ? 'task-done' : 'task-pending'}><span>Reaction test</span><strong>{reactionDone ? 'Done' : 'Pending'}</strong></li>
          <li className={bloodDone ? 'task-done' : 'task-pending'}><span>Blood panel</span><strong>{bloodDone ? 'Done' : 'Pending'}</strong></li>
          {urineDue && <li className={urineDone ? 'task-done' : 'task-pending'}><span>Urine exam</span><strong>{urineDone ? 'Done' : 'Pending'}</strong></li>}
        </ul>
      </Panel>

      <Panel title="Systems">
        <SystemCards systems={systems} dayData={today} environment={environmentToday} vision={latestVision} compactStatus />
      </Panel>

      <Panel title="Findings">
        {findings.length === 0 ? <p className="muted">No findings are active today.</p> : (
          <div className="stack">
            {findings.map((finding) => <FindingSummary key={finding.id} finding={finding} />)}
          </div>
        )}
      </Panel>

      {patterns.length > 0 && <p className="muted small">Patterns are available on the Patterns page and remain private unless included in a report.</p>}
    </>
  );
}

function FindingSummary({ finding }: { finding: Finding }) {
  const guidance = GUIDANCE[finding.id];
  return (
    <article className={`finding sev-${finding.severity}`}>
      <h3>{guidance.title}</h3>
      <p className="muted">{finding.message}</p>
      <ul>{guidance.actions.map((action) => <li key={action}>{action}</li>)}</ul>
    </article>
  );
}
