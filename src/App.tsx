import { useState, useMemo } from 'react';
import { useTheme } from './hooks/useTheme';
import { ThemeToggle } from './components/ThemeToggle';
import { TeamSelector } from './components/TeamSelector';
import { XgChart } from './components/XgChart';
import { XgLineChart } from './components/XgLineChart';
import { StatsTable } from './components/StatsTable';
import { ChartToggle } from './components/ChartToggle';
import type { ChartType } from './components/ChartToggle';
import {
  extractTeams,
  getAllTeamAverages,
  calculateLeagueAverage,
  getLineChartData
} from './utils/dataProcessing';
import fixturesData from './data/fixtures.json';
import type { Fixture } from './types';
import './App.css';

const fixtures = fixturesData as Fixture[];

function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('line');

  const teams = useMemo(() => extractTeams(fixtures), []);
  const teamAverages = useMemo(() => getAllTeamAverages(fixtures), []);
  const leagueAverage = useMemo(() => calculateLeagueAverage(fixtures), []);
  const lineChartData = useMemo(
    () => getLineChartData(fixtures, selectedTeams),
    [selectedTeams]
  );

  const handleTeamToggle = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const handleClearAll = () => {
    setSelectedTeams([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="title">@oanthenumbers</h1>
            <span className="subtitle">SPFL Premiership xG Analysis</span>
          </div>
          <div className="header-controls">
            <ChartToggle chartType={chartType} onToggle={setChartType} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="app-main">
        <TeamSelector
          teams={teams}
          selectedTeams={selectedTeams}
          onTeamToggle={handleTeamToggle}
          onClearAll={handleClearAll}
        />

        {chartType === 'bar' ? (
          <XgChart
            data={teamAverages}
            selectedTeams={selectedTeams}
            leagueAverage={leagueAverage}
          />
        ) : (
          <XgLineChart
            data={lineChartData}
            selectedTeams={selectedTeams}
            leagueAverage={leagueAverage}
          />
        )}

        <StatsTable
          data={teamAverages}
          selectedTeams={selectedTeams}
          leagueAverage={leagueAverage}
        />
      </main>

      <footer className="app-footer">
        <p>Rolling 10-game average expected goals (xG)</p>
      </footer>
    </div>
  );
}

export default App;
