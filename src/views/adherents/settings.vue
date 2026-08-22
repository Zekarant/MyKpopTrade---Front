<template>
  <main class="page">
    <Nav_bar />
    <div class="settings-page">
      <div class="settings-page__container">
        <!-- Header -->
        <div class="settings-page__header">
          <button @click="$router.back()" class="settings-page__back">
            <i class="bi bi-arrow-left"></i>
          </button>
          <h1 class="settings-page__title">Paramètres du profil</h1>
        </div>

        <!-- Content -->
        <div class="settings-page__content">
          <!-- Security -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-shield-lock"></i> Sécurité</h3>
            <div class="settings-card__body">
              <div v-if="!showPasswordForm" class="setting-row" @click="showPasswordForm = true">
                <div class="setting-row__left">
                  <span>Changer le mot de passe</span>
                </div>
                <i class="bi bi-chevron-right"></i>
              </div>
              <div v-else class="password-form">
                <input type="password" v-model="currentPassword" placeholder="Mot de passe actuel" class="settings-input" />
                <input type="password" v-model="newPassword" placeholder="Nouveau mot de passe" class="settings-input" />
                <input type="password" v-model="confirmPassword" placeholder="Confirmer le nouveau mot de passe" class="settings-input" />
                <div class="password-form__actions">
                  <button @click="showPasswordForm = false" class="btn-settings btn-settings--ghost">Annuler</button>
                  <button @click="savePassword" class="btn-settings btn-settings--primary">Enregistrer</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Linked Accounts -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-link-45deg"></i> Comptes liés</h3>
            <div class="settings-card__body">
              <div class="setting-row" @click="linkGoogle">
                <div class="setting-row__left">
                  <i class="bi bi-google" style="color: #4285F4;"></i>
                  <span>Google</span>
                </div>
                <span v-if="userProfile.socialAuth?.google?.id" class="setting-badge setting-badge--success">
                  <i class="bi bi-check-circle-fill"></i> Connecté
                </span>
                <span v-else class="setting-badge setting-badge--link">Lier le compte</span>
              </div>
              <div class="setting-row" @click="linkDiscord">
                <div class="setting-row__left">
                  <i class="bi bi-discord" style="color: #5865F2;"></i>
                  <span>Discord</span>
                </div>
                <span v-if="userProfile.socialAuth?.discord?.id" class="setting-badge setting-badge--success">
                  <i class="bi bi-check-circle-fill"></i> Connecté
                </span>
                <span v-else class="setting-badge setting-badge--link">Lier le compte</span>
              </div>
            </div>
          </section>

          <!-- Verifications -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-patch-check"></i> Vérifications</h3>
            <div class="settings-card__body">
              <div class="setting-row" :class="{ 'setting-row--clickable': !userProfile.isIdentityVerified }" @click="!userProfile.isIdentityVerified && openIdentityVerification()">
                <div class="setting-row__left">
                  <i class="bi bi-person-badge"></i>
                  <div class="setting-row__label-group">
                    <span>Identité vérifiée</span>
                    <small v-if="!userProfile.isIdentityVerified" class="text-muted">Cliquez pour vérifier votre identité</small>
                  </div>
                </div>
                <span v-if="userProfile.isIdentityVerified" class="setting-badge setting-badge--success">
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
                  <div class="identity-upload" @click="($refs.identityFileInput as HTMLInputElement).click()">
                    <img v-if="identityDocumentPreview" :src="identityDocumentPreview" class="identity-upload__preview" />
                    <template v-else>
                      <i class="bi bi-cloud-upload"></i>
                      <span>Cliquez pour importer votre document</span>
                    </template>
                    <input ref="identityFileInput" type="file" accept="image/*" style="display:none" @change="onIdentityFileChange" />
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
              <div class="setting-row">
                <div class="setting-row__left">
                  <i class="bi bi-envelope"></i>
                  <div class="setting-row__label-group">
                    <span>Email</span>
                    <small v-if="userProfile.email" class="text-muted">{{ userProfile.email }}</small>
                  </div>
                </div>
                <span v-if="userProfile.isEmailVerified" class="setting-badge setting-badge--success">
                  <i class="bi bi-check-circle-fill"></i> Vérifié
                </span>
                <button v-else @click="verifEmail" class="btn-settings btn-settings--sm">Vérifier</button>
              </div>
              <div class="setting-row setting-row--column">
                <div class="setting-row__top">
                  <div class="setting-row__left">
                    <i class="bi bi-phone"></i>
                    <span>Téléphone</span>
                  </div>
                  <span v-if="userProfile.isPhoneVerified || codeVerified" class="setting-badge setting-badge--success">
                    <i class="bi bi-check-circle-fill"></i> Vérifié
                  </span>
                </div>
                <div class="setting-row__inline">
                  <input type="tel" v-model="phoneNumber" class="settings-input settings-input--sm" placeholder="+33 6 12 34 56 78" />
                  <button @click="saveTel" class="btn-settings btn-settings--sm" v-if="phoneNumber && phoneNumber !== userProfile.phoneNumber">Enregistrer</button>
                  <button @click="verifTel" class="btn-settings btn-settings--sm" v-else-if="phoneNumber && !userProfile.isPhoneVerified && !telRequest">Vérifier</button>
                </div>
                <div v-if="telRequest && !codeVerified" class="setting-row__inline" style="margin-top: 8px;">
                  <input type="text" v-model="phoneCode" class="settings-input settings-input--sm" placeholder="Code reçu" />
                  <button @click="verifCodeTel" class="btn-settings btn-settings--primary btn-settings--sm">Valider</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Payment -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-credit-card"></i> Paiement</h3>
            <div class="settings-card__body">
              <div class="paypal-card">
                <div class="paypal-card__head">
                  <div class="paypal-card__brand">
                    <i class="bi bi-paypal"></i>
                    <div>
                      <div class="paypal-card__title">PayPal</div>
                      <div class="paypal-card__subtitle">Requis pour recevoir des paiements de vos ventes</div>
                    </div>
                  </div>
                  <span v-if="paypalConnected" class="setting-badge setting-badge--success">
                    <i class="bi bi-check-circle-fill"></i> Connecté
                  </span>
                  <span v-else class="setting-badge setting-badge--warning">
                    <i class="bi bi-exclamation-circle"></i> Non connecté
                  </span>
                </div>

                <p v-if="paypalConnected && paypalExpiresAt" class="paypal-card__meta">
                  <i class="bi bi-clock"></i>
                  Connexion valide jusqu'au {{ formatDate(paypalExpiresAt) }}
                </p>

                <p v-if="paypalConnected && paypalEmail" class="paypal-card__meta">
                  <i class="bi bi-envelope-check"></i>
                  Lié à <strong>{{ paypalEmail }}</strong>
                </p>

                <p v-if="!paypalConnected" class="paypal-card__hint">
                  Sans cette connexion, vous ne pourrez pas être payé pour vos ventes
                  ni rembourser vos acheteurs.
                </p>

                <div v-if="!paypalConnected" class="paypal-card__actions">
                  <button @click="connectPaypal" :disabled="paypalConnecting" class="btn-settings btn-settings--primary">
                    <i class="bi bi-paypal"></i> {{ paypalConnecting ? 'Redirection...' : 'Connecter mon compte PayPal' }}
                  </button>
                </div>

                <div v-if="paypalConnected" class="paypal-card__actions">
                    <button @click="disconnectPaypal" class="btn-settings btn-settings--danger">
                      <i class="bi bi-x-circle"></i> Déconnecter
                    </button>
                </div>
              </div>

              <!-- Stripe Connect temporairement désactivé
              <div class="paypal-card" style="margin-top: var(--space-md);">
                <div class="paypal-card__head">
                  <div class="paypal-card__brand">
                    <i class="bi bi-credit-card-2-front"></i>
                    <div>
                      <div class="paypal-card__title">Stripe</div>
                      <div class="paypal-card__subtitle">Recevez des paiements par carte bancaire (Visa, Mastercard, etc.)</div>
                    </div>
                  </div>
                  <span v-if="stripeOnboarded && stripePayoutsEnabled && stripePastDue.length === 0" class="setting-badge setting-badge--success">
                    <i class="bi bi-check-circle-fill"></i> Activé
                  </span>
                  <span v-else-if="stripePastDue.length > 0" class="setting-badge setting-badge--danger">
                    <i class="bi bi-x-circle-fill"></i> Suspendu
                  </span>
                  <span v-else-if="stripeCurrentlyDue.length > 0" class="setting-badge setting-badge--warning">
                    <i class="bi bi-exclamation-circle-fill"></i> Infos requises
                  </span>
                  <span v-else-if="stripePendingVerification.length > 0" class="setting-badge setting-badge--info">
                    <i class="bi bi-hourglass-split"></i> Vérification
                  </span>
                  <span v-else-if="stripeEventuallyDue.includes('individual.verification.document')" class="setting-badge setting-badge--identity">
                    <i class="bi bi-person-badge"></i> Identité à vérifier
                  </span>
                  <span v-else-if="stripeOnboarded" class="setting-badge setting-badge--warning">
                    <i class="bi bi-clock"></i> En attente
                  </span>
                  <span v-else class="setting-badge setting-badge--warning">
                    <i class="bi bi-exclamation-circle"></i> Non activé
                  </span>
                </div>

                <div v-if="stripeDisabledReason" class="stripe-alert stripe-alert--danger">
                  <i class="bi bi-slash-circle"></i>
                  <span>Compte désactivé : <strong>{{ stripeDisabledReason }}</strong></span>
                </div>

                <template v-if="stripePastDue.length > 0">
                  <div class="stripe-alert stripe-alert--danger">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <strong>Virements suspendus</strong> — complétez votre dossier pour rétablir les paiements.
                  </div>
                  <div class="stripe-requirements">
                    <div v-for="field in stripePastDue" :key="field" class="stripe-req-row stripe-req-row--danger">
                      <div class="stripe-req-row__label">{{ stripeFieldLabel(field) }}</div>
                      <span class="stripe-req-row__status">En retard</span>
                    </div>
                  </div>
                </template>

                <template v-else-if="stripeCurrentlyDue.length > 0">
                  <div class="stripe-alert stripe-alert--warning">
                    <i class="bi bi-exclamation-circle-fill"></i>
                    <strong>{{ stripeCurrentlyDue.length }} information{{ stripeCurrentlyDue.length > 1 ? 's' : '' }} requise{{ stripeCurrentlyDue.length > 1 ? 's' : '' }}</strong>
                  </div>
                  <div class="stripe-requirements">
                    <div v-for="field in stripeCurrentlyDue" :key="field" class="stripe-req-row stripe-req-row--warning">
                      <div class="stripe-req-row__label">{{ stripeFieldLabel(field) }}</div>
                      <span class="stripe-req-row__status">Manquant</span>
                    </div>
                  </div>
                </template>

                <template v-else-if="stripePendingVerification.length > 0 && !stripePayoutsEnabled">
                  <div class="stripe-alert stripe-alert--info">
                    <i class="bi bi-hourglass-split"></i>
                    Stripe vérifie vos informations. Les virements seront activés dès la validation.
                  </div>
                  <div class="stripe-requirements">
                    <div v-for="field in stripePendingVerification" :key="field" class="stripe-req-row stripe-req-row--info">
                      <div class="stripe-req-row__label">{{ stripeFieldLabel(field) }}</div>
                      <span class="stripe-req-row__status">En cours</span>
                    </div>
                  </div>
                </template>

                <template v-if="stripeEventuallyDue.length > 0 && stripePastDue.length === 0 && stripeCurrentlyDue.length === 0">
                  <div class="stripe-alert stripe-alert--eventually">
                    <i class="bi bi-clock-history"></i>
                    Ces informations seront requises prochainement.
                  </div>
                  <div class="stripe-requirements">
                    <div v-for="field in stripeEventuallyDue" :key="field" class="stripe-req-row stripe-req-row--eventually">
                      <div class="stripe-req-row__label">{{ stripeFieldLabel(field) }}</div>
                      <span class="stripe-req-row__status">À compléter</span>
                    </div>
                  </div>
                </template>

                <p v-else-if="!stripeOnboarded" class="paypal-card__hint">
                  Activez Stripe pour recevoir les paiements par carte bancaire de vos acheteurs
                  directement sur votre compte (KYC géré par Stripe).
                </p>

                <div v-if="showStripeEmbed" ref="stripeEmbedContainer" class="stripe-embed"></div>

                <div v-if="!showStripeEmbed" class="paypal-card__actions">
                  <button
                    v-if="!stripeOnboarded || stripePastDue.length > 0 || stripeCurrentlyDue.length > 0"
                    @click="startStripeOnboarding"
                    :disabled="stripeOnboarding"
                    :class="['btn-settings', stripePastDue.length > 0 ? 'btn-settings--danger' : 'btn-settings--primary']"
                  >
                    <i class="bi bi-credit-card-2-front"></i>
                    {{ stripeOnboarding ? 'Chargement…' : (stripePastDue.length > 0 ? 'Régulariser mon dossier Stripe' : stripeOnboarded ? 'Compléter mes infos Stripe' : 'Activer mes paiements Stripe') }}
                  </button>
                </div>
              </div>
              -->
            </div>
          </section>

          <!-- Preferences -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-sliders"></i> Préférences</h3>
            <div class="settings-card__body">
              <div class="setting-row">
                <div class="setting-row__left">
                  <i class="bi bi-chat-dots"></i>
                  <span>Autoriser les messages directs</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" :checked="userProfile.preferences?.allowDirectMessages" @change="changeAllowDirectMessages($event)" />
                  <span class="toggle__slider"></span>
                </label>
              </div>
            </div>
          </section>

          <!-- Data -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-database"></i> Mes données</h3>
            <div class="settings-card__body">
              <button class="btn-settings btn-settings--full" @click="exportUserData">
                <i class="bi bi-download"></i> Exporter mes données
              </button>
              <button v-if="!userProfile.anonymized" class="btn-settings btn-settings--full btn-settings--ghost" @click="confirmAnonymize">
                <i class="bi bi-shield-check"></i> Anonymiser mes données
              </button>
            </div>
          </section>

          <!-- Danger Zone -->
          <section v-if="userProfile.accountStatus === 'active'" class="settings-card settings-card--danger">
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
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Nav_bar from '@/components/adherents/nav_bar.vue';
import Cookies from 'js-cookie';
import axios from 'axios';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import authentificationService from '@/services/authentification.service';
import paymentService from '@/services/payment.service';
import userService from '@/services/user.service';

