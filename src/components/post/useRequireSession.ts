import { useRouter } from 'vue-router';
import { currentUserId } from '@/services/session.cookies';

/**
 * Garde des actions réservées aux membres (favori, achat, offre, panier, message…) :
 * un visiteur anonyme part vers la connexion, qui le ramènera sur la fiche de l'annonce.
 */
export function useRequireSession(productId: () => string | undefined) {
  const router = useRouter();
  const myId = currentUserId();

  return function requireSession(): boolean {
    if (myId) return true;
    router.push({ name: 'login', query: { redirect: `/products/${productId()}` } });
    return false;
  };
}
