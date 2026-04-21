import { useState, useMemo } from 'react';
import { TeamSelector } from './components/TeamSelector';
import { XgChart } from './components/XgChart';
import { XgLineChart } from './components/XgLineChart';
import { StatsTable } from './components/StatsTable';
import { H2HTable } from './components/H2HTable';
import { LeagueTable } from './components/LeagueTable';
import { StatsView } from './components/StatsView';
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
  getLeagueTable,
  getUnbeatenRuns,
  getGamesWithoutWin,
  getTeamSeasonStats,
  flattenFixtures
} from './utils/dataProcessing';
import { TOP_6, BOTTOM_6 } from './utils/teamColors';
import fixturesData from './data/fixtures.json';
import type { FixturesData } from './types';
import './App.css';

type ViewMode = 'overview' | 'table' | 'h2h' | 'stats';

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
  const leagueTableData = useMemo(() => getLeagueTable(fixtures), []);
  const unbeatenRuns = useMemo(() => getUnbeatenRuns(fixtures), []);
  const gamesWithoutWin = useMemo(() => getGamesWithoutWin(fixtures), []);
  const seasonStats = useMemo(() => getTeamSeasonStats(fixtures), []);
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
        </div>
      </header>

      <main className="app-main">
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            Graph
          </button>
          <button
            className={`view-tab ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
          <button
            className={`view-tab ${viewMode === 'h2h' ? 'active' : ''}`}
            onClick={() => setViewMode('h2h')}
          >
            H2H
          </button>
          <button
            className={`view-tab ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
          >
            Stats
          </button>
        </div>

        {(viewMode === 'overview' || viewMode === 'h2h') && (
          <TeamSelector
            teams={teams}
            selectedTeams={selectedTeams}
            onTeamToggle={handleTeamToggle}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            onSelectTop6={handleSelectTop6}
            onSelectBottom6={handleSelectBottom6}
          />
        )}

        {viewMode === 'overview' && (
          <div className="graph-controls">
            <MetricToggle metricType={metricType} onToggle={setMetricType} />
            <ChartToggle chartType={chartType} onToggle={setChartType} />
          </div>
        )}

        {viewMode === 'overview' && (
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
        )}

        {viewMode === 'table' && (
          <LeagueTable data={leagueTableData} />
        )}

        {viewMode === 'h2h' && (
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

        {viewMode === 'stats' && (
          <StatsView stats={seasonStats} unbeatenRuns={unbeatenRuns} gamesWithoutWin={gamesWithoutWin} />
        )}
      </main>

      <footer className="app-footer">
        <p className="footer-source">Data sourced from <a href="https://www.fotmob.com" target="_blank" rel="noreferrer">fotmob.com</a></p>
        <p className="footer-source">xG figures are No-Penalty xG (npxG)</p>
        <p className="footer-credit">Created by <a href="https://x.com/oanthenumbers" target="_blank" rel="noreferrer">@oanthenumbers</a></p>
      </footer>
    </div>
  );
}

export default App;
