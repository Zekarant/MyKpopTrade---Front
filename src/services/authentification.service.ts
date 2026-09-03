import axios, { type AxiosInstance, AxiosError, type AxiosResponse } from "axios";
import Cookies from "js-cookie";
import router from "@/router";
import { API_URL } from '@/config/api';
import { setSessionCookies, clearSessionCookies } from '@/services/session.cookies';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
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

type AuthToken = string | null;

class authentificationService {
  private authApiClient: AxiosInstance;
  private API_BASE_URL: string = `${API_URL}/api`;

  constructor() {
    this.authApiClient = axios.create({
      baseURL: `${this.API_BASE_URL}/auth`,
      headers: {
        "Content-Type": "application/json",
      }
    });

    this.setupInterceptors(this.authApiClient);
  }

  private setupInterceptors(client: AxiosInstance): void {
    client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private handleUnauthorized(): void {
    localStorage.removeItem("token");
    this.clearCookies();
    router.push("/login");
  }

  private getAuthToken(): AuthToken {
    const sessionToken = Cookies.get("sessionToken");
    if (sessionToken) {
      return sessionToken;
    }
    return localStorage.getItem("token");
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

    try {
      const response: AxiosResponse<RefreshTokenResponse> = await this.authApiClient.post(
        '/refresh-token',
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        setSessionCookies({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        });
      } else {
        await this.logout();
        throw new Error("Session refresh failed");
      }
    } catch (error) {
      if ((error as Error).message === "No session token" || (error as Error).message === "Session refresh failed") {
        throw error;
      }
      const axiosError = error as AxiosError<ApiError>;
      console.error("Erreur lors de la vérification de session :", axiosError.response?.data);
      await this.logout();
      throw new Error("Session verification failed");
    }
  }
  clearCookies(): void {
    clearSessionCookies();
  }
}

export default new authentificationService();
