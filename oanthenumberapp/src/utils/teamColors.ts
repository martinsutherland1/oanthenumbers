// Aliases that map alternate spellings to canonical team slugs
export const TEAM_ALIASES: Record<string, string> = {
  'dundee': 'dundee-fc',
  'dundee utd': 'dundee-united',
  'st mirren': 'st-mirren',
  'hearts': 'heart-midlothian',
};

export function normalizeTeamName(name: string): string {
  return TEAM_ALIASES[name] ?? name;
}

// Display names for team slugs
export const TEAM_NAMES: Record<string, string> = {
  'aberdeen': 'Aberdeen',
  'celtic': 'Celtic',
  'dundee-fc': 'Dundee FC',
  'dundee-united': 'Dundee Utd',
  'falkirk': 'Falkirk',
  'heart-midlothian': 'Hearts',
  'hibernian': 'Hibernian',
  'kilmarnock': 'Kilmarnock',
  'livingston': 'Livingston',
  'motherwell': 'Motherwell',
  'rangers': 'Rangers',
  'st-mirren': 'St. Mirren',
  'ross-county': 'Ross County',
  'st-johnstone': 'St. Johnstone',
  'partick-thistle': 'Partick Thistle',

  // EPL
  'arsenal': 'Arsenal',
  'aston-villa': 'Aston Villa',
  'afc-bournemouth': 'Bournemouth',
  'brentford': 'Brentford',
  'brighton-hove-albion': 'Brighton',
  'burnley': 'Burnley',
  'chelsea': 'Chelsea',
  'crystal-palace': 'Crystal Palace',
  'everton': 'Everton',
  'fulham': 'Fulham',
  'leeds-united': 'Leeds',
  'liverpool': 'Liverpool',
  'manchester-city': 'Man City',
  'manchester-united': 'Man Utd',
  'newcastle-united': 'Newcastle',
  'nottingham-forest': "Nott'm Forest",
  'sunderland': 'Sunderland',
  'tottenham-hotspur': 'Tottenham',
  'west-ham-united': 'West Ham',
  'wolverhampton-wanderers': 'Wolves',
  'coventry-city': 'Coventry',
  'hull-city': 'Hull',
  'ipswich-town': 'Ipswich',

  // La Liga
  'alaves': 'Alavés',
  'athletic-club': 'Athletic Club',
  'atletico-madrid': 'Atlético Madrid',
  'barcelona': 'Barcelona',
  'celta-vigo': 'Celta Vigo',
  'elche': 'Elche',
  'espanyol': 'Espanyol',
  'getafe': 'Getafe',
  'girona': 'Girona',
  'levante': 'Levante',
  'mallorca': 'Mallorca',
  'osasuna': 'Osasuna',
  'rayo-vallecano': 'Rayo Vallecano',
  'real-betis': 'Real Betis',
  'real-madrid': 'Real Madrid',
  'real-oviedo': 'Real Oviedo',
  'real-sociedad': 'Real Sociedad',
  'sevilla': 'Sevilla',
  'valencia': 'Valencia',
  'villarreal': 'Villarreal',
  'racing-santander': 'Racing Santander',
  'deportivo-coruna': 'Deportivo',
  'malaga': 'Málaga',

  // Bundesliga
  'augsburg': 'FC Augsburg',
  'bayer-leverkusen': 'Leverkusen',
  'bayern-munchen': 'Bayern Munich',
  'borussia-dortmund': 'Dortmund',
  'borussia-monchengladbach': "M'gladbach",
  'eintracht-frankfurt': 'Frankfurt',
  'elversberg': 'Elversberg',
  'freiburg': 'Freiburg',
  'hamburger-sv': 'Hamburg',
  'heidenheim': 'Heidenheim',
  'hoffenheim': 'Hoffenheim',
  'koln': 'Köln',
  'mainz': 'Mainz',
  'paderborn': 'Paderborn',
  'rb-leipzig': 'RB Leipzig',
  'schalke': 'Schalke',
  'st-pauli': 'St. Pauli',
  'stuttgart': 'Stuttgart',
  'union-berlin': 'Union Berlin',
  'werder-bremen': 'Werder Bremen',
  'wolfsburg': 'Wolfsburg',
};

