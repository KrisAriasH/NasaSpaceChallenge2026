import { useEffect } from 'react';
import { memberById } from '../data/crew';
import { CATEGORY_LABEL, isMedicalReviewer } from '../engine/privacy';
import { useStore } from '../store';
import { PageHeader, Panel } from '../components/ui';

export function ReportsPage() {
  const { viewer, data, markReportRead, logReportView } = useStore();
  const reports = (data.reports ?? [])
    .filter((report) => isMedicalReviewer(viewer, memberById(report.memberId)))
    .slice()
    .sort((a, b) => b.day - a.day || b.id.localeCompare(a.id));

  useEffect(() => {
    reports.forEach((report) => logReportView(report));
    // Access records are deduplicated by viewer, subject and day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports.map((report) => report.id).join(',')]);

  return (
    <>
      <PageHeader title="Reports" />
      <Panel>
        {reports.length === 0 ? (
          <p className="muted">No reports have been received.</p>
        ) : (
          <div className="stack">
            {reports.map((report) => (
              <article key={report.id} className={`finding${report.readByCmo ? ' acked' : ''}`}>
                <div className="finding-head">
                  <h3>{memberById(report.memberId).name} · day {report.day}</h3>
                  <span className="muted small">{report.readByCmo ? 'Read' : 'Unread'}</span>
                </div>
                <p className="muted small">
                  Included: {report.includes.map((category) => category === 'patterns' ? 'Patterns' : CATEGORY_LABEL[category]).join(', ') || 'No categories'}
                </p>
                {report.findingIds.length > 0 && <p>Findings: {report.findingIds.join(', ')}</p>}
                {report.message && <p className="muted">{report.message}</p>}
                {!report.readByCmo && <button type="button" className="btn-ghost" onClick={() => markReportRead(report.id)}>Mark as read</button>}
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
