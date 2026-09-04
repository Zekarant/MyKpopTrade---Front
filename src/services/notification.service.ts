import { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  data?: Record<string, any>;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    pages: number;
  };
}

class NotificationService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/notifications`;
    this.apiClient = createApiClient({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getNotifications(): Promise<NotificationsResponse> {
    const response: AxiosResponse<NotificationsResponse> = await this.apiClient.get('/');
    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    await this.apiClient.put(`/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await this.apiClient.put('/read-all');
  }

  async deleteNotification(id: string): Promise<void> {
    await this.apiClient.delete(`/${id}`);
  }
}

export default new NotificationService();
