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
  PostSaveErrorBody,
  ProductImagesResponse,
  ProductStatsResponse,
  SearchParams
} from '@/types/post.types';

/** Succès avec l'identifiant de l'annonce, sinon le corps d'erreur de l'API (absent si le réseau a coupé). */
export type PostSaveResult =
  | { ok: true; productId: string }
  | { ok: false; error?: PostSaveErrorBody };

const getIdUser = (): string | undefined => Cookies.get('id_user');

function saveFailure(error: unknown): PostSaveResult {
  return { ok: false, error: (error as { response?: { data?: PostSaveErrorBody } }).response?.data };
}

/**
 * Frais de port sans les champs vides : l'API valide des nombres, et un coût
 * laissé vide (null) ferait refuser la création de l'annonce.
 */
export function cleanShippingOptions(options: PostData['shippingOptions']): PostData['shippingOptions'] {
  const cleaned: PostData['shippingOptions'] = {
    worldwide: options.worldwide,
    nationalOnly: options.nationalOnly,
    localPickup: options.localPickup,
  };
  for (const key of ['nationalCost', 'worldwideCost', 'shippingCost'] as const) {
    const value = options[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/** Réponse « session invalide » de l'API. */
function isUnauthorized(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: { code?: string; message?: string } } })?.response;
  return response?.status === 401 ||
    response?.data?.code === 'TOKEN_EXPIRED' ||
    response?.data?.message === 'Token invalide';
}

/**
 * Un 401 ici signifie session perdue : le client HTTP a déjà tenté le renouvellement.
 * L'échec attendu de verifSession est avalé pour ne pas masquer l'erreur d'origine.
 */
