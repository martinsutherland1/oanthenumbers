import { useEffect, useMemo, useState } from 'react';
import { getTeamHighlightStats, type TeamHighlightStats } from '../utils/dataProcessing';
import type { Fixture } from '../types';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './LeagueHighlights.css';

interface LeagueHighlightsProps {
  fixtures: Fixture[];
}

interface Metric {
  label: string;
  key: keyof Omit<TeamHighlightStats, 'team'>;
  lowerIsBetter?: boolean;
  decimals?: number;
}

interface Group {
  title: string;
  metrics: Metric[];
}

const GROUPS: Group[] = [
  {
    title: 'Best Attack',
    metrics: [
      { label: 'Goals For P90', key: 'goalsForP90', decimals: 2 },
      { label: 'xG P90', key: 'xgP90', decimals: 2 },
    ],
  },
  {
    title: 'Best Defence',
    metrics: [
      { label: 'Goals Against P90', key: 'goalsAgainstP90', lowerIsBetter: true, decimals: 2 },
      { label: 'xG Against P90', key: 'xgAgainstP90', lowerIsBetter: true, decimals: 2 },
    ],
  },
  {
    title: 'Best Set Play',
    metrics: [{ label: 'xG Set Play P90', key: 'xgSetPlayP90', decimals: 2 }],
  },
  {
    title: 'Winning Streaks',
    metrics: [
      { label: 'Current', key: 'currentWinStreak' },
      { label: 'Best', key: 'bestWinStreak' },
    ],
  },
  {
    title: 'Undefeated Streaks',
    metrics: [
      { label: 'Current', key: 'currentUnbeatenStreak' },
      { label: 'Best', key: 'bestUnbeatenStreak' },
    ],
  },
];

function findBest(stats: TeamHighlightStats[], metric: Metric): { teams: string[]; value: number } | null {
  if (stats.length === 0) return null;
  const sign = metric.lowerIsBetter ? -1 : 1;
  const eps = 1e-9;
  const bestValue = stats.reduce((acc, s) => (sign * s[metric.key] > sign * acc ? s[metric.key] : acc), stats[0][metric.key]);
  const teams = stats.filter(s => Math.abs(s[metric.key] - bestValue) < eps).map(s => s.team);
  return { teams, value: bestValue };
}

interface DetailTarget {
  group: Group;
  metric: Metric;
}

const formatValue = (value: number, metric: Metric) =>
  metric.decimals !== undefined ? value.toFixed(metric.decimals) : String(value);

function HighlightDetailModal({ group, metric, stats, onClose }: DetailTarget & { stats: TeamHighlightStats[]; onClose: () => void }) {
  const [sortMetric, setSortMetric] = useState<Metric>(metric);
  // null direction = best first
  const [reversed, setReversed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = useMemo(() => {
    const sign = sortMetric.lowerIsBetter ? 1 : -1;
    return [...stats].sort((a, b) => {
      const diff = sign * (a[sortMetric.key] - b[sortMetric.key]);
      return (reversed ? -diff : diff) || getTeamName(a.team).localeCompare(getTeamName(b.team));
    });
  }, [stats, sortMetric, reversed]);

  const handleSort = (m: Metric) => {
    if (m.key === sortMetric.key) setReversed(r => !r);
    else { setSortMetric(m); setReversed(false); }
  };

  return (
    <div className="highlight-modal-backdrop" onClick={onClose}>
      <div className="highlight-modal" role="dialog" aria-modal="true" aria-label={group.title} onClick={e => e.stopPropagation()}>
        <div className="highlight-modal-header">
          <h3>{group.title}</h3>
          <button className="highlight-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="highlight-modal-body">
          <table className="highlight-modal-table">
            <thead>
              <tr>
                <th className="highlight-rank-col">#</th>
                <th>Team</th>
                {group.metrics.map(m => (
                  <th
                    key={m.key}
                    className={`highlight-sortable${m.key === sortMetric.key ? ' highlight-sort-active' : ''}`}
                    onClick={() => handleSort(m)}
                  >
                    {m.label}
                    {m.key === sortMetric.key ? (sortMetric.lowerIsBetter !== reversed ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.team}>
                  <td className="highlight-rank-col">{i + 1}</td>
                  <td>
                    <span className="highlight-team">
                      <span className="team-color-dot" style={{ backgroundColor: getTeamColor(row.team) }} />
                      <span className="highlight-team-name">{getTeamName(row.team)}</span>
                    </span>
                  </td>
                  {group.metrics.map(m => (
                    <td key={m.key} className={`highlight-num${m.key === sortMetric.key ? ' highlight-sort-active' : ''}`}>
                      {formatValue(row[m.key], m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function LeagueHighlights({ fixtures }: LeagueHighlightsProps) {
  const stats = useMemo(() => getTeamHighlightStats(fixtures), [fixtures]);
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  return (
    <div className="league-highlights">
      {GROUPS.map(group => (
        <div key={group.title} className="highlight-group">
          <h3>{group.title}</h3>
          <div className="highlight-tiles">
            {group.metrics.map(metric => {
              const best = findBest(stats, metric);
              if (!best) return null;
              const value = formatValue(best.value, metric);
              return (
                <div key={metric.key} className="highlight-tile">
                  <button
                    className="highlight-info-btn"
                    onClick={() => setDetail({ group, metric })}
                    aria-label={`Show all teams ranked by ${metric.label}`}
                    title="See full ranking"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="15" y2="12" />
                      <line x1="4" y1="18" x2="10" y2="18" />
                    </svg>
                  </button>
                  <span className="highlight-label">{metric.label}</span>
                  <span className="highlight-value">{value}</span>
                  <div className="highlight-teams">
                    {best.teams.map(team => (
                      <span key={team} className="highlight-team">
                        <span className="team-color-dot" style={{ backgroundColor: getTeamColor(team) }} />
                        <span className="highlight-team-name">{getTeamName(team)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {detail && <HighlightDetailModal {...detail} stats={stats} onClose={() => setDetail(null)} />}
    </div>
  );
}
