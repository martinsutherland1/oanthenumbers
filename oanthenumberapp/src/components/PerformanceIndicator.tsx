import './PerformanceIndicator.css';

export type TrendDirection = 'up' | 'steady' | 'down';

export interface PerformanceBreakdownTable {
  title: string;
  note?: string;
  currentLabel: string;
  comparisonLabel: string;
  current: string;
  comparison: string;
  diff: string;
  tone: 'positive' | 'negative' | 'neutral';
}

interface PerformanceIndicatorProps {
  value: number;
  trend: TrendDirection;
  tables?: PerformanceBreakdownTable[];
  min?: number;
  max?: number;
}

const TREND_LABEL: Record<TrendDirection, string> = {
  up: 'Upturn',
  steady: 'Steady',
  down: 'Downturn',
};

const TREND_ARROW: Record<TrendDirection, string> = {
  up: '↑',
  steady: '—',
  down: '↓',
};

type Tone = 'green' | 'amber' | 'red';

const TREND_TONE: Record<TrendDirection, Tone> = {
  up: 'green',
  steady: 'amber',
  down: 'red',
};

export function PerformanceIndicator({ value, trend, tables, min = -2, max = 2 }: PerformanceIndicatorProps) {
  const clamped = Math.min(max, Math.max(min, value));
  const pct = ((clamped - min) / (max - min)) * 100;

  const status = value > 0.15 ? 'Overperforming' : value < -0.15 ? 'Underperforming' : 'On average';
  const statusTone: Tone = value > 0.15 ? 'green' : value < -0.15 ? 'red' : 'amber';

  return (
    <div className="performance-indicator-card">
      <div className="performance-indicator-header">
        <h4>Performance Indicator</h4>
        <div className="performance-indicator-badges">
          <span className="performance-indicator-group">
            <span className="performance-indicator-group-label">Current</span>
            <span className={`performance-status-dot ${statusTone}`} title={status} aria-label={status} />
          </span>
          <span className="performance-indicator-group">
            <span className="performance-indicator-group-label">Trend</span>
            <span className={`performance-trend-arrow ${TREND_TONE[trend]}`} title={TREND_LABEL[trend]} aria-label={TREND_LABEL[trend]}>
              {TREND_ARROW[trend]}
            </span>
          </span>
        </div>
      </div>
      <div className="performance-gauge-track">
        <div className="performance-gauge-dot" style={{ left: `${pct}%` }} />
      </div>
      <div className="performance-gauge-labels">
        <span>Underperforming</span>
        <span>Balanced</span>
        <span>Overperforming</span>
      </div>
      {tables && tables.length > 0 && (
        <div className="performance-breakdown-wrapper">
          <div className="performance-breakdown-grid">
            {tables.map(t => (
              <div className="performance-mini-table" key={t.title}>
                <h5>
                  {t.title}
                  {t.note && <span className="performance-mini-table-note"> ({t.note})</span>}
                </h5>
                <table>
                  <thead>
                    <tr>
                      <th>{t.currentLabel}</th>
                      <th>{t.comparisonLabel}</th>
                      <th>Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{t.current}</td>
                      <td>{t.comparison}</td>
                      <td className={`performance-breakdown-diff ${t.tone}`}>{t.diff}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
