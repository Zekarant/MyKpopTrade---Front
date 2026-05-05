<template>
  <LegalLayout title="Politique cookies" :updated-at="updatedAt">
    <h2>Qu'est-ce qu'un cookie ?</h2>
    <p>
      Un cookie est un petit fichier déposé sur votre terminal lors de la consultation d'un site web.
      Il permet au site de mémoriser des informations sur votre visite (préférences, session de
      connexion, statistiques d'utilisation).
    </p>

    <h2>Cookies utilisés sur MyKpopTrade</h2>

    <h3>Cookies strictement nécessaires (sans consentement)</h3>
    <ul>
      <li><strong>sessionToken</strong> — authentification de la session utilisateur. Durée : session.</li>
      <li><strong>id_user</strong> — identification interne. Durée : session.</li>
      <li><strong>cookie_consent</strong> — mémorise vos choix sur les cookies. Durée : 6 mois.</li>
    </ul>

    <h3>Cookies de mesure d'audience (avec consentement)</h3>
    <ul>
      <li><span class="placeholder">[OUTIL_ANALYTICS]</span> — statistiques anonymisées de fréquentation. Durée : 13 mois max.</li>
    </ul>

    <h3>Cookies tiers</h3>
    <ul>
      <li><strong>PayPal</strong> — déposé lors d'un paiement, géré par PayPal selon sa propre politique.</li>
    </ul>

    <h2>Notifications push</h2>
    <p>
      Sur acceptation explicite, votre navigateur enregistre un abonnement push permettant de recevoir
      des notifications (commandes, messages, baisses de prix). Vous pouvez le révoquer à tout moment
      depuis vos paramètres ou les réglages du navigateur.
    </p>

    <h2>Gérer vos préférences</h2>
    <p>
      Vous pouvez à tout moment modifier vos préférences depuis le bandeau cookies (en bas de page)
      ou désactiver l'enregistrement des cookies dans les paramètres de votre navigateur.
    </p>

    <h2>Durée de conservation des consentements</h2>
    <p>
      Conformément aux recommandations de la CNIL, les choix exprimés sont conservés <strong>6 mois</strong>.
      Au-delà, le bandeau de consentement est de nouveau présenté.
    </p>

    <h2>Contact</h2>
    <p>
      Pour toute question relative aux cookies : <span class="placeholder">[EMAIL_DPO]</span>.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';

export default defineComponent({
  name: 'CookiesPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '5 mai 2026' };
  }
});
</script>
