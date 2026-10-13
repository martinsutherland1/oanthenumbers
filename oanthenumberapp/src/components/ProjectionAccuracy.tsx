import { useMemo } from 'react';
import type { Fixture, ScheduledFixture } from '../types';
import { extractTeams } from '../utils/dataProcessing';
import {
  createGoalProjectionContext,
  ERROR_BAND_THRESHOLDS,
  getBackdatedProjections,
  getErrorBandCounts,
  type ErrorBand,
  type ErrorBandCounts,
} from '../utils/goalProjection';
import './LeagueTable.css';
import './NextFixtureProjection.css';
import './ProjectionAccuracy.css';

export interface ProjectionAccuracyLeague {
  key: string;
  label: string;
  fixtures: Fixture[];
  lastSeasonFixtures: Fixture[];
  schedule: ScheduledFixture[];
}

interface ProjectionAccuracyProps {
  leagues: ProjectionAccuracyLeague[];
  activeLeague: string;
}

const BANDS: { key: ErrorBand; label: string; className: string }[] = [
  { key: 'good', label: 'Green', className: 'positive' },
  { key: 'fair', label: 'White', className: '' },
  { key: 'poor', label: 'Red', className: 'negative' },
];

function leagueBandCounts(league: ProjectionAccuracyLeague): ErrorBandCounts {
  const teams = [...new Set([...extractTeams(league.fixtures), ...league.schedule.flatMap(s => [s.home_team, s.away_team])])];
  const ctx = createGoalProjectionContext(league.lastSeasonFixtures, teams);
  return getErrorBandCounts(getBackdatedProjections(ctx, league.fixtures, league.schedule));
}

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

function BandRow({ label, counts, className }: { label: string; counts: ErrorBandCounts; className?: string }) {
  return (
    <tr className={className}>
      <td className="an-col-league">{label}</td>
      <td className="an-col-num hide-mobile">{counts.predictions}</td>
      {BANDS.map(b => (
        <td key={b.key} className={`an-col-num ${b.className}`}>
          {pct(counts[b.key], counts.predictions).toFixed(1)}%
        </td>
      ))}
      <td className="an-col-bar hide-mobile">
        <div className="an-bar" role="img" aria-label={BANDS.map(b => `${b.label} ${pct(counts[b.key], counts.predictions).toFixed(1)}%`).join(', ')}>
          {BANDS.map(b => (
            <span key={b.key} className={`an-bar-${b.key}`} style={{ width: `${pct(counts[b.key], counts.predictions)}%` }} />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function ProjectionAccuracy({ leagues, activeLeague }: ProjectionAccuracyProps) {
  const rows = useMemo(
    () => leagues.map(league => ({ league, counts: leagueBandCounts(league) })),
    [leagues]
  );
  const total = rows.reduce<ErrorBandCounts>(
    (acc, r) => ({
      predictions: acc.predictions + r.counts.predictions,
      good: acc.good + r.counts.good,
      fair: acc.fair + r.counts.fair,
      poor: acc.poor + r.counts.poor,
    }),
    { predictions: 0, good: 0, fair: 0, poor: 0 }
  );

  return (
    <div className="league-table-container">
      <h3>Goal Projection Accuracy</h3>
      <p className="gp-note">
        Share of this season's per-team goal projections in each error band, with every match projected
        using only results from before it was played. Green is within {ERROR_BAND_THRESHOLDS.good} goals,
        red is {ERROR_BAND_THRESHOLDS.poor} goals or more off, white is in between.
      </p>
      <div className="league-table-wrapper">
        <table className="league-table an-table">
          <thead>
            <tr>
              <th className="an-col-league">League</th>
              <th className="an-col-num hide-mobile">Predictions</th>
              {BANDS.map(b => <th key={b.key} className="an-col-num">{b.label}</th>)}
              <th className="an-col-bar hide-mobile">Split</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ league, counts }) => (
              <BandRow
                key={league.key}
                label={league.label}
                counts={counts}
                className={league.key === activeLeague ? 'an-active' : undefined}
              />
            ))}
            <BandRow label="All leagues" counts={total} className="an-total" />
          </tbody>
        </table>
      </div>
      <p className="gp-note gp-footnote">Each played match counts as two predictions, one per side.</p>
    </div>
  );
}
