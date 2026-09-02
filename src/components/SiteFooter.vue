<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__brand">
        MyKpopTrade
        <span class="site-footer__tag">BÊTA</span>
      </p>

      <nav class="site-footer__nav" aria-label="Informations légales">
        <router-link to="/legal">Mentions légales</router-link>
        <router-link to="/cgu">CGU</router-link>
        <router-link to="/privacy">Confidentialité</router-link>
        <router-link to="/cookies">Cookies</router-link>
        <button type="button" class="site-footer__link-btn" @click="reopenCookieSettings">
          Gérer mes cookies
        </button>
        <router-link to="/beta">À propos de la bêta</router-link>
        <router-link to="/contact">Contact</router-link>
      </nav>

      <p class="site-footer__copyright">© {{ currentYear }} MyKpopTrade</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { resetConsent } from '@/services/consent.service';

const currentYear = new Date().getFullYear();

/** Réinitialise le choix pour que le bandeau de consentement réapparaisse. */
function reopenCookieSettings() {
  resetConsent();
}
</script>

<style lang="scss" scoped>
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--surface-border);
  background: var(--bg-secondary);
  // Dégage le bandeau bêta fixé en bas de fenêtre.
  padding-bottom: var(--space-2xl);
}

.site-footer__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md) var(--space-md);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-lg);
}

.site-footer__brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0;
  font-weight: 700;
  color: var(--text-primary);
}

.site-footer__tag {
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--warning);
  background: var(--warning-light);
  border: 1px solid var(--warning);
  border-radius: var(--radius-full);
  padding: 1px 8px;
}

.site-footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
  font-size: var(--font-size-sm);

  a,
  .site-footer__link-btn {
    color: var(--text-secondary);
    text-decoration: none;

    &:hover {
      color: var(--accent-pink);
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid var(--accent-pink);
      outline-offset: 2px;
      border-radius: var(--radius-xs);
    }
  }
}

// Bouton stylé comme un lien : l'action est locale (réafficher le bandeau),
// ce n'est pas une navigation.
.site-footer__link-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.site-footer__copyright {
  margin: 0 0 0 auto;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .site-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-footer__copyright {
    margin-left: 0;
  }
}
</style>
