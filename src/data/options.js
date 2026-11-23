export const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced'];
export const ACCESSIBILITY = ['Wheelchair friendly', 'Flat terrain', 'Low intensity', 'All ages', "No Equipment Needed"];
export const EVENT_CATEGORIES = [
  {
    name: 'Fitness',
    icon: 'dumbbell',
    subcategories: ['Gym', 'Strength training', 'Functional training'],
  },
  {
    name: 'Outdoors',
    icon: 'hiking',
    subcategories: ['Running', 'Walking', 'Cycling', 'Climbing'],
  },
  {
    name: 'Team Sports',
    icon: 'soccer',
    subcategories: ['Football', 'Basketball', 'Volleyball', 'Tennis', 'Handball'],
  },
  {
    name: 'Water Sports',
    icon: 'swim',
    subcategories: ['Swimming', 'Surfing', 'Paddleboarding'],
  },
  {
    name: 'Wellness',
    icon: 'yoga',
    subcategories: ['Yoga', 'Stretching', 'Meditation'],
  },
  {
    name: 'Social',
    icon: 'account-group',
    subcategories: ['Social meetup', 'Sports watching', 'Group activity'],
  },
  {
    name: 'Other',
    icon: 'dots-horizontal-circle-outline',
    subcategories: [],
  },
];
export const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest', icon: 'navigate-outline' },
  { value: 'soonest', label: 'Soonest', icon: 'time-outline' },
  { value: 'participants', label: 'Most participants', icon: 'people-outline' },
];