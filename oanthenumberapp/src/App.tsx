import { useMemo, useState } from 'react';
import { HomePage, type LeagueFlag } from './components/HomePage';
import { LeagueTable } from './components/LeagueTable';
import { ProjectionTable } from './components/ProjectionTable';
import { TeamOverview } from './components/TeamOverview';
import { ComparisonsView } from './components/ComparisonsView';
import {
  extractTeams,
  getLeagueTable,
  getProjectedStandings,
  createProjectionContext,
  parseDate,
  flattenFixtures,
  type ProjectionConfig
} from './utils/dataProcessing';
import { PROJECTION_CONFIG } from './utils/projectionConfig';
import { getTeamName } from './utils/teamColors';
import spflFixturesData from './data/spfl_results_2026_27.json';
import spflLastSeasonFixturesData from './data/spfl_results_2025_26.json';
import spflTwoSeasonsAgoFixturesData from './data/spfl_results_2024_25.json';
import eplFixturesData from './data/epl_results_2026_27.json';
import eplLastSeasonFixturesData from './data/epl_results_2025_26.json';
import dataUpdate from './data/data_update.json';
import type { Fixture, FixturesData } from './types';
import logo from './assets/logo-header.png';
import './App.css';

type Page = 'home' | 'league';
type Section = 'tables' | 'stats';
type TablesTab = 'current' | 'projection';
type StatsTab = 'team' | 'comparisons';
type League = 'spfl' | 'epl';

const spflFixtures = flattenFixtures(spflFixturesData as FixturesData);
// Some older fixtures in prior-season files are missing extended stats (xG breakdowns, shots,
// etc.) — goals are always present, which is all the year-on-year comparison needs.
const spflLastSeasonFixtures = flattenFixtures(spflLastSeasonFixturesData as unknown as FixturesData);
const spflTwoSeasonsAgoFixtures = flattenFixtures(spflTwoSeasonsAgoFixturesData as unknown as FixturesData);
const eplFixtures = flattenFixtures(eplFixturesData as FixturesData);
const eplLastSeasonFixtures = flattenFixtures(eplLastSeasonFixturesData as FixturesData);

interface LeagueConfig {
  label: string;
  flag: LeagueFlag;
  fixtures: Fixture[];
  lastSeasonFixtures: Fixture[];
  // Completed seasons, oldest first, used to compute the projection's league-average and
  // promoted-team priors
  historicalSeasons: Fixture[][];
  projection: ProjectionConfig;
  tableDividers: number[];
  projectionDividers: number[];
}

const LEAGUE_CONFIG: Record<League, LeagueConfig> = {
  spfl: {
    label: 'SPFL Premiership',
    flag: 'scotland',
    fixtures: spflFixtures,
    lastSeasonFixtures: spflLastSeasonFixtures,
    historicalSeasons: [spflTwoSeasonsAgoFixtures, spflLastSeasonFixtures],
    projection: PROJECTION_CONFIG.spfl,
    tableDividers: [1, 6, 10, 11],
    projectionDividers: [1, 6, 10, 11],
  },
  epl: {
    label: 'Premier League',
    flag: 'england',
    fixtures: eplFixtures,
    lastSeasonFixtures: eplLastSeasonFixtures,
    historicalSeasons: [eplLastSeasonFixtures],
    projection: PROJECTION_CONFIG.epl,
    tableDividers: [4, 10, 17],
    projectionDividers: [4, 10, 17],
  },
};

const LEAGUE_ORDER: League[] = ['spfl', 'epl'];

