import { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export interface KpopGroup {
  _id: string;
  name: string;
  image?: string;
  members?: string[];
  followersCount?: number;
}

class GroupService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/groups`;
    this.apiClient = createApiClient({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getGroups(params?: { limit?: number; page?: number }): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.apiClient.get('/', { params });
    return response.data.groups;
  }

  async getPopularGroups(): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.apiClient.get('/popular');
    return response.data.groups;
  }

  async searchGroups(query: string, includeInactive = false): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.apiClient.get('/search', {
      params: { query, includeInactive },
    });
    return response.data.groups;
  }

  async getMyFollowedGroups(): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.apiClient.get('/my-followed');
    return response.data.groups;
  }

  async getGroup(groupId: string): Promise<KpopGroup> {
    const response: AxiosResponse<KpopGroup> = await this.apiClient.get(`/${groupId}`);
    return response.data;
  }

  async toggleFollow(groupId: string): Promise<{ following: boolean }> {
    const response: AxiosResponse<{ following: boolean }> = await this.apiClient.post(`/${groupId}/follow`);
    return response.data;
  }

  async getFollowStatus(groupId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ following: boolean }> = await this.apiClient.get(`/${groupId}/follow-status`);
      return response.data.following;
    } catch {
      return false;
    }
  }

  async getFollowers(groupId: string, page = 1, limit = 20) {
    const response = await this.apiClient.get(`/${groupId}/followers`, { params: { page, limit } });
    return response.data;
  }

  // Admin
  async createGroup(payload: Partial<KpopGroup> & { name: string }): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.apiClient.post('/', payload);
    return response.data.group;
  }

  async updateGroup(groupId: string, payload: Partial<KpopGroup>): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.apiClient.put(`/${groupId}`, payload);
    return response.data.group;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.apiClient.delete(`/${groupId}`);
  }
}

export default new GroupService();
