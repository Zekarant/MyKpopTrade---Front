<template>
  <div class="stripe-onboarding">
    <div class="card">
      <div v-if="loading" class="state">
        <i class="bi bi-arrow-repeat spin icon-lg"></i>
        <h2>Vérification de votre compte Stripe…</h2>
      </div>

      <div v-else-if="payoutsEnabled" class="state state--success">
        <i class="bi bi-check-circle-fill icon-lg"></i>
        <h2>Stripe est activé ! 🎉</h2>
        <p>Vos virements vendeur sont opérationnels. Vous pouvez mettre des produits en vente.</p>
        <router-link to="/adherents/settings" class="btn-link">Retour aux paramètres</router-link>
      </div>

      <template v-else>
        <div ref="stripeContainer" class="stripe-embed"></div>
        <div v-if="embedError" class="state state--error">
          <i class="bi bi-exclamation-triangle icon-lg"></i>
          <p>Impossible de charger le formulaire Stripe. Réessayez plus tard.</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import paymentService from '@/services/payment.service';

export default defineComponent({
  name: 'StripeOnboarding',
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const payoutsEnabled = ref(false);
    const embedError = ref(false);
    const stripeContainer = ref<HTMLElement | null>(null);

    const mountEmbeddedOnboarding = async () => {
      try {
        const { clientSecret } = await paymentService.getStripeAccountSession();

        const instance = await loadConnectAndInitialize({
          publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
          fetchClientSecret: () => Promise.resolve(clientSecret),
        });

        const component = instance.create('account-onboarding');
        component.setCollectionOptions({
          fields: 'currently_due',
          futureRequirements: 'omit',
        });
        component.setOnExit(() => {
          router.push('/adherents/settings');
        });

        if (stripeContainer.value) {
          stripeContainer.value.appendChild(component);
        }
      } catch {
        embedError.value = true;
      }
    };

    onMounted(async () => {
      try {
        const res = await paymentService.getStripeAccountStatus();
        payoutsEnabled.value = !!res.payoutsEnabled;
      } catch {
        payoutsEnabled.value = false;
      } finally {
        loading.value = false;
      }

      if (!payoutsEnabled.value) {
        await mountEmbeddedOnboarding();
      }
    });

    return { loading, payoutsEnabled, embedError, stripeContainer };
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
  max-width: 720px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
}

.stripe-embed {
  width: 100%;
}

.icon-lg {
  font-size: 4em;
  color: var(--accent-pink);
}

.state--success .icon-lg { color: #10b981; }
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
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
