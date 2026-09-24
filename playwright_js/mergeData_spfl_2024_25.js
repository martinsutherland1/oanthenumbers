import * as fs from 'fs';
import path from 'path';
import data from "./collectedData/SPFL_data_2024_25.json" with { type: "json" };




export function saveJSON(filename, data) {
  const filePath = path.resolve(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`📁 JSON saved → ${filePath}`);
}

function mergeMatchData(teamData) {
  const matches = new Map();

  // Process each team's fixtures
  for (const [team, fixtures] of Object.entries(teamData)) {
    for (const fixture of fixtures) {
      // Create a unique match key (date + teams sorted alphabetically)
      const teams = [team, fixture.opposition].sort();
      const matchKey = `${fixture.date}_${teams[0]}_${teams[1]}`;

      // Skip if we've already processed this match
      if (matches.has(matchKey)) continue;

      const isHome = fixture.location === 'home';

      // Create merged match object
      const match = {
        date: fixture.date,
        home_team: isHome ? team : fixture.opposition,
        away_team: isHome ? fixture.opposition : team,
        home_goals: isHome ? fixture.goals_for : fixture.goals_against,
        away_goals: isHome ? fixture.goals_against : fixture.goals_for,
        home_shots: isHome ? fixture.total_shots : fixture.shots_against,
        away_shots: isHome ? fixture.shots_against : fixture.total_shots,
        home_shots_on_target: isHome ? fixture.shots_on_target : fixture.shots_on_target_against,
        away_shots_on_target: isHome ? fixture.shots_on_target_against : fixture.shots_on_target,
        home_xG: isHome ? fixture.xG_for : fixture.xG_against,
        away_xG: isHome ? fixture.xG_against : fixture.xG_for,
        home_xg_open_play: isHome ? fixture.xg_open_play_for : fixture.xg_open_play_against,
        away_xg_open_play: isHome ? fixture.xg_open_play_against : fixture.xg_open_play_for,
        home_xg_set_play: isHome ? fixture.xg_set_play_for : fixture.xg_set_play_against,
        away_xg_set_play: isHome ? fixture.xg_set_play_against : fixture.xg_set_play_for,
        home_npxg: isHome ? fixture.npxg_for : fixture.npxg_against,
        away_npxg: isHome ? fixture.npxg_against : fixture.npxg_for,
        home_xgot: isHome ? fixture.xgot_for : fixture.xgot_against,
        away_xgot: isHome ? fixture.xgot_against : fixture.xgot_for,
        home_possession: isHome ? fixture.possession_for : fixture.possession_against,
        away_possession: isHome ? fixture.possession_against : fixture.possession_for,
        home_big_chances: isHome ? fixture.big_chances : fixture.big_chances_against,
        away_big_chances: isHome ? fixture.big_chances_against : fixture.big_chances,
        home_big_chances_missed: isHome ? fixture.big_chances_missed : fixture.big_chances_against_missed,
        away_big_chances_missed: isHome ? fixture.big_chances_against_missed : fixture.big_chances_missed,
        home_accurate_passes: isHome ? fixture.accurate_passes : fixture.accurate_passes_against,
        away_accurate_passes: isHome ? fixture.accurate_passes_against : fixture.accurate_passes,
        home_passes_opp_half: isHome ? fixture.passes_opp_half_for : fixture.passes_opp_half_against,
        away_passes_opp_half: isHome ? fixture.passes_opp_half_against : fixture.passes_opp_half_for,
        home_touches_in_box: isHome ? fixture.touches_in_box_for : fixture.touches_in_box_against,
        away_touches_in_box: isHome ? fixture.touches_in_box_against : fixture.touches_in_box_for,
        home_shots_outside_box: isHome ? fixture.shots_outside_box_for : fixture.shots_outside_box_against,
        away_shots_outside_box: isHome ? fixture.shots_outside_box_against : fixture.shots_outside_box_for,
        home_fouls: isHome ? fixture.fouls_committed : fixture.fouls_against,
        away_fouls: isHome ? fixture.fouls_against : fixture.fouls_committed,
        home_corners: isHome ? fixture.corners : fixture.corners_against,
        away_corners: isHome ? fixture.corners_against : fixture.corners
      };

      matches.set(matchKey, match);
    }
  }

  // Group by date and sort
  const result = {};

  // Sort matches by date
  const sortedMatches = Array.from(matches.values()).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Group by date
  for (const match of sortedMatches) {
    if (!result[match.date]) {
      result[match.date] = [];
    }
    result[match.date].push(match);
  }

  return result;
}

const updatedData = mergeMatchData(data)




saveJSON("./transferredData/data_breakdown_spfl_2024_25.json", updatedData)
