// Back-tests the prior-weighted projection against completed seasons to tune k and r.
//
//   npm run backtest
//
// For every completed season that has a previous season to build a prior from, the projection
// is re-run after each matchweek using only fixtures played by then (and priors built only
// from earlier seasons), and compared with each team's actual final points.
import {
  createProjectionContext,
  flattenFixtures,
  getLeagueTable,
  getProjectedStandings,
  parseDate,
  type ProjectionConfig,
} from '../src/utils/dataProcessing';
import { PROJECTION_CONFIG } from '../src/utils/projectionConfig';
import type { Fixture, FixturesData } from '../src/types';
import spfl2425 from '../src/data/spfl_results_2024_25.json';
import spfl2526 from '../src/data/spfl_results_2025_26.json';
import epl2526 from '../src/data/epl_results_2025_26.json';

const K_VALUES = [4, 6, 8, 10, 12, 15, 20];
const R_VALUES = [0.5, 0.6, 0.67, 0.75, 1.0];
const STAGES = [
  { label: '1-5', min: 1, max: 5 },
  { label: '6-15', min: 6, max: 15 },
  { label: '16+', min: 16, max: Infinity },
];

interface Season { label: string; fixtures: Fixture[] }

const load = (data: unknown) => flattenFixtures(data as FixturesData);

// Completed seasons only, oldest first
const LEAGUES: Record<'spfl' | 'epl', Season[]> = {
  spfl: [
    { label: '2024/25', fixtures: load(spfl2425) },
    { label: '2025/26', fixtures: load(spfl2526) },
  ],
  epl: [
    { label: '2025/26', fixtures: load(epl2526) },
  ],
};

// Matchweek n is complete on the date the last team plays its nth game
function getMatchweekCutoffs(fixtures: Fixture[]): { matchweek: number; cutoff: number }[] {
  const datesByTeam = new Map<string, number[]>();
  fixtures.forEach(f => {
    const t = parseDate(f.date).getTime();
    [f.home_team, f.away_team].forEach(team => {
      if (!datesByTeam.has(team)) datesByTeam.set(team, []);
      datesByTeam.get(team)!.push(t);
    });
  });
  datesByTeam.forEach(dates => dates.sort((a, b) => a - b));

  const minGames = Math.min(...[...datesByTeam.values()].map(d => d.length));
  const cutoffs = [];
  // Stop before the final matchweek: with nothing left to play every method is exact
  for (let n = 1; n < minGames; n++) {
    cutoffs.push({ matchweek: n, cutoff: Math.max(...[...datesByTeam.values()].map(d => d[n - 1])) });
  }
  return cutoffs;
}

class ErrorStats {
  private errors: { stage: string; error: number }[] = [];

  add(stage: string, error: number) { this.errors.push({ stage, error }); }

  summary(stage?: string) {
    const errs = this.errors.filter(e => !stage || e.stage === stage).map(e => e.error);
    if (errs.length === 0) return { mae: NaN, rmse: NaN, n: 0 };
    return {
      mae: errs.reduce((s, e) => s + Math.abs(e), 0) / errs.length,
      rmse: Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length),
      n: errs.length,
    };
  }
}

const stageOf = (matchweek: number) => STAGES.find(s => matchweek >= s.min && matchweek <= s.max)!.label;

