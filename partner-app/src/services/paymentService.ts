import api from './apiClient';

class PaymentService {
  async getMyPayments() {
    const response = await api.get('/payments/my-payments');
    return response.data;
  }

  async getPaymentByRide(rideId: string) {
    const response = await api.get(`/payments/ride/${rideId}`);
    return response.data;
  }
}

export default new PaymentService();