export function getTeamName(team: string): string {
  return TEAM_NAMES[team] || team;
}

// Top 6 and bottom 6 team slugs
export const TOP_6 = ['hearts', 'rangers', 'celtic', 'motherwell', 'hibernian', 'falkirk'];
export const BOTTOM_6 = ['aberdeen', 'dundee-fc', 'dundee-united', 'kilmarnock', 'livingston', 'st-mirren'];

// SPFL Premiership team colors - accurate club colors
export const TEAM_COLORS: Record<string, string> = {
  'aberdeen': '#DC2626',
  'celtic': '#10B981',
  'dundee-fc': '#1E3A8A',
  'dundee-united': '#F97316',
  'heart-midlothian': '#7F1D1D',
  'hibernian': '#22C55E',
  'kilmarnock': '#3B82F6',
  'livingston': '#FACC15',
  'motherwell': '#991B1B',
  'rangers': '#1D4ED8',
  'st-mirren': '#171717',
  'falkirk': '#1E3A5F',
  'ross-county': '#1E40AF',
  'st-johnstone': '#2563EB',
  'partick-thistle': '#EF4444',

  // EPL - accurate club colors
  'arsenal': '#EF0107',
  'aston-villa': '#670E36',
  'afc-bournemouth': '#B91C1C',
  'brentford': '#E30613',
  'brighton-hove-albion': '#0057B8',
  'burnley': '#8A2244',
  'chelsea': '#034694',
  'crystal-palace': '#1B458F',
  'everton': '#003399',
  'fulham': '#FFFFFF',
  'leeds-united': '#FFFFFF',
  'liverpool': '#C8102E',
  'manchester-city': '#6CABDD',
  'manchester-united': '#DA020E',
  'newcastle-united': '#000000',
  'nottingham-forest': '#DD0000',
  'sunderland': '#EB172B',
  'tottenham-hotspur': '#FFFFFF',
  'west-ham-united': '#7A263A',
  'wolverhampton-wanderers': '#FDB913',
  'coventry-city': '#5BA4CF',
  'hull-city': '#F5A20A',
  'ipswich-town': '#3A64A3',

  // La Liga
  'alaves': '#1E5AA8',
  'athletic-club': '#EE2523',
  'atletico-madrid': '#CB3524',
  'barcelona': '#A50044',
  'celta-vigo': '#8AC3EE',
  'elche': '#2E8B57',
  'espanyol': '#007FC8',
  'getafe': '#6A3E9C',
  'girona': '#CD2534',
  'levante': '#B4053F',
  'mallorca': '#E20613',
  'osasuna': '#8B0000',
  'rayo-vallecano': '#FFFFFF',
  'real-betis': '#00954C',
  'real-madrid': '#F5F5F5',
  'real-oviedo': '#0033A0',
  'real-sociedad': '#0067B1',
  'sevilla': '#D71920',
  'valencia': '#FF8200',
  'villarreal': '#FFE114',
  'racing-santander': '#0B8043',
  'deportivo-coruna': '#0057B8',
  'malaga': '#0094D8',

  // Bundesliga
  'augsburg': '#BA3733',
  'bayer-leverkusen': '#E32221',
  'bayern-munchen': '#DC052D',
  'borussia-dortmund': '#FDE100',
  'borussia-monchengladbach': '#2E8B57',
  'eintracht-frankfurt': '#E1000F',
  'elversberg': '#1B1B1B',
  'freiburg': '#D0202E',
  'hamburger-sv': '#0A3A8C',
  'heidenheim': '#E2001A',
  'hoffenheim': '#1961B5',
  'koln': '#ED1C24',
  'mainz': '#C3141E',
  'paderborn': '#0061AA',
  'rb-leipzig': '#DD0741',
  'schalke': '#004D9D',
  'st-pauli': '#6F4E37',
  'stuttgart': '#E32219',
  'union-berlin': '#EB1923',
  'werder-bremen': '#1D9053',
  'wolfsburg': '#65B32E',
};

