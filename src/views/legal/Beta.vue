<template>
  <main class="beta-page" :class="{ 'beta-page--guest': !isAuthenticated }">
    <Nav_bar v-if="isAuthenticated" />
    <div class="beta-page__container">
      <header class="beta-page__header">
        <router-link v-if="!isAuthenticated" to="/" class="beta-page__back">
          <i class="bi bi-arrow-left"></i> Retour à l'accueil
        </router-link>
        <span class="beta-page__tag">BÊTA</span>
        <h1>À propos de la bêta</h1>
        <p class="beta-page__updated">Dernière mise à jour : {{ updatedAt }}</p>
      </header>

      <article class="beta-page__content">
        <p>
          MyKpopTrade est actuellement en <strong>bêta publique</strong>. Notre objectif est de
          tester la plateforme avec une communauté restreinte avant le lancement officiel, et
          d'améliorer le service grâce à vos retours.
        </p>

        <h2>Ce que la bêta implique</h2>
        <ul>
          <li>Le service peut évoluer, être temporairement indisponible ou être interrompu à tout moment.</li>
          <li>Des bugs, lenteurs ou comportements inattendus sont possibles.</li>
          <li>
            Aucune garantie de conservation des données n'est fournie pendant cette phase : vos
            annonces, messages et historiques peuvent être supprimés ou réinitialisés sans préavis.
          </li>
          <li>Le service est fourni « en l'état », sans garantie de disponibilité ni de résultat.</li>
        </ul>

        <h2>Feuille de route</h2>

        <section class="beta-version">
          <div class="beta-version__head">
            <span class="beta-version__badge">v0.1</span>
            <span class="beta-version__label">Version de lancement de la bêta</span>
          </div>
          <div v-for="group in features" :key="group.title" class="beta-version__group">
            <h3 class="beta-version__group-title">
              <i class="bi" :class="group.icon"></i> {{ group.title }}
            </h3>
            <ul class="beta-version__list">
              <li v-for="feat in group.items" :key="feat">{{ feat }}</li>
            </ul>
          </div>
        </section>

        <div class="beta-report">
          <div class="beta-report__text">
            <strong>Un bug, une idée d'amélioration&nbsp;?</strong>
            <span>Vos retours sont essentiels pour faire avancer la plateforme pendant la bêta.</span>
          </div>
          <router-link to="/contact" class="beta-report__btn">
            <i class="bi bi-bug"></i> Signaler un bug ou une suggestion
          </router-link>
        </div>

        <h2>Paiements</h2>
        <p>
          Les paiements sont traités par PayPal. MyKpopTrade ne
          détient jamais vos fonds : l'argent circule directement entre l'acheteur et le vendeur via
          ces prestataires.
        </p>

        <h2>Rôle de MyKpopTrade et responsabilité</h2>
        <p>
          Pendant la bêta, MyKpopTrade est un <strong>projet expérimental</strong> qui ne dispose
          <strong>d'aucune forme juridique</strong> (ni société, ni association) et n'exerce aucune
          activité commerciale. Le service est mis à disposition gratuitement, sans contrepartie.
        </p>
        <p>
          MyKpopTrade agit uniquement comme <strong>intermédiaire technique de mise en relation</strong>
          entre membres et n'est <strong>pas partie aux transactions</strong> conclues entre eux. À ce
          titre, MyKpopTrade <strong>décline toute responsabilité</strong> concernant :
        </p>
        <ul>
          <li>la réalité, la conformité, l'authenticité ou l'état des articles proposés&nbsp;;</li>
          <li>le paiement, l'expédition, la réception ou le remboursement des commandes&nbsp;;</li>
          <li>les litiges, fraudes ou impayés survenant entre membres&nbsp;;</li>
          <li>les pertes financières ou dommages résultant de l'utilisation de la plateforme.</li>
        </ul>
        <p>
          <strong>Chaque utilisateur est seul responsable de ses achats et de ses ventes</strong>,
          des échanges qu'il conclut et du respect de la législation applicable. Les litiges se
          règlent directement entre les parties concernées&nbsp;; MyKpopTrade peut apporter son
          assistance lorsque c'est possible, sans y être tenu.
        </p>

        <h2>Articles interdits</h2>
        <p>
          La vente d'articles contrefaits, volés ou illicites est strictement interdite. Signalez
          tout contenu suspect via la page
          <router-link to="/contact">Contact</router-link>.
        </p>

        <h2>Vos données</h2>
        <p>
          Le traitement de vos données personnelles est décrit dans notre
          <router-link to="/privacy">Politique de confidentialité</router-link>. Les conditions
          d'utilisation complètes figurent dans les
          <router-link to="/cgu">Conditions Générales d'Utilisation</router-link>.
        </p>
      </article>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Cookies from 'js-cookie';
import Nav_bar from '@/components/adherents/nav_bar.vue';

export default defineComponent({
  name: 'BetaPage',
  components: { Nav_bar },
  computed: {
    // Le refresh token (cookie 7 jours) fait foi : présent = session
    // rétablissable, on affiche donc la barre de navigation complète.
    isAuthenticated(): boolean {
      return Boolean(Cookies.get('refreshToken'));
    }
  },
  data() {
    return {
      updatedAt: '3 septembre 2026',
      // Fonctionnalités livrées avec la version 0.1 (lancement de la bêta).
      // Les versions suivantes viendront s'ajouter ici.
      features: [
        {
          title: 'Compte & connexion',
          icon: 'bi-shield-lock',
          items: [
            'Inscription, connexion et mot de passe oublié classiques',
            'Inscription et connexion via Discord et Google',
            'Double authentification via Google Authenticator',
            "Vérification d'identité (conforme RGPD)",
            'Complétion du profil'
          ]
        },
        {
          title: 'Profil & communauté',
          icon: 'bi-people',
          items: [
            'Profil façon Twitter : bannière, avatar, posts, abonnements',
            'Messages déposés sur les profils, avec réponses',
            "Abonnement à d'autres membres",
            'Wishlist personnelle',
            'Dépôt d\'avis'
          ]
        },
        {
          title: 'Annonces & recherche',
          icon: 'bi-search',
          items: [
            'Import quotidien des groupes, albums et membres (source : API Spotify)',
            "Dashboard regroupant l'ensemble des annonces",
            "Favoris affichés sur l'accueil",
            'Articles recommandés',
            'Consultation détaillée des annonces',
            'Filtres de recherche sur les annonces',
            'Publication d\'annonces avec cohérence groupes / albums'
          ]
        },
        {
          title: 'Transactions & paiements',
          icon: 'bi-bag-check',
          items: [
            'Commande, échange et négociation entre membres',
            'Paiements via PayPal (compte business requis pour les vendeurs)',
            'Suivi des paiements, remboursements et demandes de remboursement',
            'Suivi des litiges'
          ]
        },
        {
          title: 'Communication',
          icon: 'bi-chat-dots',
          items: [
            'Messagerie privée en direct',
            "Notifications intégrées à l'application",
            'Formulaire de contact'
          ]
        },
        {
          title: 'Données & conformité RGPD',
          icon: 'bi-file-earmark-lock',
          items: [
            'Gestion des consentements : communications, messages privés, suppression de compte, export des données',
            'Gestion des cookies',
            'Pages de confidentialité et de réglementation'
          ]
        }
      ]
    };
  }
});
</script>

<style lang="scss" scoped>
@use '../../css/beta.scss' as *;
</style>
