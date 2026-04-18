import { useState } from 'react';
import type { TeamFullStats } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './StatsTable.css';

type SortKey = 'avgPoints' | 'avgGoals' | 'avgXg';

interface StatsTableProps {
  data: TeamFullStats[];
}

export function StatsTable({ data }: StatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('avgXg');

  const sorted = [...data].sort((a, b) => b[sortKey] - a[sortKey]);

  const colHeader = (label: string, key: SortKey) => (
    <th
      className={`sortable ${sortKey === key ? 'sort-active' : ''}`}
      onClick={() => setSortKey(key)}
    >
      {label}
      <span className="sort-indicator">{sortKey === key ? ' ▼' : ''}</span>
    </th>
  );

  return (
    <div className="stats-table-container">
      <h3>Team Statistics <span className="stats-subtitle">Rolling 10-game average</span></h3>
      <div className="stats-table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              {colHeader('Pts/Game', 'avgPoints')}
              {colHeader('Goal Diff', 'avgGoals')}
              {colHeader('xG Diff', 'avgXg')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, index) => (
              <tr key={team.team}>
                <td className="rank">{index + 1}</td>
                <td className="team-name">
                  <span
                    className="team-color-indicator"
                    style={{ backgroundColor: getTeamColor(team.team) }}
                  />
                  {getTeamName(team.team)}
                </td>
                <td className="xg-value">{team.avgPoints.toFixed(2)}</td>
                <td className={`diff ${team.avgGoals > 0 ? 'positive' : team.avgGoals < 0 ? 'negative' : 'neutral'}`}>
                  {team.avgGoals >= 0 ? '+' : ''}{team.avgGoals.toFixed(2)}
                </td>
                <td className={`diff ${team.avgXg > 0 ? 'positive' : team.avgXg < 0 ? 'negative' : 'neutral'}`}>
                  {team.avgXg >= 0 ? '+' : ''}{team.avgXg.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
