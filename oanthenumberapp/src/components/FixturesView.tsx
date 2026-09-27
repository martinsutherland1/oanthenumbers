import { useMemo } from 'react';
import type { Fixture, ScheduledFixture } from '../types';
import { parseDate } from '../utils/dataProcessing';
import { getTeamName } from '../utils/teamColors';
import './FixturesView.css';

interface FixturesViewProps {
  mode: 'fixtures' | 'results';
  results: Fixture[];
  schedule: ScheduledFixture[];
}

interface Round<T> {
  round: number;
  matches: T[];
}

const pairKey = (home: string, away: string) => `${home}|${away}`;

const byDate = (a: { date: string; time?: string }, b: { date: string; time?: string }) =>
  parseDate(a.date).getTime() - parseDate(b.date).getTime() || (a.time ?? '').localeCompare(b.time ?? '');

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function groupByRound<T extends { date: string; time?: string }>(items: T[], roundOf: (item: T) => number): Round<T>[] {
  const rounds = new Map<number, T[]>();
  [...items].sort(byDate).forEach(item => {
    const round = roundOf(item);
    rounds.set(round, [...(rounds.get(round) ?? []), item]);
  });
  return [...rounds.entries()].sort((a, b) => a[0] - b[0]).map(([round, matches]) => ({ round, matches }));
}

function MatchRow({ date, time, home, away, result }: {
  date: string;
  time?: string;
  home: string;
  away: string;
  result?: Fixture;
}) {
  return (
    <div className="fixture-row">
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
    </div>
  );
}

export function FixturesView({ mode, results, schedule }: FixturesViewProps) {
  const { upcoming, played } = useMemo(() => {
    const roundByPair = new Map(schedule.map(s => [pairKey(s.home_team, s.away_team), s.round]));
    const resultKeys = new Set(results.map(r => pairKey(r.home_team, r.away_team)));

    return {
      upcoming: groupByRound(
        schedule.filter(s => !resultKeys.has(pairKey(s.home_team, s.away_team))),
        s => s.round
      ),
      // Latest round first
      played: groupByRound(results, r => roundByPair.get(pairKey(r.home_team, r.away_team)) ?? 0).reverse(),
    };
  }, [results, schedule]);

  if (mode === 'fixtures') {
    return (
      <div className="fixtures-container">
        {upcoming.length === 0 && <p className="fixtures-empty">No upcoming fixtures.</p>}
        {upcoming.map((r, i) => (
          <div key={r.round} className="fixtures-round">
            <h4>Round {r.round}{i === 0 && <span className="fixtures-round-label">Next</span>}</h4>
            {r.matches.map(m => (
              <MatchRow key={pairKey(m.home_team, m.away_team)} date={m.date} time={m.time} home={m.home_team} away={m.away_team} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fixtures-container">
      {played.length === 0 && <p className="fixtures-empty">No results yet.</p>}
      {played.length > 0 && (
        <p className="fixtures-note">Figures in brackets are each team's expected goals (xG) for the match.</p>
      )}
      {played.map(r => (
        <div key={r.round} className="fixtures-round">
          <h4>Round {r.round}</h4>
          {r.matches.map(m => (
            <MatchRow key={pairKey(m.home_team, m.away_team)} date={m.date} home={m.home_team} away={m.away_team} result={m} />
          ))}
        </div>
      ))}
    </div>
  );
}
