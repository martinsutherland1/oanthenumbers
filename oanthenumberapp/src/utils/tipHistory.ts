import type { Fixture } from '../types';
import { betWon, type BetMarket, type BetSide, type LeagueTips } from './bettingTips';
import { parseDate } from './dataProcessing';

// A tip as logged in src/data/tip_history.json. Entries are written once, before the match,
// by `npm run log-tips`, and never change; whether they won is worked out from the results.
export interface LoggedTip {
  league: string;
  round: number;
  date: string;          // scheduled match date
  time?: string;
  home: string;
  away: string;
  market: BetMarket;
  side?: BetSide;
  label: string;
  likelihood: number;
  overall: boolean;      // was in the top tips across all leagues when logged
  loggedOn: string;      // YYYY-MM-DD
}

export type TipStatus = 'won' | 'lost' | 'pending';

export interface SettledTip extends LoggedTip {
  status: TipStatus;
  score?: { home: number; away: number };
}

export const logKey = (t: Pick<LoggedTip, 'league' | 'round' | 'home' | 'away'>) =>
  `${t.league}|${t.round}|${t.home}|${t.away}`;

// Entries for tips not yet logged. Existing entries are kept exactly as first logged.
export function newTipEntries(
  existing: LoggedTip[],
  leagues: { key: string; tips: LeagueTips }[],
  overallKeys: Set<string>,
  loggedOn: string
): LoggedTip[] {
  const seen = new Set(existing.map(logKey));
  return leagues.flatMap(l => l.tips.top.map(t => ({
    league: l.key,
    round: t.match.round,
    date: t.match.date,
    ...(t.match.time ? { time: t.match.time } : {}),
    home: t.match.home.team,
    away: t.match.away.team,
    market: t.bet.market,
    ...(t.bet.side ? { side: t.bet.side } : {}),
    label: t.bet.label,
    likelihood: Math.round(t.bet.likelihood * 1000) / 1000,
    overall: overallKeys.has(`${l.key}|${t.match.home.team}|${t.match.away.team}`),
    loggedOn,
  }))).filter(e => !seen.has(logKey(e)));
}

// Marks each tip won/lost once its match has a result. The match is the first result for
// that home/away pairing on or after the earlier of its scheduled and logged dates, so a
// rearranged game is still found and an earlier meeting of the same teams is never mistaken
// for it.
export function settleTips(tips: LoggedTip[], resultsByLeague: Record<string, Fixture[]>): SettledTip[] {
  return tips.map(tip => {
    const from = Math.min(parseDate(tip.date).getTime(), parseDate(tip.loggedOn).getTime());
    const result = (resultsByLeague[tip.league] ?? [])
      .filter(f => f.home_team === tip.home && f.away_team === tip.away && parseDate(f.date).getTime() >= from)
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())[0];
    if (!result) return { ...tip, status: 'pending' as const };
    return {
      ...tip,
      status: betWon(tip, result.home_goals, result.away_goals) ? 'won' as const : 'lost' as const,
      score: { home: result.home_goals, away: result.away_goals },
    };
  });
}

export interface TipTally {
  placed: number;       // settled tips
  won: number;
  pending: number;
}

export function tally(tips: SettledTip[]): TipTally {
  const settled = tips.filter(t => t.status !== 'pending');
  return { placed: settled.length, won: settled.filter(t => t.status === 'won').length, pending: tips.length - settled.length };
}

export const successRate = (t: TipTally) => t.placed > 0 ? t.won / t.placed : null;
