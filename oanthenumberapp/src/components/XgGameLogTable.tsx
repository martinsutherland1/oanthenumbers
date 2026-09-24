import { useMemo, useState } from 'react';
import { getTeamXgGameLog, XG_TYPES, type XgType } from '../utils/dataProcessing';
import { getTeamName } from '../utils/teamColors';
import type { Fixture } from '../types';
import './XgGameLogTable.css';

interface XgGameLogTableProps {
  fixtures: Fixture[];
  team: string;
}

const fmt = (n: number) => n.toFixed(2);
const diffClass = (n: number) => (n > 0 ? 'xg-log-positive' : n < 0 ? 'xg-log-negative' : '');

export function XgGameLogTable({ fixtures, team }: XgGameLogTableProps) {
  const [metric, setMetric] = useState<XgType>('npxg');
  const games = useMemo(() => getTeamXgGameLog(fixtures, team, metric), [fixtures, team, metric]);
  const { label, description } = XG_TYPES.find(m => m.key === metric)!;

  const count = games.length;
  const avgFor = count ? games.reduce((sum, g) => sum + g.valueFor, 0) / count : 0;
  const avgAgainst = count ? games.reduce((sum, g) => sum + g.valueAgainst, 0) / count : 0;
  const avgDiff = count ? games.reduce((sum, g) => sum + g.diff, 0) / count : 0;

  return (
    <div className="xg-log-container">
      <div className="xg-log-header">
        <h3>{label} Game Log <span className="xg-log-subtitle">{description}, all games played</span></h3>
        <div className="xg-log-toggle" role="group" aria-label="xG metric">
          {XG_TYPES.map(m => (
            <button
              key={m.key}
              className={`xg-log-btn ${metric === m.key ? 'active' : ''}`}
              onClick={() => setMetric(m.key)}
              aria-pressed={metric === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="xg-log-wrapper">
        <table className="xg-log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th className="xg-log-num">{label} For</th>
              <th className="xg-log-num">{label} Against</th>
              <th className="xg-log-num">Diff</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i}>
                <td className="xg-log-date">{g.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                <td className="xg-log-opponent">
                  <span className="xg-log-venue">{g.isHome ? 'H' : 'A'}</span>
                  {getTeamName(g.opponent)}
                </td>
                <td className="xg-log-num">{fmt(g.valueFor)}</td>
                <td className="xg-log-num">{fmt(g.valueAgainst)}</td>
                <td className={`xg-log-num ${diffClass(g.diff)}`}>
                  {g.diff > 0 ? '+' : ''}{fmt(g.diff)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Average</td>
              <td className="xg-log-num">{fmt(avgFor)}</td>
              <td className="xg-log-num">{fmt(avgAgainst)}</td>
              <td className={`xg-log-num ${diffClass(avgDiff)}`}>
                {avgDiff > 0 ? '+' : ''}{fmt(avgDiff)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
