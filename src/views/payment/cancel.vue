<template>
  <div class="payment-cancel-container">
    <div class="cancel-card">
      <div class="icon-container">
        <i class="bi bi-x-circle"></i>
      </div>
      <h1>Paiement annulé</h1>
      <p class="message">
        Votre paiement a été annulé et aucun montant n'a été débité.
      </p>
      <div class="details" v-if="paymentToken">
        <p class="token-info">Référence : {{ paymentToken }}</p>
      </div>
      <div class="info-box" v-if="source">
        <p>Source : <strong>{{ source }}</strong></p>
      </div>
      <div class="actions">
        <button @click="goToHome" class="btn btn-secondary">
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'PaymentCancel',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const paymentToken = ref<string>('');
    const source = ref<string>('');

    onMounted(() => {
      // Récupérer les paramètres de query
      paymentToken.value = (route.query.token as string) || '';
      source.value = (route.query.source as string) || '';
      
      console.log('Payment cancelled - Token:', paymentToken.value, 'Source:', source.value);
    });


    const goToHome = () => {
      // Nettoyer le localStorage
      localStorage.removeItem('lastProductId');
      router.push({ name: 'dashboard' });
    };

    return {
      paymentToken,
      source,
      goToHome
    };
  }
});
</script>

<style lang="scss" scoped>
.payment-cancel-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
  background: #f8f9fa;
}

.cancel-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.icon-container {
  margin-bottom: 20px;
  
  i {
    font-size: 80px;
    color: #dc3545;
  }
}

h1 {
  color: #333;
  margin-bottom: 15px;
  font-size: 28px;
  font-weight: 600;
}

.message {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.token-info {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
  word-break: break-all;
  font-family: monospace;
}

.info-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  
  p {
    margin: 0;
    font-size: 14px;
    color: #856404;
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

.btn-primary {
  background: var(--blue, #007bff);
  color: white;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
}

.btn-secondary {
  background: #6c757d;
  color: white;
  
  &:hover {
    background: #5a6268;
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
