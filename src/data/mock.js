export const seedEvents = [
  {
    id: 'e1', title: 'Padel Event', category: 'Sports', sport: 'Padel', level: 'Beginner',
    short: 'Sat, 10:00', when: 'Saturday, 10:00–11:30', place: 'Riverside Padel Club',
    address: 'Court 2 · 18 River Lane', area: 'Barreiro', lat: 38.663, lng: -9.05, host: 'Maya', capacity: 8, base: 6,
    people: ['M', 'JL', 'SK'], accessibility: ['Low intensity'],
    description: 'A friendly morning of padel with a few new faces. All levels welcome. Equipment is provided at the venue.',
    autoReply: "No need! Everything you'll need will be at the venue.",
  },
  {
    id: 'e2', title: 'Cozy Walk', category: 'Outdoors', sport: 'Walking', level: 'All levels',
    short: 'Tue, 09:00', when: 'Tuesday, 09:00–10:00', place: 'Parque da Paz',
    address: 'Main entrance', area: 'Almada', lat: 38.662, lng: -9.165, host: 'Rita', capacity: 50, base: 5,
    people: ['R', 'AP', 'TC'], accessibility: ['Wheelchair friendly', 'Flat terrain', 'Low intensity', 'All ages'],
    description: 'A relaxed walk on flat paths with benches along the way. Everyone is welcome.',
  },
  {
    id: 'e3', title: 'Sunday 5K Run', category: 'Sports', sport: 'Running', level: 'Intermediate',
    short: 'Sun, 09:00', when: 'Sunday, 09:00–10:00', place: 'Monsanto Park',
    address: 'Meeting at the car park', area: 'Lisboa', lat: 38.725, lng: -9.17, host: 'Paul', capacity: 20, base: 11,
    people: ['B', 'FN', 'CL'], accessibility: [],
    description: 'Social 5K at about 6:00/km, with coffee afterwards. No one gets left behind.',
  },
  {
    id: 'e4', title: 'Beginner Yoga', category: 'Sports', sport: 'Yoga', level: 'Beginner',
    short: 'Fri, 08:30', when: 'Friday, 08:30–09:15', place: 'Jardim da Estrela',
    address: 'Near the bandstand', area: 'Lisboa', lat: 38.714, lng: -9.16, host: 'Linda', capacity: 15, base: 9,
    people: ['BR', 'MS', 'LP'], accessibility: ['Low intensity', 'All ages'],
    description: 'Gentle 45 minute session. Bring a mat or a towel.',
  },
  {
    id: 'e5', title: 'Board Games Night', category: 'Social', sport: 'Board games', level: 'All levels',
    short: 'Thu, 19:30', when: 'Thursday, 19:30–22:00', place: 'Café Tabuleiro',
    address: 'Back room', area: 'Almada', lat: 38.678, lng: -9.14, host: 'Tom', capacity: 12, base: 7,
    people: ['G', 'IR', 'DO'], accessibility: ['Wheelchair friendly', 'Low intensity'],
    description: 'Bring a game or just yourself. We teach the rules.',
  },
  {
    id: 'p1', past: true, title: 'Evening Run', category: 'Sports', sport: 'Running', level: 'Beginner',
    short: 'Sat, 18:00', when: 'Saturday, 18:00', place: 'Parque das Nações', address: '', area: 'Barreiro',
    lat: 38.768, lng: -9.094, host: 'Paul', capacity: 15, base: 10, people: [], accessibility: [], description: '',
  },
  {
    id: 'p2', past: true, title: 'Beach Volleyball', category: 'Sports', sport: 'Volleyball', level: 'All levels',
    short: 'Sun, 11:00', when: 'Sunday, 11:00', place: 'Costa da Caparica', address: '', area: 'Almada',
    lat: 38.575, lng: -9.232, host: 'Sydney', capacity: 12, base: 9, people: [], accessibility: [], description: '',
  },
];
