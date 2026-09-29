<template>
    <main class="page profile-root">
        <Nav_bar></Nav_bar>
        <div class="profile-layout">
          <div class="profile-layout__content">
            <div class="profile-banner-wrap">
              <banner_profil :profilInfo="profile" :admin="isOwnProfile"></banner_profil>
              <div v-if="!isOwnProfile && profileUserId" class="profile-banner-wrap__actions">
                <button
                  class="profile-report-btn"
                  title="Signaler ce profil"
                  @click="reportTarget = { type: 'user', id: profileUserId }"
                >
                  <i class="bi bi-flag"></i> Signaler ce profil
                </button>
              </div>
            </div>
            <segment_profil @partDisplayed="(part: string) => (partView = part)"></segment_profil>

            <!-- KeepAlive : un brouillon de publication ou un filtre d'avis
                 survit au changement d'onglet, comme quand tout vivait ici. -->
            <KeepAlive>
              <ProfilePostsTab
                v-if="partView === 'post'"
                :profile-user-id="profileUserId"
                :is-own-profile="isOwnProfile"
                :username="profile.username"
                @report="(target) => (reportTarget = target)"
              />
              <ProfileListingsTab
                v-else-if="partView === 'annoucement'"
                :profile="profile"
                :profile-user-id="profileUserId"
                :is-own-profile="isOwnProfile"
              />
              <ProfileAboutTab
                v-else-if="partView === 'about'"
                :profile="profile"
                :is-own-profile="isOwnProfile"
              />
              <ProfileReviewsTab
                v-else-if="partView === 'review'"
                :profile-user-id="profileUserId"
                :is-own-profile="isOwnProfile"
              />
              <ProfileFollowersTab
                v-else-if="partView === 'followers'"
                :profile-user-id="profileUserId"
                :is-own-profile="isOwnProfile"
              />
            </KeepAlive>

            <!-- Wishlist -->
            <div class="profile-tab-content" v-if="partView === 'wishlist'">
              <div class="empty-state">
                <i class="bi bi-heart"></i>
                <p>Aucun article dans la wishlist.</p>
              </div>
            </div>

          </div>
        </div>

        <report_card
          v-if="reportTarget"
          :type="reportTarget.type"
          :id="reportTarget.id"
          @closeReport="reportTarget = null"
        ></report_card>

    </main>
  </template>

  <script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import Nav_bar from '@/components/adherents/nav_bar.vue';
    import banner_profil from '@/components/adherents/banner.vue';
    import segment_profil from '@/components/adherents/segment_profil.vue';
    import report_card from '@/components/report_card.vue';
    import authentificationService from '@/services/authentification.service';
    import { API_URL } from '@/config/api';
    import { createApiClient } from '@/services/http';
    import ProfilePostsTab from './profile/ProfilePostsTab.vue';
    import ProfileListingsTab from './profile/ProfileListingsTab.vue';
    import ProfileAboutTab from './profile/ProfileAboutTab.vue';
    import ProfileReviewsTab from './profile/ProfileReviewsTab.vue';
    import ProfileFollowersTab from './profile/ProfileFollowersTab.vue';
    import { profileIdOf, type ProfileInfo, type ReportTarget } from './profile/types';

    /**
     * Page profil : bandeau, navigation et chargement du profil (le mien sur
     * /adherents/profile/me, celui d'un membre sinon). Chaque onglet charge et
     * gère ses propres données (voir ./profile/).
     */

    defineOptions({ name: 'ProfilePage' });

    /** Client partagé : renouvelle la session expirée et rejoue la requête. */
    const api = createApiClient({ baseURL: API_URL });

    const route = useRoute();
    const partView = ref('post');
    const profile = ref<ProfileInfo>({});
    const reportTarget = ref<ReportTarget | null>(null);

    const routeProfileId = computed(() => {
      const id = route.params.id;
      return Array.isArray(id) ? id[0] : id;
    });
    const isOwnProfile = computed(() => routeProfileId.value === 'me');
    const profileUserId = computed(() => profileIdOf(profile.value));

    // Client partagé : session renouvelée et requête rejouée automatiquement ;
    // un 401 restant signifie session perdue, déjà redirigée vers /login.
    async function loadProfile(id: string | undefined) {
      if (!id) return;
      try {
        if (id === 'me') {
          const response = await api.get('/api/auth/profile');
          profile.value = {
            ...response.data.user,
            socialLinks: response.data.user.socialLinks ?? { instagram: '', twitter: '', discord: '' }
          };
        } else {
          const response = await api.get(`/api/profiles/user/${encodeURIComponent(id)}`);
          profile.value = response.data.profile;
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    }

    onMounted(() => {
      authentificationService
        .verifSession()
        .then(() => loadProfile(routeProfileId.value))
        // Sans session, verifSession a déjà déconnecté et redirigé vers /login.
        .catch(() => undefined);
    });

    watch(routeProfileId, (newId, oldId) => {
      if (newId !== oldId) loadProfile(newId);
    });
  </script>

<style lang="scss">
@use 'sass:meta';

// Feuille rattachée à la page par sa classe racine plutôt qu'au scope du
// composant : les onglets (composants enfants) en héritent sans en embarquer
// chacun une copie. `.profile-root .x` a la même spécificité que `.x[data-v]`.
.profile-root {
  @include meta.load-css('../../css/profile.scss');
}
</style>

