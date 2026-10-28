<template>
  <Nav_bar v-if="showNavbar" />
  <RouterView />
  <SiteFooter />
  <BetaBanner />
  <CookieConsent />
</template>

<script setup lang="ts">
import './css/main.scss'

import { RouterView, useRoute } from 'vue-router';
import { computed, defineAsyncComponent, onMounted } from 'vue';
import BetaBanner from '@/components/BetaBanner.vue';
import CookieConsent from '@/components/CookieConsent.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { applyStoredConsent } from '@/services/consent.service';
import { hasSession } from '@/services/session.cookies';
import { navbarModeFor, shouldShowNavbar } from '@/router/navbar';

// Chargée à la demande : l'accueil et la connexion, sans barre, ne la téléchargent pas.
const Nav_bar = defineAsyncComponent(() => import('@/components/adherents/nav_bar.vue'));

const route = useRoute();

// Réévalué à chaque navigation (dépendance à `route`) : une connexion ou une
// déconnexion se termine toujours par un changement de page.
const showNavbar = computed(() => shouldShowNavbar(navbarModeFor(route), hasSession()));

onMounted(() => {
  // Rejoue un consentement déjà donné lors d'une visite précédente. Sans choix
  // enregistré, aucun traceur n'est chargé : le bandeau prend le relais.
  applyStoredConsent();
});
</script>

<style lang="scss">
// Plus Jakarta Sans est auto-hébergée via @fontsource-variable (importée dans main.ts).
@font-face {
  font-family: "Sora";
  src: url('@/assets/fonts/Sora/Sora-VariableFont_wght.woff2') format('woff2');
  font-weight: 100 800;
  font-display: swap;
}
</style>
