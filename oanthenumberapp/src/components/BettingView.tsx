import { useState } from 'react';
import type { TeamBettingStats } from '../utils/dataProcessing';
import { getTeamName } from '../utils/teamColors';
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
      <p className="betting-note">
        Share of each team's games this season. Tap a column to sort.
      </p>
      <BettingTable
        title="Goals"
        columns={[
          { key: 'over15', label: 'O1.5' },
          { key: 'over25', label: 'O2.5' },
          { key: 'over35', label: 'O3.5' },
          { key: 'over45', label: 'O4.5' },
          { key: 'btts', label: 'BTTS' },
        ]}
        rows={data}
      />
      <BettingTable
        title="Results"
        columns={[
          { key: 'draw', label: 'Draw' },
          { key: 'bttsWin', label: 'BTTS & Win' },
          { key: 'bttsDraw', label: 'BTTS & Draw' },
          { key: 'winToNil', label: 'Win to Nil' },
        ]}
        rows={data}
      />
      <BettingTable
        title="Handicap"
        columns={[
          { key: 'hcapMinus2', label: '-2' },
          { key: 'hcapMinus1', label: '-1' },
          { key: 'hcapPlus1', label: '+1' },
          { key: 'hcapPlus2', label: '+2' },
        ]}
        rows={data}
      />
    </div>
  );
}
