import { describe, expect, it } from 'vitest';
import { betWon, marketLikelihoods, rankBets } from './bettingTips';
import type { MatchGoalProjection, TeamGoalProjection } from './goalProjection';

const side = (team: string, projectedGoals: number) => ({ team, projectedGoals }) as TeamGoalProjection;
const match = (home: number, away: number) =>
  ({ date: '2026-10-17', round: 1, home: side('home-fc', home), away: side('away-fc', away), h2hMeetings: [], actual: null }) as MatchGoalProjection;

describe('betting tips', () => {
  it('settles each market from the score', () => {
    expect(betWon({ market: 'over25' }, 2, 1)).toBe(true);
    expect(betWon({ market: 'over25' }, 1, 1)).toBe(false);
    expect(betWon({ market: 'winOrDraw', side: 'away' }, 1, 1)).toBe(true);
    expect(betWon({ market: 'bttsWin', side: 'home' }, 2, 0)).toBe(false);
    expect(betWon({ market: 'bttsNoDraw' }, 2, 2)).toBe(false);
    expect(betWon({ market: 'bttsNoDraw' }, 1, 2)).toBe(true);
  });

  it('gives consistent scoreline probabilities', () => {
    const p = marketLikelihoods(1.6, 1.1);
    expect(p['win:home'] + p['winOrDraw:away']).toBeCloseTo(1, 4);
    expect(p['bttsWin:home'] + p['bttsWin:away']).toBeCloseTo(p['bttsNoDraw:'], 6);
    expect(p['btts:']).toBeCloseTo((1 - Math.exp(-1.6)) * (1 - Math.exp(-1.1)), 4);
  });

  it('tips a strong home side to win rather than win or draw', () => {
    const base = { 'over25:': 0.5, 'win:home': 0.45, 'win:away': 0.3, 'winOrDraw:home': 0.7, 'winOrDraw:away': 0.55,
      'btts:': 0.5, 'bttsWin:home': 0.2, 'bttsWin:away': 0.15, 'bttsNoDraw:': 0.35 };
    const [tip] = rankBets(match(2.6, 0.6), base);
    expect(tip).toMatchObject({ market: 'win', side: 'home' });
    expect(tip.likelihood).toBeGreaterThan(0.5);
  });
});
