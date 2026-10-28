import { ref, watch, type MaybeRefOrGetter, toValue } from 'vue';
import { func } from '@/function';
import userService, { type ProfileMediaKind } from '@/services/user.service';
import { apiErrorMessage, apiErrorStatus } from '@/services/apiError';

export type { ProfileMediaKind };

const ERRORS: Record<ProfileMediaKind, { upload: string; remove: string }> = {
  banner: { upload: 'Impossible d\'envoyer la bannière.', remove: 'Impossible de supprimer la bannière.' },
  picture: { upload: 'Impossible d\'envoyer la photo.', remove: 'Impossible de supprimer la photo.' },
};

/** Toast d'erreur, sauf session perdue : le client a déjà redirigé vers /login. */
function showError(error: unknown, fallback: string) {
  if (apiErrorStatus(error) === 401) return;
  func.showToastError(apiErrorMessage(error, fallback));
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

  async function upload(kind: ProfileMediaKind, file: File) {
    try {
      media.value[kind] = await userService.uploadProfileMedia(kind, file);
    } catch (error) {
      showError(error, ERRORS[kind].upload);
    }
  }

  /** @returns `true` si le média a bien été supprimé. */
  async function remove(kind: ProfileMediaKind): Promise<boolean> {
    try {
      await userService.deleteProfileMedia(kind);
      media.value[kind] = null;
      return true;
    } catch (error) {
      showError(error, ERRORS[kind].remove);
      return false;
    }
  }

  return { media, upload, remove };
}
