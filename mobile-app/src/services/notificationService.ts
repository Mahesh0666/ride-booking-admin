import api from './apiClient';

class NotificationService {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  }

  async markAsRead(id: string) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
}

export default new NotificationService();