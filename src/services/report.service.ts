import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import authentificationService from '@/services/authentification.service';
import { API_URL } from '@/config/api';

export interface Report {
  _id: string;
  targetType: 'product' | 'user' | 'message' | 'rating';
  targetId: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface ReportsResponse {
  reports: Report[];
}

class ReportService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/reports`;
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

  async createReport(data: {
    targetType: 'product' | 'user' | 'message' | 'rating';
    targetId: string;
    reason: string;
    description?: string;
  }): Promise<Report> {
    const response: AxiosResponse<Report> = await this.apiClient.post('/', data);
    return response.data;
  }

  async getMyReports(): Promise<ReportsResponse> {
    const response: AxiosResponse<ReportsResponse> = await this.apiClient.get('/me');
    return response.data;
  }

  async checkIfReported(targetType: string, targetId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ reported: boolean }> = await this.apiClient.get(
        `/check/${targetType}/${targetId}`
      );
      return response.data.reported;
    } catch {
      return false;
    }
  }
}

export default new ReportService();
