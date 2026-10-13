import type { Fixture, ScheduledFixture } from '../types';
import { extractTeams, parseDate } from './dataProcessing';

// ---------------------------------------------------------------------------------------
// Per-fixture goal projection (multiplicative attack/defence model).
//
//   HomeGoals = LeagueHomeGoalsPerGame x HomeAttack x AwayDefence x H2H(home)
//   AwayGoals = LeagueAwayGoalsPerGame x AwayAttack x HomeDefence x H2H(away)
//
// Each game is scored as a blend of xG and actual goals, divided by the league average for
// that venue, so a rating of 1.0 is league average. Attack/defence blend current form (the
// last `formGames` games this season) with last season's ratings regressed towards 1.0:
//   w = FormGames / (FormGames + k)
// Promoted sides take the average last-season rating of the relegated sides. The H2H factor
// is how far each side over/under-performed last season's ratings in last season's meetings,
// shrunk by the number of meetings so it nudges rather than drives the projection.
// Only fixtures dated before the match are used, so past rounds can be projected honestly.
// ---------------------------------------------------------------------------------------

export interface GoalProjectionConfig {
  k: number;
  formGames: number;
  xgWeight: number;              // weight on xG vs actual goals when rating a game
  priorRegressionR: number;      // share of last season's rating kept when regressing to 1.0
  h2hWeightPerMeeting: number;
  h2hMaxWeight: number;
}

export const DEFAULT_GOAL_PROJECTION_CONFIG: GoalProjectionConfig = {
  k: 6,
  formGames: 10,
  xgWeight: 0.6,
  priorRegressionR: 0.85,
  // Back-testing found last season's H2H adds no accuracy over the team ratings, so it is
  // kept as a gentle nudge only
  h2hWeightPerMeeting: 0,
  h2hMaxWeight: 0.15,
};

const FALLBACK_PROMOTED: Rating = { attack: 0.8, defence: 1.2, games: 0 };

export interface Rating {
  attack: number;
  defence: number;
  games: number;
}

