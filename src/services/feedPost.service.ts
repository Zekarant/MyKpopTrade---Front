import { type AxiosInstance } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

class FeedPostService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/posts`;
    this.apiClient = createApiClient({ baseURL });
  }

  async getFeed(page = 1, limit = 20) {
    const response = await this.apiClient.get('/feed', { params: { page, limit } });
    return response.data;
  }

  async getUserPosts(userId: string, page = 1, limit = 20) {
    const response = await this.apiClient.get(`/user/${userId}`, { params: { page, limit } });
    return response.data;
  }

  async getPost(postId: string) {
    const response = await this.apiClient.get(`/${postId}`);
    return response.data;
  }

  async createPost(content: string, images?: File[]) {
    const formData = new FormData();
    formData.append('content', content);
    if (images) {
      images.forEach(file => formData.append('postImages', file));
    }
    const response = await this.apiClient.post('/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async replyToPost(postId: string, content: string) {
    const response = await this.apiClient.post(`/${postId}/reply`, { content });
    return response.data;
  }

  async toggleLike(postId: string) {
    const response = await this.apiClient.post(`/${postId}/like`);
    return response.data;
  }

  async deletePost(postId: string) {
    const response = await this.apiClient.delete(`/${postId}`);
    return response.data;
  }
}

export default new FeedPostService();
