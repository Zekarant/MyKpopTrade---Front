import { apiClient } from '@/services/apiClient';

/** Réponse des routes qui modifient le compte : message à afficher et compte à jour. */
export interface AccountUpdate<T> {
  message?: string;
  user?: T;
}

/** Demande de vérification d'identité en cours (GET /api/verification/identity/status). */
export interface IdentityVerificationStatus {
  verification: { status: string; submittedAt: string; rejectionReason?: string };
  userVerification: { isVerified: boolean };
}

export type LinkableProvider = 'google' | 'discord';

/**
 * Compte du membre connecté : profil privé, email, téléphone, mot de passe,
 * comptes liés et vérification d'identité, plus les liens reçus par email
 * (vérification, réinitialisation). Connexion et fin de session restent dans
 * authentification.service.ts.
 *
 * Les erreurs remontent en `ApiError` (status, code, message), comme pour tous
 * les services ; un 401 de session perdue est déjà géré par le client HTTP.
 */
class AccountService {
  private client = apiClient('/api/auth');
  private identityClient = apiClient('/api/verification/identity');

  /** Profil privé complet (GET /api/auth/profile). Le type dépend des champs lus par l'appelant. */
  async getProfile<T>(): Promise<T> {
    const { data } = await this.client.get<{ user: T }>('/profile');
    return data.user;
  }

  /** Changement de l'email : `currentPassword` est exigé par l'API. */
  async updateProfile<T>(changes: Record<string, unknown>): Promise<AccountUpdate<T>> {
    const { data } = await this.client.put<AccountUpdate<T>>('/profile', changes);
    return data;
  }

  /** Premier remplissage du profil, après une inscription par Google ou Discord. */
  async completeProfile(payload: Record<string, unknown>): Promise<void> {
    await this.client.post('/profile/complete', payload);
  }

  /**
   * `withCredentials` : l'API lit le cookie de session pour garder celle-ci
   * ouverte et fermer toutes les autres.
   */
  async updatePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<string> {
    const { data } = await this.client.put<{ message: string }>('/update-password', payload, { withCredentials: true });
    return data.message;
  }

  /**
   * Ticket à usage unique (une minute) pour lier un compte Google ou Discord :
   * une redirection ne peut pas porter d'en-tête Authorization.
   */
  async requestLinkTicket(provider: LinkableProvider): Promise<string> {
    const { data } = await this.client.post<{ ticket: string }>(`/link/${provider}`);
    return data.ticket;
  }

  async resendVerificationEmail(email: string): Promise<string | undefined> {
    const { data } = await this.client.post<{ message?: string }>('/resend-verification', { email });
    return data?.message;
  }

  async verifyEmail(token: string): Promise<string | undefined> {
    const { data } = await this.client.get<{ message?: string }>(`/verify-email/${encodeURIComponent(token)}`);
    return data?.message;
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<string | undefined> {
    const { data } = await this.client.post<{ message?: string }>(
      `/reset-password/${encodeURIComponent(token)}`,
      { password, confirmPassword }
    );
    return data?.message;
  }

  async sendPhoneVerification(): Promise<void> {
    await this.client.post('/send-phone-verification', {});
  }

  async verifyPhone(code: string): Promise<void> {
    await this.client.post('/verify-phone', { code });
  }

  /** @throws ApiError 404 quand aucune demande n'a été déposée */
  async getIdentityVerification(): Promise<IdentityVerificationStatus> {
    const { data } = await this.identityClient.get<IdentityVerificationStatus>('/status/');
    return data;
  }

  async submitIdentityVerification(documentType: string, document: File): Promise<void> {
    const body = new FormData();
    body.append('documentType', documentType);
    body.append('consentGiven', 'true');
    body.append('document', document);
    await this.identityClient.post('', body);
  }

  async cancelIdentityVerification(): Promise<string> {
    const { data } = await this.identityClient.delete<{ message: string }>('/cancel');
    return data.message;
  }
}

export default new AccountService();
