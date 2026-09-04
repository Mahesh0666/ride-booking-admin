import api from './apiClient';

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

class WalletService {
  async getWallet() {
    const response = await api.get('/wallet');
    return response.data;
  }

  async addFunds(amount: number, method = 'upi') {
    const response = await api.post('/wallet/add-funds', { amount, method });
    return response.data;
  }

  async getPaymentMethods() {
    const response = await api.get('/wallet/payment-method');
    return response.data;
  }

  async setDefaultPaymentMethod(method: string) {
    const response = await api.put('/wallet/payment-method', { method });
    return response.data;
  }

  async getReceipts() {
    const response = await api.get('/wallet/receipts');
    return response.data;
  }
}

export default new WalletService();