import type { LeagueTableRow } from '../utils/dataProcessing';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './TeamHeader.css';

interface TeamHeaderProps {
  team: string;
  leagueRow?: LeagueTableRow;
}

export function TeamHeader({ team, leagueRow }: TeamHeaderProps) {
  return (
    <div className="team-header-card">
      <div className="team-header-avatar" style={{ backgroundColor: getTeamColor(team) }}>
        {getTeamName(team).charAt(0)}
      </div>
      <div>
        <h2 className="team-header-name">{getTeamName(team)}</h2>
        <p className="team-header-meta">
          {leagueRow
            ? `League position ${leagueRow.position} · ${leagueRow.points} pts · ${leagueRow.played} played`
            : 'No games played yet'}
        </p>
      </div>
    </div>
  );
}
