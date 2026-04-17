import type { H2HRecord } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './H2HTable.css';

interface H2HTableProps {
  team: string;
  data: H2HRecord[];
}

export function H2HTable({ team, data }: H2HTableProps) {
  return (
    <div className="h2h-table-container">
      <h3>{getTeamName(team)}</h3>
      <div className="h2h-table-wrapper">
        <table className="h2h-table">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>Points</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.opponent}>
                <td className="h2h-opponent-name">
                  <span
                    className="team-color-dot"
                    style={{ backgroundColor: getTeamColor(row.opponent) }}
                  />
                  v {getTeamName(row.opponent)}
                </td>
                <td className="h2h-num">{row.played}</td>
                <td className="h2h-num h2h-wins">{row.wins}</td>
                <td className="h2h-num h2h-draws">{row.draws}</td>
                <td className="h2h-num h2h-losses">{row.losses}</td>
                <td className="h2h-num h2h-points">{row.points}/{row.possiblePoints}</td>
                <td className={`h2h-num h2h-pct ${row.winPct >= 50 ? 'positive' : row.winPct >= 33 ? 'neutral' : 'negative'}`}>
                  {row.winPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
