import { ref, watch, type MaybeRefOrGetter, toValue } from 'vue';
import { createApiClient } from '@/services/http';
import { API_URL } from '@/config/api';
import { func } from '@/function';

/** Client partagé : renouvelle la session expirée et rejoue la requête. */
const api = createApiClient({ baseURL: API_URL });

export type ProfileMediaKind = 'banner' | 'picture';

/** Champ d'upload et clé de réponse de l'API, par média. */
const FIELDS: Record<ProfileMediaKind, 'profileBanner' | 'profilePicture'> = {
  banner: 'profileBanner',
  picture: 'profilePicture',
};

const ERRORS: Record<ProfileMediaKind, { upload: string; remove: string }> = {
  banner: { upload: 'Impossible d\'envoyer la bannière.', remove: 'Impossible de supprimer la bannière.' },
  picture: { upload: 'Impossible d\'envoyer la photo.', remove: 'Impossible de supprimer la photo.' },
};

type ApiError = { response?: { status?: number; data?: { message?: string } } };

/** Toast d'erreur, sauf session perdue : le client a déjà redirigé vers /login. */
function showError(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  if (apiError?.response?.status === 401) return;
  func.showToastError(apiError?.response?.data?.message || fallback);
}

/**
 * Bannière et photo de mon profil : chemins affichés, envoi et suppression.
 * Les chemins suivent le profil reçu, puis la réponse de l'API après chaque action.
 */
export function useProfileMedia(initial: MaybeRefOrGetter<{ banner?: string | null; picture?: string | null }>) {
  const media = ref<Record<ProfileMediaKind, string | null>>({ banner: null, picture: null });

  watch(() => toValue(initial), (paths) => {
    media.value = { banner: paths.banner ?? null, picture: paths.picture ?? null };
  }, { immediate: true });

  // Pas d'en-tête Content-Type manuel : axios pose celui d'un FormData, avec son boundary.
  async function upload(kind: ProfileMediaKind, file: File) {
    const field = FIELDS[kind];
    const body = new FormData();
    body.append(field, file);
    try {
      const response = await api.post(`/api/profiles/me/${kind}`, body);
      media.value[kind] = response.data[field];
    } catch (error) {
      showError(error, ERRORS[kind].upload);
    }
  }

  /** @returns `true` si le média a bien été supprimé. */
  async function remove(kind: ProfileMediaKind): Promise<boolean> {
    try {
      await api.delete(`/api/profiles/me/${kind}`);
      media.value[kind] = null;
      return true;
    } catch (error) {
      showError(error, ERRORS[kind].remove);
      return false;
    }
  }

  return { media, upload, remove };
}
