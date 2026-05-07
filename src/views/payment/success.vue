<template>
  <div class="payment-success-container" :class="{ 'error-state': captureError }">
    <div class="success-card" :class="{ 'error-card': captureError }">
      <div class="confetti" v-if="!capturing && !captureError">
        <div class="confetti-item" v-for="i in 20" :key="i"></div>
      </div>

      <div class="icon-container">
        <div class="check-icon success" v-if="!capturing && !captureError">
          <i class="bi bi-check-circle"></i>
        </div>
        <div class="check-icon warning" v-else-if="capturing">
          <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="check-icon error" v-else>
          <i class="bi bi-exclamation-circle"></i>
        </div>
      </div>

      <h1 v-if="capturing">Finalisation en cours...</h1>
      <h1 v-else-if="captureError">Erreur de finalisation</h1>
      <h1 v-else>Paiement confirmé !</h1>
      <p class="message" v-if="capturing">
        Nous finalisons votre paiement, veuillez patienter...
      </p>
      <p class="message" v-else-if="captureError">
        {{ captureError }}
      </p>
      <p class="message" v-else>
        Votre paiement{{ source === 'stripe' ? ' par carte' : ' via PayPal' }} a été traité avec succès.
        Merci de votre confiance !
      </p>

      <div class="success-details" :class="{ 'error-details': captureError }">
        <div class="detail-item">
          <span class="label">Source</span>
          <span class="value">{{ source || 'PayPal' }}</span>
        </div>
        <div class="detail-item" v-if="token">
          <span class="label">Référence de transaction</span>
          <span class="value token-value">{{ token }}</span>
        </div>
        <div class="detail-item" v-if="payerId">
          <span class="label">ID Payer</span>
          <span class="value token-value">{{ payerId }}</span>
        </div>
      </div>

      <div class="info-box success-info">
        <p>
          <i class="bi bi-info-circle"></i>
          Un email de confirmation a été envoyé à votre adresse email.
        </p>
      </div>

      <div class="actions">
        <button @click="goToDashboard" class="btn btn-primary">
          <i class="bi bi-house-fill"></i>
          Retour au tableau de bord
        </button>
        <button @click="goToMessages" class="btn btn-secondary">
          <i class="bi bi-arrow-left"></i>
          Retour à la messagerie
        </button>
      </div>

      <div class="support-text">
        <p>Besoin d'aide ? <a href="#" class="link" @click.prevent="openContact">Contactez-nous</a></p>
      </div>
    </div>
  </div>

  <!-- Contact Modal -->
  <div v-if="showContact" class="modal-overlay" @click.self="closeContact">
    <div class="modal-card">
      <button class="modal-close" @click="closeContact"><i class="bi bi-x-lg"></i></button>
      <h2><i class="bi bi-chat-dots"></i> Contactez-nous</h2>
      <p class="modal-subtitle">Envoyez-nous un message, nous vous répondrons rapidement.</p>

      <form @submit.prevent="sendMessage">
        <div class="form-group">
          <label>Votre nom</label>
          <input v-model="form.name" type="text" placeholder="John Doe" required />
        </div>
        <div class="form-group">
          <label>Votre email</label>
          <input v-model="form.email" type="email" placeholder="john@exemple.com" required />
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea v-model="form.message" rows="4" placeholder="Décrivez votre problème..." required></textarea>
        </div>

        <div v-if="contactError" class="contact-error">
          <i class="bi bi-exclamation-circle"></i> {{ contactError }}
        </div>
        <div v-if="contactSuccess" class="contact-success">
          <i class="bi bi-check-circle"></i> Message envoyé ! Nous vous répondrons bientôt.
        </div>

        <button type="submit" class="btn btn-primary" :disabled="sending">
          <i class="bi bi-send"></i>
          {{ sending ? 'Envoi...' : 'Envoyer' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import paymentService from '@/services/payment.service';
import cartService from '@/services/cart.service';

export default defineComponent({
  name: 'PaymentSuccess',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const token = ref<string>('');
    const payerId = ref<string>('');
    const source = ref<string>('');
    const capturing = ref<boolean>(false);
    const captureError = ref<string>('');

    onMounted(async () => {
      // Récupérer les paramètres de query
      token.value = (route.query.token as string) || '';
      payerId.value = (route.query.PayerID as string) || '';
      source.value = (route.query.source as string) || '';

      // Capturer le paiement seulement si on a un token ET un PayerID (= acheteur a approuvé)
      if (token.value && payerId.value) {
        capturing.value = true;
        try {
          await paymentService.capturePayPal({ paypalOrderId: token.value });
        } catch (e: any) {
          const msg = e.response?.data?.message || '';
          const errorDetail = e.response?.data?.error || '';
          // Ignorer si déjà capturé
          if (msg.includes('déjà traité')) {
            // OK, déjà traité
          } else if (errorDetail.includes('non approuvé') || errorDetail.includes('CREATED')) {
            // L'ordre n'est pas encore approuvé — re-rediriger vers PayPal
            const approvalUrl = e.response?.data?.approvalUrl;
            if (approvalUrl) {
              window.location.href = approvalUrl;
              return;
            }
            captureError.value = 'Le paiement n\'a pas été finalisé sur PayPal. Veuillez réessayer.';
          } else {
            captureError.value = msg || 'Erreur lors de la finalisation du paiement';
          }
        } finally {
          capturing.value = false;
        }

        // Handle pending multi-payment: redirect to next PayPal approval
        if (!captureError.value) {
          // Vider le panier après paiement confirmé
          try { await cartService.finalizeCheckout(); } catch { /* ignore */ }

          const pendingRaw = localStorage.getItem('pendingPaypalPayments');
          if (pendingRaw) {
            try {
              const pending: any[] = JSON.parse(pendingRaw);
              if (pending.length > 0) {
                const next = pending.shift()!;
                const nextUrl = typeof next === 'string' ? next : next.approvalUrl;
                if (pending.length > 0) {
                  localStorage.setItem('pendingPaypalPayments', JSON.stringify(pending));
                } else {
                  localStorage.removeItem('pendingPaypalPayments');
                }
                // Small delay so user sees success briefly
                setTimeout(() => { window.location.href = nextUrl; }, 1500);
                return;
              }
            } catch { /* ignore parse errors */ }
            localStorage.removeItem('pendingPaypalPayments');
          }
        }
      } else if (token.value && !payerId.value) {
        // Token sans PayerID = l'acheteur n'a pas approuvé (redirection forcée)
        captureError.value = 'Le paiement n\'a pas été approuvé. Veuillez réessayer.';
      }
    });

    const goToDashboard = () => {
      localStorage.removeItem('lastProductId');
      router.push({ name: 'dashboard' });
    };

    const goToMessages = () => {
      localStorage.removeItem('lastProductId');
      router.push({ name: 'messages' });
    };

    const showContact = ref(false);
    const sending = ref(false);
    const contactError = ref('');
    const contactSuccess = ref(false);
    const form = ref({ name: '', email: '', message: '' });

    const openContact = () => {
      showContact.value = true;
      contactError.value = '';
      contactSuccess.value = false;
    };

    const closeContact = () => {
      showContact.value = false;
    };

    const sendMessage = async () => {
      sending.value = true;
      contactError.value = '';
      contactSuccess.value = false;
      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

      const content = [
        `**Nouveau message de contact (PayPal Success)**`,
        `**Nom :** ${form.value.name}`,
        `**Email :** ${form.value.email}`,
        `**Message :** ${form.value.message}`,
      ].join('\n');

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) throw new Error();

        contactSuccess.value = true;
        form.value = { name: '', email: '', message: '' };
      } catch {
        contactError.value = "Une erreur s'est produite. Veuillez réessayer.";
      } finally {
        sending.value = false;
      }
    };

    return {
      token,
      payerId,
      source,
      capturing,
      captureError,
      goToDashboard,
      goToMessages,
      showContact,
      sending,
      contactError,
      contactSuccess,
      form,
      openContact,
      closeContact,
      sendMessage,
    };
  }
});
</script>

<style lang="scss" scoped>
@use './success.scss';
</style>
