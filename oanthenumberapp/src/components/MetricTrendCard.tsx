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
  // Optional extra stat for each point, shown in the tooltip only
  secondary?: number;
}

interface MetricTrendCardProps {
  title: ReactNode;
  data: MetricTrendPoint[];
  color: string;
  badgeText: string;
  badgeTone?: 'positive' | 'negative' | 'neutral';
  baseline?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: MetricTrendPoint }>;
  label?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}

function CardTooltip({ active, payload, label, primaryLabel, secondaryLabel }: TooltipProps) {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    const primary = { value: payload[0].value };
    const secondary = point.secondary !== undefined ? { value: point.secondary } : undefined;
    return (
      <div className="metric-trend-tooltip">
        <span>Match {label}</span>
        <strong>{primaryLabel ? `${primaryLabel}: ` : ''}{primary.value.toFixed(2)}</strong>
        {secondary && <strong>{secondaryLabel ? `${secondaryLabel}: ` : ''}{secondary.value}</strong>}
      </div>
    );
  }
  return null;
}

export function MetricTrendCard({ title, data, color, badgeText, badgeTone = 'neutral', baseline, primaryLabel, secondaryLabel }: MetricTrendCardProps) {
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
              <Tooltip content={<CardTooltip primaryLabel={primaryLabel} secondaryLabel={secondaryLabel} />} />
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
