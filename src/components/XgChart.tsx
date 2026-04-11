import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import type { TeamRollingAverage } from '../types';
import { getTeamColor, LEAGUE_AVERAGE_COLOR } from '../utils/teamColors';
import './XgChart.css';

interface XgChartProps {
  data: TeamRollingAverage[];
  selectedTeams: string[];
  leagueAverage: number;
}

interface ChartData {
  name: string;
  value: number;
  gamesPlayed: number;
  isSelected: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartData }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-team">{data.name}</p>
        <p className="tooltip-xg">xG: <strong>{data.value.toFixed(2)}</strong></p>
        <p className="tooltip-games">Games: {data.gamesPlayed}/10</p>
      </div>
    );
  }
  return null;
}

export function XgChart({ data, selectedTeams, leagueAverage }: XgChartProps) {
  const chartData: ChartData[] = data.map(team => ({
    name: team.team,
    value: team.average,
    gamesPlayed: team.gamesPlayed,
    isSelected: selectedTeams.includes(team.team)
  }));

  const getBarColor = (entry: ChartData): string => {
    if (selectedTeams.length === 0) {
      return getTeamColor(entry.name);
    }
    return entry.isSelected ? getTeamColor(entry.name) : '#cccccc40';
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Rolling 10-Game Average xG</h3>
        <div className="legend">
          <div className="legend-item">
            <span
              className="legend-line"
              style={{ backgroundColor: LEAGUE_AVERAGE_COLOR }}
            />
            League Average: {leagueAverage.toFixed(2)}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            domain={[0, 'auto']}
            label={{
              value: 'xG',
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--text-secondary)'
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={leagueAverage}
            stroke={LEAGUE_AVERAGE_COLOR}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry)}
                style={{
                  transition: 'fill 0.3s ease',
                  opacity: selectedTeams.length === 0 || entry.isSelected ? 1 : 0.3
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