async function endSessionIfUnauthorized(error: unknown): Promise<void> {
  if (isUnauthorized(error)) {
    await authentificationService.verifSession().catch(() => undefined);
  }
}

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
    } catch (error) {
      await endSessionIfUnauthorized(error);
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
      const response: AxiosResponse<PostResponse> = await this.apiClient.get(`/products/${postId}`);
      return response.data;
    } catch (error) {
      await endSessionIfUnauthorized(error);
      console.error('Erreur lors de la recherche :', error);
      throw error;
    }
  }

  // Supprimer un post
  async deletePost(id: string | number | undefined): Promise<{ message: string }> {
    if (!id) {
      throw new Error('ID du post requis');
    }

    const postId = id.toString();

    try {
      const response: AxiosResponse<{ message: string }> = await this.apiClient.delete(`/products/${postId}`);
      return response.data;
    } catch (error) {
      await endSessionIfUnauthorized(error);
      console.error('Erreur lors de la suppression :', error);
      throw error;
    }
  }

  // Créer un post
  async createPost(postData: PostData): Promise<PostSaveResult> {
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

    // À la création, toutes les photos sont des fichiers.
    postData.images.forEach((file: File | string) => {
      if (file instanceof File) {
        data.append('productImages', file);
      }
    });

    data.append('shippingOptions', JSON.stringify(cleanShippingOptions(postData.shippingOptions)));

    try {
      const response: AxiosResponse<{ product?: { _id?: string } }> = await this.uploadClient.post('/products', data);
      const productId = response.data?.product?._id;
      return productId
        ? { ok: true, productId }
        : { ok: false, error: { message: 'Réponse inattendue du serveur' } };
    } catch (error) {
      await endSessionIfUnauthorized(error);
      return saveFailure(error);
    }
  }

  /**
   * Met à jour les champs d'une annonce (PUT JSON). Les photos passent par les
   * routes dédiées : voir `syncProductImages`.
   */
  async updatePost(id: string | number | undefined, postData: PostData): Promise<PostSaveResult> {
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
      allowOffers: postData.allowOffers,
      shippingOptions: cleanShippingOptions(postData.shippingOptions),
    };

    try {
      await this.apiClient.put(`/products/${postId}`, data);
      return { ok: true, productId: postId };
    } catch (error) {
      await endSessionIfUnauthorized(error);
      return saveFailure(error);
    }
  }

  /**
   * Aligne les photos d'une annonce sur `desired` (ordre final ; chemins existants
   * conservés, fichiers à ajouter) via les routes d'images, seules à pouvoir les modifier.
   * Part de l'état serveur : relancer après un échec partiel reste sûr.
   * `onUploaded` permet à l'appelant de remplacer un fichier envoyé par son chemin.
   *
   * @returns les chemins des images de l'annonce, dans leur ordre final.
   */
  async syncProductImages(
    productId: string,
    desired: (File | string)[],
    onUploaded?: (file: File, path: string) => void
  ): Promise<string[]> {
    const { product } = await this.getPost(productId);
    let current = [...product.images];

    const kept = new Set(desired.filter((item): item is string => typeof item === 'string'));
    const removed = current.filter((path) => !kept.has(path));

    // Suppressions d'abord (place libérée sous la limite de 10 photos), mais
    // l'API refuse de retirer la dernière image : celle-ci attend les ajouts.
    const deferred: string[] = [];
    for (const path of removed) {
      if (current.length <= 1) {
        deferred.push(path);
        continue;
      }
      current = (await this.deleteProductImage(productId, current.indexOf(path))).images;
    }

    const uploaded = new Map<File, string>();
    for (const file of desired.filter((item): item is File => item instanceof File)) {
      const response = await this.addProductImage(productId, file);
      current = response.images;
      if (response.image) {
        uploaded.set(file, response.image);
        onUploaded?.(file, response.image);
      }
    }

    for (const path of deferred) {
      const index = current.indexOf(path);
      if (index !== -1) {
        current = (await this.deleteProductImage(productId, index)).images;
      }
    }

    const target = desired
      .map((item) => (typeof item === 'string' ? item : uploaded.get(item)))
      .filter((path): path is string => typeof path === 'string' && current.includes(path));
    const needsReorder = target.length === current.length && target.some((path, index) => path !== current[index]);
    if (needsReorder) {
      current = (await this.reorderProductImages(productId, target.map((path) => current.indexOf(path)))).images;
    }

    return current;
  }

  // Marquer comme vendu. `idUser` part comme `buyerId` ; l'API ignore l'identifiant du vendeur lui-même.
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
    } catch (error) {
      await endSessionIfUnauthorized(error);
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
    } catch (error) {
      await endSessionIfUnauthorized(error);
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
      const response: AxiosResponse = await this.apiClient.post(`/products/${postId}/favorite`, {
        buyerId: getIdUser()
      });

      return response.status === 200;
    } catch (error) {
      await endSessionIfUnauthorized(error);
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
      return response.data;
    } catch (error) {
      await endSessionIfUnauthorized(error);
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
    } catch (error) {
      await endSessionIfUnauthorized(error);
      console.error('Erreur lors de la récupération des recommandations :', error);
    }

    return tabRecommendations;
  }

  async addProductImage(productId: string, image: File): Promise<ProductImagesResponse> {
    const formData = new FormData();
    formData.append('productImage', image);
    try {
      const response = await this.uploadClient.post<ProductImagesResponse>(
        `/products/${productId}/images`,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'image :', error);
      throw error;
    }
  }

  /** L'API désigne l'image par sa position dans `images`, jamais par son chemin. */
  async deleteProductImage(productId: string, imageIndex: number): Promise<ProductImagesResponse> {
    try {
      const response = await this.apiClient.delete<ProductImagesResponse>(`/products/${productId}/images`, {
        data: { imageIndex },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression d\'image :', error);
      throw error;
    }
  }

  /** `imageOrder[i]` : position actuelle de l'image qui doit passer en position i. */
  async reorderProductImages(productId: string, imageOrder: number[]): Promise<ProductImagesResponse> {
    try {
      const response = await this.apiClient.put<ProductImagesResponse>(`/products/${productId}/images/reorder`, { imageOrder });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réorganisation des images :', error);
      throw error;
    }
  }

  async getQuickRecommendations(limit = 4): Promise<Post[]> {
    try {
      const response = await this.apiClient.get<{ products?: Post[] }>('/products/quick-recommendations', { params: { limit } });
      return response.data?.products || [];
    } catch (error) {
      console.error('Erreur quick-recommendations :', error);
      return [];
    }
  }

  async getProductStats(): Promise<ProductStatsResponse> {
    try {
      const response: AxiosResponse<ProductStatsResponse> = await this.apiClient.get('/products/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur stats produits :', error);
      throw error;
    }
  }

  // Récupérer l'inventaire de l'utilisateur
  async getInventory(status: string = 'available', limit: number = 20, page: number = 1): Promise<PostsResponse> {
    try {
      const response: AxiosResponse<PostsResponse> = await this.apiClient.get('/products/inventory/me', { params: {
          status,
          limit,
          page
        } });
      return response.data;
    } catch (error) {
      await endSessionIfUnauthorized(error);
      console.error('Erreur lors de la récupération de l\'inventaire :', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PostService();
