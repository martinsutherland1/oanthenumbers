import { useState, useMemo } from 'react';
import { TeamSelector } from './components/TeamSelector';
import { XgChart } from './components/XgChart';
import { XgLineChart } from './components/XgLineChart';
import { StatsTable } from './components/StatsTable';
import { H2HTable } from './components/H2HTable';
import { ChartToggle } from './components/ChartToggle';
import { MetricToggle } from './components/MetricToggle';
import type { ChartType } from './components/ChartToggle';
import type { MetricType } from './components/MetricToggle';
import {
  extractTeams,
  getAllTeamAverages,
  getAllTeamFullStats,
  calculateLeagueAverage,
  getLineChartData,
  getH2HData,
  flattenFixtures
} from './utils/dataProcessing';
import { TOP_6, BOTTOM_6 } from './utils/teamColors';
import fixturesData from './data/fixtures.json';
import type { FixturesData } from './types';
import './App.css';

type ViewMode = 'overview' | 'h2h';

const fixtures = flattenFixtures(fixturesData as FixturesData);

function App() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metricType, setMetricType] = useState<MetricType>('xg');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const teams = useMemo(() => extractTeams(fixtures), []);
  const teamAverages = useMemo(() => getAllTeamAverages(fixtures, 10, metricType), [metricType]);
  const leagueAverage = useMemo(() => calculateLeagueAverage(fixtures, 10, metricType), [metricType]);
  const teamFullStats = useMemo(() => getAllTeamFullStats(fixtures, 10), []);
  const lineChartData = useMemo(
    () => getLineChartData(fixtures, selectedTeams, 10, metricType),
    [selectedTeams, metricType]
  );

  const handleTeamToggle = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const handleSelectAll = () => {
    setSelectedTeams(teams);
  };

  const handleClearAll = () => {
    setSelectedTeams([]);
  };

  const handleSelectTop6 = () => {
    setSelectedTeams(TOP_6.filter(t => teams.includes(t)));
  };

  const handleSelectBottom6 = () => {
    setSelectedTeams(BOTTOM_6.filter(t => teams.includes(t)));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="title">@oanthenumbers</h1>
            <span className="subtitle">SPFL Premiership Analysis</span>
          </div>
          <div className="header-controls">
            <MetricToggle metricType={metricType} onToggle={setMetricType} />
            <ChartToggle chartType={chartType} onToggle={setChartType} />
          </div>
        </div>
      </header>

      <main className="app-main">
        <TeamSelector
          teams={teams}
          selectedTeams={selectedTeams}
          onTeamToggle={handleTeamToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          onSelectTop6={handleSelectTop6}
          onSelectBottom6={handleSelectBottom6}
        />

        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button
            className={`view-tab ${viewMode === 'h2h' ? 'active' : ''}`}
            onClick={() => setViewMode('h2h')}
          >
            H2H
          </button>
        </div>

        {viewMode === 'overview' ? (
          <>
            {chartType === 'bar' ? (
              <XgChart
                data={teamAverages}
                selectedTeams={selectedTeams}
                leagueAverage={leagueAverage}
                metricType={metricType}
              />
            ) : (
              <XgLineChart
                data={lineChartData}
                selectedTeams={selectedTeams}
                leagueAverage={leagueAverage}
                metricType={metricType}
              />
            )}

            <StatsTable data={teamFullStats} />
          </>
        ) : (
          <>
            {selectedTeams.length === 0 ? (
              <div className="h2h-empty">Select a team above to view their head-to-head record.</div>
            ) : (
              selectedTeams.map(team => (
                <H2HTable
                  key={team}
                  team={team}
                  data={getH2HData(fixtures, team)}
                />
              ))
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Rolling 10-game average {metricType === 'xg' ? 'expected goals (xG) difference' : metricType === 'goals' ? 'goal difference' : 'points per game'}</p>
      </footer>
    </div>
  );
}

export default App;
