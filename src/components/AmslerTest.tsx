import { useState } from 'react';

export interface AmslerMark {
  row: number;
  column: number;
}

interface AmslerTestProps {
  onComplete: (marks: AmslerMark[]) => void;
}

const GRID_SIZE = 5;
const CELL_SIZE = 52;

export function AmslerTest({ onComplete }: AmslerTestProps) {
  const [marks, setMarks] = useState<AmslerMark[]>([]);
  const [complete, setComplete] = useState(false);

  const toggle = (row: number, column: number) => {
    if (complete) return;
    setMarks((current) =>
      current.some((mark) => mark.row === row && mark.column === column)
        ? current.filter((mark) => mark.row !== row || mark.column !== column)
        : [...current, { row, column }],
    );
  };

  return (
    <section className="vision-test">
      <h3>Amsler grid</h3>
      <p className="muted small">Click any area that looks wavy, blurred or missing. Test one eye at a time.</p>
      <svg className="amsler-grid" viewBox={`0 0 ${GRID_SIZE * CELL_SIZE} ${GRID_SIZE * CELL_SIZE}`} role="img" aria-label="Amsler grid">
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, column) => {
            const marked = marks.some((mark) => mark.row === row && mark.column === column);
            return (
              <g key={`${row}-${column}`} onClick={() => toggle(row, column)} role="button" aria-label={`Amsler row ${row + 1}, column ${column + 1}`}>
                <rect x={column * CELL_SIZE} y={row * CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE} className={marked ? 'amsler-cell marked' : 'amsler-cell'} />
              </g>
            );
          }),
        )}
        <circle cx={(GRID_SIZE * CELL_SIZE) / 2} cy={(GRID_SIZE * CELL_SIZE) / 2} r="4" />
      </svg>
      <button type="button" className="btn" disabled={complete} onClick={() => { setComplete(true); onComplete(marks); }}>
        {complete ? `Recorded ${marks.length} mark${marks.length === 1 ? '' : 's'}` : 'Record Amsler result'}
      </button>
    </section>
  );
}
