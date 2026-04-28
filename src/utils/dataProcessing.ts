import type { Fixture, FixturesData, TeamGame, TeamRollingAverage, RollingAveragePoint, LineChartDataPoint } from '../types';
import { normalizeTeamName } from './teamColors';

export type MetricType = 'xg' | 'goals' | 'points';

// Parse date string in YYYY-MM-DD format
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Flatten date-keyed fixtures object into array, normalizing team name variants
export function flattenFixtures(fixturesData: FixturesData): Fixture[] {
  return Object.values(fixturesData).flat().map(f => ({
    ...f,
    home_team: normalizeTeamName(f.home_team),
    away_team: normalizeTeamName(f.away_team),
  }));
}

// Extract all unique teams from fixtures
export function extractTeams(fixtures: Fixture[]): string[] {
  const teams = new Set<string>();
  fixtures.forEach(fixture => {
    teams.add(fixture.home_team);
    teams.add(fixture.away_team);
  });
  return Array.from(teams).sort();
}

// Convert fixtures to individual team games with xG difference
export function fixtureToTeamGames(fixture: Fixture): TeamGame[] {
  const date = parseDate(fixture.date);
  // xG difference: team's npxG minus opponent's npxG
  const homeXgDiff = fixture.home_npxg - fixture.away_npxg;
  const awayXgDiff = fixture.away_npxg - fixture.home_npxg;
  return [
    {
      date,
      team: fixture.home_team,
      xgDiff: homeXgDiff,
      opponent: fixture.away_team,
      isHome: true
    },
    {
      date,
      team: fixture.away_team,
      xgDiff: awayXgDiff,
      opponent: fixture.home_team,
      isHome: false
    }
  ];
}

