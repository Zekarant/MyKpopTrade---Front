// review.types.ts

export interface ReviewData {
  transactionId: string;
  recipientId: string;
  rating: number;
  review: string;
  type: 'seller' | 'buyer';
  ratingImages?: File[];
}

export interface Review extends ReviewData {
  id: string;
  reviewer: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalRatings: number;
}

export interface ProfileReviewsResponse {
  stats: ReviewStats;
  ratings: Review[];
}
