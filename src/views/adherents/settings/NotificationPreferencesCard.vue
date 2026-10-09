<template>
  <section class="settings-card" aria-labelledby="notification-preferences-title">
    <h3 id="notification-preferences-title" class="settings-card__title">
      <i class="bi bi-bell"></i> Notifications
    </h3>
    <div class="settings-card__body">
      <p class="settings-card__intro">
        Choisissez comment être prévenu(e). Les notifications restent toujours visibles dans l'application.
      </p>

      <p v-if="loading" class="notif-prefs__status" role="status">Chargement des préférences…</p>

      <div v-else-if="loadError" class="notif-prefs__status" role="alert">
        <span>Impossible de charger vos préférences de notification.</span>
        <button type="button" class="btn-settings btn-settings--ghost" @click="load">Réessayer</button>
      </div>

      <table v-else class="notif-prefs">
        <thead>
          <tr>
            <th scope="col">Catégorie</th>
            <th v-for="channel in CHANNELS" :key="channel.id" scope="col" class="notif-prefs__channel">
              {{ channel.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in CATEGORIES" :key="category.id">
            <th scope="row">
              <div class="notif-prefs__category">
                <span>{{ category.label }}</span>
                <small class="text-muted">{{ category.hint }}</small>
              </div>
            </th>
            <td v-for="channel in CHANNELS" :key="channel.id" class="notif-prefs__channel">
              <label class="toggle">
                <input
                  type="checkbox"
                  :aria-label="`${channel.label} — ${category.label}`"
                  :checked="preferences[category.id][channel.id]"
                  :disabled="saving"
                  @change="change(category.id, channel.id, $event)"
                />
                <span class="toggle__slider"></span>
              </label>
            </td>
          </tr>
          <tr>
            <th scope="row">
              <div class="notif-prefs__category">
                <span>Sécurité et compte</span>
                <small class="text-muted">Toujours envoyées : suspension, connexion PayPal, modération.</small>
              </div>
            </th>
            <td v-for="channel in CHANNELS" :key="channel.id" class="notif-prefs__channel">
              <label class="toggle">
                <input type="checkbox" checked disabled :aria-label="`${channel.label} — Sécurité et compte (toujours activé)`" />
                <span class="toggle__slider"></span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { func } from '@/function';
import { api, apiMessage, isSessionLost } from './shared';

type CategoryId = 'orders' | 'offers' | 'messages' | 'disputes' | 'reviews' | 'social';
type ChannelId = 'email' | 'push';
type NotificationPreferences = Record<CategoryId, Record<ChannelId, boolean>>;

const ENDPOINT = '/api/users/me/notification-preferences';

const CATEGORIES: { id: CategoryId; label: string; hint: string }[] = [
  { id: 'orders', label: 'Commandes', hint: 'Ventes, achats, expéditions et remboursements.' },
  { id: 'offers', label: 'Offres', hint: 'Offres reçues, acceptées, refusées ou contre-offres.' },
  { id: 'messages', label: 'Messages', hint: 'Nouveaux messages privés.' },
  { id: 'disputes', label: 'Litiges', hint: 'Ouverture, nouveaux messages et décision.' },
  { id: 'reviews', label: 'Avis', hint: 'Nouvelles évaluations reçues.' },
  { id: 'social', label: 'Communauté', hint: 'Nouveaux abonnés et alertes sur vos favoris.' }
];

const CHANNELS: { id: ChannelId; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push' }
];

const loading = ref(true);
const loadError = ref(false);
const saving = ref(false);
const preferences = ref<NotificationPreferences>({} as NotificationPreferences);

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    const { data } = await api.get<{ preferences: NotificationPreferences }>(ENDPOINT);
    preferences.value = data.preferences;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/**
 * Un seul interrupteur est envoyé : l'API fusionne, ce qui évite d'écraser un
 * réglage fait entre-temps dans un autre onglet. En cas d'échec, l'interrupteur
 * revient à l'état enregistré.
 */
async function change(category: CategoryId, channel: ChannelId, event: Event) {
  const input = event.target as HTMLInputElement;
  const checked = input.checked;
  saving.value = true;
  try {
    const { data } = await api.put<{ preferences: NotificationPreferences }>(ENDPOINT, {
      [category]: { [channel]: checked }
    });
    preferences.value = data.preferences;
    func.showToastSuccess('Préférences de notification enregistrées.');
  } catch (error) {
    input.checked = !checked;
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Impossible d\'enregistrer votre choix.'));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped lang="scss">
.notif-prefs {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    padding: var(--space-sm) 0;
    text-align: left;
    vertical-align: middle;
  }

  thead th {
    color: var(--text-muted);
    font-weight: 500;
  }

  tbody tr + tr {
    border-top: 1px solid var(--surface-border);
  }
}

.notif-prefs th[scope='row'] {
  font-weight: 400;
}

.notif-prefs__category {
  display: flex;
  flex-direction: column;
  color: var(--text-primary);

  small { font-size: var(--font-size-xs); }
}

.notif-prefs__channel {
  width: 64px;
  text-align: center !important;
}

.notif-prefs__status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

// L'input natif est masqué par .toggle : le focus clavier doit rester visible.
.toggle input:focus-visible + .toggle__slider {
  outline: 2px solid var(--accent-pink);
  outline-offset: 2px;
}

.toggle input:disabled + .toggle__slider {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