// Get all games for a specific team, sorted by date (most recent first)
export function getTeamGames(fixtures: Fixture[], team: string, metric: MetricType = 'xg'): TeamGame[] {
  const games: TeamGame[] = [];

  fixtures.forEach(fixture => {
    const date = parseDate(fixture.date);

    // Calculate difference based on metric type
    let homeDiff: number;
    let awayDiff: number;

    if (metric === 'goals') {
      homeDiff = fixture.home_goals - fixture.away_goals;
      awayDiff = fixture.away_goals - fixture.home_goals;
    } else if (metric === 'points') {
      const hg = fixture.home_goals ?? 0;
      const ag = fixture.away_goals ?? 0;
      homeDiff = hg > ag ? 3 : hg === ag ? 1 : 0;
      awayDiff = ag > hg ? 3 : ag === hg ? 1 : 0;
    } else {
      homeDiff = fixture.home_npxg - fixture.away_npxg;
      awayDiff = fixture.away_npxg - fixture.home_npxg;
    }

    if (fixture.home_team === team) {
      games.push({
        date,
        team,
        xgDiff: homeDiff,
        opponent: fixture.away_team,
        isHome: true
      });
    } else if (fixture.away_team === team) {
      games.push({
        date,
        team,
        xgDiff: awayDiff,
        opponent: fixture.home_team,
        isHome: false
      });
    }
  });

  // Sort by date, most recent first
  return games.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Calculate rolling average difference for a team (last 10 games or all if less than 10)
export function calculateRollingAverage(fixtures: Fixture[], team: string, maxGames: number = 10, metric: MetricType = 'xg'): TeamRollingAverage {
  const games = getTeamGames(fixtures, team, metric);
  const recentGames = games.slice(0, maxGames);

  if (recentGames.length === 0) {
    return { team, average: 0, gamesPlayed: 0 };
  }

  const totalDiff = recentGames.reduce((sum, game) => sum + game.xgDiff, 0);
  const average = totalDiff / recentGames.length;

  return {
    team,
    average: Math.round(average * 100) / 100,
    gamesPlayed: recentGames.length
  };
}

// Calculate league average (average of all team averages)
export function calculateLeagueAverage(fixtures: Fixture[], maxGames: number = 10, metric: MetricType = 'xg'): number {
  const teams = extractTeams(fixtures);
  const averages = teams.map(team => calculateRollingAverage(fixtures, team, maxGames, metric));

  if (averages.length === 0) return 0;

  const totalAverage = averages.reduce((sum, ta) => sum + ta.average, 0);
  return Math.round((totalAverage / averages.length) * 100) / 100;
}

// Full stats for a team across all three metrics
export interface TeamFullStats {
  team: string;
  avgXg: number;
  avgGoals: number;
  avgPoints: number;
  gamesPlayed: number;
}

export function getAllTeamFullStats(fixtures: Fixture[], maxGames: number = 10): TeamFullStats[] {
  const teams = extractTeams(fixtures);
  return teams.map(team => {
    const xg = calculateRollingAverage(fixtures, team, maxGames, 'xg');
    const goals = calculateRollingAverage(fixtures, team, maxGames, 'goals');
    const pts = calculateRollingAverage(fixtures, team, maxGames, 'points');
    return {
      team,
      avgXg: xg.average,
      avgGoals: goals.average,
      avgPoints: pts.average,
      gamesPlayed: xg.gamesPlayed,
    };
  });
}

// Get all team rolling averages
export function getAllTeamAverages(fixtures: Fixture[], maxGames: number = 10, metric: MetricType = 'xg'): TeamRollingAverage[] {
  const teams = extractTeams(fixtures);
  return teams.map(team => calculateRollingAverage(fixtures, team, maxGames, metric))
    .sort((a, b) => b.average - a.average);
}

// Get rolling average difference progression over time for a team
export function getTeamRollingAverageOverTime(fixtures: Fixture[], team: string, maxGames: number = 10, metric: MetricType = 'xg'): RollingAveragePoint[] {
  const games = getTeamGames(fixtures, team, metric);
  // Sort oldest first for chronological order
  const sortedGames = [...games].sort((a, b) => a.date.getTime() - b.date.getTime());

  const result: RollingAveragePoint[] = [];

  for (let i = 0; i < sortedGames.length; i++) {
    // Get games up to and including current game (max 10)
    const startIdx = Math.max(0, i + 1 - maxGames);
    const relevantGames = sortedGames.slice(startIdx, i + 1);

    const totalDiff = relevantGames.reduce((sum, game) => sum + game.xgDiff, 0);
    const average = totalDiff / relevantGames.length;

    result.push({
      matchNumber: i + 1,
      date: sortedGames[i].date,
      rollingAverage: Math.round(average * 100) / 100,
      opponent: sortedGames[i].opponent
    });
  }

  return result;
}

// Get rolling average for league average line (average of all teams at each match number)
export function getLeagueAverageOverTime(fixtures: Fixture[], maxGames: number = 10, metric: MetricType = 'xg'): Map<number, number> {
  const teams = extractTeams(fixtures);
  const maxMatchNumber = Math.max(
    ...teams.map(team => getTeamGames(fixtures, team, metric).length)
  );

  const averages = new Map<number, number>();

  for (let matchNum = 1; matchNum <= maxMatchNumber; matchNum++) {
    const teamAveragesAtMatch: number[] = [];

    teams.forEach(team => {
      const teamData = getTeamRollingAverageOverTime(fixtures, team, maxGames, metric);
      const point = teamData.find(p => p.matchNumber === matchNum);
      if (point) {
        teamAveragesAtMatch.push(point.rollingAverage);
      }
    });

    if (teamAveragesAtMatch.length > 0) {
      const avg = teamAveragesAtMatch.reduce((a, b) => a + b, 0) / teamAveragesAtMatch.length;
      averages.set(matchNum, Math.round(avg * 100) / 100);
    }
  }

  return averages;
}

// League table row
export interface LeagueTableRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export function getTeamForm(fixtures: Fixture[], team: string, count: number = 5): ('W' | 'D' | 'L')[] {
  return fixtures
    .filter(f => f.home_team === team || f.away_team === team)
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
    .slice(0, count)
    .reverse()
    .map(f => {
      const isHome = f.home_team === team;
      const scored = isHome ? f.home_goals : f.away_goals;
      const conceded = isHome ? f.away_goals : f.home_goals;
      return scored > conceded ? 'W' : scored === conceded ? 'D' : 'L';
    });
}

export function getLeagueTable(fixtures: Fixture[]): LeagueTableRow[] {
  const teams = extractTeams(fixtures);
  const stats = new Map<string, { won: number; drawn: number; lost: number; gf: number; ga: number }>();

  teams.forEach(t => stats.set(t, { won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 }));

  fixtures.forEach(f => {
    const h = stats.get(f.home_team)!;
    const a = stats.get(f.away_team)!;
    h.gf += f.home_goals; h.ga += f.away_goals;
    a.gf += f.away_goals; a.ga += f.home_goals;
    if (f.home_goals > f.away_goals)      { h.won++; a.lost++; }
    else if (f.home_goals === f.away_goals) { h.drawn++; a.drawn++; }
    else                                    { h.lost++; a.won++; }
  });

  const rows = teams.map(team => {
    const s = stats.get(team)!;
    const played = s.won + s.drawn + s.lost;
    return {
      position: 0,
      team,
      played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.gf,
      goalsAgainst: s.ga,
      goalDiff: s.gf - s.ga,
      points: s.won * 3 + s.drawn,
      form: getTeamForm(fixtures, team, 5),
    };
  });

  rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

// Mini-league: standings among a subset of selected teams
export interface MiniLeagueRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export function getMiniLeague(fixtures: Fixture[], teams: string[]): MiniLeagueRow[] {
  const teamSet = new Set(teams);
  const relevant = fixtures.filter(f => teamSet.has(f.home_team) && teamSet.has(f.away_team));
  const stats = new Map<string, { won: number; drawn: number; lost: number; gf: number; ga: number }>();
  teams.forEach(t => stats.set(t, { won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 }));

  relevant.forEach(f => {
    const h = stats.get(f.home_team)!;
    const a = stats.get(f.away_team)!;
    h.gf += f.home_goals ?? 0; h.ga += f.away_goals ?? 0;
    a.gf += f.away_goals ?? 0; a.ga += f.home_goals ?? 0;
    if ((f.home_goals ?? 0) > (f.away_goals ?? 0)) { h.won++; a.lost++; }
    else if (f.home_goals === f.away_goals)          { h.drawn++; a.drawn++; }
    else                                              { h.lost++; a.won++; }
  });

  const rows = teams.map(team => {
    const s = stats.get(team)!;
    const played = s.won + s.drawn + s.lost;
    return {
      position: 0, team, played,
      won: s.won, drawn: s.drawn, lost: s.lost,
      goalsFor: s.gf, goalsAgainst: s.ga,
      goalDiff: s.gf - s.ga,
      points: s.won * 3 + s.drawn,
    };
  });

  rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

// Partition fixtures into pre-split (first N games per team) and post-split
export function partitionFixtures(fixtures: Fixture[], splitAt: number = 33): { pre: Fixture[]; post: Fixture[] } {
  const teams = extractTeams(fixtures);
  const sorted = [...fixtures].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  const gameCount = new Map<string, number>();
  teams.forEach(t => gameCount.set(t, 0));
  const pre: Fixture[] = [];
  const post: Fixture[] = [];
  sorted.forEach(f => {
    const hCount = gameCount.get(f.home_team) ?? 0;
    const aCount = gameCount.get(f.away_team) ?? 0;
    if (hCount < splitAt && aCount < splitAt) {
      pre.push(f);
    } else {
      post.push(f);
    }
    gameCount.set(f.home_team, hCount + 1);
    gameCount.set(f.away_team, aCount + 1);
  });
  return { pre, post };
}

export interface SplitData {
  championship: LeagueTableRow[];
  relegation: LeagueTableRow[];
  hasPostSplitGames: boolean;
}

export function getSplitTable(fixtures: Fixture[], splitAt: number = 33): SplitData {
  const { pre, post } = partitionFixtures(fixtures, splitAt);
  const hasPostSplitGames = post.length > 0;
  const preSplitTable = getLeagueTable(pre.length > 0 ? pre : fixtures);
  const topTeams = new Set(preSplitTable.slice(0, 6).map(r => r.team));
  const fullTable = getLeagueTable(fixtures);
  const championship = fullTable
    .filter(r => topTeams.has(r.team))
    .map((r, i) => ({ ...r, position: i + 1 }));
  const relegation = fullTable
    .filter(r => !topTeams.has(r.team))
    .map((r, i) => ({ ...r, position: i + 1 }));
  return { championship, relegation, hasPostSplitGames };
}

// Head to head record for a team against each opponent
export interface H2HRecord {
  opponent: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  possiblePoints: number;
  winPct: number;
}

export function getH2HData(fixtures: Fixture[], team: string): H2HRecord[] {
  const records = new Map<string, { wins: number; draws: number; losses: number; gf: number; ga: number }>();

  fixtures.forEach(fixture => {
    let opponent = '';
    let teamGoals = 0;
    let oppGoals = 0;

    if (fixture.home_team === team) {
      opponent = fixture.away_team;
      teamGoals = fixture.home_goals;
      oppGoals = fixture.away_goals;
    } else if (fixture.away_team === team) {
      opponent = fixture.home_team;
      teamGoals = fixture.away_goals;
      oppGoals = fixture.home_goals;
    } else {
      return;
    }

    if (!records.has(opponent)) {
      records.set(opponent, { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
    }
    const rec = records.get(opponent)!;
    rec.gf += teamGoals;
    rec.ga += oppGoals;

    if (teamGoals > oppGoals) rec.wins++;
    else if (teamGoals === oppGoals) rec.draws++;
    else rec.losses++;
  });

  return Array.from(records.entries())
    .map(([opponent, rec]) => {
      const played = rec.wins + rec.draws + rec.losses;
      const points = rec.wins * 3 + rec.draws;
      const possiblePoints = played * 3;
      const winPct = played > 0 ? Math.round((rec.wins / played) * 100) : 0;
      return { opponent, played, wins: rec.wins, draws: rec.draws, losses: rec.losses, goalsFor: rec.gf, goalsAgainst: rec.ga, points, possiblePoints, winPct };
    })
    .sort((a, b) => b.points - a.points || b.winPct - a.winPct);
}

// Streak record with active indicator
export interface StreakRecord {
  team: string;
  games: number;
  isActive: boolean;
}

// Keep UnbeatenRun as alias for backwards compat
export type UnbeatenRun = StreakRecord;

function bestStreak(
  fixtures: Fixture[],
  team: string,
  matches: (scored: number, conceded: number) => boolean
): { games: number; isActive: boolean } {
  const sorted = fixtures
    .filter(f => f.home_team === team || f.away_team === team)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  let maxStreak = 0;
  let currentStreak = 0;
  for (const f of sorted) {
    const isHome = f.home_team === team;
    const scored = (isHome ? f.home_goals : f.away_goals) ?? 0;
    const conceded = (isHome ? f.away_goals : f.home_goals) ?? 0;
    if (matches(scored, conceded)) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }
  return { games: maxStreak, isActive: maxStreak > 0 && currentStreak === maxStreak };
}

export function getBestWinStreaks(fixtures: Fixture[]): StreakRecord[] {
  return extractTeams(fixtures)
    .map(team => ({ team, ...bestStreak(fixtures, team, (s, c) => s > c) }))
    .filter(r => r.games > 1)
    .sort((a, b) => b.games - a.games);
}

export function getBestUnbeatenStreaks(fixtures: Fixture[]): StreakRecord[] {
  return extractTeams(fixtures)
    .map(team => ({ team, ...bestStreak(fixtures, team, (s, c) => s >= c) }))
    .filter(r => r.games > 1)
    .sort((a, b) => b.games - a.games);
}

export function getBestWinlessStreaks(fixtures: Fixture[]): StreakRecord[] {
  return extractTeams(fixtures)
    .map(team => ({ team, ...bestStreak(fixtures, team, (s, c) => s <= c) }))
    .filter(r => r.games > 1)
    .sort((a, b) => b.games - a.games);
}

// Keep old names for any existing references
export const getUnbeatenRuns = getBestUnbeatenStreaks;
export const getGamesWithoutWin = getBestWinlessStreaks;

// Season-wide stats per team for the Stats tab
export interface TeamSeasonStats {
  team: string;
  gamesPlayed: number;
  totalGoals: number;
  totalGoalsAgainst: number;
  totalXg: number;
  totalXgAgainst: number;
  totalPoints: number;
  goalsPerGame: number;
  goalsAgainstPerGame: number;
  xgPerGame: number;
  xgAgainstPerGame: number;
  goalDiffPerGame: number;
  xgDiffPerGame: number;
  pointsPerGame: number;
}

export function getTeamSeasonStats(fixtures: Fixture[]): TeamSeasonStats[] {
  const teams = extractTeams(fixtures);
  const statsMap = new Map<string, { goals: number; ga: number; xg: number; xga: number; played: number; pts: number }>();
  teams.forEach(t => statsMap.set(t, { goals: 0, ga: 0, xg: 0, xga: 0, played: 0, pts: 0 }));

  fixtures.forEach(f => {
    const h = statsMap.get(f.home_team)!;
    const a = statsMap.get(f.away_team)!;
    const hg = f.home_goals ?? 0, ag = f.away_goals ?? 0;
    h.goals += hg; h.ga += ag;
    h.xg += f.home_npxg ?? 0; h.xga += f.away_npxg ?? 0;
    h.played++;
    a.goals += ag; a.ga += hg;
    a.xg += f.away_npxg ?? 0; a.xga += f.home_npxg ?? 0;
    a.played++;
    if (hg > ag)       { h.pts += 3; }
    else if (hg === ag) { h.pts += 1; a.pts += 1; }
    else               { a.pts += 3; }
  });

  const r2 = (n: number) => Math.round(n * 100) / 100;
  return teams.map(team => {
    const s = statsMap.get(team)!;
    const gpg = r2(s.played > 0 ? s.goals / s.played : 0);
    const gapg = r2(s.played > 0 ? s.ga / s.played : 0);
    const xgpg = r2(s.played > 0 ? s.xg / s.played : 0);
    const xgapg = r2(s.played > 0 ? s.xga / s.played : 0);
    return {
      team,
      gamesPlayed: s.played,
      totalGoals: s.goals,
      totalGoalsAgainst: s.ga,
      totalXg: r2(s.xg),
      totalXgAgainst: r2(s.xga),
      totalPoints: s.pts,
      goalsPerGame: gpg,
      goalsAgainstPerGame: gapg,
      xgPerGame: xgpg,
      xgAgainstPerGame: xgapg,
      goalDiffPerGame: r2(gpg - gapg),
      xgDiffPerGame: r2(xgpg - xgapg),
      pointsPerGame: r2(s.played > 0 ? s.pts / s.played : 0),
    };
  });
}

// Per-game averages over each team's last N games
export function getTeamRecentSeasonStats(fixtures: Fixture[], recentN: number = 6): TeamSeasonStats[] {
  const teams = extractTeams(fixtures);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return teams.map(team => {
    const recent = fixtures
      .filter(f => f.home_team === team || f.away_team === team)
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
      .slice(0, recentN);
    let goals = 0, ga = 0, xg = 0, xga = 0, pts = 0;
    recent.forEach(f => {
      const isHome = f.home_team === team;
      const scored   = isHome ? (f.home_goals ?? 0) : (f.away_goals ?? 0);
      const conceded = isHome ? (f.away_goals ?? 0) : (f.home_goals ?? 0);
      goals += scored; ga += conceded;
      xg  += isHome ? (f.home_npxg ?? 0) : (f.away_npxg ?? 0);
      xga += isHome ? (f.away_npxg ?? 0) : (f.home_npxg ?? 0);
      if (scored > conceded) pts += 3;
      else if (scored === conceded) pts += 1;
    });
    const played = recent.length;
    const gpg  = r2(played > 0 ? goals / played : 0);
    const gapg = r2(played > 0 ? ga / played : 0);
    const xgpg  = r2(played > 0 ? xg / played : 0);
    const xgapg = r2(played > 0 ? xga / played : 0);
    return {
      team, gamesPlayed: played,
      totalGoals: goals, totalGoalsAgainst: ga,
      totalXg: r2(xg), totalXgAgainst: r2(xga),
      totalPoints: pts,
      goalsPerGame: gpg, goalsAgainstPerGame: gapg,
      xgPerGame: xgpg, xgAgainstPerGame: xgapg,
      goalDiffPerGame: r2(gpg - gapg),
      xgDiffPerGame: r2(xgpg - xgapg),
      pointsPerGame: r2(played > 0 ? pts / played : 0),
    };
  });
}

// Betting stats per team
export interface TeamBettingStats {
  team: string;
  played: number;
  btts: number;
  over15: number;
  over25: number;
  over35: number;
  over45: number;
  winBy1: number;
  winBy2Plus: number;
  scoreDraw: number;
  bttsWin: number;
  cleanSheet: number;
  failedToScore: number;
  winToNil: number;
}

export function getBettingStats(fixtures: Fixture[]): TeamBettingStats[] {
  const teams = extractTeams(fixtures);
  const stats = new Map<string, Omit<TeamBettingStats, 'team'>>();
  teams.forEach(t => stats.set(t, {
    played: 0, btts: 0, over15: 0, over25: 0, over35: 0, over45: 0,
    winBy1: 0, winBy2Plus: 0, scoreDraw: 0, bttsWin: 0,
    cleanSheet: 0, failedToScore: 0, winToNil: 0,
  }));

  fixtures.forEach(f => {
    const hg = f.home_goals ?? 0;
    const ag = f.away_goals ?? 0;
    const total = hg + ag;
    const bothScored = hg > 0 && ag > 0;

    [
      { team: f.home_team, scored: hg, conceded: ag },
      { team: f.away_team, scored: ag, conceded: hg },
    ].forEach(({ team, scored, conceded }) => {
      const s = stats.get(team)!;
      s.played++;
      if (bothScored) s.btts++;
      if (total > 1) s.over15++;
      if (total > 2) s.over25++;
      if (total > 3) s.over35++;
      if (total > 4) s.over45++;
      const diff = scored - conceded;
      if (diff === 1) s.winBy1++;
      if (diff >= 2) s.winBy2Plus++;
      if (scored > 0 && conceded > 0 && scored === conceded) s.scoreDraw++;
      if (bothScored && scored > conceded) s.bttsWin++;
      if (conceded === 0) s.cleanSheet++;
      if (scored === 0) s.failedToScore++;
      if (scored > conceded && conceded === 0) s.winToNil++;
    });
  });

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0;
  return teams.map(team => {
    const s = stats.get(team)!;
    return {
      team,
      played: s.played,
      btts: pct(s.btts, s.played),
      over15: pct(s.over15, s.played),
      over25: pct(s.over25, s.played),
      over35: pct(s.over35, s.played),
      over45: pct(s.over45, s.played),
      winBy1: pct(s.winBy1, s.played),
      winBy2Plus: pct(s.winBy2Plus, s.played),
      scoreDraw: pct(s.scoreDraw, s.played),
      bttsWin: pct(s.bttsWin, s.played),
      cleanSheet: pct(s.cleanSheet, s.played),
      failedToScore: pct(s.failedToScore, s.played),
      winToNil: pct(s.winToNil, s.played),
    };
  });
}

// Get line chart data for selected teams
export function getLineChartData(fixtures: Fixture[], selectedTeams: string[], maxGames: number = 10, metric: MetricType = 'xg'): LineChartDataPoint[] {
  const leagueAverages = getLeagueAverageOverTime(fixtures, maxGames, metric);
  const maxMatchNumber = Math.max(...leagueAverages.keys());

  const result: LineChartDataPoint[] = [];

  for (let matchNum = 1; matchNum <= maxMatchNumber; matchNum++) {
    const point: LineChartDataPoint = {
      matchNumber: matchNum,
      leagueAverage: leagueAverages.get(matchNum) || 0
    };

    selectedTeams.forEach(team => {
      const teamData = getTeamRollingAverageOverTime(fixtures, team, maxGames, metric);
      const teamPoint = teamData.find(p => p.matchNumber === matchNum);
      if (teamPoint) {
        point[team] = teamPoint.rollingAverage;
      }
    });

    result.push(point);
  }

  return result;
}
