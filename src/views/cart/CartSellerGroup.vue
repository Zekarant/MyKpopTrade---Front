<template>
  <section class="cart-seller-group" :aria-label="`Articles de ${sellerName}`">
    <div class="cart-seller-group__header">
      <i class="bi bi-person-circle" aria-hidden="true"></i>
      <span>Vendeur : <strong>{{ sellerName }}</strong></span>
      <span class="cart-seller-group__total">{{ total }}</span>
    </div>

    <CartItemRow
      v-for="item in items"
      :key="item.product._id"
      :item="item"
      :removing="removingId === item.product._id"
      @remove="emit('remove', $event)"
    />
  </section>
</template>

<script setup lang="ts">
/** Articles d'un même vendeur, avec leur sous-total. */
import { computed } from 'vue';
import type { CartItem } from '@/services/cart.service';
import { formatPrice } from '@/utils/format';
import { sumCartItems } from './cartPricing';
import CartItemRow from './CartItemRow.vue';

const props = defineProps<{
  items: CartItem[];
  /** Article en cours de retrait : son bouton reste désactivé jusqu'à la réponse. */
  removingId: string;
}>();

const emit = defineEmits<{ remove: [productId: string] }>();

const sellerName = computed(() => {
  const username = props.items[0]?.product.sellerUsername;
  return username ? `@${username}` : 'Vendeur inconnu';
});

const total = computed(() => formatPrice(sumCartItems(props.items), props.items[0]?.currencySnapshot || 'EUR'));
</script>

<style lang="scss" scoped>
.cart-seller-group {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  margin-bottom: 1rem;
  overflow: hidden;

  &__header {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 1rem; background: var(--bg-secondary);
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.875rem;
  }

  &__total {
    margin-left: auto; font-weight: 600; color: var(--accent-purple);
  }
}
</style>
