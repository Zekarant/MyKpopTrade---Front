import { type AxiosInstance } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

/** Valeurs acceptées par l'enum `albumType` du modèle back. */
export type AlbumType = 'album' | 'single' | 'ep' | 'compilation';

export interface KpopAlbum {
  _id: string;
  name: string;
  /** Peuplé (`name`, `profileImage`) par les routes de liste et de recherche. */
  artistId?: string | { _id: string; name: string; profileImage?: string };
  artistName?: string;
  albumType?: AlbumType;
  releaseDate?: string | null;
  coverImage?: string;
  totalTracks?: number;
}

/** Corps admin de création / mise à jour : le back résout `artistName` à partir de `artistId`. */
export interface AlbumPayload {
  name?: string;
  artistId?: string;
  albumType?: AlbumType;
  releaseDate?: string;
  coverImage?: string;
}

export type CreateAlbumPayload = AlbumPayload & { name: string; artistId: string };

class AlbumService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api/albums`;
    this.apiClient = createApiClient({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
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
  async createAlbum(payload: CreateAlbumPayload): Promise<KpopAlbum> {
    const response = await this.apiClient.post('/', payload);
    return response.data?.album || response.data;
  }

  async updateAlbum(albumId: string, payload: AlbumPayload): Promise<KpopAlbum> {
    const response = await this.apiClient.put(`/${albumId}`, payload);
    return response.data?.album || response.data;
  }

  async deleteAlbum(albumId: string): Promise<void> {
    await this.apiClient.delete(`/${albumId}`);
  }
}

export default new AlbumService();
