<template>
  <Transition name="beta-banner">
    <div v-if="visible" class="beta-banner" role="status">
      <div class="beta-banner__inner">
        <span class="beta-banner__tag">BÊTA</span>
        <p class="beta-banner__text">
          MyKpopTrade est en version bêta. Des bugs, lenteurs ou interruptions peuvent
          survenir et vos données peuvent être réinitialisées sans préavis. Le service est
          fourni « en l'état », sans garantie.
          <router-link to="/beta" class="beta-banner__link">En savoir plus</router-link>
        </p>
        <button class="beta-banner__close" aria-label="Masquer le message" @click="dismiss">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// Incrémenter la version pour réafficher le bandeau à tous les utilisateurs
// (ex. après un changement majeur de conditions ou de périmètre bêta).
const STORAGE_KEY = 'mkt_beta_banner_dismissed_v1';

const visible = ref(false);

onMounted(() => {
  try {
    visible.value = localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    visible.value = true;
  }
});

function dismiss() {
  visible.value = false;
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* stockage indisponible : le bandeau réapparaîtra au prochain chargement */
  }
}
</script>

<style lang="scss" scoped>
.beta-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-toast);
  background: var(--bg-card);
  border-top: 2px solid var(--warning);
  box-shadow: var(--shadow-lg);
}

.beta-banner__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.beta-banner__tag {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--warning);
  background: var(--warning-light);
  border: 1px solid var(--warning);
  border-radius: var(--radius-full);
  padding: 2px 10px;
}

.beta-banner__text {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.4;
  color: var(--text-secondary);
}

.beta-banner__link {
  color: var(--accent-pink);
  font-weight: 600;
  text-decoration: underline;
  white-space: nowrap;
}

.beta-banner__close {
  flex-shrink: 0;
  margin-left: auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }
}

.beta-banner-enter-active,
.beta-banner-leave-active {
  transition: transform var(--transition-base), opacity var(--transition-base);
}
.beta-banner-enter-from,
.beta-banner-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .beta-banner__inner {
    align-items: flex-start;
  }
  .beta-banner__text {
    font-size: var(--font-size-xs);
  }
}
</style>
