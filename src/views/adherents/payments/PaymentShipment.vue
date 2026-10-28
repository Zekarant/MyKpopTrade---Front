<template>
  <div class="payment-card__shipment">
    <div class="payment-card__shipment-head">
      <i class="bi bi-truck"></i>
      <div class="shipment-summary">
        <div><strong>{{ shipment.carrier }}</strong> — {{ shipment.trackingNumber }}</div>
        <small>
          {{ shipment.status === 'delivered'
            ? 'Livré le ' + formatDate(shipment.deliveredAt)
            : 'Expédié le ' + formatDate(shipment.shippedAt) }}
          <template v-if="shipment.status !== 'delivered' && shipment.estimatedDeliveryAt">
            · Livraison estimée le {{ formatDate(shipment.estimatedDeliveryAt) }}
          </template>
          <template v-if="shipment.autoConfirmedAt">
            · <em>auto-confirmée</em>
          </template>
        </small>
      </div>
      <a v-if="shipment.trackingUrl" :href="shipment.trackingUrl" target="_blank" rel="noopener" class="btn-link">
        Suivre <i class="bi bi-box-arrow-up-right"></i>
      </a>
    </div>

    <ShipmentTimeline :events="shipment.events ?? []" />
  </div>
</template>

<script setup lang="ts">
/** Expédition d'un paiement : transporteur, dates et suivi détaillé. */
import { formatDate } from '@/utils/format';
import ShipmentTimeline from './ShipmentTimeline.vue';
import type { Shipment } from './types';

defineProps<{ shipment: Shipment }>();
</script>
