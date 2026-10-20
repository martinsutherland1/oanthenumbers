import { useEffect, useMemo, useState } from 'react';
import { HomePage, type LeagueFlag } from './components/HomePage';
import { LeagueTable } from './components/LeagueTable';
import { LeagueHighlights } from './components/LeagueHighlights';
import { ProjectionTable } from './components/ProjectionTable';
import { TeamOverview } from './components/TeamOverview';
import { ComparisonsView } from './components/ComparisonsView';
import { AllStatsView } from './components/AllStatsView';
import { FixturesView } from './components/FixturesView';
import { NextFixtureProjection } from './components/NextFixtureProjection';
import { ViewToggle } from './components/ViewToggle';
import { ProjectionAccuracy } from './components/ProjectionAccuracy';
import { BettingView } from './components/BettingView';
import { TipsView } from './components/TipsView';
import { AllTipsView } from './components/AllTipsView';
import {
  extractTeams,
  getLeagueTable,
  getProjectedStandings,
  getBettingStats,
  createProjectionContext,
  parseDate,
  type ProjectionConfig
} from './utils/dataProcessing';
import { createGoalProjectionContext } from './utils/goalProjection';
import { createScheduleModel } from './utils/scheduleStrength';
import { getLeagueTips, type LeagueTips } from './utils/bettingTips';
import seoPages from './seoPages.json';
import { PROJECTION_CONFIG } from './utils/projectionConfig';
import { SHOW_PROJECTION_EXTRAS } from './utils/featureFlags';
import { getTeamName } from './utils/teamColors';
import {
  spflFixtures,
  spflLastSeasonFixtures,
  spflTwoSeasonsAgoFixtures,
  eplFixtures,
  eplLastSeasonFixtures,
  laligaFixtures,
  laligaLastSeasonFixtures,
  bundesligaFixtures,
  bundesligaLastSeasonFixtures,
  serieaFixtures,
  serieaLastSeasonFixtures,
  ligue1Fixtures,
  ligue1LastSeasonFixtures,
  championsleagueFixtures,
  europaleagueFixtures,
  conferenceleagueFixtures,
  spflSchedule,
  eplSchedule,
  laligaSchedule,
  bundesligaSchedule,
  serieaSchedule,
  ligue1Schedule,
  championsleagueSchedule,
  europaleagueSchedule,
  conferenceleagueSchedule,
} from './utils/leagueData';
import dataUpdate from './data/data_update.json';
import type { Fixture, ScheduledFixture } from './types';
import logo from './assets/logo-mark.png';
import './App.css';

type Page = 'home' | 'league' | 'tips';
type Section = 'tables' | 'stats' | 'fixtures' | 'analysis';
type TablesTab = 'current' | 'projection';
type ProjectionView = 'table' | 'next' | 'analysis';
type FixturesTab = 'fixtures' | 'results';
type StatsTab = 'team' | 'all' | 'comparisons';
type AnalysisTab = 'data' | 'tips';
type League = 'spfl' | 'epl' | 'laliga' | 'bundesliga' | 'seriea' | 'ligue1' | 'championsleague' | 'europaleague' | 'conferenceleague';






interface LeagueConfig {
  label: string;
  // Full-season schedule, played and unplayed
  schedule: ScheduledFixture[];
  flag: LeagueFlag;
  fixtures: Fixture[];
  lastSeasonFixtures: Fixture[];
  // Completed seasons, oldest first, used to compute the projection's league-average and
  // promoted-team priors
  historicalSeasons: Fixture[][];
  projection: ProjectionConfig;
  // Games each team plays in a full season
  seasonGames: number;
  tableDividers: number[];
  projectionDividers: number[];
  // Whether betting tips are offered for this competition
  showTips: boolean;
  // Whether the projected final table is offered for this competition
  showProjection: boolean;
}

