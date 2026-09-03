<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <!-- Marque -->
      <router-link to="/" class="site-footer__brand" aria-label="Accueil MyKpopTrade">
        <img src="@/assets/images/logo.png" alt="" class="site-footer__logo" />
        <span class="site-footer__name">MyKpopTrade</span>
        <span class="site-footer__tag">BÊTA</span>
      </router-link>

      <!-- Navigation -->
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

      <hr class="site-footer__divider" />

      <!-- Bas de page -->
      <div class="site-footer__bottom">
        <p class="site-footer__copyright">© {{ currentYear }} MyKpopTrade</p>

        <ul class="site-footer__socials">
          <li v-for="social in socials" :key="social.label">
            <a
              :href="social.href"
              class="site-footer__social"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
            >
              <i class="bi" :class="social.icon"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { resetConsent } from '@/services/consent.service';

const currentYear = new Date().getFullYear();

// TODO: remplacer par les URLs officielles des comptes MyKpopTrade avant la mise
// en production. Les valeurs ci-dessous sont des espaces réservés.
const socials = [
  { label: 'Instagram', icon: 'bi-instagram', href: 'https://instagram.com/mykpoptrade' },
  { label: 'X (Twitter)', icon: 'bi-twitter-x', href: 'https://x.com/mykpoptrade' },
  { label: 'Discord', icon: 'bi-discord', href: 'https://discord.gg/mykpoptrade' },
] as const;

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
  max-width: var(--container-lg);
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-lg);
}

// === Marque ===
.site-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-primary);
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-pink);
    outline-offset: 4px;
    border-radius: var(--radius-sm);
  }
}

.site-footer__logo {
  height: 28px;
  width: auto;
}

.site-footer__name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--font-size-lg);
  letter-spacing: -0.01em;
}

.site-footer__tag {
  align-self: center;
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--warning);
  background: var(--warning-light);
  border-radius: var(--radius-full);
  padding: 2px 8px;
}

// === Navigation ===
.site-footer__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;

  a,
  .site-footer__link-btn {
    color: var(--text-secondary);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--accent-pink);
    }

    &:focus-visible {
      outline: 2px solid var(--accent-pink);
      outline-offset: 3px;
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

// === Séparateur ===
.site-footer__divider {
  width: 100%;
  margin: 0;
  border: none;
  border-top: 1px solid var(--surface-border);
}

// === Bas de page ===
.site-footer__bottom {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.site-footer__copyright {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.site-footer__socials {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-footer__social {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 1px solid var(--surface-border);
  color: var(--text-secondary);
  font-size: 1rem;
  transition: color var(--transition-fast), border-color var(--transition-fast),
    background var(--transition-fast);

  &:hover {
    color: var(--accent-pink);
    border-color: var(--accent-pink);
    background: rgba(255, 45, 120, 0.05);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-pink);
    outline-offset: 2px;
  }
}

@media (max-width: 640px) {
  .site-footer__inner {
    padding-top: var(--space-2xl);
    gap: var(--space-md);
  }

  .site-footer__bottom {
    flex-direction: column;
    gap: var(--space-md);
  }
}
</style>
