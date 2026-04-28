import { useMemo, useState } from 'react';
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

function StreakRow({ period, record }: { period: string; record: StreakRecord }) {
  return (
    <div className="stat-card-row">
      <span className="stat-row-period">{period}</span>
      <div className="stat-card-team">
        <span className="team-color-dot" style={{ backgroundColor: getTeamColor(record.team) }} />
        <span className="stat-card-name">{getTeamName(record.team)}</span>
      </div>
      <div className="streak-inline">
        <span className="stat-card-value">{record.games}</span>
        <StreakIndicator isActive={record.isActive} />
      </div>
    </div>
  );
}

function StreakCard({ label, records }: { label: string; records: StreakRecord[] }) {
  if (records.length === 0) return null;
  const best = records[0];
  const currentActive = records.find(r => r.isActive);
  const showBothRows = currentActive && (currentActive.team !== best.team || currentActive.games !== best.games);

  return (
    <div className="stat-card stat-card-streak">
      <span className="stat-card-label">{label} <span className="stat-per-game">2+ games</span></span>
      {showBothRows
        ? <>
            <StreakRow period="Current" record={currentActive} />
            <StreakRow period="Record"  record={best} />
          </>
        : <StreakRow period={best.isActive ? 'Current' : 'Record'} record={best} />
      }
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
        <span className="stat-row-period">Last 6</span>
        <div className="stat-card-team">
          <span className="team-color-dot" style={{ backgroundColor: getTeamColor(recentTeam) }} />
          <span className="stat-card-name">{getTeamName(recentTeam)}</span>
        </div>
        <span className="stat-card-value">{recentValue}</span>
      </div>
      <div className="stat-card-row">
        <span className="stat-row-period">Season</span>
        <div className="stat-card-team">
          <span className="team-color-dot" style={{ backgroundColor: getTeamColor(seasonTeam) }} />
          <span className="stat-card-name">{getTeamName(seasonTeam)}</span>
        </div>
        <span className="stat-card-value">{seasonValue}</span>
      </div>
    </div>
  );
}

type StatsMode = 'perGame' | 'total';

interface StatRow {
  team: string;
  a: number; b: number; diff: number;
}

