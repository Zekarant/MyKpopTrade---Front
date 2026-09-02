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
      <li><strong>sessionToken</strong> — authentification de la session utilisateur. Durée : 15 minutes.</li>
      <li><strong>refreshToken</strong> — renouvellement de la session sans nouvelle saisie du mot de passe. Durée : 7 jours.</li>
      <li><strong>id_user</strong> — identification interne du compte connecté. Durée : 7 jours.</li>
      <li><strong>cookie_consent</strong> — mémorise vos choix sur les cookies. Durée : 6 mois.</li>
    </ul>

    <h3>Cookies de mesure d'audience (avec consentement)</h3>
    <ul>
      <li>{{ analyticsToolName }} — statistiques anonymisées de fréquentation. Durée : 13 mois max.</li>
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
      Aucun cookie de mesure d'audience n'est déposé avant votre accord explicite : le script
      correspondant n'est même pas chargé tant que vous n'avez pas choisi.
    </p>
    <p>
      Pour revenir sur votre choix à tout moment, utilisez le lien
      <strong>« Gérer mes cookies »</strong> présent dans le pied de page : le bandeau de
      consentement réapparaît. Vous pouvez également supprimer ou bloquer les cookies depuis
      les paramètres de votre navigateur.
    </p>

    <h2>Durée de conservation des consentements</h2>
    <p>
      Conformément aux recommandations de la CNIL, les choix exprimés sont conservés <strong>6 mois</strong>.
      Au-delà, le bandeau de consentement est de nouveau présenté.
    </p>

    <h2>Contact</h2>
    <p>
      Pour toute question relative aux cookies : <span :class="{ placeholder: isLegalMissing('dpoEmail') }">{{ legal('dpoEmail') }}</span>.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';
import { legal, isLegalMissing, analyticsToolName } from '@/config/legal';

export default defineComponent({
  name: 'CookiesPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '5 mai 2026' };
  },
  // Identité légale résolue depuis src/config/legal.ts : un seul endroit à
  // renseigner pour les 4 pages légales.
  setup() {
    return { legal, isLegalMissing, analyticsToolName };
  }
});
</script>
