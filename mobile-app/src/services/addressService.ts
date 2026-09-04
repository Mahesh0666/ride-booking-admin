import api from './apiClient';

export interface SavedAddress {
  _id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isFavorite?: boolean;
}

class AddressService {
  async getAddresses() {
    const response = await api.get('/addresses');
    return response.data;
  }

  async addAddress(data: Omit<SavedAddress, '_id'>) {
    const response = await api.post('/addresses', data);
    return response.data;
  }

  async updateAddress(id: string, data: Partial<SavedAddress>) {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data;
  }

  async deleteAddress(id: string) {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  }
}

export default new AddressService();