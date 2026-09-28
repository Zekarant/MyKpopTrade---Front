<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-credit-card"></i> Recevoir mes paiements</h3>
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
          <span v-if="paypal.connected" class="setting-badge setting-badge--success">
            <i class="bi bi-check-circle-fill"></i> Connecté
          </span>
          <span v-else class="setting-badge setting-badge--warning">
            <i class="bi bi-exclamation-circle"></i> Non connecté
          </span>
        </div>

        <p v-if="paypal.email || paypal.legalName" class="paypal-card__meta">
          <i class="bi bi-envelope-check"></i>
          Lié à <strong>{{ paypal.email || paypal.legalName }}</strong>
        </p>

        <p v-if="paypal.merchantId" class="paypal-card__meta">
          <i class="bi bi-hash"></i>
          Identifiant PayPal : <strong>{{ paypal.merchantId }}</strong>
        </p>

        <p v-if="paypal.connected && paypal.scopes.length" class="paypal-card__meta">
          <i class="bi bi-shield-check"></i>
          Autorisations accordées à MyKpopTrade :
          <strong>{{ paypalScopeLabels }}</strong>
        </p>

        <!-- Vendeur relié mais bloqué : on affiche l'action exacte à mener. -->
        <p v-if="paypal.blockMessage" class="paypal-card__hint">
          {{ paypal.blockMessage }}
        </p>

        <div class="paypal-card__actions">
          <button
            v-if="!paypal.merchantId || paypal.blockReason === 'CONSENT_MISSING'"
            @click="connectPaypal"
            :disabled="paypalConnecting"
            class="btn-settings btn-settings--primary"
          >
            <i class="bi bi-paypal"></i>
            {{ paypalConnecting ? 'Redirection...' : (paypal.merchantId ? 'Relancer la connexion PayPal' : 'Connecter mon compte PayPal') }}
          </button>

          <button
            v-if="paypal.merchantId && paypal.blockReason && paypal.blockReason !== 'CONSENT_MISSING'"
            @click="refreshPaypalStatus"
            :disabled="paypalRefreshing"
            class="btn-settings btn-settings--primary"
          >
            <i class="bi bi-arrow-clockwise"></i>
            {{ paypalRefreshing ? 'Vérification...' : 'Rafraîchir mon statut' }}
          </button>

          <button
            v-if="paypal.merchantId"
            @click="disconnectPaypal"
            class="btn-settings btn-settings--danger"
          >
            <i class="bi bi-x-circle"></i> Déconnecter
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Billing info (pré-remplissage PayPal) -->
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-receipt"></i> Informations de facturation</h3>
    <div class="settings-card__body">
      <p class="settings-card__intro">
        Utilisées uniquement pour pré-remplir votre inscription PayPal. Jamais affichées
        publiquement.
      </p>
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
        <input type="text" v-model="address.streetLine1" maxlength="200" class="settings-input" placeholder="Rue et numéro" style="margin-top: 8px;" />
        <input type="text" v-model="address.streetLine2" maxlength="200" class="settings-input" placeholder="Complément (optionnel)" />
        <div class="setting-row__inline" style="margin-top: 0;">
          <input type="text" v-model="address.postalCode" maxlength="16" class="settings-input settings-input--sm" placeholder="Code postal" />
          <input type="text" v-model="address.city" maxlength="100" class="settings-input settings-input--sm" placeholder="Ville" />
          <input type="text" v-model="address.country" maxlength="2" class="settings-input settings-input--sm" placeholder="FR" style="flex: 0 0 70px;" />
        </div>
        <button @click="saveAddress" class="btn-settings btn-settings--sm" v-if="addressChanged" style="align-self: flex-start; margin-top: 8px;">Enregistrer</button>
      </div>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-clock-history"></i> Historique</h3>
    <div class="settings-card__body">
      <router-link to="/adherents/payments" class="setting-row setting-row--clickable">
        <div class="setting-row__left">
          <i class="bi bi-receipt-cutoff"></i>
          <span>Mes paiements et versements</span>
        </div>
        <i class="bi bi-chevron-right"></i>
      </router-link>
      <router-link to="/disputes" class="setting-row setting-row--clickable">
        <div class="setting-row__left">
          <i class="bi bi-shield-exclamation"></i>
          <span>Mes litiges</span>
        </div>
        <i class="bi bi-chevron-right"></i>
      </router-link>
    </div>
  </section>

  <!-- Popup de pré-remplissage PayPal : on confirme l'identité du vendeur
       avant de générer le lien d'onboarding, pour que PayPal réconcilie
       un compte existant plutôt que d'en créer un doublon. -->
  <div v-if="paypalInfoModalOpen" class="modal-overlay" @click.self="closePaypalInfoModal">
    <div class="modal-card">
      <h2>Vérifiez vos informations</h2>

      <label>E-mail</label>
      <input type="email" :value="profile.email" disabled />

      <label>Nom légal complet</label>
      <input
        type="text"
        v-model.trim="legalName"
        maxlength="300"
        placeholder="Prénom et nom"
      />

      <label>Adresse</label>
      <input type="text" v-model.trim="address.streetLine1" maxlength="200" placeholder="Rue et numéro" />
      <input type="text" v-model.trim="address.streetLine2" maxlength="200" placeholder="Complément (optionnel)" />
      <div class="modal-inline">
        <input type="text" v-model.trim="address.postalCode" maxlength="16" placeholder="Code postal" />
        <input type="text" v-model.trim="address.city" maxlength="100" placeholder="Ville" />
        <input type="text" v-model.trim="address.country" maxlength="2" placeholder="FR" style="flex: 0 0 70px;" />
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
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { func } from '@/function';
import paymentService from '@/services/payment.service';
import { api, apiMessage } from './shared';
import type { BillingAddress, SectionProps, SettingsProfile } from './shared';
import type { PaypalAccount } from './usePaypalAccount';

