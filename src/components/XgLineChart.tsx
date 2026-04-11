import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { LineChartDataPoint } from '../types';
import { getTeamColor, LEAGUE_AVERAGE_COLOR } from '../utils/teamColors';
import './XgLineChart.css';

interface XgLineChartProps {
  data: LineChartDataPoint[];
  selectedTeams: string[];
  leagueAverage: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="line-custom-tooltip">
        <p className="tooltip-match">Match {label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-entry" style={{ color: entry.color }}>
            {entry.dataKey}: <strong>{entry.value.toFixed(2)}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function XgLineChart({ data, selectedTeams, leagueAverage }: XgLineChartProps) {
  if (selectedTeams.length === 0) {
    return (
      <div className="line-chart-container">
        <div className="chart-header">
          <h3>Rolling xG Progression</h3>
          <div className="legend">
            <div className="legend-item">
              <span
                className="legend-line"
                style={{ backgroundColor: LEAGUE_AVERAGE_COLOR }}
              />
              Current League Average: {leagueAverage.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="no-selection-message">
          <p>Select one or more teams to view their rolling xG progression over matches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="line-chart-container">
      <div className="chart-header">
        <h3>Rolling xG Progression</h3>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="matchNumber"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              tickMargin={8}
            />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              domain={[0, 'auto']}
              tickMargin={8}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '12px' }}
              iconType="line"
              iconSize={12}
              formatter={(value) => <span className="legend-text">{value}</span>}
            />

            {/* League Average Line */}
            <Line
              type="monotone"
              dataKey="leagueAverage"
              name="League Avg"
              stroke={LEAGUE_AVERAGE_COLOR}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />

            {/* Team Lines */}
            {selectedTeams.map(team => (
              <Line
                key={team}
                type="monotone"
                dataKey={team}
                name={team}
                stroke={getTeamColor(team)}
                strokeWidth={2.5}
                dot={{ fill: getTeamColor(team), strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
