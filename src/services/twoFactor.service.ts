import axios, { type AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/config/api';

/**
 * Gestion de la double authentification (TOTP) depuis les paramètres du compte.
 *
 * La deuxième étape de la connexion ne passe pas par ici : elle est dans
 * `authentification.service.ts`, car elle s'effectue sans session ouverte.
 */

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
  remainingRecoveryCodes: number;
  activationPending: boolean;
}

export interface TwoFactorSetup {
  /** Image PNG en data URI, à afficher directement dans une balise <img>. */
  qrCodeDataUrl: string;
  /** Secret en base32, pour la saisie manuelle si le QR code est inutilisable. */
  secret: string;
  otpauthUri: string;
}

class TwoFactorService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/auth/2fa`,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('sessionToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /** Transforme une erreur axios en Error portant le message de l'API. */
  private toError(error: unknown, fallback: string): Error {
    const axiosError = error as AxiosError<{ message?: string }>;
    return new Error(axiosError.response?.data?.message || fallback);
  }

  async getStatus(): Promise<TwoFactorStatus> {
    try {
      const { data } = await this.client.get<TwoFactorStatus>('/status');
      return data;
    } catch (error) {
      throw this.toError(error, 'Impossible de récupérer l\'état de la double authentification.');
    }
  }

  /** Démarre l'activation : rend le QR code à scanner. N'active rien. */
  async startSetup(): Promise<TwoFactorSetup> {
    try {
      const { data } = await this.client.post<TwoFactorSetup>('/setup');
      return data;
    } catch (error) {
      throw this.toError(error, 'Impossible de démarrer la configuration.');
    }
  }

  /** Confirme l'activation et rend les codes de secours, affichés une seule fois. */
  async enable(code: string): Promise<{ recoveryCodes: string[] }> {
    try {
      const { data } = await this.client.post<{ recoveryCodes: string[] }>('/enable', { code });
      return data;
    } catch (error) {
      throw this.toError(error, 'Code invalide.');
    }
  }

  /** Désactive la double authentification. Exige le mot de passe ET un code. */
  async disable(password: string, code: string): Promise<void> {
    try {
      await this.client.post('/disable', { password, code });
    } catch (error) {
      throw this.toError(error, 'Impossible de désactiver la double authentification.');
    }
  }

  /** Régénère les codes de secours, invalidant les précédents. */
  async regenerateRecoveryCodes(code: string): Promise<{ recoveryCodes: string[] }> {
    try {
      const { data } = await this.client.post<{ recoveryCodes: string[] }>('/recovery-codes', {
        code
      });
      return data;
    } catch (error) {
      throw this.toError(error, 'Impossible de régénérer les codes de secours.');
    }
  }
}

export default new TwoFactorService();
