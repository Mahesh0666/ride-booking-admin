import api from './apiClient';

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

class RideService {
  async getDriverRides() {
    const response = await api.get('/rides');
    return response.data;
  }

  async acceptRide(rideId: string) {
    const response = await api.post(`/rides/${rideId}/accept`);
    return response.data;
  }

  async verifyOtp(rideId: string, otp: string) {
    const response = await api.post(`/rides/${rideId}/verify-otp`, { otp });
    return response.data;
  }

  async updateRideStatus(rideId: string, status: string) {
    const response = await api.put(`/rides/${rideId}/status`, { status });
    return response.data;
  }

  async getRide(rideId: string) {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  }
}

export default new RideService();