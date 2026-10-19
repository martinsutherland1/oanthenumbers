// Logs the current top tips to src/data/tip_history.json so their results can be tracked.
//
//   npm run log-tips
//
// Run after each data update. Tips already logged are left untouched; only tips for fixtures
// not yet in the file are added, so each tip is recorded as it stood before the match.
import { readFileSync, writeFileSync } from 'node:fs';
import { getLeagueTips, TOP_TIPS } from '../src/utils/bettingTips';
import { TIP_LEAGUES } from '../src/utils/leagueData';
import { newTipEntries, type LoggedTip } from '../src/utils/tipHistory';

const FILE = new URL('../src/data/tip_history.json', import.meta.url);

const existing: LoggedTip[] = JSON.parse(readFileSync(FILE, 'utf8'));
const leagues = TIP_LEAGUES.map(l => ({ key: l.key, tips: getLeagueTips(l.fixtures, l.lastSeasonFixtures, l.schedule) }));

const overall = leagues
  .flatMap(l => l.tips.top.map(t => ({ key: `${l.key}|${t.match.home.team}|${t.match.away.team}`, likelihood: t.bet.likelihood })))
  .sort((a, b) => b.likelihood - a.likelihood)
  .slice(0, TOP_TIPS);

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
const added = newTipEntries(existing, leagues, new Set(overall.map(o => o.key)), today);

if (added.length > 0) {
  const all = [...existing, ...added].sort((a, b) => a.date.localeCompare(b.date) || a.league.localeCompare(b.league));
  writeFileSync(FILE, JSON.stringify(all, null, 2) + '\n');
}
console.log(`Logged ${added.length} new tip${added.length === 1 ? '' : 's'} (${existing.length + added.length} total)`);
