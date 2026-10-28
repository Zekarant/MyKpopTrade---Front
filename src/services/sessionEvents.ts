/**
 * Fin de session, signalée par la couche services sans qu'elle connaisse le routeur.
 *
 * `http.ts` et le service d'authentification importaient le routeur pour
 * renvoyer vers /login ; or le routeur charge des vues qui importent ces
 * services : un cycle d'imports, contourné jusque-là par des imports différés.
 * Les services se contentent désormais d'annoncer la fin de session ; c'est
 * l'application (main.ts, via `store/sessionLifecycle.ts`) qui décide quoi en
 * faire — vider les stores, rediriger.
 */

/** `expired` : renouvellement impossible ; `logout` : déconnexion demandée. */
export type SessionEndReason = 'expired' | 'logout';

type SessionEndListener = (reason: SessionEndReason) => void;

const listeners = new Set<SessionEndListener>();

/** S'abonne à la fin de session. Rend la fonction de désabonnement. */
export function onSessionEnded(listener: SessionEndListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Annonce la fin de session à tous les abonnés. */
export function notifySessionEnded(reason: SessionEndReason): void {
  listeners.forEach((listener) => listener(reason));
}
