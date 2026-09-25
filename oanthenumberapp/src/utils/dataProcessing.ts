import type { Fixture, FixturesData, TeamGame, TeamRollingAverage, RollingAveragePoint, LineChartDataPoint } from '../types';
import { normalizeTeamName } from './teamColors';
import teamComparisonsData from '../data/teamComparisons.json';

export type MetricType = 'xg' | 'goals' | 'points';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
export function getTeamGames(fixtures: Fixture[], team: string, metric: MetricType = 'xg', xgType: XgType = 'npxg'): TeamGame[] {
  const games: TeamGame[] = [];
  const xgFields = XG_TYPE_FIELDS[xgType];

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
      const homeXg = Number(fixture[xgFields.home]) || 0;
      const awayXg = Number(fixture[xgFields.away]) || 0;
      homeDiff = homeXg - awayXg;
      awayDiff = awayXg - homeXg;
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

export type XgType = 'xg' | 'xgOpenPlay' | 'xgSetPlay' | 'npxg' | 'xgot';

export const XG_TYPES: { key: XgType; label: string; description: string }[] = [
  { key: 'xg', label: 'xG', description: 'expected goals, all shots' },
  { key: 'xgOpenPlay', label: 'xG Open Play', description: 'expected goals from open play' },
  { key: 'xgSetPlay', label: 'xG Set Play', description: 'expected goals from set plays' },
  { key: 'npxg', label: 'NPxG', description: 'non-penalty expected goals' },
  { key: 'xgot', label: 'xGOT', description: 'expected goals on target' },
];

const XG_TYPE_FIELDS: Record<XgType, { home: keyof Fixture; away: keyof Fixture }> = {
  xg: { home: 'home_xG', away: 'away_xG' },
  xgOpenPlay: { home: 'home_xg_open_play', away: 'away_xg_open_play' },
  xgSetPlay: { home: 'home_xg_set_play', away: 'away_xg_set_play' },
  npxg: { home: 'home_npxg', away: 'away_npxg' },
  xgot: { home: 'home_xgot', away: 'away_xgot' },
};

export interface XgGameLogEntry {
  date: Date;
  opponent: string;
  isHome: boolean;
  valueFor: number;
  valueAgainst: number;
  diff: number;
}

// Per-game for/against log of the chosen xG metric for a team, most recent first
export function getTeamXgGameLog(fixtures: Fixture[], team: string, metric: XgType = 'npxg'): XgGameLogEntry[] {
  const games: XgGameLogEntry[] = [];
  const fields = XG_TYPE_FIELDS[metric];

  fixtures.forEach(fixture => {
    const isHome = fixture.home_team === team;
    const isAway = fixture.away_team === team;
    if (!isHome && !isAway) return;

    const homeValue = Number(fixture[fields.home]) || 0;
    const awayValue = Number(fixture[fields.away]) || 0;
    const valueFor = isHome ? homeValue : awayValue;
    const valueAgainst = isHome ? awayValue : homeValue;

    games.push({
      date: parseDate(fixture.date),
      opponent: isHome ? fixture.away_team : fixture.home_team,
      isHome,
      valueFor,
      valueAgainst,
      diff: valueFor - valueAgainst,
    });
  });

  return games.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Calculate rolling average difference for a team (last 10 games or all if less than 10)
export function calculateRollingAverage(fixtures: Fixture[], team: string, maxGames: number = 10, metric: MetricType = 'xg', xgType: XgType = 'npxg'): TeamRollingAverage {
  const games = getTeamGames(fixtures, team, metric, xgType);
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
export function calculateLeagueAverage(fixtures: Fixture[], maxGames: number = 10, metric: MetricType = 'xg', xgType: XgType = 'npxg'): number {
  const teams = extractTeams(fixtures);
  const averages = teams.map(team => calculateRollingAverage(fixtures, team, maxGames, metric, xgType));

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
export function getTeamRollingAverageOverTime(fixtures: Fixture[], team: string, maxGames: number = 10, metric: MetricType = 'xg', xgType: XgType = 'npxg'): RollingAveragePoint[] {
  const games = getTeamGames(fixtures, team, metric, xgType);
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
export function getLeagueAverageOverTime(fixtures: Fixture[], maxGames: number = 10, metric: MetricType = 'xg', xgType: XgType = 'npxg'): Map<number, number> {
  const teams = extractTeams(fixtures);
  const maxMatchNumber = Math.max(
    ...teams.map(team => getTeamGames(fixtures, team, metric).length)
  );

  const averages = new Map<number, number>();

  for (let matchNum = 1; matchNum <= maxMatchNumber; matchNum++) {
    const teamAveragesAtMatch: number[] = [];

    teams.forEach(team => {
      const teamData = getTeamRollingAverageOverTime(fixtures, team, maxGames, metric, xgType);
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
  xgOpenPlayPerGame: number;
  xgSetPlayPerGame: number;
  xgotPerGame: number;
  goalDiffPerGame: number;
  xgDiffPerGame: number;
  pointsPerGame: number;
}

export function getTeamSeasonStats(fixtures: Fixture[]): TeamSeasonStats[] {
  const teams = extractTeams(fixtures);
  const statsMap = new Map<string, { goals: number; ga: number; xg: number; xga: number; op: number; sp: number; xgot: number; played: number; pts: number }>();
  teams.forEach(t => statsMap.set(t, { goals: 0, ga: 0, xg: 0, xga: 0, op: 0, sp: 0, xgot: 0, played: 0, pts: 0 }));

  fixtures.forEach(f => {
    const h = statsMap.get(f.home_team)!;
    const a = statsMap.get(f.away_team)!;
    const hg = f.home_goals ?? 0, ag = f.away_goals ?? 0;
    h.goals += hg; h.ga += ag;
    h.xg += f.home_npxg ?? 0; h.xga += f.away_npxg ?? 0;
    h.op += f.home_xg_open_play ?? 0; h.sp += f.home_xg_set_play ?? 0; h.xgot += f.home_xgot ?? 0;
    a.op += f.away_xg_open_play ?? 0; a.sp += f.away_xg_set_play ?? 0; a.xgot += f.away_xgot ?? 0;
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
      xgOpenPlayPerGame: r2(s.played > 0 ? s.op / s.played : 0),
      xgSetPlayPerGame: r2(s.played > 0 ? s.sp / s.played : 0),
      xgotPerGame: r2(s.played > 0 ? s.xgot / s.played : 0),
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
    let goals = 0, ga = 0, xg = 0, xga = 0, op = 0, sp = 0, xgot = 0, pts = 0;
    recent.forEach(f => {
      const isHome = f.home_team === team;
      const scored   = isHome ? (f.home_goals ?? 0) : (f.away_goals ?? 0);
      const conceded = isHome ? (f.away_goals ?? 0) : (f.home_goals ?? 0);
      goals += scored; ga += conceded;
      xg  += isHome ? (f.home_npxg ?? 0) : (f.away_npxg ?? 0);
      xga += isHome ? (f.away_npxg ?? 0) : (f.home_npxg ?? 0);
      op   += (isHome ? f.home_xg_open_play : f.away_xg_open_play) ?? 0;
      sp   += (isHome ? f.home_xg_set_play : f.away_xg_set_play) ?? 0;
      xgot += (isHome ? f.home_xgot : f.away_xgot) ?? 0;
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
      xgOpenPlayPerGame: r2(played > 0 ? op / played : 0),
      xgSetPlayPerGame: r2(played > 0 ? sp / played : 0),
      xgotPerGame: r2(played > 0 ? xgot / played : 0),
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

// Full SPFL Premiership season length (33 regular rounds + 5 post-split games)
export const SEASON_GAMES = 38;

// Expected points per game for a given rolling xG difference, per club-provided bucket table
export function getXPointsPerGame(xgDiffPerGame: number): number {
  if (xgDiffPerGame >= 1.5) return 2.7;
  if (xgDiffPerGame >= 1)   return 2.3;
  if (xgDiffPerGame >= 0.5) return 2.0;
  if (xgDiffPerGame >= 0)   return 1.5;
  if (xgDiffPerGame >= -0.5) return 0.7;
  if (xgDiffPerGame >= -1)   return 0.5;
  if (xgDiffPerGame >= -1.5) return 0.3;
  return 0.1;
}

export interface ProjectedStanding {
  team: string;
  played: number;
  points: number;
  xgDiffPerGame: number;
  xPointsPerGame: number;        // current season xPPG (the "current_xppg" in the projection spec)
  priorPpg: number | null;       // last-season prior, null when no prior context was supplied
  priorBasis: TeamPriorBasis | null;
  weightW: number;               // weight on this season's xPPG; the prior carries 1 - weightW
  blendedPpg: number;
  remainingGames: number;
  projectedPoints: number;       // projection from the configured method
  projectedPointsOld: number;    // original method: current points + remaining x xPPG
  projectedPointsWeighted: number | null; // prior-weighted projection, null when no priors
  projectedPosition: number;
}

// Average xG difference and average xPoints (each game's own xG diff mapped through the
// bucket table individually, then averaged) across all games a team has played to date.
function getSeasonToDateXStats(fixtures: Fixture[], team: string): { xgDiffPerGame: number; xPointsPerGame: number } {
  const games = getTeamGames(fixtures, team, 'xg');
  if (games.length === 0) return { xgDiffPerGame: 0, xPointsPerGame: 0 };

  let totalXgDiff = 0;
  let totalXPoints = 0;
  games.forEach(g => {
    totalXgDiff += g.xgDiff;
    totalXPoints += getXPointsPerGame(g.xgDiff);
  });

  return {
    xgDiffPerGame: Math.round((totalXgDiff / games.length) * 100) / 100,
    xPointsPerGame: Math.round((totalXPoints / games.length) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------------------
// Prior-weighted projection (Bayesian shrinkage towards a last-season prior).
//
//   w            = GamesPlayed / (GamesPlayed + k)
//   BlendedPPG   = w x CurrentXPPG + (1 - w) x PriorPPG
//   ProjectedPts = CurrentPoints + BlendedPPG x RemainingGames
//
// PriorPPG is last season's xPPG (same xG-diff bucket scale as CurrentXPPG, falling back to
// actual PPG when last season's xG is missing), regressed towards the league mean by r.
// Teams that weren't in the league last season get the promoted-team prior instead.
// ---------------------------------------------------------------------------------------

export type ProjectionMethod = 'current' | 'prior_weighted';

export interface ProjectionTeamOverride {
  k?: number;
  // Scales k for this team: > 1 leans on the prior for longer, < 1 trusts this season sooner
  priorWeightMultiplier?: number;
}

export interface ProjectionConfig {
  method: ProjectionMethod;
  k: number;                    // games at which this season and the prior carry equal weight
  priorRegressionR: number;     // share of last season's figure kept when regressing to the mean
  leagueAvgPpg?: number;        // omit to compute from history
  promotedPriorPpg?: number;    // omit to compute from history
  normaliseTotal: boolean;
  normaliseTolerance: number;   // fraction of the expected league total
  teamOverrides: Record<string, ProjectionTeamOverride>;
}

export const DEFAULT_PROJECTION_CONFIG: ProjectionConfig = {
  method: 'prior_weighted',
  k: 10,
  priorRegressionR: 0.67,
  normaliseTotal: true,
  normaliseTolerance: 0.01,
  teamOverrides: {},
};

// Used only when there is no history to compute them from
export const FALLBACK_LEAGUE_AVG_PPG = 1.37;
export const FALLBACK_PROMOTED_PRIOR_PPG = 1.05;

export type TeamPriorBasis = 'xg' | 'points' | 'promoted';

export interface TeamPrior {
  baseValue: number;
  priorPpg: number;
  basis: TeamPriorBasis;
}

export interface ProjectionPriors {
  leagueAvgPpg: number;
  promotedPriorPpg: number;
  teamPriors: Record<string, TeamPrior>;
}

export interface ProjectionContext {
  config: ProjectionConfig;
  priors: ProjectionPriors;
}

const hasXgData = (f: Fixture) => typeof f.home_npxg === 'number' && typeof f.away_npxg === 'number';

// Mean points per team-game across completed seasons (~1.37 in football: draws share 2 points)
export function getHistoricalLeagueAvgPpg(history: Fixture[][]): number | null {
  let points = 0;
  let teamGames = 0;
  history.forEach(season => {
    getLeagueTable(season).forEach(row => {
      points += row.points;
      teamGames += row.played;
    });
  });
  return teamGames > 0 ? points / teamGames : null;
}

// Mean first-season PPG of sides that weren't in the previous season's league.
// history must be completed seasons in chronological order.
export function getHistoricalPromotedPpg(history: Fixture[][]): number | null {
  let points = 0;
  let teamGames = 0;
  for (let i = 1; i < history.length; i++) {
    const previousTeams = new Set(extractTeams(history[i - 1]));
    getLeagueTable(history[i])
      .filter(row => !previousTeams.has(row.team))
      .forEach(row => {
        points += row.points;
        teamGames += row.played;
      });
  }
  return teamGames > 0 ? points / teamGames : null;
}

// Last season's base value: xPPG on the current bucket scale when at least half the team's
// games have xG, otherwise actual PPG.
function getLastSeasonBase(lastSeason: Fixture[], team: string): { value: number; basis: 'xg' | 'points' } | null {
  const teamFixtures = lastSeason.filter(f => f.home_team === team || f.away_team === team);
  if (teamFixtures.length === 0) return null;

  const xgFixtures = teamFixtures.filter(hasXgData);
  if (xgFixtures.length > 0 && xgFixtures.length >= teamFixtures.length / 2) {
    return { value: getSeasonToDateXStats(xgFixtures, team).xPointsPerGame, basis: 'xg' };
  }

  const row = getLeagueTable(lastSeason).find(r => r.team === team);
  return row && row.played > 0 ? { value: row.points / row.played, basis: 'points' } : null;
}

// history: completed seasons in chronological order, normally ending with lastSeason. Only
// pass seasons that finished before the one being projected, otherwise the prior leaks.
export function buildProjectionPriors(
  lastSeason: Fixture[],
  history: Fixture[][],
  config: ProjectionConfig = DEFAULT_PROJECTION_CONFIG
): ProjectionPriors {
  const leagueAvgPpg = config.leagueAvgPpg ?? getHistoricalLeagueAvgPpg(history) ?? FALLBACK_LEAGUE_AVG_PPG;
  const promotedPriorPpg = config.promotedPriorPpg ?? getHistoricalPromotedPpg(history) ?? FALLBACK_PROMOTED_PRIOR_PPG;
  const r = config.priorRegressionR;

  const teamPriors: Record<string, TeamPrior> = {};
  extractTeams(lastSeason).forEach(team => {
    const base = getLastSeasonBase(lastSeason, team);
    if (!base) return;
    teamPriors[team] = {
      baseValue: base.value,
      priorPpg: r * base.value + (1 - r) * leagueAvgPpg,
      basis: base.basis,
    };
  });

  return { leagueAvgPpg, promotedPriorPpg, teamPriors };
}

export function createProjectionContext(
  lastSeason: Fixture[],
  history: Fixture[][],
  config: ProjectionConfig = DEFAULT_PROJECTION_CONFIG
): ProjectionContext {
  return { config, priors: buildProjectionPriors(lastSeason, history, config) };
}

export function getTeamPrior(priors: ProjectionPriors, team: string): TeamPrior {
  return priors.teamPriors[team] ?? { baseValue: priors.promotedPriorPpg, priorPpg: priors.promotedPriorPpg, basis: 'promoted' };
}

export function getTeamK(config: ProjectionConfig, team: string): number {
  const override = config.teamOverrides[team] ?? {};
  return (override.k ?? config.k) * (override.priorWeightMultiplier ?? 1);
}

export function blendPpg(gamesPlayed: number, currentXppg: number, priorPpg: number, k: number): { weightW: number; blendedPpg: number } {
  const weightW = gamesPlayed + k > 0 ? gamesPlayed / (gamesPlayed + k) : 1;
  return { weightW, blendedPpg: weightW * currentXppg + (1 - weightW) * priorPpg };
}

export function projectPoints(currentPoints: number, ppg: number, remainingGames: number): number {
  return currentPoints + ppg * remainingGames;
}

export interface ProjectionNormalisation {
  applied: boolean;
  factor: number;           // multiplier applied to every team's projected remaining points
  expectedTotal: number;
  rawTotal: number;         // league total before scaling
  finalTotal: number;
}

export interface ProjectionResult {
  method: ProjectionMethod;
  rows: ProjectedStanding[];
  normalisation: ProjectionNormalisation | null;  // null unless the prior-weighted method ran
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// Projected final standings. Without a projection context (or with method "current") this is
// the original projection: current points + (remaining games x average xPoints per game),
// where average xPoints per game is the mean of each played game's own xG-diff-bucket value.
export function getProjectionResult(
  fixtures: Fixture[],
  seasonGames: number = SEASON_GAMES,
  projection?: ProjectionContext
): ProjectionResult {
  const table = getLeagueTable(fixtures);

  const rows = table.map(row => {
    const { xgDiffPerGame, xPointsPerGame } = getSeasonToDateXStats(fixtures, row.team);
    const remainingGames = Math.max(0, seasonGames - row.played);
    const projectedPointsOld = round1(projectPoints(row.points, xPointsPerGame, remainingGames));

    let prior: TeamPrior | null = null;
    let weightW = 1;
    let blendedPpg = xPointsPerGame;
    if (projection) {
      prior = getTeamPrior(projection.priors, row.team);
      ({ weightW, blendedPpg } = blendPpg(row.played, xPointsPerGame, prior.priorPpg, getTeamK(projection.config, row.team)));
    }

    return {
      team: row.team,
      played: row.played,
      points: row.points,
      xgDiffPerGame,
      xPointsPerGame,
      priorPpg: prior ? prior.priorPpg : null,
      priorBasis: prior ? prior.basis : null,
      weightW,
      blendedPpg,
      remainingGames,
      projectedPoints: projectedPointsOld,
      projectedPointsOld,
      projectedPointsWeighted: null as number | null,
      projectedPosition: 0,
    };
  });

  let normalisation: ProjectionNormalisation | null = null;
  if (projection) {
    const { config, priors } = projection;
    const remaining = rows.map(r => r.blendedPpg * r.remainingGames);
    const earnedTotal = rows.reduce((sum, r) => sum + r.points, 0);
    const remainingTotal = remaining.reduce((a, b) => a + b, 0);
    const rawTotal = earnedTotal + remainingTotal;
    const expectedTotal = priors.leagueAvgPpg * rows.length * seasonGames;

    // Scale only the projected remaining points; points already earned stay as they are
    let factor = 1;
    if (config.normaliseTotal && remainingTotal > 0 && expectedTotal > 0 &&
        Math.abs(rawTotal - expectedTotal) / expectedTotal > config.normaliseTolerance) {
      factor = Math.max(0, (expectedTotal - earnedTotal) / remainingTotal);
    }

    rows.forEach((r, i) => {
      r.projectedPointsWeighted = round1(r.points + remaining[i] * factor);
      if (config.method === 'prior_weighted') r.projectedPoints = r.projectedPointsWeighted;
    });

    normalisation = {
      applied: factor !== 1,
      factor,
      expectedTotal,
      rawTotal,
      finalTotal: earnedTotal + remainingTotal * factor,
    };
  }

  rows.sort((a, b) => b.projectedPoints - a.projectedPoints);
  rows.forEach((r, i) => { r.projectedPosition = i + 1; });

  const method = projection?.config.method ?? 'current';
  return { method, rows, normalisation: method === 'prior_weighted' ? normalisation : null };
}

export function getProjectedStandings(
  fixtures: Fixture[],
  seasonGames: number = SEASON_GAMES,
  projection?: ProjectionContext
): ProjectedStanding[] {
  return getProjectionResult(fixtures, seasonGames, projection).rows;
}

export interface ProjectedPositionPoint {
  matchNumber: number;
  date: Date;
  projectedPoints: number;
  projectedPosition: number;
}

// Projected finishing position/points for a team, recomputed as of each of its matchdays
export function getProjectedPositionOverTime(
  fixtures: Fixture[],
  team: string,
  seasonGames: number = SEASON_GAMES,
  projection?: ProjectionContext
): ProjectedPositionPoint[] {
  const teamFixtures = fixtures
    .filter(f => f.home_team === team || f.away_team === team)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  return teamFixtures.map((f, idx) => {
    const cutoff = parseDate(f.date).getTime();
    const fixturesSoFar = fixtures.filter(g => parseDate(g.date).getTime() <= cutoff);
    const standings = getProjectedStandings(fixturesSoFar, seasonGames, projection);
    const row = standings.find(s => s.team === team)!;
    return {
      matchNumber: idx + 1,
      date: parseDate(f.date),
      projectedPoints: row.projectedPoints,
      projectedPosition: row.projectedPosition,
    };
  });
}

export function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

// Which prior-season team(s) to use for a team's year-on-year comparison (see
// src/data/teamComparisons.json — defaults to the team itself if unlisted). A team can map to
// several comparison teams (e.g. a newly promoted side with no obvious single replacement),
// in which case their prior-season points are averaged.
export function getYoyComparisonTeams(team: string): string[] {
  const map = teamComparisonsData as Record<string, string | string[]>;
  const entry = map[team] ?? team;
  return Array.isArray(entry) ? entry : [entry];
}

// Points earned by a team across its first n games (chronologically) in a given fixture
// set, or null if the team hasn't played that many games in that set.
export function getPointsAfterNGames(fixtures: Fixture[], team: string, n: number): number | null {
  if (n <= 0) return 0;
  const teamFixtures = fixtures
    .filter(f => f.home_team === team || f.away_team === team)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .slice(0, n);

  if (teamFixtures.length < n) return null;

  return teamFixtures.reduce((points, f) => {
    const isHome = f.home_team === team;
    const scored = isHome ? (f.home_goals ?? 0) : (f.away_goals ?? 0);
    const conceded = isHome ? (f.away_goals ?? 0) : (f.home_goals ?? 0);
    if (scored > conceded) return points + 3;
    if (scored === conceded) return points + 1;
    return points;
  }, 0);
}

// A fair-barometer performance score built from three signals, each normalized to
// roughly -1..1 and averaged (signals with no data available are dropped, not zeroed):
//  1. Current league position vs projected finishing position (ahead of projection = good)
//  2. Actual points to date vs cumulative xPoints to date (each game's own xG diff mapped
//     through the xPoints bucket table, then summed — not a single average-then-bucket step)
//  3. Points at the same number of games played vs the same stage last season (using the
//     team's year-on-year comparison team from teamComparisons.json)
export interface PerformanceScoreBreakdown {
  blendedScore: number;
  positionSignal: number | null;
  positionDelta: number | null;
  currentPosition: number | null;
  projectedPosition: number | null;
  pointsSignal: number | null;
  pointsDelta: number | null;
  actualPoints: number | null;
  cumulativeXPoints: number | null;
  yoySignal: number | null;
  yoyDelta: number | null;
  yoyComparisonTeams: string[];
  yoyComparisonPoints: number | null;
}

export function getPerformanceScore(
  fixtures: Fixture[],
  lastSeasonFixtures: Fixture[],
  team: string,
  seasonGames: number = SEASON_GAMES,
  projection?: ProjectionContext
): PerformanceScoreBreakdown {
  const numTeams = extractTeams(fixtures).length;
  const currentTable = getLeagueTable(fixtures);
  const currentRow = currentTable.find(r => r.team === team) ?? null;
  const standings = getProjectedStandings(fixtures, seasonGames, projection);
  const projectedRow = standings.find(s => s.team === team) ?? null;

  let positionSignal: number | null = null;
  let positionDelta: number | null = null;
  if (currentRow && projectedRow && numTeams > 1) {
    positionDelta = projectedRow.projectedPosition - currentRow.position;
    positionSignal = clamp(positionDelta / (numTeams - 1), -1, 1);
  }

  let pointsSignal: number | null = null;
  let pointsDelta: number | null = null;
  let cumulativeXPoints: number | null = null;
  if (currentRow && currentRow.played > 0) {
    const games = getTeamGames(fixtures, team, 'xg');
    cumulativeXPoints = Math.round(games.reduce((sum, g) => sum + getXPointsPerGame(g.xgDiff), 0) * 10) / 10;
    pointsDelta = Math.round((currentRow.points - cumulativeXPoints) * 10) / 10;
    pointsSignal = clamp(pointsDelta / currentRow.played, -1, 1);
  }

  const yoyComparisonTeams = getYoyComparisonTeams(team);
  let yoySignal: number | null = null;
  let yoyDelta: number | null = null;
  let yoyComparisonPoints: number | null = null;
  if (currentRow && currentRow.played > 0) {
    const comparisonPoints = yoyComparisonTeams
      .map(t => getPointsAfterNGames(lastSeasonFixtures, t, currentRow.played))
      .filter((p): p is number => p !== null);
    if (comparisonPoints.length > 0) {
      yoyComparisonPoints = Math.round((comparisonPoints.reduce((a, b) => a + b, 0) / comparisonPoints.length) * 10) / 10;
      yoyDelta = currentRow.points - yoyComparisonPoints;
      yoySignal = clamp(yoyDelta / currentRow.played, -1, 1);
    }
  }

  const signals = [positionSignal, pointsSignal, yoySignal].filter((s): s is number => s !== null);
  const blendedScore = signals.length > 0 ? signals.reduce((a, b) => a + b, 0) / signals.length : 0;

  return {
    blendedScore,
    positionSignal,
    positionDelta,
    currentPosition: currentRow?.position ?? null,
    projectedPosition: projectedRow?.projectedPosition ?? null,
    pointsSignal,
    pointsDelta,
    actualPoints: currentRow?.points ?? null,
    cumulativeXPoints,
    yoySignal,
    yoyDelta,
    yoyComparisonTeams,
    yoyComparisonPoints,
  };
}

// Get line chart data for selected teams
export function getLineChartData(fixtures: Fixture[], selectedTeams: string[], maxGames: number = 10, metric: MetricType = 'xg', xgType: XgType = 'npxg'): LineChartDataPoint[] {
  const leagueAverages = getLeagueAverageOverTime(fixtures, maxGames, metric, xgType);
  const maxMatchNumber = Math.max(...leagueAverages.keys());

  const result: LineChartDataPoint[] = [];

  for (let matchNum = 1; matchNum <= maxMatchNumber; matchNum++) {
    const point: LineChartDataPoint = {
      matchNumber: matchNum,
      leagueAverage: leagueAverages.get(matchNum) || 0
    };

    selectedTeams.forEach(team => {
      const teamData = getTeamRollingAverageOverTime(fixtures, team, maxGames, metric, xgType);
      const teamPoint = teamData.find(p => p.matchNumber === matchNum);
      if (teamPoint) {
        point[team] = teamPoint.rollingAverage;
      }
    });

    result.push(point);
  }

  return result;
}

// League-leading team highlights (best attack/defence/set play/streaks)
export interface TeamHighlightStats {
  team: string;
  goalsForP90: number;
  goalsAgainstP90: number;
  xgP90: number;
  xgAgainstP90: number;
  xgSetPlayP90: number;
  currentWinStreak: number;
  bestWinStreak: number;
  currentUnbeatenStreak: number;
  bestUnbeatenStreak: number;
}

function currentAndBestStreak(
  sortedGames: { scored: number; conceded: number }[],
  matches: (scored: number, conceded: number) => boolean
): { current: number; best: number } {
  let current = 0;
  let best = 0;
  for (const g of sortedGames) {
    if (matches(g.scored, g.conceded)) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return { current, best };
}

export function getTeamHighlightStats(fixtures: Fixture[]): TeamHighlightStats[] {
  return extractTeams(fixtures).map(team => {
    const games = fixtures
      .filter(f => f.home_team === team || f.away_team === team)
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    const n = games.length || 1;
    let gf = 0, ga = 0, xg = 0, xga = 0, xgSp = 0;
    const results = games.map(f => {
      const isHome = f.home_team === team;
      const scored = (isHome ? f.home_goals : f.away_goals) ?? 0;
      const conceded = (isHome ? f.away_goals : f.home_goals) ?? 0;
      gf += scored; ga += conceded;
      xg += (isHome ? f.home_xG : f.away_xG) ?? 0;
      xga += (isHome ? f.away_xG : f.home_xG) ?? 0;
      xgSp += (isHome ? f.home_xg_set_play : f.away_xg_set_play) ?? 0;
      return { scored, conceded };
    });
    const win = currentAndBestStreak(results, (s, c) => s > c);
    const unbeaten = currentAndBestStreak(results, (s, c) => s >= c);
    return {
      team,
      goalsForP90: gf / n,
      goalsAgainstP90: ga / n,
      xgP90: xg / n,
      xgAgainstP90: xga / n,
      xgSetPlayP90: xgSp / n,
      currentWinStreak: win.current,
      bestWinStreak: win.best,
      currentUnbeatenStreak: unbeaten.current,
      bestUnbeatenStreak: unbeaten.best,
    };
  });
}
