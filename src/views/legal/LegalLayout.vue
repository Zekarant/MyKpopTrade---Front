<template>
  <main class="legal-page" :class="{ 'legal-page--guest': !isAuthenticated }">
    <Nav_bar v-if="isAuthenticated" />
    <header v-else class="legal-page__guest-nav">
      <router-link to="/" class="legal-page__back">
        <i class="bi bi-arrow-left"></i> Retour à l'accueil
      </router-link>
    </header>
    <div class="legal-page__container">
      <header class="legal-page__header">
        <h1>{{ title }}</h1>
        <p class="legal-page__updated">Dernière mise à jour : {{ updatedAt }}</p>
        <p class="legal-page__draft">
          <i class="bi bi-exclamation-triangle"></i>
        </p>
      </header>
      <article class="legal-page__content">
        <slot />
      </article>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Cookies from 'js-cookie';
import Nav_bar from '@/components/adherents/nav_bar.vue';

export default defineComponent({
  name: 'LegalLayout',
  components: { Nav_bar },
  props: {
    title: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  computed: {
    // Le refresh token (cookie 7 jours) fait foi : présent = session
    // rétablissable, on peut donc afficher la barre de navigation complète.
    isAuthenticated(): boolean {
      return Boolean(Cookies.get('refreshToken'));
    }
  }
});
</script>

<style lang="scss" scoped>
.legal-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--space-xl) var(--space-md);
  padding-top: calc(var(--navbar-height) + var(--space-xl));
}
/* Sans Nav_bar fixe (visiteur non connecté), pas de réserve d'espace en haut. */
.legal-page--guest {
  padding-top: var(--space-xl);
}
.legal-page__guest-nav {
  max-width: 820px;
  margin: 0 auto var(--space-lg);
}
.legal-page__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;

  &:hover { color: var(--accent-pink); }
}
.legal-page__container {
  max-width: 820px;
  margin: 0 auto;
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  color: var(--text-primary);
}
.legal-page__header {
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: var(--space-lg);
  margin-bottom: var(--space-xl);
  h1 { font-size: var(--font-size-2xl); margin: 0 0 var(--space-sm); }
}
.legal-page__updated { color: var(--text-muted); font-size: var(--font-size-sm); margin: 0 0 var(--space-sm); }
.legal-page__draft {
  background: rgba(255, 193, 7, .15);
  border-left: 3px solid #ffc107;
  color: #b8860b;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  margin: 0;
  i { margin-right: 6px; }
}
.legal-page__content {
  line-height: 1.7;
  :deep(h2) { font-size: var(--font-size-xl); margin-top: var(--space-xl); margin-bottom: var(--space-md); }
  :deep(h3) { font-size: var(--font-size-lg); margin-top: var(--space-lg); margin-bottom: var(--space-sm); }
  :deep(p), :deep(li) { color: var(--text-secondary); }
  :deep(ul), :deep(ol) { padding-left: var(--space-lg); margin-bottom: var(--space-md); }
  :deep(strong) { color: var(--text-primary); }
  :deep(.placeholder) {
    background: rgba(255, 59, 138, .12);
    color: var(--accent-pink);
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 600;
  }
}
</style>
