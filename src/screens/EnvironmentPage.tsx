import { T, missionDose } from '../engine/rules';
import { useStore } from '../store';
import { PageHeader, Panel, TrendChart } from '../components/ui';

export function EnvironmentPage() {
  const { env, day, environment } = useStore();
  const today = env[day - 1];
  const total = missionDose(env, day);
  const share = (total / T.careerLimit) * 100;
  const upTo = env.slice(0, day);
  const cls = (v: number, y: number, r: number) => (v > r ? ' crit' : v > y ? ' warn' : '');

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Habitat environment" />
      <div className="stats">
        <div className={`stat${cls(today.radiationMSv, T.radiationYellow, T.radiationRed)}`}>
          <span className="label">Radiation today</span>
          <span className="value">{today.radiationMSv.toFixed(1)} <small>mSv</small></span>
          <span className="muted small">Usual {environment.radiationBackgroundMSvPerDay} mSv/day</span>
        </div>
        <div className="stat">
          <span className="label">Mission dose</span>
          <span className="value">{total.toFixed(0)} <small>of {T.careerLimit} mSv</small></span>
          <div className="meter"><span style={{ width: `${Math.min(100, share)}%` }} /></div>
          <span className="muted small">{share.toFixed(1)}% of the NASA career limit</span>
        </div>
        <div className={`stat${cls(today.co2, T.co2Yellow, T.co2Red)}`}>
          <span className="label">Cabin CO2</span>
          <span className="value">{today.co2.toFixed(1)} <small>mmHg</small></span>
          <span className="muted small">Limit {T.co2Yellow.toFixed(1)} mmHg</span>
        </div>
        <div className="stat">
          <span className="label">Cabin air</span>
          <span className="value">{today.cabinTemp.toFixed(1)} <small>°C</small></span>
          <span className="muted small">Humidity {today.humidity}%</span>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Daily radiation dose (mSv)">
          <TrendChart data={upTo.map((e, i) => ({ day: i + 1, value: e.radiationMSv }))} unit="mSv" />
        </Panel>
        <Panel title="Cabin CO2 (mmHg)">
          <TrendChart data={upTo.map((e, i) => ({ day: i + 1, value: e.co2 }))} band={{ lo: 0, hi: T.co2Yellow, mid: T.co2Yellow }} unit="mmHg" />
          <p className="muted small">Shaded band: below the 3 mmHg NASA limit.</p>
        </Panel>
      </div>
    </>
  );
}
