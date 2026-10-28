import type { AxiosResponse } from 'axios';
import { apiClient } from '@/services/apiClient';
import type { Pagination } from '@/types/pagination.types';

export type ReportTargetType = 'product' | 'rating' | 'user' | 'post' | 'message';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected';

export interface Report {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface ReportsResponse {
  reports: Report[];
  pagination: Pagination;
}

class ReportService {
  private client = apiClient('/api/reports');

  async createReport(data: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<Report> {
    const response: AxiosResponse<Report> = await this.client.post('/', data);
    return response.data;
  }

  async getMyReports(page = 1): Promise<ReportsResponse> {
    const response: AxiosResponse<ReportsResponse> = await this.client.get('/me', { params: { page } });
    return response.data;
  }

  async checkIfReported(targetType: ReportTargetType, targetId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ hasReported: boolean }> = await this.client.get(
        `/check/${targetType}/${targetId}`
      );
      return response.data.hasReported;
    } catch {
      return false;
    }
  }
}

export default new ReportService();
