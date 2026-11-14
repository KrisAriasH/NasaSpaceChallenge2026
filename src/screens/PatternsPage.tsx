import { patternsFor } from '../engine/patterns';
import { useStore } from '../store';
import { PageHeader, Panel, Private } from '../components/ui';

export function PatternsPage() {
  const { viewer, history, day } = useStore();
  const patterns = patternsFor(history(viewer.id));

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Patterns">
        <Private>Private</Private>
      </PageHeader>
      <Panel>
        {patterns.length === 0 ? (
          <p className="muted">No notable patterns in the last 14 days.</p>
        ) : (
          <div className="stack">
            {patterns.map((pattern) => (
              <article key={pattern.id} className="finding">
                <h3>{pattern.text}</h3>
                <ul>
                  {pattern.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <p className="muted small">Suggested action: {pattern.action}</p>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
