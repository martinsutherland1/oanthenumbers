import { useMemo } from 'react';
import { parseDate } from '../utils/dataProcessing';
import { TIP_LEAGUES } from '../utils/leagueData';
import { getTeamName } from '../utils/teamColors';
import { settleTips, successRate, tally, type LoggedTip, type SettledTip } from '../utils/tipHistory';
import tipHistory from '../data/tip_history.json';
import './BettingView.css';
import './TipsView.css';

const LABELS = Object.fromEntries(TIP_LEAGUES.map(l => [l.key, l.label]));
const RESULTS = Object.fromEntries(TIP_LEAGUES.map(l => [l.key, l.fixtures]));

const pct = (rate: number | null) => rate === null ? '–' : `${Math.round(rate * 100)}%`;

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function SummaryRow({ name, tips }: { name: string; tips: SettledTip[] }) {
  const t = tally(tips);
  return (
    <tr>
      <td>{name}</td>
      <td className="bet-num">{t.won}/{t.placed}</td>
      <td className="bet-num"><strong>{pct(successRate(t))}</strong></td>
      <td className="bet-num hide-mobile">{t.pending}</td>
    </tr>
  );
}

function SummaryTable({ title, rows }: { title: string; rows: { name: string; tips: SettledTip[] }[] }) {
  return (
    <div className="betting-section">
      <h4>{title}</h4>
      <table className="betting-table">
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th className="bet-val-col">Won</th>
            <th className="bet-val-col">Success</th>
            <th className="bet-val-col hide-mobile">Pending</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <SummaryRow key={r.name} {...r} />)}
        </tbody>
      </table>
    </div>
  );
}

export function TipHistoryView() {
  const tips = useMemo(() => settleTips(tipHistory as LoggedTip[], RESULTS), []);

  if (tips.length === 0) {
    return <p className="betting-note">No tips logged yet.</p>;
  }

  const byLeague = TIP_LEAGUES
    .map(l => ({ name: l.label, tips: tips.filter(t => t.league === l.key) }))
    .filter(r => r.tips.length > 0);
  // One group per league round, most recent first
  const byRound = new Map<string, SettledTip[]>();
  tips.forEach(t => {
    const key = `${t.league}|${t.round}`;
    byRound.set(key, [...(byRound.get(key) ?? []), t]);
  });
  const groups = [...byRound.values()]
    .map(g => g.sort((x, y) => x.date.localeCompare(y.date) || x.home.localeCompare(y.home)))
    .sort((x, y) => y[0].date.localeCompare(x[0].date));

  return (
    <div className="betting-view">
      <p className="betting-note">
        Every league's top tips are logged before kick-off and checked against the result once the match is played.
      </p>
      <SummaryTable
        title="Success Rate"
        rows={[{ name: 'All logged tips', tips }]}
      />
      <SummaryTable title="By League" rows={byLeague} />
      {groups.map((group, gi) => {
        const t = tally(group);
        return (
          <details key={`${group[0].league}|${group[0].round}`} className="betting-section tips-round" open={gi === 0}>
            <summary>
              <span className="tips-round-title">{LABELS[group[0].league]} · Round {group[0].round}</span>
              <span className="tips-round-score">
                {t.placed > 0 ? `${t.won}/${t.placed}` : 'Pending'}
              </span>
            </summary>
            <ol className="tips-top">
              {group.map(tip => (
                <li key={`${tip.home}|${tip.away}`} className="tips-top-item">
                  <span className={`tips-result tips-result-${tip.status}`} aria-label={tip.status}>
                    {tip.status === 'won' ? '✓' : tip.status === 'lost' ? '✗' : '·'}
                  </span>
                  <div className="tips-top-body">
                    <span className="tips-bet">{tip.label}</span>
                    <span className="tips-match">
                      {getTeamName(tip.home)} {tip.score ? `${tip.score.home}-${tip.score.away}` : 'v'} {getTeamName(tip.away)}
                      {' · '}{formatDate(tip.date)}
                    </span>
                  </div>
                  <div className="tips-likelihood">
                    <strong>{Math.round(tip.likelihood * 100)}%</strong>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        );
      })}
    </div>
  );
}