const props = defineProps<SectionProps & { paypal: PaypalAccount }>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

/** Champs saisis : tous des chaînes, contrairement à l'adresse enregistrée. */
type AddressForm = Required<BillingAddress>;

function addressFrom(profile: SettingsProfile): AddressForm {
  const saved = profile.address;
  return {
    streetLine1: saved?.streetLine1 || '',
    streetLine2: saved?.streetLine2 || '',
    postalCode: saved?.postalCode || '',
    city: saved?.city || '',
    country: saved?.country || 'FR'
  };
}

const legalName = ref(props.profile.legalName || '');
const address = ref<AddressForm>(addressFrom(props.profile));

// Profil rechargé : les champs repartent des valeurs enregistrées.
watch(() => props.profile, (profile) => {
  legalName.value = profile.legalName || '';
  address.value = addressFrom(profile);
});

const legalNameChanged = computed(() => legalName.value !== (props.profile.legalName || ''));

const addressChanged = computed(() => {
  const saved = addressFrom(props.profile);
  const current = address.value;
  return (
    current.streetLine1 !== saved.streetLine1 ||
    current.streetLine2 !== saved.streetLine2 ||
    current.postalCode !== saved.postalCode ||
    current.city !== saved.city ||
    current.country !== saved.country
  );
});

/** Adresse au format de l'API : complément omis s'il est vide. */
function addressPayload(): BillingAddress {
  const current = address.value;
  return {
    streetLine1: current.streetLine1,
    streetLine2: current.streetLine2 || undefined,
    postalCode: current.postalCode,
    city: current.city,
    country: current.country || 'FR'
  };
}