interface VenueAverages {
  homeMetric: number;
  awayMetric: number;
  homeGoals: number;
  awayGoals: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const byDate = (a: Fixture, b: Fixture) => parseDate(a.date).getTime() - parseDate(b.date).getTime();
const involves = (f: Fixture, team: string) => f.home_team === team || f.away_team === team;

function metric(goals: number, xg: number, xgWeight: number): number {
  return typeof xg === 'number' ? xgWeight * xg + (1 - xgWeight) * goals : goals;
}

function venueAverages(fixtures: Fixture[], xgWeight: number): VenueAverages | null {
  if (fixtures.length === 0) return null;
  const n = fixtures.length;
  const sum = (fn: (f: Fixture) => number) => fixtures.reduce((s, f) => s + fn(f), 0) / n;
  return {
    homeMetric: sum(f => metric(f.home_goals, f.home_xG, xgWeight)),
    awayMetric: sum(f => metric(f.away_goals, f.away_xG, xgWeight)),
    homeGoals: sum(f => f.home_goals),
    awayGoals: sum(f => f.away_goals),
  };
}

// Venue-normalised for/against ratio of one game, from `team`'s point of view
function gameRatios(f: Fixture, team: string, avgs: VenueAverages, xgWeight: number) {
  const home = f.home_team === team;
  const scored = home ? metric(f.home_goals, f.home_xG, xgWeight) : metric(f.away_goals, f.away_xG, xgWeight);
  const conceded = home ? metric(f.away_goals, f.away_xG, xgWeight) : metric(f.home_goals, f.home_xG, xgWeight);
  return {
    attack: scored / (home ? avgs.homeMetric : avgs.awayMetric),
    defence: conceded / (home ? avgs.awayMetric : avgs.homeMetric),
  };
}

function rateGames(games: Fixture[], team: string, avgs: VenueAverages, xgWeight: number): Rating | null {
  if (games.length === 0) return null;
  let attack = 0;
  let defence = 0;
  games.forEach(f => {
    const r = gameRatios(f, team, avgs, xgWeight);
    attack += r.attack;
    defence += r.defence;
  });
  return { attack: attack / games.length, defence: defence / games.length, games: games.length };
}

export interface GoalProjectionContext {
  config: GoalProjectionConfig;
  lastSeason: Fixture[];
  lastSeasonAverages: VenueAverages | null;
  lastSeasonRatings: Record<string, Rating>;
  promotedRating: Rating;
}

// currentTeams should be the full league (e.g. from the schedule) so relegated sides are known
export function createGoalProjectionContext(
  lastSeason: Fixture[],
  currentTeams: string[],
  config: GoalProjectionConfig = DEFAULT_GOAL_PROJECTION_CONFIG
): GoalProjectionContext {
  const lastSeasonAverages = venueAverages(lastSeason, config.xgWeight);
  const lastSeasonRatings: Record<string, Rating> = {};
  if (lastSeasonAverages) {
    extractTeams(lastSeason).forEach(team => {
      const rating = rateGames(lastSeason.filter(f => involves(f, team)), team, lastSeasonAverages, config.xgWeight);
      if (rating) lastSeasonRatings[team] = rating;
    });
  }

  const current = new Set(currentTeams);
  const relegated = Object.keys(lastSeasonRatings).filter(t => !current.has(t));
  const promotedRating = relegated.length > 0
    ? {
        attack: relegated.reduce((s, t) => s + lastSeasonRatings[t].attack, 0) / relegated.length,
        defence: relegated.reduce((s, t) => s + lastSeasonRatings[t].defence, 0) / relegated.length,
        games: 0,
      }
    : FALLBACK_PROMOTED;

  return { config, lastSeason, lastSeasonAverages, lastSeasonRatings, promotedRating };
}

export interface TeamGoalProjection {
  team: string;
  projectedGoals: number;
  form: Rating | null;           // this season, last `formGames` games before the match
  prior: Rating;                 // last season (regressed), or the promoted-side prior
  priorBasis: 'last_season' | 'promoted';
  formWeight: number;
  attack: number;                // blended
  defence: number;               // blended
  h2hFactor: number;             // multiplier applied to projected goals, 1 without meetings
}

export interface MatchGoalProjection {
  date: string;
  time?: string;
  round: number;
  home: TeamGoalProjection;
  away: TeamGoalProjection;
  h2hMeetings: Fixture[];        // last season's meetings, oldest first
  actual: { home: number; away: number; homeXg: number; awayXg: number } | null;
}

function teamStrength(
  ctx: GoalProjectionContext,
  priorFixtures: Fixture[],
  avgs: VenueAverages,
  team: string
) {
  const { config } = ctx;
  const last = ctx.lastSeasonRatings[team];
  const r = config.priorRegressionR;
  const prior: Rating = last
    ? { attack: r * last.attack + (1 - r), defence: r * last.defence + (1 - r), games: last.games }
    : ctx.promotedRating;

  const recent = priorFixtures.filter(f => involves(f, team)).slice(-config.formGames);
  const form = rateGames(recent, team, avgs, config.xgWeight);
  const formWeight = form ? form.games / (form.games + config.k) : 0;

  return {
    form,
    prior,
    priorBasis: last ? 'last_season' as const : 'promoted' as const,
    formWeight,
    attack: formWeight * (form?.attack ?? 0) + (1 - formWeight) * prior.attack,
    defence: formWeight * (form?.defence ?? 0) + (1 - formWeight) * prior.defence,
  };
}

// How `team` scored against `opponent` in last season's meetings relative to what last
// season's ratings implied, raised to a weight that grows with the number of meetings
function h2hFactor(ctx: GoalProjectionContext, meetings: Fixture[], team: string, opponent: string): number {
  const avgs = ctx.lastSeasonAverages;
  const att = ctx.lastSeasonRatings[team];
  const def = ctx.lastSeasonRatings[opponent];
  if (!avgs || !att || !def || meetings.length === 0) return 1;

  const expected = att.attack * def.defence;
  if (expected <= 0) return 1;
  const observed = meetings.reduce((s, f) => s + gameRatios(f, team, avgs, ctx.config.xgWeight).attack, 0) / meetings.length;
  const weight = Math.min(ctx.config.h2hMaxWeight, ctx.config.h2hWeightPerMeeting * meetings.length);
  return Math.pow(clamp(observed / expected, 0.5, 2), weight);
}

export function projectMatch(
  ctx: GoalProjectionContext,
  currentSeason: Fixture[],
  match: { date: string; time?: string; round: number; home_team: string; away_team: string },
  actual?: Fixture
): MatchGoalProjection {
  const cutoff = parseDate(match.date).getTime();
  const priorFixtures = currentSeason.filter(f => parseDate(f.date).getTime() < cutoff).sort(byDate);
  // League scale pools last season with this season to date, so early rounds aren't noisy
  const avgs = venueAverages([...ctx.lastSeason, ...priorFixtures], ctx.config.xgWeight)
    ?? { homeMetric: 1.5, awayMetric: 1.2, homeGoals: 1.5, awayGoals: 1.2 };

  const { home_team: home, away_team: away } = match;
  const homeStrength = teamStrength(ctx, priorFixtures, avgs, home);
  const awayStrength = teamStrength(ctx, priorFixtures, avgs, away);
  const h2hMeetings = ctx.lastSeason
    .filter(f => (f.home_team === home && f.away_team === away) || (f.home_team === away && f.away_team === home))
    .sort(byDate);
  const homeH2h = h2hFactor(ctx, h2hMeetings, home, away);
  const awayH2h = h2hFactor(ctx, h2hMeetings, away, home);

  const goals = (scale: number, attack: number, defence: number, h2h: number) =>
    clamp(scale * attack * defence * h2h, 0.1, 5);

  return {
    date: match.date,
    time: match.time,
    round: match.round,
    home: {
      team: home,
      ...homeStrength,
      h2hFactor: homeH2h,
      projectedGoals: goals(avgs.homeGoals, homeStrength.attack, awayStrength.defence, homeH2h),
    },
    away: {
      team: away,
      ...awayStrength,
      h2hFactor: awayH2h,
      projectedGoals: goals(avgs.awayGoals, awayStrength.attack, homeStrength.defence, awayH2h),
    },
    h2hMeetings,
    actual: actual
      ? { home: actual.home_goals, away: actual.away_goals, homeXg: actual.home_xG, awayXg: actual.away_xG }
      : null,
  };
}

const pairKey = (home: string, away: string) => `${home}|${away}`;

// The next round's unplayed fixtures. Postponed games left over from earlier rounds (dated
// before the latest result) don't count as the next round.
export function getNextRoundProjections(
  ctx: GoalProjectionContext,
  currentSeason: Fixture[],
  schedule: ScheduledFixture[]
): MatchGoalProjection[] {
  const played = new Set(currentSeason.map(f => pairKey(f.home_team, f.away_team)));
  const latestPlayed = Math.max(0, ...currentSeason.map(f => parseDate(f.date).getTime()));
  const unplayed = schedule
    .filter(s => !played.has(pairKey(s.home_team, s.away_team)))
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime() || (a.time ?? '').localeCompare(b.time ?? ''));
  const next = unplayed.find(s => parseDate(s.date).getTime() >= latestPlayed) ?? unplayed[0];
  if (!next) return [];
  return unplayed
    .filter(s => s.round === next.round)
    .map(s => projectMatch(ctx, currentSeason, s));
}

