// @ts-nocheck
import { test, expect } from "@playwright/test";
import { saveJSON } from "./utils/helper";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREDICTIONS_FILE = "spfl_predictions.json";

function loadExistingPredictions() {
  try {
    if (fs.existsSync(PREDICTIONS_FILE)) {
      const data = fs.readFileSync(PREDICTIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.log("No existing predictions file found, starting fresh");
  }
  return [];
}

function loadFixtures() {
  const fixturesPath = path.join(__dirname, "fixtures", "spfl", "fixtures_spfl_2025_26.json");
  const data = fs.readFileSync(fixturesPath, "utf-8");
  const allFixtures = JSON.parse(data);

  // Get all fixture keys and find the last one
  const keys = Object.keys(allFixtures).sort((a, b) => {
    const numA = parseInt(a.split("_")[1]);
    const numB = parseInt(b.split("_")[1]);
    return numA - numB;
  });

  const lastKey = keys[keys.length - 1];
  console.log(`Using fixtures from: ${lastKey}`);
  return allFixtures[lastKey];
}

const API_URL = "http://127.0.0.1:8000/predict";

test("predict SPFL fixtures", async ({ request }) => {
  test.setTimeout(120_000);

  const spflFixtures = loadFixtures();
  const existingPredictions = loadExistingPredictions();
  const newPredictions = [];

  for (const fixture of spflFixtures) {
    const { team_home, team_away, date } = fixture;
    console.log(`Predicting: ${team_home} vs ${team_away}`);

    const response = await request.post(API_URL, {
      data: {
        home_team: team_home,
        away_team: team_away,
        league: "spfl"
      }
    });

    expect(response.ok()).toBeTruthy();
    const prediction = await response.json();

    newPredictions.push({
      date,
      prediction
    });
  }

  const allPredictions = [...existingPredictions, ...newPredictions];
  saveJSON(PREDICTIONS_FILE, allPredictions);
});
