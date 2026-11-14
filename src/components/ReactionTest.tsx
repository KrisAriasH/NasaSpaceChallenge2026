import { useEffect, useRef, useState } from 'react';
import type { ReactionResult } from '../types';

/**
 * Simplified Psychomotor Vigilance Test (PVT). A stimulus appears after a random delay;
 * the astronaut responds as fast as possible. NASA's Cognition battery uses a 3-minute version.
 * Lapse = response slower than 500 ms.
 */

type Phase = 'idle' | 'waiting' | 'stimulus' | 'done';

const LAPSE_MS = 500;

export function ReactionTest({ onResult }: { onResult: (r: ReactionResult) => void }) {
  const [duration, setDuration] = useState(30); // seconds; 180 for the standard test
  const [phase, setPhase] = useState<Phase>('idle');
  const [times, setTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const shownAt = useRef(0);
  const endsAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const schedule = () => {
    setPhase('waiting');
    const delay = 2000 + Math.random() * 6000; // 2-8 s, as in the PVT
    timer.current = window.setTimeout(() => {
      if (Date.now() >= endsAt.current) return finish();
      shownAt.current = performance.now();
      setPhase('stimulus');
    }, delay);
  };

  const start = () => {
    setTimes([]);
    setFalseStarts(0);
    setLast(null);
    endsAt.current = Date.now() + duration * 1000;
    schedule();
  };

  const finish = () => {
    window.clearTimeout(timer.current);
    setPhase('done');
  };

  const respond = () => {
    if (phase === 'stimulus') {
      const rt = Math.round(performance.now() - shownAt.current);
      setTimes((t) => [...t, rt]);
      setLast(rt);
      if (Date.now() >= endsAt.current) finish();
      else schedule();
    } else if (phase === 'waiting') {
      setFalseStarts((n) => n + 1);
    }
  };

  // Countdown display and keyboard support.
  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'stimulus') return;
    const tick = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000))), 250);
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener('keydown', key);
    };
  });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const result: ReactionResult | null =
    times.length > 0
      ? { meanMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length), lapses: times.filter((t) => t > LAPSE_MS).length }
      : null;

  return (
    <div className="pvt">
      {phase === 'idle' && (
        <div className="pvt-intro">
          <p>When the circle turns on, press the space bar or click the box as fast as you can.</p>
          <div className="row">
            <label htmlFor="pvt-duration">Length</label>
            <select id="pvt-duration" value={duration} onChange={(e) => setDuration(+e.target.value)}>
              <option value={30}>30 seconds (demo)</option>
              <option value={180}>3 minutes (standard)</option>
            </select>
            <button className="btn" onClick={start}>Start test</button>
          </div>
        </div>
      )}

      {(phase === 'waiting' || phase === 'stimulus') && (
        <button className={`pvt-box ${phase}`} onClick={respond} aria-label="Respond">
          <span className="pvt-light" aria-hidden />
          <span className="pvt-meta">
            {last !== null ? `${last} ms` : 'Wait for the light'} · {remaining}s left
          </span>
        </button>
      )}

      {phase === 'done' && (
        <div className="pvt-result">
          {result ? (
            <>
              <p>
                Average <strong>{result.meanMs} ms</strong> · {result.lapses} lapses (over {LAPSE_MS} ms) · {falseStarts} early presses ·{' '}
                {times.length} responses
              </p>
              <div className="row">
                <button className="btn" onClick={() => onResult(result)}>Save result</button>
                <button className="btn-ghost" onClick={() => setPhase('idle')}>Try again</button>
              </div>
            </>
          ) : (
            <>
              <p>No responses recorded.</p>
              <button className="btn-ghost" onClick={() => setPhase('idle')}>Try again</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