// Every played fixture this season, projected as of its kick-off date
export function getBackdatedProjections(
  ctx: GoalProjectionContext,
  currentSeason: Fixture[],
  schedule: ScheduledFixture[]
): MatchGoalProjection[] {
  const roundByPair = new Map(schedule.map(s => [pairKey(s.home_team, s.away_team), s.round]));
  return [...currentSeason]
    .sort(byDate)
    .map(f => projectMatch(
      ctx,
      currentSeason,
      { ...f, round: roundByPair.get(pairKey(f.home_team, f.away_team)) ?? 0 },
      f
    ));
}

export interface GoalProjectionAccuracy {
  matches: number;
  mae: number;                   // mean absolute error per team per match
  baselineMae: number;           // same, projecting every side at the league venue average
  bias: number;                  // mean (projected - actual) goals per team per match
}

export function getProjectionAccuracy(projections: MatchGoalProjection[], currentSeason: Fixture[], lastSeason: Fixture[]): GoalProjectionAccuracy | null {
  const scored = projections.filter(p => p.actual);
  if (scored.length === 0) return null;

  let absErr = 0;
  let baseErr = 0;
  let bias = 0;
  scored.forEach(p => {
    const cutoff = parseDate(p.date).getTime();
    const pool = [...lastSeason, ...currentSeason.filter(f => parseDate(f.date).getTime() < cutoff)];
    const avgs = venueAverages(pool, 0) ?? { homeGoals: 1.5, awayGoals: 1.2 };
    const a = p.actual!;
    absErr += Math.abs(p.home.projectedGoals - a.home) + Math.abs(p.away.projectedGoals - a.away);
    baseErr += Math.abs(avgs.homeGoals - a.home) + Math.abs(avgs.awayGoals - a.away);
    bias += p.home.projectedGoals - a.home + p.away.projectedGoals - a.away;
  });
  const n = scored.length * 2;
  return { matches: scored.length, mae: absErr / n, baselineMae: baseErr / n, bias: bias / n };
}

// Per-team goal error bands: within half a goal is good, a goal and a quarter or more is poor
export type ErrorBand = 'good' | 'fair' | 'poor';
export const ERROR_BAND_THRESHOLDS = { good: 0.5, poor: 1.25 };

export function errorBand(err: number): ErrorBand {
  const abs = Math.abs(err);
  return abs <= ERROR_BAND_THRESHOLDS.good ? 'good' : abs >= ERROR_BAND_THRESHOLDS.poor ? 'poor' : 'fair';
}

export type ErrorBandCounts = Record<ErrorBand, number> & { predictions: number };

// Each played match gives two predictions, one per side
export function getErrorBandCounts(projections: MatchGoalProjection[]): ErrorBandCounts {
  const counts: ErrorBandCounts = { predictions: 0, good: 0, fair: 0, poor: 0 };
  projections.forEach(p => {
    if (!p.actual) return;
    counts[errorBand(p.home.projectedGoals - p.actual.home)]++;
    counts[errorBand(p.away.projectedGoals - p.actual.away)]++;
    counts.predictions += 2;
  });
  return counts;
}
