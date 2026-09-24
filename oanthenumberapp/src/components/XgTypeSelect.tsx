import { XG_TYPES, type XgType } from '../utils/dataProcessing';
import './XgTypeSelect.css';

interface XgTypeSelectProps {
  value: XgType;
  onChange: (value: XgType) => void;
}

// Inline dropdown that sits inside a heading, inheriting its font so it reads as part of the title
export function XgTypeSelect({ value, onChange }: XgTypeSelectProps) {
  return (
    <select
      className="xg-type-select"
      value={value}
      onChange={e => onChange(e.target.value as XgType)}
      aria-label="xG type"
    >
      {XG_TYPES.map(t => (
        <option key={t.key} value={t.key}>{t.label}</option>
      ))}
    </select>
  );
}
