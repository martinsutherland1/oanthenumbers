import './ViewToggle.css';

interface ViewToggleProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function ViewToggle<T extends string>({ options, value, onChange, ariaLabel }: ViewToggleProps<T>) {
  return (
    <div className="view-toggle" role="group" aria-label={ariaLabel}>
      {options.map(o => (
        <button
          key={o.key}
          className={`view-toggle-btn ${value === o.key ? 'active' : ''}`}
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
