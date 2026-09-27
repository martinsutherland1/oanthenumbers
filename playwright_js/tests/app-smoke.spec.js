// @ts-nocheck
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TEAM_NAMES } from "../../oanthenumberapp/src/utils/teamColors.ts";

// End-to-end smoke test for the Oan the Numbers web app.
// Start the app first (cd oanthenumberapp && npm run dev) or point APP_URL at a deployed build:
//   APP_URL=http://localhost:5173 npx playwright test tests/app-smoke.spec.js

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../oanthenumberapp/src/data");

// Home tile label and current-season data file for each league
const LEAGUES = [
  { label: "SPFL Premiership", file: "spfl_results_2026_27.json" },
  { label: "Premier League", file: "epl_results_2026_27.json" },
  { label: "La Liga", file: "laliga_results_2026_27.json" },
  { label: "Bundesliga", file: "bundesliga_results_2026_27.json" },
];

// The league's teams as slugs and as the display names the UI shows
function loadLeagueTeams(file) {
  const byDate = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
  const slugs = new Set();
  for (const fixtures of Object.values(byDate)) {
    for (const f of fixtures) {
      slugs.add(f.home_team);
      slugs.add(f.away_team);
    }
  }
  return [...slugs].sort().map((slug) => ({ slug, name: TEAM_NAMES[slug] ?? slug }));
}

function pickRandom(items, n) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function exactText(s) {
  return new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

const tab = (page, name) => page.locator(".view-tab", { hasText: exactText(name) });

async function openLeague(page, label) {
  await page.goto(APP_URL);
  await expect(page.getByRole("heading", { name: "Choose a League" })).toBeVisible();
  await page.locator(".league-tile", { hasText: label }).click();
  await expect(page.locator(".subtitle")).toHaveText(`${label} Analysis`);
}

// Table shows exactly the league's teams, and 4 random ones are checked by name
async function expectTableMatchesLeague(page, teams) {
  await expect(page.locator(".league-table tbody tr")).toHaveCount(teams.length);

  const shown = await page.locator(".league-table .team-cell-name").allTextContents();
  const expectedNames = teams.map((t) => t.name);
  for (const name of shown) expect(expectedNames).toContain(name);

  for (const team of pickRandom(teams, 4)) {
    await expect(
      page.locator(".league-table .team-cell-name", { hasText: exactText(team.name) })
    ).toHaveCount(1);
  }
}

for (const league of LEAGUES) {
  test.describe(league.label, () => {
    const teams = loadLeagueTeams(league.file);

    test.beforeEach(async ({ page }) => {
      await openLeague(page, league.label);
    });

    test("league table displays the league's teams", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "League Table" })).toBeVisible();
      await expectTableMatchesLeague(page, teams);
    });

    test("projection table displays the league's teams", async ({ page }) => {
      await tab(page, "Projection").click();
      await expect(page.locator(".projection-table")).toBeVisible();
      await expectTableMatchesLeague(page, teams);

      const projPts = await page.locator(".projection-table td.col-proj-pts").allTextContents();
      expect(projPts).toHaveLength(teams.length);
      for (const p of projPts) expect(Number.isFinite(Number(p))).toBe(true);
    });

    test("stats: selecting 4 teams shows their data", async ({ page }) => {
      await tab(page, "Stats").click();
      await tab(page, "Team").click();

      const select = page.locator("#team-select");
      await expect(select).toBeVisible();

      for (const team of pickRandom(teams, 4)) {
        await select.selectOption(team.slug);
        await expect(page.locator(".team-header-name")).toHaveText(team.name);
        await expect(page.locator(".team-header-meta")).toContainText(/League position \d+|No games played yet/);
        await expect(page.locator(".team-overview")).toBeVisible();
        await expect(page.locator(".metric-trend-grid > *").first()).toBeVisible();
      }
    });

    test("comparisons: 4 teams display and chart toggles between line and radar", async ({ page }) => {
      await tab(page, "Stats").click();
      await tab(page, "Comparisons").click();
      await expect(page.locator(".comparisons-empty")).toBeVisible();

      const chosen = pickRandom(teams, 4);
      for (const team of chosen) {
        await page.locator(".team-chip", { hasText: exactText(team.name) }).click();
      }
      await expect(page.locator(".team-chip.selected")).toHaveCount(4);
      await expect(page.locator(".comparisons-empty")).toHaveCount(0);

      const lineBtn = page.getByRole("button", { name: "Line Chart", exact: true });
      const radarBtn = page.getByRole("button", { name: "Radar", exact: true });

      // Line chart is the default view (at least one line per selected team)
      await expect(lineBtn).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".line-chart-container")).toBeVisible();
      await expect
        .poll(() => page.locator(".line-chart-container .recharts-line").count())
        .toBeGreaterThanOrEqual(4);
      await expect(page.locator(".radar-container")).toHaveCount(0);

      // Toggle to radar
      await radarBtn.click();
      await expect(radarBtn).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".radar-container")).toBeVisible();
      await expect(page.locator(".radar-container .recharts-radar")).toHaveCount(4);
      await expect(page.locator(".line-chart-container")).toHaveCount(0);
      for (const team of chosen) {
        await expect(page.locator(".radar-legend-item", { hasText: team.name })).toBeVisible();
      }

      // ...and back to line
      await lineBtn.click();
      await expect(lineBtn).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".line-chart-container")).toBeVisible();
      await expect(page.locator(".radar-container")).toHaveCount(0);
    });
  });
}