const LEAGUE_CONFIG: Record<League, LeagueConfig> = {
  spfl: {
    label: 'SPFL Premiership',
    flag: 'scotland',
    schedule: spflSchedule,
    fixtures: spflFixtures,
    lastSeasonFixtures: spflLastSeasonFixtures,
    historicalSeasons: [spflTwoSeasonsAgoFixtures, spflLastSeasonFixtures],
    projection: PROJECTION_CONFIG.spfl,
    seasonGames: 33,
    tableDividers: [1, 6, 10, 11],
    projectionDividers: [1, 6, 10, 11],
    showTips: true,
    showProjection: true,
  },
  epl: {
    label: 'Premier League',
    flag: 'england',
    schedule: eplSchedule,
    fixtures: eplFixtures,
    lastSeasonFixtures: eplLastSeasonFixtures,
    historicalSeasons: [eplLastSeasonFixtures],
    projection: PROJECTION_CONFIG.epl,
    seasonGames: 38,
    tableDividers: [4, 10, 17],
    projectionDividers: [4, 10, 17],
    showTips: true,
    showProjection: true,
  },
  laliga: {
    label: 'La Liga',
    flag: 'spain',
    schedule: laligaSchedule,
    fixtures: laligaFixtures,
    lastSeasonFixtures: laligaLastSeasonFixtures,
    historicalSeasons: [laligaLastSeasonFixtures],
    projection: PROJECTION_CONFIG.laliga,
    seasonGames: 38,
    tableDividers: [4, 7, 17],
    projectionDividers: [4, 7, 17],
    showTips: true,
    showProjection: true,
  },
  bundesliga: {
    label: 'Bundesliga',
    flag: 'germany',
    schedule: bundesligaSchedule,
    fixtures: bundesligaFixtures,
    lastSeasonFixtures: bundesligaLastSeasonFixtures,
    historicalSeasons: [bundesligaLastSeasonFixtures],
    projection: PROJECTION_CONFIG.bundesliga,
    seasonGames: 34,
    tableDividers: [4, 6, 15, 16],
    projectionDividers: [4, 6, 15, 16],
    showTips: true,
    showProjection: true,
  },
  seriea: {
    label: 'Serie A',
    flag: 'italy',
    schedule: serieaSchedule,
    fixtures: serieaFixtures,
    lastSeasonFixtures: serieaLastSeasonFixtures,
    historicalSeasons: [serieaLastSeasonFixtures],
    projection: PROJECTION_CONFIG.seriea,
    seasonGames: 38,
    tableDividers: [4, 6, 17],
    projectionDividers: [4, 6, 17],
    showTips: true,
    showProjection: true,
  },
  ligue1: {
    label: 'Ligue 1',
    flag: 'france',
    schedule: ligue1Schedule,
    fixtures: ligue1Fixtures,
    lastSeasonFixtures: ligue1LastSeasonFixtures,
    historicalSeasons: [ligue1LastSeasonFixtures],
    projection: PROJECTION_CONFIG.ligue1,
    seasonGames: 34,
    tableDividers: [4, 6, 15, 16],
    projectionDividers: [4, 6, 15, 16],
    showTips: true,
    showProjection: true,
  },
  championsleague: {
    label: 'Champions League',
    flag: 'europe',
    schedule: championsleagueSchedule,
    fixtures: championsleagueFixtures,
    // First season of data for the competition, so no prior-season form to build priors from
    lastSeasonFixtures: [],
    historicalSeasons: [],
    projection: PROJECTION_CONFIG.championsleague,
    seasonGames: 8,
    tableDividers: [8, 24],
    projectionDividers: [8, 24],
    showTips: false,
    showProjection: false,
  },
  europaleague: {
    label: 'Europa League',
    flag: 'europe',
    schedule: europaleagueSchedule,
    fixtures: europaleagueFixtures,
    // First season of data for the competition, so no prior-season form to build priors from
    lastSeasonFixtures: [],
    historicalSeasons: [],
    projection: PROJECTION_CONFIG.europaleague,
    seasonGames: 8,
    tableDividers: [8, 24],
    projectionDividers: [8, 24],
    showTips: false,
    showProjection: false,
  },
  conferenceleague: {
    label: 'Conference League',
    flag: 'europe',
    schedule: conferenceleagueSchedule,
    fixtures: conferenceleagueFixtures,
    // First season of data for the competition, so no prior-season form to build priors from
    lastSeasonFixtures: [],
    historicalSeasons: [],
    projection: PROJECTION_CONFIG.conferenceleague,
    seasonGames: 6,
    tableDividers: [8, 24],
    projectionDividers: [8, 24],
    showTips: false,
    showProjection: false,
  },
};

