
export const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced'];

export const ACCESSIBILITY = [
  {
    name: 'Wheelchair friendly',
    icon: 'wheelchair-accessibility',
  },
  {
    name: 'Flat terrain',
    icon: 'walk',
  },
  {
    name: 'Low intensity',
    icon: 'leaf',
  },
  {
    name: 'All ages',
    icon: 'account-group',
  },
  {
    name: 'No Equipment Needed',
    icon: 'dumbbell',
  },
];

export const EVENT_CATEGORIES = [
  {
    name: 'Fitness',
    icon: 'dumbbell',
    subcategories: ['Gym', 'Strength training', 'Functional training'],
  },
  {
    name: 'Outdoors',
    icon: 'walk',
    subcategories: ['Hiking', 'Walking', 'Running'],
  },
  {
    name: 'Team Sports',
    icon: 'soccer',
    subcategories: ['Football', 'Basketball', 'Volleyball'],
  },
  {
    name: 'Water Sports',
    icon: 'waves',
    subcategories: ['Swimming', 'Surfing', 'Kayaking'],
  },
  {
    name: 'Wellness',
    icon: 'leaf',
    subcategories: ['Yoga', 'Meditation', 'Pilates'],
  },
  {
    name: 'Social',
    icon: 'account-group',
    subcategories: ['Meetups', 'Group activities'],
  },
  {
    name: 'Other',
    icon: 'dots-horizontal-circle-outline',
    subcategories: ['Other activities'],
  },
];

export const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest', icon: 'crosshairs-gps' },
  { value: 'soonest', label: 'Soonest', icon: 'clock-outline' },
  { value: 'participants', label: 'Most participants', icon: 'account-group' },
];