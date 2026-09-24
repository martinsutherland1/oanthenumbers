import { useState } from 'react';
import type { TeamBettingStats } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './BettingView.css';

type SortKey = keyof TeamBettingStats;

interface BettingTableProps {
  title: string;
  columns: { key: SortKey; label: string }[];
  rows: TeamBettingStats[];
}

function BettingTable({ title, columns, rows }: BettingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>(columns[0].key);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="betting-section">
      <h4>{title}</h4>
      <table className="betting-table">
        <thead>
          <tr>
            <th className="bet-rank-col">#</th>
            <th>Team</th>
            {columns.map(col => (
              <th
                key={col.key}
                className={`bet-val-col ${sortKey === col.key ? 'sort-active' : ''}`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <span className="sort-arrow">{sortKey === col.key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.team}>
              <td className="bet-rank">{i + 1}</td>
              <td>
                <div className="bet-team-cell">
                  <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                  {getTeamName(row.team)}
                </div>
              </td>
              {columns.map(col => (
                <td key={col.key} className={`bet-num ${sortKey === col.key ? 'sort-active' : ''}`}>
                  {row[col.key] as number}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface BettingViewProps {
  data: TeamBettingStats[];
}

export function BettingView({ data }: BettingViewProps) {
  return (
    <div className="betting-view">
      <BettingTable
        title="Goals"
        columns={[
          { key: 'btts', label: 'BTTS' },
          { key: 'over15', label: 'O1.5' },
          { key: 'over25', label: 'O2.5' },
          { key: 'over35', label: 'O3.5' },
          { key: 'over45', label: 'O4.5' },
        ]}
        rows={data}
      />
      <BettingTable
        title="Results"
        columns={[
          { key: 'winBy1', label: 'W by 1' },
          { key: 'winBy2Plus', label: 'W by 2+' },
          { key: 'scoreDraw', label: 'Score Draw' },
          { key: 'bttsWin', label: 'BTTS+Win' },
        ]}
        rows={data}
      />
      <BettingTable
        title="Defence"
        columns={[
          { key: 'cleanSheet', label: 'Clean Sheet' },
          { key: 'winToNil', label: 'Win to Nil' },
          { key: 'failedToScore', label: 'Failed to Score' },
        ]}
        rows={data}
      />
    </div>
  );
}