function TriColTable({ title, note, colA, colB, colDiff, rows }: {
  title: string; note: string;
  colA: string; colB: string; colDiff: string;
  rows: StatRow[];
}) {
  type Key = 'a' | 'b' | 'diff';
  const [sortKey, setSortKey] = useState<Key>('a');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const diff = b[sortKey] - a[sortKey];
    return sortDir === 'desc' ? diff : -diff;
  }), [rows, sortKey, sortDir]);

  const handleSort = (key: Key) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const th = (key: Key, label: string) => (
    <th
      key={key}
      className={`allstats-val-col xgvg-sortable ${sortKey === key ? 'xgvg-active' : ''}`}
      onClick={() => handleSort(key)}
    >
      {label}{sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  );

  return (
    <div className="stats-section xgvg-section">
      <h4>{title} <span className="stats-note">{note}</span></h4>
      <table className="stats-table">
        <thead>
          <tr>
            <th className="stats-rank-col">#</th>
            <th>Team</th>
            {th('a', colA)}
            {th('b', colB)}
            {th('diff', colDiff)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.team}>
              <td className="stats-rank">{i + 1}</td>
              <td>
                <div className="stats-team-cell">
                  <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                  {getTeamName(row.team)}
                </div>
              </td>
              <td className={`stats-num${sortKey === 'a' ? ' xgvg-active' : ''}`}>{row.a % 1 === 0 ? row.a : row.a.toFixed(2)}</td>
              <td className={`stats-num${sortKey === 'b' ? ' xgvg-active' : ''}`}>{row.b % 1 === 0 ? row.b : row.b.toFixed(2)}</td>
              <td className={`stats-num${sortKey === 'diff' ? ' xgvg-active' : ''}${row.diff > 0 ? ' diff-positive' : row.diff < 0 ? ' diff-negative' : ''}`}>
                {row.diff > 0 ? '+' : ''}{row.diff % 1 === 0 ? row.diff : row.diff.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllStatsTable({ season, recent }: { season: TeamSeasonStats[]; recent: TeamSeasonStats[] }) {
  const [mode, setMode] = useState<StatsMode>('perGame');

  const recentMap = useMemo(() => {
    const m = new Map<string, TeamSeasonStats>();
    recent.forEach(r => m.set(r.team, r));
    return m;
  }, [recent]);

  const { sXG, sGoals, r6XG, r6Goals } = useMemo(() => {
    const pg = mode === 'perGame';
    const sXG: StatRow[] = season.map(s => {
      const a = pg ? s.xgPerGame        : s.totalXg;
      const b = pg ? s.xgAgainstPerGame : s.totalXgAgainst;
      return { team: s.team, a, b, diff: parseFloat((a - b).toFixed(2)) };
    });
    const sGoals: StatRow[] = season.map(s => {
      const a = pg ? s.goalsPerGame        : s.totalGoals;
      const b = pg ? s.goalsAgainstPerGame : s.totalGoalsAgainst;
      return { team: s.team, a, b, diff: parseFloat((a - b).toFixed(2)) };
    });
    const r6XG: StatRow[] = season.map(s => {
      const r = recentMap.get(s.team);
      const a = pg ? (r?.xgPerGame ?? 0)        : (r?.totalXg ?? 0);
      const b = pg ? (r?.xgAgainstPerGame ?? 0)  : (r?.totalXgAgainst ?? 0);
      return { team: s.team, a, b, diff: parseFloat((a - b).toFixed(2)) };
    });
    const r6Goals: StatRow[] = season.map(s => {
      const r = recentMap.get(s.team);
      const a = pg ? (r?.goalsPerGame ?? 0)        : (r?.totalGoals ?? 0);
      const b = pg ? (r?.goalsAgainstPerGame ?? 0)  : (r?.totalGoalsAgainst ?? 0);
      return { team: s.team, a, b, diff: parseFloat((a - b).toFixed(2)) };
    });
    return { sXG, sGoals, r6XG, r6Goals };
  }, [season, recentMap, mode]);

  const note = mode === 'perGame' ? 'per game' : 'total';

  return (
    <div className="allstats-wrapper">
      <div className="allstats-mode-toggle">
        <button className={`allstats-toggle-btn ${mode === 'perGame' ? 'active' : ''}`} onClick={() => setMode('perGame')}>Per Game</button>
        <button className={`allstats-toggle-btn ${mode === 'total' ? 'active' : ''}`} onClick={() => setMode('total')}>Total</button>
      </div>
      <div className="stats-tables-grid">
        <TriColTable title="Last 6 — xG"    note={note} colA="xGF" colB="xGA" colDiff="xGD" rows={r6XG} />
        <TriColTable title="Last 6 — Goals" note={note} colA="GF"  colB="GA"  colDiff="GD"  rows={r6Goals} />
        <TriColTable title="Season — xG"    note={note} colA="xGF" colB="xGA" colDiff="xGD" rows={sXG} />
        <TriColTable title="Season — Goals" note={note} colA="GF"  colB="GA"  colDiff="GD"  rows={sGoals} />
      </div>
    </div>
  );
}

export function StatsView({ stats, recentStats, unbeatenRuns, gamesWithoutWin, winStreaks }: StatsViewProps) {
  const byGD   = useMemo(() => [...stats].sort((a, b) => b.goalDiffPerGame - a.goalDiffPerGame), [stats]);
  const byXGD  = useMemo(() => [...stats].sort((a, b) => b.xgDiffPerGame - a.xgDiffPerGame), [stats]);
  const byPPG  = useMemo(() => [...stats].sort((a, b) => b.pointsPerGame - a.pointsPerGame), [stats]);
  const rByGD  = useMemo(() => [...recentStats].sort((a, b) => b.goalDiffPerGame - a.goalDiffPerGame), [recentStats]);
  const rByXGD = useMemo(() => [...recentStats].sort((a, b) => b.xgDiffPerGame - a.xgDiffPerGame), [recentStats]);
  const rByPPG = useMemo(() => [...recentStats].sort((a, b) => b.pointsPerGame - a.pointsPerGame), [recentStats]);

  return (
    <div className="stats-view">
      <div className="stat-cards">
        <StreakCard label="Wins in a Row" records={winStreaks} />
        <StreakCard label="Unbeaten"      records={unbeatenRuns} />
        <StreakCard label="Winless"       records={gamesWithoutWin} />

        {byPPG.length > 0 && rByPPG.length > 0 && (
          <DualStatCard
            label="Points"
            seasonTeam={byPPG[0].team}  seasonValue={byPPG[0].pointsPerGame.toFixed(2)}
            recentTeam={rByPPG[0].team} recentValue={rByPPG[0].pointsPerGame.toFixed(2)}
          />
        )}
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

      <AllStatsTable season={stats} recent={recentStats} />
    </div>
  );
}
