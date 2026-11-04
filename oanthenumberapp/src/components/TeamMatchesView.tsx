import { useMemo } from 'react';
import { parseDate } from '../utils/dataProcessing';
import { getMatchOutcome, getTeamMatches, groupByCompetition, type CompetitionSource, type TeamMatch } from '../utils/teamMatches';
import { getTeamName } from '../utils/teamColors';
import './FixturesView.css';
import './TeamMatchesView.css';

interface TeamMatchesViewProps {
  mode: 'results' | 'fixtures';
  team: string;
  competitions: CompetitionSource[];
}

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const teamClass = (slug: string, team: string) => (slug === team ? 'team-match-self' : '');

function ResultRow({ match, team }: { match: TeamMatch; team: string }) {
  const outcome = getMatchOutcome(match, team);
  return (
    <div className="fixture-row team-match-row">
      <span className="fixture-date">
        {formatDate(match.date)}
        <span className="team-match-comp">{match.competitionLabel}</span>
      </span>
      <span className={`fixture-team fixture-home ${teamClass(match.home_team, team)}`}>{getTeamName(match.home_team)}</span>
      <span className="fixture-score">
        <strong>{match.result!.home_goals}</strong>
        <span className="fixture-dash">–</span>
        <strong>{match.result!.away_goals}</strong>
      </span>
      <span className={`fixture-team fixture-away ${teamClass(match.away_team, team)}`}>{getTeamName(match.away_team)}</span>
      {outcome && <span className={`team-match-outcome team-match-outcome-${outcome}`}>{outcome}</span>}
    </div>
  );
}

function FixtureRow({ match, team }: { match: TeamMatch; team: string }) {
  return (
    <div className="fixture-row team-match-row">
      <span className="fixture-date">
        {formatDate(match.date)}{match.time ? ` · ${match.time}` : ''}
        {match.round !== undefined && <span className="team-match-comp">Round {match.round}</span>}
      </span>
      <span className={`fixture-team fixture-home ${teamClass(match.home_team, team)}`}>{getTeamName(match.home_team)}</span>
      <span className="fixture-score">v</span>
      <span className={`fixture-team fixture-away ${teamClass(match.away_team, team)}`}>{getTeamName(match.away_team)}</span>
      <span />
    </div>
  );
}

export function TeamMatchesView({ mode, team, competitions }: TeamMatchesViewProps) {
  const { played, upcoming } = useMemo(() => getTeamMatches(team, competitions), [team, competitions]);
  const upcomingByCompetition = useMemo(() => groupByCompetition(upcoming, competitions), [upcoming, competitions]);

  if (mode === 'results') {
    return (
      <div className="fixtures-container">
        {played.length === 0 && <p className="fixtures-empty">No results yet.</p>}
        {played.length > 0 && (
          <div className="fixtures-round">
            <h4>Results · All Competitions</h4>
            {played.map(m => <ResultRow key={`${m.competition}|${m.home_team}|${m.away_team}|${m.date}`} match={m} team={team} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixtures-container">
      {upcomingByCompetition.length === 0 && <p className="fixtures-empty">No upcoming fixtures.</p>}
      {upcomingByCompetition.map(g => (
        <div key={g.competition} className="fixtures-round">
          <h4>{g.competitionLabel}</h4>
          {g.matches.map(m => <FixtureRow key={`${m.home_team}|${m.away_team}|${m.date}`} match={m} team={team} />)}
        </div>
      ))}
    </div>
  );
}
