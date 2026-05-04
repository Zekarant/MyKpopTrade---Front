import axios, { type AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/config/api';

class AdminService {
  private apiClient: AxiosInstance;

  constructor() {
    const baseURL = `${API_URL}/api`;
    this.apiClient = axios.create({ baseURL });
    this.apiClient.interceptors.request.use((config) => {
      const token = Cookies.get('sessionToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // === Stats ===
  async getStats() {
    const response = await this.apiClient.get('/users/admin/stats');
    return response.data;
  }

  // === Users ===
  async getUsers(params: { page?: number; limit?: number; search?: string; role?: string; status?: string } = {}) {
    const response = await this.apiClient.get('/users/admin/list', { params });
    return response.data;
  }

  async updateUserStatus(userId: string, accountStatus: 'active' | 'suspended') {
    const response = await this.apiClient.put(`/users/admin/${userId}/status`, { accountStatus });
    return response.data;
  }

  async updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin') {
    const response = await this.apiClient.put(`/users/admin/${userId}/role`, { role });
    return response.data;
  }

  // === Reports ===
  async getReports(params: { page?: number; limit?: number; status?: string; targetType?: string } = {}) {
    const response = await this.apiClient.get('/reports', { params });
    return response.data;
  }

  async updateReportStatus(reportId: string, status: string, adminNotes?: string) {
    const response = await this.apiClient.put(`/reports/${reportId}`, { status, adminNotes });
    return response.data;
  }

  // === Verifications ===
  async getPendingVerifications() {
    const response = await this.apiClient.get('/verification/admin/pending');
    return response.data;
  }

  async approveVerification(id: string) {
    const response = await this.apiClient.post(`/verification/admin/approve/${id}`);
    return response.data;
  }

  async rejectVerification(id: string, reason: string) {
    const response = await this.apiClient.post(`/verification/admin/reject/${id}`, { reason });
    return response.data;
  }

  // === Products ===
  async getProducts(params: { page?: number; limit?: number; search?: string; status?: string; type?: string } = {}) {
    const response = await this.apiClient.get('/products/admin/list', { params });
    return response.data;
  }

  async getProductStats() {
    const response = await this.apiClient.get('/products/admin/stats');
    return response.data;
  }

  async deleteProduct(productId: string) {
    const response = await this.apiClient.delete(`/products/admin/${productId}`);
    return response.data;
  }

  // === RGPD ===
  async getDeletionRequests() {
    const response = await this.apiClient.get('/users/admin/deletion-requests');
    return response.data;
  }

  async getRgpdStats() {
    const response = await this.apiClient.get('/users/admin/rgpd-stats');
    return response.data;
  }

  async exportUserData(search: string) {
    const response = await this.apiClient.get('/users/admin/export-data', { params: { search } });
    return response.data;
  }

  async anonymizeUser(search: string) {
    const response = await this.apiClient.post('/users/admin/anonymize', { search });
    return response.data;
  }

  async confirmDeletion(userId: string) {
    const response = await this.apiClient.post(`/users/admin/${userId}/confirm-deletion`);
    return response.data;
  }

  async cancelDeletion(userId: string) {
    const response = await this.apiClient.post(`/users/admin/${userId}/cancel-deletion`);
    return response.data;
  }

  // === Modération Posts ===
  async getAdminPosts(params: { page?: number; limit?: number; search?: string; type?: string } = {}) {
    const response = await this.apiClient.get('/users/admin/posts', { params });
    return response.data;
  }

  async getPostStats() {
    const response = await this.apiClient.get('/users/admin/posts/stats');
    return response.data;
  }

  async adminDeletePost(postId: string, reason?: string) {
    const response = await this.apiClient.delete(`/users/admin/posts/${postId}`, { data: { reason } });
    return response.data;
  }

  // === Audit ===
  async getAuditLogs(params: { page?: number; limit?: number; targetType?: string } = {}) {
    const response = await this.apiClient.get('/users/admin/audit', { params });
    return response.data;
  }

  async getAuditStats() {
    const response = await this.apiClient.get('/users/admin/audit/stats');
    return response.data;
  }
}

export default new AdminService();
