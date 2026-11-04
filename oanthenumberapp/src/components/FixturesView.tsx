import { useMemo, useState } from 'react';
import type { Fixture, ScheduledFixture } from '../types';
import { dateSortValue, extractTeams, formatMatchDate, isPastDate } from '../utils/dataProcessing';
import { tipKey, type FixtureTip, type LeagueTips } from '../utils/bettingTips';
import { createGoalProjectionContext, projectMatch } from '../utils/goalProjection';
import { getTeamName } from '../utils/teamColors';
import { matchResultsToSchedule } from '../utils/teamMatches';
import { FixtureDetailModal, type FixtureDetailTarget } from './FixtureDetailModal';
import './FixturesView.css';

interface FixturesViewProps {
  mode: 'fixtures' | 'results';
  results: Fixture[];
  lastSeasonFixtures: Fixture[];
  schedule: ScheduledFixture[];
  tips: LeagueTips;
}

interface Round<T> {
  round: number;
  matches: T[];
}

const pairKey = (home: string, away: string) => `${home}|${away}`;

const byDate = (a: { date: string; time?: string }, b: { date: string; time?: string }) =>
  dateSortValue(a.date) - dateSortValue(b.date) || (a.time ?? '').localeCompare(b.time ?? '');

const formatDate = (date: string) =>
  formatMatchDate(date, { weekday: 'short', day: 'numeric', month: 'short' });

// Matches in date order, with consecutive matches from the same round grouped together,
// so a rearranged match appears under its round at the point it is actually played
function groupByRound<T extends { date: string; time?: string }>(items: T[], roundOf: (item: T) => number): Round<T>[] {
  const rounds: Round<T>[] = [];
  [...items].sort(byDate).forEach(item => {
    const round = roundOf(item);
    const last = rounds[rounds.length - 1];
    if (last?.round === round) last.matches.push(item);
    else rounds.push({ round, matches: [item] });
  });
  return rounds;
}

function groupByRoundNumber<T extends { date: string; time?: string }>(items: T[], roundOf: (item: T) => number): Round<T>[] {
  const rounds = new Map<number, T[]>();
  [...items].sort(byDate).forEach(item => {
    const round = roundOf(item);
    rounds.set(round, [...(rounds.get(round) ?? []), item]);
  });
  return [...rounds.entries()].sort((a, b) => a[0] - b[0]).map(([round, matches]) => ({ round, matches }));
}

function MatchRow({ date, time, home, away, result, tip, topTip, onSelect }: {
  date: string;
  time?: string;
  home: string;
  away: string;
  result?: Fixture;
  tip?: FixtureTip;
  topTip?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className="fixture-row fixture-row-clickable"
      role="button"
      tabIndex={0}
      aria-label={`${getTeamName(home)} v ${getTeamName(away)}: show match details`}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="fixture-date">{formatDate(date)}{!result && time ? ` · ${time}` : ''}</span>
      <span className="fixture-team fixture-home">{getTeamName(home)}</span>
      <span className="fixture-score">
        {result ? (
          <>
            <strong>{result.home_goals}</strong>
            <span className="fixture-xg">({result.home_xG.toFixed(2)})</span>
            <span className="fixture-dash">–</span>
            <strong>{result.away_goals}</strong>
            <span className="fixture-xg">({result.away_xG.toFixed(2)})</span>
          </>
        ) : 'v'}
      </span>
      <span className="fixture-team fixture-away">{getTeamName(away)}</span>
      {tip && (
        <span className={`fixture-tip ${topTip ? 'fixture-tip-top' : ''}`}>
          {topTip && <span aria-label="Top tip">★ </span>}
          Tip: {tip.bet.label} <strong>{Math.round(tip.bet.likelihood * 100)}%</strong>
        </span>
      )}
    </div>
  );
}

export function FixturesView({ mode, results, lastSeasonFixtures, schedule, tips }: FixturesViewProps) {
  const tipByPair = useMemo(() => new Map(tips.next.map(t => [tipKey(t), t])), [tips]);
  const topPairs = useMemo(() => new Set(tips.top.map(tipKey)), [tips]);
  const [selected, setSelected] = useState<FixtureDetailTarget | null>(null);

  // Projected goals for the selected upcoming match; needs last season's results to rate teams
  const selectedTip = selected && !selected.result ? tipByPair.get(pairKey(selected.home_team, selected.away_team)) : undefined;
  const projection = useMemo(() => {
    if (!selected || selected.result || lastSeasonFixtures.length === 0) return undefined;
    if (selectedTip && selectedTip.match.date === selected.date) return selectedTip.match;
    const teams = [...new Set([...extractTeams(results), ...schedule.flatMap(s => [s.home_team, s.away_team])])];
    const ctx = createGoalProjectionContext(lastSeasonFixtures, teams);
    return projectMatch(ctx, results, { ...selected, round: selected.round ?? 0 });
  }, [selected, selectedTip, results, lastSeasonFixtures, schedule]);

  const detail = selected && (
    <FixtureDetailModal
      match={selected}
      results={results}
      lastSeasonFixtures={lastSeasonFixtures}
      projection={projection}
      tip={selectedTip}
      onClose={() => setSelected(null)}
    />
  );

  const { upcoming, played } = useMemo(() => {
    const entryByResult = matchResultsToSchedule(results, schedule);
    const playedEntries = new Set(entryByResult.values());

    return {
      // Matches dated before today have been played, even if their result isn't in yet
      upcoming: groupByRound(schedule.filter(s => !playedEntries.has(s) && !isPastDate(s.date)), s => s.round),
      // Latest round first, matches within a round in date order
      played: groupByRoundNumber(results, r => entryByResult.get(r)?.round ?? 0).reverse(),
    };
  }, [results, schedule]);

  if (mode === 'fixtures') {
    return (
      <div className="fixtures-container">
        {upcoming.length === 0 && <p className="fixtures-empty">No upcoming fixtures.</p>}
        {upcoming.map((r, i) => (
          <div key={`${r.round}-${i}`} className="fixtures-round">
            <h4>Round {r.round}{i === 0 && <span className="fixtures-round-label">Next</span>}</h4>
            {r.matches.map(m => {
              const key = pairKey(m.home_team, m.away_team);
              return (
                <MatchRow
                  key={key}
                  date={m.date}
                  time={m.time}
                  home={m.home_team}
                  away={m.away_team}
                  tip={tipByPair.get(key)}
                  topTip={topPairs.has(key)}
                  onSelect={() => setSelected(m)}
                />
              );
            })}
          </div>
        ))}
        {detail}
      </div>
    );
  }

  return (
    <div className="fixtures-container">
      {played.length === 0 && <p className="fixtures-empty">No results yet.</p>}
      {played.length > 0 && (
        <p className="fixtures-note">Figures in brackets are each team's expected goals (xG) for the match.</p>
      )}
      {played.map((r, i) => (
        <div key={`${r.round}-${i}`} className="fixtures-round">
          <h4>Round {r.round}</h4>
          {r.matches.map(m => (
            <MatchRow
              key={pairKey(m.home_team, m.away_team)}
              date={m.date}
              home={m.home_team}
              away={m.away_team}
              result={m}
              onSelect={() => setSelected({ ...m, round: r.round, result: m })}
            />
          ))}
        </div>
      ))}
      {detail}
    </div>
  );
}
