import { useMemo, useState } from 'react';
import type { Fixture, ScheduledFixture } from '../types';
import { extractTeams, parseDate } from '../utils/dataProcessing';
import {
  createGoalProjectionContext,
  getBackdatedProjections,
  getNextRoundProjections,
  getProjectionAccuracy,
  type MatchGoalProjection,
  type TeamGoalProjection,
} from '../utils/goalProjection';
import { getTeamColor, getTeamName } from '../utils/teamColors';
import './LeagueTable.css';
import './NextFixtureProjection.css';

interface NextFixtureProjectionProps {
  fixtures: Fixture[];
  lastSeasonFixtures: Fixture[];
  schedule: ScheduledFixture[];
}

const formatDate = (date: string) =>
  parseDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const pairKey = (m: MatchGoalProjection) => `${m.home.team}|${m.away.team}`;

function TeamName({ team }: { team: string }) {
  return (
    <span className="team-cell">
      <span className="team-color-dot" style={{ backgroundColor: getTeamColor(team) }} />
      <span className="team-cell-name">{getTeamName(team)}</span>
    </span>
  );
}

function StrengthLine({ p }: { p: TeamGoalProjection }) {
  const form = p.form
    ? `Form (${p.form.games} gm): att ${p.form.attack.toFixed(2)} / def ${p.form.defence.toFixed(2)}`
    : 'Form: no games yet';
  const prior = `${p.priorBasis === 'promoted' ? 'Promoted prior' : 'Last season'}: att ${p.prior.attack.toFixed(2)} / def ${p.prior.defence.toFixed(2)}`;
  return (
    <div className="gp-strength">
      <strong>{getTeamName(p.team)}</strong>
      <span>{form}</span>
      <span>{prior}</span>
      <span>Form weight {Math.round(p.formWeight * 100)}% · H2H ×{p.h2hFactor.toFixed(2)}</span>
    </div>
  );
}

function UpcomingMatch({ m }: { m: MatchGoalProjection }) {
  return (
    <details className="gp-match">
      <summary className="gp-match-row">
        <span className="gp-date">{formatDate(m.date)}{m.time ? ` · ${m.time}` : ''}</span>
        <span className="gp-home"><TeamName team={m.home.team} /></span>
        <span className="gp-score">
          <strong>{m.home.projectedGoals.toFixed(2)}</strong>
          <span className="gp-dash">–</span>
          <strong>{m.away.projectedGoals.toFixed(2)}</strong>
        </span>
        <span className="gp-away"><TeamName team={m.away.team} /></span>
      </summary>
      <div className="gp-breakdown">
        <StrengthLine p={m.home} />
        <StrengthLine p={m.away} />
        <div className="gp-h2h">
          Last season H2H:{' '}
          {m.h2hMeetings.length === 0
            ? 'no meetings'
            : m.h2hMeetings.map(f => `${getTeamName(f.home_team)} ${f.home_goals}–${f.away_goals} ${getTeamName(f.away_team)}`).join(', ')}
        </div>
      </div>
    </details>
  );
}

