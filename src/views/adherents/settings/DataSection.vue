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

  <BlockedUsersCard />

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
      <template v-if="!profile.anonymized">
        <button v-if="!showAnonymizeConfirm" class="btn-settings btn-settings--full btn-settings--ghost" @click="showAnonymizeConfirm = true">
          <i class="bi bi-shield-check"></i> Anonymiser mes données
        </button>
        <div v-else class="delete-confirm">
          <p class="delete-confirm__text">
            Votre pseudo, votre email et vos informations personnelles seront remplacés
            <strong>immédiatement et définitivement</strong>.
          </p>
          <div class="field">
            <label class="field__label" for="settings-anonymize-password">Mot de passe actuel</label>
            <input
              id="settings-anonymize-password"
              v-model="anonymizePassword"
              type="password"
              class="settings-input"
              autocomplete="current-password"
            />
            <small v-if="anonymizePasswordError" class="field__error">{{ anonymizePasswordError }}</small>
            <small class="field__hint">
              Compte créé avec Google ou Discord ? Définissez d'abord un mot de passe
              via <router-link to="/forgot_psw">Mot de passe oublié</router-link>.
            </small>
          </div>
          <div class="password-form__actions">
            <button class="btn-settings btn-settings--ghost" @click="closeAnonymizeConfirm">Annuler</button>
            <button :disabled="!anonymizePassword || anonymizing" class="btn-settings btn-settings--danger" @click="anonymize">
              {{ anonymizing ? 'Anonymisation…' : 'Anonymiser définitivement' }}
            </button>
          </div>
        </div>
      </template>
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
        <button class="btn-settings btn-settings--full btn-settings--ghost" @click="cancelDeletion">
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
        <input v-model="deleteConfirmText" type="text" class="settings-input" placeholder="SUPPRIMER" autocomplete="off" />
        <div class="password-form__actions">
          <button class="btn-settings btn-settings--ghost" @click="showDeleteConfirm = false; deleteConfirmText = ''">Annuler</button>
          <button :disabled="deleteConfirmText !== 'SUPPRIMER'" class="btn-settings btn-settings--danger" @click="requestAccountDeletion">
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
import BlockedUsersCard from './BlockedUsersCard.vue';
import { api, apiCode, apiMessage, formatDate, isSessionLost } from './shared';
import type { SectionProps, SettingsProfile } from './shared';

const props = defineProps<SectionProps>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

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

async function exportUserData() {
  try {
    const res = await api.get('/api/users/me/data-export');
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

const showAnonymizeConfirm = ref(false);
const anonymizePassword = ref('');
const anonymizePasswordError = ref('');
const anonymizing = ref(false);

function closeAnonymizeConfirm() {
  showAnonymizeConfirm.value = false;
  anonymizePassword.value = '';
  anonymizePasswordError.value = '';
}

/** Immédiate et irréversible : l'API exige le mot de passe actuel. */
async function anonymize() {
  anonymizing.value = true;
  anonymizePasswordError.value = '';
  try {
    const res = await userService.anonymizeMyAccount({ confirmation: true, currentPassword: anonymizePassword.value });
    func.showToastSuccess(res.message || 'Données anonymisées');
    closeAnonymizeConfirm();
    await props.reloadProfile();
  } catch (error) {
    // Testé avant `isSessionLost` : ce 401 est un mauvais mot de passe, pas une session perdue.
    const code = apiCode(error);
    if (code === 'CURRENT_PASSWORD_INVALID' || code === 'CURRENT_PASSWORD_REQUIRED') {
      anonymizePasswordError.value = apiMessage(error, 'Mot de passe actuel incorrect');
    } else if (!isSessionLost(error)) {
      func.showToastError(apiMessage(error, 'Erreur'));
    }
  } finally {
    anonymizing.value = false;
  }
}

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
