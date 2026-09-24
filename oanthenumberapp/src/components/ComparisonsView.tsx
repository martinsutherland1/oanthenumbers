import { useMemo, useState } from 'react';
import type { Fixture } from '../types';
import { calculateLeagueAverage, getLineChartData, type MetricType, type XgType } from '../utils/dataProcessing';
import { TOP_6, BOTTOM_6 } from '../utils/teamColors';
import { TeamSelector } from './TeamSelector';
import { MetricToggle } from './MetricToggle';
import { XgLineChart } from './XgLineChart';
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

  const handleTeamToggle = (team: string) => {
    setSelectedTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);
  };
  const handleSelectAll = () => setSelectedTeams(teams);
  const handleClearAll = () => setSelectedTeams([]);
  const handleSelectTop6 = () => setSelectedTeams(TOP_6.filter(t => teams.includes(t)));
  const handleSelectBottom6 = () => setSelectedTeams(BOTTOM_6.filter(t => teams.includes(t)));

  return (
    <div className="comparisons-view">
      <TeamSelector
        teams={teams}
        selectedTeams={selectedTeams}
        onTeamToggle={handleTeamToggle}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        onSelectTop6={handleSelectTop6}
        onSelectBottom6={handleSelectBottom6}
      />

      <MetricToggle metricType={metricType} onToggle={setMetricType} />

      {selectedTeams.length < 2 ? (
        <div className="comparisons-empty">
          <p>Select at least two teams above to compare their trends.</p>
        </div>
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
