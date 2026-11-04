import { describe, expect, it } from 'vitest';
import type { Fixture, ScheduledFixture } from '../types';
import { getMatchOutcome, getTeamMatches, groupByCompetition, type CompetitionSource } from './teamMatches';

const result = (date: string, home_team: string, away_team: string, home_goals: number, away_goals: number) =>
  ({ date, home_team, away_team, home_goals, away_goals }) as Fixture;
const scheduled = (date: string, home_team: string, away_team: string, round: number): ScheduledFixture =>
  ({ date, home_team, away_team, round });

const league: CompetitionSource = {
  key: 'epl',
  label: 'Premier League',
  fixtures: [result('2026-08-16', 'a', 'b', 2, 1), result('2026-08-23', 'c', 'a', 1, 1), result('2026-08-23', 'b', 'c', 0, 3)],
  schedule: [
    scheduled('2026-08-16', 'a', 'b', 1),
    scheduled('2026-08-23', 'c', 'a', 2),
    scheduled('2026-08-23', 'b', 'c', 2),
    scheduled('2026-08-30', 'a', 'c', 3),
  ],
};
const europe: CompetitionSource = {
  key: 'championsleague',
  label: 'Champions League',
  fixtures: [result('2026-09-16', 'x', 'a', 3, 0)],
  schedule: [scheduled('2026-09-16', 'x', 'a', 1), scheduled('2026-08-28', 'a', 'y', 2)],
};

describe('team matches', () => {
  it('collects a team’s results and fixtures across competitions', () => {
    const { played, upcoming } = getTeamMatches('a', [league, europe]);
    expect(played.map(m => [m.competition, m.date, m.round])).toEqual([
      ['championsleague', '2026-09-16', 1],
      ['epl', '2026-08-23', 2],
      ['epl', '2026-08-16', 1],
    ]);
    expect(upcoming.map(m => [m.competition, m.date])).toEqual([
      ['championsleague', '2026-08-28'],
      ['epl', '2026-08-30'],
    ]);
  });

  it('treats a result as played when the schedule has home and away reversed on the same date', () => {
    const flipped: CompetitionSource = {
      key: 'championsleague',
      label: 'Champions League',
      fixtures: [result('2026-10-14', 'x', 'a', 6, 0)],
      schedule: [scheduled('2026-10-14', 'a', 'x', 2), scheduled('2026-12-01', 'x', 'a', 7)],
    };
    const { played, upcoming } = getTeamMatches('a', [flipped]);
    expect(played.map(m => m.round)).toEqual([2]);
    expect(upcoming.map(m => m.date)).toEqual(['2026-12-01']);
  });

  it('splits fixtures by competition in the given order', () => {
    const { upcoming } = getTeamMatches('a', [league, europe]);
    expect(groupByCompetition(upcoming, [league, europe]).map(g => [g.competition, g.matches.length])).toEqual([
      ['epl', 1],
      ['championsleague', 1],
    ]);
  });

  it('gives the outcome from the team’s side', () => {
    const { played } = getTeamMatches('a', [league, europe]);
    expect(played.map(m => getMatchOutcome(m, 'a'))).toEqual(['L', 'D', 'W']);
  });
});
