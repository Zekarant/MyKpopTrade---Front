import axios from "axios";
import Cookies from "js-cookie";
import { API_URL } from '@/config/api';

const API_BASE_URL = `${API_URL}/api/follows`;

function getHeaders() {
  const token = Cookies.get('sessionToken');
  return { Authorization: `Bearer ${token}` };
}

class FollowService {
  async toggleFollow(targetUserId: string) {
    const res = await axios.post(`${API_BASE_URL}/${targetUserId}/toggle`, {}, { headers: getHeaders() });
    return res.data;
  }

  async getStatus(targetUserId: string) {
    const res = await axios.get(`${API_BASE_URL}/${targetUserId}/status`, { headers: getHeaders() });
    return res.data;
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const res = await axios.get(`${API_BASE_URL}/${userId}/followers`, { headers: getHeaders(), params: { page, limit } });
    return res.data;
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const res = await axios.get(`${API_BASE_URL}/${userId}/following`, { headers: getHeaders(), params: { page, limit } });
    return res.data;
  }

  async getFriends(page = 1, limit = 20) {
    const res = await axios.get(`${API_BASE_URL}/me/friends`, { headers: getHeaders(), params: { page, limit } });
    return res.data;
  }

  async getMyCounts() {
    const res = await axios.get(`${API_BASE_URL}/me/counts`, { headers: getHeaders() });
    return res.data;
  }

  async removeFollower(followerId: string) {
    const res = await axios.delete(`${API_BASE_URL}/me/followers/${followerId}`, { headers: getHeaders() });
    return res.data;
  }
}

export default new FollowService();
