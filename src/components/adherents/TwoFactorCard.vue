<template>
  <section class="settings-card">
    <h3 class="settings-card__title">
      <i class="bi bi-shield-lock"></i> Double authentification
    </h3>

    <div class="settings-card__body">
      <!-- État actif -->
      <template v-if="status?.enabled && step === 'idle'">
        <div class="twofa-state twofa-state--on">
          <i class="bi bi-check-circle-fill"></i>
          <div>
            <strong>Activée</strong>
            <small v-if="status.enabledAt">depuis le {{ formatDate(status.enabledAt) }}</small>
          </div>
        </div>

        <p class="twofa-hint">
          Un code de votre application d'authentification est demandé à chaque connexion.
          Il vous reste
          <strong>{{ status.remainingRecoveryCodes }} code{{ status.remainingRecoveryCodes > 1 ? 's' : '' }} de secours</strong>.
        </p>

        <p v-if="status.remainingRecoveryCodes <= 2" class="twofa-warning">
          <i class="bi bi-exclamation-triangle"></i>
          Il vous reste peu de codes de secours. Régénérez-les pour ne pas perdre
          l'accès à votre compte.
        </p>

        <div class="twofa-actions">
          <button class="btn-settings btn-settings--sm" @click="step = 'regenerate'">
            <i class="bi bi-arrow-repeat"></i> Régénérer les codes de secours
          </button>
          <button class="btn-settings btn-settings--sm btn-settings--ghost" @click="step = 'disable'">
            <i class="bi bi-shield-slash"></i> Désactiver
          </button>
        </div>
      </template>

      <!-- État inactif -->
      <template v-else-if="!status?.enabled && step === 'idle'">
        <div class="twofa-state twofa-state--off">
          <i class="bi bi-shield-exclamation"></i>
          <div>
            <strong>Non activée</strong>
            <small>Votre compte est protégé par votre seul mot de passe</small>
          </div>
        </div>

        <p class="twofa-hint">
          Ajoutez un second facteur avec une application comme Google Authenticator,
          Authy ou le gestionnaire de mots de passe de votre choix. Gratuit, et
          fonctionne hors connexion.
        </p>

        <button
          class="btn-settings btn-settings--full"
          :disabled="loading"
          @click="beginSetup"
        >
          <i class="bi bi-shield-plus"></i>
          {{ loading ? 'Préparation…' : 'Activer la double authentification' }}
        </button>
      </template>

      <!-- Étape 1 : scan du QR code -->
      <template v-else-if="step === 'setup' && setup">
        <ol class="twofa-steps">
          <li>Ouvrez votre application d'authentification.</li>
          <li>Scannez ce QR code.</li>
          <li>Saisissez le code à 6 chiffres affiché.</li>
        </ol>

        <img :src="setup.qrCodeDataUrl" alt="QR code de configuration" class="twofa-qr" />

        <details class="twofa-manual">
          <summary>Impossible de scanner ?</summary>
          <p>Saisissez cette clé manuellement dans votre application :</p>
          <code class="twofa-secret">{{ setup.secret }}</code>
        </details>

        <div class="form-group">
          <label class="form-label" for="twofa-enable-code">Code de vérification</label>
          <input
            id="twofa-enable-code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            class="twofa-input"
          />
        </div>

        <div class="twofa-actions">
          <button class="btn-settings btn-settings--sm" :disabled="loading" @click="confirmSetup">
            {{ loading ? 'Vérification…' : 'Confirmer' }}
          </button>
          <button class="btn-settings btn-settings--sm btn-settings--ghost" @click="reset">
            Annuler
          </button>
        </div>
      </template>

      <!-- Étape 2 : codes de secours, affichés une seule fois -->
      <template v-else-if="step === 'codes'">
        <p class="twofa-warning">
          <i class="bi bi-exclamation-triangle"></i>
          <strong>Conservez ces codes maintenant.</strong> Ils ne seront plus affichés
          et chacun ne sert qu'une fois. Ils permettent de vous connecter si vous
          perdez votre téléphone.
        </p>

        <ul class="twofa-codes">
          <li v-for="recoveryCode in recoveryCodes" :key="recoveryCode">{{ recoveryCode }}</li>
        </ul>

        <div class="twofa-actions">
          <button class="btn-settings btn-settings--sm" @click="downloadCodes">
            <i class="bi bi-download"></i> Télécharger
          </button>
          <button class="btn-settings btn-settings--sm" @click="copyCodes">
            <i class="bi bi-clipboard"></i> Copier
          </button>
          <button class="btn-settings btn-settings--sm btn-settings--ghost" @click="finish">
            J'ai conservé mes codes
          </button>
        </div>
      </template>

      <!-- Désactivation -->
      <template v-else-if="step === 'disable'">
        <p class="twofa-hint">
          Pour désactiver, confirmez avec votre mot de passe et un code de
          vérification. Votre compte ne sera plus protégé que par son mot de passe.
        </p>

        <div class="form-group">
          <label class="form-label" for="twofa-disable-password">Mot de passe</label>
          <input
            id="twofa-disable-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="twofa-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="twofa-disable-code">Code ou code de secours</label>
          <input
            id="twofa-disable-code"
            v-model="code"
            type="text"
            autocomplete="one-time-code"
            placeholder="000000"
            class="twofa-input"
          />
        </div>

        <div class="twofa-actions">
          <button
            class="btn-settings btn-settings--sm btn-settings--danger"
            :disabled="loading"
            @click="confirmDisable"
          >
            {{ loading ? 'Désactivation…' : 'Désactiver' }}
          </button>
          <button class="btn-settings btn-settings--sm btn-settings--ghost" @click="reset">
            Annuler
          </button>
        </div>
      </template>

      <!-- Régénération -->
      <template v-else-if="step === 'regenerate'">
        <p class="twofa-hint">
          Confirmez avec un code de vérification. Vos anciens codes de secours
          seront immédiatement invalidés.
        </p>

        <div class="form-group">
          <label class="form-label" for="twofa-regen-code">Code de vérification</label>
          <input
            id="twofa-regen-code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            class="twofa-input"
          />
        </div>

        <div class="twofa-actions">
          <button class="btn-settings btn-settings--sm" :disabled="loading" @click="confirmRegenerate">
            {{ loading ? 'Génération…' : 'Régénérer' }}
          </button>
          <button class="btn-settings btn-settings--sm btn-settings--ghost" @click="reset">
            Annuler
          </button>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import twoFactorService, {
  type TwoFactorStatus,
  type TwoFactorSetup
} from '@/services/twoFactor.service';
import { func } from '@/function';

