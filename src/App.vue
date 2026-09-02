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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

@font-face {
  font-family: "Sora";
  src: url('@/assets/fonts/Sora/Sora-VariableFont_wght.ttf');
}
</style>
