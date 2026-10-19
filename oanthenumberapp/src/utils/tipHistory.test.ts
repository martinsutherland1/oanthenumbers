import { describe, expect, it } from 'vitest';
import type { Fixture } from '../types';
import { settleTips, successRate, tally, type LoggedTip } from './tipHistory';

const tip = (over: Partial<LoggedTip>): LoggedTip => ({
  league: 'epl', round: 3, date: '2026-09-12', home: 'a', away: 'b',
  market: 'win', side: 'home', label: 'A to win', likelihood: 0.6, overall: false, loggedOn: '2026-09-10',
  ...over,
});
const result = (date: string, home_goals: number, away_goals: number, home_team = 'a', away_team = 'b') =>
  ({ date, home_team, away_team, home_goals, away_goals }) as Fixture;

describe('tip history', () => {
  it('settles tips from results and leaves unplayed ones pending', () => {
    const settled = settleTips(
      [tip({}), tip({ home: 'c', away: 'd' }), tip({ home: 'e', away: 'f', market: 'over25', side: undefined })],
      { epl: [result('2026-09-12', 2, 1), result('2026-09-12', 0, 1, 'c', 'd')] }
    );
    expect(settled.map(t => t.status)).toEqual(['won', 'lost', 'pending']);
    expect(tally(settled)).toEqual({ placed: 2, won: 1, pending: 1 });
    expect(successRate(tally(settled))).toBe(0.5);
  });

  it('ignores an earlier meeting of the same teams', () => {
    const [settled] = settleTips([tip({})], { epl: [result('2026-08-01', 3, 0)] });
    expect(settled.status).toBe('pending');
  });
});
