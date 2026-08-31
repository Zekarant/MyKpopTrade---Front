<template>
  <main class="beta-page">
    <div class="beta-page__container">
      <header class="beta-page__header">
        <router-link to="/" class="beta-page__back">
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

        <h2>Paiements</h2>
        <p>
          Les paiements sont traités par nos prestataires (Stripe et/ou PayPal). MyKpopTrade ne
          détient jamais vos fonds : l'argent circule directement entre l'acheteur et le vendeur via
          ces prestataires.
        </p>

        <h2>Rôle de MyKpopTrade</h2>
        <p>
          MyKpopTrade agit comme <strong>intermédiaire technique de mise en relation</strong> et
          n'est pas partie aux transactions conclues entre membres. La conformité des articles, leur
          expédition et le bon déroulement du paiement relèvent de la responsabilité des membres
          vendeurs et acheteurs. Les litiges se règlent entre les parties, avec l'assistance de
          MyKpopTrade lorsque c'est possible.
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

        <h2>Un bug, une idée&nbsp;?</h2>
        <p>
          Vos retours sont précieux pendant cette phase. Contactez-nous via la page
          <router-link to="/contact">Contact</router-link> pour signaler un problème ou proposer une
          amélioration.
        </p>
      </article>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BetaPage',
  data() {
    return { updatedAt: '31 août 2026' };
  }
});
</script>

<style lang="scss" scoped>
.beta-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--space-xl) var(--space-md);
}
.beta-page__container {
  max-width: 820px;
  margin: 0 auto;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  color: var(--text-primary);
}
.beta-page__header {
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: var(--space-lg);
  margin-bottom: var(--space-xl);

  h1 { font-size: var(--font-size-2xl); margin: var(--space-sm) 0; }
}
.beta-page__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: var(--space-md);

  &:hover { color: var(--accent-pink); }
}
.beta-page__tag {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--warning);
  background: var(--warning-light);
  border: 1px solid var(--warning);
  border-radius: var(--radius-full);
  padding: 2px 10px;
}
.beta-page__updated { color: var(--text-muted); font-size: var(--font-size-sm); margin: 0; }
.beta-page__content {
  line-height: 1.7;

  h2 { font-size: var(--font-size-xl); margin-top: var(--space-xl); margin-bottom: var(--space-md); }
  p, li { color: var(--text-secondary); }
  ul, ol { padding-left: var(--space-lg); margin-bottom: var(--space-md); }
  strong { color: var(--text-primary); }
  a { color: var(--accent-pink); text-decoration: underline; }
}
</style>
