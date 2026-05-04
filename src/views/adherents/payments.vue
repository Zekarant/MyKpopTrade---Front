<template>
  <main class="page">
    <Nav_bar />
    <div class="payments-page">
      <div class="payments-page__container">
        <div class="payments-page__header">
          <h1 class="payments-page__title">Mes paiements</h1>
        </div>

        <div class="tabs">
          <button :class="['tab', { 'tab--active': role === 'all' }]" @click="setRole('all')">Tous</button>
          <button :class="['tab', { 'tab--active': role === 'buyer' }]" @click="setRole('buyer')">Achats</button>
          <button :class="['tab', { 'tab--active': role === 'seller' }]" @click="setRole('seller')">Ventes</button>
        </div>

        <div v-if="loading" class="empty">
          <i class="bi bi-arrow-clockwise spin"></i> Chargement…
        </div>

        <div v-else-if="payments.length === 0" class="empty">
          <i class="bi bi-receipt"></i>
          <p>Aucun paiement {{ role === 'buyer' ? 'd\'achat' : role === 'seller' ? 'de vente' : '' }} pour le moment.</p>
        </div>

        <div v-else class="payments-list">
          <article v-for="p in payments" :key="p._id" class="payment-card">
            <div class="payment-card__head">
              <div class="payment-card__product">
                <img v-if="getProductImage(p)" :src="absUrl(getProductImage(p))" :alt="getProductTitle(p)" />
                <div class="payment-card__product-info">
                  <strong>{{ getProductTitle(p) }}</strong>
                  <small>{{ formatDate(p.createdAt) }}</small>
                </div>
              </div>
              <div class="payment-card__amount">
                <span class="payment-card__price">{{ formatAmount(p.amount, p.currency) }}</span>
                <span :class="['status-badge', `status-badge--${p.status}`]">{{ statusLabel(p.status) }}</span>
              </div>
            </div>

            <div v-if="p.shipment" class="payment-card__shipment">
              <i class="bi bi-truck"></i>
              <div>
                <div><strong>{{ p.shipment.carrier }}</strong> — {{ p.shipment.trackingNumber }}</div>
                <small>
                  {{ p.shipment.status === 'delivered' ? 'Livré le ' + formatDate(p.shipment.deliveredAt) : 'Expédié le ' + formatDate(p.shipment.shippedAt) }}
                </small>
              </div>
              <a v-if="p.shipment.trackingUrl" :href="p.shipment.trackingUrl" target="_blank" rel="noopener" class="btn-link">
                Suivre <i class="bi bi-box-arrow-up-right"></i>
              </a>
            </div>

            <div class="payment-card__actions">
              <button v-if="canCreateShipment(p)" class="btn btn--primary btn--sm" @click="openShipmentModal(p)">
                <i class="bi bi-truck"></i> Saisir l'expédition
              </button>
              <button v-if="canMarkDelivered(p)" class="btn btn--ghost btn--sm" @click="markDelivered(p)">
                <i class="bi bi-check2-circle"></i> Marquer livré
              </button>
              <button v-if="canRefund(p)" class="btn btn--danger btn--sm" @click="openRefundModal(p)">
                <i class="bi bi-arrow-counterclockwise"></i> Rembourser l'acheteur
              </button>
            </div>
          </article>

          <div v-if="pagination && pagination.pages > 1" class="pager">
            <button class="btn btn--ghost btn--sm" :disabled="page <= 1" @click="changePage(page - 1)">Précédent</button>
            <span>Page {{ page }} / {{ pagination.pages }}</span>
            <button class="btn btn--ghost btn--sm" :disabled="page >= pagination.pages" @click="changePage(page + 1)">Suivant</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shipment modal -->
    <div v-if="shipmentModal.open" class="modal-overlay" @click.self="closeShipmentModal">
      <div class="modal-card">
        <h2><i class="bi bi-truck"></i> Saisir l'expédition</h2>
        <p class="modal-subtitle">Renseignez le transporteur et le numéro de suivi.</p>

        <label>Transporteur</label>
        <input v-model="shipmentModal.carrier" type="text" placeholder="La Poste, Mondial Relay, Colissimo…" />

        <label>Numéro de suivi</label>
        <input v-model="shipmentModal.trackingNumber" type="text" placeholder="N° de tracking" />

        <label>URL de suivi (optionnel)</label>
        <input v-model="shipmentModal.trackingUrl" type="url" placeholder="https://…" />

        <div class="modal-actions">
          <button class="btn btn--ghost" @click="closeShipmentModal">Annuler</button>
          <button class="btn btn--primary" :disabled="!shipmentModal.carrier || !shipmentModal.trackingNumber" @click="submitShipment">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Refund modal -->
    <div v-if="refundModal.open" class="modal-overlay" @click.self="closeRefundModal">
      <div class="modal-card">
        <h2><i class="bi bi-arrow-counterclockwise"></i> Rembourser l'acheteur</h2>
        <p class="modal-subtitle">L'acheteur sera remboursé via PayPal et notifié automatiquement.</p>

        <label>Raison</label>
        <textarea v-model="refundModal.reason" rows="3" placeholder="Pourquoi remboursez-vous ?"></textarea>

        <label>Montant (laisser vide pour remboursement total)</label>
        <input v-model.number="refundModal.amount" type="number" min="0" step="0.01" placeholder="Montant" />

        <label>Mot de passe (confirmation)</label>
        <input v-model="refundModal.password" type="password" placeholder="Votre mot de passe" />

        <div class="modal-actions">
          <button class="btn btn--ghost" @click="closeRefundModal">Annuler</button>
          <button class="btn btn--danger" :disabled="!refundModal.reason || !refundModal.password" @click="submitRefund">Confirmer le remboursement</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Cookies from 'js-cookie';