function runLeague(league: 'spfl' | 'epl') {
  const seasons = LEAGUES[league];
  const baseConfig = PROJECTION_CONFIG[league];
  console.log(`\n=== ${league.toUpperCase()} ===`);

  const baseline = new ErrorStats();
  const grid = new Map<string, ErrorStats>();
  const scaling: number[] = [];
  let testedSeasons = 0;

  seasons.forEach((season, i) => {
    if (i === 0) {
      console.log(`Skipping ${season.label}: no previous season to build a prior from.`);
      return;
    }
    testedSeasons++;
    const lastSeason = seasons[i - 1].fixtures;
    const history = seasons.slice(0, i).map(s => s.fixtures);
    const finalTable = getLeagueTable(season.fixtures);
    const actual = new Map(finalTable.map(r => [r.team, r.points]));
    const seasonGames = Math.max(...finalTable.map(r => r.played));
    const cutoffs = getMatchweekCutoffs(season.fixtures);
    console.log(`Testing ${season.label}: ${cutoffs.length} matchweeks, prior from ${seasons[i - 1].label}.`);

    const snapshots = cutoffs.map(({ matchweek, cutoff }) => ({
      matchweek,
      fixtures: season.fixtures.filter(f => parseDate(f.date).getTime() <= cutoff),
    }));

    snapshots.forEach(({ matchweek, fixtures }) => {
      getProjectedStandings(fixtures, seasonGames).forEach(row => {
        baseline.add(stageOf(matchweek), row.projectedPoints - actual.get(row.team)!);
      });
    });

    R_VALUES.forEach(r => {
      K_VALUES.forEach(k => {
        const config: ProjectionConfig = { ...baseConfig, method: 'prior_weighted', k, priorRegressionR: r };
        const context = createProjectionContext(lastSeason, history, config);
        const key = `${k}|${r}`;
        if (!grid.has(key)) grid.set(key, new ErrorStats());
        snapshots.forEach(({ matchweek, fixtures }) => {
          getProjectedStandings(fixtures, seasonGames, context).forEach(row => {
            grid.get(key)!.add(stageOf(matchweek), row.projectedPoints - actual.get(row.team)!);
          });
        });
      });
    });

    // Scaling applied by normalisation under the configured k and r
    const context = createProjectionContext(lastSeason, history, { ...baseConfig, method: 'prior_weighted' });
    snapshots.forEach(({ fixtures }) => {
      const earned = getLeagueTable(fixtures).reduce((s, row) => s + row.points, 0);
      const rows = getProjectedStandings(fixtures, seasonGames, context);
      const unscaled = rows.reduce((s, row) => s + row.points + row.blendedPpg * row.remainingGames, 0);
      const scaled = rows.reduce((s, row) => s + row.projectedPoints, 0);
      if (unscaled - earned > 0) scaling.push((scaled - earned) / (unscaled - earned));
    });
  });

  if (testedSeasons === 0) {
    console.log('No back-testable seasons. Add an earlier completed season to src/data to tune this league.');
    return;
  }

  const fmt = (n: number) => (Number.isNaN(n) ? '   -  ' : n.toFixed(2).padStart(6));
  const header = `${'method'.padEnd(18)}${'MAE'.padStart(7)}${'RMSE'.padStart(7)}` +
    STAGES.map(s => `${('MAE ' + s.label).padStart(10)}`).join('') +
    STAGES.map(s => `${('RMSE ' + s.label).padStart(11)}`).join('');
  const line = (label: string, stats: ErrorStats) => {
    const all = stats.summary();
    return `${label.padEnd(18)} ${fmt(all.mae)} ${fmt(all.rmse)}` +
      STAGES.map(s => `    ${fmt(stats.summary(s.label).mae)}`).join('') +
      STAGES.map(s => `     ${fmt(stats.summary(s.label).rmse)}`).join('');
  };

  console.log('\n' + header);
  console.log(line('current (old)', baseline));
  const ranked = [...grid.entries()].sort((a, b) => a[1].summary().mae - b[1].summary().mae);
  ranked.forEach(([key, stats]) => {
    const [k, r] = key.split('|');
    console.log(line(`k=${k} r=${r}`, stats));
  });

  const [bestKey, bestStats] = ranked[0];
  const [bestK, bestR] = bestKey.split('|');
  const configured = grid.get(`${baseConfig.k}|${baseConfig.priorRegressionR}`)!.summary();
  const avgScaling = scaling.reduce((a, b) => a + b, 0) / scaling.length;
  console.log(`\nBest for ${league.toUpperCase()}: k=${bestK}, r=${bestR} ` +
    `(MAE ${bestStats.summary().mae.toFixed(2)}, RMSE ${bestStats.summary().rmse.toFixed(2)}; ` +
    `old method MAE ${baseline.summary().mae.toFixed(2)}; ` +
    `configured k=${baseConfig.k} r=${baseConfig.priorRegressionR} MAE ${configured.mae.toFixed(2)})`);
  console.log(`Normalisation at configured k/r: mean scaling factor on remaining points ${avgScaling.toFixed(3)} ` +
    `(min ${Math.min(...scaling).toFixed(3)}, max ${Math.max(...scaling).toFixed(3)})`);
}

(['spfl', 'epl'] as const).forEach(runLeague);
