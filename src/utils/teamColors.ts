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
