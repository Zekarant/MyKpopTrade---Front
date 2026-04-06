<template>
  <main>
    <Nav_bar></Nav_bar>
    <div class="contact-container">
      <div class="contact-card">
        <div class="contact-header">
          <button type="button" class="back-btn" @click="goBack">
            <i class="bi bi-arrow-left"></i> Retour
          </button>
          <i class="bi bi-headset contact-icon"></i>
          <h1 class="contact-title">Nous contacter</h1>
          <p class="contact-subtitle">Une question ? Un problème ? Notre équipe support Discord vous répond rapidement.</p>
        </div>

        <form @submit.prevent="submitForm" class="contact-form">
          <div class="form-row">
            <div class="input-group mb-3">
              <span class="input-group-text">
                <i class="bi bi-person"></i>
              </span>
              <input
                type="text"
                v-model="form.name"
                class="form-control"
                :class="{ 'is-invalid': errors.name }"
                placeholder="Votre nom"
                required
              />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text">
                <i class="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                v-model="form.email"
                class="form-control"
                :class="{ 'is-invalid': errors.email }"
                placeholder="Votre email"
                required
              />
            </div>
          </div>

          <div class="input-group mb-3">
            <span class="input-group-text">
              <i class="bi bi-tag"></i>
            </span>
            <select v-model="form.subject" class="form-control" :class="{ 'is-invalid': errors.subject }">
              <option value="" disabled>Sujet de votre message</option>
              <option value="Problème de compte">Problème de compte</option>
              <option value="Problème de paiement">Problème de paiement</option>
              <option value="Signaler un utilisateur">Signaler un utilisateur</option>
              <option value="Problème technique">Problème technique</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div class="input-group textarea-group mb-3">
            <span class="input-group-text align-items-start pt-2">
              <i class="bi bi-chat-text"></i>
            </span>
            <textarea
              v-model="form.message"
              class="form-control"
              :class="{ 'is-invalid': errors.message }"
              placeholder="Décrivez votre problème ou question..."
              rows="5"
              required
            ></textarea>
          </div>

          <button type="submit" class="btn-primary w-100" :disabled="loading">
            <span v-if="loading"><i class="bi bi-hourglass-split me-2"></i>Envoi en cours...</span>
            <span v-else><i class="bi bi-send me-2"></i>Envoyer le message</span>
          </button>
        </form>

        <div
          v-if="alert.message"
          :class="['alert', 'alert-dismissible', 'd-flex', 'align-items-center', 'mt-3', alert.type === 'success' ? 'alert-success' : 'alert-danger']"
          role="alert"
        >
          <i class="bi me-2" :class="alert.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'"></i>
          <div>{{ alert.message }}</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'contact',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const form = reactive({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    const errors = reactive({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    const alert = reactive({
      type: '',
      message: ''
    });

    const validate = () => {
      let valid = true;
      errors.name = '';
      errors.email = '';
      errors.subject = '';
      errors.message = '';

      if (!form.name.trim()) {
        errors.name = 'Le nom est requis';
        valid = false;
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Email invalide';
        valid = false;
      }
      if (!form.subject) {
        errors.subject = 'Veuillez choisir un sujet';
        valid = false;
      }
      if (!form.message.trim() || form.message.trim().length < 10) {
        errors.message = 'Le message doit contenir au moins 10 caractères';
        valid = false;
      }
      return valid;
    };

    const submitForm = async () => {
      if (!validate()) return;

      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        alert.type = 'error';
        alert.message = 'Le service de support est momentanément indisponible. Veuillez réessayer plus tard.';
        return;
      }

      loading.value = true;
      alert.message = '';

      try {
        const payload = {
          embeds: [
            {
              title: `📩 Nouveau message de support — ${form.subject}`,
              color: 0x17202A,
              fields: [
                { name: '👤 Nom', value: form.name, inline: true },
                { name: '📧 Email', value: form.email, inline: true },
                { name: '🏷️ Sujet', value: form.subject, inline: false },
                { name: '💬 Message', value: form.message, inline: false }
              ],
              footer: { text: 'MyKpopTrade — Support' },
              timestamp: new Date().toISOString()
            }
          ]
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Discord webhook error');

        alert.type = 'success';
        alert.message = 'Votre message a bien été envoyé ! Notre équipe vous contactera à l\'adresse indiquée.';
        form.name = '';
        form.email = '';
        form.subject = '';
        form.message = '';
        setTimeout(() => router.back(), 2000);
      } catch {
        alert.type = 'error';
        alert.message = 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.';
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => router.back();

    return { form, errors, alert, loading, submitForm, goBack };
  }
});
</script>

<style lang="scss" scoped>
.contact-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 50px);
  padding: 40px 20px;
  background-color: var(--light-color);
}

.contact-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 40px;
  width: 100%;
  max-width: 600px;
}

.contact-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: none;
  border: none;
  color: var(--secondary-color);
  font-family: Sora;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: var(--primary-color);
  }
}

.contact-icon {
  font-size: 40px;
  color: var(--primary-color);
  display: block;
  margin-bottom: 12px;
}

.contact-title {
  font-family: Sora;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.contact-subtitle {
  color: var(--secondary-color);
  font-size: 14px;
  margin: 0;
}

.contact-form {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

.input-group {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--secondary-color-tint);
  height: 48px;

  &.textarea-group {
    height: auto;
  }
}

.input-group-text {
  background-color: #fff;
  border: none;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: var(--secondary-color);
}

.form-control {
  border: none;
  outline: none;
  box-shadow: none;
  padding: 0 12px;
  font-family: Sora;
  font-size: 14px;
  width: 100%;

  &:focus {
    box-shadow: none;
    outline: none;
  }

  &.is-invalid {
    border-color: var(--danger-color);
  }
}

textarea.form-control {
  padding: 10px 12px;
  resize: vertical;
}

select.form-control {
  cursor: pointer;
  color: #333;

  option[value=""] {
    color: #bbb;
  }
}

.btn-primary {
  margin-top: 4px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.alert {
  border-radius: 8px;
  font-size: 14px;
}

@media (max-width: 600px) {
  .contact-card {
    padding: 24px 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
