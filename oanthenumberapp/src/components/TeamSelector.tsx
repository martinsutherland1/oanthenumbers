import { getTeamColor, getTeamName } from '../utils/teamColors';
import './TeamSelector.css';

interface TeamSelectorProps {
  teams: string[];
  selectedTeams: string[];
  onTeamToggle: (team: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function TeamSelector({ teams, selectedTeams, onTeamToggle, onSelectAll, onClearAll }: TeamSelectorProps) {
  const allSelected = selectedTeams.length === teams.length;
  return (
    <div className="team-selector">
      <div className="team-selector-header">
        <h3>Compare Teams</h3>
        <div className="team-selector-buttons">
          {!allSelected && (
            <button className="select-all-btn" onClick={onSelectAll}>
              Select All
            </button>
          )}
          {selectedTeams.length > 0 && (
            <button className="clear-btn" onClick={onClearAll}>
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="team-chips">
        {teams.map(team => {
          const isSelected = selectedTeams.includes(team);
          const teamColor = getTeamColor(team);
          return (
            <button
              key={team}
              className={`team-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onTeamToggle(team)}
              style={{
                '--team-color': teamColor,
                borderColor: isSelected ? teamColor : 'var(--border)',
                backgroundColor: isSelected ? `${teamColor}20` : 'var(--surface)'
              } as React.CSSProperties}
            >
              <span
                className="team-color-dot"
                style={{ backgroundColor: teamColor }}
              />
              {getTeamName(team)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
