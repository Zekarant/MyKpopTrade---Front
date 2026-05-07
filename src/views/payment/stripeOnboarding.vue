<template>
  <div class="stripe-onboarding">
    <div class="card">
      <div v-if="loading" class="state">
        <i class="bi bi-arrow-repeat spin icon-lg"></i>
        <h2>Vérification de votre compte Stripe…</h2>
      </div>

      <div v-else-if="status?.payoutsEnabled" class="state state--success">
        <i class="bi bi-check-circle-fill icon-lg"></i>
        <h2>Stripe est activé ! 🎉</h2>
        <p>Vos virements vendeur sont opérationnels. Vous pouvez mettre des produits en vente.</p>
        <router-link to="/adherents/settings" class="btn-link">Retour aux paramètres</router-link>
      </div>

      <div v-else-if="status?.onboarded" class="state state--warning">
        <i class="bi bi-clock icon-lg"></i>
        <h2>Vérification Stripe en cours</h2>
        <p>
          Stripe a bien reçu vos infos et procède aux vérifications.
          Vous pouvez vendre dès maintenant, mais les virements seront retenus
          jusqu'à validation. Repassez un peu plus tard pour voir le statut.
        </p>
        <button class="btn-link" @click="resumeOnboarding" :disabled="resuming">
          {{ resuming ? 'Redirection…' : 'Compléter mes informations' }}
        </button>
        <router-link to="/adherents/settings" class="btn-link btn-link--ghost">Retour aux paramètres</router-link>
      </div>

      <div v-else class="state state--error">
        <i class="bi bi-exclamation-triangle icon-lg"></i>
        <h2>Onboarding Stripe non terminé</h2>
        <p>
          Vous n'avez pas encore activé Stripe sur votre compte. Reprenez
          l'onboarding pour pouvoir recevoir des paiements.
        </p>
        <button class="btn-link" @click="resumeOnboarding" :disabled="resuming">
          {{ resuming ? 'Redirection…' : 'Démarrer l\'onboarding' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import paymentService from '@/services/payment.service';

interface StripeStatus {
  onboarded: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
}

export default defineComponent({
  name: 'StripeOnboarding',
  setup() {
    const loading = ref(true);
    const resuming = ref(false);
    const status = ref<StripeStatus | null>(null);

    const fetchStatus = async () => {
      try {
        const res = await paymentService.getStripeAccountStatus();
        status.value = {
          onboarded: !!res.onboarded,
          payoutsEnabled: !!res.payoutsEnabled,
          chargesEnabled: !!res.chargesEnabled
        };
      } catch {
        status.value = { onboarded: false, payoutsEnabled: false, chargesEnabled: false };
      } finally {
        loading.value = false;
      }
    };

    const resumeOnboarding = async () => {
      resuming.value = true;
      try {
        const res = await paymentService.getStripeOnboardingLink();
        if (res.url) {
          window.location.href = res.url;
        }
      } catch {
        resuming.value = false;
      }
    };

    onMounted(fetchStatus);

    return { loading, resuming, status, resumeOnboarding };
  }
});
</script>

<style scoped lang="scss">
.stripe-onboarding {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: var(--bg-primary);
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  max-width: 520px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.icon-lg {
  font-size: 4em;
  color: var(--accent-pink);
}

.state--success .icon-lg { color: #10b981; }
.state--warning .icon-lg { color: #f59e0b; }
.state--error .icon-lg { color: #ef4444; }

h2 {
  font-size: var(--font-size-lg);
  margin: 0;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin: 0;
}

.btn-link {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--accent-gradient);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: opacity var(--transition-fast);

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--surface-border);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
