import { defineStore } from 'pinia';
import userService from '@/services/user.service';
import { currentUserId } from '@/services/session.cookies';
import type { IUser } from '@/types/user.types';

/** `id` : certaines réponses de l'API exposent l'identifiant sous ce nom plutôt que `_id`. */
export type CurrentUser = IUser & { id?: string };

interface UserState {
  profile: CurrentUser | null;
  /** Session (id du cookie) pour laquelle `profile` a été chargé. */
  loadedFor: string | null;
}

// Hors du state : une promesse n'a rien à faire dans l'état réactif. Elle
// mutualise les appels simultanés (garde admin + barre de navigation au
// premier chargement) en une seule requête.
let pending: Promise<CurrentUser | null> | null = null;

/**
 * Profil de l'utilisateur connecté, chargé une fois par session au lieu d'un
 * GET /profiles/me à chaque montage de la barre de navigation, de la
 * messagerie ou à chaque passage par la garde d'administration.
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    profile: null,
    loadedFor: null
  }),

  getters: {
    // Sert à l'affichage et à la garde du routeur ; l'API reste seule juge des droits.
    isAdmin: (state) => state.profile?.role === 'admin'
  },

  actions: {
    async fetchProfile(force = false): Promise<CurrentUser | null> {
      const userId = currentUserId();
      if (!userId) {
        this.reset();
        return null;
      }
      // Un autre compte s'est connecté sans passer par la déconnexion (cookie
      // expiré puis nouvelle connexion) : le profil en cache n'est plus le sien.
      if (!force && this.profile && this.loadedFor === userId) return this.profile;
      if (pending) return pending;

      const request: Promise<CurrentUser | null> = userService.getMyInformation()
        .then((response) => {
          // Réinitialisé entre-temps (déconnexion) : la réponse est périmée.
          if (pending !== request) return null;
          // GET /profiles/me renvoie `profile` ; d'anciennes réponses, `user`.
          this.profile = response.profile ?? response.user ?? null;
          this.loadedFor = userId;
          return this.profile;
        })
        .finally(() => {
          if (pending === request) pending = null;
        });
      pending = request;
      return request;
    },

    reset() {
      this.profile = null;
      this.loadedFor = null;
      pending = null;
    }
  }
});
