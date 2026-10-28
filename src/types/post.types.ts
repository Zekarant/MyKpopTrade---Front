// post.types.ts

import type { Pagination } from "./pagination.types";

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
  /** Métadonnées structurées ; les champs libres ci-dessus restent remplis pour les anciens écrans. */
  group?: string | null;
  member?: string | null;
  album?: string | null;
  version?: string | null;
  era?: string | null;
  pob?: string | null;
  isOfficial?: boolean;
  /**
   * Ordre final des photos : fichiers ajoutés, et chemins des images existantes
   * quand on modifie une annonce.
   */
  images: (File | string)[];
  allowOffers: boolean;
  shippingOptions: {
    worldwide: boolean;
    nationalOnly: boolean;
    localPickup: boolean;
    nationalCost?: number | null;
    worldwideCost?: number | null;
    /** @deprecated remplacé par nationalCost/worldwideCost — gardé pour compat */
    shippingCost?: number | null;
  };
}

export interface Post {
  _id: string;
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
  /** Peuplé par les listes ; identifiant brut sinon ; null si le compte a été supprimé. */
  seller: ProductSeller | string | null;
  createdAt: string;
  updatedAt: string;
  isAvailable?: boolean;
  isSold?: boolean;
  /** Favoris uniquement : annonce vendue ou retirée, qui ne s'ouvre plus. */
  unavailableReason?: 'sold' | 'withdrawn' | null;
  state?: string;
  allowOffers?: boolean;
  isPayWhatYouWant?: boolean;
  pwywMinPrice?: number | null;
  pwywMaxPrice?: number | null;
}

/** Modes et frais de livraison d'une annonce, tels que stockés par l'API. */
export interface ProductShippingOptions {
  worldwide: boolean;
  nationalOnly: boolean;
  localPickup: boolean;
  nationalCost?: number | null;
  worldwideCost?: number | null;
  shippingCost?: number | null;
}

/** Vendeur peuplé sur le détail d'une annonce. */
export interface ProductSeller {
  _id: string;
  username: string;
  profilePicture?: string;
  isIdentityVerified?: boolean;
  statistics?: { averageRating?: number; totalRatings?: number };
}

/** Annonce renvoyée par GET /api/products/:id : noms K-pop résolus et frais de port calculés. */
export interface ProductDetail {
  _id: string;
  seller: ProductSeller;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  category: string;
  type: string;
  kpopGroup: string;
  kpopGroupName?: string;
  kpopGroupId?: string;
  kpopMember?: string;
  albumName?: string;
  albumNameStr?: string;
  albumId?: string;
  group?: string | null;
  member?: string | null;
  album?: string | null;
  version?: string | null;
  era?: string | null;
  pob?: string | null;
  isOfficial?: boolean;
  images: string[];
  isAvailable: boolean;
  isSold?: boolean;
  allowOffers: boolean;
  minOfferPercentage?: number;
  /** Prix libre : les offres sont bornées par [pwywMinPrice, pwywMaxPrice]. */
  isPayWhatYouWant?: boolean;
  pwywMinPrice?: number | null;
  pwywMaxPrice?: number | null;
  shippingOptions: ProductShippingOptions;
  shippingPrice?: number | null;
  views?: number;
  favorites?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostResponse {
  product: ProductDetail;
  isFavorite: boolean;
}

/** Corps d'erreur renvoyé à la création ou à la modification d'une annonce. */
export interface PostSaveErrorBody {
  message?: string;
  error?: { message?: string };
}

/** Réponse des routes d'images d'une annonce. */
export interface ProductImagesResponse {
  message: string;
  image?: string;
  images: string[];
}

/** Statistiques globales du catalogue (GET /api/products/stats). */
export interface ProductStatsResponse {
  generalStats: {
    totalProducts?: number;
    averagePrice?: number;
    totalViews?: number;
    totalFavorites?: number;
  };
  typeDistribution: { _id: string | null; count: number; percentAvailable: number }[];
  groupDistribution: { _id: string | null; count: number }[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: string;
}

export interface PostsResponse {
  pagination: Pagination;
  products: Post[];
}

export interface SearchParams {
  search: string;
  limit: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
}
