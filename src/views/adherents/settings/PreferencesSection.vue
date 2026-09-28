<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-sliders"></i> Préférences</h3>
    <div class="settings-card__body">
      <div class="setting-row">
        <div class="setting-row__left">
          <i class="bi bi-chat-dots"></i>
          <div class="setting-row__label-group">
            <span>Autoriser les messages directs</span>
            <small class="text-muted">
              Désactivé, seuls les acheteurs d'une de vos annonces peuvent vous écrire.
            </small>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" :checked="profile.preferences?.allowDirectMessages" @change="changeAllowDirectMessages" />
          <span class="toggle__slider"></span>
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { func } from '@/function';
import { api, apiMessage } from './shared';
import type { SectionProps, SettingsProfile } from './shared';

const props = defineProps<SectionProps>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

/** En cas d'échec, l'interrupteur revient à l'état enregistré. */
async function changeAllowDirectMessages(event: Event) {
  const input = event.target as HTMLInputElement;
  const checked = input.checked;
  try {
    await api.put('/api/auth/profile', { preferences: { allowDirectMessages: checked } });
    emit('patch', { preferences: { ...props.profile.preferences, allowDirectMessages: checked } });
  } catch (error) {
    input.checked = !checked;
    func.showToastError(apiMessage(error, 'Erreur'));
  }
}
</script>
