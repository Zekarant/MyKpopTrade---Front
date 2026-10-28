import type { UserResponse } from '@/types/user.types';
import { apiClient } from '@/services/apiClient';

/** Réponse de GET /api/profiles/verification-stats/:userId (preuves par statut). */
export interface VerificationStats {
  verified: number;
  pending: number;
  rejected: number;
  total: number;
  totalSales: number;
  totalPurchases: number;
}

/**
 * Profil du membre connecté et droits RGPD sur son compte.
 * Une session expirée est gérée par le client HTTP (renouvellement, puis
 * retour à la connexion) : les méthodes n'ont pas à s'en occuper.
 */
class UserService {
  private profilesClient = apiClient('/api/profiles');
  private usersClient = apiClient('/api/users');

  async getMyInformation(): Promise<UserResponse> {
    const { data } = await this.profilesClient.get<UserResponse>('/me');
    return data;
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
    const { data } = await this.usersClient.put('/me/consents', payload);
    return data;
  }

  /** Indicateurs de confiance publics d'un membre (preuves de transaction, ventes, achats). */
  async getVerificationStats(userId: string): Promise<VerificationStats> {
    const { data } = await this.profilesClient.get<{ statistics: VerificationStats }>(
      `/verification-stats/${encodeURIComponent(userId)}`
    );
    return data.statistics;
  }

  async exportMyData() {
    const { data } = await this.usersClient.get('/me/data-export');
    return data;
  }

  async requestAccountDeletion(payload: { confirmation: boolean }) {
    const { data } = await this.usersClient.post('/me/deletion-request', payload);
    return data;
  }

  async cancelAccountDeletion() {
    const { data } = await this.usersClient.delete('/me/deletion-request');
    return data;
  }

  async anonymizeMyAccount(payload: { confirmation: boolean }) {
    const { data } = await this.usersClient.post('/me/anonymize', payload);
    return data;
  }
}

export default new UserService();
