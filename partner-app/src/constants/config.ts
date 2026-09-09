const API_BASE_URL = 'https://ride-booking-api-r62q.onrender.com/api';
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

const VEHICLE_ICONS = {
  auto: '\uD83D\uDEFA',
};

const DRIVER_STATUS_COLORS = {
  requested: '#6b7280',
  accepted: '#f59e0b',
  arriving: '#f59e0b',
  in_progress: '#4361ee',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export { API_BASE_URL, FIREBASE_API_KEY, COLORS, VEHICLE_ICONS, DRIVER_STATUS_COLORS };
