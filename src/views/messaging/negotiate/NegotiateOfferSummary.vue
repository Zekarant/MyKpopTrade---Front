<template>
  <div class="offer-summary">
    <div class="summary-row">
      <span>Votre offre :</span>
      <strong>{{ formatPrice(amount || 0, currency) }}</strong>
    </div>
    <div v-if="savings > 0" class="summary-row">
      <span>Économie :</span>
      <strong class="savings">{{ formatPrice(savings, currency) }} ({{ savingsPercentage }} %)</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatPrice } from '@/utils/format';

const props = defineProps<{
  /** Montant saisi : `v-model.number` laisse la chaîne vide quand le champ est effacé. */
  amount: number | '';
  price: number;
  currency?: string;
}>();

const savings = computed(() =>
  props.amount ? Math.round((props.price - props.amount) * 100) / 100 : 0
);

const savingsPercentage = computed(() =>
  props.amount ? Math.round((savings.value / props.price) * 100) : 0
);
</script>

<style lang="scss" scoped>
.offer-summary {
  background: var(--bg-secondary);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }

  span {
    color: var(--text-secondary);
  }

  strong {
    font-size: 18px;
    color: var(--text-primary);

    &.savings {
      color: var(--success);
    }
  }
}
</style>
