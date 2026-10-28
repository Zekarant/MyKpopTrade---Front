import { apiClient } from '@/services/apiClient';

class FeedPostService {
  private client = apiClient('/api/posts');

  async getFeed(page = 1, limit = 20) {
    const response = await this.client.get('/feed', { params: { page, limit } });
    return response.data;
  }

  async getUserPosts(userId: string, page = 1, limit = 20) {
    const response = await this.client.get(`/user/${userId}`, { params: { page, limit } });
    return response.data;
  }

  async getPost(postId: string) {
    const response = await this.client.get(`/${postId}`);
    return response.data;
  }

  async createPost(content: string, images?: File[]) {
    const formData = new FormData();
    formData.append('content', content);
    if (images) {
      images.forEach(file => formData.append('postImages', file));
    }
    // axios pose lui-même `multipart/form-data` et sa frontière pour un FormData.
    const response = await this.client.post('/', formData);
    return response.data;
  }

  async replyToPost(postId: string, content: string) {
    const response = await this.client.post(`/${postId}/reply`, { content });
    return response.data;
  }

  async toggleLike(postId: string) {
    const response = await this.client.post(`/${postId}/like`);
    return response.data;
  }

  async deletePost(postId: string) {
    const response = await this.client.delete(`/${postId}`);
    return response.data;
  }
}

export default new FeedPostService();
