import type { Fixture } from '../types';
import { formatMatchDate } from '../utils/dataProcessing';
import type { FixtureTip } from '../utils/bettingTips';
import type { MatchGoalProjection } from '../utils/goalProjection';
import { getSeriesColor, getTeamName } from '../utils/teamColors';
import { Modal } from './Modal';
import { ResultsComparison, StatsComparison } from './H2HView';
import './H2HView.css';
import './FixtureDetailModal.css';

export interface FixtureDetailTarget {
  date: string;
  time?: string;
  round?: number;
  home_team: string;
  away_team: string;
  // Present once the match has been played
  result?: Fixture;
}

interface FixtureDetailModalProps {
  match: FixtureDetailTarget;
  competitionLabel?: string;
  results: Fixture[];
  lastSeasonFixtures: Fixture[];
  projection?: MatchGoalProjection;
  tip?: FixtureTip;
  onClose: () => void;
}

interface CompareRow {
  label: string;
  note?: string;
  home: number;
  away: number;
  lowerIsBetter?: boolean;
}

function CompareCard({ title, home, away, rows }: { title: string; home: string; away: string; rows: CompareRow[] }) {
  return (
    <div className="h2h-card">
      <table className="h2h-compare-table">
        <thead>
          <tr>
            <th className="h2h-compare-team" style={{ color: getSeriesColor(0) }}>{getTeamName(home)}</th>
            <th className="h2h-compare-metric">{title}</th>
            <th className="h2h-compare-team" style={{ color: getSeriesColor(1) }}>{getTeamName(away)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const sign = row.lowerIsBetter ? -1 : 1;
            return (
              <tr key={row.label}>
                <td className={sign * row.home > sign * row.away ? 'h2h-better' : ''}>{row.home.toFixed(2)}</td>
                <td className="h2h-compare-metric">
                  {row.label}
                  {row.note && <span className="h2h-compare-note">{row.note}</span>}
                </td>
                <td className={sign * row.away > sign * row.home ? 'h2h-better' : ''}>{row.away.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="h2h-footnote">Highlighted value is the better of the two.</p>
    </div>
  );
}

function MatchStats({ result }: { result: Fixture }) {
  const rows: CompareRow[] = [
    { label: 'xG', home: result.home_xG, away: result.away_xG },
    { label: 'NPxG', note: 'Excluding penalties', home: result.home_npxg, away: result.away_npxg },
    { label: 'xG Open Play', home: result.home_xg_open_play, away: result.away_xg_open_play },
    { label: 'xG Set Play', home: result.home_xg_set_play, away: result.away_xg_set_play },
    { label: 'xGOT', note: 'Quality of shots on target', home: result.home_xgot, away: result.away_xgot },
  ];
  return (
    <>
      <div className="fixture-detail-score">
        <span style={{ color: getSeriesColor(0) }}>{getTeamName(result.home_team)}</span>
        <strong>{result.home_goals} – {result.away_goals}</strong>
        <span style={{ color: getSeriesColor(1) }}>{getTeamName(result.away_team)}</span>
      </div>
      <CompareCard title="Match" home={result.home_team} away={result.away_team} rows={rows} />
    </>
  );
}

function Projection({ projection, tip }: { projection: MatchGoalProjection; tip?: FixtureTip }) {
  const rows: CompareRow[] = [
    { label: 'Projected goals', home: projection.home.projectedGoals, away: projection.away.projectedGoals },
    { label: 'Attack rating', note: 'Above 1 is better than average', home: projection.home.attack, away: projection.away.attack },
    { label: 'Defence rating', note: 'Below 1 is better than average', home: projection.home.defence, away: projection.away.defence, lowerIsBetter: true },
  ];
  return (
    <>
      <CompareCard title="Projection" home={projection.home.team} away={projection.away.team} rows={rows} />
      {tip && (
        <p className="fixture-detail-tip">
          Tip: {tip.bet.label} <strong>{Math.round(tip.bet.likelihood * 100)}%</strong>
        </p>
      )}
    </>
  );
}

// Everything held on one fixture: the match itself (result or projection), each side's season
// so far and how the two have fared against each other
export function FixtureDetailModal({ match, competitionLabel, results, lastSeasonFixtures, projection, tip, onClose }: FixtureDetailModalProps) {
  const { home_team: home, away_team: away, result } = match;
  const when = formatMatchDate(match.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const subtitle = [competitionLabel, when, !result && match.time, match.round !== undefined && match.round > 0 && `Round ${match.round}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal
      title={<>{getTeamName(home)} <span className="fixture-detail-v">v</span> {getTeamName(away)}</>}
      ariaLabel={`${getTeamName(home)} v ${getTeamName(away)}`}
      subtitle={subtitle}
      wide
      onClose={onClose}
    >
      <div className="fixture-detail">
        {result && <MatchStats result={result} />}
        {!result && projection && <Projection projection={projection} tip={tip} />}
        <StatsComparison fixtures={results} teamA={home} teamB={away} />
        <ResultsComparison fixtures={results} teamA={home} teamB={away} lastSeasonFixtures={lastSeasonFixtures} />
      </div>
    </Modal>
  );
}
