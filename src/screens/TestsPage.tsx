import { useEffect, useState } from 'react';
import type { VisionResult } from '../types';
import { useStore } from '../store';
import { AmslerTest } from '../components/AmslerTest';
import { ReactionTest } from '../components/ReactionTest';
import { VisionAcuityTest } from '../components/VisionAcuityTest';
import { PageHeader, Panel } from '../components/ui';

export function TestsPage() {
  const { viewer, saveReaction, saveVisionResult, day, data } = useStore();
  const [rtSaved, setRtSaved] = useState(false);
  const [farAcuity, setFarAcuity] = useState<number>();
  const [nearAcuity, setNearAcuity] = useState<number>();
  const [amslerMarks, setAmslerMarks] = useState<VisionResult['amslerMarks']>();
  const [visionSaved, setVisionSaved] = useState(false);
  const weekStart = Math.floor((day - 1) / 7) * 7 + 1;
  const weekDays = Array.from({ length: 7 }, (_, index) => weekStart + index).filter((missionDay) => missionDay <= 30);
  const countInWeek = (values: number[]) => values.filter((missionDay) => weekDays.includes(missionDay)).length;
  const visionDue = day % 7 === 0 && !data.visionResults?.[viewer.id]?.[day];

  useEffect(() => {
    setRtSaved(false);
    setFarAcuity(undefined);
    setNearAcuity(undefined);
    setAmslerMarks(undefined);
    setVisionSaved(false);
  }, [day, viewer.id]);

  const saveVision = () => {
    if (farAcuity === undefined || nearAcuity === undefined || amslerMarks === undefined || visionSaved) return;
    saveVisionResult(viewer.id, { day, acuityStep: Math.min(farAcuity, nearAcuity), amslerMarks });
    setVisionSaved(true);
  };

  return (
    <>
      <PageHeader eyebrow={`Mission day ${day}`} title="Tests" />
      {visionDue && (
        <Panel title="Today's tasks">
          <p>Vision self-tests are due today.</p>
        </Panel>
      )}
      <div className="two-col">
        <Panel title="Reaction test">
          <p className="muted small">A measure of response speed and lapses.</p>
          <ReactionTest
            onResult={(result) => {
              saveReaction(viewer.id, result);
              setRtSaved(true);
            }}
          />
          {rtSaved && <p className="muted small">Saved for day {day}.</p>}
        </Panel>
        <Panel title="Vision self-tests">
          <p className="muted small">For tracking changes over time, not a diagnosis.</p>
          <VisionAcuityTest label="Distance vision" onComplete={setFarAcuity} />
          <VisionAcuityTest label="Near vision" instruction="Hold the screen at reading distance." onComplete={setNearAcuity} />
          <AmslerTest onComplete={setAmslerMarks} />
          <button type="button" className="btn" disabled={farAcuity === undefined || nearAcuity === undefined || amslerMarks === undefined || visionSaved} onClick={saveVision}>
            {visionSaved ? 'Vision result saved' : 'Save vision result'}
          </button>
        </Panel>
      </div>
      <Panel title="Weekly record">
        <p className="muted">
          This week: {countInWeek(Object.keys(data.checkIns[viewer.id] ?? {}).map(Number))} of 7 check-ins,{' '}
          {countInWeek(Object.keys(data.reactions[viewer.id] ?? {}).map(Number))} of 7 reaction tests,{' '}
          {countInWeek(Object.keys(data.visionResults?.[viewer.id] ?? {}).map(Number))} of 1 vision test.
        </p>
      </Panel>
    </>
  );
}
