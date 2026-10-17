import { getSeriesColor, getTeamName } from '../utils/teamColors';
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
          const selectedIndex = selectedTeams.indexOf(team);
          const isSelected = selectedIndex >= 0;
          return (
            <button
              key={team}
              className={`team-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onTeamToggle(team)}
              aria-pressed={isSelected}
            >
              {/* Matches this team's line/area in the charts below */}
              {isSelected && <span className="team-chip-swatch" style={{ backgroundColor: getSeriesColor(selectedIndex) }} />}
              {getTeamName(team)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
