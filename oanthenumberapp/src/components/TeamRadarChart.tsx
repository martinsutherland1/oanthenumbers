import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { TeamSeasonStats } from '../utils/dataProcessing';
import './TeamRadarChart.css';

export interface RadarSeries {
  id: string;
  label: string;
  color: string;
  stats: TeamSeasonStats;
  // The league-wide stats this series is ranked against
  pool: TeamSeasonStats[];
  dashed?: boolean;
  fillOpacity?: number;
}

interface TeamRadarChartProps {
  series: RadarSeries[];
  title?: string;
}

interface Axis {
  label: string;
  value: (s: TeamSeasonStats) => number;
  // "Against" axes are inverted so a bigger polygon is always better
  invert?: boolean;
  signed?: boolean;
}

const AXES: Axis[] = [
  { label: 'Goals For',      value: s => s.goalsPerGame },
  { label: 'NPxG',           value: s => s.xgPerGame },
  { label: 'xG Open Play',   value: s => s.xgOpenPlayPerGame },
  { label: 'xG Set Play',    value: s => s.xgSetPlayPerGame },
  { label: 'xGOT',           value: s => s.xgotPerGame },
  { label: 'NPxG Diff',      value: s => s.xgDiffPerGame, signed: true },
  { label: 'Goal Diff',      value: s => s.goalDiffPerGame, signed: true },
  { label: 'Goals Against',  value: s => s.goalsAgainstPerGame, invert: true },
  { label: 'NPxG Against',   value: s => s.xgAgainstPerGame, invert: true },
];

const ordinal = (n: number) => {
  const r = Math.round(n);
  const v = r % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][r % 10 > 3 ? 0 : r % 10];
  return `${r}${suffix}`;
};

const fmt = (n: number, signed?: boolean) => `${signed && n > 0 ? '+' : ''}${n.toFixed(2)}`;

type Row = Record<string, string | number | boolean | undefined>;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  series: RadarSeries[];
}

function RadarTooltip({ active, payload, series }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const signed = row.signed as boolean;
  return (
    <div className="line-custom-tooltip">
      <p className="tooltip-match">
        {row.axis}{row.invert ? ' (lower is better)' : ''}
      </p>
      {series.map(s => (
        <p key={s.id} className="tooltip-entry" style={{ color: s.color }}>
          {s.label}: <strong>{fmt(row[`${s.id}_raw`] as number, signed)}</strong>{' '}
          ({ordinal(row[s.id] as number)} pct)
        </p>
      ))}
    </div>
  );
}

export function TeamRadarChart({ series, title = 'Goals & xG Radar' }: TeamRadarChartProps) {
  const data = useMemo(() => AXES.map(axis => {
    const row: Row = { axis: axis.label, invert: !!axis.invert, signed: !!axis.signed };
    series.forEach(s => {
      const v = axis.value(s.stats);
      // Percentile: share of the other teams this one beats (100 = best in the league)
      const others = s.pool.filter(p => p.team !== s.stats.team);
      const beaten = others.filter(p => (axis.invert ? axis.value(p) > v : axis.value(p) < v)).length;
      const tied = others.filter(p => axis.value(p) === v).length;
      row[s.id] = others.length ? ((beaten + tied / 2) / others.length) * 100 : 50;
      row[`${s.id}_raw`] = v;
    });
    return row;
  }), [series]);

  return (
    <div className="radar-container">
      <div className="radar-header">
        <h3>{title} <span className="radar-subtitle">league percentile · outer edge = best</span></h3>
      </div>
      <div className="radar-legend">
        {series.map(s => (
          <span key={s.id} className="radar-legend-item">
            <span
              className={`radar-legend-swatch${s.dashed ? ' dashed' : ''}`}
              style={{ '--swatch': s.color } as React.CSSProperties}
            />
            {s.label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={data} outerRadius="66%">
          <PolarGrid stroke="var(--border)" strokeOpacity={0.9} gridType="polygon" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
            axisLine={false}
            angle={90}
          />
          <Tooltip content={<RadarTooltip series={series} />} />
          {series.map(s => (
            <Radar
              key={s.id}
              name={s.label}
              dataKey={s.id}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? (series.length > 3 ? 0.06 : 0.2)}
              strokeWidth={2.5}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              dot={{ r: s.dashed ? 4 : 3, fill: s.dashed ? 'var(--surface)' : s.color, stroke: s.color, strokeWidth: s.dashed ? 2 : 0 }}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
