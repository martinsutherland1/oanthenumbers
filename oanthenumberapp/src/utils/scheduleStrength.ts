import type { Fixture, ScheduledFixture } from '../types';
import { extractTeams, parseDate, type ScheduleModel } from './dataProcessing';
import { createFixtureGoalModel, type GoalProjectionContext } from './goalProjection';

// ---------------------------------------------------------------------------------------
// Remaining-fixture difficulty for the points projection.
//
// Each fixture is turned into expected points from the match goal model (independent Poisson
// goals: 3 x P(win) + P(draw)). For a team:
//
//   delta = mean expected points over its remaining fixtures
//         - mean expected points against every other side, home and away (a neutral schedule)
//
// so a team's own quality cancels out and only the opponents and venues left to play remain.
// The projection adds delta to the team's blended PPG for each remaining game.
// ---------------------------------------------------------------------------------------

const MAX_GOALS = 10;

function poissonPmf(mean: number): number[] {
  const pmf = [Math.exp(-mean)];
  for (let k = 1; k <= MAX_GOALS; k++) pmf.push(pmf[k - 1] * mean / k);
  return pmf;
}

// Expected points for the home side and the away side
export function expectedPoints(homeGoals: number, awayGoals: number): { home: number; away: number } {
  const h = poissonPmf(homeGoals);
  const a = poissonPmf(awayGoals);
  let win = 0;
  let draw = 0;
  let loss = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = h[i] * a[j];
      if (i > j) win += p; else if (i === j) draw += p; else loss += p;
    }
  }
  const total = win + draw + loss;
  return { home: (3 * win + draw) / total, away: (3 * loss + draw) / total };
}

const pairKey = (home: string, away: string) => `${home}|${away}`;

// Scheduled fixtures not yet played. A pairing can occur more than once (split leagues), so
// the first N scheduled meetings of a home/away pair are taken as the N already played.
function getRemainingFixtures(schedule: ScheduledFixture[], played: Fixture[]): ScheduledFixture[] {
  const playedCount = new Map<string, number>();
  played.forEach(f => {
    const key = pairKey(f.home_team, f.away_team);
    playedCount.set(key, (playedCount.get(key) ?? 0) + 1);
  });
  return [...schedule]
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .filter(s => {
      const key = pairKey(s.home_team, s.away_team);
      const n = playedCount.get(key) ?? 0;
      if (n > 0) {
        playedCount.set(key, n - 1);
        return false;
      }
      return true;
    });
}

export function createScheduleModel(goalCtx: GoalProjectionContext, schedule: ScheduledFixture[]): ScheduleModel {
  const scheduleTeams = extractTeams(schedule as unknown as Fixture[]);

  return playedFixtures => {
    const model = createFixtureGoalModel(goalCtx, playedFixtures);
    const epFor = (team: string, home: string, away: string) => {
      const goals = model(home, away);
      const ep = expectedPoints(goals.home, goals.away);
      return home === team ? ep.home : ep.away;
    };

    const remaining = getRemainingFixtures(schedule, playedFixtures);
    const result: Record<string, number> = {};
    scheduleTeams.forEach(team => {
      const mine = remaining.filter(s => s.home_team === team || s.away_team === team);
      if (mine.length === 0) return;

      let remainingEp = 0;
      mine.forEach(s => { remainingEp += epFor(team, s.home_team, s.away_team); });

      let neutralEp = 0;
      let neutralN = 0;
      scheduleTeams.forEach(opp => {
        if (opp === team) return;
        neutralEp += epFor(team, team, opp) + epFor(team, opp, team);
        neutralN += 2;
      });

      result[team] = remainingEp / mine.length - neutralEp / neutralN;
    });
    return result;
  };
}
