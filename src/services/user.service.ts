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
    private API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

    constructor() {
    
        this.userApiClient = axios.create({
        baseURL: `${this.API_BASE_URL}/profiles`,
        headers: {
            'Content-Type': 'application/json',
        },
        });

        // Configuration des intercepteurs pour les deux clients
        this.setupInterceptors(this.userApiClient);
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
        authentificationService.verifSession();
      }

      return response.data;
    } catch (error: any) {
      if (
        error?.response?.data?.message === "Token invalide" ||
        error?.response?.data?.code === "TOKEN_EXPIRED" ||
        error?.response?.status === 401
      ) {
        authentificationService.verifSession();
      }
      console.error("Erreur lors de la récupération :", error);
      throw error;
    }
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
        <img src="${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${profilePicture}" alt="${username}" style="width: 100%; height: 100%; object-fit: cover;" />
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