import { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export interface KpopGroup {
  _id: string;
  name: string;
  profileImage?: string;
  bannerImage?: string;
  genres?: string[];
  tags?: string[];
  followersCount?: number;
  isActive?: boolean;
  members?: string[];
}

export interface GroupPayload {
  name?: string;
  profileImage?: string;
  members?: string[];
}

/** Route publique : pas d'email. */
export interface GroupFollower {
  _id: string;
  username: string;
  profilePicture?: string;
  createdAt?: string;
}

export interface GroupFollowersResponse {
  groupId: string;
  groupName: string;
  followers: GroupFollower[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface GroupFollowResult {
  message: string;
  isFollowing: boolean;
  followersCount: number;
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
    const response: AxiosResponse<{ group: KpopGroup }> = await this.apiClient.get(`/${groupId}`);
    return response.data.group;
  }

  async toggleFollow(groupId: string): Promise<GroupFollowResult> {
    const response: AxiosResponse<GroupFollowResult> = await this.apiClient.post(`/${groupId}/follow`);
    return response.data;
  }

  async getFollowStatus(groupId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ isFollowing: boolean }> = await this.apiClient.get(`/${groupId}/follow-status`);
      return response.data.isFollowing;
    } catch {
      return false;
    }
  }

  async getFollowers(groupId: string, page = 1, limit = 20): Promise<GroupFollowersResponse> {
    const response: AxiosResponse<GroupFollowersResponse> = await this.apiClient.get(`/${groupId}/followers`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Admin
  async createGroup(payload: GroupPayload & { name: string }): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.apiClient.post('/', payload);
    return response.data.group;
  }

  async updateGroup(groupId: string, payload: GroupPayload): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.apiClient.put(`/${groupId}`, payload);
    return response.data.group;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.apiClient.delete(`/${groupId}`);
  }
}

export default new GroupService();
