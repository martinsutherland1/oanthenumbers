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
  'leeds-united': 'Leeds United',
  'liverpool': 'Liverpool',
  'manchester-city': 'Man City',
  'manchester-united': 'Man Utd',
  'newcastle-united': 'Newcastle',
  'nottingham-forest': "Nott'm Forest",
  'sunderland': 'Sunderland',
  'tottenham-hotspur': 'Tottenham',
  'west-ham-united': 'West Ham',
  'wolverhampton-wanderers': 'Wolves',
  'coventry-city': 'Coventry City',
  'hull-city': 'Hull City',
  'ipswich-town': 'Ipswich Town',
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
  'fulham': '#CC0000',
  'leeds-united': '#FFCD00',
  'liverpool': '#C8102E',
  'manchester-city': '#6CABDD',
  'manchester-united': '#DA020E',
  'newcastle-united': '#A6A6A6',
  'nottingham-forest': '#DD0000',
  'sunderland': '#EB172B',
  'tottenham-hotspur': '#1656C6',
  'west-ham-united': '#7A263A',
  'wolverhampton-wanderers': '#FDB913',
  'coventry-city': '#5BA4CF',
  'hull-city': '#F5A20A',
  'ipswich-town': '#3A64A3',
};

// Neutral color for league average
export const LEAGUE_AVERAGE_COLOR = '#6B7280';

// Get team color with fallback
export function getTeamColor(team: string): string {
  return TEAM_COLORS[team] || '#6B7280';
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
};

export function getTeamAbbr(team: string): string {
  return TEAM_ABBR[team] || team.slice(0, 3).toUpperCase();
}
