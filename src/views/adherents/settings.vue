<template>
  <main class="page settings-root">
    <Nav_bar />
    <div class="settings-page">
      <div class="settings-page__container">
        <!-- Header -->
        <div class="settings-page__header">
          <button @click="$router.back()" class="settings-page__back" aria-label="Retour">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="settings-page__heading">
            <h1 class="settings-page__title">Paramètres</h1>
            <p class="settings-page__subtitle">
              {{ activeSectionLabel }}
            </p>
          </div>
          <router-link
            v-if="userProfile._id || userProfile.id"
            to="/adherents/profile/me"
            class="settings-page__view-profile"
          >
            <i class="bi bi-eye"></i>
            <span>Voir mon profil public</span>
          </router-link>
        </div>

        <router-link
          v-if="userProfile.profileCompleted === false"
          to="/profile-completion"
          class="settings-banner"
        >
          <i class="bi bi-exclamation-circle"></i>
          <span>
            Votre profil n'est pas finalisé. Terminez-le pour pouvoir acheter et vendre.
          </span>
          <i class="bi bi-chevron-right"></i>
        </router-link>

        <div class="settings-page__layout">
          <!-- Navigation entre sections -->
          <nav class="settings-nav" aria-label="Sections des paramètres">
            <button
              v-for="section in sections"
              :key="section.id"
              type="button"
              class="settings-nav__item"
              :class="{ 'settings-nav__item--active': activeSection === section.id }"
              @click="goToSection(section.id)"
            >
              <i class="bi" :class="section.icon"></i>
              <span>{{ section.label }}</span>
            </button>
          </nav>

          <!-- Content. KeepAlive : une saisie non enregistrée survit au
               changement de section, comme lorsque tout l'état vivait ici. -->
          <div class="settings-page__content">
            <KeepAlive>
              <ProfileSection
                v-if="activeSection === 'profil'"
                :profile="userProfile"
                :reload-profile="loadProfile"
                @patch="patchProfile"
              />
              <SecuritySection
                v-else-if="activeSection === 'securite'"
                :profile="userProfile"
                :reload-profile="loadProfile"
              />
              <AccountSection
                v-else-if="activeSection === 'compte'"
                :profile="userProfile"
                :reload-profile="loadProfile"
                @patch="patchProfile"
              />
              <PaymentsSection
                v-else-if="activeSection === 'paiements'"
                :profile="userProfile"
                :reload-profile="loadProfile"
                :paypal="paypal"
                @patch="patchProfile"
              />
              <PreferencesSection
                v-else-if="activeSection === 'preferences'"
                :profile="userProfile"
                :reload-profile="loadProfile"
                @patch="patchProfile"
              />
              <DataSection
                v-else-if="activeSection === 'donnees'"
                :profile="userProfile"
                :reload-profile="loadProfile"
                @patch="patchProfile"
              />
            </KeepAlive>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Nav_bar from '@/components/adherents/nav_bar.vue';
import ProfileSection from './settings/ProfileSection.vue';
import SecuritySection from './settings/SecuritySection.vue';
import AccountSection from './settings/AccountSection.vue';
import PaymentsSection from './settings/PaymentsSection.vue';
import PreferencesSection from './settings/PreferencesSection.vue';
import DataSection from './settings/DataSection.vue';
import { api } from './settings/shared';
import type { SettingsProfile } from './settings/shared';
import { usePaypalAccount } from './settings/usePaypalAccount';

const SETTINGS_SECTIONS = [
  { id: 'profil', label: 'Profil public', icon: 'bi-person' },
  { id: 'securite', label: 'Sécurité', icon: 'bi-shield-lock' },
  { id: 'compte', label: 'Compte', icon: 'bi-person-badge' },
  { id: 'paiements', label: 'Paiements', icon: 'bi-credit-card' },
  { id: 'preferences', label: 'Préférences', icon: 'bi-sliders' },
  { id: 'donnees', label: 'Confidentialité', icon: 'bi-database' }
] as const;

type SectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

