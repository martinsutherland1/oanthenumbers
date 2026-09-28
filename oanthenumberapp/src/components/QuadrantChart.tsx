import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { TeamGoalsVsXg, XgType } from '../utils/dataProcessing';
import { XgTypeSelect } from './XgTypeSelect';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './QuadrantChart.css';

interface QuadrantChartProps {
  data: TeamGoalsVsXg[];
  selectedTeams: string[];
  xgType: XgType;
  onXgTypeChange: (value: XgType) => void;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: TeamGoalsVsXg;
}

function renderPoint(selectedTeams: string[]) {
  return function QuadrantDot(props: unknown) {
    const { cx, cy, payload } = props as DotProps;
    if (cx == null || cy == null || !payload) return <g />;
    const isDimmed = selectedTeams.length > 0 && !selectedTeams.includes(payload.team);
    const color = getTeamColor(payload.team);
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={isDimmed ? 5 : 6.5}
          fill={color}
          fillOpacity={isDimmed ? 0.25 : 1}
          stroke="var(--surface)"
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize={10}
          fontWeight={isDimmed ? 400 : 600}
          fill={isDimmed ? 'var(--text-secondary)' : 'var(--text)'}
          opacity={isDimmed ? 0.45 : 1}
        >
          {getTeamName(payload.team)}
        </text>
      </g>
    );
  };
}

interface QuadrantTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TeamGoalsVsXg }>;
  xgLabel: string;
}

function QuadrantTooltip({ active, payload, xgLabel }: QuadrantTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const diff = Math.round((d.goalsPerGame - d.xgPerGame) * 100) / 100;
  return (
    <div className="line-custom-tooltip">
      <p className="tooltip-match">{getTeamName(d.team)}</p>
      <p className="tooltip-entry">Goals/Game: <strong>{d.goalsPerGame.toFixed(2)}</strong></p>
      <p className="tooltip-entry">{xgLabel}/Game: <strong>{d.xgPerGame.toFixed(2)}</strong></p>
      <p className="tooltip-entry">Diff: <strong>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</strong></p>
    </div>
  );
}

export function QuadrantChart({ data, selectedTeams, xgType, onXgTypeChange }: QuadrantChartProps) {
  const xgLabel = xgType === 'npxg' ? 'NPxG' : xgType === 'xgOpenPlay' ? 'xG Open Play' : xgType === 'xgSetPlay' ? 'xG Set Play' : xgType === 'xgot' ? 'xGOT' : 'xG';

  const { avgGoals, avgXg, domainMax } = useMemo(() => {
    if (data.length === 0) return { avgGoals: 0, avgXg: 0, domainMax: 1 };
    const totalGoals = data.reduce((sum, d) => sum + d.goalsPerGame, 0);
    const totalXg = data.reduce((sum, d) => sum + d.xgPerGame, 0);
    const maxValue = Math.max(...data.map(d => Math.max(d.goalsPerGame, d.xgPerGame)));
    return {
      avgGoals: Math.round((totalGoals / data.length) * 100) / 100,
      avgXg: Math.round((totalXg / data.length) * 100) / 100,
      domainMax: Math.ceil(maxValue * 1.2 * 10) / 10,
    };
  }, [data]);

  return (
    <div className="line-chart-container">
      <div className="chart-header">
        <h3>Goals vs <XgTypeSelect value={xgType} onChange={onXgTypeChange} /> per Game</h3>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 30, right: 30, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="xgPerGame"
              name={`${xgLabel}/Game`}
              domain={[0, domainMax]}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              tickMargin={8}
              label={{ value: `${xgLabel} per Game`, position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)' }}
            />
            <YAxis
              type="number"
              dataKey="goalsPerGame"
              name="Goals/Game"
              domain={[0, domainMax]}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              tickMargin={8}
              width={45}
              label={{ value: 'Goals per Game', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
            />
            <Tooltip content={<QuadrantTooltip xgLabel={xgLabel} />} cursor={{ strokeDasharray: '3 3' }} />
            <ReferenceLine
              segment={[{ x: 0, y: 0 }, { x: domainMax, y: domainMax }]}
              stroke="var(--text-secondary)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              x={avgXg}
              stroke="var(--text-secondary)"
              strokeDasharray="3 3"
              label={{ value: 'Avg', position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }}
            />
            <ReferenceLine
              y={avgGoals}
              stroke="var(--text-secondary)"
              strokeDasharray="3 3"
              label={{ value: 'Avg', position: 'left', fill: 'var(--text-secondary)', fontSize: 10 }}
            />
            <Scatter data={data} shape={renderPoint(selectedTeams)} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="quadrant-legend">
        <span className="quadrant-legend-item">↖ Clinical — outscoring {xgLabel}</span>
        <span className="quadrant-legend-item">↗ Elite — high {xgLabel} & goals</span>
        <span className="quadrant-legend-item">↙ Struggling — low {xgLabel} & goals</span>
        <span className="quadrant-legend-item">↘ Wasteful — underscoring {xgLabel}</span>
      </div>
    </div>
  );
}
