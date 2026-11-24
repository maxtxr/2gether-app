// Dynamic dates so the demo events are always upcoming/past relative to
// today. `when` must follow the app format: DD/MM/YYYY, HH:mm.
const pad = (value) => String(value).padStart(2, '0');

const formatWhen = (date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;

const shortWhen = (date) =>
  `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;

// Next occurrence of a weekday (0 = Sunday … 6 = Saturday). If it is today
// but the time has already passed, use next week instead.
const nextWeekday = (weekday, hours, minutes = 0) => {
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );
  const delta = (weekday - date.getDay() + 7) % 7;

  date.setDate(date.getDate() + delta);

  if (date <= now) {
    date.setDate(date.getDate() + 7);
  }

  return date;
};

// Most recent occurrence of a weekday (for past events).
const lastWeekday = (weekday, hours, minutes = 0) => {
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );
  const delta = (date.getDay() - weekday + 7) % 7;

  date.setDate(date.getDate() - delta);

  if (date >= now) {
    date.setDate(date.getDate() - 7);
  }

  return date;
};

const padelWhen = nextWeekday(6, 10, 0);
const walkWhen = nextWeekday(2, 9, 0);
const runWhen = nextWeekday(0, 9, 0);
const yogaWhen = nextWeekday(5, 8, 30);
const gamesWhen = nextWeekday(4, 19, 30);
const pastRunWhen = lastWeekday(6, 18, 0);
const pastVolleyWhen = lastWeekday(0, 11, 0);

export const seedEvents = [
  {
    id: 'e1', title: 'Padel Event', category: 'Sports', sport: 'Padel', level: 'Beginner',
    short: shortWhen(padelWhen), when: formatWhen(padelWhen), place: 'Barreiro Padel Club',
    address: 'Court 2 · Rua Miguel Bombarda', area: 'Barreiro', lat: 38.6631, lng: -9.0724,
    host: 'Maya', capacity: 8, base: 6,
    people: ['M', 'JL', 'SK'], accessibility: ['Low intensity'],
    description: 'A friendly morning of padel with a few new faces. All levels welcome. Equipment is provided at the venue.',
    autoReply: "No need! Everything you'll need will be at the venue.",
  },
  {
    id: 'e2', title: 'Cozy Walk', category: 'Outdoors', sport: 'Walking', level: 'All levels',
    short: shortWhen(walkWhen), when: formatWhen(walkWhen), place: 'Parque da Paz',
    address: 'Main entrance', area: 'Almada', lat: 38.6620, lng: -9.1650, host: 'Rita', capacity: 50, base: 5,
    people: ['R', 'AP', 'TC'], accessibility: ['Wheelchair friendly', 'Flat terrain', 'Low intensity', 'All ages'],
    description: 'A relaxed walk on flat paths with benches along the way. Everyone is welcome.',
  },
  {
    id: 'e3', title: 'Sunday 5K Run', category: 'Sports', sport: 'Running', level: 'Intermediate',
    short: shortWhen(runWhen), when: formatWhen(runWhen), place: 'Monsanto Park',
    address: 'Meeting at the car park', area: 'Lisboa', lat: 38.7275, lng: -9.1858, host: 'Paul', capacity: 20, base: 11,
    people: ['B', 'FN', 'CL'], accessibility: [],
    description: 'Social 5K at about 6:00/km, with coffee afterwards. No one gets left behind.',
  },
  {
    id: 'e4', title: 'Beginner Yoga', category: 'Sports', sport: 'Yoga', level: 'Beginner',
    short: shortWhen(yogaWhen), when: formatWhen(yogaWhen), place: 'Jardim da Estrela',
    address: 'Near the bandstand', area: 'Lisboa', lat: 38.7139, lng: -9.1600, host: 'Linda', capacity: 15, base: 9,
    people: ['BR', 'MS', 'LP'], accessibility: ['Low intensity', 'All ages'],
    description: 'Gentle 45 minute session. Bring a mat or a towel.',
  },
  {
    id: 'e5', title: 'Board Games Night', category: 'Social', sport: 'Board games', level: 'All levels',
    short: shortWhen(gamesWhen), when: formatWhen(gamesWhen), place: 'Casa da Cerca',
    address: 'Rua da Cerca', area: 'Almada', lat: 38.6780, lng: -9.1560, host: 'Tom', capacity: 12, base: 7,
    people: ['G', 'IR', 'DO'], accessibility: ['Wheelchair friendly', 'Low intensity'],
    description: 'Bring a game or just yourself. We teach the rules.',
  },
  {
    id: 'p1', past: true, title: 'Evening Run', category: 'Sports', sport: 'Running', level: 'Beginner',
    short: shortWhen(pastRunWhen), when: formatWhen(pastRunWhen), place: 'Parque das Nações',
    address: 'Oceanário entrance', area: 'Lisboa',
    lat: 38.7633, lng: -9.0937, host: 'Paul', capacity: 15, base: 10, people: [], accessibility: [], description: '',
  },
  {
    id: 'p2', past: true, title: 'Beach Volleyball', category: 'Sports', sport: 'Volleyball', level: 'All levels',
    short: shortWhen(pastVolleyWhen), when: formatWhen(pastVolleyWhen), place: 'Costa da Caparica',
    address: 'Praia do Tarquínio', area: 'Almada',
    lat: 38.5750, lng: -9.2320, host: 'Sydney', capacity: 12, base: 9, people: [], accessibility: [], description: '',
  },
];
