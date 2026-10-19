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

  const total = tally(tips);
  const byLeague = TIP_LEAGUES
    .map(l => ({ name: l.label, tips: tips.filter(t => t.league === l.key) }))
    .filter(r => r.tips.length > 0);
  const recent = [...tips].sort((a, b) => b.date.localeCompare(a.date) || a.league.localeCompare(b.league));

  return (
    <div className="betting-view">
      <p className="betting-note">
        Every league's top tips are logged before kick-off and checked against the result once the match is played.
      </p>
      <SummaryTable
        title="Success Rate"
        rows={[
          { name: 'All logged tips', tips },
          { name: 'Top 4 overall', tips: tips.filter(t => t.overall) },
        ]}
      />
      <p className="betting-note tips-record">
        {total.placed > 0
          ? `${total.won} of ${total.placed} settled tips have landed (${pct(successRate(total))}); ${total.pending} awaiting a result.`
          : `${total.pending} tips awaiting results.`}
      </p>
      <SummaryTable title="By League" rows={byLeague} />
      <div className="betting-section">
        <h4>All Tips</h4>
        <ol className="tips-top">
          {recent.map(t => (
            <li key={`${t.league}|${t.round}|${t.home}|${t.away}`} className="tips-top-item">
              <span className={`tips-result tips-result-${t.status}`} aria-label={t.status}>
                {t.status === 'won' ? '✓' : t.status === 'lost' ? '✗' : '·'}
              </span>
              <div className="tips-top-body">
                <span className="tips-bet">{t.label}</span>
                <span className="tips-match">
                  {getTeamName(t.home)} {t.score ? `${t.score.home}-${t.score.away}` : 'v'} {getTeamName(t.away)}
                  {' · '}{LABELS[t.league]} · {formatDate(t.date)}
                </span>
              </div>
              <div className="tips-likelihood">
                <strong>{Math.round(t.likelihood * 100)}%</strong>
                <span>{t.overall ? 'top 4' : 'league top 4'}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
