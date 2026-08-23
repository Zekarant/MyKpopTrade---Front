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

            <!-- Détail du montant : évite que l'acheteur prenne les frais de
                 port pour des frais de service. -->
            <div v-if="p.shippingAmount" class="payment-breakdown">
              <div class="payment-breakdown__row">
                <span>Article</span>
                <span>{{ formatAmount(p.productAmount || 0, p.currency) }}</span>
              </div>
              <div class="payment-breakdown__row">
                <span>Frais de port</span>
                <span>{{ formatAmount(p.shippingAmount, p.currency) }}</span>
              </div>
              <div class="payment-breakdown__row payment-breakdown__row--total">
                <span>Total payé</span>
                <span>{{ formatAmount(p.amount, p.currency) }}</span>
              </div>
            </div>

            <div v-if="completedRefunds(p).length" class="refund-block">
              <div class="refund-block__head">
                <i class="bi bi-arrow-counterclockwise"></i>
                <span>{{ completedRefunds(p).length > 1 ? 'Remboursements' : 'Remboursement' }}</span>
              </div>

              <ul class="refund-list">
                <li v-for="r in completedRefunds(p)" :key="r.refundId" class="refund-item">
                  <div class="refund-item__main">
                    <span class="refund-item__amount">− {{ formatAmount(r.amount, r.currency || p.currency) }}</span>
                    <small>{{ formatDateTime(r.settledAt || r.initiatedAt) }}</small>
                  </div>
                  <div v-if="r.reason" class="refund-item__reason">{{ r.reason }}</div>
                </li>
              </ul>

              <div class="refund-block__totals">
                <div class="refund-block__row">
                  <span>Total remboursé</span>
                  <strong>{{ formatAmount(refundedAmount(p), p.currency) }}</strong>
                </div>
                <div v-if="refundableAmount(p) > 0.005" class="refund-block__row refund-block__row--muted">
                  <span>Restant remboursable</span>
                  <strong>{{ formatAmount(refundableAmount(p), p.currency) }}</strong>
                </div>
                <div class="refund-block__row refund-block__row--net">
                  <span>{{ isSeller(p) ? 'Net encaissé' : 'Reste à votre charge' }}</span>
                  <strong>{{ formatAmount(p.amount - refundedAmount(p), p.currency) }}</strong>
                </div>
              </div>
            </div>

            <!-- Remboursements non aboutis : absents du bloc ci-dessus, qui ne
                 totalise que les montants réellement rendus. -->
            <div v-if="unsettledRefunds(p).length" class="payment-card__refunds">
              <div v-for="r in unsettledRefunds(p)" :key="r.refundId">
                <span v-if="r.status === 'pending'" class="refund-badge refund-badge--pending">
                  <i class="bi bi-hourglass-split"></i> Remboursement en cours
                </span>
                <span v-else class="refund-badge refund-badge--failed">
                  <i class="bi bi-x-circle"></i> Remboursement échoué
                </span>
              </div>
            </div>

            <div v-if="p.shipment" class="payment-card__shipment">
              <div class="payment-card__shipment-head">
                <i class="bi bi-truck"></i>
                <div class="shipment-summary">
                  <div><strong>{{ p.shipment.carrier }}</strong> — {{ p.shipment.trackingNumber }}</div>
                  <small>
                    {{ p.shipment.status === 'delivered'
                      ? 'Livré le ' + formatDate(p.shipment.deliveredAt)
                      : 'Expédié le ' + formatDate(p.shipment.shippedAt) }}
                    <template v-if="p.shipment.status !== 'delivered' && p.shipment.estimatedDeliveryAt">
                      · Livraison estimée le {{ formatDate(p.shipment.estimatedDeliveryAt) }}
                    </template>
                    <template v-if="p.shipment.autoConfirmedAt">
                      · <em>auto-confirmée</em>
                    </template>
                  </small>
                </div>
                <a v-if="p.shipment.trackingUrl" :href="p.shipment.trackingUrl" target="_blank" rel="noopener" class="btn-link">
                  Suivre <i class="bi bi-box-arrow-up-right"></i>
                </a>
              </div>

              <ol v-if="getTimeline(p).length" class="shipment-timeline">
                <li v-for="(ev, i) in getTimeline(p)" :key="i" :class="['timeline-item', `timeline-item--${ev.status}`]">
                  <span class="timeline-dot"><i :class="timelineIcon(ev.status)"></i></span>
                  <div class="timeline-body">
                    <div class="timeline-title">{{ timelineLabel(ev.status) }}</div>
                    <div v-if="ev.description" class="timeline-desc">{{ ev.description }}</div>
                    <small>
                      {{ formatDateTime(ev.occurredAt) }}
                      <span v-if="ev.location"> · {{ ev.location }}</span>
                      <span class="timeline-source">· {{ sourceLabel(ev.source) }}</span>
                    </small>
                  </div>
                </li>
              </ol>
            </div>

            <div class="payment-card__actions">
              <button v-if="canMarkDelivered(p)" class="btn btn--ghost btn--sm" @click="markDelivered(p)">
                <i class="bi bi-check2-circle"></i> Marquer livré
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

    <!-- Dispute modal -->
    <div v-if="disputeModal.open" class="modal-overlay" @click.self="closeDisputeModal">
      <div class="modal-card">
        <h2><i class="bi bi-shield-exclamation"></i> Ouvrir un litige</h2>
        <p class="modal-subtitle">Décrivez précisément le problème. L'autre partie sera notifiée.</p>

        <label>Motif</label>
        <select v-model="disputeModal.reason">
          <option v-for="r in disputeReasons" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>

        <label>Description (max 2000 caractères)</label>
        <textarea v-model="disputeModal.description" rows="5" maxlength="2000" placeholder="Donnez tous les détails utiles..."></textarea>

        <div class="modal-actions">
          <button class="btn btn--ghost" @click="closeDisputeModal">Annuler</button>
          <button class="btn btn--danger" :disabled="!disputeModal.description.trim()" @click="submitDispute">
            Ouvrir le litige
          </button>
        </div>
      </div>
    </div>

    <!-- Refund modal -->
    <div v-if="refundModal.open" class="modal-overlay" @click.self="closeRefundModal">
      <div class="modal-card">
        <h2><i class="bi bi-arrow-counterclockwise"></i> Rembourser l'acheteur</h2>
        <p class="modal-subtitle">L'acheteur sera remboursé via PayPal et notifié automatiquement.</p>

        <p class="modal-info">
          Restant remboursable : <strong>{{ formatAmount(refundModal.maxAmount, refundModal.currency) }}</strong>
        </p>

        <label>Raison</label>
        <textarea v-model="refundModal.reason" rows="3" placeholder="Pourquoi remboursez-vous ?"></textarea>

        <label>Montant (laisser vide pour rembourser le restant : {{ formatAmount(refundModal.maxAmount, refundModal.currency) }})</label>
        <input v-model.number="refundModal.amount" type="number" min="0.01" :max="refundModal.maxAmount" step="0.01" :placeholder="`max ${refundModal.maxAmount}`" />
        <small v-if="refundAmountError" class="modal-error">{{ refundAmountError }}</small>

        <label>Mot de passe (confirmation)</label>
        <input v-model="refundModal.password" type="password" placeholder="Votre mot de passe" />

        <div class="modal-actions">
          <button class="btn btn--ghost" @click="closeRefundModal">Annuler</button>
          <button class="btn btn--danger" :disabled="!canSubmitRefund" @click="submitRefund">Confirmer le remboursement</button>
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
import disputeService, { type DisputeReason } from '@/services/dispute.service';
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
  productAmount?: number;
  shippingAmount?: number;
  totalRefunded?: number;
  refunds?: Refund[];
  shipment?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    status: 'shipped' | 'delivered';
    shippedAt: string;
    deliveredAt?: string;
    estimatedDeliveryAt?: string;
    autoConfirmedAt?: string;
    events?: ShipmentEvent[];
  };
}

