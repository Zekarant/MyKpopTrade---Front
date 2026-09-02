// services/user.service.ts
import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";

import Cookies from "js-cookie";
import authentificationService  from '@/services/authentification.service';
import type {
    IUser,
    UserResponse,
    ImgUserProfile
} from "@/types/user.types";
import router from "@/router";
import { API_URL } from '@/config/api';

const getSessionToken = (): string | undefined => Cookies.get('sessionToken');
const getIdUser = (): string | undefined => Cookies.get('id_user');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

type AuthToken = string | null;



class userService {
    private userApiClient: AxiosInstance;
    private rgpdApiClient: AxiosInstance;
    private API_BASE_URL: string = `${API_URL}/api`;

    constructor() {

        this.userApiClient = axios.create({
        baseURL: `${this.API_BASE_URL}/profiles`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        this.rgpdApiClient = axios.create({
        baseURL: `${this.API_BASE_URL}/users`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        this.setupInterceptors(this.userApiClient);
        this.setupInterceptors(this.rgpdApiClient);
    }
    // Interceptor setup authentificationServicetion
    private setupInterceptors(client: AxiosInstance) {
        client.interceptors.request.use(
            (config) => {
            const token = this.getAuthToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
            },
            (error: any) => Promise.reject(error)
        );

        client.interceptors.response.use(
            (response) => response,
            (error: any) => {
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

  async getMyInformation(): Promise<UserResponse> {
    try {
      const response: AxiosResponse<UserResponse> = await this.userApiClient.get(
        `/me`
      );

      if (
        response.data.message === "Token invalide" ||
        (response as any).data.code === "TOKEN_EXPIRED" ||
        response.status === 401
      ) {
        await authentificationService.verifSession();
      }

      return response.data;
    } catch (error: any) {
      if (
        error?.response?.data?.message === "Token invalide" ||
        error?.response?.data?.code === "TOKEN_EXPIRED" ||
        error?.response?.status === 401
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

  renderUserAvatar(dataUser: ImgUserProfile): string {
    const { username, profilePicture } = dataUser;

    if (
      profilePicture &&
      profilePicture.trim() !== "" &&
      profilePicture.trim() !==
        "https://mykpoptrade.com/images/avatar-default.png"
    ) {
      return `
        <img src="${API_URL}${profilePicture}" alt="${username}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:linear-gradient(135deg,#ff2d78,#7c3aed);border-radius:3px;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;\\'>${username?.charAt(0).toUpperCase() || '?'}</div>'" />
      `;
    } else {
      const firstLetter = username?.charAt(0).toUpperCase() || "?";
      return `
        <div style="
          width: 100%;
          height: 100%;
          object-fit: contain;
          background-color: var(--primary-color);
          border-radius: 3px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
        ">
          ${firstLetter}
        </div>
      `;
    }
  }
};
export default new userService();
