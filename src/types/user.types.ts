// types/user.types.ts

export interface IUserProfile {
  location?: string;
  country?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    discord?: string;
  };
  preferences?: {
    kpopGroups?: string[];
    allowDirectMessages?: boolean;
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };
}

export interface IUser {
  _id: string;
  username: string;
  email?: string;
  profilePicture?: string;
  location?: string;
  bio?: string;
  phoneNumber?: string;
  preferences?: {
    kpopGroups?: string[];
    allowDirectMessages?: boolean;
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
  statistics?: {
    totalSales: number;
    totalPurchases: number;
    totalListings: number;
    memberSince: Date;
    lastActive: Date;
    averageRating: number;
    totalRatings: number;
  };
  isActive?: boolean;
  role?: 'user' | 'admin' | 'moderator';
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserParticipant {
  _id: string;
  username: string;
  profilePicture?: string;
  location?: string;
  bio?: string;
  preferences?: {
    kpopGroups?: string[];
    allowDirectMessages?: boolean;
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
}

// Type pour les réponses API
export interface UserResponse {
  profile: never[];
  success: boolean;
  message?: string;
  user: IUser;
}

export interface UsersListResponse {
  success: boolean;
  message?: string;
  users: IUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface ImgUserProfile {
  username: string;
  profilePicture?: string;
}
