import { type AxiosInstance, AxiosError, type AxiosResponse } from "axios";
import Cookies from "js-cookie";
import router from "@/router";
import { API_URL } from '@/config/api';
import { setSessionCookies, clearSessionCookies } from '@/services/session.cookies';
import { createApiClient, refreshAccessToken } from '@/services/http';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Résultat d'une tentative de connexion.
 *
 * Quand la double authentification est active, l'API ne délivre aucun jeton
 * d'accès : elle rend un jeton de défi à courte durée de vie, à échanger sur
 * /auth/2fa/verify contre une vraie session.
 */
export type LoginResult =
  | { requiresTwoFactor: false }
  | { requiresTwoFactor: true; twoFactorToken: string };

class authentificationService {
  private authApiClient: AxiosInstance;
  private API_BASE_URL: string = `${API_URL}/api`;

  constructor() {
    // Les routes d'authentification (/login, /refresh-token, /logout, /2fa/)
    // sont exclues du renouvellement automatique côté `http.ts` : un 401 y
    // signifie « identifiants refusés », pas « session expirée ».
    this.authApiClient = createApiClient({
      baseURL: `${this.API_BASE_URL}/auth`,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/login", {
        identifier,
        password,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }

      // Second facteur requis : pas de session ouverte à ce stade.
      if (response.data.requiresTwoFactor) {
        return { requiresTwoFactor: true, twoFactorToken: response.data.twoFactorToken };
      }

      setSessionCookies({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userId: response.data.user.id
      });
      sessionStorage.removeItem("favorites");

      return { requiresTwoFactor: false };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data.message || "Erreur lors de la connexion");
    }
  }

  /**
   * Deuxième étape de connexion : échange le jeton de défi et un code (TOTP ou
   * code de secours) contre une session complète.
   */
  async verifyTwoFactor(twoFactorToken: string, code: string): Promise<void> {
    try {
      const response: AxiosResponse = await this.authApiClient.post("/2fa/verify", {
        twoFactorToken,
        code,
      });

      setSessionCookies({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userId: response.data.user.id
      });
      sessionStorage.removeItem("favorites");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data.message || "Impossible de vérifier le code."
      );
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = Cookies.get("refreshToken");
      await this.authApiClient.post("/logout", { refreshToken });
    } catch (_) {
      // Ignore errors on logout request
    } finally {
      this.clearCookies();
      router.push("/login");
    }
  }
  async verifSession(): Promise<void> {
    const refreshToken = Cookies.get("refreshToken");

    // Sans refresh token (durée de vie 7 jours), aucune session ne peut être
    // rétablie : c'est le seul cookie qui survit à la fermeture de l'onglet et
    // à l'expiration du token d'accès.
    if (!refreshToken) {
      await this.logout();
      throw new Error("No session token");
    }

    // Le token d'accès (15 min) est encore là : la session est valide, inutile
    // de solliciter l'API. Sans ce court-circuit, un simple retour sur le site
    // après expiration du token d'accès déconnectait l'utilisateur alors que le
    // refresh token restait valable.
    const sessionToken = Cookies.get("sessionToken");
    if (sessionToken) {
      return;
    }

    // Renouvellement mutualisé avec les intercepteurs : si une requête a déjà
    // lancé un rafraîchissement, on attend le même appel réseau.
    const accessToken = await refreshAccessToken();

    if (!accessToken) {
      await this.logout();
      throw new Error("Session refresh failed");
    }
  }
  clearCookies(): void {
    clearSessionCookies();
  }
}

export default new authentificationService();
