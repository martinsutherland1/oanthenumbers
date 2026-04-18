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

// Head to head record for a team against each opponent
export interface H2HRecord {
  opponent: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  possiblePoints: number;
  winPct: number;
}

export function getH2HData(fixtures: Fixture[], team: string): H2HRecord[] {
  const records = new Map<string, { wins: number; draws: number; losses: number }>();

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
      records.set(opponent, { wins: 0, draws: 0, losses: 0 });
    }
    const rec = records.get(opponent)!;

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
      return { opponent, played, ...rec, points, possiblePoints, winPct };
    })
    .sort((a, b) => b.points - a.points || b.winPct - a.winPct);
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
