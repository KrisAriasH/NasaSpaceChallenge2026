import { CREW } from '../data/crew';
import { isMedicalReviewer } from '../engine/privacy';
import { useStore } from '../store';
import { FindingList } from '../components/FindingCard';
import { PageHeader } from '../components/ui';

export function Alerts() {
  const { viewer, assess, day } = useStore();
  const findings = CREW.filter((m) => isMedicalReviewer(viewer, m))
    .flatMap((m) => assess(m.id).flatMap((s) => s.findings));

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Alerts" />
      {findings.length === 0 ? (
        <p className="empty">No alerts today. Everyone is within their normal range.</p>
      ) : (
        <FindingList findings={findings} showName />
      )}
    </>
  );
}