import Nav_bar from '@/components/adherents/nav_bar.vue';
import paymentService from '@/services/payment.service';
import { API_URL } from '@/config/api';

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
  createdAt: string;
  product: any;
  buyer: string | { _id: string };
  seller: string | { _id: string };
  shipment?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    status: 'shipped' | 'delivered';
    shippedAt: string;
    deliveredAt?: string;
  };
}

export default defineComponent({
  name: 'PaymentsPage',
  components: { Nav_bar },
  data() {
    return {
      payments: [] as Payment[],
      pagination: null as { page: number; pages: number; total: number; limit: number } | null,
      role: 'all' as 'all' | 'buyer' | 'seller',
      page: 1,
      limit: 10,
      loading: false,
      currentUserId: Cookies.get('id_user') || '',
      shipmentModal: {
        open: false,
        paymentId: '',
        carrier: '',
        trackingNumber: '',
        trackingUrl: '',
      },
      refundModal: {
        open: false,
        paymentId: '',
        reason: '',
        amount: undefined as number | undefined,
        password: '',
      },
    };
  },
  async mounted() {
    await this.fetchPayments();
  },
  methods: {
    async fetchPayments() {
      this.loading = true;
      try {
        const res = await paymentService.getMyPayments({ role: this.role, page: this.page, limit: this.limit });
        this.payments = res.data || [];
        this.pagination = res.pagination || null;
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur de chargement');
      } finally {
        this.loading = false;
      }
    },
    setRole(role: 'all' | 'buyer' | 'seller') {
      if (this.role === role) return;
      this.role = role;
      this.page = 1;
      this.fetchPayments();
    },
    changePage(page: number) {
      this.page = page;
      this.fetchPayments();
    },
    isSeller(p: Payment): boolean {
      const sellerId = typeof p.seller === 'string' ? p.seller : p.seller?._id;
      return sellerId === this.currentUserId;
    },
    isBuyer(p: Payment): boolean {
      const buyerId = typeof p.buyer === 'string' ? p.buyer : p.buyer?._id;
      return buyerId === this.currentUserId;
    },
    canCreateShipment(p: Payment): boolean {
      return this.isSeller(p) && p.status === 'completed' && !p.shipment;
    },
    canMarkDelivered(p: Payment): boolean {
      return this.isSeller(p) && !!p.shipment && p.shipment.status === 'shipped';
    },
    canRefund(p: Payment): boolean {
      return this.isSeller(p) && p.status === 'completed';
    },
    getProductTitle(p: Payment): string {
      return p.product?.title || 'Produit supprimé';
    },
    getProductImage(p: Payment): string | null {
      const img = p.product?.images?.[0];
      return img || null;
    },
    absUrl(url: string): string {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${API_URL}${url}`;
    },
    formatAmount(amount: number, currency = 'EUR'): string {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
    },
    formatDate(iso?: string): string {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    statusLabel(status: Payment['status']): string {
      switch (status) {
        case 'pending': return 'En attente';
        case 'completed': return 'Payé';
        case 'failed': return 'Échec';
        case 'refunded': return 'Remboursé';
        case 'partially_refunded': return 'Remboursé (partiel)';
        case 'cancelled': return 'Annulé';
        default: return status;
      }
    },
    openShipmentModal(p: Payment) {
      this.shipmentModal = { open: true, paymentId: p._id, carrier: '', trackingNumber: '', trackingUrl: '' };
    },
    closeShipmentModal() {
      this.shipmentModal.open = false;
    },
    async submitShipment() {
      try {
        await paymentService.createShipment(this.shipmentModal.paymentId, {
          carrier: this.shipmentModal.carrier,
          trackingNumber: this.shipmentModal.trackingNumber,
          ...(this.shipmentModal.trackingUrl ? { trackingUrl: this.shipmentModal.trackingUrl } as any : {}),
        });
        (this as any).$func.showToastSuccess('Expédition enregistrée');
        this.closeShipmentModal();
        await this.fetchPayments();
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async markDelivered(p: Payment) {
      if (!confirm('Confirmer la livraison de ce colis ?')) return;
      try {
        await paymentService.markShipmentDelivered(p._id);
        (this as any).$func.showToastSuccess('Marqué comme livré');
        await this.fetchPayments();
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    openRefundModal(p: Payment) {
      this.refundModal = { open: true, paymentId: p._id, reason: '', amount: undefined, password: '' };
    },
    closeRefundModal() {
      this.refundModal.open = false;
    },
    async submitRefund() {
      try {
        const payload: { reason: string; amount?: number; password: string } = {
          reason: this.refundModal.reason,
          password: this.refundModal.password,
        };
        if (this.refundModal.amount && this.refundModal.amount > 0) payload.amount = this.refundModal.amount;
        await paymentService.refundPayment(this.refundModal.paymentId, payload);
        (this as any).$func.showToastSuccess('Demande de remboursement envoyée');
        this.closeRefundModal();
        await this.fetchPayments();
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.payments-page {
  padding: var(--space-xl) var(--space-md);
  padding-top: calc(var(--navbar-height) + var(--space-xl));
  min-height: 100vh;
  background: var(--bg-primary);
}
.payments-page__container { max-width: 880px; margin: 0 auto; }
.payments-page__title { font-size: var(--font-size-2xl); font-weight: 700; margin: 0 0 var(--space-lg); }

.tabs { display: flex; gap: var(--space-sm); margin-bottom: var(--space-lg); }
.tab {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  &:hover { background: var(--surface-hover); }
  &--active { background: var(--accent-pink); color: white; border-color: var(--accent-pink); }
}

.empty {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  color: var(--text-muted);
  i { font-size: 2rem; display: block; margin-bottom: var(--space-md); }
  .spin { animation: spin 1s linear infinite; }
}
@keyframes spin { to { transform: rotate(360deg); } }

.payments-list { display: flex; flex-direction: column; gap: var(--space-md); }

.payment-card {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.payment-card__head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-md); flex-wrap: wrap; }
.payment-card__product { display: flex; align-items: center; gap: var(--space-md); min-width: 0; flex: 1; }
.payment-card__product img { width: 56px; height: 56px; border-radius: var(--radius-md); object-fit: cover; }
.payment-card__product-info { display: flex; flex-direction: column; min-width: 0;
  strong { color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  small { color: var(--text-muted); font-size: var(--font-size-xs); }
}
.payment-card__amount { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.payment-card__price { font-weight: 700; color: var(--accent-pink); font-size: var(--font-size-lg); }

.status-badge { font-size: var(--font-size-xs); font-weight: 600; padding: 3px 10px; border-radius: 20px;
  &--pending { background: rgba(255,193,7,.15); color: #e0a800; }
  &--completed { background: rgba(40,167,69,.15); color: #28a745; }
  &--failed, &--cancelled { background: rgba(220,53,69,.15); color: #dc3545; }
  &--refunded, &--partially_refunded { background: rgba(108,117,125,.15); color: #6c757d; }
}

.payment-card__shipment {
  display: flex; align-items: center; gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  i { color: var(--accent-pink); font-size: 1.25rem; }
  > div { flex: 1; small { color: var(--text-muted); display: block; } }
}

.payment-card__actions { display: flex; gap: var(--space-sm); flex-wrap: wrap; }

.btn {
  display: inline-flex; align-items: center; gap: var(--space-xs);
  padding: 8px 16px; border-radius: var(--radius-md); border: none;
  font-size: var(--font-size-sm); font-weight: 600; cursor: pointer;
  transition: all var(--transition-fast);
  &--sm { padding: 6px 12px; font-size: var(--font-size-xs); }
  &--primary { background: var(--accent-gradient); color: white; }
  &--ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--surface-border);
    &:hover { background: var(--surface-hover); } }
  &--danger { background: #dc3545; color: white; &:hover { background: #c82333; } }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-link { color: var(--accent-pink); text-decoration: none; font-size: var(--font-size-sm); &:hover { text-decoration: underline; } }

.pager { display: flex; justify-content: center; align-items: center; gap: var(--space-md); padding: var(--space-lg); }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: var(--bg-card); border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg); padding: var(--space-xl);
  width: 90%; max-width: 480px;
  h2 { margin: 0 0 var(--space-sm); font-size: var(--font-size-xl); }
  .modal-subtitle { color: var(--text-muted); margin-bottom: var(--space-lg); font-size: var(--font-size-sm); }
  label { display: block; font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-xs); margin-top: var(--space-md); }
  input, textarea {
    width: 100%; padding: 10px 14px; border: 1px solid var(--surface-border);
    border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary);
    font-size: var(--font-size-sm); font-family: inherit;
    &:focus { outline: none; border-color: var(--accent-pink); }
  }
  textarea { resize: vertical; min-height: 70px; }
}
.modal-actions { display: flex; gap: var(--space-sm); justify-content: flex-end; margin-top: var(--space-lg); }

@media (max-width: 640px) {
  .payments-page { padding: var(--space-md) var(--space-sm); padding-top: calc(var(--navbar-height) + var(--space-md)); }
  .payment-card__head { flex-direction: column; align-items: stretch; }
  .payment-card__amount { align-items: flex-start; }
}
</style>
