import type { MiniLeagueRow } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './LeagueTable.css';
import './H2HMiniLeague.css';

interface H2HMiniLeagueProps {
  rows: MiniLeagueRow[];
}

export function H2HMiniLeague({ rows }: H2HMiniLeagueProps) {
  return (
    <div className="mini-league-container">
      <h3>Head to Head</h3>
      <div className="league-table-wrapper">
        <table className="league-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-team">Team</th>
              <th className="col-p">P</th>
              <th className="hide-mobile">W</th>
              <th className="hide-mobile">D</th>
              <th className="hide-mobile">L</th>
              <th className="hide-mobile">GF</th>
              <th className="hide-mobile">GA</th>
              <th className="col-gd">GD</th>
              <th className="col-pts">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.team}>
                <td className="col-pos">{row.position}</td>
                <td className="col-team">
                  <div className="team-cell">
                    <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                    {getTeamName(row.team)}
                  </div>
                </td>
                <td className="col-p">{row.played}</td>
                <td className="hide-mobile col-w">{row.won}</td>
                <td className="hide-mobile col-d">{row.drawn}</td>
                <td className="hide-mobile col-l">{row.lost}</td>
                <td className="hide-mobile">{row.goalsFor}</td>
                <td className="hide-mobile">{row.goalsAgainst}</td>
                <td className={`col-gd ${row.goalDiff > 0 ? 'positive' : row.goalDiff < 0 ? 'negative' : ''}`}>
                  {row.goalDiff > 0 ? '+' : ''}{row.goalDiff}
                </td>
                <td className="col-pts">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.every(r => r.played === 0) && (
        <p className="mini-league-note">No fixtures between selected teams yet.</p>
      )}
    </div>
  );
}
