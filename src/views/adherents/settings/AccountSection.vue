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
        <button v-else @click="verifEmail" class="btn-settings btn-settings--sm">Vérifier</button>
      </div>
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
          <input type="tel" v-model="phoneNumber" class="settings-input settings-input--sm" placeholder="+33 6 12 34 56 78" />
          <button @click="saveTel" class="btn-settings btn-settings--sm" v-if="phoneNumber && phoneNumber !== profile.phoneNumber">Enregistrer</button>
          <button @click="verifTel" class="btn-settings btn-settings--sm" v-else-if="phoneNumber && !profile.isPhoneVerified && !telRequest">Vérifier</button>
        </div>
        <div v-if="telRequest && !codeVerified" class="setting-row__inline" style="margin-top: 8px;">
          <input
            type="text"
            v-model="phoneCode"
            class="settings-input settings-input--sm"
            placeholder="Code à 6 chiffres"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
          />
          <button @click="verifCodeTel" class="btn-settings btn-settings--primary btn-settings--sm">Valider</button>
          <button @click="verifTel" class="btn-settings btn-settings--sm">Renvoyer</button>
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
          <select v-model="identityDocumentType" class="settings-input">
            <option value="id_card">Carte d'identité</option>
            <option value="passport">Passeport</option>
            <option value="driver_license">Permis de conduire</option>
          </select>
          <div class="identity-upload" @click="identityFileInput?.click()">
            <img v-if="identityDocumentPreview" :src="identityDocumentPreview" class="identity-upload__preview" />
            <template v-else>
              <i class="bi bi-cloud-upload"></i>
              <span>Cliquez pour importer votre document</span>
            </template>
            <input ref="identityFileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onIdentityFileChange" />
          </div>
          <label class="identity-consent">
            <input type="checkbox" v-model="identityConsentGiven" />
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
import { ref, watch } from 'vue';
import { func } from '@/function';
import { api, apiMessage, apiStatus, formatDate, isSessionLost } from './shared';
import type { SectionProps, SettingsProfile } from './shared';

const props = defineProps<SectionProps>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

interface IdentityVerificationStatus {
  verification: { status: string; submittedAt: string; rejectionReason?: string };
  userVerification: { isVerified: boolean };
}

// --- Email ---

async function verifEmail() {
  try {
    await api.post('/api/auth/send-verification-email', {});
    func.showToastSuccess('Email de vérification envoyé');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

// --- Téléphone ---

const phoneNumber = ref(props.profile.phoneNumber || '');
const phoneCode = ref('');
const telRequest = ref(false);
const codeVerified = ref(false);

// Profil rechargé : le champ repart du numéro enregistré.
watch(() => props.profile, (profile) => {
  phoneNumber.value = profile.phoneNumber || '';
});

async function saveTel() {
  try {
    const response = await api.put('/api/auth/profile', { phoneNumber: phoneNumber.value });
    func.showToastSuccess('Numéro enregistré');
    // L'API normalise le numéro (« 06 12… » → « +336… ») et remet la
    // vérification à zéro : l'écran doit refléter les deux, sinon le badge
    // « Vérifié » restait affiché pour le nouveau numéro.
    const savedPhone: string = response.data?.user?.phoneNumber ?? phoneNumber.value;
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
    await api.post('/api/auth/send-phone-verification', {});
    telRequest.value = true;
    func.showToastSuccess('Code envoyé');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

async function verifCodeTel() {
  try {
    await api.post('/api/auth/verify-phone', { code: phoneCode.value });
    codeVerified.value = true;
    telRequest.value = false;
    func.showToastSuccess('Téléphone vérifié');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

// --- Identité ---

const showIdentityForm = ref(false);
const identityVerification = ref<IdentityVerificationStatus | null>(null);
const identityDocumentType = ref('id_card');
const identityDocumentFile = ref<File | null>(null);
const identityDocumentPreview = ref('');
const identityConsentGiven = ref(false);
const identitySubmitting = ref(false);
const identityFileInput = ref<HTMLInputElement | null>(null);

/**
 * Ouvre le formulaire de vérification d'identité et charge le statut courant.
 *
 * Cette fonction commençait par un POST /api/verification/identity/session
 * pour choisir entre Stripe Identity et le dépôt manuel. Cette route n'a
 * jamais existé côté API : l'appel partait en 404 et l'utilisateur ne voyait
 * qu'une erreur, sans jamais atteindre le formulaire. Stripe étant retiré,
 * le dépôt manuel est le seul parcours — c'est aussi celui qu'implémente
 * déjà correctement le bandeau de profil.
 */
async function openIdentityVerification() {
  showIdentityForm.value = true;

  try {
    const statusRes = await api.get('/api/verification/identity/status/');
    identityVerification.value = statusRes.data;
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
  const formData = new FormData();
  formData.append('documentType', identityDocumentType.value);
  formData.append('consentGiven', 'true');
  formData.append('document', identityDocumentFile.value);
  try {
    await api.post('/api/verification/identity', formData);
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
    const res = await api.delete('/api/verification/identity/cancel');
    func.showToastSuccess(res.data.message);
    showIdentityForm.value = false;
    identityVerification.value = null;
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur'));
  }
}
</script>
