# @oanthenumbers — SPFL Premiership Analysis

A data visualisation app for tracking SPFL Premiership team performance across the season, built with React and TypeScript.

## What it does

The app presents rolling 10-game averages for every team in the league across three metrics:

- **xG difference** — non-penalty expected goals for minus against
- **Goal difference** — actual goals for minus against
- **Points per game** — rolling average points earned

### Views

**Overview** — the default view. Shows a chart (line or bar) of the selected metric for chosen teams, plus a full league stats table. The chart updates based on the metric and chart-type toggles in the header; the table always shows all three metrics side by side and can be sorted by any column.

**H2H** — head-to-head records. Select one or more teams to see their results against every opponent they've faced: games played, wins, draws, losses, points earned vs possible, and win percentage.

### Team selector

Teams can be toggled individually or filtered quickly using the Top 6 / Bottom 6 presets. Selected teams are highlighted in the chart; unselected teams are dimmed.

## Deployment

The app is deployed to GitHub Pages automatically on every push to `main` via a GitHub Actions workflow.
