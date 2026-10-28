import type { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

/**
 * Client HTTP des services : `path` est relatif à l'API (`/api/cart`).
 *
 * Point d'entrée unique pour que tous les services partagent la même
 * configuration — renouvellement de session (http.ts) et erreurs rejetées en
 * `ApiError` (apiError.ts). Aucun en-tête `Content-Type` n'est posé : axios
 * envoie déjà du JSON pour un objet, et doit pouvoir poser lui-même
 * `multipart/form-data` et sa frontière pour un `FormData`.
 *
 * Module distinct de http.ts : les tests de vues qui simulent
 * `createApiClient` continuent de fonctionner sans connaître cette fabrique.
 */
export function apiClient(path = '', config: CreateAxiosDefaults = {}): AxiosInstance {
  return createApiClient({ ...config, baseURL: `${API_URL}${path}` }, { normalizeErrors: true });
}
