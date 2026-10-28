import type { AxiosResponse } from 'axios';
import { apiClient } from '@/services/apiClient';

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
  private client = apiClient('/api/faqs');

  async getFaqs(): Promise<Faq[]> {
    const response: AxiosResponse<{ faqs: Faq[] }> = await this.client.get('/');
    return response.data.faqs;
  }

  // Admin
  async getAllFaqs(): Promise<Faq[]> {
    const response: AxiosResponse<{ faqs: Faq[] }> = await this.client.get('/admin/list');
    return response.data.faqs;
  }

  async createFaq(payload: FaqPayload & { question: string; answer: string }): Promise<Faq> {
    const response: AxiosResponse<{ faq: Faq }> = await this.client.post('/admin', payload);
    return response.data.faq;
  }

  async updateFaq(faqId: string, payload: FaqPayload): Promise<Faq> {
    const response: AxiosResponse<{ faq: Faq }> = await this.client.put(`/admin/${faqId}`, payload);
    return response.data.faq;
  }

  async deleteFaq(faqId: string): Promise<void> {
    await this.client.delete(`/admin/${faqId}`);
  }
}

export default new FaqService();
