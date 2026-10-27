// Sample data. Replace with API calls (river gauges, water release schedule, Text.lk) later.
// Tank levels and forecasts already come from the API: see api/reservoirs.js.

export const FLOOD = {
  level: 2, maxLevel: 4, severity: 'watch', river: 'Yan Oya', gauge: 4.1, trend: 'rising', peak: 'Thursday evening',
  title: 'Yan Oya river may overflow',
  steps: [
    'Move cattle and water pumps to higher ground',
    'Do not cross low causeways after rain',
    'Keep your phone charged — warnings come by SMS',
  ],
  issued: '08:40',
};

export const WATER_RELEASE = {
  canal: 'Palugaswewa feeder', channel: 'D-4', status: 'scheduled',
  next: { day: 'THU', date: 29, label: 'Thu 29 Oct', time: '6:00 AM', hours: 48 },
  schedule: [
    { label: 'Thu 29 Oct · 6:00 AM', hours: 48, active: true },
    { label: 'Mon 2 Nov · 6:00 AM', hours: 48, active: false },
    { label: 'Fri 6 Nov · 6:00 AM', hours: 36, active: false },
  ],
};

export const FORECAST = [
  { day: 'Today', mm: 2, icon: 'sun' },
  { day: 'Thu', mm: 14, icon: 'cloud' },
  { day: 'Fri', mm: 38, icon: 'rain', heavy: true },
];

export const FORECAST_ADVICE = "Wait for Friday's rain before transplanting paddy seedlings. Water highland vegetables early in the morning.";

export const CROP_CATALOG = {
  paddy: {
    label: 'Paddy (Rice)', color: '#6E8F3A',
    types: {
      'White Rice (BG)': ['BG 352 (3.5 months)', 'BG 300 (3 months)', 'BG 359 (3.5 months)', 'BG 366 (3.5 months)'],
      'Red Rice (AT)': ['AT 362 (3.5 months)', 'AT 307 (3 months)', 'AT 373 (3.5 months)'],
      Samba: ['Keeri Samba', 'Suwandel', 'BG 358 Samba'],
    },
  },
  vegetables: {
    label: 'Vegetables', color: '#E08A1E',
    types: {
      Tomato: ['Thilina', 'KWR', 'Padmini'],
      'Green Chilli': ['MI-2', 'MI Hot', 'KA-2'],
      Brinjal: ['Lena Iri', 'Padagoda', 'Thinnaveli Purple'],
      Okra: ['MI-5', 'Haritha'],
    },
  },
  fruit: {
    label: 'Fruit', color: '#D93B2B',
    types: {
      Banana: ['Ambul', 'Kolikuttu', 'Cavendish'],
      Papaya: ['Red Lady', 'Rathna'],
      Mango: ['TJC', 'Karthakolomban', 'Villard'],
    },
  },
  ofc: {
    label: 'Other Field Crops', short: 'OFC', color: '#C8A227',
    types: {
      Maize: ['Pacific 999', 'Pacific 984', 'Ruwan'],
      'Mung bean': ['MI 6', 'Ari'],
      Cowpea: ['Bombay', 'Waruni'],
    },
  },
  mixed: {
    label: 'Mixed Farming', short: 'Mixed', color: '#2F6FE0',
    types: { 'Mixed plot': ['Home garden mix', 'Vegetable + fruit'] },
  },
};

export const YIELD_UNITS = [
  { id: 'kg', label: 'kg / acre' },
  { id: 'bu', label: 'bushels / ac' },
  { id: 't', label: 'tons / acre' },
];

export const ISSUE_TYPES = [
  { id: 'blockage', key: 'blockage', icon: 'blockage' },
  { id: 'leak', key: 'leak', icon: 'leak' },
  { id: 'gate', key: 'gate', icon: 'gate' },
  { id: 'other', key: 'other', icon: 'dots' },
];

export const CANAL_SPOTS = [
  'Palugaswewa feeder · near D-4',
  'Palugaswewa feeder · gate 7',
  'Kudawewa left bank canal',
  'Horiwila field channel F-2',
  'Maradankadawala distributory',
];

export const SEED_REPORTS = [
  { id: 'CR-1987', type: 'gate', spot: 'Palugaswewa feeder · gate 7', status: 'inProgress', when: '12 Oct', note: 'Gate wheel stuck, cannot close.' },
  { id: 'CR-1902', type: 'leak', spot: 'Kudawewa left bank canal', status: 'fixed', when: '28 Sep', note: 'Water leaking under bund.' },
];

export const SEED_ALERTS = [
  { id: 'a1', kind: 'flood', title: 'Flood watch · Yan Oya', body: 'River may overflow Thursday evening. Move livestock and pumps to higher ground.', when: '08:40', read: false },
  { id: 'a2', kind: 'release', title: 'Water release on Thursday', body: 'Water release to Channel D-4 at 6:00 AM for 48 hours.', when: 'Yesterday', read: false },
  { id: 'a3', kind: 'tank', title: 'Palugaswewa Tank is low', body: 'Tank at 34%. Use water carefully this week.', when: '22 Oct', read: true },
];

// Real photos (Wikimedia Commons, credits in public/photos/CREDITS.md).
const photo = (f) => `${import.meta.env.BASE_URL}photos/${f}`;
export const PHOTOS = {
  paddy: photo('paddy.jpg'),
  farmers: photo('farmers.jpg'),
  tank: photo('tank.jpg'),
  canal: photo('canal.jpg'),
  flood: photo('flood.jpg'),
  harvest: photo('harvest.jpg'),
};

// Where a farmer's field gets its water (registration step 2c).
export const WATER_SOURCES = [
  { id: 'tank', key: 'wsTank', icon: 'tank', ask: 'tank' },
  { id: 'canal', key: 'wsCanal', icon: 'drop', ask: 'canal' },
  { id: 'river', key: 'wsRiver', icon: 'leak', ask: 'river' },
  { id: 'well', key: 'wsWell', icon: 'target' },
  { id: 'rain', key: 'wsRain', icon: 'rain' },
];


// Google map defaults (Mahaweli B). Tanks with lat/lon appear on the map and are used for "nearest tank".
export const MAP_CENTER = { lat: 7.364212, lng: 81.02131 };

export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna',
  'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];
