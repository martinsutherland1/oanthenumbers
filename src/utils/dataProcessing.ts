import type { Fixture, TeamGame, TeamRollingAverage, RollingAveragePoint, LineChartDataPoint } from '../types';

// Parse date string in DD-MM-YYYY format
export function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Extract all unique teams from fixtures
export function extractTeams(fixtures: Fixture[]): string[] {
  const teams = new Set<string>();
  fixtures.forEach(fixture => {
    teams.add(fixture.home);
    teams.add(fixture.away);
  });
  return Array.from(teams).sort();
}

// Convert fixtures to individual team games
export function fixtureToTeamGames(fixture: Fixture): TeamGame[] {
  const date = parseDate(fixture.date);
  return [
    {
      date,
      team: fixture.home,
      xg: fixture.xg_home,
      opponent: fixture.away,
      isHome: true
    },
    {
      date,
      team: fixture.away,
      xg: fixture.xg_away,
      opponent: fixture.home,
      isHome: false
    }
  ];
}

// Get all games for a specific team, sorted by date (most recent first)
export function getTeamGames(fixtures: Fixture[], team: string): TeamGame[] {
  const games: TeamGame[] = [];

  fixtures.forEach(fixture => {
    const date = parseDate(fixture.date);
    if (fixture.home === team) {
      games.push({
        date,
        team,
        xg: fixture.xg_home,
        opponent: fixture.away,
        isHome: true
      });
    } else if (fixture.away === team) {
      games.push({
        date,
        team,
        xg: fixture.xg_away,
        opponent: fixture.home,
        isHome: false
      });
    }
  });

  // Sort by date, most recent first
  return games.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Calculate rolling average xG for a team (last 10 games or all if less than 10)
export function calculateRollingAverage(fixtures: Fixture[], team: string, maxGames: number = 10): TeamRollingAverage {
  const games = getTeamGames(fixtures, team);
  const recentGames = games.slice(0, maxGames);

  if (recentGames.length === 0) {
    return { team, average: 0, gamesPlayed: 0 };
  }

  const totalXg = recentGames.reduce((sum, game) => sum + game.xg, 0);
  const average = totalXg / recentGames.length;

  return {
    team,
    average: Math.round(average * 100) / 100,
    gamesPlayed: recentGames.length
  };
}

// Calculate league average (average of all team averages)
export function calculateLeagueAverage(fixtures: Fixture[], maxGames: number = 10): number {
  const teams = extractTeams(fixtures);
  const averages = teams.map(team => calculateRollingAverage(fixtures, team, maxGames));

  if (averages.length === 0) return 0;

  const totalAverage = averages.reduce((sum, ta) => sum + ta.average, 0);
  return Math.round((totalAverage / averages.length) * 100) / 100;
}

// Get all team rolling averages
export function getAllTeamAverages(fixtures: Fixture[], maxGames: number = 10): TeamRollingAverage[] {
  const teams = extractTeams(fixtures);
  return teams.map(team => calculateRollingAverage(fixtures, team, maxGames))
    .sort((a, b) => b.average - a.average);
}

// Get rolling average progression over time for a team
export function getTeamRollingAverageOverTime(fixtures: Fixture[], team: string, maxGames: number = 10): RollingAveragePoint[] {
  const games = getTeamGames(fixtures, team);
  // Sort oldest first for chronological order
  const sortedGames = [...games].sort((a, b) => a.date.getTime() - b.date.getTime());

  const result: RollingAveragePoint[] = [];

  for (let i = 0; i < sortedGames.length; i++) {
    // Get games up to and including current game (max 10)
    const startIdx = Math.max(0, i + 1 - maxGames);
    const relevantGames = sortedGames.slice(startIdx, i + 1);

    const totalXg = relevantGames.reduce((sum, game) => sum + game.xg, 0);
    const average = totalXg / relevantGames.length;

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
export function getLeagueAverageOverTime(fixtures: Fixture[], maxGames: number = 10): Map<number, number> {
  const teams = extractTeams(fixtures);
  const maxMatchNumber = Math.max(
    ...teams.map(team => getTeamGames(fixtures, team).length)
  );

  const averages = new Map<number, number>();

  for (let matchNum = 1; matchNum <= maxMatchNumber; matchNum++) {
    const teamAveragesAtMatch: number[] = [];

    teams.forEach(team => {
      const teamData = getTeamRollingAverageOverTime(fixtures, team, maxGames);
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

// Get line chart data for selected teams
export function getLineChartData(fixtures: Fixture[], selectedTeams: string[], maxGames: number = 10): LineChartDataPoint[] {
  const leagueAverages = getLeagueAverageOverTime(fixtures, maxGames);
  const maxMatchNumber = Math.max(...leagueAverages.keys());

  const result: LineChartDataPoint[] = [];

  for (let matchNum = 1; matchNum <= maxMatchNumber; matchNum++) {
    const point: LineChartDataPoint = {
      matchNumber: matchNum,
      leagueAverage: leagueAverages.get(matchNum) || 0
    };

    selectedTeams.forEach(team => {
      const teamData = getTeamRollingAverageOverTime(fixtures, team, maxGames);
      const teamPoint = teamData.find(p => p.matchNumber === matchNum);
      if (teamPoint) {
        point[team] = teamPoint.rollingAverage;
      }
    });

    result.push(point);
  }

  return result;
}
