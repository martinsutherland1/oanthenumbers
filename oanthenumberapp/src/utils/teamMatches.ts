import type { Fixture, ScheduledFixture } from '../types';
import { parseDate } from './dataProcessing';

// One competition's data, as searched for a team's matches. Teams are linked across
// competitions by slug, which domestic and European data share (see TEAM_ALIASES for exceptions).
export interface CompetitionSource {
  key: string;
  label: string;
  fixtures: Fixture[];
  schedule: ScheduledFixture[];
}

export interface TeamMatch {
  competition: string;
  competitionLabel: string;
  date: string;
  time?: string;
  round?: number;
  home_team: string;
  away_team: string;
  // Present once the match has been played
  result?: Fixture;
}

export interface TeamCompetitionFixtures {
  competition: string;
  competitionLabel: string;
  matches: TeamMatch[];
}

const pairKey = (home: string, away: string) => `${home}|${away}`;

const byDate = (a: TeamMatch, b: TeamMatch) =>
  parseDate(a.date).getTime() - parseDate(b.date).getTime() || (a.time ?? '').localeCompare(b.time ?? '');

const involves = (team: string) => (m: { home_team: string; away_team: string }) =>
  m.home_team === team || m.away_team === team;

// Every match the team has played or has still to play, across all the given competitions.
// Results come latest first, upcoming fixtures soonest first.
export function getTeamMatches(team: string, competitions: CompetitionSource[]): { played: TeamMatch[]; upcoming: TeamMatch[] } {
  const played: TeamMatch[] = [];
  const upcoming: TeamMatch[] = [];

  competitions.forEach(c => {
    const base = { competition: c.key, competitionLabel: c.label };
    const results = c.fixtures.filter(involves(team));
    const schedule = c.schedule.filter(involves(team));
    const scheduleByPair = new Map(schedule.map(s => [pairKey(s.home_team, s.away_team), s]));
    // Some schedules list a match with home and away the other way round from its result
    // (seen in the Champions League data), so a reversed pair on the same date also counts
    const scheduledFor = (r: Fixture) => {
      const exact = scheduleByPair.get(pairKey(r.home_team, r.away_team));
      const reversed = scheduleByPair.get(pairKey(r.away_team, r.home_team));
      if (exact?.date === r.date) return exact;
      if (reversed?.date === r.date) return reversed;
      return exact;
    };
    const playedEntries = new Set<ScheduledFixture>();

    results.forEach(r => {
      const entry = scheduledFor(r);
      if (entry) playedEntries.add(entry);
      played.push({
        ...base,
        date: r.date,
        round: entry?.round,
        home_team: r.home_team,
        away_team: r.away_team,
        result: r,
      });
    });
    schedule
      .filter(s => !playedEntries.has(s))
      .forEach(s => upcoming.push({ ...base, date: s.date, time: s.time, round: s.round, home_team: s.home_team, away_team: s.away_team }));
  });

  return { played: played.sort(byDate).reverse(), upcoming: upcoming.sort(byDate) };
}

// Upcoming fixtures split by competition, keeping the competitions' given order
export function groupByCompetition(matches: TeamMatch[], competitions: CompetitionSource[]): TeamCompetitionFixtures[] {
  return competitions
    .map(c => ({ competition: c.key, competitionLabel: c.label, matches: matches.filter(m => m.competition === c.key) }))
    .filter(g => g.matches.length > 0);
}

export function getMatchOutcome(match: TeamMatch, team: string): 'W' | 'D' | 'L' | null {
  if (!match.result) return null;
  const { home_goals, away_goals } = match.result;
  const scored = match.home_team === team ? home_goals : away_goals;
  const conceded = match.home_team === team ? away_goals : home_goals;
  return scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
}
