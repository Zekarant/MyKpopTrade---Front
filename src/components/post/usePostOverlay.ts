import { ref } from 'vue';
import type { Post } from '@/types/post.types';

/** Fiche ouverte en surimpression depuis une liste d'annonces (grille, carrousel). */
export function usePostOverlay() {
  const openedPost = ref<Post | null>(null);

  function openPost(post: Post) {
    openedPost.value = post;
  }

  function closePost() {
    openedPost.value = null;
  }

  return { openedPost, openPost, closePost };
}
