import { memberById } from '../data/crew';
import { GUIDANCE } from '../engine/guidance';
import { useStore } from '../store';
import { PageHeader, Panel } from '../components/ui';

export function FollowUps() {
  const { data, setFollowUpStatus, go } = useStore();
  const list = [...data.followUps].sort((a, b) => (a.status === b.status ? b.createdDay - a.createdDay : a.status === 'pending' ? -1 : 1));

  return (
    <>
      <PageHeader title="Follow-ups" />
      <Panel>
        {list.length === 0 ? (
          <p className="muted">No follow-ups yet. Assign one from an alert.</p>
        ) : (
          <div className="table-wrap">
            <table className="list">
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Crew member</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Action</th>
                  <th scope="col">Day</th>
                  <th scope="col"><span className="sr-only">Change</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => (
                  <tr key={f.id}>
                    <td><span className={`tag tag-${f.status}`}>{f.status === 'done' ? 'Done' : 'Pending'}</span></td>
                    <td><button className="link" onClick={() => go('member', f.memberId)}>{memberById(f.memberId).name}</button></td>
                    <td>{GUIDANCE[f.findingId].title}</td>
                    <td>{f.text}</td>
                    <td className="num">{f.createdDay}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => setFollowUpStatus(f.id, f.status === 'done' ? 'pending' : 'done')}>
                        {f.status === 'done' ? 'Reopen' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
