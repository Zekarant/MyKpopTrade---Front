<template>
  <div class="payment-cancel-container">
    <div class="cancel-card">
      <div class="icon-container" aria-hidden="true">
        <i class="bi bi-x-circle"></i>
      </div>
      <h1>Paiement annulé</h1>
      <p class="message">
        Votre paiement a été annulé et aucun montant n'a été débité.
      </p>
      <div v-if="paymentToken" class="details">
        <p class="token-info">Référence : {{ paymentToken }}</p>
      </div>
      <div v-if="source" class="info-box">
        <p>Source : <strong>{{ source }}</strong></p>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="goToHome">
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Retour de PayPal après abandon : annule l'ordre et ceux restant d'un checkout panier. */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import paymentService from '@/services/payment.service';
import { cancelPendingPayments } from './pendingPayments';

defineOptions({ name: 'PaymentCancel' });

const route = useRoute();
const router = useRouter();

const paymentToken = ref('');
const source = ref('');

onMounted(async () => {
  paymentToken.value = (route.query.token as string) || '';
  source.value = (route.query.source as string) || '';

  if (paymentToken.value) {
    try {
      await paymentService.cancelPayPal(paymentToken.value);
    } catch {
      // Ignorer les erreurs (paiement déjà annulé, etc.)
    }
  }

  // Annuler les paiements suivants d'un checkout panier
  await cancelPendingPayments((orderId) => paymentService.cancelPayPal(orderId));
});

function goToHome() {
  localStorage.removeItem('lastProductId');
  router.push({ name: 'dashboard' });
}
</script>

<style lang="scss" scoped>
.payment-cancel-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
  background: var(--bg-secondary);
}

.cancel-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.icon-container {
  margin-bottom: 20px;

  i {
    font-size: 80px;
    color: var(--danger);
  }
}

h1 {
  color: var(--text-primary);
  margin-bottom: 15px;
  font-size: 28px;
  font-weight: 600;
}

.message {
  color: var(--text-secondary);
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.details {
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.token-info {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  word-break: break-all;
  font-family: var(--font-mono);
}

.info-box {
  background: var(--warning-light);
  border: 1px solid var(--warning);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 20px;

  p {
    margin: 0;
    font-size: 14px;
    color: var(--text-primary);
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-secondary {
  background: var(--secondary-color);
  color: var(--text-on-accent);

  &:hover {
    background: var(--secondary-color-shade);
    transform: translateY(-2px);
  }
}

@media (max-width: 550px) {
  .cancel-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }

  .icon-container i {
    font-size: 60px;
  }
}
</style>
