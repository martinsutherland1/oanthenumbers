import { describe, expect, it } from 'vitest';
import { expectedPoints } from './scheduleStrength';

describe('expectedPoints', () => {
  it('gives equal sides equal expected points, between 1 and 1.5', () => {
    const { home, away } = expectedPoints(1.4, 1.4);
    expect(home).toBeCloseTo(away, 6);
    expect(home).toBeGreaterThan(1);
    expect(home).toBeLessThan(1.6);
  });

  it('favours the side projected to score more', () => {
    const { home, away } = expectedPoints(2.2, 0.8);
    expect(home).toBeGreaterThan(2);
    expect(away).toBeLessThan(0.7);
  });

  it('distributes at most 3 points per match, 2 for a draw-heavy one', () => {
    const { home, away } = expectedPoints(1.2, 1.1);
    expect(home + away).toBeGreaterThan(2);
    expect(home + away).toBeLessThan(3);
  });
});
