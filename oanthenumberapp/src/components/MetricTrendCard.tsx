import { useId, type ReactNode } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import './MetricTrendCard.css';

export interface MetricTrendPoint {
  matchNumber: number;
  value: number;
}

interface MetricTrendCardProps {
  title: ReactNode;
  data: MetricTrendPoint[];
  color: string;
  badgeText: string;
  badgeTone?: 'positive' | 'negative' | 'neutral';
  baseline?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}

function CardTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="metric-trend-tooltip">
        <span>Match {label}</span>
        <strong>{payload[0].value.toFixed(2)}</strong>
      </div>
    );
  }
  return null;
}

export function MetricTrendCard({ title, data, color, badgeText, badgeTone = 'neutral', baseline }: MetricTrendCardProps) {
  const gradientId = `metric-trend-gradient-${useId()}`;
  const axisTickStyle = { fill: 'var(--text-secondary)', fontSize: 10 };

  return (
    <div className="metric-trend-card">
      <div className="metric-trend-header">
        <h4>{title}</h4>
        <span className={`metric-trend-badge ${badgeTone}`}>{badgeText}</span>
      </div>
      <div className="metric-trend-chart">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={145}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              {baseline !== undefined && (
                <ReferenceLine y={baseline} stroke="var(--border)" strokeDasharray="4 4" />
              )}
              <XAxis
                dataKey="matchNumber"
                tick={axisTickStyle}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tickMargin={6}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={axisTickStyle}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                width={34}
              />
              <Tooltip content={<CardTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, strokeWidth: 0, fill: color }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="metric-trend-empty">Not enough data yet</div>
        )}
      </div>
    </div>
  );
}
