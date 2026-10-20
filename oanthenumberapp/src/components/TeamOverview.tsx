import { useMemo, useState } from 'react';
import type { Fixture } from '../types';
import {
  calculateLeagueAverage,
  getTeamRollingAverageOverTime,
  getProjectedPositionOverTime,
  getProjectedStandings,
  getPerformanceScore,
  getTeamSeasonStats,
  getTeamRecentSeasonStats,
  ordinalSuffix,
  type LeagueTableRow,
  type ProjectionContext,
  type XgType
} from '../utils/dataProcessing';
import { BRAND_COLOR, getTeamName } from '../utils/teamColors';
import { TeamHeader } from './TeamHeader';
import { MetricTrendCard } from './MetricTrendCard';
import { PerformanceIndicator, type TrendDirection, type PerformanceBreakdownTable } from './PerformanceIndicator';
import { XgGameLogTable } from './XgGameLogTable';
import { XgTypeSelect } from './XgTypeSelect';
import { TeamRadarChart, type RadarSeries } from './TeamRadarChart';
import { ViewToggle } from './ViewToggle';
import './TeamOverview.css';

interface TeamOverviewProps {
  team: string;
  fixtures: Fixture[];
  lastSeasonFixtures: Fixture[];
  leagueTable: LeagueTableRow[];
  projection?: ProjectionContext;
  seasonGames?: number;
}

const ROLLING_WINDOW = 10;
// Larger than any league season, so the window never drops games (season-to-date average)
const SEASON_WINDOW = 100;

function signTone(n: number | null): 'positive' | 'negative' | 'neutral' {
  if (n === null || n === 0) return 'neutral';
  return n > 0 ? 'positive' : 'negative';
}

const fmtSigned = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}`;

function fmtDiff(delta: number | null, decimals = 0): string {
  if (delta === null) return 'N/A';
  const rounded = Number(delta.toFixed(decimals));
  if (rounded === 0) return '=';
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(decimals)}`;
}

// Direction of travel: compares the current rolling xG difference against its value a
// few matches back, so a team can be "on average" overall but still trending up or down.
function getTrendDirection(series: { rollingAverage: number }[]): TrendDirection {
  if (series.length < 2) return 'steady';
  const lookback = Math.min(3, series.length - 1);
  const current = series[series.length - 1].rollingAverage;
  const prior = series[series.length - 1 - lookback].rollingAverage;
  const delta = current - prior;
  if (delta > 0.15) return 'up';
  if (delta < -0.15) return 'down';
  return 'steady';
}