export default defineComponent({
  name: 'SettingsPage',
  components: { Nav_bar },
  data() {
    return {
      userProfile: {} as any,
      showPasswordForm: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      phoneNumber: '',
      phoneCode: '',
      telRequest: false,
      codeVerified: false,
      showDeleteConfirm: false,
      deleteConfirmText: '',
      paypalConnected: false,
      paypalExpiresAt: null as string | null,
      paypalEmail: null as string | null,
      paypalConnecting: false,
      stripeOnboarded: false,
      stripePayoutsEnabled: false,
      stripeChargesEnabled: false,
      stripeOnboarding: false,
      showStripeEmbed: false,
      showIdentityForm: false,
      identityVerification: null as { verification: { status: string; submittedAt: string; rejectionReason?: string }; userVerification: { isVerified: boolean } } | null,
      identityDocumentType: 'id_card',
      identityDocumentFile: null as File | null,
      identityDocumentPreview: '',
      identityConsentGiven: false,
      identitySubmitting: false,
      stripeCurrentlyDue: [] as string[],
      stripeEventuallyDue: [] as string[],
      stripePastDue: [] as string[],
      stripePendingVerification: [] as string[],
      stripeDisabledReason: null as string | null,
      pendingDeletion: null as { scheduledFor: string } | null,
    };
  },
  async mounted() {
    await this.loadProfile();
    await this.loadPaypalStatus();
    await Promise.all([this.loadStripeStatus(), this.loadStripeRequirements()]);
    this.loadDeletionStatus();
  },
  methods: {
    async loadProfile() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        this.userProfile = res.data.user || res.data;
        this.phoneNumber = this.userProfile.phoneNumber || '';
      } catch (e: any) {
        if (e.response?.status === 401) authentificationService.verifSession();
      }
    },
    async savePassword() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/update-password`, {
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
          confirmPassword: this.confirmPassword
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        (this as any).$func.showToastSuccess(res.data.message);
        this.showPasswordForm = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      } catch (e: any) {
        if (e.response?.data?.code === 'TOKEN_EXPIRED') authentificationService.verifSession();
        else (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    linkGoogle() {
      if (!this.userProfile.socialAuth?.google?.id) {
        const sessionToken = Cookies.get('sessionToken');
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google/link?token=${sessionToken}`;
      }
    },
    linkDiscord() {
      if (!this.userProfile.socialAuth?.discord?.id) {
        const sessionToken = Cookies.get('sessionToken');
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/discord/link?token=${sessionToken}`;
      }
    },
    async verifEmail() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-verification-email`, {}, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        (this as any).$func.showToastSuccess('Email de vérification envoyé');
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async saveTel() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          phoneNumber: this.phoneNumber
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        (this as any).$func.showToastSuccess('Numéro enregistré');
        this.userProfile.phoneNumber = this.phoneNumber;
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async verifTel() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-phone-verification`, {}, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        this.telRequest = true;
        (this as any).$func.showToastSuccess('Code envoyé');
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async verifCodeTel() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-phone`, {
          code: this.phoneCode
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        this.codeVerified = true;
        this.telRequest = false;
        (this as any).$func.showToastSuccess('Téléphone vérifié');
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async changeAllowDirectMessages(event: Event) {
      const checked = (event.target as HTMLInputElement).checked;
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          preferences: { allowDirectMessages: checked }
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async exportUserData() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me/data-export`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        // Trigger download as JSON file
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mykpoptrade-export.json';
        a.click();
        URL.revokeObjectURL(url);
      } catch (e: any) {
        (this as any).$func.showToastError("Erreur lors de l'export");
      }
    },
    async confirmAnonymize() {
      if (!confirm('Êtes-vous sûr de vouloir anonymiser vos données ? Cette action est irréversible.')) return;
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/me/anonymize`, {
          confirmation: true
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        (this as any).$func.showToastSuccess(res.data.message);
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async requestAccountDeletion() {
      if (this.deleteConfirmText !== 'SUPPRIMER') return;
      try {
        const res = await userService.requestAccountDeletion({ confirmation: true });
        (this as any).$func.showToastSuccess(res.message || 'Suppression programmée');
        this.showDeleteConfirm = false;
        this.deleteConfirmText = '';
        if (res.scheduledDeletionDate) {
          this.pendingDeletion = { scheduledFor: res.scheduledDeletionDate };
        } else {
          await this.loadProfile();
          this.loadDeletionStatus();
        }
      } catch (e: any) {
        if (e.response?.data?.code === 'TOKEN_EXPIRED') authentificationService.verifSession();
        else (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async cancelDeletion() {
      try {
        const res = await userService.cancelAccountDeletion();
        (this as any).$func.showToastSuccess(res.message || 'Suppression annulée');
        this.pendingDeletion = null;
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    loadDeletionStatus() {
      const scheduled = (this.userProfile as any)?.scheduledDeletionDate;
      this.pendingDeletion = scheduled ? { scheduledFor: scheduled } : null;
    },
    async loadPaypalStatus() {
      try {
        const res = await paymentService.getPayPalConnectionStatus();
        this.paypalConnected = !!res.connected;
        this.paypalExpiresAt = res.expiresAt || null;
        this.paypalEmail = res.email || null;
      } catch {
        this.paypalConnected = false;
        this.paypalExpiresAt = null;
        this.paypalEmail = null;
      }
    },
    async connectPaypal() {
      this.paypalConnecting = true;
      try {
        const res = await paymentService.getPayPalConnectUrl();
        if (res.connectUrl) {
          window.location.href = res.connectUrl;
        }
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Impossible de générer l\'URL PayPal');
        this.paypalConnecting = false;
      }
    },
    async loadStripeStatus() {
      try {
        const res = await paymentService.getStripeAccountStatus();
        this.stripeOnboarded = !!res.onboarded;
        this.stripePayoutsEnabled = !!res.payoutsEnabled;
        this.stripeChargesEnabled = !!res.chargesEnabled;
      } catch {
        this.stripeOnboarded = false;
        this.stripePayoutsEnabled = false;
        this.stripeChargesEnabled = false;
      }
    },
    async loadStripeRequirements() {
      try {
        const res = await paymentService.getStripeAccountRequirements();
        const r = res.requirements;
        this.stripeCurrentlyDue = r.currently_due ?? [];
        this.stripeEventuallyDue = r.eventually_due ?? [];
        this.stripePastDue = r.past_due ?? [];
        this.stripePendingVerification = r.pending_verification ?? [];
        this.stripeDisabledReason = r.disabled_reason ?? null;
      } catch {
        this.stripeCurrentlyDue = [];
        this.stripeEventuallyDue = [];
        this.stripePastDue = [];
        this.stripePendingVerification = [];
        this.stripeDisabledReason = null;
      }
    },
    async startStripeOnboarding() {
      this.stripeOnboarding = true;
      try {
        const { clientSecret } = await paymentService.getStripeAccountSession();
        this.showStripeEmbed = true;

        await this.$nextTick();

        const instance = await loadConnectAndInitialize({
          publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
          fetchClientSecret: () => Promise.resolve(clientSecret),
        });

        const component = instance.create('account-onboarding');
        component.setCollectionOptions({
          fields: 'currently_due',
          futureRequirements: 'omit',
        });
        component.setOnExit(async () => {
          this.showStripeEmbed = false;
          await Promise.all([this.loadStripeStatus(), this.loadStripeRequirements()]);
        });

        (this.$refs.stripeEmbedContainer as HTMLElement).appendChild(component);
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Impossible de charger le formulaire Stripe');
        this.showStripeEmbed = false;
      } finally {
        this.stripeOnboarding = false;
      }
    },
    async openIdentityVerification() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/verification/identity/session`, {}, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        const data = res.data;

        if (data.method === 'stripe') {
          const { loadStripe } = await import('@stripe/stripe-js');
          const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
          if (!stripe) throw new Error('Stripe non disponible');

          const { error } = await stripe.verifyIdentity(data.clientSecret);
          if (error) {
            if (error.code !== 'session_cancelled') {
              (this as unknown as { $func: { showToastError(m: string): void } }).$func.showToastError(error.message ?? 'Erreur lors de la vérification');
            }
          } else {
            this.showIdentityForm = true;
            this.identityVerification = { verification: { status: 'pending', submittedAt: new Date().toISOString() }, userVerification: { isVerified: false } };
          }
        } else {
          // method === 'manual' → charger le statut existant puis afficher le formulaire
          this.showIdentityForm = true;
          try {
            const statusRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/verification/identity/status/`, {
              headers: { Authorization: `Bearer ${sessionToken}` }
            });
            this.identityVerification = statusRes.data;
          } catch (statusErr: unknown) {
            if ((statusErr as { response?: { status?: number } })?.response?.status === 404) this.identityVerification = null;
          }
        }
      } catch (e: any) {
        if (e.response?.data?.code === 'TOKEN_EXPIRED') authentificationService.verifSession();
        else (this as unknown as { $func: { showToastError(m: string): void } }).$func.showToastError(e.response?.data?.message || 'Impossible de lancer la vérification');
      }
    },
    onIdentityFileChange(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0] ?? null;
      this.identityDocumentFile = file;
      this.identityDocumentPreview = file ? URL.createObjectURL(file) : '';
    },
    async submitIdentityVerification() {
      if (!this.identityDocumentFile || !this.identityConsentGiven) return;
      this.identitySubmitting = true;
      const sessionToken = Cookies.get('sessionToken');
      const formData = new FormData();
      formData.append('documentType', this.identityDocumentType);
      formData.append('consentGiven', 'true');
      formData.append('document', this.identityDocumentFile);
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/verification/identity`, formData, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        (this as any).$func.showToastSuccess('Demande de vérification envoyée');
        this.showIdentityForm = false;
        await this.loadProfile();
      } catch (e: any) {
        if (e.response?.data?.code === 'TOKEN_EXPIRED') authentificationService.verifSession();
        else (this as unknown as { $func: { showToastError(m: string): void } }).$func.showToastError(e.response?.data?.message || 'Erreur lors de l\'envoi');
      } finally {
        this.identitySubmitting = false;
      }
    },
    async cancelIdentityVerification() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/verification/identity/cancel`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        (this as unknown as { $func: { showToastSuccess(m: string): void } }).$func.showToastSuccess(res.data.message);
        this.showIdentityForm = false;
        this.identityVerification = null;
      } catch (e: any) {
        if (e.response?.data?.code === 'TOKEN_EXPIRED') authentificationService.verifSession();
        else (this as unknown as { $func: { showToastError(m: string): void } }).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async disconnectPaypal() {
      if (!confirm('Voulez-vous vraiment déconnecter votre compte PayPal ? Vous ne pourrez plus recevoir de paiements tant qu\'il n\'est pas reconnecté.')) return;
      try {
        const res = await paymentService.disconnectPayPal();
        (this as any).$func.showToastSuccess(res.message || 'Compte PayPal déconnecté');
        this.paypalConnected = false;
        this.paypalExpiresAt = null;
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    stripeFieldLabel(field: string): string {
      const labels: Record<string, string> = {
        'individual.verification.document': 'Document de vérification',
        'individual.verification.additional_document': 'Document supplémentaire',
        'individual.id_number': "Numéro d'identité nationale",
        'individual.first_name': 'Prénom',
        'individual.last_name': 'Nom',
        'individual.dob.day': 'Date de naissance (jour)',
        'individual.dob.month': 'Date de naissance (mois)',
        'individual.dob.year': 'Date de naissance (année)',
        'individual.address.line1': 'Adresse',
        'individual.address.city': 'Ville',
        'individual.address.postal_code': 'Code postal',
        'individual.address.state': 'Département / Région',
        'individual.address.country': 'Pays',
        'individual.phone': 'Numéro de téléphone',
        'individual.email': 'Adresse e-mail',
        'individual.ssn_last_4': '4 derniers chiffres SSN',
        'individual.nationality': 'Nationalité',
        'business_profile.url': 'URL du site web',
        'business_profile.mcc': "Code d'activité (MCC)",
        'business_profile.product_description': "Description de l'activité",
        'external_account': 'Compte bancaire (IBAN)',
        'tos_acceptance.date': "Acceptation des conditions d'utilisation",
        'tos_acceptance.ip': "Acceptation des conditions d'utilisation",
        'bank_account.account_number': 'Numéro de compte bancaire',
        'bank_account.routing_number': 'Code de routage bancaire',
        'company.name': "Nom de l'entreprise",
        'company.tax_id': 'Numéro de TVA / SIRET',
        'company.address.line1': "Adresse de l'entreprise",
        'company.address.city': "Ville de l'entreprise",
        'company.address.postal_code': "Code postal de l'entreprise",
      };
      return labels[field] ?? field.replace(/[_.]/g, ' ');
    },
    formatDate(iso: string) {
      const date = new Date(iso);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    },
  }
});
</script>

<style lang="scss" scoped>
.settings-page {
  padding: var(--space-xl) var(--space-md);
  padding-top: calc(var(--navbar-height) + var(--space-xl));
  min-height: 100vh;
  background: var(--bg-primary);
}

.settings-page__container {
  max-width: 680px;
  margin: 0 auto;
}

.settings-page__header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.settings-page__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--surface-hover);
    border-color: var(--accent-pink);
    color: var(--accent-pink);
  }
}