const SOCIAL_LINK_ERRORS: Record<string, string> = {
  account_already_linked: 'Ce compte est déjà lié à un autre utilisateur MyKpopTrade.',
  google_link_failed: 'La liaison du compte Google a échoué. Réessayez.',
  discord_link_failed: 'La liaison du compte Discord a échoué. Réessayez.',
  no_token: 'Session expirée. Reconnectez-vous puis réessayez.',
  invalid_token: 'Session expirée. Reconnectez-vous puis réessayez.',
  user_not_found: 'Compte introuvable. Reconnectez-vous puis réessayez.',
  oauth_state_invalid: 'La liaison a expiré ou a été lancée depuis un autre navigateur. Réessayez.'
};

/**
 * Page Paramètres : en-tête, navigation et chargement du profil. Chaque
 * section porte son propre état et ses appels (voir ./settings/).
 */
export default defineComponent({
  name: 'SettingsPage',
  components: {
    Nav_bar,
    ProfileSection,
    SecuritySection,
    AccountSection,
    PaymentsSection,
    PreferencesSection,
    DataSection
  },
  data() {
    return {
      sections: SETTINGS_SECTIONS,
      activeSection: 'profil' as SectionId,
      userProfile: {} as SettingsProfile,
      paypal: usePaypalAccount()
    };
  },
  computed: {
    activeSectionLabel(): string {
      return SETTINGS_SECTIONS.find((s) => s.id === this.activeSection)?.label ?? '';
    }
  },
  watch: {
    // Permet d'arriver directement sur une section depuis un lien.
    '$route.query.section': {
      immediate: true,
      handler(section: unknown) {
        if (typeof section === 'string' && SETTINGS_SECTIONS.some((s) => s.id === section)) {
          this.activeSection = section as SectionId;
        }
      }
    }
  },
  async mounted() {
    await this.loadProfile();
    // Retour du parcours d'onboarding PayPal : on force un statut frais plutôt
    // que de croire le query param.
    const params = new URLSearchParams(window.location.search);
    const justOnboarded = params.get('paypal_onboarding') === 'complete';
    const onboardingError = params.get('paypal_error');

    this.reportSocialLinkOutcome(params);

    await this.paypal.load(justOnboarded);

    if (justOnboarded && !this.paypal.connected && this.paypal.blockMessage) {
      this.$func.showToastError(this.paypal.blockMessage);
    } else if (justOnboarded) {
      this.$func.showToastSuccess('Votre compte PayPal est connecté.');
    } else if (onboardingError) {
      this.$func.showToastError(
        'La connexion PayPal n\'a pas pu être finalisée. Merci de réessayer.'
      );
    }
  },
  methods: {
    /** Reflète la section dans l'URL, pour pouvoir la partager. */
    goToSection(section: SectionId) {
      this.activeSection = section;
      this.$router.replace({ query: { ...this.$route.query, section } });
    },

    /** Restitue le retour de l'API : `?linked=google` ou `?error=<code>`. */
    reportSocialLinkOutcome(params: URLSearchParams) {
      const linked = params.get('linked');
      const error = params.get('error');

      if (linked) {
        const label = linked === 'discord' ? 'Discord' : 'Google';
        this.$func.showToastSuccess(`Votre compte ${label} est maintenant lié.`);
        this.goToSection('securite');
        return;
      }

      if (!error) return;

      this.$func.showToastError(SOCIAL_LINK_ERRORS[error] || 'La liaison du compte a échoué.');
      this.goToSection('securite');
    },

    /**
     * Remplace l'objet profil : les sections qui le surveillent resynchronisent
     * leurs champs (voir le contrat dans ./settings/shared.ts).
     */
    async loadProfile() {
      try {
        const res = await api.get('/api/auth/profile');
        this.userProfile = res.data.user || res.data;
      } catch {
        // Session perdue : le client HTTP a déjà redirigé vers /login.
      }
    },

    /** Mise à jour partielle, appliquée en place pour ne rien resynchroniser. */
    patchProfile(changes: Partial<SettingsProfile>) {
      Object.assign(this.userProfile, changes);
    }
  }
});
</script>

<style lang="scss">
@use 'sass:meta';

// Feuille rattachée à la page par sa classe racine plutôt qu'au scope du
// composant : les sections (composants enfants) en héritent sans en embarquer
// chacune une copie. `.settings-root .x` a la même spécificité que `.x[data-v]`.
.settings-root {
  @include meta.load-css('../../css/settings.scss');
}
</style>
