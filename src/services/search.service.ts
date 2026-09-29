import type { AxiosInstance } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';
import type { Post } from '@/types/post.types';

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

export interface AdvancedSearchResponse {
  products: Post[];
  pagination: { page: number; limit: number; total: number; pages: number };
  searchMetadata?: Record<string, unknown>;
}

/** Suggestions de la barre de recherche : groupes, albums et membres. */
export interface SearchSuggestions {
  groups: { _id: string; name: string; profileImage?: string }[];
  albums: { _id: string; name: string; coverImage?: string; artistName?: string }[];
  members: { name: string; groupName: string }[];
}

export interface SearchHistoryEntry {
  _id: string;
  query: string;
  lastSearched?: string;
  searchCount?: number;
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
    const response = await this.apiClient.post<AdvancedSearchResponse>('/advanced', payload);
    return response.data;
  }

  async getSuggestions(query: string) {
    const response = await this.apiClient.get<{ suggestions: SearchSuggestions }>('/suggestions', { params: { query } });
    return response.data;
  }

  async getHistory() {
    const response = await this.apiClient.get<{ searchHistory: SearchHistoryEntry[] }>('/history');
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
