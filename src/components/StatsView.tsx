import { useMemo } from 'react';
import type { TeamSeasonStats, StreakRecord } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './StatsView.css';

interface StatsViewProps {
  stats: TeamSeasonStats[];
  recentStats: TeamSeasonStats[];
  unbeatenRuns: StreakRecord[];
  gamesWithoutWin: StreakRecord[];
  winStreaks: StreakRecord[];
}

function StreakIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span className={`streak-indicator ${isActive ? 'streak-active' : 'streak-record'}`} title={isActive ? 'Active' : 'Record'}>
      {isActive ? '●' : '★'}
    </span>
  );
}

function StreakCard({ label, records }: { label: string; records: StreakRecord[] }) {
  if (records.length === 0) return null;
  const top = records[0];
  return (
    <div className="stat-card stat-card-streak">
      <span className="stat-card-label">{label} <span className="stat-per-game">2+ games</span></span>
      <div className="stat-card-team">
        <span className="team-color-dot" style={{ backgroundColor: getTeamColor(top.team) }} />
        <span className="stat-card-name">{getTeamName(top.team)}</span>
      </div>
      <div className="streak-value-row">
        <span className="stat-card-value">{top.games}</span>
        <StreakIndicator isActive={top.isActive} />
      </div>
    </div>
  );
}

function DualStatCard({ label, seasonTeam, seasonValue, recentTeam, recentValue }: {
  label: string; seasonTeam: string; seasonValue: string; recentTeam: string; recentValue: string;
}) {
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

function DiffTable({ title, rows, valueKey }: {
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
          {rows.map((row, i) => {
            const val = row[valueKey] as number;
            return (
              <tr key={row.team}>
                <td className="stats-rank">{i + 1}</td>
                <td>
                  <div className="stats-team-cell">
                    <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                    {getTeamName(row.team)}
                  </div>
                </td>
                <td className={`stats-num stats-highlight ${val > 0 ? 'diff-positive' : val < 0 ? 'diff-negative' : ''}`}>
                  {val > 0 ? '+' : ''}{val.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StatsView({ stats, recentStats, unbeatenRuns, gamesWithoutWin, winStreaks }: StatsViewProps) {
  const byGD  = useMemo(() => [...stats].sort((a, b) => b.goalDiffPerGame - a.goalDiffPerGame), [stats]);
  const byXGD = useMemo(() => [...stats].sort((a, b) => b.xgDiffPerGame - a.xgDiffPerGame), [stats]);
  const rByGD  = useMemo(() => [...recentStats].sort((a, b) => b.goalDiffPerGame - a.goalDiffPerGame), [recentStats]);
  const rByXGD = useMemo(() => [...recentStats].sort((a, b) => b.xgDiffPerGame - a.xgDiffPerGame), [recentStats]);

  return (
    <div className="stats-view">
      <div className="stat-cards">
        <StreakCard label="Wins in a Row"  records={winStreaks} />
        <StreakCard label="Unbeaten"       records={unbeatenRuns} />
        <StreakCard label="Winless"        records={gamesWithoutWin} />

        {byGD.length > 0 && rByGD.length > 0 && (
          <DualStatCard
            label="Goal Diff"
            seasonTeam={byGD[0].team}   seasonValue={(byGD[0].goalDiffPerGame > 0 ? '+' : '') + byGD[0].goalDiffPerGame.toFixed(2)}
            recentTeam={rByGD[0].team}  recentValue={(rByGD[0].goalDiffPerGame > 0 ? '+' : '') + rByGD[0].goalDiffPerGame.toFixed(2)}
          />
        )}
        {byXGD.length > 0 && rByXGD.length > 0 && (
          <DualStatCard
            label="xG Diff"
            seasonTeam={byXGD[0].team}   seasonValue={(byXGD[0].xgDiffPerGame > 0 ? '+' : '') + byXGD[0].xgDiffPerGame.toFixed(2)}
            recentTeam={rByXGD[0].team}  recentValue={(rByXGD[0].xgDiffPerGame > 0 ? '+' : '') + rByXGD[0].xgDiffPerGame.toFixed(2)}
          />
        )}
      </div>

      <div className="streak-key">
        <span className="streak-indicator streak-active">●</span> Active
        <span className="streak-key-sep" />
        <span className="streak-indicator streak-record">★</span> Record
      </div>

      <div className="stats-tables-grid">
        <DiffTable title="Goal Difference" rows={byGD}  valueKey="goalDiffPerGame" />
        <DiffTable title="xG Difference"   rows={byXGD} valueKey="xgDiffPerGame" />
      </div>
    </div>
  );
}