.settings-page__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.settings-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

// Card
.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &--danger {
    border-color: rgba(220, 53, 69, 0.3);
  }
}

.settings-card__title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  i { color: var(--accent-pink); }

  &--danger i { color: #dc3545; }
}

.settings-card__body {
  padding: var(--space-sm) 0;
}

// Rows
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover { background: var(--surface-hover); }

  &--column {
    flex-direction: column;
    align-items: stretch;
    cursor: default;
    &:hover { background: transparent; }
  }
}

.setting-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.setting-row__left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-primary);
  font-size: var(--font-size-sm);

  i { font-size: 1.1rem; color: var(--text-muted); }
}

.setting-row__label-group {
  display: flex;
  flex-direction: column;

  small { font-size: var(--font-size-xs); }
}

.setting-row__inline {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

// Badges
.setting-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;

  &--success {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
  &--warning {
    background: rgba(255, 193, 7, 0.1);
    color: #e0a800;
  }
  &--link {
    background: rgba(255, 45, 120, 0.1);
    color: var(--accent-pink);
    cursor: pointer;
  }
  &--danger {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
  &--info {
    background: rgba(13, 110, 253, 0.1);
    color: #0d6efd;
  }
  &--identity {
    background: rgba(111, 66, 193, 0.1);
    color: #6f42c1;
  }
}

.stripe-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);

  i { flex-shrink: 0; margin-top: 2px; }

  &--danger {
    background: rgba(220, 53, 69, 0.08);
    color: #c82333;
    border: 1px solid rgba(220, 53, 69, 0.2);
  }
  &--warning {
    background: rgba(255, 193, 7, 0.08);
    color: #856404;
    border: 1px solid rgba(255, 193, 7, 0.2);
  }
  &--info {
    background: rgba(13, 110, 253, 0.08);
    color: #084298;
    border: 1px solid rgba(13, 110, 253, 0.2);
  }
  &--eventually {
    background: rgba(108, 117, 125, 0.08);
    color: #495057;
    border: 1px solid rgba(108, 117, 125, 0.2);
  }
}

