<template>
  <Transition name="cookie-consent">
    <section
      v-if="visible"
      class="cookie-consent"
      role="dialog"
      aria-labelledby="cookie-consent-title"
    >
      <div class="cookie-consent__inner">
        <div class="cookie-consent__body">
          <h2 id="cookie-consent-title" class="cookie-consent__title">
            <i class="bi bi-shield-check" aria-hidden="true"></i>
            Vos cookies, votre choix
          </h2>
          <p class="cookie-consent__text">
            Nous utilisons des cookies strictement nécessaires au fonctionnement du site
            (connexion, panier). Avec votre accord, nous mesurons aussi la fréquentation
            pour améliorer MyKpopTrade. Vous pouvez changer d'avis à tout moment.
            <router-link to="/cookies" class="cookie-consent__link">Politique cookies</router-link>
          </p>

          <div v-if="detailsOpen" class="cookie-consent__details">
            <div class="cookie-consent__category">
              <div class="cookie-consent__category-head">
                <span class="cookie-consent__category-name">Cookies nécessaires</span>
                <span class="cookie-consent__badge">Toujours actifs</span>
              </div>
              <p class="cookie-consent__category-text">
                Authentification, session et mémorisation de ce choix. Sans eux le site ne
                peut pas fonctionner ; ils ne requièrent pas de consentement.
              </p>
            </div>

            <div class="cookie-consent__category">
              <div class="cookie-consent__category-head">
                <label class="cookie-consent__category-name" for="consent-analytics">
                  Mesure d'audience
                </label>
                <label class="cookie-consent__switch">
                  <input id="consent-analytics" v-model="analyticsChoice" type="checkbox" />
                  <span class="cookie-consent__switch-track" aria-hidden="true"></span>
                  <span class="cookie-consent__sr-only">Autoriser la mesure d'audience</span>
                </label>
              </div>
              <p class="cookie-consent__category-text">
                Google Tag Manager / Google Analytics — statistiques de fréquentation.
                Aucun script de mesure n'est chargé sans votre accord.
              </p>
            </div>
          </div>
        </div>

        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__btn cookie-consent__btn--accept" @click="acceptAll">
            Tout accepter
          </button>
          <button type="button" class="cookie-consent__btn cookie-consent__btn--refuse" @click="refuseAll">
            Tout refuser
          </button>
          <button
            v-if="!detailsOpen"
            type="button"
            class="cookie-consent__btn cookie-consent__btn--ghost"
            @click="detailsOpen = true"
          >
            Personnaliser
          </button>
          <button
            v-else
            type="button"
            class="cookie-consent__btn cookie-consent__btn--ghost"
            @click="saveChoice"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { hasDecided, setConsent, onConsentChange } from '@/services/consent.service';

const visible = ref(false);
const detailsOpen = ref(false);
const analyticsChoice = ref(false);

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  visible.value = !hasDecided();
  // Réaffiche le bandeau quand le choix est réinitialisé depuis le pied de page.
  unsubscribe = onConsentChange((consent) => {
    if (consent === null) {
      analyticsChoice.value = false;
      detailsOpen.value = false;
      visible.value = true;
    }
  });
});

onUnmounted(() => {
  unsubscribe?.();
});

function acceptAll() {
  setConsent({ analytics: true });
  visible.value = false;
}

function refuseAll() {
  setConsent({ analytics: false });
  visible.value = false;
}

function saveChoice() {
  setConsent({ analytics: analyticsChoice.value });
  visible.value = false;
}
</script>

<style lang="scss" scoped>
.cookie-consent {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  // Au-dessus du bandeau bêta : le consentement doit rester atteignable.
  z-index: calc(var(--z-toast) + 1);
  background: var(--bg-card);
  border-top: 2px solid var(--accent-pink);
  box-shadow: var(--shadow-xl);
}

.cookie-consent__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-md);
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
}

.cookie-consent__body {
  flex: 1;
  min-width: 0;
}

.cookie-consent__title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0 0 var(--space-xs);
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);

  i {
    color: var(--accent-pink);
  }
}

.cookie-consent__text {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

.cookie-consent__link {
  color: var(--accent-pink);
  font-weight: 600;
  text-decoration: underline;
  white-space: nowrap;
}

.cookie-consent__details {
  margin-top: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.cookie-consent__category {
  padding: var(--space-sm);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.cookie-consent__category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.cookie-consent__category-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.cookie-consent__category-text {
  margin: var(--space-xs) 0 0;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.cookie-consent__badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--success);
  background: var(--success-light);
  border-radius: var(--radius-full);
  padding: 2px 10px;
  white-space: nowrap;
}

.cookie-consent__switch {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 40px;
    height: 22px;
    margin: 0;
    cursor: pointer;
  }

  .cookie-consent__switch-track {
    display: block;
    width: 40px;
    height: 22px;
    border-radius: var(--radius-full);
    background: var(--surface-border);
    transition: background var(--transition-fast);

    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--bg-card);
      transition: transform var(--transition-fast);
    }
  }

  input:checked + .cookie-consent__switch-track {
    background: var(--accent-pink);

    &::after {
      transform: translateX(18px);
    }
  }

  input:focus-visible + .cookie-consent__switch-track {
    outline: 2px solid var(--accent-pink);
    outline-offset: 2px;
  }
}

.cookie-consent__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.cookie-consent__actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 200px;
}

.cookie-consent__btn {
  padding: 10px var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid var(--accent-pink);
    outline-offset: 2px;
  }
}

// Accepter et refuser partagent le même poids visuel : la CNIL exige que
// refuser soit aussi simple qu'accepter.
.cookie-consent__btn--accept {
  background: var(--accent-pink);
  color: var(--text-inverse);

  &:hover {
    filter: brightness(1.08);
  }
}

.cookie-consent__btn--refuse {
  background: var(--bg-secondary);
  border-color: var(--surface-border);
  color: var(--text-primary);

  &:hover {
    background: var(--surface-hover);
  }
}

.cookie-consent__btn--ghost {
  background: transparent;
  color: var(--text-secondary);

  &:hover {
    color: var(--text-primary);
  }
}

.cookie-consent-enter-active,
.cookie-consent-leave-active {
  transition: transform var(--transition-base), opacity var(--transition-base);
}

.cookie-consent-enter-from,
.cookie-consent-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .cookie-consent__inner {
    flex-direction: column;
    gap: var(--space-md);
    max-height: 80vh;
    overflow-y: auto;
  }

  .cookie-consent__actions {
    width: 100%;
    min-width: 0;
  }
}
</style>
