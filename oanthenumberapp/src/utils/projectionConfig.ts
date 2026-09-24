import { DEFAULT_PROJECTION_CONFIG, type ProjectionConfig } from './dataProcessing';

// Per-league projection settings. leagueAvgPpg / promotedPriorPpg are left unset so they're
// computed from each league's completed seasons (falling back to 1.37 / 1.05 without history).
// Tune k and priorRegressionR with `npm run backtest`.
export const PROJECTION_CONFIG: Record<'spfl' | 'epl', ProjectionConfig> = {
  spfl: {
    ...DEFAULT_PROJECTION_CONFIG,
    // e.g. teamOverrides: { 'hibernian': { k: 6 } } for a team with a new manager
    teamOverrides: {},
  },
  epl: {
    ...DEFAULT_PROJECTION_CONFIG,
    teamOverrides: {},
  },
};
