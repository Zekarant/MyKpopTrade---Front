import axios, { type AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/config/api';

export interface KpopAlbum {
  _id: string;
  name: string;
  group?: string | { _id: string; name: string };
  releaseDate?: string;
  coverImage?: string;
  type?: string;
}

class AlbumService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/albums`;
    this.apiClient = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.apiClient.interceptors.request.use((config) => {
      const token = Cookies.get('sessionToken') || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAlbums(params?: { limit?: number; page?: number }): Promise<KpopAlbum[]> {
    const response = await this.apiClient.get('/', { params });
    return response.data?.albums || response.data || [];
  }

  async searchAlbums(query: string, limit?: number): Promise<KpopAlbum[]> {
    const response = await this.apiClient.get('/search', { params: { query, limit } });
    return response.data?.albums || response.data || [];
  }

  async getAlbum(albumId: string): Promise<KpopAlbum> {
    const response = await this.apiClient.get(`/${albumId}`);
    return response.data?.album || response.data;
  }

  async getAlbumsByGroup(groupId: string): Promise<KpopAlbum[]> {
    const response = await this.apiClient.get(`/group/${groupId}`);
    return response.data?.albums || response.data || [];
  }

  // Admin
  async createAlbum(payload: Partial<KpopAlbum> & { name: string; group: string }): Promise<KpopAlbum> {
    const response = await this.apiClient.post('/', payload);
    return response.data?.album || response.data;
  }

  async updateAlbum(albumId: string, payload: Partial<KpopAlbum>): Promise<KpopAlbum> {
    const response = await this.apiClient.put(`/${albumId}`, payload);
    return response.data?.album || response.data;
  }

  async deleteAlbum(albumId: string): Promise<void> {
    await this.apiClient.delete(`/${albumId}`);
  }
}

export default new AlbumService();
