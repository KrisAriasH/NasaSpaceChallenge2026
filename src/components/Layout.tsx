import type { ReactNode } from 'react';
import { CREW, MISSION_DAYS, BASELINE_DAYS, ROLE_LABEL } from '../data/crew';
import { type Page, useStore } from '../store';

interface NavItem {
  page: Page;
  label: string;
  subject?: string;
}

export function Layout({ children }: { children: ReactNode }) {
  const { viewer, setViewer, page, go, day, setDay, subjectId } = useStore();

  const medical: NavItem[] =
    viewer.role === 'cmo'
      ? [
          { page: 'overview', label: 'Crew overview' },
          { page: 'alerts', label: 'Alerts' },
          { page: 'followups', label: 'Follow-ups' },
        ]
      : viewer.role === 'backup'
        ? [{ page: 'member', label: 'Review the CMO', subject: 'ana' }]
        : [];
  const personal: NavItem[] = [
    { page: 'mystatus', label: 'My status' },
    { page: 'checkin', label: 'Daily check-in' },
    { page: 'privacy', label: 'My privacy' },
    { page: 'journal', label: 'Private journal' },
  ];

  const item = (n: NavItem) => {
    const active = page === n.page && (!n.subject || n.subject === subjectId);
    return (
      <li key={n.label}>
        <button className={active ? 'nav-item active' : 'nav-item'} aria-current={active ? 'page' : undefined} onClick={() => go(n.page, n.subject)}>
          {n.label}
        </button>
      </li>
    );
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden>
            <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
            <path d="M16 5v22M11 9c4 0 6 2 5 4s-5 2-5 4 3 3 5 3 4 1 4 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <strong>Asclepio</strong>
            <span>Crew health</span>
          </div>
        </div>

        <label className="viewer" htmlFor="viewer">
          <span className="side-label">Viewing as</span>
          <select id="viewer" value={viewer.id} onChange={(e) => setViewer(e.target.value)}>
            {CREW.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {ROLE_LABEL[m.role]}
              </option>
            ))}
          </select>
        </label>

        <nav aria-label="Main">
          {medical.length > 0 && (
            <>
              <p className="side-label">Medical officer</p>
              <ul>{medical.map(item)}</ul>
            </>
          )}
          <p className="side-label">Me</p>
          <ul>{personal.map(item)}</ul>
          <p className="side-label">Habitat</p>
          <ul>{item({ page: 'environment', label: 'Environment' })}</ul>
        </nav>

        <div className="day-control">
          <label htmlFor="day" className="side-label">
            Simulated mission day <strong>{day}</strong>
          </label>
          <input id="day" type="range" min={BASELINE_DAYS} max={MISSION_DAYS} value={day} onChange={(e) => setDay(+e.target.value)} />
          <p className="side-note">Demo with simulated data. Not a medical device.</p>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