interface Refund {
  refundId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'completed' | 'failed';
  initiatedAt: string;
  settledAt?: string;
}

interface ShipmentEvent {
  status: string;
  description?: string;
  location?: string;
  occurredAt: string;
  source: 'system' | 'seller' | 'buyer' | 'carrier';
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
        currency: 'EUR',
        maxAmount: 0,
      },
      disputeModal: {
        open: false,
        paymentId: '',
        reason: 'not_received' as DisputeReason,
        description: ''
      },
      disputeReasons: [
        { value: 'not_received', label: 'Colis non reçu' },
        { value: 'damaged', label: 'Colis endommagé' },
        { value: 'not_as_described', label: 'Produit non conforme à la description' },
        { value: 'counterfeit', label: 'Contrefaçon' },
        { value: 'wrong_item', label: 'Mauvais article' },
        { value: 'partial_delivery', label: 'Livraison partielle' },
        { value: 'seller_unresponsive', label: 'Vendeur ne répond pas' },
        { value: 'buyer_abuse', label: 'Comportement abusif de l\'acheteur' },
        { value: 'other', label: 'Autre' }
      ] as { value: DisputeReason; label: string }[],
    };
  },
  async mounted() {
    await this.fetchPayments();
  },
  computed: {
    refundAmountError(): string {
      const a = this.refundModal.amount;
      if (a === undefined || a === null || a === ('' as any)) return '';
      if (typeof a !== 'number' || !isFinite(a) || a <= 0) return 'Montant invalide';
      if (a > this.refundModal.maxAmount + 0.001) {
        return `Le montant dépasse le restant remboursable (${this.refundModal.maxAmount})`;
      }
      return '';
    },
    canSubmitRefund(): boolean {
      return Boolean(
        this.refundModal.reason.trim() &&
        this.refundModal.password &&
        !this.refundAmountError
      );
    },
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
      if (!this.isSeller(p)) return false;
      if (p.status !== 'completed' && p.status !== 'partially_refunded') return false;
      return this.refundableAmount(p) > 0.005;
    },
    /** Remboursements réellement aboutis — les entrées en attente ne comptent pas. */
    completedRefunds(p: Payment): Refund[] {
      return (p.refunds || []).filter((r) => r.status === 'completed');
    },
    /** Remboursements en attente ou échoués — signalés par un simple badge. */
    unsettledRefunds(p: Payment): Refund[] {
      return (p.refunds || []).filter((r) => r.status !== 'completed');
    },
    /**
     * Total remboursé, calculé sur l'historique plutôt que sur `totalRefunded`
     * seul : le back retient la valeur la plus prudente des deux, on fait pareil
     * pour que l'affichage ne contredise jamais le restant remboursable.
     */
    refundedAmount(p: Payment): number {
      const fromHistory = this.completedRefunds(p)
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      return Math.round(Math.max(fromHistory, Number(p.totalRefunded || 0)) * 100) / 100;
    },
    refundableAmount(p: Payment): number {
      return Math.max(0, Math.round((p.amount - this.refundedAmount(p)) * 100) / 100);
    },
    canOpenDispute(p: Payment): boolean {
      // Acheteur ou vendeur d'un paiement complété peut ouvrir un litige
      return (this.isBuyer(p) || this.isSeller(p))
        && (p.status === 'completed' || p.status === 'partially_refunded');
    },
    getProductTitle(p: Payment): string {
      return p.product?.title || 'Produit supprimé';
    },
    getProductImage(p: Payment): string | null {
      const img = p.product?.images?.[0];
      return img || null;
    },
    absUrl(url: string | null): string {
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
    formatDateTime(iso?: string): string {
      if (!iso) return '';
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    },
    getTimeline(p: Payment): ShipmentEvent[] {
      const events = p.shipment?.events ?? [];
      return [...events].sort(
        (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      );
    },
    timelineLabel(status: string): string {
      const labels: Record<string, string> = {
        shipped: 'Expédié',
        in_transit: 'En transit',
        out_for_delivery: 'En cours de livraison',
        delivered: 'Livré',
        exception: 'Anomalie de livraison',
        returned: 'Retourné',
        unknown: 'Mise à jour'
      };
      return labels[status] || status;
    },
    timelineIcon(status: string): string {
      const icons: Record<string, string> = {
        shipped: 'bi bi-box-seam',
        in_transit: 'bi bi-truck',
        out_for_delivery: 'bi bi-geo-alt',
        delivered: 'bi bi-check2-circle',
        exception: 'bi bi-exclamation-triangle',
        returned: 'bi bi-arrow-counterclockwise',
        unknown: 'bi bi-info-circle'
      };
      return icons[status] || 'bi bi-info-circle';
    },
    sourceLabel(source: string): string {
      const labels: Record<string, string> = {
        seller: 'vendeur',
        buyer: 'acheteur',
        carrier: 'transporteur',
        system: 'auto'
      };
      return labels[source] || source;
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
      this.refundModal = {
        open: true,
        paymentId: p._id,
        reason: '',
        amount: undefined,
        password: '',
        currency: p.currency,
        maxAmount: this.refundableAmount(p),
      } as any;
    },
    closeRefundModal() {
      this.refundModal.open = false;
    },
    openDisputeModal(p: Payment) {
      this.disputeModal = { open: true, paymentId: p._id, reason: 'not_received', description: '' };
    },
    closeDisputeModal() {
      this.disputeModal.open = false;
    },
    async submitDispute() {
      try {
        const res = await disputeService.open({
          paymentId: this.disputeModal.paymentId,
          reason: this.disputeModal.reason,
          description: this.disputeModal.description
        });
        (this as any).$func?.showToastSuccess?.('Litige ouvert');
        this.closeDisputeModal();
        this.$router.push(`/disputes/${res.dispute._id}`);
      } catch (e: any) {
        (this as any).$func?.showToastError?.(e.response?.data?.message || 'Erreur');
      }
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
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.payment-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.payment-breakdown__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  color: var(--text-secondary);
}
.payment-breakdown__row--total {
  padding-top: var(--space-xs);
  border-top: 1px solid var(--surface-border);
  color: var(--text-primary);
  font-weight: 600;
}

.refund-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-left: 3px solid var(--accent-pink);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.refund-block__head {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
  color: var(--text-primary);
  > i { color: var(--accent-pink); }
}

.refund-list { list-style: none; margin: 0; padding: 0; }
.refund-item + .refund-item {
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px dashed var(--surface-border);
}
.refund-item__main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-md);
  small { color: var(--text-muted); white-space: nowrap; }
}
.refund-item__amount { font-weight: 600; color: var(--accent-pink); }
.refund-item__reason {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-style: italic;
}

