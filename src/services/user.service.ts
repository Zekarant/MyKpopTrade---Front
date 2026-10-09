// services/user.service.ts
import type { AxiosInstance, AxiosResponse } from "axios";

import authentificationService  from '@/services/authentification.service';
import type { UserResponse } from "@/types/user.types";
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';
import { apiErrorResponse, type ApiErrorBody } from '@/services/apiError';



/** Réponse de GET /api/profiles/verification-stats/:userId (preuves par statut). */
export interface VerificationStats {
  verified: number;
  pending: number;
  rejected: number;
  total: number;
  totalSales: number;
  totalPurchases: number;
}

class userService {
    private userApiClient: AxiosInstance;
    private rgpdApiClient: AxiosInstance;
    private API_BASE_URL: string = `${API_URL}/api`;

    constructor() {

        this.userApiClient = createApiClient({
        baseURL: `${this.API_BASE_URL}/profiles`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        this.rgpdApiClient = createApiClient({
        baseURL: `${this.API_BASE_URL}/users`,
        headers: {
            'Content-Type': 'application/json',
        },
        });
    }

  async getMyInformation(): Promise<UserResponse> {
    try {
      const response: AxiosResponse<UserResponse & ApiErrorBody> = await this.userApiClient.get(
        `/me`
      );

      if (
        response.data.message === "Token invalide" ||
        response.data.code === "TOKEN_EXPIRED" ||
        response.status === 401
      ) {
        await authentificationService.verifSession().catch(() => {});
      }

      return response.data;
    } catch (error) {
      const errorResponse = apiErrorResponse(error);
      if (
        errorResponse?.data?.message === "Token invalide" ||
        errorResponse?.data?.code === "TOKEN_EXPIRED" ||
        errorResponse?.status === 401
      ) {
        await authentificationService.verifSession().catch(() => {});
      }
      console.error("Erreur lors de la récupération :", error);
      throw error;
    }
  }
  /**
   * Met à jour les consentements RGPD stockés sur le compte.
   *
   * Le contrat est celui de PUT /api/users/me/consents : toute autre clé est
   * ignorée côté serveur. Le consentement aux cookies est distinct — il est
   * lié au terminal, pas au compte (cf. services/consent.service.ts).
   */
  async updateConsents(payload: {
    privacyPolicy?: boolean;
    dataProcessing?: boolean;
    marketing?: boolean;
  }) {
    const response = await this.rgpdApiClient.put('/me/consents', payload);
    return response.data;
  }

  /** Indicateurs de confiance publics d'un membre (preuves de transaction, ventes, achats). */
  async getVerificationStats(userId: string): Promise<VerificationStats> {
    const response: AxiosResponse<{ statistics: VerificationStats }> = await this.userApiClient.get(
      `/verification-stats/${encodeURIComponent(userId)}`
    );
    return response.data.statistics;
  }

  async exportMyData() {
    const response = await this.rgpdApiClient.get('/me/data-export');
    return response.data;
  }

  async requestAccountDeletion(payload: { confirmation: boolean }) {
    const response = await this.rgpdApiClient.post('/me/deletion-request', payload);
    return response.data;
  }

  async cancelAccountDeletion() {
    const response = await this.rgpdApiClient.delete('/me/deletion-request');
    return response.data;
  }

  async anonymizeMyAccount(payload: { confirmation: boolean }) {
    const response = await this.rgpdApiClient.post('/me/anonymize', payload);
    return response.data;
  }
  // L'avatar n'est plus rendu ici en HTML : voir components/UserAvatar.vue.
};
export default new userService();
