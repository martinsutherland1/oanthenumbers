import './MetricToggle.css';

export type MetricType = 'xg' | 'goals' | 'points';

interface MetricToggleProps {
  metricType: MetricType;
  onToggle: (type: MetricType) => void;
}

export function MetricToggle({ metricType, onToggle }: MetricToggleProps) {
  return (
    <div className="metric-toggle">
      <button
        className={`metric-btn ${metricType === 'xg' ? 'active' : ''}`}
        onClick={() => onToggle('xg')}
        aria-pressed={metricType === 'xg'}
      >
        xG
      </button>
      <button
        className={`metric-btn ${metricType === 'goals' ? 'active' : ''}`}
        onClick={() => onToggle('goals')}
        aria-pressed={metricType === 'goals'}
      >
        Goals
      </button>
      <button
        className={`metric-btn ${metricType === 'points' ? 'active' : ''}`}
        onClick={() => onToggle('points')}
        aria-pressed={metricType === 'points'}
      >
        Points
      </button>
    </div>
  );
}
