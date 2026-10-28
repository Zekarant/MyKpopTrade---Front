<template>
  <div class="payment-success-container" :class="{ 'error-state': captureError }">
    <div class="success-card" :class="{ 'error-card': captureError }">
      <div v-if="!capturing && !captureError" class="confetti" aria-hidden="true">
        <div v-for="i in 20" :key="i" class="confetti-item"></div>
      </div>

      <div class="icon-container" aria-hidden="true">
        <div v-if="!capturing && !captureError" class="check-icon success">
          <i class="bi bi-check-circle"></i>
        </div>
        <div v-else-if="capturing" class="check-icon warning">
          <i class="bi bi-hourglass-split"></i>
        </div>
        <div v-else class="check-icon error">
          <i class="bi bi-exclamation-circle"></i>
        </div>
      </div>

      <h1 v-if="capturing">Finalisation en cours...</h1>
      <h1 v-else-if="captureError">Erreur de finalisation</h1>
      <h1 v-else>Paiement confirmé !</h1>
      <p v-if="capturing" class="message" role="status">
        Nous finalisons votre paiement, veuillez patienter...
      </p>
      <p v-else-if="captureError" class="message" role="alert">
        {{ captureError }}
        <template v-if="otherPaymentsCancelled">
          <br />Les autres articles de votre commande n'ont pas été payés : ils restent dans votre panier.
        </template>
      </p>
      <p v-else class="message">
        Votre paiement via PayPal a été traité avec succès.
        Merci de votre confiance !
      </p>

      <div class="success-details" :class="{ 'error-details': captureError }">
        <div class="detail-item">
          <span class="label">Source</span>
          <span class="value">PayPal</span>
        </div>
        <div v-if="token" class="detail-item">
          <span class="label">Référence de transaction</span>
          <span class="value token-value">{{ token }}</span>
        </div>
        <div v-if="payerId" class="detail-item">
          <span class="label">ID Payer</span>
          <span class="value token-value">{{ payerId }}</span>
        </div>
      </div>

      <div class="info-box success-info">
        <p>
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          Un email de confirmation a été envoyé à votre adresse email.
        </p>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-primary" @click="leaveTo('dashboard')">
          <i class="bi bi-house-fill" aria-hidden="true"></i>
          Retour au tableau de bord
        </button>
        <button type="button" class="btn btn-secondary" @click="leaveTo('messages')">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          Retour à la messagerie
        </button>
      </div>

      <div class="support-text">
        <p>Besoin d'aide ? <button type="button" class="link" @click="showContact = true">Contactez-nous</button></p>
      </div>
    </div>
  </div>

  <PaymentContactDialog v-if="showContact" @close="showContact = false" />
</template>

<script setup lang="ts">
/** Retour de PayPal : capture du paiement, puis enchaînement des paiements restants du panier. */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiErrorBody } from '@/services/apiError';
import paymentService from '@/services/payment.service';
import cartService from '@/services/cart.service';
import { cancelPendingPayments, pendingApprovalUrl, pendingOrderId, readPendingPayments, takeNextPendingPayment } from './pendingPayments';
import { isPayPalUrl, redirectToPayPal } from './paypalUrl';
import PaymentContactDialog from './PaymentContactDialog.vue';

defineOptions({ name: 'PaymentSuccess' });

type CaptureErrorBody ={ message?: string; code?: string; approvalUrl?: string };

const route = useRoute();
const router = useRouter();

const token = ref('');
const payerId = ref('');
const capturing = ref(false);
const captureError = ref('');
const otherPaymentsCancelled = ref(false);
const showContact = ref(false);

// Un paiement du panier a échoué : les suivants ne seront pas enchaînés,
// on les annule plutôt que de les laisser en attente.
async function cancelRemainingPayments(alreadySkipped: boolean) {
  otherPaymentsCancelled.value = alreadySkipped || readPendingPayments().length > 0;
  await cancelPendingPayments((orderId) => paymentService.cancelPayPal(orderId));
}

async function capture() {
  capturing.value = true;
  try {
    await paymentService.capturePayPal({ paypalOrderId: token.value });
  } catch (e) {
    const data = apiErrorBody<CaptureErrorBody>(e);
    const msg = data?.message || '';
    if (msg.includes('déjà traité')) {
      // Déjà capturé (rechargement de la page) : rien à signaler.
    } else if (data?.code === 'ORDER_NOT_APPROVED') {
      // L'ordre n'est pas encore approuvé : retour sur PayPal.
      if (redirectToPayPal(data.approvalUrl)) return false;
      captureError.value = 'Le paiement n\'a pas été finalisé sur PayPal. Veuillez réessayer.';
    } else {
      captureError.value = msg || 'Erreur lors de la finalisation du paiement';
    }
  } finally {
    capturing.value = false;
  }
  return true;
}

onMounted(async () => {
  token.value = (route.query.token as string) || '';
  payerId.value = (route.query.PayerID as string) || '';
  let skippedPayment = false;

  // Capturer seulement avec un token ET un PayerID (= l'acheteur a approuvé)
  if (token.value && payerId.value) {
    if (!(await capture())) return;

    if (!captureError.value) {
      // Retire du panier les articles payés (le back garde ceux qui restent à payer)
      try { await cartService.finalizeCheckout(); } catch { /* ignore */ }

      const next = takeNextPendingPayment();
      if (next) {
        const nextUrl = pendingApprovalUrl(next);
        if (isPayPalUrl(nextUrl)) {
          // Court délai pour que l'acheteur voie le succès avant le paiement suivant
          setTimeout(() => { window.location.href = nextUrl; }, 1500);
          return;
        }
        // Lien altéré dans le localStorage : on ne suit pas un domaine tiers, et
        // l'ordre correspondant est annulé comme les suivants.
        const orderId = pendingOrderId(next);
        if (orderId) await paymentService.cancelPayPal(orderId).catch(() => {});
        skippedPayment = true;
        captureError.value = 'Votre paiement a bien été reçu, mais le lien du paiement suivant est invalide : il n\'a pas été ouvert.';
      }
    }
  } else if (token.value && !payerId.value) {
    // Token sans PayerID = l'acheteur n'a pas approuvé (redirection forcée)
    captureError.value = 'Le paiement n\'a pas été approuvé. Veuillez réessayer.';
  }

  if (captureError.value) {
    await cancelRemainingPayments(skippedPayment);
  }
});

function leaveTo(name: 'dashboard' | 'messages') {
  localStorage.removeItem('lastProductId');
  router.push({ name });
}
</script>

<style lang="scss" scoped>
@use './success.scss';
</style>
