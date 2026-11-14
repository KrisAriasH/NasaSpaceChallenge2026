import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Status, Trend } from '../types';

const STATUS_WORD: Record<Status, string> = { green: 'Nominal', yellow: 'Watch', red: 'Act' };

export function StatusPill({ status, small }: { status: Status; small?: boolean }) {
  return (
    <span className={`pill pill-${status}${small ? ' pill-sm' : ''}`}>
      <span className="pill-dot" aria-hidden />
      {STATUS_WORD[status]}
    </span>
  );
}

const TREND: Record<Trend, { glyph: string; label: string }> = {
  up: { glyph: '↗', label: 'improving' },
  flat: { glyph: '→', label: 'stable' },
  down: { glyph: '↘', label: 'worsening' },
};

export function TrendArrow({ trend }: { trend: Trend }) {
  return (
    <span className={`trend trend-${trend}`} title={TREND[trend].label} aria-label={TREND[trend].label}>
      {TREND[trend].glyph}
    </span>
  );
}

export function Private({ children = 'Private' }: { children?: ReactNode }) {
  return (
    <span className="private" title="Only the crew member can see this unless they share it">
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
        <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 0 0-4 0v2Z" fill="currentColor" />
      </svg>
      {children}
    </span>
  );
}

export function Panel({ title, aside, children, className = '' }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || aside) && (
        <div className="panel-head">
          {title && <h2>{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}

interface ChartProps {
  data: { day: number; value: number }[];
  band?: { lo: number; hi: number; mid: number };
  unit: string;
  height?: number;
}

/** Line over mission days with the person's normal range as a shaded band. */
export function TrendChart({ data, band, unit, height = 220 }: ChartProps) {
  const values = data.map((d) => d.value);
  const lo = Math.min(...values, band?.lo ?? Infinity);
  const hi = Math.max(...values, band?.hi ?? -Infinity);
  const pad = (hi - lo) * 0.15 || 1;
  const step = hi - lo > 8 ? 1 : 0.1;
  const domain: [number, number] = [Math.floor((lo - pad) / step) * step, Math.ceil((hi + pad) / step) * step];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="day" stroke="var(--muted)" tickLine={false} fontSize={12} />
        <YAxis stroke="var(--muted)" tickLine={false} fontSize={12} width={44} domain={domain} tickFormatter={(v: number) => String(+v.toFixed(1))} />
        {band && <ReferenceArea y1={band.lo} y2={band.hi} fill="var(--band)" fillOpacity={1} />}
        {band && <ReferenceLine y={band.mid} stroke="var(--muted)" strokeDasharray="4 4" />}
        <Tooltip
          formatter={(v) => [`${v} ${unit}`, '']}
          labelFormatter={(d) => `Day ${d}`}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8 }}
        />
        <Line type="linear" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
