import { flattenFixtures, flattenSchedule } from './dataProcessing';
import type { FixturesData, ScheduleData } from '../types';
import spflFixturesData from '../data/spfl_results_2026_27.json';
import spflLastSeasonFixturesData from '../data/spfl_results_2025_26.json';
import spflTwoSeasonsAgoFixturesData from '../data/spfl_results_2024_25.json';
import eplFixturesData from '../data/epl_results_2026_27.json';
import eplLastSeasonFixturesData from '../data/epl_results_2025_26.json';
import laligaFixturesData from '../data/laliga_results_2026_27.json';
import laligaLastSeasonFixturesData from '../data/laliga_results_2025_26.json';
import bundesligaFixturesData from '../data/bundesliga_results_2026_27.json';
import bundesligaLastSeasonFixturesData from '../data/bundesliga_results_2025_26.json';
import serieaFixturesData from '../data/seriea_results_2026_27.json';
import serieaLastSeasonFixturesData from '../data/seriea_results_2025_26.json';
import ligue1FixturesData from '../data/ligue1_results_2026_27.json';
import ligue1LastSeasonFixturesData from '../data/ligue1_results_2025_26.json';
import championsleagueFixturesData from '../data/championsleague_results_2026_27.json';
import europaleagueFixturesData from '../data/europaleague_results_2026_27.json';
import conferenceleagueFixturesData from '../data/conferenceleague_results_2026_27.json';
import championsleagueScheduleData from '../data/championsleague_fixtures_2026_27.json';
import europaleagueScheduleData from '../data/europaleague_fixtures_2026_27.json';
import conferenceleagueScheduleData from '../data/conferenceleague_fixtures_2026_27.json';
import eplScheduleData from '../data/epl_fixtures_2026_27.json';
import spflScheduleData from '../data/spfl_fixtures_2026_27.json';
import laligaScheduleData from '../data/laliga_fixtures_2026_27.json';
import bundesligaScheduleData from '../data/bundesliga_fixtures_2026_27.json';
import serieaScheduleData from '../data/seriea_fixtures_2026_27.json';
import ligue1ScheduleData from '../data/ligue1_fixtures_2026_27.json';

// Some older fixtures in prior-season files are missing extended stats (xG breakdowns, shots,
// etc.) — goals are always present, which is all the year-on-year comparison needs.
export const spflFixtures = flattenFixtures(spflFixturesData as FixturesData);
export const spflLastSeasonFixtures = flattenFixtures(spflLastSeasonFixturesData as unknown as FixturesData);
export const spflTwoSeasonsAgoFixtures = flattenFixtures(spflTwoSeasonsAgoFixturesData as unknown as FixturesData);
export const eplFixtures = flattenFixtures(eplFixturesData as FixturesData);
export const eplLastSeasonFixtures = flattenFixtures(eplLastSeasonFixturesData as FixturesData);
export const laligaFixtures = flattenFixtures(laligaFixturesData as FixturesData);
export const laligaLastSeasonFixtures = flattenFixtures(laligaLastSeasonFixturesData as FixturesData);
export const bundesligaFixtures = flattenFixtures(bundesligaFixturesData as FixturesData);
export const bundesligaLastSeasonFixtures = flattenFixtures(bundesligaLastSeasonFixturesData as FixturesData);
export const serieaFixtures = flattenFixtures(serieaFixturesData as FixturesData);
export const serieaLastSeasonFixtures = flattenFixtures(serieaLastSeasonFixturesData as FixturesData);
export const ligue1Fixtures = flattenFixtures(ligue1FixturesData as FixturesData);
export const ligue1LastSeasonFixtures = flattenFixtures(ligue1LastSeasonFixturesData as FixturesData);
export const championsleagueFixtures = flattenFixtures(championsleagueFixturesData as FixturesData);
export const europaleagueFixtures = flattenFixtures(europaleagueFixturesData as FixturesData);
export const conferenceleagueFixtures = flattenFixtures(conferenceleagueFixturesData as FixturesData);
export const spflSchedule = flattenSchedule(spflScheduleData as ScheduleData);
export const eplSchedule = flattenSchedule(eplScheduleData as ScheduleData);
export const laligaSchedule = flattenSchedule(laligaScheduleData as ScheduleData);
export const bundesligaSchedule = flattenSchedule(bundesligaScheduleData as ScheduleData);
export const serieaSchedule = flattenSchedule(serieaScheduleData as ScheduleData);
export const ligue1Schedule = flattenSchedule(ligue1ScheduleData as ScheduleData);
export const championsleagueSchedule = flattenSchedule(championsleagueScheduleData as ScheduleData);
export const europaleagueSchedule = flattenSchedule(europaleagueScheduleData as ScheduleData);
export const conferenceleagueSchedule = flattenSchedule(conferenceleagueScheduleData as ScheduleData);

// Competitions that get betting tips, in display order
export const TIP_LEAGUES = [
  { key: 'spfl', label: 'SPFL Premiership', fixtures: spflFixtures, lastSeasonFixtures: spflLastSeasonFixtures, schedule: spflSchedule },
  { key: 'epl', label: 'Premier League', fixtures: eplFixtures, lastSeasonFixtures: eplLastSeasonFixtures, schedule: eplSchedule },
  { key: 'laliga', label: 'La Liga', fixtures: laligaFixtures, lastSeasonFixtures: laligaLastSeasonFixtures, schedule: laligaSchedule },
  { key: 'bundesliga', label: 'Bundesliga', fixtures: bundesligaFixtures, lastSeasonFixtures: bundesligaLastSeasonFixtures, schedule: bundesligaSchedule },
  { key: 'seriea', label: 'Serie A', fixtures: serieaFixtures, lastSeasonFixtures: serieaLastSeasonFixtures, schedule: serieaSchedule },
  { key: 'ligue1', label: 'Ligue 1', fixtures: ligue1Fixtures, lastSeasonFixtures: ligue1LastSeasonFixtures, schedule: ligue1Schedule },
];