// Inputs
.settings-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
  margin-bottom: var(--space-sm);

  &:focus {
    outline: none;
    border-color: var(--accent-pink);
    box-shadow: 0 0 0 3px rgba(255, 45, 120, 0.1);
  }

  &--sm {
    flex: 1;
    margin-bottom: 0;
  }
}

// Buttons
.btn-settings {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);

  &--primary {
    background: var(--accent-gradient);
    color: white;
    &:hover { box-shadow: 0 4px 12px rgba(255, 45, 120, 0.3); }
  }

  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--surface-border);
    &:hover { background: var(--surface-hover); }
  }

  &--danger {
    background: #dc3545;
    color: white;
    &:hover { background: #c82333; }
  }

  &--sm {
    padding: 6px 12px;
    font-size: var(--font-size-xs);
    white-space: nowrap;
  }

  &--full {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    margin: var(--space-xs) var(--space-lg);
    width: calc(100% - var(--space-lg) * 2);
  }
}

// Password form
.password-form {
  padding: var(--space-md) var(--space-lg);
}

.password-form__actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

// Delete confirm
.delete-confirm {
  padding: var(--space-md) var(--space-lg);
}

.delete-confirm__text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

// Toggle
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input { opacity: 0; width: 0; height: 0; }
}

.toggle__slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--surface-border);
  border-radius: 24px;
  transition: var(--transition-fast);

  &::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: var(--transition-fast);
  }
}

