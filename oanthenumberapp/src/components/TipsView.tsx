import { useMemo } from 'react';
import { tipKey, type LeagueTips } from '../utils/bettingTips';
import { parseDate } from '../utils/dataProcessing';
import { getTeamName } from '../utils/teamColors';
import './LeagueTable.css';
import './BettingView.css';
import './TipsView.css';

interface TipsViewProps {
  tips: LeagueTips;
}

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const pct = (p: number) => `${Math.round(p * 100)}%`;
const signedPct = (p: number) => `${p >= 0 ? '+' : ''}${Math.round(p * 100)}%`;

function Team({ team }: { team: string }) {
  return (
    <span className="bet-team-cell">
      {getTeamName(team)}
    </span>
  );
}

export function TipsView({ tips }: TipsViewProps) {
  const { next, top, record } = tips;
  const topKeys = useMemo(() => new Set(top.map(tipKey)), [top]);

  if (next.length === 0) {
    return <p className="betting-note">No upcoming fixtures to tip.</p>;
  }

  return (
    <div className="betting-view">
      <div className="betting-section">
        <h4>Top {top.length} Tips · Round {next[0].match.round}</h4>
        <ol className="tips-top">
          {top.map((t, i) => (
            <li key={tipKey(t)} className="tips-top-item">
              <span className="tips-rank">{i + 1}</span>
              <div className="tips-top-body">
                <span className="tips-bet">{t.bet.label}</span>
                <span className="tips-match">
                  {getTeamName(t.match.home.team)} v {getTeamName(t.match.away.team)} · {formatDate(t.match.date)}
                  {t.match.time ? ` ${t.match.time}` : ''}
                </span>
              </div>
              <div className="tips-likelihood">
                <strong>{pct(t.bet.likelihood)}</strong>
                <span>fair odds {(1 / t.bet.likelihood).toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ol>
        {record.topPlaced > 0 && (
          <p className="betting-note tips-record">
            This season the top {top.length} tips each round would have landed {record.topWon} of {record.topPlaced} ({pct(record.topWon / record.topPlaced)}),
            and all fixture tips {record.allWon} of {record.allPlaced} ({pct(record.allWon / record.allPlaced)}).
          </p>
        )}
      </div>

      <div className="betting-section">
        <h4>Every Fixture</h4>
        <table className="betting-table tips-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Tip</th>
              <th className="bet-val-col">Chance</th>
              <th className="bet-val-col hide-mobile">League avg</th>
            </tr>
          </thead>
          <tbody>
            {next.map(t => (
              <tr key={tipKey(t)} className={topKeys.has(tipKey(t)) ? 'tips-row-top' : undefined}>
                <td>
                  <div className="tips-match-teams">
                    <Team team={t.match.home.team} />
                    <Team team={t.match.away.team} />
                  </div>
                  <span className="tips-proj">
                    Proj. {t.match.home.projectedGoals.toFixed(2)}–{t.match.away.projectedGoals.toFixed(2)}
                  </span>
                </td>
                <td>{topKeys.has(tipKey(t)) && <span className="tips-star" aria-label="Top tip">★ </span>}{t.bet.label}</td>
                <td className="bet-num">{pct(t.bet.likelihood)}</td>
                <td className="bet-num hide-mobile">
                  {pct(t.bet.baseRate)} <span className="tips-edge">({signedPct(t.bet.edge)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="betting-note">
        Chances come from each side's projected goals (current form blended with last season), turned into
        scoreline probabilities. Each fixture's tip is the bet that beats its league average by the most,
        among bets more likely than not; the top {top.length} are the most likely of those. League avg is how
        often that bet landed across last season and this season so far. Fair odds are 1 ÷ chance, so only
        back a tip at bigger odds than that.
      </p>
    </div>
  );
}
