import type { ProjectedStanding } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './LeagueTable.css';
import './ProjectionTable.css';

interface ProjectionTableProps {
  data: ProjectedStanding[];
  dividerPositions?: number[];
}

export function ProjectionTable({ data, dividerPositions = [] }: ProjectionTableProps) {
  return (
    <div className="league-table-container">
      <h3>Projected Final Standings</h3>
      <div className="league-table-wrapper">
        <table className="league-table projection-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-team">Team</th>
              <th className="hide-mobile col-p">P</th>
              <th className="hide-mobile col-cur-pts">Pts</th>
              <th className="col-xgdiff">xG Diff</th>
              <th className="hide-mobile col-xpts">xPts/Gm</th>
              <th className="hide-mobile col-rem">Rem.</th>
              <th className="col-pts col-proj-pts">Proj. Pts</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.team} className={dividerPositions.includes(row.projectedPosition) ? 'divider-below' : ''}>
                <td className="col-pos">{row.projectedPosition}</td>
                <td className="col-team">
                  <div className="team-cell">
                    <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                    <span className="team-cell-name">{getTeamName(row.team)}</span>
                  </div>
                </td>
                <td className="hide-mobile col-p">{row.played}</td>
                <td className="hide-mobile col-cur-pts">{row.points}</td>
                <td className={`col-xgdiff ${row.xgDiffPerGame > 0 ? 'positive' : row.xgDiffPerGame < 0 ? 'negative' : ''}`}>
                  {row.xgDiffPerGame > 0 ? '+' : ''}{row.xgDiffPerGame.toFixed(2)}
                </td>
                <td className="hide-mobile col-xpts">{row.xPointsPerGame.toFixed(1)}</td>
                <td className="hide-mobile col-rem">{row.remainingGames}</td>
                <td className="col-pts col-proj-pts">{row.projectedPoints.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
