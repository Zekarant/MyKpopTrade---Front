<template>
  <div class="cart-page">
    <nav_bar />
    <div class="cart-page__container">
      <h1 class="cart-page__title">
        <i class="bi bi-cart3"></i> Mon panier
        <span v-if="cart && cart.items.length" class="cart-page__count">({{ cart.items.length }})</span>
      </h1>

      <!-- Loading -->
      <div v-if="loading" class="cart-page__loading">
        <div class="cart-page__spinner"></div>
        <p>Chargement du panier...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!cart || cart.items.length === 0" class="cart-page__empty">
        <div class="cart-page__empty-icon">
          <i class="bi bi-cart-x"></i>
        </div>
        <h2>Votre panier est vide</h2>
        <p>Explorez les articles disponibles et ajoutez-les à votre panier.</p>
        <button class="cart-page__btn-explore" @click="$router.push({ name: 'searchList' })">
          <i class="bi bi-search"></i>
          <span>Rechercher des articles</span>
        </button>
      </div>

      <!-- Cart items -->
      <div v-else class="cart-page__content">
        <!-- Validation issues -->
        <div v-if="validationIssues.length > 0" class="cart-page__alerts">
          <div v-for="(issue, idx) in validationIssues" :key="idx" class="cart-page__alert">
            <i class="bi bi-exclamation-triangle"></i> {{ issue }}
          </div>
        </div>

        <!-- Group by seller -->
        <div v-for="(group, sellerId) in groupedItems" :key="sellerId" class="cart-page__seller-group">
          <div class="cart-page__seller-header">
            <i class="bi bi-person-circle"></i>
            <span>Vendeur : <strong>{{ getSellerName(group[0]) }}</strong></span>
            <span class="cart-page__seller-total">{{ formatGroupTotal(group) }}</span>
          </div>

          <div v-for="item in group" :key="item.product._id" class="cart-page__item">
            <div class="cart-page__item-image">
              <img v-if="item.product.images && item.product.images.length" :src="getImageUrl(item.product.images[0])" :alt="item.product.title" @error="onImgError($event)" />
              <div v-else class="cart-page__item-placeholder">
                <i class="bi bi-image"></i>
              </div>
            </div>
            <div class="cart-page__item-info">
              <h3 class="cart-page__item-title">{{ item.product.title }}</h3>
              <div class="cart-page__item-price">{{ item.priceSnapshot }} {{ getCurrencySymbol(item.currencySnapshot) }}</div>
              <div v-if="item.product.price !== item.priceSnapshot" class="cart-page__item-warning">
                <i class="bi bi-exclamation-circle"></i> Prix modifié depuis l'ajout
              </div>
              <div v-if="!item.product.isAvailable || item.product.isSold" class="cart-page__item-unavailable">
                <i class="bi bi-x-circle"></i> Plus disponible
              </div>
            </div>
            <button class="cart-page__item-remove" @click="removeItem(item.product._id)" :disabled="removing === item.product._id">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div class="cart-page__summary">
          <div class="cart-page__summary-row">
            <span>Total</span>
            <span class="cart-page__summary-total">{{ totalFormatted }}</span>
          </div>
          <p class="cart-page__summary-note">
            <i class="bi bi-info-circle"></i> Un paiement PayPal séparé sera créé par vendeur.
          </p>
        </div>

        <!-- Actions -->
        <div class="cart-page__actions">
          <button class="cart-page__btn cart-page__btn--outline" @click="clearAll" :disabled="clearing">
            <i class="bi bi-trash"></i> Vider le panier
          </button>
          <button class="cart-page__btn cart-page__btn--primary" @click="startCheckout" :disabled="checkingOut || validationIssues.length > 0">
            <i class="bi bi-bag-check"></i> {{ checkingOut ? 'Traitement...' : 'Passer commande' }}
          </button>
        </div>
      </div>

      <!-- Checkout shipping modal -->
      <div v-if="showShippingModal" class="cart-page__modal-overlay" @click.self="showShippingModal = false">
        <div class="cart-page__modal">
          <h2 class="cart-page__modal-title">Méthode de livraison</h2>
          <div class="cart-page__shipping-options">
            <label class="cart-page__shipping-option">
              <input type="radio" v-model="shippingMethod" value="national" />
              <i class="bi bi-geo-alt"></i> Nationale
            </label>
            <label class="cart-page__shipping-option">
              <input type="radio" v-model="shippingMethod" value="worldwide" />
              <i class="bi bi-globe"></i> Mondiale
            </label>
            <label class="cart-page__shipping-option">
              <input type="radio" v-model="shippingMethod" value="localPickup" />
              <i class="bi bi-hand-index"></i> Main propre
            </label>
          </div>

          <!-- Address form (if not localPickup) -->
          <div v-if="shippingMethod !== 'localPickup'" class="cart-page__address-form">
            <input v-model="shippingAddress.recipientName" type="text" placeholder="Nom du destinataire" class="cart-page__input" />
            <input v-model="shippingAddress.streetLine1" type="text" placeholder="Adresse ligne 1" class="cart-page__input" />
            <input v-model="shippingAddress.streetLine2" type="text" placeholder="Adresse ligne 2 (optionnel)" class="cart-page__input" />
            <div class="cart-page__input-row">
              <input v-model="shippingAddress.postalCode" type="text" placeholder="Code postal" class="cart-page__input" />
              <input v-model="shippingAddress.city" type="text" placeholder="Ville" class="cart-page__input" />
            </div>
            <input v-model="shippingAddress.country" type="text" placeholder="Pays" class="cart-page__input" />
            <input v-model="shippingAddress.phone" type="text" placeholder="Téléphone (optionnel)" class="cart-page__input" />
          </div>

          <div class="cart-page__modal-actions">
            <button class="cart-page__btn cart-page__btn--outline" @click="showShippingModal = false">Annuler</button>
            <button class="cart-page__btn cart-page__btn--primary" @click="confirmCheckout" :disabled="checkingOut">
              {{ checkingOut ? 'Traitement...' : 'Confirmer & Payer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import nav_bar from '@/components/adherents/nav_bar.vue';
import cartService from '@/services/cart.service';
import type { Cart, CartItem } from '@/services/cart.service';
import { API_URL } from '@/config/api';

export default defineComponent({
  name: 'CartView',
  components: { nav_bar },
  data() {
    return {
      cart: null as Cart | null,
      loading: true,
      removing: '' as string,
      clearing: false,
      checkingOut: false,
      validationIssues: [] as string[],
      showShippingModal: false,
      shippingMethod: 'national' as 'national' | 'worldwide' | 'localPickup',
      shippingAddress: {
        recipientName: '',
        streetLine1: '',
        streetLine2: '',
        postalCode: '',
        city: '',
        country: '',
        phone: ''
      }
    };
  },
  computed: {
    groupedItems(): Record<string, CartItem[]> {
      if (!this.cart) return {};
      const groups: Record<string, CartItem[]> = {};
      for (const item of this.cart.items) {
        const sellerId = item.product.seller || 'unknown';
        if (!groups[sellerId]) groups[sellerId] = [];
        groups[sellerId].push(item);
      }
      return groups;
    },
    totalFormatted(): string {
      if (!this.cart) return '0 €';
      let total = 0;
      for (const item of this.cart.items) {
        total += item.priceSnapshot;
      }
      // Use the currency of the first item as reference
      const currency = this.cart.items[0]?.currencySnapshot || 'EUR';
      return `${total.toFixed(2)} ${this.getCurrencySymbol(currency)}`;
    }
  },
  async mounted() {
    await this.loadCart();
  },
  methods: {
    async loadCart() {
      this.loading = true;
      try {
        this.cart = await cartService.getCart();
        await this.validate();
      } catch (error) {
        console.error('Erreur chargement panier:', error);
      } finally {
        this.loading = false;
      }
    },
    async validate() {
      try {
        const result = await cartService.validateCart();
        this.validationIssues = result.issues || [];
      } catch {
        this.validationIssues = [];
      }
    },
    async removeItem(productId: string) {
      this.removing = productId;
      try {
        this.cart = await cartService.removeItem(productId);
        this.validationIssues = this.validationIssues.filter(i => !i.includes(productId));
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Erreur');
      } finally {
        this.removing = '';
      }
    },
    async clearAll() {
      if (!confirm('Vider tout le panier ?')) return;
      this.clearing = true;
      try {
        await cartService.clearCart();
        this.cart = { _id: '', user: '', items: [], updatedAt: '' };
        this.validationIssues = [];
      } finally {
        this.clearing = false;
      }
    },
    startCheckout() {
      this.showShippingModal = true;
    },
    async confirmCheckout() {
      if (this.shippingMethod !== 'localPickup') {
        if (!this.shippingAddress.recipientName || !this.shippingAddress.streetLine1 || !this.shippingAddress.postalCode || !this.shippingAddress.city) {
          alert('Veuillez remplir les champs d\'adresse obligatoires.');
          return;
        }
      }

      this.checkingOut = true;
      try {
        const payments = await cartService.checkout({
          shippingMethod: this.shippingMethod,
          shippingAddress: this.shippingMethod !== 'localPickup' ? this.shippingAddress : undefined
        });

        this.showShippingModal = false;

        if (payments.length === 1) {
          // Single payment: redirect directly to PayPal
          window.location.href = payments[0].approvalUrl;
        } else {
          // Multiple payments: store remaining with orderIds for cancellation
          localStorage.setItem('pendingPaypalPayments', JSON.stringify(
            payments.slice(1).map((p: any) => ({ approvalUrl: p.approvalUrl, orderId: p.paypalOrderId }))
          ));
          window.location.href = payments[0].approvalUrl;
        }
      } catch (error: any) {
        const msg = error?.response?.data?.message || 'Erreur lors du checkout';
        alert(msg);
      } finally {
        this.checkingOut = false;
      }
    },
    getImageUrl(img: string): string {
      if (img.startsWith('http')) return img;
      return `${API_URL}/uploads/products/${img}`;
    },
    onImgError(event: Event) {
      const img = event.target as HTMLImageElement;
      img.style.display = 'none';
      const parent = img.parentElement;
      if (parent && !parent.querySelector('.cart-page__item-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'cart-page__item-placeholder';
        placeholder.innerHTML = '<i class="bi bi-image"></i>';
        parent.appendChild(placeholder);
      }
    },
    getSellerName(item: CartItem): string {
      return item.product.seller || 'Vendeur';
    },
    getCurrencySymbol(currency: string): string {
      const symbols: Record<string, string> = { EUR: '€', USD: '$', KRW: '₩', JPY: '¥', GBP: '£' };
      return symbols[currency] || currency;
    },
    formatGroupTotal(group: CartItem[]): string {
      const total = group.reduce((sum, item) => sum + item.priceSnapshot, 0);
      const currency = group[0]?.currencySnapshot || 'EUR';
      return `${total.toFixed(2)} ${this.getCurrencySymbol(currency)}`;
    }
  }
});
</script>

<style lang="scss" scoped>
.cart-page {
  min-height: 100vh;
  background: var(--bg-secondary, #f5f5f5);
  padding-top: calc(var(--navbar-height, 64px) + 2rem);

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

    i { color: var(--primary, #7c3aed); }
  }

  &__count {
    font-size: 1rem;
    color: var(--text-secondary, #666);
    font-weight: 400;
  }

  &__loading, &__empty {
    text-align: center;
    padding: 3rem 1rem;

    h2 { margin-bottom: 0.5rem; font-size: 1.4rem; }
    p { color: var(--text-secondary, #666); margin-bottom: 2rem; font-size: 1rem; }
  }

  &__empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(168, 85, 247, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 2.5rem;
      color: var(--primary, #7c3aed);
    }
  }

  &__btn-explore {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2.5rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    i { font-size: 1.1rem; }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(124, 58, 237, 0.45);
    }

    &:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }
  }

  &__spinner {
    width: 40px; height: 40px; margin: 0 auto 1rem;
    border: 4px solid #eee; border-top-color: var(--primary, #7c3aed);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }

  &__alerts { margin-bottom: 1rem; }
  &__alert {
    background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;
    padding: 0.75rem 1rem; margin-bottom: 0.5rem; font-size: 0.875rem;
    i { color: #856404; margin-right: 0.5rem; }
  }

  &__seller-group {
    background: var(--bg-primary, #fff);
    border-radius: 12px;
    border: 1px solid var(--surface-border, #e5e5e5);
    margin-bottom: 1rem;
    overflow: hidden;
  }

  &__seller-header {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 1rem; background: var(--surface-bg, #fafafa);
    border-bottom: 1px solid var(--surface-border, #e5e5e5);
    font-size: 0.875rem;
  }

  &__seller-total {
    margin-left: auto; font-weight: 600; color: var(--primary, #7c3aed);
  }

  &__item {
    display: flex; align-items: center; gap: 1rem;
    padding: 1rem; border-bottom: 1px solid var(--surface-border, #eee);

    &:last-child { border-bottom: none; }
  }

  &__item-image {
    width: 64px; height: 64px; border-radius: 8px; overflow: hidden; flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__item-placeholder {
    width: 100%; height: 100%; background: #eee; display: flex;
    align-items: center; justify-content: center;
    i { font-size: 1.5rem; color: #999; }
  }

  &__item-info { flex: 1; min-width: 0; }

  &__item-title {
    font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  &__item-price { font-weight: 700; color: var(--primary, #7c3aed); }

  &__item-warning { font-size: 0.75rem; color: #d97706; margin-top: 0.25rem; }
  &__item-unavailable { font-size: 0.75rem; color: #dc2626; margin-top: 0.25rem; }

  &__item-remove {
    background: none; border: none; cursor: pointer; padding: 0.5rem;
    color: var(--text-secondary, #999); transition: color 0.2s;
    &:hover { color: #dc2626; }
  }

  &__summary {
    background: var(--bg-primary, #fff); border-radius: 12px;
    border: 1px solid var(--surface-border, #e5e5e5);
    padding: 1.25rem; margin-top: 1rem;
  }

  &__summary-row {
    display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 600;
  }

  &__summary-total { color: var(--primary, #7c3aed); }

  &__summary-note {
    font-size: 0.8rem; color: var(--text-secondary, #666); margin-top: 0.75rem;
    i { margin-right: 0.25rem; }
  }

  &__actions {
    display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;
  }

  &__btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600;
    font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none;

    &--primary {
      background: var(--primary, #7c3aed); color: #fff;
      &:hover:not(:disabled) { filter: brightness(1.1); }
    }

    &--outline {
      background: transparent; border: 1px solid var(--surface-border, #ddd); color: var(--text-primary, #333);
      &:hover:not(:disabled) { background: var(--surface-bg, #f5f5f5); }
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  }

  &__modal {
    background: var(--bg-primary, #fff); border-radius: 16px; padding: 2rem;
    max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
  }

  &__modal-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; }

  &__shipping-options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }

  &__shipping-option {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; border: 1px solid var(--surface-border, #ddd);
    border-radius: 8px; cursor: pointer; transition: border-color 0.2s;

    &:has(input:checked) { border-color: var(--primary, #7c3aed); background: rgba(124, 58, 237, 0.05); }
    input { accent-color: var(--primary, #7c3aed); }
  }

  &__address-form { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }

  &__input {
    padding: 0.75rem 1rem; border: 1px solid var(--surface-border, #ddd);
    border-radius: 8px; font-size: 0.9rem; width: 100%;
    &:focus { outline: none; border-color: var(--primary, #7c3aed); }
  }

  &__input-row { display: flex; gap: 0.75rem; }

  &__modal-actions { display: flex; gap: 1rem; justify-content: flex-end; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
