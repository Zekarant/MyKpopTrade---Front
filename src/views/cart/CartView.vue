<template>
  <div class="cart-page">
    <div class="cart-page__container">
      <h1 class="cart-page__title">
        <i class="bi bi-cart3" aria-hidden="true"></i> Mon panier
        <span v-if="items.length" class="cart-page__count">({{ items.length }})</span>
      </h1>

      <div v-if="loading" class="cart-page__loading" role="status">
        <div class="cart-page__spinner" aria-hidden="true"></div>
        <p>Chargement du panier...</p>
      </div>

      <div v-else-if="items.length === 0" class="cart-page__empty">
        <div class="cart-page__empty-icon" aria-hidden="true">
          <i class="bi bi-cart-x"></i>
        </div>
        <h2>Votre panier est vide</h2>
        <p>Explorez les articles disponibles et ajoutez-les à votre panier.</p>
        <RouterLink :to="{ name: 'searchList' }" class="cart-page__btn-explore">
          <i class="bi bi-search" aria-hidden="true"></i>
          <span>Rechercher des articles</span>
        </RouterLink>
      </div>

      <div v-else class="cart-page__content">
        <div v-if="validationIssues.length > 0" class="cart-page__alerts" role="alert">
          <div v-for="(issue, idx) in validationIssues" :key="idx" class="cart-alert">
            <i class="bi bi-exclamation-triangle" aria-hidden="true"></i> {{ issue }}
          </div>
        </div>

        <CartSellerGroup
          v-for="group in sellerGroups"
          :key="group.sellerId"
          :items="group.items"
          :removing-id="removing"
          @remove="removeItem"
        />

        <CartSummary :subtotal="subtotal" />

        <div class="cart-page__actions">
          <button type="button" class="cart-btn cart-btn--outline" :disabled="clearing" @click="clearAll">
            <i class="bi bi-trash" aria-hidden="true"></i> Vider le panier
          </button>
          <button
            type="button"
            class="cart-btn cart-btn--primary"
            :disabled="checkingOut || validationIssues.length > 0"
            @click="showShippingModal = true"
          >
            <i class="bi bi-bag-check" aria-hidden="true"></i> {{ checkingOut ? 'Traitement...' : 'Passer commande' }}
          </button>
        </div>
      </div>

      <CartShippingDialog
        v-if="showShippingModal"
        :items="items"
        :currency="currency"
        :submitting="checkingOut"
        @cancel="showShippingModal = false"
        @confirm="confirmCheckout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Page panier : articles groupés par vendeur, puis paiement PayPal article par article. */
import { computed, onMounted, ref, watch } from 'vue';
import { apiErrorMessage } from '@/services/apiError';
import cartService, { type Cart } from '@/services/cart.service';
import { useCartStore } from '@/store/cart.store';
import { func } from '@/function';
import { formatPrice } from '@/utils/format';
import paymentService from '@/services/payment.service';
import { cancelPendingPayments, savePendingPayments } from '@/views/payment/pendingPayments';
import { redirectToPayPal } from '@/views/payment/paypalUrl';
import { groupCartItemsBySeller, sumCartItems } from './cartPricing';
import CartSellerGroup from './CartSellerGroup.vue';
import CartSummary from './CartSummary.vue';
import CartShippingDialog, { type CartCheckoutPayload } from './CartShippingDialog.vue';

const cartStore = useCartStore();

const cart = ref<Cart | null>(null);
const loading = ref(true);
const removing = ref('');
const clearing = ref(false);
const checkingOut = ref(false);
const validationIssues = ref<string[]>([]);
const showShippingModal = ref(false);

const items = computed(() => cart.value?.items ?? []);
const sellerGroups = computed(() => groupCartItemsBySeller(items.value));
/** Devise du premier article, prise comme référence du panier. */
const currency = computed(() => items.value[0]?.currencySnapshot || 'EUR');
const subtotal = computed(() => formatPrice(sumCartItems(items.value), currency.value));

// Retrait, vidage ou rechargement : le badge de la barre de navigation suit.
watch(cart, (value) => {
  if (value) cartStore.setCount(value.items.length);
});

onMounted(loadCart);

async function loadCart() {
  loading.value = true;
  try {
    cart.value = await cartService.getCart();
    await validate();
  } catch (error) {
    console.error('Erreur chargement panier:', error);
  } finally {
    loading.value = false;
  }
}

async function validate() {
  try {
    const result = await cartService.validateCart();
    validationIssues.value = result.issues || [];
  } catch {
    validationIssues.value = [];
  }
}

async function removeItem(productId: string) {
  removing.value = productId;
  try {
    cart.value = await cartService.removeItem(productId);
    validationIssues.value = validationIssues.value.filter((issue) => !issue.includes(productId));
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Erreur lors du retrait de l\'article.'));
  } finally {
    removing.value = '';
  }
}

async function clearAll() {
  if (!confirm('Vider tout le panier ?')) return;
  clearing.value = true;
  try {
    await cartService.clearCart();
    cart.value = { _id: '', user: '', items: [], updatedAt: '' };
    validationIssues.value = [];
  } catch (error) {
    // Sans ce retour, l'échec passait inaperçu (rejet non géré) et le panier semblait intact sans explication.
    func.showToastError(apiErrorMessage(error, 'Erreur lors du vidage du panier.'));
  } finally {
    clearing.value = false;
  }
}

async function confirmCheckout(payload: CartCheckoutPayload) {
  checkingOut.value = true;
  try {
    const payments = await cartService.checkout(payload);
    showShippingModal.value = false;

    // Un ordre PayPal par produit : les suivants sont approuvés depuis
    // success.vue, ou annulés par cancel.vue grâce à leur paypalOrderId.
    savePendingPayments(payments.slice(1));
    if (!redirectToPayPal(payments[0]?.approvalUrl)) {
      // Lien qui ne mène pas à PayPal : aucun ordre ne doit rester en attente.
      savePendingPayments(payments);
      await cancelPendingPayments((orderId) => paymentService.cancelPayPal(orderId));
      func.showToastError('Erreur lors de l\'initialisation du paiement. Veuillez réessayer.');
    }
  } catch (error) {
    func.showToastError(apiErrorMessage(error, 'Erreur lors de la validation du panier.'));
  } finally {
    checkingOut.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use './cart-shared';

.cart-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding-top: calc(var(--navbar-height) + 2rem);

  &__container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i { color: var(--accent-purple); }
  }

  &__count {
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  &__loading, &__empty {
    text-align: center;
    padding: 3rem 1rem;

    h2 { margin-bottom: 0.5rem; font-size: 1.4rem; }
    p { color: var(--text-secondary); margin-bottom: 2rem; font-size: 1rem; }
  }

  &__empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    border-radius: 50%;
    background: var(--accent-gradient-subtle);
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 2.5rem;
      color: var(--accent-purple);
    }
  }

  &__btn-explore {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2.5rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-on-accent);
    background: var(--accent-gradient);
    border-radius: 50px;
    box-shadow: var(--shadow-glow-purple);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    i { font-size: 1.1rem; }

    &:hover {
      color: var(--text-on-accent);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    &:active { transform: translateY(-1px); }
  }

  &__spinner {
    width: 40px; height: 40px; margin: 0 auto 1rem;
    border: 4px solid var(--surface-border); border-top-color: var(--accent-purple);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }

  &__alerts { margin-bottom: 1rem; }

  &__actions {
    display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;
  }
}
</style>
