export interface Location {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
}

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'rider' | 'driver' | 'admin';
  profileImage?: string;
  isDriver?: boolean;
  licenseNumber?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  currentLocation?: Location;
  rating?: number;
  totalRides?: number;
  vehicle?: Vehicle;
  earnings?: number;
  stripeAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  _id: string;
  driver: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vehicleType: 'sedan' | 'suv' | 'luxury' | 'bike';
  seats: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type DriverAction = 'arriving' | 'in_progress' | 'completed' | 'cancelled';

export interface Ride {
  _id: string;
  rider: User;
  driver?: User;
  pickupLocation: Location & { address?: string };
  dropoffLocation: Location & { address?: string };
  status: RideStatus;
  fare: number;
  distance: number;
  duration: number;
  payment?: Payment;
  vehicleType: 'sedan' | 'suv' | 'luxury' | 'bike';
  driverLocation?: Location;
  estimatedArrival?: number;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancellationBy?: 'rider' | 'driver' | 'system';
  rating?: {
    rated: boolean;
    score?: number;
    comment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'cash';

export interface Payment {
  _id: string;
  ride: Ride;
  rider: User;
  driver: User;
  amount: number;
  tip: number;
  commission: number;
  driverEarnings: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RideStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  requestedRides: number;
  activeRides: number;
  totalRevenue: number;
  totalEarnings: number;
}

export interface DriverLocationUpdate {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface RatingInput {
  score: number;
  comment?: string;
}

export interface CancellationInput {
  reason?: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  alreadyPaid?: boolean;
  payment: Payment;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export interface ErrorResponse {
  error: {
    message: string;
    errors?: Record<string, unknown>;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
}