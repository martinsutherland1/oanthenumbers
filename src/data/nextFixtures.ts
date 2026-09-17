// Next opponent for each team — update each gameweek
export const NEXT_OPPONENT: Record<string, string> = {
  'celtic': 'rangers',
  'falkirk': 'st-johnstone',
  'aberdeen': 'hibernian',
  'kilmarnock': 'heart-midlothian',
  'st-mirren': 'dundee-united',
  'st-johnstone': 'falkirk',
  'rangers': 'celtic',
  'motherwell': 'dundee-fc',
  'hibernian': 'aberdeen',
  'heart-midlothian': 'kilmarnock',
  'dundee-united': 'st-mirren',
  'dundee-fc': 'motherwell',
};

// Ordered fixture pairs [home, away] — update each gameweek
export const NEXT_FIXTURES: [string, string][] = [
  ['dundee-fc', 'motherwell'],
  ['hibernian', 'aberdeen'],
  ['st-johnstone', 'falkirk'],
  ['st-mirren', 'dundee-united'],
  ['kilmarnock', 'heart-midlothian'],
  ['celtic', 'rangers'],
];
