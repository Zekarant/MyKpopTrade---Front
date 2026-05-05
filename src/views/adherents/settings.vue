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
              <div class="setting-row">
                <div class="setting-row__left">
                  <i class="bi bi-person-badge"></i>
                  <span>Identité vérifiée</span>
                </div>
                <span v-if="userProfile.isIdentityVerified" class="setting-badge setting-badge--success">
                  <i class="bi bi-check-circle-fill"></i> Vérifié
                </span>
                <span v-else class="setting-badge setting-badge--warning">Non vérifié</span>
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
                  Sans cette connexion, vous ne pourrez pas être payé pour vos ventes.
                </p>

                <!-- Manual email input -->
                <div v-if="!paypalConnected" class="paypal-card__email-form">
                  <div class="paypal-card__input-group">
                    <i class="bi bi-envelope"></i>
                    <input
                      v-model="paypalEmailInput"
                      type="email"
                      placeholder="votre-email@paypal.com"
                      class="paypal-card__input"
                    />
                  </div>
                  <button @click="connectPaypalByEmail" :disabled="!paypalEmailInput || paypalConnecting" class="btn-settings btn-settings--primary">
                    <i class="bi bi-link-45deg"></i> {{ paypalConnecting ? 'Connexion...' : 'Lier mon PayPal' }}
                  </button>
                </div>

                <div v-if="paypalConnected" class="paypal-card__actions">
                    <button @click="disconnectPaypal" class="btn-settings btn-settings--danger">
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
      paypalEmailInput: '',
      paypalConnecting: false,
      pendingDeletion: null as { scheduledFor: string } | null,
    };
  },
  async mounted() {
    await this.loadProfile();
    await this.loadPaypalStatus();
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
      try {
        const res = await paymentService.getPayPalConnectUrl();
        if (res.connectUrl) {
          window.location.href = res.connectUrl;
        }
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Impossible de générer l\'URL PayPal');
      }
    },
    async connectPaypalByEmail() {
      if (!this.paypalEmailInput) return;
      this.paypalConnecting = true;
      try {
        await paymentService.connectPayPalByEmail(this.paypalEmailInput.trim());
        (this as any).$func.showToastSuccess('Compte PayPal lié avec succès !');
        this.paypalConnected = true;
        this.paypalEmailInput = '';
      } catch (e: any) {
        (this as any).$func.showToastError(e.response?.data?.message || 'Erreur lors de la liaison');
      } finally {
        this.paypalConnecting = false;
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
