import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type { ReviewData, Review, ApiResponse, ProfileReviewsResponse } from '@/types/review.types';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ReviewService {
  private apiClient: AxiosInstance;
  private API_BASE_URL: string = `${API_URL}`;

  constructor() {
    this.apiClient = createApiClient({
      baseURL: this.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Posé après les intercepteurs d'authentification, pour que le 401 soit
    // d'abord traité (renouvellement + rejeu) et que seule une vraie erreur
    // arrive jusqu'à cette traduction en ApiError.
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleError(error))
    );
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

  async reportReview(ratingId: string, payload: { reason: string; description?: string }) {
    try {
      const response = await this.apiClient.post(`/api/profiles/ratings/${ratingId}/report`, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async addReviewImages(ratingId: string, images: File[]) {
    try {
      const formData = new FormData();
      images.forEach((file) => formData.append('ratingImages', file));
      const response = await this.apiClient.post(
        `/api/profiles/ratings/${ratingId}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async deleteReviewImage(ratingId: string, imageUrl: string) {
    try {
      const response = await this.apiClient.delete(`/api/profiles/ratings/${ratingId}/images`, {
        data: { imageUrl },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async createReviewResponse(ratingId: string, response: string) {
    try {
      const res = await this.apiClient.post(`/api/profiles/ratings/${ratingId}/response`, { response });
      return res.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async updateReviewResponse(ratingId: string, response: string) {
    try {
      const res = await this.apiClient.put(`/api/profiles/ratings/${ratingId}/response`, { response });
      return res.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async deleteReviewResponse(ratingId: string) {
    try {
      const res = await this.apiClient.delete(`/api/profiles/ratings/${ratingId}/response`);
      return res.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}

export default new ReviewService();
