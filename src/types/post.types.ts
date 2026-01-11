// post.types.ts

import type { IUser } from "./user.types";

export interface ShippingOption {
  method: string;
  price: number;
  currency: string;
}

export interface PostData {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  condition: string;
  category: string;
  type: string;
  kpopGroup: string;
  kpopMember: string;
  albumName: string;
  images: File[];
  productImages?: File[];
  allowOffers: boolean;
  shippingOptions: {
    worldwide: boolean;
    nationalOnly: boolean;
    localPickup: boolean;
    shippingCost: number | null;
  };
}

export interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  category: string;
  type: string;
  kpopGroup: string;
  kpopMember: string;
  albumName: string;
  images: string[];
  shippingOptions: ShippingOption[];
  seller: string | IUser[];
  createdAt: string;
  updatedAt: string;
  isAvailable?: boolean;
  state?: string;
  isReserved?: boolean;
}

export interface PostResponse {
  product: Post;
  isFavorite: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: string;
}

export interface PostsResponse {
  pagination: { limit: number; page: number; pages: number; } & { limit: number; page: number; pages: number; };
  products: Post[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface SearchParams {
  search: string;
  limit: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
}
