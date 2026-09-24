// @ts-nocheck
import { test, expect } from "@playwright/test";
import { saveJSON } from "./utils/helper";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Re-create __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Helpers ----------

async function loadFixtures() {
  const fixturesPath = path.join(
    __dirname,
    "fixtures",
    "spfl",
    "fixtures_spfl_2026_27.json"
  );
  const raw = await fs.readFile(fixturesPath, "utf-8");
  return JSON.parse(raw);
}

const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "collectedData",
  "SPFL_data_2026_27.json"
);

// Allow time after kick-off for the match to finish and stats to be published
const MATCH_DURATION_MS = 2.5 * 60 * 60 * 1000;

async function loadExistingData() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function hasBeenPlayed(fixture) {
  // Without a kick-off time, only treat the match as played from the next day
  if (!fixture.time) {
    const nextDay = new Date(`${fixture.date}T00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.getTime() <= Date.now();
  }
  const kickOff = new Date(`${fixture.date}T${fixture.time}`);
  return kickOff.getTime() + MATCH_DURATION_MS <= Date.now();
}

// SPFL teams can host the same opponent more than once a season,
// so the date is needed to identify the fixture.
function isCollected(seasonData, fixture) {
  return (seasonData[fixture.team_home] || []).some(
    (f) =>
      f.opposition === fixture.team_away &&
      f.location === "home" &&
      f.date === fixture.date
  );
}

function parsePercent(text) {
  return Number(text.replace("%", "").trim());
}

function parseNumber(text) {
  return Number(text.trim());
}

async function retryClick(page, selector, retries = 2, delay = 500) {
  try {
    await page.click(selector, { timeout: 3000 });
  } catch (err) {
    if (retries <= 0) throw err;
    await page.waitForTimeout(delay);
    return retryClick(page, selector, retries - 1, delay);
  }
}

async function clickStats(page) {
  // Allow page to settle a bit after navigation
  await page.waitForTimeout(4000);

  await page
    .click('button:has-text("Stats")', { timeout: 3000 })
    .catch(async () => {
      // simple retry if first click happens too early
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Stats")', { timeout: 3000 });
    });
}

// When clicking a fixture, FotMob may open a NEW TAB.
// This helper takes a selector string.
async function openFixturePage(page, fixtureSelector) {
  const context = page.context();

  const waitForNewPage = context
    .waitForEvent("page", { timeout: 12000 })
    .catch(() => null);

  await retryClick(page, fixtureSelector);

  const newPage = await waitForNewPage;

  if (newPage) {
    await newPage.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  }

  return newPage ?? page;
}

// ---------- Test ----------

test("iterate fixtures by round", async ({ page }) => {
  test.setTimeout(10_200_000);

  const fixtures = await loadFixtures();
  const seasonData = await loadExistingData();
  const teams = [
    "aberdeen",
    "celtic",
    "dundee-fc",
    "dundee-united",
    "falkirk",
    "heart-midlothian",
    "hibernian",
    "kilmarnock",
    "motherwell",
    "rangers",
    "st-johnstone",
    "st-mirren"
  ];
  teams.forEach((team) => {
    seasonData[team] = seasonData[team] || [];
  });

function parseLeadingInt(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : NaN;
}

async function getStatPair(page, label, numericParser) {
  if (!numericParser) numericParser = parseNumber;

  // Stat rows with values carry an aria-label like
  // "Expected goals (xG): Liverpool 2.21, AFC Bournemouth 1.70".
  // The header-only <li> (no values) has no colon, so this also
  // skips it without depending on hashed emotion classes.
  const row = page
    .locator('li[aria-label*=": "]')
    .filter({ hasText: label });

  // Each row has exactly two value boxes, home first then away,
  // matched by the stable "StatBox" component-name suffix.
  const boxes = row.locator('div[class*="StatBox"]');

  const homeText = await boxes.nth(0).innerText();
  const awayText = await boxes.nth(1).innerText();

  return [numericParser(homeText), numericParser(awayText)];
}



  const roundKeys = Object.keys(fixtures);

  for (const roundKey of roundKeys) {
    const roundIndex = Number(roundKey.split("_")[1]); // "fixtures_3" -> 3
    const fixtureList = (fixtures[roundKey] || []).filter(
      (fixture) => hasBeenPlayed(fixture) && !isCollected(seasonData, fixture)
    );

    if (fixtureList.length === 0) {
      console.log(`Round ${roundIndex}: nothing to collect, skipping`);
      continue;
    }

    if (roundIndex % 2 === 0) {
      await page.waitForTimeout(2000);
    }

    await page.goto(
      `https://www.fotmob.com/en-GB/leagues/64/fixtures/premiership?group=by-round&round=${roundIndex}`
    );

    for (const fixture of fixtureList) {
      const { team_home, team_away } = fixture;
      console.log(`Round ${roundIndex}: ${team_home} v ${team_away}`);

      // Find link by href containing team_home-vs-team_away
      // Click the fixture
      const fixtureSelector = `xpath=//a[contains(@href, "${team_home}") and contains(@href, "${team_away}")]`;
      const matchPage = await openFixturePage(page, fixtureSelector);

      try {
        await clickStats(matchPage);

        // -------------------- // SCORE // --------------------
        const scoreText = await matchPage
          .locator('span[class*="MFHeaderStatusScore"]')
          .first()
          .innerText();
        const [home_goals, away_goals] = scoreText
          .split("-")
          .map((part) => parseInt(part.trim(), 10));

        // -------------------- // POSSESSION // --------------------
        // const possessionSpans = matchPage
        //   .locator('div[class*="PossessionSegment"] span')
        //   .filter({ hasText: "%" });
        // const homePossessionText = await possessionSpans.nth(0).innerText();
        // const awayPossessionText = await possessionSpans.nth(1).innerText();
        // const home_pos = parsePercent(homePossessionText);
        // const away_pos = parsePercent(awayPossessionText);

        // --------------------
        //   TOP STATS
        // --------------------

        // xG
        const [xG_home, xG_away] = await getStatPair(
          matchPage,
          "Expected goals (xG)"
        );

        // xG open play
        const [xg_open_play_home, xg_open_play_away] = await getStatPair(
          matchPage,
          "xG open play"
        );

        // xG set play 
        const [xg_set_play_home, xg_set_play_away] = await getStatPair(
          matchPage,
          "xG set play"
        );

        // Non-penalty xG
        const [npxg_home, npxg_away] = await getStatPair(
          matchPage,
          "Non-penalty xG"
        );

        // xG on target (xGOT)
        const [xgot_home, xgot_away] = await getStatPair(
          matchPage,
          "xG on target (xGOT)"
        );

        // total shots
        // const [total_shots_home, total_shots_away] = await getStatPair(
        //   matchPage,
        //   "Total shots"
        // );

        // shots on target
        // const [shots_on_target_home, shots_on_target_away] = await getStatPair(
        //   matchPage,
        //   "Shots on target"
        // );

        // big chances
        // const [big_chances_home, big_chances_away] = await getStatPair(
        //   matchPage,
        //   "Big chances"
        // );

        // big chances missed
        // const [big_chances_missed_home, big_chances_missed_away] =
        //   await getStatPair(matchPage, "Big chances missed");

        // accurate passes (strip the % out)
        // const [accurate_passes_home, accurate_passes_away] = await getStatPair(
        //   matchPage,
        //   "Accurate passes",
        //   parseLeadingInt // only take the first integer (e.g. 174 from "174 (66%)")
        // );

        // fouls committed
        // const [fouls_committed_home, fouls_committed_away] = await getStatPair(
        //   matchPage,
        //   "Fouls committed"
        // );

        // corners
        // const [corners_home, corners_away] = await getStatPair(
        //   matchPage,
        //   "Corners"
        // );

        // Passes
        // const [passes_home, passes_away] = await getStatPair(
        //   matchPage,
        //   "Passes"
        // );

        // Passes in opposition half
        // const [passes_opp_half_home, passes_opp_half_away] = await getStatPair(
        //   matchPage,
        //   "Opposition half"
        // );

        // Touches in opposition box
        // const [touches_in_box_home, touches_in_box_away] = await getStatPair(
        //   matchPage,
        //   "Touches in opposition box"
        // );

        // Shots outside box
        // const [shots_outside_box_home, shots_outside_box_away] =
        //   await getStatPair(matchPage, "Shots outside box");

        // --------------------
        //   BUILD JSON
        // --------------------
        const fixture_object_home = {
          date: fixture.date,
          opposition: team_away,
          goals_for: home_goals,
          goals_against: away_goals,

          // Shots / xG
          // total_shots: total_shots_home,
          // shots_against: total_shots_away,
          // shots_on_target: shots_on_target_home,
          // shots_on_target_against: shots_on_target_away,
          xG_for: xG_home,
          xG_against: xG_away,

          // xG detail
          xg_open_play_for: xg_open_play_home,
          xg_open_play_against: xg_open_play_away,
          xg_set_play_for: xg_set_play_home,
          xg_set_play_against: xg_set_play_away,
          npxg_for: npxg_home,
          npxg_against: npxg_away,
          xgot_for: xgot_home,
          xgot_against: xgot_away,

          // Possession
          // possession_for: home_pos,
          // possession_against: away_pos,

          // Big chances
          // big_chances: big_chances_home,
          // big_chances_missed: big_chances_missed_home,
          // big_chances_against: big_chances_away,
          // big_chances_against_missed: big_chances_missed_away,

          // Passing
          // accurate_passes: accurate_passes_home,
          // accurate_passes_against: accurate_passes_away,
          // passes_opp_half_for: passes_opp_half_home,
          // passes_opp_half_against: passes_opp_half_away,

          // Box touches / shots outside box
          // touches_in_box_for: touches_in_box_home,
          // touches_in_box_against: touches_in_box_away,
          // shots_outside_box_for: shots_outside_box_home,
          // shots_outside_box_against: shots_outside_box_away,

          // Fouls / corners
          // fouls_committed: fouls_committed_home,
          // fouls_against: fouls_committed_away,
          // corners: corners_home,
          // corners_against: corners_away,

          location: "home",
        };

        const fixture_object_away = {
          date: fixture.date,
          opposition: team_home,
          goals_for: away_goals,
          goals_against: home_goals,

          // Shots / xG
          // total_shots: total_shots_away,
          // shots_against: total_shots_home,
          // shots_on_target: shots_on_target_away,
          // shots_on_target_against: shots_on_target_home,
          xG_for: xG_away,
          xG_against: xG_home,

          // xG detail
          xg_open_play_for: xg_open_play_away,
          xg_open_play_against: xg_open_play_home,
          xg_set_play_for: xg_set_play_away,
          xg_set_play_against: xg_set_play_home,
          npxg_for: npxg_away,
          npxg_against: npxg_home,
          xgot_for: xgot_away,
          xgot_against: xgot_home,

          // Possession
          // possession_for: away_pos,
          // possession_against: home_pos,

          // Big chances
          // big_chances: big_chances_away,
          // big_chances_missed: big_chances_missed_away,
          // big_chances_against: big_chances_home,
          // big_chances_against_missed: big_chances_missed_home,

          // Passing
          // accurate_passes: accurate_passes_away,
          // accurate_passes_against: accurate_passes_home,
          // passes_opp_half_for: passes_opp_half_away,
          // passes_opp_half_against: passes_opp_half_home,

          // Box touches / shots outside box
          // touches_in_box_for: touches_in_box_away,
          // touches_in_box_against: touches_in_box_home,
          // shots_outside_box_for: shots_outside_box_away,
          // shots_outside_box_against: shots_outside_box_home,

          // Fouls / corners
          // fouls_committed: fouls_committed_away,
          // fouls_against: fouls_committed_home,
          // corners: corners_away,
          // corners_against: corners_home,

          location: "away",
        };

        seasonData[team_home].push(fixture_object_home);
        seasonData[team_away].push(fixture_object_away);
      } finally {
        if (matchPage !== page) {
          await matchPage.close();
        }
      }
    }

    // Save after each round
    saveJSON(OUTPUT_PATH, seasonData);
  }
});
