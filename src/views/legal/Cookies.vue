<template>
  <LegalLayout title="Politique cookies" :updated-at="updatedAt">
    <h2>1. Qu'est-ce qu'un cookie ?</h2>
    <p>
      Un cookie est un petit fichier déposé sur votre terminal lors de la consultation d'un site web.
      Il permet au site de mémoriser des informations sur votre visite : préférences d'affichage,
      session de connexion, statistiques d'utilisation.
    </p>
    <p>
      Le dépôt de traceurs est encadré par l'article 82 de la loi Informatique et Libertés, qui
      transpose la directive « ePrivacy », et par les recommandations de la CNIL.
    </p>

    <h2>2. Cookies strictement nécessaires</h2>
    <p>
      Ces cookies sont indispensables au fonctionnement du service. Ils sont exemptés de
      consentement et ne peuvent pas être désactivés depuis le site.
    </p>
    <div class="legal-table-wrapper">
      <table class="legal-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Finalité</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sessionToken</code></td>
            <td>Authentification de la session en cours</td>
            <td>15 minutes</td>
          </tr>
          <tr>
            <td><code>refreshToken</code></td>
            <td>Renouvellement de la session sans nouvelle saisie du mot de passe</td>
            <td>7 jours</td>
          </tr>
          <tr>
            <td><code>id_user</code></td>
            <td>Identification interne du compte connecté</td>
            <td>7 jours</td>
          </tr>
          <tr>
            <td><code>cookie_consent</code></td>
            <td>Mémorise vos choix en matière de cookies, et en constitue la preuve</td>
            <td>6 mois</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      Ces cookies sont émis en <code>SameSite=Lax</code> et, en production, avec l'attribut
      <code>Secure</code> : ils ne circulent que sur une connexion chiffrée.
    </p>

    <h2>3. Cookies de mesure d'audience</h2>
    <p>
      Soumis à votre consentement préalable. Tant que vous n'avez pas accepté, <strong>le script
      correspondant n'est même pas chargé</strong> : aucun traceur de mesure n'est déposé.
    </p>
    <div class="legal-table-wrapper">
      <table class="legal-table">
        <thead>
          <tr>
            <th>Outil</th>
            <th>Finalité</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ analyticsToolName }}</td>
            <td>Statistiques de fréquentation et d'usage, en vue d'améliorer le service</td>
            <td>13 mois maximum</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>4. Cookies tiers</h2>
    <ul>
      <li>
        <strong>PayPal</strong> — déposés au moment d'un paiement ou de la connexion d'un compte
        vendeur, nécessaires à la sécurisation de la transaction. Ils sont régis par la
        <a href="https://www.paypal.com/fr/webapps/mpp/ua/cookie-full" target="_blank" rel="noopener">politique cookies de PayPal</a>.
      </li>
      <li>
        <strong>Google / Discord / Facebook</strong> — si vous choisissez de vous connecter via l'un
        de ces fournisseurs, celui-ci dépose ses propres cookies sur son domaine pendant
        l'authentification. Nous n'y avons pas accès.
      </li>
    </ul>

    <h2>5. Notifications push</h2>
    <p>
      Sur acceptation explicite dans votre navigateur, un abonnement push est enregistré pour vous
      permettre de recevoir des notifications (commandes, messages, baisses de prix). Il ne s'agit
      pas d'un cookie, mais d'un identifiant technique lié à votre navigateur. Vous pouvez le
      révoquer à tout moment depuis vos paramètres ou les réglages de votre navigateur.
    </p>

    <h2>6. Gérer vos préférences</h2>
    <p>
      Refuser est aussi simple qu'accepter : le bandeau propose les deux choix au même niveau, en un
      seul clic. <strong>Aucun accès au service n'est conditionné à l'acceptation</strong> des
      cookies de mesure d'audience.
    </p>
    <p>
      Pour revenir sur votre choix à tout moment, utilisez le lien
      <strong>« Gérer mes cookies »</strong> présent dans le pied de page : le bandeau de
      consentement réapparaît.
    </p>
    <p>
      Vous pouvez également supprimer ou bloquer les cookies depuis les réglages de votre
      navigateur. Notez que le blocage des cookies strictement nécessaires empêche la connexion au
      service.
    </p>

    <h2>7. Durée de conservation des consentements</h2>
    <p>
      Conformément aux recommandations de la CNIL, les choix exprimés sont conservés
      <strong>6 mois</strong>. Au-delà, le bandeau de consentement est de nouveau présenté. Il l'est
      également si les finalités évoluent.
    </p>

    <h2>8. Contact</h2>
    <p>
      Pour toute question relative aux cookies :
      <a :href="`mailto:${legal('dpoEmail')}`">{{ legal('dpoEmail') }}</a>. Voir aussi la
      <router-link to="/privacy">Politique de confidentialité</router-link>.
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
    return { updatedAt: '3 septembre 2026' };
  },
  setup() {
    return { legal, isLegalMissing, analyticsToolName };
  }
});
</script>
