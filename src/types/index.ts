export interface Fixture {
  date: string;
  home: string;
  away: string;
  xg_home: number;
  xg_away: number;
}

export interface TeamGame {
  date: Date;
  team: string;
  xg: number;
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
