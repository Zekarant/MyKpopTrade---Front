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

export type NotificationCategory = 'orders' | 'offers' | 'messages' | 'disputes' | 'reviews' | 'social';
export type NotificationChannel = 'email' | 'push';
export type NotificationPreferences = Record<NotificationCategory, Record<NotificationChannel, boolean>>;

export type ProfileMediaKind = 'banner' | 'picture';

/** Champ d'upload, qui est aussi la clé du chemin dans la réponse de l'API. */
const PROFILE_MEDIA_FIELDS: Record<ProfileMediaKind, 'profileBanner' | 'profilePicture'> = {
  banner: 'profileBanner',
  picture: 'profilePicture'
};

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

  /** Profil public d'un autre membre. Le type dépend des champs lus par l'appelant. */
  async getPublicProfile<T>(userId: string): Promise<T> {
    const { data } = await this.profilesClient.get<{ profile: T }>(`/user/${encodeURIComponent(userId)}`);
    return data.profile;
  }

  /**
   * Envoie la photo ou la bannière de mon profil.
   * Pas d'en-tête Content-Type manuel : axios pose celui d'un FormData, avec son boundary.
   * @returns le chemin de l'image enregistrée
   */
  async uploadProfileMedia(kind: ProfileMediaKind, file: File): Promise<string> {
    const field = PROFILE_MEDIA_FIELDS[kind];
    const body = new FormData();
    body.append(field, file);
    const { data } = await this.profilesClient.post<Record<string, string>>(`/me/${kind}`, body);
    return data[field];
  }

  async deleteProfileMedia(kind: ProfileMediaKind): Promise<void> {
    await this.profilesClient.delete(`/me/${kind}`);
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const { data } = await this.usersClient.get<{ preferences: NotificationPreferences }>('/me/notification-preferences');
    return data.preferences;
  }

  /** Envoie seulement les réglages changés : l'API fusionne et rend l'ensemble à jour. */
  async updateNotificationPreferences(
    changes: Partial<Record<NotificationCategory, Partial<Record<NotificationChannel, boolean>>>>
  ): Promise<NotificationPreferences> {
    const { data } = await this.usersClient.put<{ preferences: NotificationPreferences }>('/me/notification-preferences', changes);
    return data.preferences;
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

  async anonymizeMyAccount(payload: { confirmation: boolean; currentPassword: string }) {
    const { data } = await this.usersClient.post('/me/anonymize', payload);
    return data;
  }
}

export default new UserService();
