import { apiClient } from '@/services/apiClient';

/**
 * Motif d'un refus (validation, limite atteinte), sinon le repli fourni.
 * Simple alias d'`apiErrorMessage`, conservé pour les écrans de contact qui l'importent.
 */
export { apiErrorMessage as contactErrorMessage } from '@/services/apiError';

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Page d'origine, pour le tri côté support. */
  source: string;
}

const client = apiClient('/api');

/**
 * Envoie un message au support via l'API. Le webhook Discord reste côté
 * serveur ; il ne doit jamais figurer dans le bundle du front.
 */
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  await client.post('/contact', payload);
}
