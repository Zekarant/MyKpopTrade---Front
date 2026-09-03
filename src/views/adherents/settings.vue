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

          <!-- Billing info (pré-remplissage PayPal) -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-receipt"></i> Informations de facturation</h3>
            <div class="settings-card__body">
              <div class="setting-row setting-row--column">
                <div class="setting-row__top">
                  <div class="setting-row__left">
                    <i class="bi bi-person-vcard"></i>
                    <span>Nom légal</span>
                  </div>
                </div>
                <div class="setting-row__inline">
                  <input type="text" v-model="legalName" maxlength="300" class="settings-input settings-input--sm" placeholder="Nom légal complet" />
                  <button @click="saveLegalName" class="btn-settings btn-settings--sm" v-if="legalNameChanged">Enregistrer</button>
                </div>
              </div>
              <div class="setting-row setting-row--column">
                <div class="setting-row__top">
                  <div class="setting-row__left">
                    <i class="bi bi-geo-alt"></i>
                    <span>Adresse</span>
                  </div>
                </div>
                <input type="text" v-model="addressStreetLine1" maxlength="200" class="settings-input" placeholder="Rue et numéro" style="margin-top: 8px;" />
                <input type="text" v-model="addressStreetLine2" maxlength="200" class="settings-input" placeholder="Complément (optionnel)" />
                <div class="setting-row__inline" style="margin-top: 0;">
                  <input type="text" v-model="addressPostalCode" maxlength="16" class="settings-input settings-input--sm" placeholder="Code postal" />
                  <input type="text" v-model="addressCity" maxlength="100" class="settings-input settings-input--sm" placeholder="Ville" />
                  <input type="text" v-model="addressCountry" maxlength="2" class="settings-input settings-input--sm" placeholder="FR" style="flex: 0 0 70px;" />
                </div>
                <button @click="saveAddress" class="btn-settings btn-settings--sm" v-if="addressChanged" style="align-self: flex-start; margin-top: 8px;">Enregistrer</button>
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

                <p v-if="paypalEmail || paypalLegalName" class="paypal-card__meta">
                  <i class="bi bi-envelope-check"></i>
                  Lié à <strong>{{ paypalEmail || paypalLegalName }}</strong>
                </p>

                <p v-if="paypalMerchantId" class="paypal-card__meta">
                  <i class="bi bi-hash"></i>
                  Identifiant PayPal : <strong>{{ paypalMerchantId }}</strong>
                </p>

                <p v-if="paypalConnected && paypalScopes.length" class="paypal-card__meta">
                  <i class="bi bi-shield-check"></i>
                  Autorisations accordées à MyKpopTrade :
                  <strong>{{ paypalScopeLabels }}</strong>
                </p>

                <!-- Vendeur relié mais bloqué : on affiche l'action exacte à mener. -->
                <p v-if="paypalBlockMessage" class="paypal-card__hint">
                  {{ paypalBlockMessage }}
                </p>

                <div class="paypal-card__actions">
                  <button
                    v-if="!paypalMerchantId || paypalBlockReason === 'CONSENT_MISSING'"
                    @click="connectPaypal"
                    :disabled="paypalConnecting"
                    class="btn-settings btn-settings--primary"
                  >
                    <i class="bi bi-paypal"></i>
                    {{ paypalConnecting ? 'Redirection...' : (paypalMerchantId ? 'Relancer la connexion PayPal' : 'Connecter mon compte PayPal') }}
                  </button>

                  <button
                    v-if="paypalMerchantId && paypalBlockReason && paypalBlockReason !== 'CONSENT_MISSING'"
                    @click="refreshPaypalStatus"
                    :disabled="paypalRefreshing"
                    class="btn-settings btn-settings--primary"
                  >
                    <i class="bi bi-arrow-clockwise"></i>
                    {{ paypalRefreshing ? 'Vérification...' : 'Rafraîchir mon statut' }}
                  </button>

                  <button
                    v-if="paypalMerchantId"
                    @click="disconnectPaypal"
                    class="btn-settings btn-settings--danger"
                  >
                    <i class="bi bi-x-circle"></i> Déconnecter
                  </button>
                </div>
              </div>

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

          <!-- Double authentification -->
          <TwoFactorCard />

          <!-- Data -->
          <section class="settings-card">
            <h3 class="settings-card__title"><i class="bi bi-database"></i> Mes données</h3>
            <div class="settings-card__body">
              <!-- RGPD art. 7-3 : le retrait du consentement doit être aussi
                   simple que son recueil à l'inscription. -->
              <label class="consent-row">
                <input
                  type="checkbox"
                  :checked="marketingConsent"
                  :disabled="savingConsent"
                  @change="toggleMarketingConsent"
                />
                <span class="consent-row__label">
                  Recevoir les actualités et bons plans par email
                  <small>Facultatif. Vous pouvez changer d'avis à tout moment.</small>
                </span>
              </label>

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

    <!-- Popup de pré-remplissage PayPal : on confirme l'identité du vendeur
         avant de générer le lien d'onboarding, pour que PayPal réconcilie
         un compte existant plutôt que d'en créer un doublon. -->
    <div v-if="paypalInfoModal.open" class="modal-overlay" @click.self="closePaypalInfoModal">
      <div class="modal-card">
        <h2>Vérifiez vos informations</h2>

        <label>E-mail</label>
        <input type="email" :value="userProfile.email" disabled />

        <label>Nom légal complet</label>
        <input
          type="text"
          v-model.trim="legalName"
          maxlength="300"
          placeholder="Prénom et nom"
        />

        <label>Adresse</label>
        <input type="text" v-model.trim="addressStreetLine1" maxlength="200" placeholder="Rue et numéro" />
        <input type="text" v-model.trim="addressStreetLine2" maxlength="200" placeholder="Complément (optionnel)" />
        <div class="modal-inline">
          <input type="text" v-model.trim="addressPostalCode" maxlength="16" placeholder="Code postal" />
          <input type="text" v-model.trim="addressCity" maxlength="100" placeholder="Ville" />
          <input type="text" v-model.trim="addressCountry" maxlength="2" placeholder="FR" style="flex: 0 0 70px;" />
        </div>

        <p v-if="paypalInfoError" class="modal-error">{{ paypalInfoError }}</p>

        <div class="modal-actions">
          <button class="btn-settings btn-settings--ghost" @click="closePaypalInfoModal" :disabled="paypalConnecting">
            Annuler
          </button>
          <button class="btn-settings btn-settings--primary" @click="submitPaypalInfoAndConnect" :disabled="paypalConnecting">
            {{ paypalConnecting ? 'Redirection...' : 'Continuer vers PayPal' }}
          </button>
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
import authentificationService from '@/services/authentification.service';
import paymentService from '@/services/payment.service';
import type { PayPalBlockReason } from '@/services/payment.service';
import userService from '@/services/user.service';
import TwoFactorCard from '@/components/adherents/TwoFactorCard.vue';

