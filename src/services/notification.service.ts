import type { AxiosResponse } from 'axios';
import { apiClient } from '@/services/apiClient';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  data?: Record<string, unknown>;
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
  private client = apiClient('/api/notifications');

  async getNotifications(): Promise<NotificationsResponse> {
    const response: AxiosResponse<NotificationsResponse> = await this.client.get('/');
    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    await this.client.put(`/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await this.client.put('/read-all');
  }

  async deleteNotification(id: string): Promise<void> {
    await this.client.delete(`/${id}`);
  }
}

export default new NotificationService();
