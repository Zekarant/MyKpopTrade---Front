import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import followService from '@/services/follow.service';

/**
 * Abonnement à un membre : compteurs d'abonnés / d'abonnements et suivi.
 * Rechargé seulement quand l'identifiant change — pas à chaque modification
 * d'un autre champ du profil.
 */
export function useFollow(userId: MaybeRefOrGetter<string>, isOwnProfile: MaybeRefOrGetter<boolean>) {
  const isFollowing = ref(false);
  const followersCount = ref(0);
  const followingCount = ref(0);

  async function load(id: string) {
    if (!id) return;
    try {
      // On ne se suit pas soi-même : pas de statut à demander sur son propre profil.
      const [status, followers, following] = await Promise.all([
        toValue(isOwnProfile) ? null : followService.getStatus(id),
        followService.getFollowers(id, 1, 1),
        followService.getFollowing(id, 1, 1),
      ]);
      // Profil changé pendant le chargement : ces chiffres ne sont plus les siens.
      if (id !== toValue(userId)) return;
      if (status) isFollowing.value = status.isFollowing;
      followersCount.value = followers.pagination?.total ?? 0;
      followingCount.value = following.pagination?.total ?? 0;
    } catch (e) {
      console.error('Erreur chargement follow:', e);
    }
  }

  async function toggleFollow() {
    const id = toValue(userId);
    if (!id) return;
    try {
      const res = await followService.toggleFollow(id);
      isFollowing.value = res.isFollowing;
      followersCount.value += res.isFollowing ? 1 : -1;
    } catch (e) {
      console.error('Erreur toggle follow:', e);
    }
  }

  watch(() => toValue(userId), load, { immediate: true });

  return { isFollowing, followersCount, followingCount, toggleFollow };
}
