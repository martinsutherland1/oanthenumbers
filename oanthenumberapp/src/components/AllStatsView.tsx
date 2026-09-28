import { useMemo, useState } from 'react';
import { XG_TYPES, getTeamXgTotals, getTeamXPointsTotals, type TeamStatTotal } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import type { Fixture } from '../types';
import './AllStatsView.css';

interface AllStatsViewProps {
  fixtures: Fixture[];
}

type SortKey = 'total' | 'perGame';

function StatTable({ title, description, rows }: { title: string; description: string; rows: TeamStatTotal[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('perGame');

  const sorted = useMemo(() => [...rows].sort((a, b) => b[sortKey] - a[sortKey]), [rows, sortKey]);

  const th = (key: SortKey, label: string) => (
    <th
      className={`allstats-val-col xgvg-sortable ${sortKey === key ? 'xgvg-active' : ''}`}
      onClick={() => setSortKey(key)}
    >
      {label}{sortKey === key ? ' ▼' : ''}
    </th>
  );

  return (
    <div className="stats-section">
      <h4>{title} <span className="stats-note">{description}</span></h4>
      <table className="stats-table">
        <thead>
          <tr>
            <th className="stats-rank-col">#</th>
            <th>Team</th>
            {th('total', 'Total')}
            {th('perGame', 'P90')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.team}>
              <td className="stats-rank">{i + 1}</td>
              <td>
                <div className="stats-team-cell">
                  <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                  <span className="stats-team-name">{getTeamName(row.team)}</span>
                </div>
              </td>
              <td className={`stats-num${sortKey === 'total' ? ' xgvg-active' : ''}`}>{row.total.toFixed(2)}</td>
              <td className={`stats-num${sortKey === 'perGame' ? ' xgvg-active' : ''}`}>{row.perGame.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AllStatsView({ fixtures }: AllStatsViewProps) {
  const xgTables = useMemo(
    () => XG_TYPES.map(t => ({ key: t.key, label: t.label, rows: getTeamXgTotals(fixtures, t.key) })),
    [fixtures]
  );
  const xPointsRows = useMemo(() => getTeamXPointsTotals(fixtures), [fixtures]);

  return (
    <div className="allstats-view">
      <div className="stats-tables-grid">
        {xgTables.map(t => (
          <StatTable key={t.key} title={t.label} description="best to worst" rows={t.rows} />
        ))}
        <StatTable title="xPoints" description="best to worst" rows={xPointsRows} />
      </div>
    </div>
  );
}
