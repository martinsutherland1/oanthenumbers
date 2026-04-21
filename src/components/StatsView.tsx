import { useMemo } from 'react';
import type { TeamSeasonStats, UnbeatenRun } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './StatsView.css';

interface StatsViewProps {
  stats: TeamSeasonStats[];
  unbeatenRuns: UnbeatenRun[];
  gamesWithoutWin: UnbeatenRun[];
}

function StatTableSection({
  title,
  rows,
  valueKey,
}: {
  title: string;
  rows: TeamSeasonStats[];
  valueKey: keyof TeamSeasonStats;
}) {
  return (
    <div className="stats-section">
      <h4>{title} <span className="stats-note">per game</span></h4>
      <table className="stats-table">
        <thead>
          <tr>
            <th className="stats-rank-col">#</th>
            <th>Team</th>
            <th className="stats-val-col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.team}>
              <td className="stats-rank">{i + 1}</td>
              <td>
                <div className="stats-team-cell">
                  <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                  {getTeamName(row.team)}
                </div>
              </td>
              <td className="stats-num stats-highlight">
                {(row[valueKey] as number).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatsView({ stats, unbeatenRuns, gamesWithoutWin }: StatsViewProps) {
  const byGoals = useMemo(() => [...stats].sort((a, b) => b.goalsPerGame - a.goalsPerGame), [stats]);
  const byGA    = useMemo(() => [...stats].sort((a, b) => a.goalsAgainstPerGame - b.goalsAgainstPerGame), [stats]);
  const byXg    = useMemo(() => [...stats].sort((a, b) => b.xgPerGame - a.xgPerGame), [stats]);
  const byXgA   = useMemo(() => [...stats].sort((a, b) => a.xgAgainstPerGame - b.xgAgainstPerGame), [stats]);
  const filteredRuns    = useMemo(() => unbeatenRuns.filter(r => r.games > 1), [unbeatenRuns]);
  const filteredWinless = useMemo(() => gamesWithoutWin.filter(r => r.games > 1), [gamesWithoutWin]);

  return (
    <div className="stats-view">
      <div className="stat-cards">
        {filteredRuns.length > 0 && (
          <div className="stat-card">
            <span className="stat-card-label">Unbeaten <span className="stat-per-game">2+ games</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(filteredRuns[0].team) }} />
              <span className="stat-card-name">{getTeamName(filteredRuns[0].team)}</span>
            </div>
            <span className="stat-card-value">{filteredRuns[0].games}</span>
          </div>
        )}

        {filteredWinless.length > 0 && (
          <div className="stat-card">
            <span className="stat-card-label">Winless <span className="stat-per-game">2+ games</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(filteredWinless[0].team) }} />
              <span className="stat-card-name">{getTeamName(filteredWinless[0].team)}</span>
            </div>
            <span className="stat-card-value">{filteredWinless[0].games}</span>
          </div>
        )}

        {byGoals.length > 0 && (
          <div className="stat-card">
            <span className="stat-card-label">Goals For <span className="stat-per-game">per game</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(byGoals[0].team) }} />
              <span className="stat-card-name">{getTeamName(byGoals[0].team)}</span>
            </div>
            <span className="stat-card-value">{byGoals[0].goalsPerGame.toFixed(2)}</span>
          </div>
        )}

        {byGA.length > 0 && (
          <div className="stat-card">
            <span className="stat-card-label">Goals Against <span className="stat-per-game">per game</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(byGA[0].team) }} />
              <span className="stat-card-name">{getTeamName(byGA[0].team)}</span>
            </div>
            <span className="stat-card-value">{byGA[0].goalsAgainstPerGame.toFixed(2)}</span>
          </div>
        )}

        {byXg.length > 0 && (
          <div className="stat-card">
            <span className="stat-card-label">xG For <span className="stat-per-game">per game</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(byXg[0].team) }} />
              <span className="stat-card-name">{getTeamName(byXg[0].team)}</span>
            </div>
            <span className="stat-card-value">{byXg[0].xgPerGame.toFixed(2)}</span>
          </div>
        )}

        {byXgA.length > 0 && (
          <div className="stat-card">
            <span className="stat-card-label">xG Against <span className="stat-per-game">per game</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(byXgA[0].team) }} />
              <span className="stat-card-name">{getTeamName(byXgA[0].team)}</span>
            </div>
            <span className="stat-card-value">{byXgA[0].xgAgainstPerGame.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="stats-tables-grid">
        <StatTableSection title="Goals For"    rows={byGoals} valueKey="goalsPerGame" />
        <StatTableSection title="Goals Against" rows={byGA}    valueKey="goalsAgainstPerGame" />
        <StatTableSection title="xG For"       rows={byXg}   valueKey="xgPerGame" />
        <StatTableSection title="xG Against"   rows={byXgA}  valueKey="xgAgainstPerGame" />
      </div>
    </div>
  );
}
