import type { Fixture, ScheduledFixture } from '../types';
import { extractTeams, parseDate } from './dataProcessing';
import {
  createGoalProjectionContext,
  getBackdatedProjections,
  getNextRoundProjections,
  type MatchGoalProjection,
} from './goalProjection';
import { getTeamName } from './teamColors';

// ---------------------------------------------------------------------------------------
// Betting tips from the per-fixture goal projection.
//
// Each side's projected goals is treated as the mean of an independent Poisson distribution,
// giving a probability for every scoreline and so for every market. The most likely market
// is nearly always "win or draw", so each fixture's tip is instead the market whose
// likelihood beats the league's base rate (how often it lands in an ordinary game) by the
// most, among markets more likely than not. The top tips are the most likely of those.
// ---------------------------------------------------------------------------------------

export type BetMarket = 'over25' | 'win' | 'winOrDraw' | 'btts' | 'bttsWin' | 'bttsNoDraw';
export type BetSide = 'home' | 'away';

interface BetDefinition {
  market: BetMarket;
  side?: BetSide;
  wins: (home: number, away: number) => boolean;
}

const BETS: BetDefinition[] = [
  { market: 'over25', wins: (h, a) => h + a > 2 },
  { market: 'win', side: 'home', wins: (h, a) => h > a },
  { market: 'win', side: 'away', wins: (h, a) => a > h },
  { market: 'winOrDraw', side: 'home', wins: (h, a) => h >= a },
  { market: 'winOrDraw', side: 'away', wins: (h, a) => a >= h },
  { market: 'btts', wins: (h, a) => h > 0 && a > 0 },
  { market: 'bttsWin', side: 'home', wins: (h, a) => a > 0 && h > a },
  { market: 'bttsWin', side: 'away', wins: (h, a) => h > 0 && a > h },
  { market: 'bttsNoDraw', wins: (h, a) => h > 0 && a > 0 && h !== a },
];

export const TOP_TIPS = 4;
const MIN_LIKELIHOOD = 0.5;
const MAX_GOALS = 10;

export interface BetTip {
  market: BetMarket;
  side?: BetSide;
  label: string;
  likelihood: number;
  baseRate: number;            // share of games the market landed in across the base pool
  edge: number;                // likelihood - baseRate
}

export interface FixtureTip {
  match: MatchGoalProjection;
  bet: BetTip;
}

export const tipKey = (t: FixtureTip) => `${t.match.home.team}|${t.match.away.team}`;

const betKey = (b: { market: BetMarket; side?: BetSide }) => `${b.market}:${b.side ?? ''}`;

function betLabel(def: BetDefinition, match: MatchGoalProjection): string {
  const team = def.side ? getTeamName(match[def.side].team) : '';
  switch (def.market) {
    case 'over25': return 'Over 2.5 goals';
    case 'win': return `${team} to win`;
    case 'winOrDraw': return `${team} to win or draw`;
    case 'btts': return 'Both teams to score';
    case 'bttsWin': return `${team} to win & BTTS`;
    case 'bttsNoDraw': return 'BTTS & no draw';
  }
}

export function betWon(bet: { market: BetMarket; side?: BetSide }, homeGoals: number, awayGoals: number): boolean {
  return BETS.find(b => betKey(b) === betKey(bet))!.wins(homeGoals, awayGoals);
}

function poisson(lambda: number): number[] {
  const p = [Math.exp(-lambda)];
  for (let k = 1; k <= MAX_GOALS; k++) p.push(p[k - 1] * lambda / k);
  return p;
}

// Probability of each market landing, from independent Poisson scorelines
export function marketLikelihoods(homeGoals: number, awayGoals: number): Record<string, number> {
  const ph = poisson(homeGoals);
  const pa = poisson(awayGoals);
  const out: Record<string, number> = {};
  BETS.forEach(def => {
    let p = 0;
    ph.forEach((h, i) => pa.forEach((a, j) => { if (def.wins(i, j)) p += h * a; }));
    out[betKey(def)] = p;
  });
  return out;
}

export function marketBaseRates(fixtures: Fixture[]): Record<string, number> {
  const out: Record<string, number> = {};
  BETS.forEach(def => {
    out[betKey(def)] = fixtures.length > 0
      ? fixtures.filter(f => def.wins(f.home_goals, f.away_goals)).length / fixtures.length
      : 0.5;
  });
  return out;
}

// Every market for a fixture, best tip first
export function rankBets(match: MatchGoalProjection, baseRates: Record<string, number>): BetTip[] {
  const likelihoods = marketLikelihoods(match.home.projectedGoals, match.away.projectedGoals);
  return BETS
    .map(def => {
      const key = betKey(def);
      return {
        market: def.market,
        side: def.side,
        label: betLabel(def, match),
        likelihood: likelihoods[key],
        baseRate: baseRates[key],
        edge: likelihoods[key] - baseRates[key],
      };
    })
    .sort((a, b) =>
      Number(b.likelihood >= MIN_LIKELIHOOD) - Number(a.likelihood >= MIN_LIKELIHOOD) || b.edge - a.edge
    );
}

export function pickTips(matches: MatchGoalProjection[], baseRates: Record<string, number>): FixtureTip[] {
  return matches.map(match => ({ match, bet: rankBets(match, baseRates)[0] }));
}

export function topTips(tips: FixtureTip[], count = TOP_TIPS): FixtureTip[] {
  return [...tips].sort((a, b) => b.bet.likelihood - a.bet.likelihood).slice(0, count);
}

export interface TipRecord {
  rounds: number;
  topPlaced: number;
  topWon: number;
  allPlaced: number;
  allWon: number;
}

export interface LeagueTips {
  next: FixtureTip[];
  top: FixtureTip[];
  record: TipRecord;
}

// Tips for the next round, and how this season's tips would have done, each round tipped
// using only results from before its games were played
export function getLeagueTips(
  fixtures: Fixture[],
  lastSeasonFixtures: Fixture[],
  schedule: ScheduledFixture[]
): LeagueTips {
  const teams = [...new Set([...extractTeams(fixtures), ...schedule.flatMap(s => [s.home_team, s.away_team])])];
  const ctx = createGoalProjectionContext(lastSeasonFixtures, teams);

  const next = pickTips(getNextRoundProjections(ctx, fixtures, schedule), marketBaseRates([...lastSeasonFixtures, ...fixtures]));

  const record: TipRecord = { rounds: 0, topPlaced: 0, topWon: 0, allPlaced: 0, allWon: 0 };
  const byRound = new Map<number, MatchGoalProjection[]>();
  getBackdatedProjections(ctx, fixtures, schedule).forEach(m => byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]));
  byRound.forEach(matches => {
    const firstKickOff = Math.min(...matches.map(m => parseDate(m.date).getTime()));
    const pool = [...lastSeasonFixtures, ...fixtures.filter(f => parseDate(f.date).getTime() < firstKickOff)];
    const tips = pickTips(matches, marketBaseRates(pool));
    const won = (t: FixtureTip) => betWon(t.bet, t.match.actual!.home, t.match.actual!.away);
    record.rounds++;
    record.allPlaced += tips.length;
    record.allWon += tips.filter(won).length;
    const top = topTips(tips);
    record.topPlaced += top.length;
    record.topWon += top.filter(won).length;
  });

  return { next, top: topTips(next), record };
}