.refund-block__totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--surface-border);
}
.refund-block__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  color: var(--text-secondary);
}
.refund-block__row--muted { color: var(--text-muted); }
.refund-block__row--net { color: var(--text-primary); }
.payment-card__shipment-head {
  display: flex; align-items: center; gap: var(--space-md);
  > i { color: var(--accent-pink); font-size: 1.25rem; }
  .shipment-summary { flex: 1; small { color: var(--text-muted); display: block; em { font-style: italic; } } }
}

.shipment-timeline {
  list-style: none;
  margin: 0;
  padding: 0 0 0 var(--space-sm);
  border-left: 2px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
.timeline-item {
  position: relative;
  padding-left: var(--space-md);
  &--delivered .timeline-dot { background: #28a745; color: white; }
  &--exception .timeline-dot { background: #dc3545; color: white; }
  &--returned .timeline-dot { background: #ffc107; color: #1f1f1f; }
}
.timeline-dot {
  position: absolute;
  left: calc(-1 * var(--space-sm) - 11px);
  top: 0;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--accent-pink);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 0 0 3px var(--bg-tertiary);
}
.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .timeline-title { font-weight: 600; color: var(--text-primary); }
  .timeline-desc { color: var(--text-secondary); }
  small { color: var(--text-muted); }
  .timeline-source { margin-left: 4px; font-style: italic; opacity: 0.8; }
}

.payment-card__refunds {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.refund-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  position: relative;

  &--completed {
    background: rgba(40, 167, 69, 0.12);
    border: 1.5px solid #28a745;
    color: #28a745;

    &[data-tooltip]:not([data-tooltip=''])::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: var(--font-size-xs);
      font-weight: 400;
      white-space: nowrap;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 12px rgba(0,0,0,.3);
      border: 1px solid var(--surface-border);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 10;
    }

    &[data-tooltip]:not([data-tooltip='']):hover::after {
      opacity: 1;
    }
  }

  &--pending {
    background: rgba(255, 193, 7, 0.12);
    border: 1.5px solid #e0a800;
    color: #e0a800;
  }

  &--failed {
    background: rgba(220, 53, 69, 0.12);
    border: 1.5px solid #dc3545;
    color: #dc3545;
  }
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
  input, textarea, select {
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
