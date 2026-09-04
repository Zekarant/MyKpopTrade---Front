import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

const client = createApiClient({ baseURL: `${API_URL}/api/follows` });

class FollowService {
  async toggleFollow(targetUserId: string) {
    const res = await client.post(`/${targetUserId}/toggle`, {});
    return res.data;
  }

  async getStatus(targetUserId: string) {
    const res = await client.get(`/${targetUserId}/status`);
    return res.data;
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const res = await client.get(`/${userId}/followers`, { params: { page, limit } });
    return res.data;
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const res = await client.get(`/${userId}/following`, { params: { page, limit } });
    return res.data;
  }

  async getFriends(page = 1, limit = 20) {
    const res = await client.get('/me/friends', { params: { page, limit } });
    return res.data;
  }

  async getMyCounts() {
    const res = await client.get('/me/counts');
    return res.data;
  }

  async removeFollower(followerId: string) {
    const res = await client.delete(`/me/followers/${followerId}`);
    return res.data;
  }
}

export default new FollowService();
