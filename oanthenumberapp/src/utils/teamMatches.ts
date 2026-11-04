import type { Fixture, ScheduledFixture } from '../types';
import { dateSortValue, isPastDate } from './dataProcessing';

// One competition's data, as searched for a team's matches. Teams are linked across
// competitions by slug, which domestic and European data share (see TEAM_ALIASES for exceptions).
export interface CompetitionSource {
  key: string;
  label: string;
  fixtures: Fixture[];
  schedule: ScheduledFixture[];
  // Used for last season's meetings in the match detail popup
  lastSeasonFixtures?: Fixture[];
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

const byDate = (a: { date: string; time?: string }, b: { date: string; time?: string }) =>
  dateSortValue(a.date) - dateSortValue(b.date) || (a.time ?? '').localeCompare(b.time ?? '');

const involves = (team: string) => (m: { home_team: string; away_team: string }) =>
  m.home_team === team || m.away_team === team;

// Pair each result with one schedule entry. Teams can meet more than once in a season (the SPFL
// plays each pairing three times), so a team pair alone isn't enough. Some schedules list home and
// away the other way round from the result (seen in the Champions League data), so a reversed pair
// counts when it's on the same date. Otherwise take the unused entry for the pair nearest the result's date.
export function matchResultsToSchedule(results: Fixture[], schedule: ScheduledFixture[]): Map<Fixture, ScheduledFixture> {
  const entriesByPair = new Map<string, ScheduledFixture[]>();
  schedule.forEach(s => {
    const key = pairKey(s.home_team, s.away_team);
    entriesByPair.set(key, [...(entriesByPair.get(key) ?? []), s]);
  });

  const used = new Set<ScheduledFixture>();
  const matched = new Map<Fixture, ScheduledFixture>();
  const gap = (s: ScheduledFixture, r: Fixture) => {
    const diff = Math.abs(dateSortValue(s.date) - dateSortValue(r.date));
    return Number.isNaN(diff) ? Infinity : diff;
  };

  [...results].sort(byDate).forEach(r => {
    const exact = (entriesByPair.get(pairKey(r.home_team, r.away_team)) ?? []).filter(s => !used.has(s));
    const reversed = (entriesByPair.get(pairKey(r.away_team, r.home_team)) ?? []).filter(s => !used.has(s));
    const entry = exact.find(s => s.date === r.date)
      ?? reversed.find(s => s.date === r.date)
      ?? [...exact].sort((a, b) => gap(a, r) - gap(b, r))[0];
    if (entry) {
      used.add(entry);
      matched.set(r, entry);
    }
  });
  return matched;
}

// Every match the team has played or has still to play, across all the given competitions.
// Results come latest first, upcoming fixtures soonest first.
export function getTeamMatches(team: string, competitions: CompetitionSource[]): { played: TeamMatch[]; upcoming: TeamMatch[] } {
  const played: TeamMatch[] = [];
  const upcoming: TeamMatch[] = [];

  competitions.forEach(c => {
    const base = { competition: c.key, competitionLabel: c.label };
    const results = c.fixtures.filter(involves(team));
    const schedule = c.schedule.filter(involves(team));
    const entryByResult = matchResultsToSchedule(results, schedule);
    const playedEntries = new Set(entryByResult.values());

    results.forEach(r => {
      const entry = entryByResult.get(r);
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
      // Matches dated before today have been played, even if their result isn't in yet
      .filter(s => !playedEntries.has(s) && !isPastDate(s.date))
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