export function NextFixtureProjection({ fixtures, lastSeasonFixtures, schedule }: NextFixtureProjectionProps) {
  const { upcoming, backdated, accuracy } = useMemo(() => {
    const teams = [...new Set([...extractTeams(fixtures), ...schedule.flatMap(s => [s.home_team, s.away_team])])];
    const ctx = createGoalProjectionContext(lastSeasonFixtures, teams);
    const backdated = getBackdatedProjections(ctx, fixtures, schedule);
    return {
      upcoming: getNextRoundProjections(ctx, fixtures, schedule),
      backdated,
      accuracy: getProjectionAccuracy(backdated, fixtures, lastSeasonFixtures),
    };
  }, [fixtures, lastSeasonFixtures, schedule]);

  const rounds = useMemo(
    () => [...new Set(backdated.map(m => m.round))].sort((a, b) => b - a),
    [backdated]
  );
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const round = selectedRound !== null && rounds.includes(selectedRound) ? selectedRound : rounds[0];
  const roundMatches = backdated.filter(m => m.round === round);
  const roundAccuracy = getProjectionAccuracy(roundMatches, fixtures, lastSeasonFixtures);

  return (
    <div className="gp-container">
      <div className="league-table-container">
        <h3>{upcoming.length > 0 ? `Round ${upcoming[0].round} · Projected Goals` : 'Projected Goals'}</h3>
        {upcoming.length === 0 ? (
          <p className="gp-note">No upcoming fixtures.</p>
        ) : (
          <>
            <p className="gp-note">
              Expected goals for each side, from current form (xG and goals) blended with last season's
              ratings, adjusted for home advantage and last season's head-to-heads. Tap a match for the breakdown.
            </p>
            {upcoming.map(m => <UpcomingMatch key={pairKey(m)} m={m} />)}
          </>
        )}
      </div>

      {rounds.length > 0 && (
        <div className="league-table-container">
          <div className="gp-header">
            <h3>Projection v Actual</h3>
            <select
              className="team-select"
              aria-label="Round"
              value={round}
              onChange={e => setSelectedRound(Number(e.target.value))}
            >
              {rounds.map(r => <option key={r} value={r}>Round {r}</option>)}
            </select>
          </div>
          <p className="gp-note">
            Each projection uses only results from before the match was played.
          </p>

          {accuracy && (
            <div className="gp-stats">
              <div className="gp-stat">
                <span className="gp-stat-label">Avg error (season)</span>
                <span className="gp-stat-value">{accuracy.mae.toFixed(2)}</span>
                <span className="gp-stat-sub">goals per team, {accuracy.matches} matches</span>
              </div>
              <div className="gp-stat">
                <span className="gp-stat-label">League-avg baseline</span>
                <span className="gp-stat-value">{accuracy.baselineMae.toFixed(2)}</span>
                <span className="gp-stat-sub">same, guessing the league average</span>
              </div>
              <div className="gp-stat">
                <span className="gp-stat-label">Bias</span>
                <span className="gp-stat-value">{accuracy.bias > 0 ? '+' : ''}{accuracy.bias.toFixed(2)}</span>
                <span className="gp-stat-sub">projected minus actual, per team</span>
              </div>
              {roundAccuracy && (
                <div className="gp-stat">
                  <span className="gp-stat-label">Avg error (round {round})</span>
                  <span className="gp-stat-value">{roundAccuracy.mae.toFixed(2)}</span>
                  <span className="gp-stat-sub">baseline {roundAccuracy.baselineMae.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="league-table-wrapper">
            <table className="league-table gp-table">
              <thead>
                <tr>
                  <th className="gp-col-match">Match</th>
                  <th className="gp-col-num">Proj.</th>
                  <th className="gp-col-num">Actual</th>
                  <th className="gp-col-num hide-mobile">xG</th>
                  <th className="gp-col-err">Error</th>
                </tr>
              </thead>
              <tbody>
                {roundMatches.map(m => {
                  const a = m.actual!;
                  const homeErr = m.home.projectedGoals - a.home;
                  const awayErr = m.away.projectedGoals - a.away;
                  const err = Math.abs(homeErr) + Math.abs(awayErr);
                  return (
                    <tr key={pairKey(m)}>
                      <td className="gp-col-match">
                        <div className="gp-match-teams">
                          <TeamName team={m.home.team} />
                          <TeamName team={m.away.team} />
                        </div>
                      </td>
                      <td className="gp-col-num gp-stack">
                        <span>{m.home.projectedGoals.toFixed(2)}</span>
                        <span>{m.away.projectedGoals.toFixed(2)}</span>
                      </td>
                      <td className="gp-col-num gp-stack gp-actual">
                        <span>{a.home}</span>
                        <span>{a.away}</span>
                      </td>
                      <td className="gp-col-num gp-stack hide-mobile gp-xg">
                        <span>{a.homeXg.toFixed(2)}</span>
                        <span>{a.awayXg.toFixed(2)}</span>
                      </td>
                      <td className={`gp-col-err ${err <= 1 ? 'positive' : err >= 2.5 ? 'negative' : ''}`}>
                        {err.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="gp-note gp-footnote">Error is the combined absolute difference between projected and actual goals for both sides.</p>
        </div>
      )}
    </div>
  );
}
