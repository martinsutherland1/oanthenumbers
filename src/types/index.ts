export interface Fixture {
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  home_xG: number;
  away_xG: number;
  home_xg_open_play: number;
  away_xg_open_play: number;
  home_xg_set_play: number;
  away_xg_set_play: number;
  home_npxg: number;
  away_npxg: number;
  home_xgot: number;
  away_xgot: number;
}

export interface FixturesData {
  [date: string]: Fixture[];
}

export interface TeamGame {
  date: Date;
  team: string;
  xgDiff: number; // team's npxG minus opponent's npxG
  opponent: string;
  isHome: boolean;
}

export interface TeamRollingAverage {
  team: string;
  average: number;
  gamesPlayed: number;
}

export interface ChartDataPoint {
  name: string;
  leagueAverage: number;
  [team: string]: number | string;
}

export interface TeamColor {
  team: string;
  color: string;
}

export interface RollingAveragePoint {
  matchNumber: number;
  date: Date;
  rollingAverage: number;
  opponent: string;
}

export interface TeamRollingAverageOverTime {
  team: string;
  data: RollingAveragePoint[];
}

export interface LineChartDataPoint {
  matchNumber: number;
  leagueAverage: number;
  [team: string]: number | string;
}
