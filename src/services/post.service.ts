import type { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from "js-cookie";
import authentificationService  from '@/services/authentification.service';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

import type {
  Post,
  PostData,
  PostResponse,
  PostsResponse,
  ApiResponse,
  SearchParams
} from '@/types/post.types';
const getIdUser = (): string | undefined => Cookies.get('id_user');
class PostService {
  private apiClient: AxiosInstance;
  private uploadClient: AxiosInstance;
  private API_BASE_URL: string = `${API_URL}/api`;

  constructor() {

    this.apiClient = createApiClient({
      baseURL: `${this.API_BASE_URL}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Sans Content-Type par défaut : axios doit pouvoir poser lui-même
    // `multipart/form-data` et sa frontière pour les envois de fichiers.
    this.uploadClient = createApiClient({
      baseURL: `${this.API_BASE_URL}`,
    });
  }
  // Récupérer tous les posts
  async getPosts(
    limit: number = 20,
    page: number = 1,
    kpopGroup: string | null = null,
    type: string = 'photocard',
    _retried: boolean = false
  ): Promise<PostsResponse> {
    try {
      const response: AxiosResponse<PostsResponse> = await this.apiClient.get('/products', { params: {
          limit,
          page,
          kpopGroup,
          type
        }, });
      return response.data;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.getPosts(limit, page, kpopGroup, type, true);
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Récupérer un post par ID
  async getPost(id: string | number | undefined, _retried: boolean = false): Promise<PostResponse> {
    if (!id) {
      throw new Error('ID du post requis');
    }

    const postId = id.toString();

    try {
      const response: AxiosResponse<PostResponse> = await this.apiClient.get(`/products/${postId}`);
      return response.data;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.getPost(id, true);
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Supprimer un post
  async deletePost(id: string | number | undefined, _retried: boolean = false): Promise<any> {
    if (!id) {
      throw new Error('ID du post requis');
    }

    const postId = id.toString();

    try {
      const response: AxiosResponse = await this.apiClient.delete(`/products/${postId}`);
      return response.data;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.deletePost(id, true);
      }
      console.error('Erreur lors de la suppression :', error);
      throw error;
    }
  }

  // Créer un post
  async createPost(postData: PostData): Promise<string | any> {
    const data = new FormData();
    data.append('title', postData.title);
    data.append('description', postData.description);
    data.append('price', postData.price !== null && postData.price !== undefined ? postData.price.toString() : '');
    data.append('currency', postData.currency);
    data.append('condition', postData.condition);
    data.append('category', postData.category);
    data.append('type', postData.type);
    data.append('kpopGroup', postData.kpopGroup);
    data.append('kpopMember', postData.kpopMember);
    data.append('albumName', postData.albumName);
    data.append('allowOffers', postData.allowOffers.toString());

    postData.images.forEach((file: File) => {
      data.append('productImages', file);
    });

    data.append('shippingOptions', JSON.stringify(postData.shippingOptions));

    try {
      const response: AxiosResponse = await this.uploadClient.post('/products', data);

      if (response.status === 201 || response.status === 200) {
        return 'ok';
      } else {
        return response;
      }
    } catch (error: any) {
      const res = error.response;

      if (res && (res.data?.message === "Token invalide" ||
                  res.data?.code === "TOKEN_EXPIRED" ||
                  res.status === 401)) {
        await authentificationService.verifSession();
      }

      return res.data;
    }
  }

  // Mettre à jour un post
  async updatePost(id: string | number | undefined, postData: PostData): Promise<string | any> {
    if (!id) {
      throw new Error('ID du post requis');
    }

    const postId = id.toString();

    const data = {
      title: postData.title,
      description: postData.description,
      price: postData.price,
      currency: postData.currency,
      condition: postData.condition,
      category: postData.category,
      type: postData.type,
      kpopGroup: postData.kpopGroup,
      kpopMember: postData.kpopMember,
      albumName: postData.albumName,
      shippingOptions: postData.shippingOptions,
      productImages: [] as File[]
    };

    if (postData.productImages && postData.productImages.length > 0) {
      postData.productImages.forEach((file: File) => {
        data.productImages.push(file);
      });
    } else {
      postData.images.forEach((file: File) => {
        data.productImages.push(file);
      });
    }

    try {
      const response: AxiosResponse = await this.uploadClient.put(`/products/${postId}`, data);

      if (response.status === 201 || response.status === 200) {
        return 'ok';
      } else {
        return response;
      }
    } catch (error: any) {
      const res = error.response;

      if (res && (res.data?.message === "Token invalide" ||
                  res.data?.code === "TOKEN_EXPIRED" ||
                  res.status === 401)) {
        await authentificationService.verifSession();
      }

      return res.data;
    }
  }

  // Marquer comme vendu
  async sold(idUser: string | undefined, id: string | number | undefined): Promise<boolean> {
    if (!id || !idUser) {
      throw new Error('ID du post et ID utilisateur requis');
    }

    const postId = id.toString();

    try {
      const response: AxiosResponse = await this.apiClient.post(`/products/${postId}/sold/`, {
        buyerId: idUser
      });

      return response.status === 200;
    } catch (error: any) {
      if (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401) {
        await authentificationService.verifSession();
      }
      console.error('Erreur lors de la modification du post :', error);
      return false;
    }
  }

  // Rechercher des posts
  async search(
    query: string,
    maxPrice: number | null = null,
    minPrice: number | null = null,
    type: string | null = null,
    _retried: boolean = false
  ): Promise<PostsResponse> {
    const tabParam: SearchParams = {
      search: query,
      limit: 12
    };

    if (minPrice !== null && minPrice.toString() !== 'null') {
      tabParam.minPrice = minPrice;
    }
    if (maxPrice !== null && maxPrice.toString() !== 'null') {
      tabParam.maxPrice = maxPrice;
    }
    if (type && type !== 'null') {
      tabParam.type = type;
    }

    try {
      const response: AxiosResponse<PostsResponse> = await this.apiClient.get(`/products`, {
        params: tabParam,
      });
      return response.data;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.search(query, maxPrice, minPrice, type, true);
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Ajouter aux favoris
  async addFavorite(id: string | number | undefined, _retried: boolean = false): Promise<boolean> {
    if (!id) {
      throw new Error('ID du post requis');
    }

    const postId = id.toString();

    try {
      const response: AxiosResponse = await this.apiClient.post(`/products/${postId}/favorite`, {
        buyerId: getIdUser()
      });

      return response.status === 200;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.addFavorite(id, true);
      }
      console.error('Erreur lors de l\'ajout aux favoris :', error);
      return false;
    }
  }

  // Récupérer les favoris
  async getFavorites(limit: number = 20, page: number = 1, _retried: boolean = false): Promise<PostsResponse> {
    try {
      const response: AxiosResponse<PostsResponse> = await this.apiClient.get('/products/inventory/favorites/', { params: {
          limit,
          page
        } });
      return response.data;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.getFavorites(limit, page, true);
      }
      console.error('Erreur lors de la récupération des favoris :', error);
      throw error;
    }
  }

  // Obtenir les recommandations
  async getRecommendations(_retried: boolean = false): Promise<Post[]> {
    const tabRecommendations: Post[] = [];

    try {
      const response: AxiosResponse<{ products: Post[] }> = await this.apiClient.get(`/products/recommendations/`);
      if (Array.isArray(response.data?.products)) {
        response.data.products.forEach((productFav: Post) => {
          tabRecommendations.push(productFav);
        });
      }
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.getRecommendations(true);
      }
      console.error('Erreur lors de la récupération des recommandations :', error);
    }

    return tabRecommendations;
  }

  async addProductImage(productId: string, image: File): Promise<any> {
    const formData = new FormData();
    formData.append('productImage', image);
    try {
      const response = await this.uploadClient.post(
        `/products/${productId}/images`,
        formData
      );
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout d\'image :', error);
      throw error;
    }
  }

  async deleteProductImage(productId: string, imageUrl: string): Promise<any> {
    try {
      const response = await this.apiClient.delete(`/products/${productId}/images`, {
        data: { imageUrl },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la suppression d\'image :', error);
      throw error;
    }
  }

  async reorderProductImages(productId: string, images: string[]): Promise<any> {
    try {
      const response = await this.apiClient.put(`/products/${productId}/images/reorder`, { images });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la réorganisation des images :', error);
      throw error;
    }
  }

  async getQuickRecommendations(limit = 4): Promise<Post[]> {
    try {
      const response = await this.apiClient.get('/products/quick-recommendations', { params: { limit } });
      return response.data?.products || [];
    } catch (error: any) {
      console.error('Erreur quick-recommendations :', error);
      return [];
    }
  }

  async getProductStats(): Promise<any> {
    try {
      const response = await this.apiClient.get('/products/stats');
      return response.data;
    } catch (error: any) {
      console.error('Erreur stats produits :', error);
      throw error;
    }
  }

  // Récupérer l'inventaire de l'utilisateur
  async getInventory(status: string = 'available', limit: number = 20, page: number = 1, _retried: boolean = false): Promise<PostsResponse> {
    try {
      const response: AxiosResponse<PostsResponse> = await this.apiClient.get('/products/inventory/me', { params: {
          status,
          limit,
          page
        } });
      return response.data;
    } catch (error: any) {
      if (!_retried && (error.response?.data?.message === "Token invalide" ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.status === 401)) {
        await authentificationService.verifSession();
        return this.getInventory(status, limit, page, true);
      }
      console.error('Erreur lors de la récupération de l\'inventaire :', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PostService();
