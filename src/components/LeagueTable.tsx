import type { LeagueTableRow } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import { NEXT_FIXTURES } from '../data/nextFixtures';
import './LeagueTable.css';

interface LeagueTableProps {
  data: LeagueTableRow[];
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

export function LeagueTable({ data }: LeagueTableProps) {
  const formByTeam = Object.fromEntries(data.map(r => [r.team, r.form]));

  return (
    <div className="league-table-container">
      <h3>League Table</h3>
      <div className="league-table-wrapper">
        <table className="league-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-team">Team</th>
              <th>P</th>
              <th className="hide-mobile">W</th>
              <th className="hide-mobile">D</th>
              <th className="hide-mobile">L</th>
              <th className="hide-mobile">GF</th>
              <th className="hide-mobile">GA</th>
              <th>GD</th>
              <th>Pts</th>
              <th className="col-form">Form</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.team} className={[1, 6, 11, 12].includes(row.position) ? 'divider-below' : ''}>
                <td className="col-pos">{row.position}</td>
                <td className="col-team">
                  <div className="team-cell">
                    <span
                      className="team-color-dot"
                      style={{ backgroundColor: getTeamColor(row.team) }}
                    />
                    {getTeamName(row.team)}
                  </div>
                </td>
                <td>{row.played}</td>
                <td className="hide-mobile col-w">{row.won}</td>
                <td className="hide-mobile col-d">{row.drawn}</td>
                <td className="hide-mobile col-l">{row.lost}</td>
                <td className="hide-mobile">{row.goalsFor}</td>
                <td className="hide-mobile">{row.goalsAgainst}</td>
                <td className={row.goalDiff > 0 ? 'positive' : row.goalDiff < 0 ? 'negative' : ''}>
                  {row.goalDiff > 0 ? '+' : ''}{row.goalDiff}
                </td>
                <td className="col-pts">{row.points}</td>
                <td className="col-form"><FormSquares form={row.form} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="next-fixtures">
        <h4>Next Fixtures</h4>
        {NEXT_FIXTURES.map(([home, away]) => (
          <div key={`${home}-${away}`} className="fixture-row">
            <div className="fixture-team fixture-home">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(home) }} />
              <span className="fixture-name">{getTeamName(home)}</span>
            </div>
            <div className="fixture-centre">
              <FormSquares form={formByTeam[home] ?? []} />
              <span className="fixture-vs">v</span>
              <FormSquares form={formByTeam[away] ?? []} />
            </div>
            <div className="fixture-team fixture-away">
              <span className="fixture-name">{getTeamName(away)}</span>
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(away) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
