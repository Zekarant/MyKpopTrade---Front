import { ref } from 'vue';
import paymentService from '@/services/payment.service';

/**
 * Capacité du vendeur à encaisser : un vendeur ne peut publier que s'il peut
 * réellement être payé. PayPal est le seul canal depuis le retrait de Stripe.
 * La vérification part dès l'appel, sans attendre le montage.
 */
export function useSellerPaymentStatus() {
  const paymentConfigured = ref(false);
  const loadingPaymentStatus = ref(true);
  const connectingPaypal = ref(false);

  async function checkPaymentConfiguration() {
    try {
      loadingPaymentStatus.value = true;
      // `connected` reflète la capacité réelle à encaisser, pas la seule présence d'un compte relié.
      const paypalStatus = await paymentService.getPayPalAccountStatus().catch(() => null);
      paymentConfigured.value = Boolean(paypalStatus?.connected);
    } finally {
      loadingPaymentStatus.value = false;
    }
  }

  async function connectPayPal() {
    try {
      connectingPaypal.value = true;
      const result = await paymentService.getPayPalOnboardingLink();
      if (result.actionUrl) {
        window.location.href = result.actionUrl;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion PayPal:', error);
    } finally {
      connectingPaypal.value = false;
    }
  }

  checkPaymentConfiguration();

  return { paymentConfigured, loadingPaymentStatus, connectingPaypal, connectPayPal };
}
