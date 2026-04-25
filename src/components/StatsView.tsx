import { useMemo } from 'react';
import type { TeamSeasonStats, UnbeatenRun } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './StatsView.css';

interface StatsViewProps {
  stats: TeamSeasonStats[];
  recentStats: TeamSeasonStats[];
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

interface DualCardProps {
  label: string;
  seasonTeam: string;
  seasonValue: string;
  recentTeam: string;
  recentValue: string;
}

function DualStatCard({ label, seasonTeam, seasonValue, recentTeam, recentValue }: DualCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label} <span className="stat-per-game">per game</span></span>
      <div className="stat-card-row">
        <span className="stat-row-period">Season</span>
        <div className="stat-card-team">
          <span className="team-color-dot" style={{ backgroundColor: getTeamColor(seasonTeam) }} />
          <span className="stat-card-name">{getTeamName(seasonTeam)}</span>
        </div>
        <span className="stat-card-value">{seasonValue}</span>
      </div>
      <div className="stat-card-row">
        <span className="stat-row-period">Last 6</span>
        <div className="stat-card-team">
          <span className="team-color-dot" style={{ backgroundColor: getTeamColor(recentTeam) }} />
          <span className="stat-card-name">{getTeamName(recentTeam)}</span>
        </div>
        <span className="stat-card-value">{recentValue}</span>
      </div>
    </div>
  );
}

export function StatsView({ stats, recentStats, unbeatenRuns, gamesWithoutWin }: StatsViewProps) {
  const byGoals  = useMemo(() => [...stats].sort((a, b) => b.goalsPerGame - a.goalsPerGame), [stats]);
  const byGA     = useMemo(() => [...stats].sort((a, b) => a.goalsAgainstPerGame - b.goalsAgainstPerGame), [stats]);
  const byXg     = useMemo(() => [...stats].sort((a, b) => b.xgPerGame - a.xgPerGame), [stats]);
  const byXgA    = useMemo(() => [...stats].sort((a, b) => a.xgAgainstPerGame - b.xgAgainstPerGame), [stats]);

  const rByGoals = useMemo(() => [...recentStats].sort((a, b) => b.goalsPerGame - a.goalsPerGame), [recentStats]);
  const rByGA    = useMemo(() => [...recentStats].sort((a, b) => a.goalsAgainstPerGame - b.goalsAgainstPerGame), [recentStats]);
  const rByXg    = useMemo(() => [...recentStats].sort((a, b) => b.xgPerGame - a.xgPerGame), [recentStats]);
  const rByXgA   = useMemo(() => [...recentStats].sort((a, b) => a.xgAgainstPerGame - b.xgAgainstPerGame), [recentStats]);

  const filteredRuns    = useMemo(() => unbeatenRuns.filter(r => r.games > 1), [unbeatenRuns]);
  const filteredWinless = useMemo(() => gamesWithoutWin.filter(r => r.games > 1), [gamesWithoutWin]);

  return (
    <div className="stats-view">
      <div className="stat-cards">
        {filteredRuns.length > 0 && (
          <div className="stat-card stat-card-streak">
            <span className="stat-card-label">Unbeaten <span className="stat-per-game">2+ games</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(filteredRuns[0].team) }} />
              <span className="stat-card-name">{getTeamName(filteredRuns[0].team)}</span>
            </div>
            <span className="stat-card-value">{filteredRuns[0].games}</span>
          </div>
        )}

        {filteredWinless.length > 0 && (
          <div className="stat-card stat-card-streak">
            <span className="stat-card-label">Winless <span className="stat-per-game">2+ games</span></span>
            <div className="stat-card-team">
              <span className="team-color-dot" style={{ backgroundColor: getTeamColor(filteredWinless[0].team) }} />
              <span className="stat-card-name">{getTeamName(filteredWinless[0].team)}</span>
            </div>
            <span className="stat-card-value">{filteredWinless[0].games}</span>
          </div>
        )}

        {byGoals.length > 0 && rByGoals.length > 0 && (
          <DualStatCard
            label="Goals For"
            seasonTeam={byGoals[0].team}   seasonValue={byGoals[0].goalsPerGame.toFixed(2)}
            recentTeam={rByGoals[0].team}  recentValue={rByGoals[0].goalsPerGame.toFixed(2)}
          />
        )}
        {byGA.length > 0 && rByGA.length > 0 && (
          <DualStatCard
            label="Goals Against"
            seasonTeam={byGA[0].team}   seasonValue={byGA[0].goalsAgainstPerGame.toFixed(2)}
            recentTeam={rByGA[0].team}  recentValue={rByGA[0].goalsAgainstPerGame.toFixed(2)}
          />
        )}
        {byXg.length > 0 && rByXg.length > 0 && (
          <DualStatCard
            label="xG For"
            seasonTeam={byXg[0].team}   seasonValue={byXg[0].xgPerGame.toFixed(2)}
            recentTeam={rByXg[0].team}  recentValue={rByXg[0].xgPerGame.toFixed(2)}
          />
        )}
        {byXgA.length > 0 && rByXgA.length > 0 && (
          <DualStatCard
            label="xG Against"
            seasonTeam={byXgA[0].team}   seasonValue={byXgA[0].xgAgainstPerGame.toFixed(2)}
            recentTeam={rByXgA[0].team}  recentValue={rByXgA[0].xgAgainstPerGame.toFixed(2)}
          />
        )}
      </div>

      <div className="stats-tables-grid">
        <StatTableSection title="Goals For"     rows={byGoals} valueKey="goalsPerGame" />
        <StatTableSection title="Goals Against" rows={byGA}    valueKey="goalsAgainstPerGame" />
        <StatTableSection title="xG For"        rows={byXg}   valueKey="xgPerGame" />
        <StatTableSection title="xG Against"    rows={byXgA}  valueKey="xgAgainstPerGame" />
      </div>
    </div>
  );
}