const LEAGUE_ORDER: League[] = ['spfl', 'epl', 'laliga', 'bundesliga', 'seriea', 'ligue1', 'championsleague', 'europaleague', 'conferenceleague'];

const ANALYSIS_LEAGUES = LEAGUE_ORDER.filter(key => LEAGUE_CONFIG[key].showProjection).map(key => ({
  key,
  label: LEAGUE_CONFIG[key].label,
  fixtures: LEAGUE_CONFIG[key].fixtures,
  lastSeasonFixtures: LEAGUE_CONFIG[key].lastSeasonFixtures,
  schedule: LEAGUE_CONFIG[key].schedule,
}));

const NO_TIPS: LeagueTips = {
  next: [],
  top: [],
  record: { rounds: 0, topPlaced: 0, topWon: 0, allPlaced: 0, allWon: 0 },
};

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

// Each league has its own crawlable URL (see scripts/generateSeoPages.mjs)
const leagueFromPath = (pathname: string): League | null => {
  const match = (Object.keys(seoPages.leagues) as League[]).find(key => seoPages.leagues[key].path === (pathname.endsWith('/') ? pathname : `${pathname}/`));
  return match ?? null;
};

function App() {
  const initialLeague = typeof window !== 'undefined' ? leagueFromPath(window.location.pathname) : null;
  const [page, setPage] = useState<Page>(initialLeague ? 'league' : 'home');
  const [league, setLeague] = useState<League>(initialLeague ?? 'spfl');
  const [section, setSection] = useState<Section>('tables');
  const [tablesTab, setTablesTab] = useState<TablesTab>('current');
  const [projectionView, setProjectionView] = useState<ProjectionView>('table');
  const [fixturesTab, setFixturesTab] = useState<FixturesTab>('fixtures');
  const [statsTab, setStatsTab] = useState<StatsTab>('team');
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('data');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const config = LEAGUE_CONFIG[league];
  const fixtures = config.fixtures;
  const lastSeasonFixtures = config.lastSeasonFixtures;

  const seasonLabel = useMemo(() => getSeasonLabel(fixtures), [fixtures]);
  const teams = useMemo(() => extractTeams(fixtures), [fixtures]);
  const leagueTableData = useMemo(() => getLeagueTable(fixtures), [fixtures]);
  const bettingStats = useMemo(() => getBettingStats(fixtures), [fixtures]);
  const projectionContext = useMemo(() => {
    const context = createProjectionContext(config.lastSeasonFixtures, config.historicalSeasons, config.projection, extractTeams(config.fixtures));
    if (config.projection.scheduleWeight <= 0) return context;
    const scheduleTeams = extractTeams(config.schedule as unknown as Fixture[]);
    const goalContext = createGoalProjectionContext(config.lastSeasonFixtures, scheduleTeams);
    return { ...context, scheduleModel: createScheduleModel(goalContext, config.schedule) };
  }, [config]);
  const projectedStandings = useMemo(
    () => getProjectedStandings(fixtures, config.seasonGames, projectionContext),
    [fixtures, config.seasonGames, projectionContext]
  );
  const tips = useMemo(
    () => config.showTips ? getLeagueTips(fixtures, lastSeasonFixtures, config.schedule) : NO_TIPS,
    [fixtures, lastSeasonFixtures, config]
  );
  // Only worked out when the all-leagues tips page is open
  const allLeagueTips = useMemo(
    () => page !== 'tips' ? [] : LEAGUE_ORDER.filter(key => LEAGUE_CONFIG[key].showTips).map(key => ({
      key,
      label: LEAGUE_CONFIG[key].label,
      tips: getLeagueTips(LEAGUE_CONFIG[key].fixtures, LEAGUE_CONFIG[key].lastSeasonFixtures, LEAGUE_CONFIG[key].schedule),
    })),
    [page]
  );
  const activeTeam = selectedTeam || teams[0] || '';

  const homeLeagueTiles = useMemo(() => LEAGUE_ORDER.map(key => ({
    key,
    label: LEAGUE_CONFIG[key].label,
    seasonLabel: getSeasonLabel(LEAGUE_CONFIG[key].fixtures),
    flag: LEAGUE_CONFIG[key].flag,
  })), []);

  // Each page and league opens at the top, rather than wherever the previous one was scrolled to
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, league]);

  // Keep the address bar and tab title in step with the page, so each league is linkable
  useEffect(() => {
    const target = page === 'league' ? seoPages.leagues[league] : seoPages.home;
    document.title = target.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', target.description);
    const path = page === 'league' ? seoPages.leagues[league].path : '/';
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', seoPages.siteUrl + path);
  }, [page, league]);

  // Back/forward buttons
  useEffect(() => {
    const onPop = () => {
      const fromPath = leagueFromPath(window.location.pathname);
      if (fromPath) { setLeague(fromPath); setPage('league'); } else { setPage('home'); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleSelectLeague = (next: string, tab?: 'tips') => {
    setLeague(next as League);
    setSelectedTeam('');
    setSection('tables');
    setTablesTab('current');
    setStatsTab('team');
    setFixturesTab('fixtures');
    setAnalysisTab('data');
    if (tab) {
      setSection('analysis');
      setAnalysisTab(tab);
    }
    setPage('league');
  };

  const handleTeamClick = (team: string) => {
    setSelectedTeam(team);
    setStatsTab('team');
    setSection('stats');
  };

  const handleGoHome = () => {
    setPage('home');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            {page === 'league' && (
              <button className="home-back-btn" onClick={handleGoHome}>
                ← Leagues
              </button>
            )}
            <h1
              className={`title ${page !== 'home' ? 'title-clickable' : ''}`}
              onClick={page !== 'home' ? handleGoHome : undefined}
            >
              <button
                type="button"
                className="title-logo-btn"
                onClick={e => { e.stopPropagation(); handleGoHome(); }}
                aria-label="Go to home page"
              >
                <img className="title-logo" src={logo} alt="" />
              </button>
              <span className={page === 'league' ? 'title-wordmark-league' : undefined}>
                oanthe<span className="title-wordmark-accent">numbers</span>
              </span>
            </h1>
            {page === 'league' && <span className="subtitle">{config.label}</span>}
          </div>
          {page === 'league' && (
            <div className="header-controls">
              <div className="header-badges">
                {seasonLabel && <span className="header-badge">{seasonLabel} Season</span>}
              </div>
            </div>
          )}
        </div>

        {page === 'league' && (
          <div className="toolbar-bar">
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
                <button
                  className={`view-tab ${section === 'fixtures' ? 'active' : ''}`}
                  onClick={() => setSection('fixtures')}
                >
                  Fixtures
                </button>
                <button
                  className={`view-tab ${section === 'analysis' ? 'active' : ''}`}
                  onClick={() => setSection('analysis')}
                >
                  Analysis
                </button>
              </div>

              <div className="sub-toolbar">
                {section === 'tables' && config.showProjection && (
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
                      className={`view-tab ${statsTab === 'all' ? 'active' : ''}`}
                      onClick={() => setStatsTab('all')}
                    >
                      All
                    </button>
                    <button
                      className={`view-tab ${statsTab === 'comparisons' ? 'active' : ''}`}
                      onClick={() => setStatsTab('comparisons')}
                    >
                      Charts
                    </button>
                  </div>
                )}

                {section === 'fixtures' && (
                  <div className="view-tabs secondary-tabs">
                    <button
                      className={`view-tab ${fixturesTab === 'fixtures' ? 'active' : ''}`}
                      onClick={() => setFixturesTab('fixtures')}
                    >
                      Fixtures
                    </button>
                    <button
                      className={`view-tab ${fixturesTab === 'results' ? 'active' : ''}`}
                      onClick={() => setFixturesTab('results')}
                    >
                      Results
                    </button>
                  </div>
                )}

                {section === 'analysis' && (
                  <div className="view-tabs secondary-tabs">
                    <button
                      className={`view-tab ${analysisTab === 'data' ? 'active' : ''}`}
                      onClick={() => setAnalysisTab('data')}
                    >
                      Data
                    </button>
                    {config.showTips && (
                      <button
                        className={`view-tab ${analysisTab === 'tips' ? 'active' : ''}`}
                        onClick={() => setAnalysisTab('tips')}
                      >
                        Tips
                      </button>
                    )}
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
            </div>
          </div>
        )}
      </header>

      <main className="app-main">
        {page === 'home' && (
          <HomePage leagues={homeLeagueTiles} onSelectLeague={handleSelectLeague} onShowTips={() => setPage('tips')} />
        )}

        {page === 'tips' && (
          <AllTipsView
            leagues={allLeagueTips}
            onBack={handleGoHome}
            onSelectLeague={key => handleSelectLeague(key, 'tips')}
          />
        )}

        {page === 'league' && (
          <>
            {section === 'tables' && tablesTab === 'current' && (
              <>
                <LeagueTable data={leagueTableData} dividerPositions={config.tableDividers} onTeamClick={handleTeamClick} />
                <LeagueHighlights fixtures={fixtures} />
              </>
            )}
            {section === 'tables' && tablesTab === 'projection' && config.showProjection && (
              <>
                {SHOW_PROJECTION_EXTRAS && (
                  <div className="projection-view-toggle">
                    <ViewToggle
                      ariaLabel="Projection view"
                      options={[
                        { key: 'table', label: 'Final Table' },
                        { key: 'next', label: 'Next Fixtures' },
                        { key: 'analysis', label: 'Analysis' },
                      ]}
                      value={projectionView}
                      onChange={setProjectionView}
                    />
                  </div>
                )}
                {(!SHOW_PROJECTION_EXTRAS || projectionView === 'table') && (
                  <ProjectionTable data={projectedStandings} dividerPositions={config.projectionDividers} onTeamClick={handleTeamClick} />
                )}
                {SHOW_PROJECTION_EXTRAS && projectionView === 'next' && (
                  <NextFixtureProjection fixtures={fixtures} lastSeasonFixtures={lastSeasonFixtures} schedule={config.schedule} />
                )}
                {SHOW_PROJECTION_EXTRAS && projectionView === 'analysis' && <ProjectionAccuracy leagues={ANALYSIS_LEAGUES} activeLeague={league} />}
              </>
            )}
            {section === 'stats' && statsTab === 'team' && activeTeam && (
              <TeamOverview
                team={activeTeam}
                fixtures={fixtures}
                lastSeasonFixtures={lastSeasonFixtures}
                leagueTable={leagueTableData}
                projection={projectionContext}
                seasonGames={config.seasonGames}
              />
            )}
            {section === 'stats' && statsTab === 'all' && (
              <AllStatsView fixtures={fixtures} />
            )}
            {section === 'stats' && statsTab === 'comparisons' && (
              <ComparisonsView fixtures={fixtures} teams={teams} />
            )}
            {section === 'fixtures' && <FixturesView mode={fixturesTab} results={fixtures} schedule={config.schedule} tips={tips} />}
            {section === 'analysis' && analysisTab === 'data' && <BettingView key={league} data={bettingStats} />}
            {section === 'analysis' && analysisTab === 'tips' && config.showTips && <TipsView tips={tips} />}
          </>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-brand">
          <img src={logo} alt="" />
          <span>oanthe<span className="title-wordmark-accent">numbers</span></span>
        </div>
        <p className="footer-source">Data sourced from <a href="https://www.fotmob.com" target="_blank" rel="noreferrer">fotmob.com</a></p>
        <p className="footer-updated">Last updated {lastUpdated}</p>
        <p className="footer-credit">Created by <a href="https://x.com/oanthenumbers" target="_blank" rel="noreferrer">@oanthenumbers</a></p>
      </footer>
    </div>
  );
}

export default App;
