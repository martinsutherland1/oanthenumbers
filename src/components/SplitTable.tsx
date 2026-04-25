import type { SplitData, LeagueTableRow } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './LeagueTable.css';
import './SplitTable.css';

interface SplitTableProps {
  data: SplitData;
}

function FormSquares({ form }: { form: ('W' | 'D' | 'L')[] }) {
  return (
    <div className="form-squares">
      {form.map((result, i) => (
        <span key={i} className={`form-square form-${result}`} title={result} />
      ))}
    </div>
  );
}

function GroupTable({ rows, title }: { rows: LeagueTableRow[]; title: string }) {
  return (
    <div className="split-group">
      <h4 className="split-group-title">{title}</h4>
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
              <th className="col-form">Form</th>
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
                <td className="col-form"><FormSquares form={row.form} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SplitTable({ data }: SplitTableProps) {
  return (
    <div className="split-table-container">
      {!data.hasPostSplitGames && (
        <p className="split-note">Split fixtures not yet played — groups based on current standings.</p>
      )}
      <GroupTable rows={data.championship} title="Championship Group" />
      <GroupTable rows={data.relegation} title="Relegation Group" />
    </div>
  );
}