type Step = 'idle' | 'setup' | 'codes' | 'disable' | 'regenerate';

const status = ref<TwoFactorStatus | null>(null);
const setup = ref<TwoFactorSetup | null>(null);
const recoveryCodes = ref<string[]>([]);
const step = ref<Step>('idle');
const code = ref('');
const password = ref('');
const loading = ref(false);

onMounted(loadStatus);

async function loadStatus() {
  try {
    status.value = await twoFactorService.getStatus();
  } catch (error) {
    func.showToastError((error as Error).message);
  }
}

function reset() {
  step.value = 'idle';
  code.value = '';
  password.value = '';
  setup.value = null;
}

async function beginSetup() {
  loading.value = true;
  try {
    setup.value = await twoFactorService.startSetup();
    step.value = 'setup';
  } catch (error) {
    func.showToastError((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function confirmSetup() {
  if (!code.value.trim()) {
    func.showToastError('Saisissez le code affiché par votre application.');
    return;
  }

  loading.value = true;
  try {
    const result = await twoFactorService.enable(code.value.trim());
    recoveryCodes.value = result.recoveryCodes;
    code.value = '';
    step.value = 'codes';
    await loadStatus();
    func.showToastSuccess('Double authentification activée.');
  } catch (error) {
    func.showToastError((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function confirmDisable() {
  if (!password.value || !code.value.trim()) {
    func.showToastError('Le mot de passe et un code sont requis.');
    return;
  }

  loading.value = true;
  try {
    await twoFactorService.disable(password.value, code.value.trim());
    reset();
    await loadStatus();
    func.showToastSuccess('Double authentification désactivée.');
  } catch (error) {
    func.showToastError((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function confirmRegenerate() {
  if (!code.value.trim()) {
    func.showToastError('Saisissez un code de vérification.');
    return;
  }

  loading.value = true;
  try {
    const result = await twoFactorService.regenerateRecoveryCodes(code.value.trim());
    recoveryCodes.value = result.recoveryCodes;
    code.value = '';
    step.value = 'codes';
    await loadStatus();
  } catch (error) {
    func.showToastError((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function finish() {
  recoveryCodes.value = [];
  reset();
}

/** Contenu du fichier de sauvegarde des codes. */
function codesAsText(): string {
  return [
    'Codes de secours MyKpopTrade',
    'Chaque code ne peut servir qu\'une seule fois.',
    `Générés le ${new Date().toLocaleString('fr-FR')}`,
    '',
    ...recoveryCodes.value
  ].join('\n');
}

function downloadCodes() {
  const blob = new Blob([codesAsText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mykpoptrade-codes-de-secours.txt';
  link.click();
  URL.revokeObjectURL(url);
}

async function copyCodes() {
  try {
    await navigator.clipboard.writeText(codesAsText());
    func.showToastSuccess('Codes copiés dans le presse-papiers.');
  } catch {
    func.showToastError('Copie impossible. Utilisez le téléchargement.');
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
</script>

<style lang="scss" scoped>
@use '../../css/two-factor-card.scss' as *;
</style>