// Neutral color for league average
export const LEAGUE_AVERAGE_COLOR = '#6B7280';

// Get team color with fallback
export function getTeamColor(team: string): string {
  return TEAM_COLORS[team] || '#6B7280';
}

// Readable text color (black or white) for a given background color, so pale team
// colors like white don't render white-on-white text
export function getContrastText(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111111' : '#ffffff';
}

export const TEAM_ABBR: Record<string, string> = {
  'aberdeen': 'ABD',
  'celtic': 'CEL',
  'dundee-fc': 'DFC',
  'dundee-united': 'DUN',
  'falkirk': 'FAL',
  'hearts': 'HRT',
  'hibernian': 'HIB',
  'kilmarnock': 'KIL',
  'livingston': 'LIV',
  'motherwell': 'MTW',
  'rangers': 'RAN',
  'st-mirren': 'STM',

  // EPL
  'arsenal': 'ARS',
  'aston-villa': 'AVL',
  'afc-bournemouth': 'BOU',
  'brentford': 'BRE',
  'brighton-hove-albion': 'BHA',
  'burnley': 'BUR',
  'chelsea': 'CHE',
  'crystal-palace': 'CRY',
  'everton': 'EVE',
  'fulham': 'FUL',
  'leeds-united': 'LEE',
  'liverpool': 'LIV',
  'manchester-city': 'MCI',
  'manchester-united': 'MUN',
  'newcastle-united': 'NEW',
  'nottingham-forest': 'NFO',
  'sunderland': 'SUN',
  'tottenham-hotspur': 'TOT',
  'west-ham-united': 'WHU',
  'wolverhampton-wanderers': 'WOL',
  'coventry-city': 'COV',
  'hull-city': 'HUL',
  'ipswich-town': 'IPS',

  // La Liga
  'alaves': 'ALA',
  'athletic-club': 'ATH',
  'atletico-madrid': 'ATM',
  'barcelona': 'BAR',
  'celta-vigo': 'CEL',
  'elche': 'ELC',
  'espanyol': 'ESP',
  'getafe': 'GET',
  'girona': 'GIR',
  'levante': 'LEV',
  'mallorca': 'MLL',
  'osasuna': 'OSA',
  'rayo-vallecano': 'RAY',
  'real-betis': 'BET',
  'real-madrid': 'RMA',
  'real-oviedo': 'OVI',
  'real-sociedad': 'RSO',
  'sevilla': 'SEV',
  'valencia': 'VAL',
  'villarreal': 'VIL',
  'racing-santander': 'RAC',
  'deportivo-coruna': 'DEP',
  'malaga': 'MAL',

  // Bundesliga
  'augsburg': 'AUG',
  'bayer-leverkusen': 'B04',
  'bayern-munchen': 'BAY',
  'borussia-dortmund': 'BVB',
  'borussia-monchengladbach': 'BMG',
  'eintracht-frankfurt': 'SGE',
  'elversberg': 'ELV',
  'freiburg': 'SCF',
  'hamburger-sv': 'HSV',
  'heidenheim': 'HDH',
  'hoffenheim': 'TSG',
  'koln': 'KOE',
  'mainz': 'M05',
  'paderborn': 'SCP',
  'rb-leipzig': 'RBL',
  'schalke': 'S04',
  'st-pauli': 'STP',
  'stuttgart': 'VFB',
  'union-berlin': 'FCU',
  'werder-bremen': 'SVW',
  'wolfsburg': 'WOB',
};

export function getTeamAbbr(team: string): string {
  return TEAM_ABBR[team] || team.slice(0, 3).toUpperCase();
}
