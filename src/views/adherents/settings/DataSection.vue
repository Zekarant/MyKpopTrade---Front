<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-envelope-paper"></i> Communications</h3>
    <div class="settings-card__body">
      <!-- RGPD art. 7-3 : le retrait du consentement doit être aussi
           simple que son recueil à l'inscription. -->
      <label class="consent-row">
        <input
          type="checkbox"
          :checked="profile.marketingConsent === true"
          :disabled="savingConsent"
          @change="toggleMarketingConsent"
        />
        <span class="consent-row__label">
          Recevoir les actualités et bons plans par email
          <small>Facultatif. Vous pouvez changer d'avis à tout moment.</small>
        </span>
      </label>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-database"></i> Mes données</h3>
    <div class="settings-card__body">
      <p class="settings-card__intro">
        Vos droits sont détaillés dans la
        <router-link to="/privacy">politique de confidentialité</router-link>.
      </p>
      <button class="btn-settings btn-settings--full" @click="exportUserData">
        <i class="bi bi-download"></i> Exporter mes données
      </button>
      <button v-if="!profile.anonymized" class="btn-settings btn-settings--full btn-settings--ghost" @click="confirmAnonymize">
        <i class="bi bi-shield-check"></i> Anonymiser mes données
      </button>
    </div>
  </section>

  <!-- Danger Zone -->
  <section v-if="profile.accountStatus === 'active'" class="settings-card settings-card--danger">
    <h3 class="settings-card__title settings-card__title--danger"><i class="bi bi-exclamation-triangle"></i> Zone de danger</h3>
    <div class="settings-card__body">
      <div v-if="pendingDeletion" class="delete-confirm">
        <p class="delete-confirm__text">
          <i class="bi bi-clock-history"></i>
          Suppression de compte programmée le <strong>{{ formatDate(pendingDeletion.scheduledFor) }}</strong>.
          Vous pouvez encore l'annuler avant cette date.
        </p>
        <button @click="cancelDeletion" class="btn-settings btn-settings--full btn-settings--ghost">
          <i class="bi bi-arrow-counterclockwise"></i> Annuler la suppression
        </button>
      </div>
      <div v-else-if="!showDeleteConfirm">
        <button class="btn-settings btn-settings--full btn-settings--danger" @click="showDeleteConfirm = true">
          <i class="bi bi-trash"></i> Supprimer mon compte
        </button>
      </div>
      <div v-else class="delete-confirm">
        <p class="delete-confirm__text">
          Votre compte sera <strong>supprimé dans 30 jours</strong>. Pendant ce délai, vous pouvez toujours annuler.
          Tapez <strong>SUPPRIMER</strong> pour confirmer.
        </p>
        <input type="text" v-model="deleteConfirmText" class="settings-input" placeholder="SUPPRIMER" autocomplete="off" />
        <div class="password-form__actions">
          <button @click="showDeleteConfirm = false; deleteConfirmText = ''" class="btn-settings btn-settings--ghost">Annuler</button>
          <button @click="requestAccountDeletion" :disabled="deleteConfirmText !== 'SUPPRIMER'" class="btn-settings btn-settings--danger">
            Programmer la suppression
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { func } from '@/function';
import userService from '@/services/user.service';
import { api, apiMessage, formatDate, isSessionLost } from './shared';
import type { SectionProps, SettingsProfile } from './shared';

const props = defineProps<SectionProps>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

// --- Consentement marketing ---

const savingConsent = ref(false);

/**
 * Bascule le consentement marketing (RGPD art. 7-3).
 * En cas d'échec, la case revient à son état serveur : on n'affiche jamais
 * un consentement qui n'a pas été réellement enregistré.
 */
async function toggleMarketingConsent(event: Event) {
  const input = event.target as HTMLInputElement;
  const desired = input.checked;
  savingConsent.value = true;
  try {
    await userService.updateConsents({ marketing: desired });
    emit('patch', { marketingConsent: desired });
    func.showToastSuccess(
      desired
        ? 'Vous recevrez désormais nos actualités par email.'
        : 'Vous ne recevrez plus d\'emails d\'actualités.'
    );
  } catch {
    input.checked = !desired;
    func.showToastError('Impossible d\'enregistrer votre choix. Veuillez réessayer.');
  } finally {
    savingConsent.value = false;
  }
}

// --- Export et anonymisation ---

async function exportUserData() {
  try {
    const res = await api.get('/api/users/me/data-export');
    // Téléchargement sous forme de fichier JSON.
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mykpoptrade-export.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    func.showToastError('Erreur lors de l\'export');
  }
}

async function confirmAnonymize() {
  if (!confirm('Êtes-vous sûr de vouloir anonymiser vos données ? Cette action est irréversible.')) return;
  try {
    const res = await api.post('/api/users/me/anonymize', { confirmation: true });
    func.showToastSuccess(res.data.message);
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

// --- Suppression du compte ---

const showDeleteConfirm = ref(false);
const deleteConfirmText = ref('');
const pendingDeletion = ref<{ scheduledFor: string } | null>(null);

function deletionFrom(profile: SettingsProfile) {
  const scheduled = profile.scheduledDeletionDate;
  return scheduled ? { scheduledFor: scheduled } : null;
}

pendingDeletion.value = deletionFrom(props.profile);
watch(() => props.profile, (profile) => {
  pendingDeletion.value = deletionFrom(profile);
});

async function requestAccountDeletion() {
  if (deleteConfirmText.value !== 'SUPPRIMER') return;
  try {
    const res = await userService.requestAccountDeletion({ confirmation: true });
    func.showToastSuccess(res.message || 'Suppression programmée');
    showDeleteConfirm.value = false;
    deleteConfirmText.value = '';
    if (res.scheduledDeletionDate) {
      pendingDeletion.value = { scheduledFor: res.scheduledDeletionDate };
    } else {
      await props.reloadProfile();
    }
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur'));
  }
}

async function cancelDeletion() {
  try {
    const res = await userService.cancelAccountDeletion();
    func.showToastSuccess(res.message || 'Suppression annulée');
    pendingDeletion.value = null;
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}
</script>
