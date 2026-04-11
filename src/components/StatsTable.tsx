import type { TeamRollingAverage } from '../types';
import { getTeamColor } from '../utils/teamColors';
import './StatsTable.css';

interface StatsTableProps {
  data: TeamRollingAverage[];
  selectedTeams: string[];
  leagueAverage: number;
}

export function StatsTable({ data, selectedTeams, leagueAverage }: StatsTableProps) {
  const getDiffClass = (average: number): string => {
    const diff = average - leagueAverage;
    if (diff > 0.2) return 'positive';
    if (diff < -0.2) return 'negative';
    return 'neutral';
  };

  return (
    <div className="stats-table-container">
      <h3>Team Statistics</h3>
      <div className="stats-table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Avg xG</th>
              <th>vs Avg</th>
            </tr>
          </thead>
          <tbody>
            {data.map((team, index) => {
              const isSelected = selectedTeams.includes(team.team);
              const diff = team.average - leagueAverage;
              return (
                <tr
                  key={team.team}
                  className={`${isSelected ? 'selected' : ''} ${selectedTeams.length > 0 && !isSelected ? 'dimmed' : ''}`}
                >
                  <td className="rank">{index + 1}</td>
                  <td className="team-name">
                    <span
                      className="team-color-indicator"
                      style={{ backgroundColor: getTeamColor(team.team) }}
                    />
                    {team.team}
                  </td>
                  <td className="xg-value">{team.average.toFixed(2)}</td>
                  <td className={`diff ${getDiffClass(team.average)}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
