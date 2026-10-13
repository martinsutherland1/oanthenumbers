import { describe, expect, it } from 'vitest';
import { flattenFixtures, flattenSchedule, extractTeams } from './dataProcessing';
import {
  createGoalProjectionContext,
  getBackdatedProjections,
  getNextRoundProjections,
  projectMatch,
} from './goalProjection';
import type { Fixture, FixturesData, ScheduleData } from '../types';
import epl2526 from '../data/epl_results_2025_26.json';
import epl2627 from '../data/epl_results_2026_27.json';
import eplSchedule from '../data/epl_fixtures_2026_27.json';

function fixture(date: string, home: string, away: string, hg: number, ag: number, hxg = hg, axg = ag): Fixture {
  return {
    date, home_team: home, away_team: away, home_goals: hg, away_goals: ag,
    home_xG: hxg, away_xG: axg, home_xg_open_play: hxg, away_xg_open_play: axg,
    home_xg_set_play: 0, away_xg_set_play: 0, home_npxg: hxg, away_npxg: axg, home_xgot: hxg, away_xgot: axg,
  };
}

const eplLast = flattenFixtures(epl2526 as FixturesData);
const eplCurrent = flattenFixtures(epl2627 as FixturesData);
const schedule = flattenSchedule(eplSchedule as ScheduleData);

describe('goal projection', () => {
  it('ignores results on or after the match date', () => {
    const ctx = createGoalProjectionContext(eplLast, extractTeams(eplCurrent));
    const target = eplCurrent.find(f => f.date > '2026-09-01')!;
    const match = { ...target, round: 0 };
    const before = eplCurrent.filter(f => f.date < target.date);
    // Wildly different results from the match day onwards must not move the projection
    const tampered = [...before, ...eplCurrent.filter(f => f.date >= target.date).map(f => ({ ...f, home_goals: 9, home_xG: 9 }))];

    const a = projectMatch(ctx, eplCurrent, match);
    const b = projectMatch(ctx, tampered, match);
    expect(b.home.projectedGoals).toBe(a.home.projectedGoals);
    expect(b.away.projectedGoals).toBe(a.away.projectedGoals);
  });

  it('back-dates every played fixture with its actual score attached', () => {
    const ctx = createGoalProjectionContext(eplLast, extractTeams(eplCurrent));
    const backdated = getBackdatedProjections(ctx, eplCurrent, schedule);
    expect(backdated).toHaveLength(eplCurrent.length);
    backdated.forEach(p => {
      expect(p.actual).not.toBeNull();
      expect(p.round).toBeGreaterThan(0);
    });
  });

  it('projects only the next round, skipping postponed games from earlier rounds', () => {
    const last = [fixture('2025-08-01', 'a', 'b', 1, 1), fixture('2025-08-08', 'c', 'd', 1, 1)];
    const current = [fixture('2026-08-08', 'a', 'b', 2, 0)];
    const sched = [
      { date: '2026-08-01', home_team: 'c', away_team: 'd', round: 1 },  // postponed
      { date: '2026-08-08', home_team: 'a', away_team: 'b', round: 2 },
      { date: '2026-08-15', home_team: 'b', away_team: 'c', round: 3 },
      { date: '2026-08-16', home_team: 'd', away_team: 'a', round: 3 },
      { date: '2026-08-22', home_team: 'a', away_team: 'c', round: 4 },
    ];
    const ctx = createGoalProjectionContext(last, ['a', 'b', 'c', 'd']);
    const next = getNextRoundProjections(ctx, current, sched);
    expect(next.map(m => `${m.home.team}-${m.away.team}`)).toEqual(['b-c', 'd-a']);
  });

  it('nudges a side that out-scored its ratings in last season\'s meetings', () => {
    const teams = ['a', 'b', 'c', 'd', 'e', 'f'];
    const last = teams.flatMap(home => teams.filter(away => away !== home).map(away => {
      const aBeatsB = (home === 'a' && away === 'b') || (home === 'b' && away === 'a');
      return aBeatsB
        ? fixture('2025-09-01', home, away, home === 'a' ? 4 : 0, home === 'a' ? 0 : 4)
        : fixture('2025-09-01', home, away, 1, 1);
    }));
    const ctx = createGoalProjectionContext(last, teams);
    const p = projectMatch(ctx, [], { date: '2026-08-01', home_team: 'a', away_team: 'b', round: 1 });
    expect(p.h2hMeetings).toHaveLength(2);
    expect(p.home.h2hFactor).toBeGreaterThan(1);
    expect(p.home.formWeight).toBe(0);
  });

  it('gives promoted sides the relegated sides\' average rating', () => {
    const last = [fixture('2025-08-01', 'a', 'gone', 3, 0), fixture('2025-08-08', 'gone', 'a', 0, 3)];
    const ctx = createGoalProjectionContext(last, ['a', 'new']);
    const p = projectMatch(ctx, [], { date: '2026-08-01', home_team: 'a', away_team: 'new', round: 1 });
    expect(p.away.priorBasis).toBe('promoted');
    expect(p.away.prior.attack).toBeCloseTo(ctx.lastSeasonRatings['gone'].attack, 6);
  });
});
