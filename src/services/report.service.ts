import { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export type ReportTargetType = 'product' | 'rating' | 'user' | 'post';

export interface Report {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
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
    this.apiClient = createApiClient({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createReport(data: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<Report> {
    const response: AxiosResponse<Report> = await this.apiClient.post('/', data);
    return response.data;
  }

  async getMyReports(): Promise<ReportsResponse> {
    const response: AxiosResponse<ReportsResponse> = await this.apiClient.get('/me');
    return response.data;
  }

  async checkIfReported(targetType: ReportTargetType, targetId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ hasReported: boolean }> = await this.apiClient.get(
        `/check/${targetType}/${targetId}`
      );
      return response.data.hasReported;
    } catch {
      return false;
    }
  }
}

export default new ReportService();
