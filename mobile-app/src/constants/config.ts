const API_BASE_URL = 'https://ride-booking-api-r62q.onrender.com/api';
const GOOGLE_MAPS_API_KEY = '';
const FIREBASE_API_KEY = 'AIzaSyCCVUsWVQfNHQdDJ8J9SsJHQUhsoR3XTLo';

const COLORS = {
  primary: '#4361ee',
  primaryDark: '#3a54b1',
  secondary: '#f72585',
  success: '#2ec4b6',
  danger: '#e63946',
  warning: '#fca311',
  background: '#f5f5f5',
  white: '#ffffff',
  black: '#000000',
  gray: '#8d99ae',
  grayLight: '#edf2f5',
  text: '#1a1a2e',
  textLight: '#6b7280',
};

const VEHICLE_ICONS: Record<string, string> = {
  auto: '🛺',
  sedan_basic: '🚗',
  sedan_comfort: '🚘',
  suv: '🚙',
  mvp: '🚐',
};

export interface CabVehicleType {
  code: string;
  name: string;
  icon: string;
  seats: number;
  perKm: number;
  description: string;
}

const CAB_VEHICLE_TYPES: CabVehicleType[] = [
  { code: 'sedan_basic', name: 'Sedan Basic', icon: '🚗', seats: 4, perKm: 35, description: '4 Seater • Economy' },
  { code: 'sedan_comfort', name: 'Sedan Comfort', icon: '🚘', seats: 4, perKm: 45, description: '4 Seater • Comfort' },
  { code: 'suv', name: 'SUV', icon: '🚙', seats: 6, perKm: 55, description: '6 Seater • Premium' },
  { code: 'mvp', name: 'MVP', icon: '🚐', seats: 7, perKm: 65, description: '7 Seater • Large Group' },
];

const RIDER_STATUS_COLORS: Record<string, string> = {
  pending: '#fca311',
  requested: '#fca311',
  accepted: '#4361ee',
  arriving: '#4361ee',
  in_progress: '#2ec4b6',
  completed: '#2ec4b6',
  cancelled: '#e63946',
  scheduled: '#8d99ae',
};

export { API_BASE_URL, GOOGLE_MAPS_API_KEY, FIREBASE_API_KEY, COLORS, VEHICLE_ICONS, CAB_VEHICLE_TYPES, RIDER_STATUS_COLORS };
