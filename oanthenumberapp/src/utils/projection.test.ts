import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROJECTION_CONFIG,
  FALLBACK_PROMOTED_PRIOR_PPG,
  blendPpg,
  buildProjectionPriors,
  createProjectionContext,
  flattenFixtures,
  getLeagueTable,
  getProjectionResult,
  getTeamGames,
  getXPointsPerGame,
  projectPoints,
  type ProjectionConfig,
} from './dataProcessing';
import type { Fixture, FixturesData } from '../types';
import spfl2425 from '../data/spfl_results_2024_25.json';
import spfl2526 from '../data/spfl_results_2025_26.json';
import spfl2627 from '../data/spfl_results_2026_27.json';
import epl2526 from '../data/epl_results_2025_26.json';
import epl2627 from '../data/epl_results_2026_27.json';

const load = (data: unknown) => flattenFixtures(data as FixturesData);
const spflHistory = [load(spfl2425), load(spfl2526)];
const spflCurrent = load(spfl2627);
const eplLast = load(epl2526);
const eplCurrent = load(epl2627);

function fixture(date: string, home: string, away: string, hg: number, ag: number, hxg = 1, axg = 1): Fixture {
  return {
    date, home_team: home, away_team: away, home_goals: hg, away_goals: ag,
    home_xG: hxg, away_xG: axg, home_xg_open_play: hxg, away_xg_open_play: axg,
    home_xg_set_play: 0, away_xg_set_play: 0, home_npxg: hxg, away_npxg: axg, home_xgot: hxg, away_xgot: axg,
  };
}

// The projection as it was before prior weighting was added
function originalProjection(fixtures: Fixture[], seasonGames = 38) {
  return getLeagueTable(fixtures)
    .map(row => {
      const games = getTeamGames(fixtures, row.team, 'xg');
      const xppg = games.length
        ? Math.round((games.reduce((s, g) => s + getXPointsPerGame(g.xgDiff), 0) / games.length) * 100) / 100
        : 0;
      const remaining = Math.max(0, seasonGames - row.played);
      return { team: row.team, projectedPoints: Math.round((row.points + remaining * xppg) * 10) / 10 };
    })
    .sort((a, b) => b.projectedPoints - a.projectedPoints);
}

describe('prior-weighted blend', () => {
  it('matches the spec worked example (62.7)', () => {
    const { weightW, blendedPpg } = blendPpg(8, 1.9, 1.4, 10);
    expect(weightW).toBeCloseTo(0.444, 3);
    expect(blendedPpg).toBeCloseTo(1.622, 3);
    expect(Number(projectPoints(14, blendedPpg, 30).toFixed(1))).toBe(62.7);
  });

  it('uses only the prior when no games have been played', () => {
    const { weightW, blendedPpg } = blendPpg(0, 2.5, 1.4, 10);
    expect(weightW).toBe(0);
    expect(blendedPpg).toBe(1.4);
  });

  it('approaches the current xPPG as games played grows', () => {
    const { blendedPpg } = blendPpg(100000, 1.9, 1.4, 10);
    expect(blendedPpg).toBeCloseTo(1.9, 3);
  });
});

describe('priors', () => {
  it('gives promoted teams the promoted prior', () => {
    const last = [fixture('2025-08-01', 'a', 'b', 1, 0), fixture('2025-08-08', 'b', 'a', 2, 2)];
    const current = [fixture('2026-08-01', 'a', 'newcomer', 1, 1)];
    const context = createProjectionContext(last, [last]);
    const newcomer = getProjectionResult(current, 38, context).rows.find(r => r.team === 'newcomer')!;
    expect(newcomer.priorBasis).toBe('promoted');
    expect(newcomer.priorPpg).toBe(FALLBACK_PROMOTED_PRIOR_PPG);
  });

  it('computes the promoted prior from history when available', () => {
    const priors = buildProjectionPriors(spflHistory[1], spflHistory);
    // Falkirk and Livingston came up for 2025/26
    const table = getLeagueTable(spflHistory[1]).filter(r => r.team === 'falkirk' || r.team === 'livingston');
    const expected = table.reduce((s, r) => s + r.points, 0) / table.reduce((s, r) => s + r.played, 0);
    expect(priors.promotedPriorPpg).toBeCloseTo(expected, 6);
    expect(priors.teamPriors['st-johnstone']).toBeUndefined();
  });

  it('regresses last season towards the league average by r', () => {
    const priors = buildProjectionPriors(spflHistory[1], spflHistory);
    const celtic = priors.teamPriors['celtic'];
    expect(celtic.basis).toBe('xg');
    expect(celtic.priorPpg).toBeCloseTo(0.67 * celtic.baseValue + 0.33 * priors.leagueAvgPpg, 6);
  });
});

describe('normalisation', () => {
  it('leaves earned points alone and brings the league total within tolerance', () => {
    // An inflated league average forces scaling
    const config: ProjectionConfig = { ...DEFAULT_PROJECTION_CONFIG, leagueAvgPpg: 1.6 };
    const context = createProjectionContext(spflHistory[1], spflHistory, config);
    const result = getProjectionResult(spflCurrent, 38, context);
    const norm = result.normalisation!;

    expect(norm.applied).toBe(true);
    expect(Math.abs(norm.finalTotal - norm.expectedTotal) / norm.expectedTotal).toBeLessThanOrEqual(config.normaliseTolerance);

    const table = getLeagueTable(spflCurrent);
    result.rows.forEach(r => {
      expect(r.points).toBe(table.find(t => t.team === r.team)!.points);
      expect(r.projectedPoints).toBeGreaterThanOrEqual(r.points);
    });
    const summed = result.rows.reduce((s, r) => s + r.projectedPoints, 0);
    expect(Math.abs(summed - norm.expectedTotal) / norm.expectedTotal).toBeLessThanOrEqual(config.normaliseTolerance);
  });
});

describe('method: current', () => {
  it.each([
    ['SPFL', spflCurrent, spflHistory[1], spflHistory],
    ['EPL', eplCurrent, eplLast, [eplLast]],
  ])('reproduces the original projection exactly (%s)', (_label, current, last, history) => {
    const expected = originalProjection(current);
    const context = createProjectionContext(last, history, { ...DEFAULT_PROJECTION_CONFIG, method: 'current' });

    for (const result of [getProjectionResult(current), getProjectionResult(current, 38, context)]) {
      expect(result.rows.map(r => ({ team: r.team, projectedPoints: r.projectedPoints }))).toEqual(expected);
      expect(result.normalisation).toBeNull();
    }
  });
});
