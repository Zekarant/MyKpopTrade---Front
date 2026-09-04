import { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaqPayload {
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isPublished?: boolean;
}

class FaqService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/faqs`;
    this.apiClient = createApiClient({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getFaqs(): Promise<Faq[]> {
    const response: AxiosResponse<{ faqs: Faq[] }> = await this.apiClient.get('/');
    return response.data.faqs;
  }

  // Admin
  async getAllFaqs(): Promise<Faq[]> {
    const response: AxiosResponse<{ faqs: Faq[] }> = await this.apiClient.get('/admin/list');
    return response.data.faqs;
  }

  async createFaq(payload: FaqPayload & { question: string; answer: string }): Promise<Faq> {
    const response: AxiosResponse<{ faq: Faq }> = await this.apiClient.post('/admin', payload);
    return response.data.faq;
  }

  async updateFaq(faqId: string, payload: FaqPayload): Promise<Faq> {
    const response: AxiosResponse<{ faq: Faq }> = await this.apiClient.put(`/admin/${faqId}`, payload);
    return response.data.faq;
  }

  async deleteFaq(faqId: string): Promise<void> {
    await this.apiClient.delete(`/admin/${faqId}`);
  }
}

export default new FaqService();
