<template>
  <main class="not-found">
    <p class="not-found__code">404</p>
    <h1 class="not-found__title">Page introuvable</h1>
    <p class="not-found__text">
      Cette page n'existe pas ou a été déplacée. Vérifie l'adresse, ou repars de l'accueil.
    </p>
    <router-link to="/" class="btn btn-primary">
      <i class="bi bi-house"></i> Retour à l'accueil
    </router-link>
  </main>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  text-align: center;
}

.not-found__code {
  margin: 0;
  font-size: 5rem;
  font-weight: 800;
  line-height: 1;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.not-found__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 800;
}

.not-found__text {
  margin: 0;
  max-width: 420px;
  color: var(--text-muted);
}
</style>
