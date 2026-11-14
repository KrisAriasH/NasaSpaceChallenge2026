import { CREW, memberById } from '../data/crew';
import { ALL_CATEGORIES, CATEGORY_LABEL, DEFAULT_SHARING, canGroundSee, canSee, isMedicalReviewer } from '../engine/privacy';
import { useStore } from '../store';
import { PageHeader, Panel } from '../components/ui';

export function PrivacyPage() {
  const { viewer, data, setSharing, assess } = useStore();
  const sharing = data.sharing[viewer.id] ?? DEFAULT_SHARING;
  const reviewer = CREW.find((m) => isMedicalReviewer(m, viewer));
  const log = data.accessLog.filter((e) => e.subjectId === viewer.id).slice().reverse();
  const conversation = assess(viewer.id)
    .find((s) => s.system === 'mental')!
    .findings.some((f) => f.id === 'mental-conversation');

  const toggle = (key: keyof typeof sharing) => setSharing(viewer.id, { ...sharing, [key]: !sharing[key] });
  const yes = (v: boolean) => <span className={v ? 'yes' : 'no'}>{v ? 'Sees it' : 'Hidden'}</span>;

  return (
    <>
      <PageHeader title="Privacy" />

      {conversation && (
        <div className="notice">
          <strong>The medical officer was told that mental health status has been red for several days.</strong> A private conversation was
          recommended. Check-in answers were not shared.
        </div>
      )}

      <div className="two-col">
        <Panel title="Shared data">
          <div className="toggles">
            <label className="toggle">
              <input id="share-cmo" type="checkbox" checked={sharing.checkInAnswersToCmo} onChange={() => toggle('checkInAnswersToCmo')} />
              <span>
                Share check-in answers with {reviewer ? reviewer.name : 'the medical officer'}
                <span className="muted small">Mood, stress, energy, connection and symptoms</span>
              </span>
            </label>
            <label className="toggle">
              <input id="share-ground-status" type="checkbox" checked={sharing.mentalStatusToGround} onChange={() => toggle('mentalStatusToGround')} />
              <span>
                Include mental health status in reports to Earth
                <span className="muted small">Green, yellow or red only</span>
              </span>
            </label>
            <label className="toggle">
              <input id="share-ground-answers" type="checkbox" checked={sharing.checkInAnswersToGround} onChange={() => toggle('checkInAnswersToGround')} />
              <span>
                Include check-in answers in reports to Earth
                <span className="muted small">For the flight surgeon or behavioral health team</span>
              </span>
            </label>
          </div>
          <p className="muted small">These settings can change at any time. The private journal is never shared.</p>
        </Panel>

        <Panel title="What others see about me">
          <div className="table-wrap">
            <table className="list">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">{reviewer ? `${reviewer.name.split(' ')[0]} (medical officer)` : 'Medical officer'}</th>
                  <th scope="col">Earth</th>
                </tr>
              </thead>
              <tbody>
                {ALL_CATEGORIES.map((c) => (
                  <tr key={c}>
                    <td>{CATEGORY_LABEL[c]}</td>
                    <td>{yes(reviewer ? canSee(reviewer, viewer, c, sharing) : false)}</td>
                    <td>{yes(canGroundSee(c, sharing))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Who opened my data">
        {log.length === 0 ? (
          <p className="muted">Nobody has opened your health data yet.</p>
        ) : (
          <ul className="log">
            {log.map((e, i) => (
              <li key={i}>
                Day {e.day}: <strong>{memberById(e.viewerId).name}</strong> viewed {e.categories.map((c) => CATEGORY_LABEL[c].split(' (')[0].toLowerCase()).join(', ')}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
