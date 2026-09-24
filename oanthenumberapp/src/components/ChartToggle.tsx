import './ChartToggle.css';

export type ChartType = 'bar' | 'line';

interface ChartToggleProps {
  chartType: ChartType;
  onToggle: (type: ChartType) => void;
}

export function ChartToggle({ chartType, onToggle }: ChartToggleProps) {
  return (
    <div className="chart-toggle">
      <button
        className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
        onClick={() => onToggle('bar')}
        aria-pressed={chartType === 'bar'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="12" width="4" height="9" rx="1" />
          <rect x="10" y="8" width="4" height="13" rx="1" />
          <rect x="17" y="4" width="4" height="17" rx="1" />
        </svg>
        <span>Bar</span>
      </button>
      <button
        className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
        onClick={() => onToggle('line')}
        aria-pressed={chartType === 'line'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 17 9 11 13 15 21 7" />
          <circle cx="3" cy="17" r="2" fill="currentColor" />
          <circle cx="9" cy="11" r="2" fill="currentColor" />
          <circle cx="13" cy="15" r="2" fill="currentColor" />
          <circle cx="21" cy="7" r="2" fill="currentColor" />
        </svg>
        <span>Line</span>
      </button>
    </div>
  );
}
