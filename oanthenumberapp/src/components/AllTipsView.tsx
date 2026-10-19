import { useState } from 'react';
import { TOP_TIPS, tipKey, type FixtureTip, type LeagueTips } from '../utils/bettingTips';
import { parseDate } from '../utils/dataProcessing';
import { getTeamName } from '../utils/teamColors';
import { TipHistoryView } from './TipHistoryView';
import './LeagueTable.css';
import './BettingView.css';
import './TipsView.css';

export interface LeagueTipsEntry {
  key: string;
  label: string;
  tips: LeagueTips;
}

interface AllTipsViewProps {
  leagues: LeagueTipsEntry[];
  onBack: () => void;
  onSelectLeague: (key: string) => void;
}

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function TipItem({ tip, rank, league }: { tip: FixtureTip; rank: number; league?: string }) {
  return (
    <li className="tips-top-item">
      <span className="tips-rank">{rank}</span>
      <div className="tips-top-body">
        <span className="tips-bet">{tip.bet.label}</span>
        <span className="tips-match">
          {getTeamName(tip.match.home.team)} v {getTeamName(tip.match.away.team)}
          {league ? ` · ${league}` : ''} · {formatDate(tip.match.date)}
          {tip.match.time ? ` ${tip.match.time}` : ''}
        </span>
      </div>
      <div className="tips-likelihood">
        <strong>{Math.round(tip.bet.likelihood * 100)}%</strong>
        <span>fair odds {(1 / tip.bet.likelihood).toFixed(2)}</span>
      </div>
    </li>
  );
}

type TipsTab = 'tips' | 'history';

export function AllTipsView({ leagues, onBack, onSelectLeague }: AllTipsViewProps) {
  const [tab, setTab] = useState<TipsTab>('tips');
  // Each league's top 4 pooled, then the 4 most likely overall
  const overall = leagues
    .flatMap(l => l.tips.top.map(tip => ({ tip, league: l.label })))
    .sort((a, b) => b.tip.bet.likelihood - a.tip.bet.likelihood)
    .slice(0, TOP_TIPS);
  const overallKeys = new Set(overall.map(o => tipKey(o.tip)));
  const pool = leagues.flatMap(l => l.tips.top.map(tip => ({ tip, league: l.label })))
    .sort((a, b) => b.tip.bet.likelihood - a.tip.bet.likelihood);

  return (
    <div className="betting-view">
      <div className="all-tips-header">
        <button className="home-back-btn" onClick={onBack}>← Leagues</button>
        <h3>Top Tips · All Leagues</h3>
      </div>
      <div className="view-tabs secondary-tabs tips-tabs">
        <button className={`view-tab ${tab === 'tips' ? 'active' : ''}`} onClick={() => setTab('tips')}>Tips</button>
        <button className={`view-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>
      {tab === 'history' && <TipHistoryView />}
      {tab === 'tips' && <>
      <p className="betting-note">
        The four most likely tips from each league's next round, then the best four of those overall. Open a league's Analysis &gt; Tips for every fixture.
      </p>
      {pool.length > 0 && (
        <div className="betting-section">
          <h4>Top {overall.length} Across All Leagues</h4>
          <ol className="tips-top">
            {overall.map(({ tip, league }, i) => (
              <TipItem key={tipKey(tip)} tip={tip} rank={i + 1} league={league} />
            ))}
          </ol>
          <details className="all-tips-pool">
            <summary>All {pool.length} league tips ranked</summary>
            <div className="league-table-wrapper">
              <table className="betting-table tips-table">
                <thead>
                  <tr>
                    <th className="bet-rank-col">#</th>
                    <th>Tip</th>
                    <th className="bet-val-col">Chance</th>
                  </tr>
                </thead>
                <tbody>
                  {pool.map(({ tip, league }, i) => (
                    <tr key={tipKey(tip)} className={overallKeys.has(tipKey(tip)) ? 'tips-row-top' : undefined}>
                      <td className="bet-rank">{i + 1}</td>
                      <td>
                        {tip.bet.label}
                        <div className="tips-match">
                          {getTeamName(tip.match.home.team)} v {getTeamName(tip.match.away.team)} · {league}
                        </div>
                      </td>
                      <td className="bet-num">{Math.round(tip.bet.likelihood * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
      {leagues.map(l => (
        <div key={l.key} className="betting-section">
          <h4>
            <button className="all-tips-link" onClick={() => onSelectLeague(l.key)}>{l.label}</button>
            {l.tips.top.length > 0 && <span className="all-tips-league"> · Round {l.tips.top[0].match.round}</span>}
          </h4>
          {l.tips.top.length === 0 ? (
            <p className="betting-note">No upcoming fixtures.</p>
          ) : (
            <ol className="tips-top">
              {l.tips.top.map((t, i) => (
                <TipItem key={tipKey(t)} tip={t} rank={i + 1} />
              ))}
            </ol>
          )}
        </div>
      ))}
      </>}
    </div>
  );
}
