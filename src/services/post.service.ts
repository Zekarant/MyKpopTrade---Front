import { currentUserId } from '@/services/session.cookies';
import { apiClient } from '@/services/apiClient';
import { apiErrorBody } from '@/services/apiError';

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

function saveFailure(error: unknown): PostSaveResult {
  return { ok: false, error: apiErrorBody<PostSaveErrorBody>(error) };
}

function requirePostId(id: string | number | undefined): string {
  if (!id) {
    throw new Error('ID du post requis');
  }
  return id.toString();
}

/**
 * Frais de port envoyés à l'API : un coût par mode d'envoi proposé, 0 quand le
 * champ est laissé vide (port offert). Sans coût, l'API refuserait le paiement
 * par ce mode. L'ancien champ unique `shippingCost` n'est plus envoyé.
 */
export function cleanShippingOptions(options: PostData['shippingOptions']): PostData['shippingOptions'] {
  const costOrFree = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return {
    worldwide: options.worldwide,
    nationalOnly: options.nationalOnly,
    localPickup: options.localPickup,
    ...(options.nationalOnly ? { nationalCost: costOrFree(options.nationalCost) } : {}),
    ...(options.worldwide ? { worldwideCost: costOrFree(options.worldwideCost) } : {}),
  };
}

const CATALOG_TEXT_FIELDS = ['group', 'member', 'album', 'version', 'era', 'pob'] as const;

/**
 * Métadonnées structurées de l'annonce. Un champ vide part en `null` : en
 * modification, c'est ce qui l'efface côté API (un champ absent serait conservé).
 */
export function catalogFields(postData: PostData): Record<string, string | boolean | null> {
  const fields: Record<string, string | boolean | null> = {};
  for (const field of CATALOG_TEXT_FIELDS) {
    fields[field] = postData[field]?.trim() || null;
  }
  if (typeof postData.isOfficial === 'boolean') fields.isOfficial = postData.isOfficial;
  return fields;
}

/** Filtres catalogue de GET /api/products (pages groupe et album). */
export interface CatalogListParams {
  group?: string;
  album?: string;
  member?: string;
  page?: number;
  limit?: number;
}

/**
 * Annonces : catalogue, publication, favoris et photos.
 *
 * Les erreurs remontent en `ApiError` ; une session expirée est traitée par le
 * client HTTP (renouvellement puis retour à la connexion). Seules les méthodes
 * d'agrément (favori, recommandations) avalent l'échec pour rendre une valeur
 * neutre : leur absence ne doit pas casser la page qui les affiche.
 */
class PostService {
  private client = apiClient('/api');

  async getPosts(
    limit: number = 20,
    page: number = 1,
    kpopGroup: string | null = null,
    type: string = 'photocard'
  ): Promise<PostsResponse> {
    const { data } = await this.client.get<PostsResponse>('/products', { params: { limit, page, kpopGroup, type } });
    return data;
  }

  /** Annonces en vente d'un groupe ou d'un album (anciennes annonces comprises, côté API). */
  async getCatalogPosts(params: CatalogListParams): Promise<PostsResponse> {
    const { data } = await this.client.get<PostsResponse>('/products', { params });
    return data;
  }

  async getPost(id: string | number | undefined): Promise<PostResponse> {
    const postId = requirePostId(id);
    const { data } = await this.client.get<PostResponse>(`/products/${postId}`);
    return data;
  }

  async deletePost(id: string | number | undefined): Promise<{ message: string }> {
    const postId = requirePostId(id);
    const { data } = await this.client.delete<{ message: string }>(`/products/${postId}`);
    return data;
  }

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
    // Le multipart ne connaît que du texte : "" vaut « non renseigné » pour l'API.
    for (const [field, value] of Object.entries(catalogFields(postData))) {
      data.append(field, value === null ? '' : String(value));
    }
    data.append('allowOffers', postData.allowOffers.toString());

    // À la création, toutes les photos sont des fichiers.
    postData.images.forEach((file: File | string) => {
      if (file instanceof File) {
        data.append('productImages', file);
      }
    });

    data.append('shippingOptions', JSON.stringify(cleanShippingOptions(postData.shippingOptions)));

