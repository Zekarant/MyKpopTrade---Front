import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import authentificationService from '@/services/authentification.service';
import { API_URL } from '@/config/api';

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
    this.apiClient = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.apiClient.interceptors.request.use((config) => {
      const token = Cookies.get('sessionToken') || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await authentificationService.verifSession().catch(() => {});
        }
        return Promise.reject(error);
      }
    );
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