async function saveLegalName() {
  try {
    await api.put('/api/auth/profile', { legalName: legalName.value });
    func.showToastSuccess('Nom légal enregistré');
    emit('patch', { legalName: legalName.value });
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

async function saveAddress() {
  const current = address.value;
  const hasAny = current.streetLine1 || current.streetLine2 || current.postalCode || current.city;
  const hasRequired = current.streetLine1 && current.postalCode && current.city;
  if (hasAny && !hasRequired) {
    func.showToastError('Adresse incomplète : rue, code postal et ville sont requis');
    return;
  }
  const payload = hasRequired ? addressPayload() : null;
  try {
    await api.put('/api/auth/profile', { address: payload });
    func.showToastSuccess('Adresse enregistrée');
    emit('patch', { address: payload });
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}

// --- PayPal ---

const paypalConnecting = ref(false);
const paypalRefreshing = ref(false);
const paypalInfoModalOpen = ref(false);
const paypalInfoError = ref('');

/** Traduit les scopes PayPal en libellés lisibles par le vendeur. */
const paypalScopeLabels = computed(() => {
  const labels: Record<string, string> = {
    'https://uri.paypal.com/services/payments/realtimepayment': 'encaissement',
    'https://uri.paypal.com/services/payments/payment/authcapture': 'capture',
    'https://uri.paypal.com/services/payments/refund': 'remboursement',
    'https://uri.paypal.com/services/payments/partnerfee': 'commission plateforme'
  };
  const readable = props.paypal.scopes
    .map((scope) => labels[scope])
    .filter(Boolean);
  return readable.length ? readable.join(', ') : `${props.paypal.scopes.length} autorisation(s)`;
});

/**
 * Réinterroge PayPal — le vendeur vient typiquement de confirmer son email
 * ou de lever une restriction sur paypal.com.
 */
async function refreshPaypalStatus() {
  paypalRefreshing.value = true;
  try {
    await props.paypal.load(true);
    if (props.paypal.connected) {
      func.showToastSuccess('Votre compte PayPal est prêt à recevoir des paiements.');
    }
  } finally {
    paypalRefreshing.value = false;
  }
}

/**
 * Avant de rediriger vers PayPal, on ouvre un popup pour confirmer /
 * compléter le nom légal et l'adresse : ces champs pré-remplissent le
 * parcours PayPal et évitent qu'un doublon de compte soit créé.
 */
function connectPaypal() {
  paypalInfoError.value = '';
  paypalInfoModalOpen.value = true;
}

function closePaypalInfoModal() {
  if (paypalConnecting.value) return;
  paypalInfoModalOpen.value = false;
  paypalInfoError.value = '';
}

async function submitPaypalInfoAndConnect() {
  if (!legalName.value || legalName.value.trim().length < 2) {
    paypalInfoError.value = 'Merci d\'indiquer votre nom légal complet.';
    return;
  }
  const current = address.value;
  if (!current.streetLine1 || !current.postalCode || !current.city) {
    paypalInfoError.value = 'Adresse incomplète : rue, code postal et ville sont requis.';
    return;
  }
  paypalInfoError.value = '';
  paypalConnecting.value = true;

  const payload = addressPayload();
  try {
    await api.put('/api/auth/profile', { legalName: legalName.value, address: payload });
    emit('patch', { legalName: legalName.value, address: payload });
  } catch (error) {
    paypalConnecting.value = false;
    paypalInfoError.value = apiMessage(error, 'Impossible d\'enregistrer vos informations. Réessayez.');
    return;
  }

  try {
    const res = await paymentService.getPayPalOnboardingLink();
    if (res.actionUrl) {
      window.location.href = res.actionUrl;
    } else {
      paypalConnecting.value = false;
      paypalInfoError.value = 'Impossible de générer le lien d\'inscription PayPal.';
    }
  } catch (error) {
    paypalConnecting.value = false;
    paypalInfoError.value = apiMessage(error, 'Impossible de générer le lien d\'inscription PayPal.');
  }
}

async function disconnectPaypal() {
  if (!confirm('Déconnecter votre compte PayPal vous empêchera de proposer des services et produits PayPal sur MyKpopTrade. Voulez-vous continuer ?')) return;
  try {
    const res = await paymentService.disconnectPayPal();
    func.showToastSuccess(res.message || 'Compte PayPal déconnecté');
    await props.paypal.load();
  } catch (error) {
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}
</script>
