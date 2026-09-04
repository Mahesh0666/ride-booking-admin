import api from './apiClient';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth errors
    }
    return Promise.reject(error);
  }
);

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RideServiceOption {
  _id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  vehicleType: string;
  seats: number;
  capacity: string;
  baseFare: number;
  perKm: number;
  perMin: number;
  minFare: number;
  commissionRate: number;
  surgeEnabled: boolean;
  surgeMin: number;
  surgeMax: number;
  isActive: boolean;
}

class RideService {
  async getServices() {
    const response = await api.get('/services');
    return response.data;
  }

  async estimate(
    pickup: Location,
    dropoff: Location,
    vehicleType: string = 'auto'
  ) {
    const response = await api.get('/rides/estimate', {
      params: {
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        dropoffLat: dropoff.latitude,
        dropoffLng: dropoff.longitude,
        vehicleType,
      },
    });
    return response.data;
  }

  async requestRide(
    pickup: Location,
    dropoff: Location,
    vehicleType: string = 'auto',
    options?: { scheduledAt?: string; paymentMethod?: string; fare?: number; tip?: number }
  ) {
    const response = await api.post('/rides', {
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      pickupAddress: pickup.address,
      dropoffLat: dropoff.latitude,
      dropoffLng: dropoff.longitude,
      dropoffAddress: dropoff.address,
      vehicleType,
      scheduledAt: options?.scheduledAt,
      paymentMethod: options?.paymentMethod,
      fare: options?.fare,
      tip: options?.tip,
    });
    return response.data;
  }

  async getRide(rideId: string) {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  }

  async getMyRides() {
    const response = await api.get('/rides');
    return response.data;
  }

  async cancelRide(rideId: string, reason?: string) {
    const response = await api.post(`/rides/${rideId}/cancel`, { reason });
    return response.data;
  }

  async rateRide(rideId: string, score: number, comment?: string) {
    const response = await api.post(`/rides/${rideId}/rate`, { score, comment });
    return response.data;
  }

  async requestCabBooking(data: {
    pickup: Location;
    dropoff: Location;
    vehicleType: string;
    distanceKm: number;
    fare: number;
    travelDate: string;
  }) {
    const response = await api.post('/cab-bookings', data);
    return response.data;
  }

  async getMyCabBookings() {
    const response = await api.get('/cab-bookings/my');
    return response.data;
  }
}

export default new RideService();