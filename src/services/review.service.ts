import type { ReviewData, Review, ApiResponse, ProfileReviewsResponse } from '@/types/review.types';
import { apiClient } from '@/services/apiClient';

/**
 * Avis entre membres et réponses du vendeur. Les erreurs remontent en
 * `ApiError` (status, code, message), comme pour tous les services.
 */
class ReviewService {
  private client = apiClient('/api/profiles/ratings');

  async submitReview(reviewData: ReviewData): Promise<Review> {
    // Multipart seulement avec des photos ; sinon un simple corps JSON.
    if (reviewData.ratingImages && reviewData.ratingImages.length > 0) {
      const formData = new FormData();
      formData.append('transactionId', reviewData.transactionId);
      formData.append('recipientId', reviewData.recipientId);
      formData.append('rating', reviewData.rating.toString());
      formData.append('review', reviewData.review);
      formData.append('type', reviewData.type);
      reviewData.ratingImages.forEach((file) => formData.append('ratingImages', file));

      const { data } = await this.client.post<ApiResponse<Review>>('', formData);
      return data.data;
    }

    const { data } = await this.client.post<ApiResponse<Review>>('', reviewData);
    return data.data;
  }

  async getProfileReviews(userId: string): Promise<ProfileReviewsResponse> {
    const { data } = await this.client.get<ProfileReviewsResponse>(`/${userId}`);
    return data;
  }

  async createReviewResponse(ratingId: string, response: string) {
    const { data } = await this.client.post(`/${ratingId}/response`, { response });
    return data;
  }

  async updateReviewResponse(ratingId: string, response: string) {
    const { data } = await this.client.put(`/${ratingId}/response`, { response });
    return data;
  }

  async deleteReviewResponse(ratingId: string) {
    const { data } = await this.client.delete(`/${ratingId}/response`);
    return data;
  }
}

export default new ReviewService();
