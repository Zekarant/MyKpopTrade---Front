import { isAxiosError } from 'axios';
import { API_URL } from '@/config/api';
import { createApiClient } from '@/services/http';

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Page d'origine, pour le tri côté support. */
  source: string;
}

const apiClient = createApiClient({ baseURL: `${API_URL}/api` });

/**
 * Envoie un message au support via l'API. Le webhook Discord reste côté
 * serveur ; il ne doit jamais figurer dans le bundle du front.
 */
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  await apiClient.post('/contact', payload);
}

/** Message d'erreur renvoyé par l'API (validation, limite atteinte), sinon le repli fourni. */
export function contactErrorMessage(error: unknown, fallback: string): string {
  return isAxiosError<{ message?: string }>(error) && error.response?.data?.message
    ? error.response.data.message
    : fallback;
}
