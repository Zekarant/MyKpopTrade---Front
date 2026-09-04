import type { AxiosInstance } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export type DisputeStatus =
  | 'opened' | 'under_review' | 'resolved' | 'refunded' | 'rejected' | 'cancelled';
export type DisputeReason =
  | 'not_received' | 'damaged' | 'not_as_described' | 'counterfeit'
  | 'wrong_item' | 'partial_delivery' | 'seller_unresponsive' | 'buyer_abuse' | 'other';

export interface DisputeMessage {
  author: string | { _id: string; username?: string };
  authorRole: 'buyer' | 'seller' | 'admin';
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface Dispute {
  _id: string;
  payment: any;
  buyer: any;
  seller: any;
  openedBy: string;
  openedByRole: 'buyer' | 'seller';
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  evidence: string[];
  messages: DisputeMessage[];
  resolution?: { outcome: DisputeStatus; notes?: string; refundAmount?: number; decidedAt: string };
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

class DisputeService {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient({
      baseURL: `${API_URL}/api/disputes`,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async open(payload: {
    paymentId: string;
    reason: DisputeReason;
    description: string;
    evidence?: string[];
  }): Promise<{ success: boolean; dispute: Dispute }> {
    const { data } = await this.client.post('/', payload);
    return data;
  }

  async listMine(params: { page?: number; limit?: number } = {}) {
    const { data } = await this.client.get('/me', { params });
    return data as { success: boolean; disputes: Dispute[]; pagination: any };
  }

  async getOne(id: string) {
    const { data } = await this.client.get(`/${id}`);
    return data as { success: boolean; dispute: Dispute };
  }

  async addMessage(id: string, payload: { content: string; attachments?: string[] }) {
    const { data } = await this.client.post(`/${id}/messages`, payload);
    return data as { success: boolean; dispute: Dispute };
  }

  async cancel(id: string) {
    const { data } = await this.client.post(`/${id}/cancel`);
    return data as { success: boolean; dispute: Dispute };
  }

  // Admin
  async adminList(params: { status?: DisputeStatus; page?: number; limit?: number } = {}) {
    const { data } = await this.client.get('/', { params });
    return data as { success: boolean; disputes: Dispute[]; pagination: any };
  }
  async adminTake(id: string) {
    const { data } = await this.client.post(`/${id}/take`);
    return data as { success: boolean; dispute: Dispute };
  }
  async adminResolve(id: string, payload: {
    outcome: 'resolved' | 'refunded' | 'rejected';
    notes?: string;
    refundAmount?: number;
  }) {
    const { data } = await this.client.post(`/${id}/resolve`, payload);
    return data as { success: boolean; dispute: Dispute };
  }
}

export default new DisputeService();
