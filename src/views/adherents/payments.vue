<template>
  <main class="page payments-root">
    <div class="payments-page">
      <div class="payments-page__container">
        <div class="payments-page__header">
          <h1 class="payments-page__title">Mes paiements</h1>
        </div>

        <div class="tabs">
          <button
            v-for="tab in TABS"
            :key="tab.role"
            type="button"
            :aria-pressed="role === tab.role"
            :class="['tab', { 'tab--active': role === tab.role }]"
            @click="setRole(tab.role)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="loading" class="empty">
          <i class="bi bi-arrow-clockwise spin"></i> Chargement…
        </div>

        <div v-else-if="payments.length === 0" class="empty">
          <i class="bi bi-receipt"></i>
          <p>Aucun paiement {{ role === 'buyer' ? 'd\'achat' : role === 'seller' ? 'de vente' : '' }} pour le moment.</p>
        </div>

        <div v-else class="payments-list">
          <PaymentCard
            v-for="p in payments"
            :key="p._id"
            :ref="(card) => registerCard(p._id, card)"
            :payment="p"
            :current-user-id="userId"
            :focused="p._id === focusedPaymentId"
            @mark-delivered="markDelivered"
          />

          <div v-if="pagination && pagination.pages > 1" class="pager">
            <button type="button" class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="changePage(page - 1)">Précédent</button>
            <span>Page {{ page }} / {{ pagination.pages }}</span>
            <button type="button" class="btn btn-ghost btn-sm" :disabled="page >= pagination.pages" @click="changePage(page + 1)">Suivant</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Aucune carte n'ouvre plus ces modales depuis le retrait de leurs boutons
         (commit 36151ea) : elles restent branchées pour leur retour. -->
    <ShipmentModal v-if="shipmentTarget" @close="shipmentTarget = null" @submit="submitShipment" />
    <DisputeModal v-if="disputeTarget" @close="disputeTarget = null" @submit="submitDispute" />
    <RefundModal
      v-if="refundTarget"
      :max-amount="fromCents(refundableCents(refundTarget))"
      :currency="refundTarget.currency"
      @close="refundTarget = null"
      @submit="submitRefund"
    />
  </main>
</template>

<script setup lang="ts">
/** « Mes paiements » : achats et ventes, avec remboursements et suivi d'expédition. */
import { nextTick, onMounted, ref, type ComponentPublicInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { currentUserId } from '@/services/session.cookies';
import { apiErrorMessage } from '@/services/apiError';
import paymentService from '@/services/payment.service';
import disputeService, { type DisputeReason } from '@/services/dispute.service';
import { func } from '@/function';
import { fromCents } from '@/utils/money';
import { refundableCents, roleFromQuery } from './payments/paymentRules';
import PaymentCard from './payments/PaymentCard.vue';
import ShipmentModal from './payments/ShipmentModal.vue';
import RefundModal from './payments/RefundModal.vue';
import DisputeModal from './payments/DisputeModal.vue';
import type { Payment, PaymentRole, RefundPayload, ShipmentPayload } from './payments/types';

defineOptions({ name: 'PaymentsPage' });

const TABS: { role: PaymentRole; label: string }[] = [
  { role: 'all', label: 'Tous' },
  { role: 'buyer', label: 'Achats' },
  { role: 'seller', label: 'Ventes' },
];
const PAGE_SIZE = 10;

const route = useRoute();
const router = useRouter();
const userId = currentUserId() || '';

const payments = ref<Payment[]>([]);
const pagination = ref<{ page: number; pages: number; total: number; limit: number } | null>(null);
const role = ref<PaymentRole>(roleFromQuery(route.query.role));
const page = ref(1);
const loading = ref(false);

// Paiement visé par un lien de notification (`?payment=`), mis en avant.
const focusedPaymentId = typeof route.query.payment === 'string' ? route.query.payment : '';
// Non réactive : remplie par les refs de rendu, elle ne doit pas en déclencher.
const paymentCards = new Map<string, HTMLElement>();

function registerCard(paymentId: string, card: Element | ComponentPublicInstance | null) {
  const el = card && '$el' in card ? card.$el : card;
  if (el instanceof HTMLElement) paymentCards.set(paymentId, el);
  else paymentCards.delete(paymentId);
}

async function fetchPayments() {
  loading.value = true;
  try {
    const res = await paymentService.getMyPayments({ role: role.value, page: page.value, limit: PAGE_SIZE });
    payments.value = res.data || [];
    pagination.value = res.pagination || null;
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur de chargement'));
  } finally {
    loading.value = false;
  }
}

function setRole(next: PaymentRole) {
  if (role.value === next) return;
  role.value = next;
  page.value = 1;
  fetchPayments();
}

function changePage(next: number) {
  page.value = next;
  fetchPayments();
}

async function markDelivered(p: Payment) {
  if (!confirm('Confirmer la livraison de ce colis ?')) return;
  try {
    await paymentService.markShipmentDelivered(p._id);
    func.showToastSuccess('Marqué comme livré');
    await fetchPayments();
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  }
}

// ── Modales : un échec garde la modale ouverte, avec la saisie ──────────
const shipmentTarget = ref<Payment | null>(null);
const refundTarget = ref<Payment | null>(null);
const disputeTarget = ref<Payment | null>(null);

async function submitShipment(payload: ShipmentPayload) {
  if (!shipmentTarget.value) return;
  try {
    await paymentService.createShipment(shipmentTarget.value._id, payload);
    func.showToastSuccess('Expédition enregistrée');
    shipmentTarget.value = null;
    await fetchPayments();
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  }
}

async function submitRefund(payload: RefundPayload) {
  if (!refundTarget.value) return;
  try {
    await paymentService.refundPayment(refundTarget.value._id, payload);
    func.showToastSuccess('Demande de remboursement envoyée');
    refundTarget.value = null;
    await fetchPayments();
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  }
}

async function submitDispute(payload: { reason: DisputeReason; description: string }) {
  if (!disputeTarget.value) return;
  try {
    const res = await disputeService.open({ paymentId: disputeTarget.value._id, ...payload });
    func.showToastSuccess('Litige ouvert');
    disputeTarget.value = null;
    router.push(`/disputes/${res.dispute._id}`);
  } catch (e) {
    func.showToastError(apiErrorMessage(e, 'Erreur'));
  }
}

onMounted(async () => {
  await fetchPayments();
  await nextTick();
  paymentCards.get(focusedPaymentId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
</script>

<style lang="scss">
@use 'sass:meta';

// Rattachée à la classe racine plutôt qu'au scope : cartes et modales (composants
// enfants) en héritent, avec la même spécificité que `.x[data-v]`.
.payments-root {
  @include meta.load-css('../../css/payments.scss');
}
</style>
