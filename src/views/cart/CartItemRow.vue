<template>
  <div class="cart-item">
    <div class="cart-item__image">
      <img
        v-if="imageUrl && !imageFailed"
        :src="imageUrl"
        :alt="item.product.title"
        loading="lazy"
        decoding="async"
        @error="imageFailed = true"
      />
      <div v-else class="cart-item__placeholder">
        <i class="bi bi-image" aria-hidden="true"></i>
      </div>
    </div>
    <div class="cart-item__info">
      <h3 class="cart-item__title">{{ item.product.title }}</h3>
      <div class="cart-item__price">
        {{ formatPrice(cartItemPrice(item), item.currencySnapshot) }}
        <span v-if="negotiated" class="cart-item__catalogue-price">{{ formatPrice(item.product.price, item.currencySnapshot) }}</span>
      </div>
      <div v-if="negotiated" class="cart-item__negotiated">
        <i class="bi bi-tag" aria-hidden="true"></i> Prix négocié
      </div>
      <div v-if="item.product.price !== item.priceSnapshot" class="cart-item__warning">
        <i class="bi bi-exclamation-circle" aria-hidden="true"></i> Prix modifié depuis l'ajout
      </div>
      <div v-if="!item.product.isAvailable || item.product.isSold" class="cart-item__unavailable">
        <i class="bi bi-x-circle" aria-hidden="true"></i> Plus disponible
      </div>
    </div>
    <button
      type="button"
      class="cart-item__remove"
      :aria-label="`Retirer « ${item.product.title} » du panier`"
      :disabled="removing"
      @click="emit('remove', item.product._id)"
    >
      <i class="bi bi-trash" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
/** Ligne d'un article du panier : visuel, prix payé et alertes de disponibilité. */
import { computed, ref } from 'vue';
import type { CartItem } from '@/services/cart.service';
import { formatPrice, mediaUrl } from '@/utils/format';
import { cartItemPrice, isNegotiatedPrice } from './cartPricing';

const props = defineProps<{
  item: CartItem;
  removing: boolean;
}>();

const emit = defineEmits<{ remove: [productId: string] }>();

// L'API stocke le chemin complet (« /uploads/products/x.jpg ») : mediaUrl ne
// le préfixe qu'une fois, sinon l'image restait toujours cassée.
const imageUrl = computed(() => mediaUrl(props.item.product.images?.[0]));
// Image supprimée côté serveur : on retombe sur le pictogramme plutôt qu'une icône cassée.
const imageFailed = ref(false);
const negotiated = computed(() => isNegotiatedPrice(props.item));
</script>

<style lang="scss" scoped>
.cart-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem; border-bottom: 1px solid var(--surface-border);

  &:last-child { border-bottom: none; }

  &__image {
    width: 64px; height: 64px; border-radius: 8px; overflow: hidden; flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__placeholder {
    width: 100%; height: 100%; background: var(--bg-tertiary); display: flex;
    align-items: center; justify-content: center;
    i { font-size: 1.5rem; color: var(--text-muted); }
  }

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  &__price { font-weight: 700; color: var(--accent-purple); }

  &__catalogue-price {
    margin-left: 0.4rem; font-weight: 400; font-size: 0.85rem;
    color: var(--text-secondary); text-decoration: line-through;
  }

  &__negotiated { font-size: 0.75rem; color: var(--success); margin-top: 0.25rem; }
  &__warning { font-size: 0.75rem; color: var(--warning); margin-top: 0.25rem; }
  &__unavailable { font-size: 0.75rem; color: var(--danger); margin-top: 0.25rem; }

  &__remove {
    background: none; border: none; cursor: pointer; padding: 0.5rem;
    color: var(--text-secondary); transition: color 0.2s;
    &:hover { color: var(--danger); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}
</style>
