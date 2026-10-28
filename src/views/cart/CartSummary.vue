<template>
  <div class="cart-summary">
    <div class="cart-summary__row">
      <span>Sous-total articles</span>
      <span class="cart-summary__total">{{ subtotal }}</span>
    </div>
    <p class="cart-summary__note">
      <i class="bi bi-truck" aria-hidden="true"></i> Hors frais de port : ils s'ajoutent à chaque article selon le mode de livraison, choisi à l'étape suivante.
    </p>
    <p class="cart-summary__note">
      <i class="bi bi-info-circle" aria-hidden="true"></i> Un paiement PayPal séparé sera créé par article.
    </p>
  </div>
</template>

<script setup lang="ts">
/** Récapitulatif du panier avant le choix de la livraison. */
defineProps<{
  /** Sous-total déjà formaté dans la devise du panier. */
  subtotal: string;
}>();
</script>

<style lang="scss" scoped>
.cart-summary {
  background: var(--bg-primary); border-radius: 12px;
  border: 1px solid var(--surface-border);
  padding: 1.25rem; margin-top: 1rem;

  &__row {
    display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 600;
  }

  &__total { color: var(--accent-purple); }

  &__note {
    font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.75rem;
    i { margin-right: 0.25rem; }
  }
}
</style>
