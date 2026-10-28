<template>
  <article :class="['payment-card', { 'payment-card--focused': focused }]">
    <div class="payment-card__head">
      <div class="payment-card__product">
        <img v-if="productImage" :src="mediaUrl(productImage)" :alt="productTitle" loading="lazy" decoding="async" />
        <div class="payment-card__product-info">
          <strong>{{ productTitle }}</strong>
          <small>{{ formatDate(payment.createdAt) }}</small>
        </div>
      </div>
      <div class="payment-card__amount">
        <span class="payment-card__price">{{ formatPrice(payment.amount, payment.currency) }}</span>
        <span :class="['status-badge', `status-badge--${payment.status}`]">{{ statusLabel(payment.status) }}</span>
      </div>
    </div>

    <!-- Détail du montant : évite que l'acheteur prenne les frais de
         port pour des frais de service. -->
    <div v-if="payment.shippingAmount" class="payment-breakdown">
      <div class="payment-breakdown__row">
        <span>Article</span>
        <span>{{ formatPrice(payment.productAmount || 0, payment.currency) }}</span>
      </div>
      <div class="payment-breakdown__row">
        <span>Frais de port</span>
        <span>{{ formatPrice(payment.shippingAmount, payment.currency) }}</span>
      </div>
      <div class="payment-breakdown__row payment-breakdown__row--total">
        <span>Total payé</span>
        <span>{{ formatPrice(payment.amount, payment.currency) }}</span>
      </div>
    </div>

    <PaymentRefunds :payment="payment" :viewer-is-seller="isSeller(payment, currentUserId)" />

    <PaymentShipment v-if="payment.shipment" :shipment="payment.shipment" />

    <div class="payment-card__actions">
      <button v-if="canMarkDelivered(payment, currentUserId)" type="button" class="btn btn--ghost btn--sm" @click="emit('markDelivered', payment)">
        <i class="bi bi-check2-circle"></i> Marquer livré
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
/** Carte d'un paiement dans « Mes paiements » : article, montants, remboursements et expédition. */
import { computed } from 'vue';
import { formatDate, formatPrice, mediaUrl } from '@/utils/format';
import { statusLabel } from './paymentLabels';
import { canMarkDelivered, isSeller } from './paymentRules';
import PaymentRefunds from './PaymentRefunds.vue';
import PaymentShipment from './PaymentShipment.vue';
import type { Payment } from './types';

const props = defineProps<{
  payment: Payment;
  currentUserId: string;
  /** Paiement visé par un lien de notification : mis en avant. */
  focused: boolean;
}>();

const emit = defineEmits<{ markDelivered: [payment: Payment] }>();

const productTitle = computed(() => props.payment.product?.title || 'Produit supprimé');
const productImage = computed(() => props.payment.product?.images?.[0] || null);
</script>