    try {
      const response = await this.client.post<{ product?: { _id?: string } }>('/products', data);
      const productId = response.data?.product?._id;
      return productId
        ? { ok: true, productId }
        : { ok: false, error: { message: 'Réponse inattendue du serveur' } };
    } catch (error) {
      return saveFailure(error);
    }
  }

  /**
   * Met à jour les champs d'une annonce (PUT JSON). Les photos passent par les
   * routes dédiées : voir `syncProductImages`.
   */
  async updatePost(id: string | number | undefined, postData: PostData): Promise<PostSaveResult> {
    const postId = requirePostId(id);

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
      ...catalogFields(postData),
      allowOffers: postData.allowOffers,
      shippingOptions: cleanShippingOptions(postData.shippingOptions),
    };

    try {
      await this.client.put(`/products/${postId}`, data);
      return { ok: true, productId: postId };
    } catch (error) {
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

  /** Marque comme vendu hors de la plateforme : sans `buyerId`, l'API n'attribue l'achat à personne. */
  async sold(id: string | number | undefined): Promise<boolean> {
    if (!id) {
      throw new Error('ID du post requis');
    }

    try {
      const response = await this.client.post(`/products/${id.toString()}/sold/`, {});
      return response.status === 200;
    } catch (error) {
      console.error('Erreur lors de la modification du post :', error);
      return false;
    }
  }

  /**
   * Remet une annonce en vente. Pour un article vendu à la main, l'API annule
   * la vente ; elle refuse (409) un article payé via la plateforme.
   */
  async relist(id: string): Promise<void> {
    await this.client.put(`/products/${id}`, { isAvailable: true });
  }

  async search(
    query: string,
    maxPrice: number | null = null,
    minPrice: number | null = null,
    type: string | null = null
  ): Promise<PostsResponse> {
    const params: SearchParams = { search: query, limit: 12 };

    // Les filtres arrivent parfois de l'URL : la chaîne « null » vaut « absent ».
    if (minPrice !== null && minPrice.toString() !== 'null') {
      params.minPrice = minPrice;
    }
    if (maxPrice !== null && maxPrice.toString() !== 'null') {
      params.maxPrice = maxPrice;
    }
    if (type && type !== 'null') {
      params.type = type;
    }

    const { data } = await this.client.get<PostsResponse>('/products', { params });
    return data;
  }

  async addFavorite(id: string | number | undefined): Promise<boolean> {
    const postId = requirePostId(id);

    try {
      const response = await this.client.post(`/products/${postId}/favorite`, {
        buyerId: currentUserId() ?? undefined
      });
      return response.status === 200;
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris :', error);
      return false;
    }
  }

  async getFavorites(limit: number = 20, page: number = 1): Promise<PostsResponse> {
    const { data } = await this.client.get<PostsResponse>('/products/inventory/favorites/', { params: { limit, page } });
    return data;
  }

  async getRecommendations(): Promise<Post[]> {
    try {
      const { data } = await this.client.get<{ products: Post[] }>('/products/recommendations/');
      return Array.isArray(data?.products) ? [...data.products] : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations :', error);
      return [];
    }
  }

  async addProductImage(productId: string, image: File): Promise<ProductImagesResponse> {
    const formData = new FormData();
    formData.append('productImage', image);
    const { data } = await this.client.post<ProductImagesResponse>(`/products/${productId}/images`, formData);
    return data;
  }

  /** L'API désigne l'image par sa position dans `images`, jamais par son chemin. */
  async deleteProductImage(productId: string, imageIndex: number): Promise<ProductImagesResponse> {
    const { data } = await this.client.delete<ProductImagesResponse>(`/products/${productId}/images`, {
      data: { imageIndex },
    });
    return data;
  }

  /** `imageOrder[i]` : position actuelle de l'image qui doit passer en position i. */
  async reorderProductImages(productId: string, imageOrder: number[]): Promise<ProductImagesResponse> {
    const { data } = await this.client.put<ProductImagesResponse>(`/products/${productId}/images/reorder`, { imageOrder });
    return data;
  }

  async getQuickRecommendations(limit = 4): Promise<Post[]> {
    try {
      const { data } = await this.client.get<{ products?: Post[] }>('/products/quick-recommendations', { params: { limit } });
      return data?.products || [];
    } catch (error) {
      console.error('Erreur quick-recommendations :', error);
      return [];
    }
  }

  async getProductStats(): Promise<ProductStatsResponse> {
    const { data } = await this.client.get<ProductStatsResponse>('/products/stats');
    return data;
  }

  async getInventory(status: string = 'available', limit: number = 20, page: number = 1): Promise<PostsResponse> {
    const { data } = await this.client.get<PostsResponse>('/products/inventory/me', { params: { status, limit, page } });
    return data;
  }

  /** Annonces publiques d'un autre membre, mêmes filtres que `getInventory`. */
  async getUserInventory(userId: string, status: string = 'available', limit: number = 20, page: number = 1): Promise<PostsResponse> {
    const { data } = await this.client.get<PostsResponse>(
      `/products/inventory/user/${encodeURIComponent(userId)}`,
      { params: { status, limit, page } }
    );
    return data;
  }
}

export default new PostService();
