import type { Router } from 'vue-router';
import { onSessionEnded } from '@/services/sessionEvents';
import { resetSessionStores } from '@/store/resetSessionStores';

/**
 * Réaction de l'application à une fin de session (déconnexion ou session
 * expirée) : les données du compte sont vidées — sinon le compte suivant sur le
 * même onglet verrait le profil, le panier ou les conversations du précédent —
 * puis l'utilisateur est renvoyé vers la connexion.
 *
 * Branché une fois par main.ts. Rend la fonction de désabonnement.
 */
export function bindSessionEnd(router: Pick<Router, 'push'>): () => void {
  return onSessionEnded(() => {
    resetSessionStores();
    void router.push('/login');
  });
}
