import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ride-booking-api-r62q.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isAdmin: boolean;
  isOnline?: boolean;
  isDriver?: boolean;
  createdAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isOnline?: boolean;
  onboardingStatus?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  vehicle?: { type?: string; make?: string; model?: string };
  licenseNumber?: string;
  documents?: any[];
  createdAt: string;
}

export interface Ride {
  _id: string;
  rider: User | string;
  driver: Driver | string;
  status: string;
  pickupLocation?: { address?: string; coordinates?: number[] };
  dropoffLocation?: { address?: string; coordinates?: number[] };
  fare?: number;
  distance?: number;
  duration?: number;
  createdAt: string;
}

export interface CabBooking {
  _id: string;
  user: User | string;
  driver: Driver | string;
  status: string;
  pickupLocation?: { address?: string; latitude?: number; longitude?: number };
  dropLocation?: { address?: string; latitude?: number; longitude?: number };
  vehicleType?: string;
  fare?: number;
  adminNote?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalRevenue: number;
}

export class AdminService {
  async login(email: string, password: string) {
    const response = await api.post('/auth/admin/login-request-otp', { email, password });
    return response.data;
  }

  async verifyLoginOtp(email: string, otp: string) {
    const response = await api.post('/auth/admin/login-verify-otp', { email, otp });
    const { token, user } = response.data;
    localStorage.setItem('admin_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return user;
  }

  logout() {
    localStorage.removeItem('admin_token');
    delete api.defaults.headers.common['Authorization'];
  }

  init() {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/stats');
    const s = response.data.stats;
    return {
      totalUsers: s.totalUsers,
      totalDrivers: s.activeDrivers,
      totalRides: s.totalRides,
      totalRevenue: s.totalRevenue,
    };
  }

  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/admin/users');
    return response.data.users || response.data;
  }

  async getAllDrivers(): Promise<Driver[]> {
    const response = await api.get('/admin/drivers');
    const drivers = response.data.drivers || response.data;
    return drivers.map((d: any) => ({
      ...d,
      isApproved: d.onboardingStatus === 'approved',
      isRejected: d.onboardingStatus === 'rejected',
    }));
  }

  async getAllRides(): Promise<Ride[]> {
    const response = await api.get('/admin/rides');
    return response.data.rides || response.data;
  }

  async getAllCabBookings(): Promise<CabBooking[]> {
    const response = await api.get('/cab-bookings/admin/all');
    return response.data.bookings || response.data;
  }

  async updateUser(userId: string, data: Partial<User>) {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async approveDriver(driverId: string) {
    const response = await api.put(`/admin/drivers/${driverId}/review`, { action: 'approve' });
    return response.data;
  }

  async rejectDriver(driverId: string) {
    const response = await api.put(`/admin/drivers/${driverId}/review`, { action: 'reject' });
    return response.data;
  }

  async deleteDriver(driverId: string) {
    const response = await api.delete(`/admin/drivers/${driverId}`);
    return response.data;
  }

  async cancelRide(rideId: string) {
    const response = await api.post(`/rides/${rideId}/cancel`);
    return response.data;
  }

  async confirmCabBooking(bookingId: string) {
    const response = await api.put(`/cab-bookings/admin/${bookingId}/status`, { status: 'confirmed' });
    return response.data;
  }

  async cancelCabBooking(bookingId: string) {
    const response = await api.put(`/cab-bookings/admin/${bookingId}/status`, { status: 'cancelled' });
    return response.data;
  }

  async completeCabBooking(bookingId: string) {
    const response = await api.put(`/cab-bookings/admin/${bookingId}/status`, { status: 'completed' });
    return response.data;
  }

  async getCabBookingStats() {
    const response = await api.get('/cab-bookings/admin/stats');
    return response.data;
  }

  async getServices() {
    const response = await api.get('/services');
    return response.data;
  }

  async getPayments() {
    const response = await api.get('/admin/payments');
    return response.data;
  }

  async changeCredentials(currentPassword: string, newEmail?: string, newPassword?: string) {
    const response = await api.put('/auth/change-credentials', { currentPassword, newEmail, newPassword });
    return response.data;
  }

  async forgotPassword() {
    const response = await api.post('/auth/forgot-password');
    return response.data;
  }

  async verifyResetOtp(otp: string) {
    const response = await api.post('/auth/verify-reset-otp', { otp });
    return response.data;
  }

  async resetPassword(otp: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', { otp, newPassword });
    return response.data;
  }
}

export default new AdminService();
