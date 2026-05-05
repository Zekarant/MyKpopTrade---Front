<template>
  <main class="legal-page">
    <Nav_bar />
    <div class="legal-page__container">
      <header class="legal-page__header">
        <h1>{{ title }}</h1>
        <p class="legal-page__updated">Dernière mise à jour : {{ updatedAt }}</p>
        <p class="legal-page__draft">
          <i class="bi bi-exclamation-triangle"></i>
          Document fourni à titre d'exemple — à faire valider et adapter par un juriste avant publication officielle.
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
import Nav_bar from '@/components/adherents/nav_bar.vue';

export default defineComponent({
  name: 'LegalLayout',
  components: { Nav_bar },
  props: {
    title: { type: String, required: true },
    updatedAt: { type: String, required: true }
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