export function TeamOverview({ team, fixtures, lastSeasonFixtures, leagueTable, projection, seasonGames }: TeamOverviewProps) {
  const leagueRow = leagueTable.find(r => r.team === team);
  const color = BRAND_COLOR;

  const [averageMode, setAverageMode] = useState<'rolling' | 'season'>('rolling');
  const avgWindow = averageMode === 'rolling' ? ROLLING_WINDOW : SEASON_WINDOW;

  // The performance trend arrow always uses the 10-game form, regardless of the chart toggle.
  const xgSeries = useMemo(() => getTeamRollingAverageOverTime(fixtures, team, ROLLING_WINDOW, 'xg'), [fixtures, team]);
  const [xgType, setXgType] = useState<XgType>('npxg');
  const xgChartSeries = useMemo(
    () => getTeamRollingAverageOverTime(fixtures, team, avgWindow, 'xg', xgType),
    [fixtures, team, xgType, avgWindow]
  );
  const goalsSeries = useMemo(() => getTeamRollingAverageOverTime(fixtures, team, avgWindow, 'goals'), [fixtures, team, avgWindow]);
  const pointsSeries = useMemo(() => getTeamRollingAverageOverTime(fixtures, team, avgWindow, 'points'), [fixtures, team, avgWindow]);
  const positionSeries = useMemo(() => getProjectedPositionOverTime(fixtures, team, seasonGames, projection), [fixtures, team, seasonGames, projection]);
  const leaguePpg = useMemo(() => calculateLeagueAverage(fixtures, avgWindow, 'points'), [fixtures, avgWindow]);

  // Every team's "current" projection must come from the same full-dataset snapshot,
  // otherwise teams whose last match fell on an earlier date than a rival's get compared
  // against stale standings and can end up sharing a rank.
  const currentStandings = useMemo(() => getProjectedStandings(fixtures, seasonGames, projection), [fixtures, seasonGames, projection]);
  const currentProjection = currentStandings.find(s => s.team === team) ?? null;

  const currentXg = xgChartSeries.length ? xgChartSeries[xgChartSeries.length - 1].rollingAverage : 0;
  const currentGoals = goalsSeries.length ? goalsSeries[goalsSeries.length - 1].rollingAverage : 0;
  const currentPpg = pointsSeries.length ? pointsSeries[pointsSeries.length - 1].rollingAverage : 0;
  const ppgVsAvg = currentPpg - leaguePpg;
  const trend = getTrendDirection(xgSeries);

  const [logView, setLogView] = useState<'log' | 'radar'>('log');
  const seasonStats = useMemo(() => getTeamSeasonStats(fixtures), [fixtures]);
  const recentStats = useMemo(() => getTeamRecentSeasonStats(fixtures, 6), [fixtures]);
  const radarSeries = useMemo<RadarSeries[]>(() => {
    const season = seasonStats.find(s => s.team === team);
    const recent = recentStats.find(s => s.team === team);
    const out: RadarSeries[] = [];
    if (season) out.push({ id: 'season', label: 'Season', color, stats: season, pool: seasonStats, fillOpacity: 0.3 });
    if (recent) out.push({ id: 'last6', label: 'Last 6', color, stats: recent, pool: recentStats, dashed: true, fillOpacity: 0.08 });
    return out;
  }, [seasonStats, recentStats, team, color]);

  const performanceScore = useMemo(
    () => getPerformanceScore(fixtures, lastSeasonFixtures, team, seasonGames, projection),
    [fixtures, lastSeasonFixtures, team, seasonGames, projection]
  );


  const breakdownTables: PerformanceBreakdownTable[] = [
    {
      title: 'League Position',
      currentLabel: 'Current',
      comparisonLabel: 'Projected',
      current: performanceScore.currentPosition !== null ? ordinalSuffix(performanceScore.currentPosition) : 'N/A',
      comparison: performanceScore.projectedPosition !== null ? ordinalSuffix(performanceScore.projectedPosition) : 'N/A',
      diff: fmtDiff(performanceScore.positionDelta),
      tone: signTone(performanceScore.positionDelta),
    },
    {
      title: 'xPoints',
      currentLabel: 'Actual',
      comparisonLabel: 'xPoints',
      current: performanceScore.actualPoints !== null ? `${performanceScore.actualPoints}` : 'N/A',
      comparison: performanceScore.cumulativeXPoints !== null ? performanceScore.cumulativeXPoints.toFixed(1) : 'N/A',
      diff: fmtDiff(performanceScore.pointsDelta, 1),
      tone: signTone(performanceScore.pointsDelta),
    },
    {
      title: 'Points v Last Season',
      note: performanceScore.yoyComparisonTeams.length > 1
        ? `Avg: ${performanceScore.yoyComparisonTeams.map(t => getTeamName(t)).join(', ')}`
        : getTeamName(performanceScore.yoyComparisonTeams[0]),
      currentLabel: 'This Season',
      comparisonLabel: 'Last Season',
      current: performanceScore.actualPoints !== null ? `${performanceScore.actualPoints}` : 'N/A',
      comparison: performanceScore.yoyComparisonPoints !== null ? `${performanceScore.yoyComparisonPoints}` : 'N/A',
      diff: fmtDiff(performanceScore.yoyDelta),
      tone: signTone(performanceScore.yoyDelta),
    },
  ];

  return (
    <div className="team-overview">
      <TeamHeader team={team} leagueRow={leagueRow} />

      <PerformanceIndicator
        value={performanceScore.blendedScore}
        min={-1}
        max={1}
        trend={trend}
        tables={breakdownTables}
      />

      <div className="log-view-toggle">
        <ViewToggle
          ariaLabel="Chart averaging window"
          options={[{ key: 'rolling', label: 'Rolling 10' }, { key: 'season', label: 'Season' }]}
          value={averageMode}
          onChange={setAverageMode}
        />
      </div>

      <div className="metric-trend-grid">
        <MetricTrendCard
          title={
            <>
              <XgTypeSelect value={xgType} onChange={setXgType} />{' '}
              Difference v League Average
            </>
          }
          data={xgChartSeries.map(p => ({ matchNumber: p.matchNumber, value: p.rollingAverage }))}
          color={color}
          badgeText={fmtSigned(currentXg)}
          badgeTone={currentXg >= 0 ? 'positive' : 'negative'}
          baseline={0}
        />
        <MetricTrendCard
          title="Goal Difference v League Average"
          data={goalsSeries.map(p => ({ matchNumber: p.matchNumber, value: p.rollingAverage }))}
          color={color}
          badgeText={fmtSigned(currentGoals)}
          badgeTone={currentGoals >= 0 ? 'positive' : 'negative'}
          baseline={0}
        />
        <MetricTrendCard
          title="Points Per Game v League Average"
          data={pointsSeries.map(p => ({ matchNumber: p.matchNumber, value: p.rollingAverage }))}
          color={color}
          badgeText={`${fmtSigned(ppgVsAvg)} vs avg`}
          badgeTone={ppgVsAvg >= 0 ? 'positive' : 'negative'}
          baseline={leaguePpg}
        />
        <MetricTrendCard
          title="Predicted Finishing Position"
          data={positionSeries.map(p => ({ matchNumber: p.matchNumber, value: p.projectedPoints, secondary: p.projectedPosition }))}
          primaryLabel="Points"
          secondaryLabel="Position"
          color={color}
          badgeText={currentProjection ? `Proj. ${ordinalSuffix(currentProjection.projectedPosition)}` : 'No data yet'}
          badgeTone="neutral"
        />
      </div>

      <div className="log-view-toggle">
        <ViewToggle
          ariaLabel="Team stats view"
          options={[{ key: 'log', label: 'Log' }, { key: 'radar', label: 'Radar' }]}
          value={logView}
          onChange={setLogView}
        />
      </div>
      {logView === 'log'
        ? <XgGameLogTable fixtures={fixtures} team={team} />
        : <TeamRadarChart series={radarSeries} title={`${getTeamName(team)} — Goals & xG`} />}
    </div>
  );
}
