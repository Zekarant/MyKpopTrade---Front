import { ref } from 'vue';
import postService from '@/services/post.service';
import { func } from '@/function';
import type { Post } from '@/types/post.types';

/**
 * Retrait d'un favori devenu indisponible, directement depuis une grille.
 * Les listes reçoivent leurs annonces en prop : le favori retiré est masqué
 * localement plutôt que de faire recharger chaque page parente.
 */
export function useFavoriteRemoval() {
  const removedIds = ref<string[]>([]);

  const isRemoved = (post: Pick<Post, '_id'>) => removedIds.value.includes(post._id);

  async function removeFavorite(post: Pick<Post, '_id'>) {
    // L'API bascule le favori : un second clic le rajouterait.
    if (isRemoved(post)) return;
    if (await postService.addFavorite(post._id)) {
      removedIds.value.push(post._id);
      func.showToastSuccess('Retiré de vos favoris');
    } else {
      func.showToastError('Impossible de retirer ce favori');
    }
  }

  return { isRemoved, removeFavorite };
}
