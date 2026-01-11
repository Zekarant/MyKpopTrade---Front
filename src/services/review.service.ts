import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import type { ReviewData, Review, ApiResponse, ProfileReviewsResponse } from '@/types/review.types';

const getSessionToken = (): string | undefined => Cookies.get('sessionToken');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ReviewService {
  private apiClient: AxiosInstance;
  private API_BASE_URL: string = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;

  constructor() {
    this.apiClient = axios.create({
      baseURL: this.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors(this.apiClient);
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
      (error) => Promise.reject(error)
    );

    client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleError(error))
    );
  }

  private getAuthToken(): string | null {
    try {
      const token = getSessionToken();
      return token ? token : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown>;
      return {
        message: (data?.message as string) || 'Une erreur est survenue',
        status,
        code: data?.code as string,
      };
    } else if (error.request) {
      return {
        message: 'Aucune réponse du serveur',
        code: 'NO_RESPONSE',
      };
    }
    return {
      message: 'Erreur de configuration de la requête',
      code: 'REQUEST_ERROR',
    };
  }

  async submitReview(reviewData: ReviewData): Promise<Review> {
    try {
      // Utiliser FormData si des images sont présentes
      if (reviewData.ratingImages && reviewData.ratingImages.length > 0) {
        const formData = new FormData();
        
        // Ajouter les champs texte
        formData.append('transactionId', reviewData.transactionId);
        formData.append('recipientId', reviewData.recipientId);
        formData.append('rating', reviewData.rating.toString());
        formData.append('review', reviewData.review);
        formData.append('type', reviewData.type);
        
        // Ajouter les fichiers images
        reviewData.ratingImages.forEach((file) => {
          formData.append('ratingImages', file);
        });
        
        const response: AxiosResponse<ApiResponse<Review>> = await this.apiClient.post(
          '/api/profiles/ratings',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data.data;
      } else {
        // Envoyer en JSON si pas d'images
        const response: AxiosResponse<ApiResponse<Review>> = await this.apiClient.post(
          '/api/profiles/ratings',
          reviewData
        );
        return response.data.data;
      }
    } catch (error) {
      const apiError = this.handleError(error as AxiosError);
      throw apiError;
    }
  }

  async getReview(reviewId: string): Promise<Review> {
    try {
      const response: AxiosResponse<ApiResponse<Review>> = await this.apiClient.get(
        `/api/profiles/ratings/${reviewId}`
      );
      return response.data.data;
    } catch (error) {
      const apiError = this.handleError(error as AxiosError);
      throw apiError;
    }
  }

  async getUserReviews(): Promise<Review[]> {
    try {
      const response: AxiosResponse<ApiResponse<Review[]>> = await this.apiClient.get(
        '/api/profiles/ratings'
      );
      return response.data.data;
    } catch (error) {
      const apiError = this.handleError(error as AxiosError);
      throw apiError;
    }
  }

  async getProfileReviews(userId: string): Promise<ProfileReviewsResponse> {
    try {
      const response: AxiosResponse<ProfileReviewsResponse> = await this.apiClient.get(
        `/api/profiles/ratings/${userId}`
      );
      return response.data;
    } catch (error) {
      const apiError = this.handleError(error as AxiosError);
      throw apiError;
    }
  }
}

export default new ReviewService();
