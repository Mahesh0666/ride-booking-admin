import api from './apiClient';

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

class DriverService {
  async updateProfile(data: { name?: string; phone?: string; profileImage?: string }) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }

  async getMyRides() {
    const response = await api.get('/rides');
    return response.data;
  }
}

export default new DriverService();