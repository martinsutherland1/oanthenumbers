import { DEFAULT_PROJECTION_CONFIG, type ProjectionConfig } from './dataProcessing';

// Per-league projection settings. leagueAvgPpg / promotedPriorPpg are left unset so they're
// computed from each league's completed seasons (falling back to 1.37 / 1.05 without history).
// Tune k and priorRegressionR with `npm run backtest`.
export const PROJECTION_CONFIG: Record<'spfl' | 'epl' | 'laliga' | 'bundesliga' | 'seriea' | 'ligue1' | 'championsleague' | 'europaleague' | 'conferenceleague', ProjectionConfig> = {
  spfl: {
    ...DEFAULT_PROJECTION_CONFIG,
    // e.g. teamOverrides: { 'hibernian': { k: 6 } } for a team with a new manager
    teamOverrides: {},
  },
  epl: {
    ...DEFAULT_PROJECTION_CONFIG,
    teamOverrides: {},
  },
  laliga: {
    ...DEFAULT_PROJECTION_CONFIG,
    teamOverrides: {},
  },
  bundesliga: {
    ...DEFAULT_PROJECTION_CONFIG,
    teamOverrides: {},
  },
  seriea: {
    ...DEFAULT_PROJECTION_CONFIG,
    teamOverrides: {},
  },
  ligue1: {
    ...DEFAULT_PROJECTION_CONFIG,
    teamOverrides: {},
  },
  // League-phase competitions have no prior-season data to build priors from, and only 6-8
  // games per team, so lean on current-season xG sooner than the domestic leagues do.
  championsleague: {
    ...DEFAULT_PROJECTION_CONFIG,
    k: 2,
    teamOverrides: {},
  },
  europaleague: {
    ...DEFAULT_PROJECTION_CONFIG,
    k: 2,
    teamOverrides: {},
  },
  conferenceleague: {
    ...DEFAULT_PROJECTION_CONFIG,
    k: 2,
    teamOverrides: {},
  },
};
