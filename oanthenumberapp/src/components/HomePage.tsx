import logoMark from '../assets/logo-mark.png';
import './HomePage.css';

export type LeagueFlag = 'scotland' | 'england' | 'spain' | 'germany' | 'italy' | 'france' | 'europe';

export interface HomeLeagueTile {
  key: string;
  label: string;
  seasonLabel: string;
  flag: LeagueFlag;
}

interface HomePageProps {
  leagues: HomeLeagueTile[];
  onSelectLeague: (key: string) => void;
  onShowTips: () => void;
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

function SpainFlag() {
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="Spain flag">
      <rect width="60" height="36" fill="#AA151B" />
      <rect y="9" width="60" height="18" fill="#F1BF00" />
    </svg>
  );
}

function GermanyFlag() {
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="Germany flag">
      <rect width="60" height="12" fill="#000000" />
      <rect y="12" width="60" height="12" fill="#DD0000" />
      <rect y="24" width="60" height="12" fill="#FFCE00" />
    </svg>
  );
}

function ItalyFlag() {
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="Italy flag">
      <rect width="20" height="36" fill="#009246" />
      <rect x="20" width="20" height="36" fill="#FFFFFF" />
      <rect x="40" width="20" height="36" fill="#CE2B37" />
    </svg>
  );
}

function FranceFlag() {
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="France flag">
      <rect width="20" height="36" fill="#0055A4" />
      <rect x="20" width="20" height="36" fill="#FFFFFF" />
      <rect x="40" width="20" height="36" fill="#EF4135" />
    </svg>
  );
}

function EuropeFlag() {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return <circle key={i} cx={30 + 11 * Math.sin(a)} cy={18 - 11 * Math.cos(a)} r="1.6" fill="#FFCC00" />;
  });
  return (
    <svg className="league-tile-flag" viewBox="0 0 60 36" role="img" aria-label="Europe flag">
      <rect width="60" height="36" fill="#003399" />
      {stars}
    </svg>
  );
}

const FLAG_COMPONENTS: Record<LeagueFlag, () => JSX.Element> = {
  scotland: ScotlandFlag,
  england: EnglandFlag,
  spain: SpainFlag,
  germany: GermanyFlag,
  italy: ItalyFlag,
  france: FranceFlag,
  europe: EuropeFlag,
};

function LeagueTile({ league, onSelect }: { league: HomeLeagueTile; onSelect: (key: string) => void }) {
  const Flag = FLAG_COMPONENTS[league.flag];
  return (
    <button className="league-tile" onClick={() => onSelect(league.key)}>
      <Flag />
      <span className="league-tile-body">
        <span className="league-tile-label">{league.label}</span>
        {league.seasonLabel && <span className="league-tile-season">{league.seasonLabel} season</span>}
      </span>
      <svg className="league-tile-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </button>
  );
}

export function HomePage({ leagues, onSelectLeague, onShowTips }: HomePageProps) {
  const domestic = leagues.filter(l => l.flag !== 'europe');
  const european = leagues.filter(l => l.flag === 'europe');
  return (
    <div className="home-page">
      <section className="home-hero">
        <img className="home-hero-mark" src={logoMark} alt="" />
        <h2 className="home-heading">
          oanthe<span className="home-heading-accent">numbers</span>
        </h2>
        <p className="home-tagline">Tables, projections, xG and team comparisons across Europe&rsquo;s top competitions.</p>
      </section>

      <button className="home-tips-card" onClick={onShowTips}>
        <span className="home-tips-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="20" x2="6" y2="14" />
            <line x1="12" y1="20" x2="12" y2="9" />
            <line x1="18" y1="20" x2="18" y2="4" />
          </svg>
        </span>
        <span className="home-tips-text">
          <span className="home-tips-title">Betting tips</span>
          <span className="home-tips-sub">Picks for the next round of fixtures, across every domestic league</span>
        </span>
        <span className="home-tips-cta">View tips →</span>
      </button>

      <section className="home-group">
        <h3 className="home-group-title">Domestic leagues</h3>
        <div className="home-tiles">
          {domestic.map(l => <LeagueTile key={l.key} league={l} onSelect={onSelectLeague} />)}
        </div>
      </section>

      {european.length > 0 && (
        <section className="home-group">
          <h3 className="home-group-title">European competitions</h3>
          <div className="home-tiles">
            {european.map(l => <LeagueTile key={l.key} league={l} onSelect={onSelectLeague} />)}
          </div>
        </section>
      )}
    </div>
  );
}
