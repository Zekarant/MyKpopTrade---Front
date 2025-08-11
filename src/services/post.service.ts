import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'; 
import Cookies from "js-cookie";
import authentificationService  from '@/services/authentification.service';

import type {
  Post,
  PostData,
  PostResponse,
  PostsResponse,
  ApiResponse,
  SearchParams
} from '@/types/post.types'; 
import router from '@/router';
// Helper authentificationServicetions
const getSessionToken = (): string | undefined => Cookies.get('sessionToken');
const getIdUser = (): string | undefined => Cookies.get('id_user');

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

type AuthToken = string | null;
class PostService {
  private apiClient: AxiosInstance;
  private API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  constructor() {
    
    this.apiClient = axios.create({
      baseURL: `${this.API_BASE_URL}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Configuration des intercepteurs pour les deux clients
    this.setupInterceptors(this.apiClient);
  }

  private setupInterceptors(client: AxiosInstance): void {
    // Intercepteur pour ajouter le token JWT ou le cookie PHPSESSID
    client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs
    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
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
  // Récupérer tous les posts
  async getPosts(
    limit: number = 20,
    page: number = 1,
    kpopGroup: string | null = null,
    type: string = 'photocard'
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
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.getPosts(limit, page, kpopGroup, type);
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Récupérer un post par ID
  async getPost(id: string | number | undefined): Promise<PostResponse> {
    if (!id) {
      throw new Error('ID du post requis');
    }
    
    const postId = id.toString();
    
    try {
      const response: AxiosResponse<PostResponse> = await this.apiClient.get(`/products/${postId}`, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.getPost(id);
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Supprimer un post
  async deletePost(id: string | number | undefined): Promise<any> {
    if (!id) {
      throw new Error('ID du post requis');
    }
    
    const postId = id.toString();
    
    try {
      const response: AxiosResponse = await axios.delete(`${this.API_BASE_URL}/products/${postId}`, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.deletePost(id);
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
    
    postData.images.forEach((file: File) => {
      data.append('productImages', file);
    });
    
    data.append('shippingOptions', JSON.stringify(postData.shippingOptions));

    try {
      const response: AxiosResponse = await axios.post(`${this.API_BASE_URL}/products`, data, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
        },
      });

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
      const response: AxiosResponse = await axios.put(`${this.API_BASE_URL}/products/${postId}`, data, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
        },
      });

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
    console.log('idUser', idUser);
    console.log('id', id);
    if (!id || !idUser) {
      throw new Error('ID du post et ID utilisateur requis');
    }
    
    const postId = id.toString();
    
    try {
      const response: AxiosResponse = await axios.post(`${this.API_BASE_URL}/products/${postId}/sold/`, {
        buyerId: idUser
      }, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
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
    type: string | null = null
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
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.search(query, maxPrice, minPrice, type);
      }
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Ajouter aux favoris
  async addFavorite(id: string | number | undefined): Promise<boolean> {
    if (!id) {
      throw new Error('ID du post requis');
    }
    
    const postId = id.toString();
    
    try {
      const response: AxiosResponse = await axios.post(`${this.API_BASE_URL}/products/${postId}/favorite`, {
        buyerId: getIdUser()
      }, {
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          "Content-Type": "application/json"
        }
      });

      return response.status === 200;
    } catch (error: any) {
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.addFavorite(id);
      }
      console.error('Erreur lors de l\'ajout aux favoris :', error);
      return false;
    }
  }

  // Récupérer les favoris
  async getFavorites(limit: number = 20, page: number = 1): Promise<PostsResponse> {
    try {
      const response: AxiosResponse<PostsResponse> = await this.apiClient.get('/products/inventory/favorites/', { params: {
          limit,
          page
        } });

      console.log('response', response);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.getFavorites(limit, page);
      }
      console.error('Erreur lors de la récupération des favoris :', error);
      throw error;
    }
  }

  // Obtenir les recommandations
  async getRecommendations(): Promise<Post[]> {
    const tabRecommendations: Post[] = [];

    try {
      const response: AxiosResponse<{ products: Post[] }> = await this.apiClient.get(`/products/recommendations/`);
      if (Array.isArray(response.data?.products)) {
        response.data.products.forEach((productFav: Post) => {
          tabRecommendations.push(productFav);
        });
        
      }
   
    } catch (error: any) {
      if (error.response?.data?.message === "Token invalide" || 
          error.response?.data?.code === "TOKEN_EXPIRED" || 
          error.response?.status === 401) {
        await authentificationService.verifSession();
        return this.getRecommendations();
      }
      console.error('Erreur lors de la récupération des recommandations :', error);
    }

    return tabRecommendations;
  }
}

// Export singleton instance
export default new PostService();