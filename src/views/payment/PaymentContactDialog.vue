<template>
  <div class="modal-overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div
      ref="dialog"
      class="modal-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${idPrefix}-title`"
      tabindex="-1"
    >
      <button type="button" class="modal-close" aria-label="Fermer" @click="emit('close')">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
      <h2 :id="`${idPrefix}-title`"><i class="bi bi-chat-dots" aria-hidden="true"></i> Contactez-nous</h2>
      <p class="modal-subtitle">Envoyez-nous un message, nous vous répondrons rapidement.</p>

      <form @submit.prevent="sendMessage">
        <div class="form-group">
          <label :for="`${idPrefix}-name`">Votre nom</label>
          <input :id="`${idPrefix}-name`" v-model="form.name" type="text" placeholder="John Doe" required />
        </div>
        <div class="form-group">
          <label :for="`${idPrefix}-email`">Votre email</label>
          <input :id="`${idPrefix}-email`" v-model="form.email" type="email" placeholder="john@exemple.com" required />
        </div>
        <div class="form-group">
          <label :for="`${idPrefix}-message`">Message</label>
          <textarea :id="`${idPrefix}-message`" v-model="form.message" rows="4" placeholder="Décrivez votre problème..." required></textarea>
        </div>

        <div v-if="contactError" class="contact-error" role="alert">
          <i class="bi bi-exclamation-circle" aria-hidden="true"></i> {{ contactError }}
        </div>
        <div v-if="contactSuccess" class="contact-success" role="status">
          <i class="bi bi-check-circle" aria-hidden="true"></i> Message envoyé ! Nous vous répondrons bientôt.
        </div>

        <button type="submit" class="btn btn-primary" :disabled="sending">
          <i class="bi bi-send" aria-hidden="true"></i>
          {{ sending ? 'Envoi...' : 'Envoyer' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Contact du support depuis la page de retour PayPal, message étiqueté pour le suivi des paiements. */
import { ref, useId } from 'vue';
import { contactErrorMessage, sendContactMessage } from '@/services/contact.service';
import { useDialogFocus } from '@/composables/useDialogFocus';

const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLElement | null>(null);
// Focus sur la boîte elle-même (tabindex="-1") : le lecteur d'écran lit son titre d'abord.
useDialogFocus(dialog, dialog);
const idPrefix = `payment-contact-${useId()}`;

const sending = ref(false);
const contactError = ref('');
const contactSuccess = ref(false);
const form = ref({ name: '', email: '', message: '' });

async function sendMessage() {
  sending.value = true;
  contactError.value = '';
  contactSuccess.value = false;

  try {
    await sendContactMessage({
      ...form.value,
      subject: 'Après paiement PayPal',
      source: 'payment-success'
    });
    contactSuccess.value = true;
    form.value = { name: '', email: '', message: '' };
  } catch (error) {
    contactError.value = contactErrorMessage(error, "Une erreur s'est produite. Veuillez réessayer.");
  } finally {
    sending.value = false;
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  position: relative;
  animation: slideUp 0.3s ease-out;

  &:focus { outline: none; }

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;

    i { color: var(--success); }
  }
}

.modal-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;

  &:hover { color: var(--text-primary); }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  input, textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--surface-border);
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-primary);
    transition: border-color 0.2s;
    box-sizing: border-box;
    font-family: inherit;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: var(--success);
    }
  }
}

.contact-error,
.contact-success {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}

.contact-error {
  background: var(--danger-light);
  border: 1px solid var(--danger-border);
  color: var(--danger);
}

.contact-success {
  background: var(--success-light);
  border: 1px solid var(--success-border);
  color: var(--success);
}

.btn {
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--success);
  color: var(--text-on-accent);

  &:hover:not(:disabled) { transform: translateY(-3px); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
</style>
