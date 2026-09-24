import './HomePage.css';

export type LeagueFlag = 'scotland' | 'england';

export interface HomeLeagueTile {
  key: string;
  label: string;
  seasonLabel: string;
  flag: LeagueFlag;
}

interface HomePageProps {
  leagues: HomeLeagueTile[];
  onSelectLeague: (key: string) => void;
}

function ScotlandFlag() {
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="Scotland flag">
      <rect width="60" height="36" fill="#0065BD" />
      <path d="M0,0 L60,36 M60,0 L0,36" stroke="#FFFFFF" strokeWidth="8" />
    </svg>
  );
}

function EnglandFlag() {
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="England flag">
      <rect width="60" height="36" fill="#FFFFFF" />
      <rect x="24" width="12" height="36" fill="#CE1124" />
      <rect y="12" width="60" height="12" fill="#CE1124" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<LeagueFlag, () => JSX.Element> = {
  scotland: ScotlandFlag,
  england: EnglandFlag,
};

export function HomePage({ leagues, onSelectLeague }: HomePageProps) {
  return (
    <div className="home-page">
      <div className="home-intro">
        <h2 className="home-heading">Choose a League</h2>
        <p className="home-tagline">Tables, projections, stats and team comparisons for the season.</p>
      </div>
      <div className="home-tiles">
        {leagues.map(l => {
          const Flag = FLAG_COMPONENTS[l.flag];
          return (
            <button
              key={l.key}
              className="league-tile"
              onClick={() => onSelectLeague(l.key)}
            >
              <span className="league-tile-accent" />
              <span className="league-tile-body">
                <span className="league-tile-title-row">
                  <Flag />
                  <span className="league-tile-label">{l.label}</span>
                </span>
                {l.seasonLabel && <span className="league-tile-season">{l.seasonLabel} Season</span>}
              </span>
              <span className="league-tile-cta">Explore →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
