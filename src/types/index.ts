export interface Fixture {
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_xG: number | null;
  away_xG: number | null;
  home_xg_open_play: number | null;
  away_xg_open_play: number | null;
  home_xg_set_play: number | null;
  away_xg_set_play: number | null;
  home_npxg: number;
  away_npxg: number;
  home_xgot: number | null;
  away_xgot: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_big_chances: number | null;
  away_big_chances: number | null;
  home_big_chances_missed: number | null;
  away_big_chances_missed: number | null;
  home_accurate_passes: number | null;
  away_accurate_passes: number | null;
  home_passes_opp_half: number | null;
  away_passes_opp_half: number | null;
  home_touches_in_box: number | null;
  away_touches_in_box: number | null;
  home_shots_outside_box: number | null;
  away_shots_outside_box: number | null;
  home_fouls: number | null;
  away_fouls: number | null;
  home_corners: number | null;
  away_corners: number | null;
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
