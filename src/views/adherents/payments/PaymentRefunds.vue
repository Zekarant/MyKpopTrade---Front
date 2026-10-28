<template>
  <div v-if="completed.length" class="refund-block">
    <div class="refund-block__head">
      <i class="bi bi-arrow-counterclockwise"></i>
      <span>{{ completed.length > 1 ? 'Remboursements' : 'Remboursement' }}</span>
    </div>

    <ul class="refund-list">
      <li v-for="refund in completed" :key="refund.refundId" class="refund-item">
        <div class="refund-item__main">
          <span class="refund-item__amount">− {{ formatPrice(refund.amount, refund.currency || payment.currency) }}</span>
          <small>{{ formatDateTime(refund.settledAt || refund.initiatedAt) }}</small>
        </div>
        <div v-if="refund.reason" class="refund-item__reason">{{ refund.reason }}</div>
      </li>
    </ul>

    <div class="refund-block__totals">
      <div class="refund-block__row">
        <span>Total remboursé</span>
        <strong>{{ formatCents(refundedCents(payment)) }}</strong>
      </div>
      <div v-if="refundableCents(payment) > 0" class="refund-block__row refund-block__row--muted">
        <span>Restant remboursable</span>
        <strong>{{ formatCents(refundableCents(payment)) }}</strong>
      </div>
      <div class="refund-block__row refund-block__row--net">
        <span>{{ viewerIsSeller ? 'Net encaissé' : 'Reste à votre charge' }}</span>
        <strong>{{ formatCents(netCents(payment)) }}</strong>
      </div>
    </div>
  </div>

  <!-- Remboursements non aboutis : absents du bloc ci-dessus, qui ne
       totalise que les montants réellement rendus. -->
  <div v-if="unsettled.length" class="payment-card__refunds">
    <div v-for="refund in unsettled" :key="refund.refundId">
      <span v-if="refund.status === 'pending'" class="refund-badge refund-badge--pending">
        <i class="bi bi-hourglass-split"></i> Remboursement en cours
      </span>
      <span v-else class="refund-badge refund-badge--failed">
        <i class="bi bi-x-circle"></i> Remboursement échoué
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Remboursements d'un paiement : détail, totaux, et badges des demandes non abouties. */
import { computed } from 'vue';
import { formatDateTime, formatPrice } from '@/utils/format';
import { fromCents } from '@/utils/money';
import { completedRefunds, netCents, refundableCents, refundedCents, unsettledRefunds } from './paymentRules';
import type { Payment } from './types';

const props = defineProps<{
  payment: Payment;
  viewerIsSeller: boolean;
}>();

const completed = computed(() => completedRefunds(props.payment));
const unsettled = computed(() => unsettledRefunds(props.payment));

const formatCents = (cents: number) => formatPrice(fromCents(cents), props.payment.currency);
</script>