const lastUpdated = new Date(dataUpdate.updateTime).toLocaleString('en-GB', {
  timeZone: 'Europe/London',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function getSeasonLabel(fixtures: Fixture[]): string {
  if (fixtures.length === 0) return '';
  const firstDate = [...fixtures]
    .map(f => parseDate(f.date))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const year = firstDate.getFullYear();
  const month = firstDate.getMonth();
  const startYear = month >= 6 ? year : year - 1;
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`;
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [league, setLeague] = useState<League>('spfl');
  const [section, setSection] = useState<Section>('tables');
  const [tablesTab, setTablesTab] = useState<TablesTab>('current');
  const [statsTab, setStatsTab] = useState<StatsTab>('team');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const config = LEAGUE_CONFIG[league];
  const fixtures = config.fixtures;
  const lastSeasonFixtures = config.lastSeasonFixtures;

  const seasonLabel = useMemo(() => getSeasonLabel(fixtures), [fixtures]);
  const teams = useMemo(() => extractTeams(fixtures), [fixtures]);
  const leagueTableData = useMemo(() => getLeagueTable(fixtures), [fixtures]);
  const projectionContext = useMemo(
    () => createProjectionContext(config.lastSeasonFixtures, config.historicalSeasons, config.projection),
    [config]
  );
  const projectedStandings = useMemo(
    () => getProjectedStandings(fixtures, undefined, projectionContext),
    [fixtures, projectionContext]
  );
  const activeTeam = selectedTeam || teams[0] || '';

  const homeLeagueTiles = useMemo(() => LEAGUE_ORDER.map(key => ({
    key,
    label: LEAGUE_CONFIG[key].label,
    seasonLabel: getSeasonLabel(LEAGUE_CONFIG[key].fixtures),
    flag: LEAGUE_CONFIG[key].flag,
  })), []);

  const handleSelectLeague = (next: string) => {
    setLeague(next as League);
    setSelectedTeam('');
    setSection('tables');
    setTablesTab('current');
    setStatsTab('team');
    setPage('league');
  };

  const handleGoHome = () => {
    setPage('home');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1
              className={`title ${page === 'league' ? 'title-clickable' : ''}`}
              onClick={page === 'league' ? handleGoHome : undefined}
            >
              <button
                type="button"
                className="title-logo-btn"
                onClick={e => { e.stopPropagation(); handleGoHome(); }}
                aria-label="Go to home page"
              >
                <img className="title-logo" src={logo} alt="Oan the Numbers" />
              </button>
              Football Analysis
            </h1>
            {page === 'league' && <span className="subtitle">{config.label} Analysis</span>}
          </div>
          {page === 'league' && (
            <div className="header-controls">
              <button className="home-back-btn" onClick={handleGoHome}>
                ← Leagues
              </button>
              <div className="header-badges">
                {seasonLabel && <span className="header-badge">{seasonLabel} Season</span>}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {page === 'home' && (
          <HomePage leagues={homeLeagueTiles} onSelectLeague={handleSelectLeague} />
        )}

        {page === 'league' && (
          <>
            <div className="view-toolbar">
              <div className="view-tabs">
                <button
                  className={`view-tab ${section === 'tables' ? 'active' : ''}`}
                  onClick={() => setSection('tables')}
                >
                  Tables
                </button>
                <button
                  className={`view-tab ${section === 'stats' ? 'active' : ''}`}
                  onClick={() => setSection('stats')}
                >
                  Stats
                </button>
              </div>

              {section === 'tables' && (
                <div className="view-tabs secondary-tabs">
                  <button
                    className={`view-tab ${tablesTab === 'current' ? 'active' : ''}`}
                    onClick={() => setTablesTab('current')}
                  >
                    Current
                  </button>
                  <button
                    className={`view-tab ${tablesTab === 'projection' ? 'active' : ''}`}
                    onClick={() => setTablesTab('projection')}
                  >
                    Projection
                  </button>
                </div>
              )}

              {section === 'stats' && (
                <div className="view-tabs secondary-tabs">
                  <button
                    className={`view-tab ${statsTab === 'team' ? 'active' : ''}`}
                    onClick={() => setStatsTab('team')}
                  >
                    Team
                  </button>
                  <button
                    className={`view-tab ${statsTab === 'comparisons' ? 'active' : ''}`}
                    onClick={() => setStatsTab('comparisons')}
                  >
                    Comparisons
                  </button>
                </div>
              )}

              {section === 'stats' && statsTab === 'team' && (
                <div className="team-select-group">
                  <label htmlFor="team-select">Team</label>
                  <select
                    id="team-select"
                    className="team-select"
                    value={activeTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                  >
                    {teams.map(team => (
                      <option key={team} value={team}>{getTeamName(team)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {section === 'tables' && tablesTab === 'current' && (
              <LeagueTable data={leagueTableData} dividerPositions={config.tableDividers} />
            )}
            {section === 'tables' && tablesTab === 'projection' && (
              <ProjectionTable data={projectedStandings} dividerPositions={config.projectionDividers} />
            )}
            {section === 'stats' && statsTab === 'team' && activeTeam && (
              <TeamOverview
                team={activeTeam}
                fixtures={fixtures}
                lastSeasonFixtures={lastSeasonFixtures}
                leagueTable={leagueTableData}
                projection={projectionContext}
              />
            )}
            {section === 'stats' && statsTab === 'comparisons' && (
              <ComparisonsView fixtures={fixtures} teams={teams} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p className="footer-source">Data sourced from <a href="https://www.fotmob.com" target="_blank" rel="noreferrer">fotmob.com</a></p>
        <p className="footer-updated">Last updated {lastUpdated}</p>
        <p className="footer-credit">Created by <a href="https://x.com/oanthenumbers" target="_blank" rel="noreferrer">@oanthenumbers</a></p>
      </footer>
    </div>
  );
}

export default App;
