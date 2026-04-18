// Next opponent for each team — update each gameweek
export const NEXT_OPPONENT: Record<string, string> = {
  'celtic': 'falkirk',
  'falkirk': 'celtic',
  'aberdeen': 'kilmarnock',
  'kilmarnock': 'aberdeen',
  'st-mirren': 'livingston',
  'livingston': 'st-mirren',
  'rangers': 'motherwell',
  'motherwell': 'rangers',
  'hibernian': 'hearts',
  'hearts': 'hibernian',
  'dundee-united': 'dundee-fc',
  'dundee-fc': 'dundee-united',
};

// Ordered fixture pairs [home, away] — update each gameweek
export const NEXT_FIXTURES: [string, string][] = [
  ['celtic', 'falkirk'],
  ['aberdeen', 'kilmarnock'],
  ['st-mirren', 'livingston'],
  ['rangers', 'motherwell'],
  ['hibernian', 'hearts'],
  ['dundee-united', 'dundee-fc'],
];
