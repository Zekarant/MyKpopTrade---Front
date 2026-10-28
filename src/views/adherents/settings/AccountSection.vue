<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-envelope"></i> Adresse email</h3>
    <div class="settings-card__body">
      <div class="setting-row">
        <div class="setting-row__left">
          <i class="bi bi-envelope"></i>
          <div class="setting-row__label-group">
            <span>{{ profile.email || '—' }}</span>
            <small class="text-muted">Sert à la connexion et aux notifications.</small>
          </div>
        </div>
        <span v-if="profile.isEmailVerified" class="setting-badge setting-badge--success">
          <i class="bi bi-check-circle-fill"></i> Vérifiée
        </span>
        <button v-else class="btn-settings btn-settings--sm" @click="verifEmail">Vérifier</button>
      </div>
      <div class="field">
        <label class="field__label" for="settings-email">Changer d'adresse</label>
        <input id="settings-email" v-model.trim="email" type="email" class="settings-input" autocomplete="email" />
      </div>
      <template v-if="emailChanged">
        <div class="field">
          <label class="field__label" for="settings-current-password">Mot de passe actuel</label>
          <input
            id="settings-current-password"
            v-model="currentPassword"
            type="password"
            class="settings-input"
            autocomplete="current-password"
          />
          <small v-if="currentPasswordError" class="field__error">{{ currentPasswordError }}</small>
          <small class="field__hint">
            Requis pour changer d'adresse. Compte créé avec Google ou Discord ? Définissez d'abord un mot de passe
            via <router-link to="/forgot_psw">Mot de passe oublié</router-link>.
          </small>
        </div>
        <div class="setting-row__inline">
          <button class="btn-settings btn-settings--ghost btn-settings--sm" @click="resetEmail">Annuler</button>
          <button
            class="btn-settings btn-settings--primary btn-settings--sm"
            :disabled="!currentPassword || savingEmail"
            @click="saveEmail"
          >
            {{ savingEmail ? 'Enregistrement…' : 'Changer l\'adresse' }}
          </button>
        </div>
      </template>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-phone"></i> Téléphone</h3>
    <div class="settings-card__body">
      <div class="setting-row setting-row--column">
        <div class="setting-row__top">
          <div class="setting-row__left">
            <i class="bi bi-phone"></i>
            <span>Numéro de téléphone</span>
          </div>
          <span v-if="profile.isPhoneVerified || codeVerified" class="setting-badge setting-badge--success">
            <i class="bi bi-check-circle-fill"></i> Vérifié
          </span>
        </div>
        <div class="setting-row__inline">
          <input v-model="phoneNumber" type="tel" class="settings-input settings-input--sm" placeholder="+33 6 12 34 56 78" />
          <button v-if="phoneNumber && phoneNumber !== profile.phoneNumber" class="btn-settings btn-settings--sm" @click="saveTel">Enregistrer</button>
          <button v-else-if="phoneNumber && !profile.isPhoneVerified && !telRequest" class="btn-settings btn-settings--sm" @click="verifTel">Vérifier</button>
        </div>
        <div v-if="telRequest && !codeVerified" class="setting-row__inline" style="margin-top: 8px;">
          <input
            v-model="phoneCode"
            type="text"
            class="settings-input settings-input--sm"
            placeholder="Code à 6 chiffres"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
          />
          <button class="btn-settings btn-settings--primary btn-settings--sm" @click="verifCodeTel">Valider</button>
          <button class="btn-settings btn-settings--sm" @click="verifTel">Renvoyer</button>
        </div>
        <small class="field__hint">
          Facultatif : renforce la confiance et la sécurité de votre compte. Jamais affiché publiquement.
        </small>
      </div>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-patch-check"></i> Vérification d'identité</h3>
    <div class="settings-card__body">
      <div class="setting-row" :class="{ 'setting-row--clickable': !profile.isIdentityVerified }" @click="!profile.isIdentityVerified && openIdentityVerification()">
        <div class="setting-row__left">
          <i class="bi bi-person-badge"></i>
          <div class="setting-row__label-group">
            <span>Identité vérifiée</span>
            <small v-if="!profile.isIdentityVerified" class="text-muted">
              Facultatif. Rassure les acheteurs et lève certaines limites de vente.
            </small>
          </div>
        </div>
        <span v-if="profile.isIdentityVerified" class="setting-badge setting-badge--success">
          <i class="bi bi-check-circle-fill"></i> Vérifié
        </span>
        <span v-else-if="identityVerification?.verification?.status === 'pending'" class="setting-badge setting-badge--info">
          <i class="bi bi-hourglass-split"></i> En attente
        </span>
        <span v-else-if="identityVerification?.verification?.status === 'rejected'" class="setting-badge setting-badge--danger">
          <i class="bi bi-x-circle"></i> Rejetée
        </span>
        <span v-else class="setting-badge setting-badge--link">
          <i class="bi bi-arrow-right-circle"></i> Vérifier
        </span>
      </div>

      <!-- Formulaire inline de vérification d'identité -->
      <div v-if="showIdentityForm" class="identity-form">
        <!-- Demande en attente -->
        <template v-if="identityVerification?.verification?.status === 'pending'">
          <p class="identity-form__info">
            <i class="bi bi-clock"></i>
            Demande soumise le {{ formatDate(identityVerification.verification.submittedAt) }}. En cours de vérification.
          </p>
          <button class="btn-settings btn-settings--ghost btn-settings--sm" @click="cancelIdentityVerification">
            <i class="bi bi-x-circle"></i> Annuler la demande
          </button>
        </template>

        <!-- Demande rejetée -->
        <template v-else-if="identityVerification?.verification?.status === 'rejected'">
          <p class="identity-form__info identity-form__info--danger">
            <i class="bi bi-x-circle-fill"></i>
            Rejetée : {{ identityVerification.verification.rejectionReason }}
          </p>
          <button class="btn-settings btn-settings--ghost btn-settings--sm" @click="identityVerification = null">
            <i class="bi bi-arrow-clockwise"></i> Renvoyer une demande
          </button>
        </template>

        <!-- Nouveau formulaire -->
        <template v-else>
          <select v-model="identityDocumentType" class="settings-input" aria-label="Type de document">
            <option value="id_card">Carte d'identité</option>
            <option value="passport">Passeport</option>
            <option value="driver_license">Permis de conduire</option>
          </select>
          <div
            class="identity-upload"
            role="button"
            tabindex="0"
            aria-label="Importer votre document d'identité"
            @click="identityFileInput?.click()"
            @keydown.enter.prevent="identityFileInput?.click()"
            @keydown.space.prevent="identityFileInput?.click()"
          >
            <img v-if="identityDocumentPreview" :src="identityDocumentPreview" alt="Aperçu du document importé" class="identity-upload__preview" />
            <template v-else>
              <i class="bi bi-cloud-upload"></i>
              <span>Cliquez pour importer votre document</span>
            </template>
            <input ref="identityFileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onIdentityFileChange" />
          </div>
          <label class="identity-consent">
            <input v-model="identityConsentGiven" type="checkbox" />
            J'autorise le traitement de mes données personnelles pour la vérification d'identité
          </label>
          <div class="identity-form__actions">
            <button class="btn-settings btn-settings--ghost btn-settings--sm" @click="showIdentityForm = false">Annuler</button>
            <button
              class="btn-settings btn-settings--primary btn-settings--sm"
              :disabled="!identityConsentGiven || !identityDocumentFile || identitySubmitting"
              @click="submitIdentityVerification"
            >
              <i class="bi bi-send"></i>
              {{ identitySubmitting ? 'Envoi…' : 'Soumettre' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { func } from '@/function';
import accountService, { type IdentityVerificationStatus } from '@/services/account.service';
import { apiCode, apiMessage, apiStatus, formatDate, isSessionLost } from './shared';
import type { SectionProps, SettingsProfile } from './shared';

const props = defineProps<SectionProps>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

async function verifEmail() {
  try {
    await accountService.resendVerificationEmail(props.profile.email || '');
    func.showToastSuccess('Email de vérification envoyé');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

const email = ref(props.profile.email || '');
const currentPassword = ref('');
const currentPasswordError = ref('');
const savingEmail = ref(false);

const emailChanged = computed(() => email.value !== '' && email.value !== (props.profile.email || ''));

function resetEmail() {
  email.value = props.profile.email || '';
  currentPassword.value = '';
  currentPasswordError.value = '';
}

/** L'API exige le mot de passe actuel : l'email sert à réinitialiser le mot de passe. */
async function saveEmail() {
  savingEmail.value = true;
  currentPasswordError.value = '';
  try {
    const data = await accountService.updateProfile<SettingsProfile>({
      email: email.value,
      currentPassword: currentPassword.value
    });
    emit('patch', { email: data.user?.email ?? email.value, isEmailVerified: false });
    resetEmail();
    func.showToastSuccess(data.message || 'Adresse email modifiée.');
  } catch (error) {
    // Testé avant `isSessionLost` : ce 401 est un mauvais mot de passe, pas une session perdue.
    const code = apiCode(error);
    if (code === 'CURRENT_PASSWORD_INVALID' || code === 'CURRENT_PASSWORD_REQUIRED') {
      currentPasswordError.value = apiMessage(error, 'Mot de passe actuel incorrect');
    } else if (!isSessionLost(error)) {
      func.showToastError(apiMessage(error, 'Erreur lors du changement d\'adresse.'));
    }
  } finally {
    savingEmail.value = false;
  }
}

const phoneNumber = ref(props.profile.phoneNumber || '');
const phoneCode = ref('');
const telRequest = ref(false);
const codeVerified = ref(false);

// Profil rechargé : les champs repartent des valeurs enregistrées.
watch(() => props.profile, (profile) => {
  phoneNumber.value = profile.phoneNumber || '';
  resetEmail();
});

async function saveTel() {
  try {
    const data = await accountService.updateProfile<SettingsProfile>({ phoneNumber: phoneNumber.value });
    func.showToastSuccess('Numéro enregistré');
    // L'API normalise le numéro (« 06 12… » → « +336… ») et remet la vérification à zéro.
    const savedPhone = data?.user?.phoneNumber ?? phoneNumber.value;
    emit('patch', { phoneNumber: savedPhone, isPhoneVerified: false });
    phoneNumber.value = savedPhone;
    codeVerified.value = false;
    telRequest.value = false;
    phoneCode.value = '';
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

async function verifTel() {
  try {
    await accountService.sendPhoneVerification();
    telRequest.value = true;
    func.showToastSuccess('Code envoyé');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

async function verifCodeTel() {
  try {
    await accountService.verifyPhone(phoneCode.value);
    codeVerified.value = true;
    telRequest.value = false;
    func.showToastSuccess('Téléphone vérifié');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

const showIdentityForm = ref(false);
const identityVerification = ref<IdentityVerificationStatus | null>(null);
const identityDocumentType = ref('id_card');
const identityDocumentFile = ref<File | null>(null);
const identityDocumentPreview = ref('');
const identityConsentGiven = ref(false);
const identitySubmitting = ref(false);
const identityFileInput = ref<HTMLInputElement | null>(null);

/** Ouvre le formulaire de vérification d'identité et charge le statut courant. */
async function openIdentityVerification() {
  showIdentityForm.value = true;

  try {
    identityVerification.value = await accountService.getIdentityVerification();
  } catch (error) {
    // 404 = aucune demande en cours, c'est le cas normal d'un premier dépôt.
    if (apiStatus(error) === 404) {
      identityVerification.value = null;
      return;
    }
    if (isSessionLost(error)) return;
    func.showToastError(apiMessage(error, 'Impossible de charger votre statut de vérification.'));
  }
}

function onIdentityFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  identityDocumentFile.value = file;
  identityDocumentPreview.value = file ? URL.createObjectURL(file) : '';
}

async function submitIdentityVerification() {
  if (!identityDocumentFile.value || !identityConsentGiven.value) return;
  identitySubmitting.value = true;
  try {
    await accountService.submitIdentityVerification(identityDocumentType.value, identityDocumentFile.value);
    func.showToastSuccess('Demande de vérification envoyée');
    showIdentityForm.value = false;
    await props.reloadProfile();
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur lors de l\'envoi'));
  } finally {
    identitySubmitting.value = false;
  }
}

async function cancelIdentityVerification() {
  try {
    func.showToastSuccess(await accountService.cancelIdentityVerification());
    showIdentityForm.value = false;
    identityVerification.value = null;
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur'));
  }
}
</script>
