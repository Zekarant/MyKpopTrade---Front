import type { AxiosResponse } from 'axios';
import { apiClient } from '@/services/apiClient';
import type { KpopAlbum } from '@/services/album.service';

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

export interface GroupDetail {
  group: KpopGroup;
  albums: KpopAlbum[];
}

export interface FollowedGroupsPage {
  groups: KpopGroup[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface GroupFollowResult {
  message: string;
  isFollowing: boolean;
  followersCount: number;
}

class GroupService {
  private client = apiClient('/api/groups');

  async getGroups(params?: { limit?: number; page?: number }): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.client.get('/', { params });
    return response.data.groups;
  }

  async getPopularGroups(): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.client.get('/popular');
    return response.data.groups;
  }

  async searchGroups(query: string, includeInactive = false): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.client.get('/search', {
      params: { query, includeInactive },
    });
    return response.data.groups;
  }

  async getMyFollowedGroups(): Promise<KpopGroup[]> {
    const response: AxiosResponse<{ groups: KpopGroup[] }> = await this.client.get('/my-followed');
    return response.data.groups;
  }

  /** Groupes suivis, page par page (triés par nom côté API). */
  async getMyFollowedGroupsPage(page = 1, limit = 24): Promise<FollowedGroupsPage> {
    const response: AxiosResponse<FollowedGroupsPage> = await this.client.get('/my-followed', { params: { page, limit } });
    return response.data;
  }

  /** Page groupe : le groupe et ses albums (les plus récents d'abord), en une requête. */
  async getGroupDetail(groupId: string): Promise<GroupDetail> {
    const response: AxiosResponse<GroupDetail> = await this.client.get(`/${groupId}`);
    return { group: response.data.group, albums: response.data.albums ?? [] };
  }

  async getGroup(groupId: string): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.client.get(`/${groupId}`);
    return response.data.group;
  }

  async toggleFollow(groupId: string): Promise<GroupFollowResult> {
    const response: AxiosResponse<GroupFollowResult> = await this.client.post(`/${groupId}/follow`);
    return response.data;
  }

  async getFollowStatus(groupId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ isFollowing: boolean }> = await this.client.get(`/${groupId}/follow-status`);
      return response.data.isFollowing;
    } catch {
      return false;
    }
  }

  async getFollowers(groupId: string, page = 1, limit = 20): Promise<GroupFollowersResponse> {
    const response: AxiosResponse<GroupFollowersResponse> = await this.client.get(`/${groupId}/followers`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Admin
  async createGroup(payload: GroupPayload & { name: string }): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.client.post('/', payload);
    return response.data.group;
  }

  async updateGroup(groupId: string, payload: GroupPayload): Promise<KpopGroup> {
    const response: AxiosResponse<{ group: KpopGroup }> = await this.client.put(`/${groupId}`, payload);
    return response.data.group;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.client.delete(`/${groupId}`);
  }
}

export default new GroupService();
