// Aliases that map alternate spellings to canonical team slugs
export const TEAM_ALIASES: Record<string, string> = {
  'dundee': 'dundee-fc',
  'dundee utd': 'dundee-united',
  'st mirren': 'st-mirren',
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
  'hearts': 'Hearts',
  'hibernian': 'Hibernian',
  'kilmarnock': 'Kilmarnock',
  'livingston': 'Livingston',
  'motherwell': 'Motherwell',
  'rangers': 'Rangers',
  'st-mirren': 'St. Mirren',
  'ross-county': 'Ross County',
  'st-johnstone': 'St. Johnstone',
  'partick-thistle': 'Partick Thistle',
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
  'hearts': '#7F1D1D',
  'hibernian': '#22C55E',
  'kilmarnock': '#3B82F6',
  'livingston': '#FACC15',
  'motherwell': '#991B1B',
  'rangers': '#1D4ED8',
  'st-mirren': '#171717',
  'falkirk': '#1E3A5F',
  'ross-county': '#1E40AF',
  'st-johnstone': '#2563EB',
  'partick-thistle': '#EF4444'
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
};

export function getTeamAbbr(team: string): string {
  return TEAM_ABBR[team] || team.slice(0, 3).toUpperCase();
}