.toggle input:checked + .toggle__slider {
  background: var(--accent-pink);
}

.toggle input:checked + .toggle__slider::before {
  transform: translateX(20px);
}

// PayPal card
.paypal-card {
  margin: var(--space-md) var(--space-lg);
  padding: var(--space-md);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.paypal-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}
.paypal-card__brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  > i {
    font-size: 1.5rem;
    color: #003087;
  }
}
.paypal-card__title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-base);
}
.paypal-card__subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-top: 2px;
}
.paypal-card__meta,
.paypal-card__hint {
  font-size: var(--font-size-xs);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.paypal-card__meta { color: var(--text-muted); }
.paypal-card__hint { color: #e0a800; }
.paypal-card__email-form {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  flex-wrap: wrap;
  margin-top: var(--space-sm);
}
.paypal-card__input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid var(--surface-border, #ddd);
  border-radius: var(--radius-md, 8px);
  padding: 0.5rem 0.75rem;
  flex: 1;
  min-width: 200px;

  i { color: var(--text-muted); }
}
.paypal-card__input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
  color: var(--text-primary);
}
.paypal-card__actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-xs);
}

.stripe-requirements {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stripe-req-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);

  &__label {
    font-weight: 500;
    color: var(--text-primary);
  }

  &__status {
    font-weight: 600;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  &--danger {
    background: rgba(220, 53, 69, 0.06);
    border: 1px solid rgba(220, 53, 69, 0.15);

    .stripe-req-row__status {
      background: rgba(220, 53, 69, 0.12);
      color: #c82333;
    }
  }

  &--warning {
    background: rgba(255, 193, 7, 0.06);
    border: 1px solid rgba(255, 193, 7, 0.2);

    .stripe-req-row__status {
      background: rgba(255, 193, 7, 0.15);
      color: #856404;
    }
  }

  &--info {
    background: rgba(13, 110, 253, 0.06);
    border: 1px solid rgba(13, 110, 253, 0.15);

    .stripe-req-row__status {
      background: rgba(13, 110, 253, 0.12);
      color: #084298;
    }
  }

  &--eventually {
    background: rgba(108, 117, 125, 0.06);
    border: 1px solid rgba(108, 117, 125, 0.15);

    .stripe-req-row__status {
      background: rgba(108, 117, 125, 0.12);
      color: #495057;
    }
  }
}

.stripe-embed {
  width: 100%;
  margin-top: var(--space-sm);
}

.identity-form {
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  border-top: 1px solid var(--surface-border);

  &__info {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;

    &--danger { color: #c82333; }
  }

  &__actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
  }
}

.identity-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 120px;
  border: 2px dashed var(--surface-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--bg-primary);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  transition: border-color var(--transition-fast);

  &:hover { border-color: var(--accent-pink); }

  i { font-size: 1.8rem; }

  &__preview {
    max-height: 120px;
    max-width: 100%;
    border-radius: var(--radius-sm);
    object-fit: contain;
  }
}

.identity-consent {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1.4;

  input[type="checkbox"] { flex-shrink: 0; margin-top: 2px; }
}

// Responsive
@media (max-width: 640px) {
  .settings-page {
    padding: var(--space-md) var(--space-sm);
    padding-top: calc(var(--navbar-height) + var(--space-md));
  }

  .settings-page__title {
    font-size: var(--font-size-xl);
  }

  .setting-row__inline {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-settings--sm {
    width: 100%;
    justify-content: center;
  }
}
</style>