export default defineComponent({
  name: 'SettingsPage',
  components: { Nav_bar, TwoFactorCard },
  data() {
    return {
      userProfile: {} as any,
      savingConsent: false,
      showPasswordForm: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      phoneNumber: '',
      phoneCode: '',
      telRequest: false,
      codeVerified: false,
      legalName: '',
      addressStreetLine1: '',
      addressStreetLine2: '',
      addressPostalCode: '',
      addressCity: '',
      addressCountry: 'FR',
      showDeleteConfirm: false,
      deleteConfirmText: '',
      paypalConnected: false,
      paypalEmail: null as string | null,
      paypalLegalName: null as string | null,
      paypalMerchantId: null as string | null,
      paypalScopes: [] as string[],
      paypalBlockReason: null as PayPalBlockReason | null,
      paypalBlockMessage: null as string | null,
      paypalConnecting: false,
      paypalRefreshing: false,
      paypalInfoModal: { open: false },
      paypalInfoError: '',
      showIdentityForm: false,
      identityVerification: null as { verification: { status: string; submittedAt: string; rejectionReason?: string }; userVerification: { isVerified: boolean } } | null,
      identityDocumentType: 'id_card',
      identityDocumentFile: null as File | null,
      identityDocumentPreview: '',
      identityConsentGiven: false,
      identitySubmitting: false,
      pendingDeletion: null as { scheduledFor: string } | null,
    };
  },
  computed: {
    /** Consentement marketing courant, tel que renvoyé par le profil. */
    marketingConsent(): boolean {
      return this.userProfile?.marketingConsent === true;
    },

    /** Traduit les scopes PayPal en libellés lisibles par le vendeur. */
    paypalScopeLabels(): string {
      const labels: Record<string, string> = {
        'https://uri.paypal.com/services/payments/realtimepayment': 'encaissement',
        'https://uri.paypal.com/services/payments/payment/authcapture': 'capture',
        'https://uri.paypal.com/services/payments/refund': 'remboursement',
        'https://uri.paypal.com/services/payments/partnerfee': 'commission plateforme'
      };
      const readable = this.paypalScopes
        .map((scope) => labels[scope])
        .filter(Boolean);
      return readable.length ? readable.join(', ') : `${this.paypalScopes.length} autorisation(s)`;
    },
    legalNameChanged(): boolean {
      return this.legalName !== (this.userProfile.legalName || '');
    },
    addressChanged(): boolean {
      const current = this.userProfile.address || {};
      return (
        this.addressStreetLine1 !== (current.streetLine1 || '') ||
        this.addressStreetLine2 !== (current.streetLine2 || '') ||
        this.addressPostalCode !== (current.postalCode || '') ||
        this.addressCity !== (current.city || '') ||
        this.addressCountry !== (current.country || 'FR')
      );
    }
  },
  async mounted() {
    await this.loadProfile();
    // Retour du parcours d'onboarding PayPal : on force un statut frais plutôt
    // que de croire le query param.
    const params = new URLSearchParams(window.location.search);
    const justOnboarded = params.get('paypal_onboarding') === 'complete';
    const onboardingError = params.get('paypal_error');

    await this.loadPaypalStatus(justOnboarded);

    if (justOnboarded && !this.paypalConnected && this.paypalBlockMessage) {
      (this as any).$func.showToastError(this.paypalBlockMessage);
    } else if (justOnboarded) {
      (this as any).$func.showToastSuccess('Votre compte PayPal est connecté.');
    } else if (onboardingError) {
      (this as any).$func.showToastError(
        'La connexion PayPal n\'a pas pu être finalisée. Merci de réessayer.'
      );
    }

    this.loadDeletionStatus();
  },
  methods: {
    /**
     * Bascule le consentement marketing (RGPD art. 7-3).
     * En cas d'échec, la case revient à son état serveur : on n'affiche jamais
     * un consentement qui n'a pas été réellement enregistré.
     */
    async toggleMarketingConsent(event: Event) {
      const desired = (event.target as HTMLInputElement).checked;
      this.savingConsent = true;
      try {
        await userService.updateConsents({ marketing: desired });
        this.userProfile = { ...this.userProfile, marketingConsent: desired };
        this.$func.showToastSuccess(
          desired
            ? 'Vous recevrez désormais nos actualités par email.'
            : 'Vous ne recevrez plus d\'emails d\'actualités.'
        );
      } catch {
        (event.target as HTMLInputElement).checked = !desired;
        this.$func.showToastError(
          'Impossible d\'enregistrer votre choix. Veuillez réessayer.'
        );
      } finally {
        this.savingConsent = false;
      }
    },

    async loadProfile() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        this.userProfile = res.data.user || res.data;
        this.phoneNumber = this.userProfile.phoneNumber || '';
        this.legalName = this.userProfile.legalName || '';
        this.addressStreetLine1 = this.userProfile.address?.streetLine1 || '';
        this.addressStreetLine2 = this.userProfile.address?.streetLine2 || '';
        this.addressPostalCode = this.userProfile.address?.postalCode || '';
        this.addressCity = this.userProfile.address?.city || '';
        this.addressCountry = this.userProfile.address?.country || 'FR';
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
    async saveLegalName() {
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          legalName: this.legalName
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        (this as any).$func.showToastSuccess('Nom légal enregistré');
        this.userProfile.legalName = this.legalName;
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    async saveAddress() {
      const hasAny = this.addressStreetLine1 || this.addressStreetLine2 || this.addressPostalCode || this.addressCity;
      const hasRequired = this.addressStreetLine1 && this.addressPostalCode && this.addressCity;
      if (hasAny && !hasRequired) {
        (this as any).$func.showToastError('Adresse incomplète : rue, code postal et ville sont requis');
        return;
      }
      const address = hasRequired ? {
        streetLine1: this.addressStreetLine1,
        streetLine2: this.addressStreetLine2 || undefined,
        postalCode: this.addressPostalCode,
        city: this.addressCity,
        country: this.addressCountry || 'FR'
      } : null;
      const sessionToken = Cookies.get('sessionToken');
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          address
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        (this as any).$func.showToastSuccess('Adresse enregistrée');
        this.userProfile.address = address;
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
    async loadPaypalStatus(refresh = false) {
      try {
        const res = await paymentService.getPayPalAccountStatus(refresh);
        this.paypalConnected = !!res.connected;
        this.paypalEmail = res.email || null;
        this.paypalLegalName = res.legalName || null;
        this.paypalMerchantId = res.merchantId || null;
        this.paypalScopes = res.scopes || [];
        this.paypalBlockReason = res.blockReason;
        // Pas de message d'alerte tant que le vendeur n'a rien connecté :
        // la carte affiche déjà le bouton de connexion.
        this.paypalBlockMessage = res.merchantId ? res.blockMessage : null;
      } catch {
        this.paypalConnected = false;
        this.paypalEmail = null;
        this.paypalLegalName = null;
        this.paypalMerchantId = null;
        this.paypalScopes = [];
        this.paypalBlockReason = null;
        this.paypalBlockMessage = null;
      }
    },
    /**
     * Réinterroge PayPal — le vendeur vient typiquement de confirmer son email
     * ou de lever une restriction sur paypal.com.
     */
    async refreshPaypalStatus() {
      this.paypalRefreshing = true;
      try {
        await this.loadPaypalStatus(true);
        if (this.paypalConnected) {
          (this as any).$func.showToastSuccess('Votre compte PayPal est prêt à recevoir des paiements.');
        }
      } finally {
        this.paypalRefreshing = false;
      }
    },
    /**
     * Avant de rediriger vers PayPal, on ouvre un popup pour confirmer /
     * compléter le nom légal et l'adresse : ces champs pré-remplissent le
     * parcours PayPal et évitent qu'un doublon de compte soit créé.
     */
    connectPaypal() {
      this.paypalInfoError = '';
      this.paypalInfoModal.open = true;
    },
    closePaypalInfoModal() {
      if (this.paypalConnecting) return;
      this.paypalInfoModal.open = false;
      this.paypalInfoError = '';
    },
    async submitPaypalInfoAndConnect() {
      if (!this.legalName || this.legalName.trim().length < 2) {
        this.paypalInfoError = 'Merci d\'indiquer votre nom légal complet.';
        return;
      }
      if (!this.addressStreetLine1 || !this.addressPostalCode || !this.addressCity) {
        this.paypalInfoError = 'Adresse incomplète : rue, code postal et ville sont requis.';
        return;
      }
      this.paypalInfoError = '';
      this.paypalConnecting = true;

      const sessionToken = Cookies.get('sessionToken');
      const address = {
        streetLine1: this.addressStreetLine1,
        streetLine2: this.addressStreetLine2 || undefined,
        postalCode: this.addressPostalCode,
        city: this.addressCity,
        country: this.addressCountry || 'FR'
      };
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          legalName: this.legalName,
          address
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
        this.userProfile.legalName = this.legalName;
        this.userProfile.address = address;
      } catch (e: any) {
        this.paypalConnecting = false;
        this.paypalInfoError = e.response?.data?.message || 'Impossible d\'enregistrer vos informations. Réessayez.';
        return;
      }

      try {
        const res = await paymentService.getPayPalOnboardingLink();
        if (res.actionUrl) {
          window.location.href = res.actionUrl;
        } else {
          this.paypalConnecting = false;
          this.paypalInfoError = 'Impossible de générer le lien d\'inscription PayPal.';
        }
      } catch (e: any) {
        this.paypalConnecting = false;
        this.paypalInfoError = e.response?.data?.message || 'Impossible de générer le lien d\'inscription PayPal.';
      }
    },
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
    async openIdentityVerification() {
      const sessionToken = Cookies.get('sessionToken');
      this.showIdentityForm = true;

      try {
        const statusRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/verification/identity/status/`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        this.identityVerification = statusRes.data;
      } catch (e: any) {
        // 404 = aucune demande en cours, c'est le cas normal d'un premier dépôt.
        if (e.response?.status === 404) {
          this.identityVerification = null;
          return;
        }
        if (e.response?.data?.code === 'TOKEN_EXPIRED') {
          authentificationService.verifSession();
          return;
        }
        this.$func.showToastError(
          e.response?.data?.message || 'Impossible de charger votre statut de vérification.'
        );
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
      if (!confirm('Déconnecter votre compte PayPal vous empêchera de proposer des services et produits PayPal sur MyKpopTrade. Voulez-vous continuer ?')) return;
      try {
        const res = await paymentService.disconnectPayPal();
        (this as any).$func.showToastSuccess(res.message || 'Compte PayPal déconnecté');
        await this.loadPaypalStatus();
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur');
      }
    },
    formatDate(iso: string) {
      const date = new Date(iso);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    },
  }
});
</script>

<style lang="scss" scoped>
@use '../../css/settings.scss' as *;
</style>
