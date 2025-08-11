// services/user.service.ts
import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

import Cookies from "js-cookie";
import type {
    IUser,
    UserResponse
} from "@/types/user.types";
import router from "@/router";

const getSessionToken = (): string | undefined => Cookies.get('sessionToken');
const getIdUser = (): string | undefined => Cookies.get('id_user');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
type AuthToken = string | null;


class authentificationService {
    private authApiClient: AxiosInstance;
    private API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

    constructor() {
    
        this.authApiClient = axios.create({
        baseURL: `${this.API_BASE_URL}/auth`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        // Configuration des intercepteurs pour les deux clients
        this.setupInterceptors(this.authApiClient);
    }
    private setupInterceptors(client: AxiosInstance): void {
        // Intercepteur pour ajouter le token JWT ou le cookie PHPSESSID
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

        // Intercepteur pour gérer les erreurs
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
        localStorage.removeItem('token');
        router.push('/login');
    }
    private getAuthToken(): AuthToken {
        // Utilise js-cookie pour récupérer le sessionToken
        const sessionToken = Cookies.get('sessionToken');
        if (sessionToken) {
        return sessionToken;
        }

        // Fallback : récupère le token du localStorage
        return localStorage.getItem('token');
    }
  async logout(): Promise<void> {
    try {
      const refreshToken = Cookies.get("refreshToken");
      const sessionToken = Cookies.get("sessionToken");
      await this.authApiClient.post(
        '/logout',
        { refreshToken },
      );

      this.clearCookies();
      router.push("/login");
    } catch (error) {
      this.clearCookies();
      router.push("/login");
    }
  }

  async verifSession(): Promise<void> {
    const sessionToken = Cookies.get("sessionToken");

    if (!sessionToken) {
      this.logout();
      return;
    }

    try {
      const refreshToken = Cookies.get("refreshToken");

      const response: AxiosResponse<RefreshTokenResponse> = await this.authApiClient.post(
        '/refresh-token',
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.status === 200) {
        Cookies.set("sessionToken", response.data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", response.data.refreshToken, { expires: 1 });
      } else {
        this.logout();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Erreur lors de la vérification de session :", axiosError.response?.data);
      this.logout();
    }
  }

  clearCookies(): void {
    Cookies.remove("sessionToken");
    Cookies.remove("refreshToken");
    document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }
};

export default new authentificationService();