<template>
  <RouterView />
  <SiteFooter />
  <BetaBanner />
  <CookieConsent />
</template>

<script setup lang="ts">
import './css/main.scss'

import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import BetaBanner from '@/components/BetaBanner.vue';
import CookieConsent from '@/components/CookieConsent.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { applyStoredConsent } from '@/services/consent.service';

onMounted(() => {
  // Rejoue un consentement déjà donné lors d'une visite précédente. Sans choix
  // enregistré, aucun traceur n'est chargé : le bandeau prend le relais.
  applyStoredConsent();
});
</script>

<style lang="scss">
// Plus Jakarta Sans est chargée par index.html (une seule requête, non bloquante pour le CSS).
@font-face {
  font-family: "Sora";
  src: url('@/assets/fonts/Sora/Sora-VariableFont_wght.woff2') format('woff2');
  font-weight: 100 800;
  font-display: swap;
}
</style>
