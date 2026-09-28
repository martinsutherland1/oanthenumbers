import { useMemo, useState } from 'react';
import type { Fixture } from '../types';
import { calculateLeagueAverage, getLineChartData, getTeamSeasonStats, getTeamRecentSeasonStats, getTeamGoalsVsXg, type MetricType, type XgType } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import { TeamSelector } from './TeamSelector';
import { MetricToggle } from './MetricToggle';
import { XgLineChart } from './XgLineChart';
import { TeamRadarChart, type RadarSeries } from './TeamRadarChart';
import { QuadrantChart } from './QuadrantChart';
import { ViewToggle } from './ViewToggle';
import './ComparisonsView.css';

interface ComparisonsViewProps {
  fixtures: Fixture[];
  teams: string[];
}

const ROLLING_GAMES = 10;

export function ComparisonsView({ fixtures, teams }: ComparisonsViewProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [metricType, setMetricType] = useState<MetricType>('xg');
  const [xgType, setXgType] = useState<XgType>('npxg');

  const leagueAverage = useMemo(
    () => calculateLeagueAverage(fixtures, ROLLING_GAMES, metricType, xgType),
    [fixtures, metricType, xgType]
  );

  const chartData = useMemo(
    () => selectedTeams.length >= 2 ? getLineChartData(fixtures, selectedTeams, ROLLING_GAMES, metricType, xgType) : [],
    [fixtures, selectedTeams, metricType, xgType]
  );

  const [view, setView] = useState<'line' | 'radar' | 'quadrant'>('line');
  const seasonStats = useMemo(() => getTeamSeasonStats(fixtures), [fixtures]);
  const [period, setPeriod] = useState<'season' | 'last6'>('season');
  const recentStats = useMemo(() => getTeamRecentSeasonStats(fixtures, 6), [fixtures]);
  const pool = period === 'season' ? seasonStats : recentStats;
  const goalsVsXg = useMemo(() => getTeamGoalsVsXg(fixtures, xgType), [fixtures, xgType]);
  const radarSeries = useMemo<RadarSeries[]>(
    () => selectedTeams.flatMap(t => {
      const stats = pool.find(s => s.team === t);
      return stats ? [{ id: t, label: getTeamName(t), color: getTeamColor(t), stats, pool }] : [];
    }),
    [selectedTeams, pool]
  );

  const handleTeamToggle = (team: string) => {
    setSelectedTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);
  };
  const handleSelectAll = () => setSelectedTeams(teams);
  const handleClearAll = () => setSelectedTeams([]);

  return (
    <div className="comparisons-view">
      <TeamSelector
        teams={teams}
        selectedTeams={selectedTeams}
        onTeamToggle={handleTeamToggle}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      <div className="comparisons-controls">
        <ViewToggle
          ariaLabel="Comparison chart type"
          options={[{ key: 'line', label: 'Line' }, { key: 'radar', label: 'Radar' }, { key: 'quadrant', label: 'Quadrant' }]}
          value={view}
          onChange={setView}
        />
        {view === 'line' && <MetricToggle metricType={metricType} onToggle={setMetricType} />}
        {view === 'radar' && (
          <ViewToggle
            ariaLabel="Radar period"
            options={[{ key: 'season', label: 'Season' }, { key: 'last6', label: 'Last 6' }]}
            value={period}
            onChange={setPeriod}
          />
        )}
      </div>

      {view === 'quadrant' ? (
        <QuadrantChart
          data={goalsVsXg}
          selectedTeams={selectedTeams}
          xgType={xgType}
          onXgTypeChange={setXgType}
        />
      ) : selectedTeams.length < 2 ? (
        <div className="comparisons-empty">
          <p>Select at least two teams above to compare their trends.</p>
        </div>
      ) : view === 'radar' ? (
        <TeamRadarChart series={radarSeries} title={period === 'season' ? 'Season Goals & xG' : 'Last 6 Goals & xG'} />
      ) : (
        <XgLineChart
          data={chartData}
          selectedTeams={selectedTeams}
          leagueAverage={leagueAverage}
          metricType={metricType}
          xgType={xgType}
          onXgTypeChange={setXgType}
        />
      )}
    </div>
  );
}
