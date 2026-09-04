import type { AxiosInstance } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export interface AdvancedSearchPayload {
  query?: string;
  groups?: string[];
  members?: string[];
  albums?: string[];
  priceRange?: { min?: number; max?: number };
  condition?: string[];
  type?: string;
  albumType?: string;
  era?: string;
  company?: string;
  currency?: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular';
  page?: number;
  limit?: number;
  includeOwnProducts?: boolean;
}

class SearchService {
  private apiClient: AxiosInstance;
  private API_BASE_URL: string = `${API_URL}/api`;

  constructor() {
    this.apiClient = createApiClient({
      baseURL: `${this.API_BASE_URL}/search`,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async advancedSearch(payload: AdvancedSearchPayload) {
    const response = await this.apiClient.post('/advanced', payload);
    return response.data;
  }

  async getSuggestions(query: string) {
    const response = await this.apiClient.get('/suggestions', { params: { query } });
    return response.data;
  }

  async getHistory() {
    const response = await this.apiClient.get('/history');
    return response.data;
  }

  async deleteHistoryItem(historyId: string) {
    const response = await this.apiClient.delete(`/history/${historyId}`);
    return response.data;
  }

  async clearHistory() {
    const response = await this.apiClient.delete('/history');
    return response.data;
  }
}

export default new SearchService();
