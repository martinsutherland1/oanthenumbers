import { ordinalSuffix, type LeagueTableRow } from '../utils/dataProcessing';
import { getTeamName } from '../utils/teamColors';
import './TeamList.css';

interface TeamListProps {
  teams: string[];
  leagueTable: LeagueTableRow[];
  onSelectTeam: (team: string) => void;
}

export function TeamList({ teams, leagueTable, onSelectTeam }: TeamListProps) {
  const rowByTeam = new Map(leagueTable.map(r => [r.team, r]));
  const sorted = [...teams].sort((a, b) => getTeamName(a).localeCompare(getTeamName(b)));

  return (
    <div className="team-list">
      {sorted.map(team => {
        const row = rowByTeam.get(team);
        return (
          <button key={team} className="team-list-tile" onClick={() => onSelectTeam(team)}>
            <span className="team-list-body">
              <span className="team-list-name">{getTeamName(team)}</span>
              {row && <span className="team-list-meta">{ordinalSuffix(row.position)} · {row.points} pts</span>}
            </span>
            <svg className="team-list-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
