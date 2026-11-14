import { useState } from 'react';
import { useStore } from '../store';
import { PageHeader, Panel, Private } from '../components/ui';

export function JournalPage() {
  const { viewer, data, addJournal, day } = useStore();
  const [text, setText] = useState('');
  const entries = (data.journal[viewer.id] ?? []).slice().reverse();

  return (
    <>
      <PageHeader title="Private journal">
        <Private>Only you can read this</Private>
      </PageHeader>
      <Panel>
        <form
          className="journal"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            addJournal(viewer.id, text.trim());
            setText('');
          }}
        >
          <label htmlFor="journal-text">Write anything about today</label>
          <textarea id="journal-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What went well, what was hard, what you miss…" />
          <button className="btn" type="submit">Save entry for day {day}</button>
        </form>
      </Panel>
      {entries.length > 0 && (
        <Panel title="Entries">
          <ul className="entries">
            {entries.map((e, i) => (
              <li key={i}>
                <span className="muted small">Day {e.day}</span>
                <p>{e.text}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
