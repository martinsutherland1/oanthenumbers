import { useMemo, useState } from 'react';
import type { Fixture } from '../types';
import {
  XG_TYPES,
  getH2HData,
  getTeamSeasonStats,
  getTeamXgTotals,
  getTeamXPointsTotals,
  parseDate,
  type H2HRecord,
} from '../utils/dataProcessing';
import { getSeriesColor, getTeamName } from '../utils/teamColors';
import { TeamSelector } from './TeamSelector';
import { ViewToggle } from './ViewToggle';
import './H2HView.css';

interface H2HViewProps {
  fixtures: Fixture[];
  teams: string[];
}

type H2HTab = 'stats' | 'results';

interface MetricRow {
  label: string;
  note?: string;
  a: number;
  b: number;
  decimals: number;
  signed?: boolean;
}

const fmt = (n: number, decimals: number, signed?: boolean) =>
  `${signed && n > 0 ? '+' : ''}${n.toFixed(decimals)}`;

function StatsComparison({ fixtures, teamA, teamB }: { fixtures: Fixture[]; teamA: string; teamB: string }) {
  const rows = useMemo<MetricRow[]>(() => {
    // Every figure is per game, which equals per 90 minutes in league football
    const season = getTeamSeasonStats(fixtures);
    const xPoints = getTeamXPointsTotals(fixtures);
    const sA = season.find(s => s.team === teamA);
    const sB = season.find(s => s.team === teamB);
    const xpA = xPoints.find(s => s.team === teamA);
    const xpB = xPoints.find(s => s.team === teamB);

    const out: MetricRow[] = [
      { label: 'Points P90', a: sA?.pointsPerGame ?? 0, b: sB?.pointsPerGame ?? 0, decimals: 2 },
      { label: 'xPoints P90', a: xpA?.perGame ?? 0, b: xpB?.perGame ?? 0, decimals: 2 },
      { label: 'Goals P90', a: sA?.goalsPerGame ?? 0, b: sB?.goalsPerGame ?? 0, decimals: 2 },
    ];
    XG_TYPES.forEach(t => {
      const totals = getTeamXgTotals(fixtures, t.key);
      out.push({
        label: `${t.label} P90`,
        note: t.description,
        a: totals.find(x => x.team === teamA)?.perGame ?? 0,
        b: totals.find(x => x.team === teamB)?.perGame ?? 0,
        decimals: 2,
      });
    });
    out.push({
      label: 'xG Difference P90',
      note: 'NPxG for minus against',
      a: sA?.xgDiffPerGame ?? 0,
      b: sB?.xgDiffPerGame ?? 0,
      decimals: 2,
      signed: true,
    });
    return out;
  }, [fixtures, teamA, teamB]);

  const gamesA = useMemo(() => fixtures.filter(f => f.home_team === teamA || f.away_team === teamA).length, [fixtures, teamA]);
  const gamesB = useMemo(() => fixtures.filter(f => f.home_team === teamB || f.away_team === teamB).length, [fixtures, teamB]);

  return (
    <div className="h2h-card">
      <table className="h2h-compare-table">
        <thead>
          <tr>
            <th className="h2h-compare-team" style={{ color: getSeriesColor(0) }}>{getTeamName(teamA)}</th>
            <th className="h2h-compare-metric">Season</th>
            <th className="h2h-compare-team" style={{ color: getSeriesColor(1) }}>{getTeamName(teamB)}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h2h-compare-games">
            <td>{gamesA}</td>
            <td className="h2h-compare-metric">Games played</td>
            <td>{gamesB}</td>
          </tr>
          {rows.map(row => {
            const aWins = row.a > row.b;
            const bWins = row.b > row.a;
            return (
              <tr key={row.label}>
                <td className={aWins ? 'h2h-better' : ''}>{fmt(row.a, row.decimals, row.signed)}</td>
                <td className="h2h-compare-metric">
                  {row.label}
                  {row.note && <span className="h2h-compare-note">{row.note}</span>}
                </td>
                <td className={bWins ? 'h2h-better' : ''}>{fmt(row.b, row.decimals, row.signed)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="h2h-footnote">P90 = per 90 minutes (per game). Highlighted value is the higher of the two.</p>
    </div>
  );
}

function RecordRow({ team, record, color }: { team: string; record: H2HRecord | undefined; color: string }) {
  const r = record;
  return (
    <tr>
      <td className="h2h-results-team">
        <span className="h2h-swatch" style={{ backgroundColor: color }} />
        {getTeamName(team)}
      </td>
      <td>{r?.played ?? 0}</td>
      <td className="h2h-win">{r?.wins ?? 0}</td>
      <td className="h2h-draw">{r?.draws ?? 0}</td>
      <td className="h2h-loss">{r?.losses ?? 0}</td>
      <td>{r?.goalsFor ?? 0}</td>
      <td>{r?.goalsAgainst ?? 0}</td>
      <td className="h2h-pts">{r?.points ?? 0}</td>
    </tr>
  );
}

function ResultsComparison({ fixtures, teamA, teamB }: { fixtures: Fixture[]; teamA: string; teamB: string }) {
  const recordA = useMemo(() => getH2HData(fixtures, teamA).find(r => r.opponent === teamB), [fixtures, teamA, teamB]);
  const recordB = useMemo(() => getH2HData(fixtures, teamB).find(r => r.opponent === teamA), [fixtures, teamA, teamB]);
  const meetings = useMemo(
    () => fixtures
      .filter(f => (f.home_team === teamA && f.away_team === teamB) || (f.home_team === teamB && f.away_team === teamA))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()),
    [fixtures, teamA, teamB]
  );

  return (
    <>
      <div className="h2h-card">
        <h4 className="h2h-card-title">Head to head <span className="h2h-compare-note">this season</span></h4>
        <div className="h2h-scroll">
          <table className="h2h-results-table">
            <thead>
              <tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr>
            </thead>
            <tbody>
              <RecordRow team={teamA} record={recordA} color={getSeriesColor(0)} />
              <RecordRow team={teamB} record={recordB} color={getSeriesColor(1)} />
            </tbody>
          </table>
        </div>
      </div>

      <div className="h2h-card">
        <h4 className="h2h-card-title">Results <span className="h2h-compare-note">this season</span></h4>
        {meetings.length === 0 ? (
          <p className="h2h-empty-inline">These teams haven&rsquo;t met yet this season.</p>
        ) : (
          <div className="h2h-scroll">
            <table className="h2h-results-table h2h-meetings">
              <thead>
                <tr><th>Date</th><th className="h2h-right">Home</th><th className="h2h-score-col">Score</th><th>Away</th><th className="h2h-num-col">xG</th></tr>
              </thead>
              <tbody>
                {meetings.map(f => (
                  <tr key={`${f.date}-${f.home_team}-${f.away_team}`}>
                    <td className="h2h-date">{parseDate(f.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="h2h-right" style={{ color: f.home_team === teamA ? getSeriesColor(0) : getSeriesColor(1) }}>{getTeamName(f.home_team)}</td>
                    <td className="h2h-score">{f.home_goals} – {f.away_goals}</td>
                    <td style={{ color: f.away_team === teamA ? getSeriesColor(0) : getSeriesColor(1) }}>{getTeamName(f.away_team)}</td>
                    <td className="h2h-num-col">{Number(f.home_xG).toFixed(2)} – {Number(f.away_xG).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function H2HView({ fixtures, teams }: H2HViewProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<H2HTab>('stats');

  // Two teams at most: picking a third replaces the earliest pick
  const handleToggle = (team: string) => {
    setSelected(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team].slice(-2));
  };

  const [teamA, teamB] = selected;
  const ready = selected.length === 2;

  return (
    <div className="h2h-view">
      <TeamSelector
        title="Select two teams"
        teams={teams}
        selectedTeams={selected}
        onTeamToggle={handleToggle}
        onSelectAll={() => undefined}
        onClearAll={() => setSelected([])}
        showSelectAll={false}
      />

      <div className="h2h-controls">
        <ViewToggle
          ariaLabel="Head to head view"
          options={[{ key: 'stats', label: 'Stats' }, { key: 'results', label: 'Results' }]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {!ready && <p className="h2h-empty">Select two teams to compare them head to head.</p>}
      {ready && tab === 'stats' && <StatsComparison fixtures={fixtures} teamA={teamA} teamB={teamB} />}
      {ready && tab === 'results' && <ResultsComparison fixtures={fixtures} teamA={teamA} teamB={teamB} />}
    </div>
  );
}
