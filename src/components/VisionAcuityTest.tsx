import { useMemo, useState, type FormEvent } from 'react';

const LETTERS = ['C', 'D', 'E', 'F', 'H', 'K', 'N', 'P', 'R', 'U', 'V', 'Z'];
const SIZES = [56, 48, 41, 35, 30, 26, 22, 19];

interface VisionAcuityTestProps {
  label: string;
  instruction?: string;
  onComplete: (acuityStep: number) => void;
}

export function VisionAcuityTest({ label, instruction, onComplete }: VisionAcuityTestProps) {
  const letters = useMemo(
    () => Array.from({ length: SIZES.length }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]),
    [],
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState(0);
  const [answer, setAnswer] = useState('');
  const [complete, setComplete] = useState(false);

  const finish = (acuityStep: number) => {
    setComplete(true);
    onComplete(acuityStep);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (complete || !answer.trim()) return;
    const correct = answer.trim().toUpperCase() === letters[step];
    if (!correct) {
      const nextErrors = errors + 1;
      setAnswer('');
      if (nextErrors >= 2) finish(Math.max(1, step));
      else setErrors(nextErrors);
      return;
    }
    setAnswer('');
    if (step === SIZES.length - 1) finish(SIZES.length);
    else {
      setStep(step + 1);
      setErrors(0);
    }
  };

  return (
    <section className="vision-test">
      <h3>{label}</h3>
      {instruction && <p className="muted small">{instruction}</p>}
      {!complete ? (
        <>
          <div className="acuity-letter" style={{ fontSize: SIZES[step] }}>{letters[step]}</div>
          <p className="muted small">Step {step + 1} of {SIZES.length}. Two errors at one size stop this run.</p>
          <form className="row" onSubmit={submit}>
            <label>
              <span className="sr-only">Letter shown</span>
              <input
                autoCapitalize="characters"
                maxLength={1}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                aria-label="Letter shown"
              />
            </label>
            <button type="submit" className="btn">Submit letter</button>
          </form>
        </>
      ) : (
        <p className="muted">Completed. Smallest size read: step {Math.max(1, step === SIZES.length ? SIZES.length : step)}.</p>
      )}
    </section>
  );
}
