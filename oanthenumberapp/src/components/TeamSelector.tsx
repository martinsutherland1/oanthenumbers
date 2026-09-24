import { getTeamColor, getTeamName, TOP_6, BOTTOM_6 } from '../utils/teamColors';
import './TeamSelector.css';

interface TeamSelectorProps {
  teams: string[];
  selectedTeams: string[];
  onTeamToggle: (team: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectTop6: () => void;
  onSelectBottom6: () => void;
}

export function TeamSelector({ teams, selectedTeams, onTeamToggle, onSelectAll, onClearAll, onSelectTop6, onSelectBottom6 }: TeamSelectorProps) {
  const allSelected = selectedTeams.length === teams.length;
  const top6InData = TOP_6.filter(t => teams.includes(t));
  const bottom6InData = BOTTOM_6.filter(t => teams.includes(t));

  const isTop6Selected = top6InData.length > 0 &&
    top6InData.every(t => selectedTeams.includes(t)) &&
    selectedTeams.length === top6InData.length;

  const isBottom6Selected = bottom6InData.length > 0 &&
    bottom6InData.every(t => selectedTeams.includes(t)) &&
    selectedTeams.length === bottom6InData.length;

  return (
    <div className="team-selector">
      <div className="team-selector-header">
        <h3>Compare Teams</h3>
        <div className="team-selector-buttons">
          <button
            className={`quick-select-btn${isTop6Selected ? ' active' : ''}`}
            onClick={onSelectTop6}
          >
            Top 6
          </button>
          <button
            className={`quick-select-btn${isBottom6Selected ? ' active' : ''}`}
            onClick={onSelectBottom6}
          >
            Bottom 6
          </button>
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
